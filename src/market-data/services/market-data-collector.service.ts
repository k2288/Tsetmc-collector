import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TsetmcProvider } from '../../providers/tsetmc/tsetmc.provider';
import { BrsApiProvider } from '../../providers/brsapi/brsapi.provider';
import { MarketDataProvider, MarketSnapshotResponse } from '../../providers/market-data-provider.interface';
import { RetryService } from '../../common/retry.service';
import { ArchiveService } from '../../storage/archive.service';
import { SnapshotNormalizer } from '../normalizers/snapshot.normalizer';
import { RawPayload } from '../entities/raw-payload.entity';
import { NormalizedSnapshot } from '../entities/normalized-snapshot.entity';
import { HealthService } from './health.service';

@Injectable()
export class MarketDataCollectorService {
  private readonly logger = new Logger(MarketDataCollectorService.name);
  private readonly providers: MarketDataProvider[];

  constructor(
    private readonly tsetmcProvider: TsetmcProvider,
    private readonly brsApiProvider: BrsApiProvider,
    private readonly retryService: RetryService,
    private readonly archiveService: ArchiveService,
    private readonly normalizer: SnapshotNormalizer,
    private readonly healthService: HealthService,
    @InjectRepository(RawPayload) private readonly rawRepo: Repository<RawPayload>,
    @InjectRepository(NormalizedSnapshot) private readonly snapshotRepo: Repository<NormalizedSnapshot>
  ) {
    this.providers = [this.tsetmcProvider, this.brsApiProvider];
  }

  async getLiveSnapshot(): Promise<MarketSnapshotResponse> {
    try {
      return await this.retryService.withRetry(() => this.tsetmcProvider.fetchMarketSnapshot(), this.tsetmcProvider.providerName);
    } catch (tsetmcError) {
      const message = tsetmcError instanceof Error ? tsetmcError.message : String(tsetmcError);
      this.logger.warn(`TSETMC snapshot failed; falling back to BRSAPI: ${message}`);
      return this.retryService.withRetry(() => this.brsApiProvider.fetchMarketSnapshot(), this.brsApiProvider.providerName);
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async collect(): Promise<void> {
    for (const provider of this.providers) {
      const started = Date.now();
      const receivedAt = new Date();
      try {
        const payload = await this.retryService.withRetry(() => provider.fetchMarketSnapshot(), provider.providerName);
        const payloadRecord = payload as unknown as Record<string, unknown>;
        const path = await this.archiveService.archive(provider.providerName, payloadRecord, receivedAt);

        const raw = await this.rawRepo.save({
          provider: provider.providerName,
          receivedAt,
          filesystemPath: path,
          payload: payloadRecord
        });

        for (const instrument of payload.symbols) {
          const dto = this.normalizer.normalizeInstrument(provider.providerName, instrument, payload.fetchedAt);
          await this.snapshotRepo.upsert(
            ({
              provider: dto.provider,
              symbol: dto.symbol,
              lastPrice: dto.lastPrice.toString(),
              volume: dto.volume.toString(),
              tradeCount: dto.tradeCount,
              snapshotTimeUtc: new Date(dto.snapshotTimeUtc),
              deduplicationKey: dto.deduplicationKey,
              rawPayload: { id: raw.id } as RawPayload
            } as any),
            ['deduplicationKey']
          );
        }

        const latency = Date.now() - started;
        this.healthService.update({ provider: provider.providerName, success: true, latencyMs: latency, lastRunAtUtc: new Date().toISOString() });
        this.logger.log(JSON.stringify({ event: 'provider_collect_success', provider: provider.providerName, latencyMs: latency, symbols: payload.symbols.length }));
      } catch (error) {
        const latency = Date.now() - started;
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.healthService.update({ provider: provider.providerName, success: false, latencyMs: latency, lastRunAtUtc: new Date().toISOString(), error: message });
        this.logger.error(JSON.stringify({ event: 'provider_collect_failure', provider: provider.providerName, latencyMs: latency, error: message }));
      }
    }
  }
}
