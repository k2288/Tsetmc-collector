import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RetryService } from '../../common/retry.service';
import { MarketSnapshotEntity } from '../entities/market-snapshot.entity';
import { RawProviderPayloadEntity } from '../entities/raw-provider-payload.entity';
import { MarketDataNormalizer } from '../normalizers/market-data-normalizer';
import {
  MARKET_DATA_PROVIDERS,
  MarketDataProvider,
} from '../../providers/market-data-provider.interface';
import { RedisService } from '../../storage/redis.service';
import { ProviderHealthService } from './provider-health.service';
import { RawPayloadArchiveService } from './raw-payload-archive.service';

@Injectable()
export class MarketDataCollectionService {
  private readonly logger = new Logger(MarketDataCollectionService.name);
  private collectionInProgress = false;

  constructor(
    @Inject(MARKET_DATA_PROVIDERS)
    private readonly providers: MarketDataProvider[],
    @InjectRepository(RawProviderPayloadEntity)
    private readonly rawPayloadRepository: Repository<RawProviderPayloadEntity>,
    @InjectRepository(MarketSnapshotEntity)
    private readonly marketSnapshotRepository: Repository<MarketSnapshotEntity>,
    private readonly retryService: RetryService,
    private readonly normalizer: MarketDataNormalizer,
    private readonly rawPayloadArchiveService: RawPayloadArchiveService,
    private readonly providerHealthService: ProviderHealthService,
    private readonly redisService: RedisService,
  ) {}

  async collectAllProviders(): Promise<void> {
    if (this.collectionInProgress) {
      this.logger.warn(
        JSON.stringify({
          event: 'collection_skipped',
          reason: 'previous_run_active',
        }),
      );
      return;
    }

    this.collectionInProgress = true;
    try {
      await Promise.allSettled(
        this.providers.map((provider) => this.collectProvider(provider)),
      );
    } finally {
      this.collectionInProgress = false;
    }
  }

  private async collectProvider(provider: MarketDataProvider): Promise<void> {
    const capturedAt = new Date();
    try {
      const rawPayload = await this.retryService.execute(
        `fetchMarketSnapshot:${provider.name}`,
        () => provider.fetchMarketSnapshot(),
      );

      const archivedPayload = await this.rawPayloadArchiveService.archive(
        provider.name,
        capturedAt,
        rawPayload,
      );

      const rawEntity = await this.rawPayloadRepository.save({
        providerName: provider.name,
        capturedAt,
        archivePath: archivedPayload.archivePath,
        contentHash: archivedPayload.contentHash,
        payload: rawPayload,
        responseMetadata: this.extractResponseMetadata(rawPayload),
      });

      const normalized = this.normalizer.normalize(
        provider.name,
        rawPayload,
        capturedAt,
      );
      const uniqueSnapshots = [] as MarketSnapshotEntity[];

      for (const snapshot of normalized) {
        const alreadySeen = await this.isDuplicate(snapshot.dedupeKey);
        if (!alreadySeen) {
          uniqueSnapshots.push(
            this.marketSnapshotRepository.create({
              providerName: snapshot.providerName,
              symbol: snapshot.symbol,
              instrumentId: snapshot.instrumentId,
              isin: snapshot.isin,
              name: snapshot.name,
              lastPrice: this.toNumericString(snapshot.lastPrice),
              closingPrice: this.toNumericString(snapshot.closingPrice),
              openingPrice: this.toNumericString(snapshot.openingPrice),
              highPrice: this.toNumericString(snapshot.highPrice),
              lowPrice: this.toNumericString(snapshot.lowPrice),
              tradeVolume: this.toIntegerString(snapshot.tradeVolume),
              tradeValue: this.toNumericString(snapshot.tradeValue),
              tradeCount: snapshot.tradeCount,
              sourceTimestamp: snapshot.sourceTimestamp,
              capturedAt: snapshot.capturedAt,
              tradingDate: snapshot.tradingDate,
              dedupeKey: snapshot.dedupeKey,
              metadata: snapshot.metadata,
              rawPayloadData: snapshot.metadata,
              rawPayload: rawEntity,
            }),
          );
        }
      }

      if (uniqueSnapshots.length > 0) {
        await this.marketSnapshotRepository
          .createQueryBuilder()
          .insert()
          .into(MarketSnapshotEntity)
          .values(uniqueSnapshots as never)
          .orIgnore()
          .execute();
      }

      this.providerHealthService.markSuccess(provider.name);
      this.logger.log(
        JSON.stringify({
          event: 'collection_completed',
          provider: provider.name,
          capturedAt: capturedAt.toISOString(),
          rawPayloadId: rawEntity.id,
          normalizedCount: normalized.length,
          insertedCount: uniqueSnapshots.length,
        }),
      );
    } catch (error) {
      this.providerHealthService.markFailure(provider.name, error);
      this.logger.error(
        JSON.stringify({
          event: 'collection_failed',
          provider: provider.name,
          capturedAt: capturedAt.toISOString(),
          error: error instanceof Error ? error.message : String(error),
        }),
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private extractResponseMetadata(
    rawPayload: unknown,
  ): Record<string, unknown> | undefined {
    if (
      typeof rawPayload !== 'object' ||
      rawPayload === null ||
      Array.isArray(rawPayload)
    ) {
      return undefined;
    }
    const record = rawPayload as Record<string, unknown>;
    return {
      status: record.status,
      receivedAt: record.receivedAt,
      headers: record.headers,
    };
  }

  private async isDuplicate(dedupeKey: string): Promise<boolean> {
    try {
      if (this.redisService.client.status === 'wait') {
        await this.redisService.client.connect();
      }
      const inserted = await this.redisService.client.set(
        `dedupe:${dedupeKey}`,
        '1',
        'EX',
        60 * 60 * 24 * 7,
        'NX',
      );
      return inserted !== 'OK';
    } catch (error) {
      this.logger.warn(
        JSON.stringify({
          event: 'redis_dedupe_unavailable',
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return false;
    }
  }

  private toNumericString(value: number | undefined): string | undefined {
    return value === undefined ? undefined : String(value);
  }

  private toIntegerString(value: number | undefined): string | undefined {
    return value === undefined ? undefined : String(Math.trunc(value));
  }
}
