import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { MarketDataProvider } from '../providers/market-data-provider.interface';
import { TseClientProvider } from '../providers/tse-client.provider';
import { StorageService } from '../storage/storage.service';
import { NormalizerService } from '../normalizer/normalizer.service';
import { DeduplicationService } from '../deduplication/deduplication.service';
import { PrismaService } from '../db/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { withRetry, withTimeout } from '../common/retry.util';

@Injectable()
export class CollectorService implements OnModuleInit {
  private providers: MarketDataProvider[];
  constructor(
    private readonly tseProvider: TseClientProvider,
    private readonly storage: StorageService,
    private readonly normalizer: NormalizerService,
    private readonly deduplicator: DeduplicationService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly metrics: MetricsService
  ) { this.providers = []; }

  onModuleInit() { this.providers = [this.tseProvider]; }

  @Cron(process.env.INGESTION_CRON ?? '*/10 * * * * *')
  async ingestCycle() {
    await Promise.all(this.providers.map((provider) => this.ingestProvider(provider)));
  }

  async ingestProvider(provider: MarketDataProvider) {
    const attempts = this.config.get<number>('providerRetryAttempts', 3);
    const timeout = this.config.get<number>('providerTimeoutMs', 5000);
    const baseDelay = this.config.get<number>('providerRetryBaseDelayMs', 200);
    try {
      const marketEnd = this.metrics.providerLatency.startTimer({ provider: provider.providerName, endpoint: 'marketWatch' });
      const market = await withRetry(() => withTimeout(provider.fetchMarketWatch(), timeout, 'marketwatch timeout'), attempts, baseDelay);
      marketEnd();
      await this.storage.archiveRawPayload(provider.providerName, 'marketWatch', market, createHash('sha256').update(JSON.stringify(market)).digest('hex'));
      const normalized = this.normalizer.normalizeMarket(market);
      for (const row of normalized) {
        const hash = this.deduplicator.buildIngestionHash(row.symbol, row.timestampUtc, row);
        await this.persistMarket(row, hash);
      }

      const clientEnd = this.metrics.providerLatency.startTimer({ provider: provider.providerName, endpoint: 'clientTypes' });
      const clientTypes = await withRetry(() => withTimeout(provider.fetchClientTypes(), timeout, 'clientTypes timeout'), attempts, baseDelay);
      clientEnd();
      await this.storage.archiveRawPayload(provider.providerName, 'clientTypes', clientTypes, createHash('sha256').update(JSON.stringify(clientTypes)).digest('hex'));
      const normalizedFlow = this.normalizer.normalizeMoneyFlow(clientTypes);
      for (const row of normalizedFlow) {
        const hash = this.deduplicator.buildIngestionHash(row.symbol, row.timestampUtc, row);
        await this.persistMoneyFlow(row, hash);
      }
      this.metrics.ingestionRuns.inc({ provider: provider.providerName, status: 'success' });
    } catch {
      this.metrics.ingestionFailures.inc({ provider: provider.providerName });
      this.metrics.ingestionRuns.inc({ provider: provider.providerName, status: 'failure' });
    }
  }

  private async persistMarket(row: any, ingestionHash: string) {
    const instrument = await this.prisma.instrument.upsert({ where: { tsetmcId: row.tsetmcId }, create: { tsetmcId: row.tsetmcId, symbol: row.symbol }, update: { symbol: row.symbol } });
    await this.prisma.marketSnapshot.upsert({
      where: { ingestionHash },
      create: { instrumentId: instrument.id, timestampUtc: row.timestampUtc, schemaVersion: this.config.get('schemaVersion'), pipelineVersion: this.config.get('pipelineVersion'), ingestionHash, openPrice: row.openPrice ?? Prisma.Decimal(0) },
      update: {}
    });
  }

  private async persistMoneyFlow(row: any, ingestionHash: string) {
    const instrument = await this.prisma.instrument.upsert({ where: { tsetmcId: row.tsetmcId }, create: { tsetmcId: row.tsetmcId, symbol: row.symbol }, update: { symbol: row.symbol } });
    await this.prisma.moneyFlowSnapshot.upsert({ where: { ingestionHash }, create: { instrumentId: instrument.id, timestampUtc: row.timestampUtc, schemaVersion: this.config.get('schemaVersion'), pipelineVersion: this.config.get('pipelineVersion'), ingestionHash }, update: {} });
  }
}
