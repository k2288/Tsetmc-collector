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
import { CircuitBreaker } from '../common/circuit-breaker';

type QueueJob = () => Promise<void>;

@Injectable()
export class CollectorService implements OnModuleInit {
  private providers: MarketDataProvider[];
  private readonly providerBreakers = new Map<string, CircuitBreaker>();
  private readonly queues = new Map<string, QueueJob[]>();
  private sequence = 0n;

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
  async ingestCycle() { await Promise.all(this.providers.map((provider) => this.ingestProvider(provider))); }

  async ingestProvider(provider: MarketDataProvider) {
    const breaker = this.providerBreakers.get(provider.providerName) ?? new CircuitBreaker(3, 30_000);
    this.providerBreakers.set(provider.providerName, breaker);
    if (!breaker.canExecute()) {
      this.metrics.providerHealthState.set({ provider: provider.providerName }, 1);
      this.metrics.circuitState.set({ provider: provider.providerName }, 2);
      return;
    }

    const attempts = this.config.get<number>('providerRetryAttempts', 3);
    const timeout = this.config.get<number>('providerTimeoutMs', 5000);
    const baseDelay = this.config.get<number>('providerRetryBaseDelayMs', 200);
    try {
      const market = await withRetry(() => withTimeout(provider.fetchMarketWatch(), timeout, 'marketwatch timeout'), attempts, baseDelay);
      const marketRaw = await this.storage.archiveRawPayload(provider.providerName, 'marketWatch', market, createHash('sha256').update(JSON.stringify(market)).digest('hex'));
      this.enqueue(provider.providerName, async () => {
        try {
          const normalized = this.normalizer.normalizeMarket(market, provider.providerVersion);
          for (const row of normalized) {
            const hash = this.deduplicator.buildIngestionHash(row.symbol, row.timestampUtc, row);
            await this.persistMarket(provider.providerName, row, hash);
          }
        } catch (e) { await this.storage.quarantineFailure(marketRaw.id, provider.providerName, 'normalize_market', 'normalization_failure', market, e); }
      });

      const flow = await withRetry(() => withTimeout(provider.fetchClientTypes(), timeout, 'clientTypes timeout'), attempts, baseDelay);
      const flowRaw = await this.storage.archiveRawPayload(provider.providerName, 'clientTypes', flow, createHash('sha256').update(JSON.stringify(flow)).digest('hex'));
      this.enqueue(provider.providerName, async () => {
        try {
          const normalizedFlow = this.normalizer.normalizeMoneyFlow(flow, provider.providerVersion);
          for (const row of normalizedFlow) {
            const hash = this.deduplicator.buildIngestionHash(row.symbol, row.timestampUtc, row);
            await this.persistMoneyFlow(provider.providerName, row, hash);
          }
        } catch (e) { await this.storage.quarantineFailure(flowRaw.id, provider.providerName, 'normalize_flow', 'normalization_failure', flow, e); }
      });
      breaker.recordSuccess();
      this.metrics.providerHealthState.set({ provider: provider.providerName }, 2);
      this.metrics.circuitState.set({ provider: provider.providerName }, 0);
      this.metrics.ingestionRuns.inc({ provider: provider.providerName, status: 'success' });
    } catch {
      breaker.recordFailure();
      this.metrics.ingestionFailures.inc({ provider: provider.providerName });
      this.metrics.ingestionRuns.inc({ provider: provider.providerName, status: 'failure' });
      this.metrics.providerHealthState.set({ provider: provider.providerName }, 1);
      this.metrics.circuitState.set({ provider: provider.providerName }, 2);
    }

    await this.drainQueue(provider.providerName);
  }

  private enqueue(providerName: string, job: QueueJob) {
    const max = this.config.get<number>('ingestionQueueMaxSize', 2000);
    const q = this.queues.get(providerName) ?? [];
    if (q.length >= max) {
      this.metrics.overloadCounter.inc({ provider: providerName, policy: 'normalize_drop_keep_raw' });
      return;
    }
    q.push(job);
    this.queues.set(providerName, q);
    this.metrics.queueDepth.set({ provider: providerName }, q.length);
  }

  private async drainQueue(providerName: string) {
    const q = this.queues.get(providerName) ?? [];
    while (q.length) await q.shift()?.();
    this.metrics.queueDepth.set({ provider: providerName }, 0);
  }

  private nextSequence(): bigint { this.sequence += 1n; return this.sequence; }

  private async persistMarket(providerName: string, row: any, ingestionHash: string) {
    const instrument = await this.prisma.instrument.upsert({ where: { tsetmcId: row.tsetmcId }, create: { tsetmcId: row.tsetmcId, symbol: row.symbol }, update: { symbol: row.symbol } });
    await this.prisma.marketSnapshot.upsert({
      where: { ingestionHash },
      create: { instrumentId: instrument.id, timestampUtc: row.timestampUtc, providerTimestampUtc: row.providerTimestampUtc, ingestedAtUtc: new Date(), providerVersion: row.providerVersion, normalizerVersion: row.normalizerVersion, qualityScore: row.qualityScore, qualityFlags: row.qualityFlags, ingestionSequence: this.nextSequence(), schemaVersion: this.config.get('schemaVersion'), pipelineVersion: this.config.get('pipelineVersion'), ingestionHash, openPrice: row.openPrice ?? Prisma.Decimal(0) },
      update: {}
    }).catch(() => this.metrics.dedupHitRate.inc({ provider: providerName, stream: 'market' }));
  }

  private async persistMoneyFlow(providerName: string, row: any, ingestionHash: string) {
    const instrument = await this.prisma.instrument.upsert({ where: { tsetmcId: row.tsetmcId }, create: { tsetmcId: row.tsetmcId, symbol: row.symbol }, update: { symbol: row.symbol } });
    await this.prisma.moneyFlowSnapshot.upsert({ where: { ingestionHash }, create: { instrumentId: instrument.id, timestampUtc: row.timestampUtc, providerTimestampUtc: row.providerTimestampUtc, ingestedAtUtc: new Date(), providerVersion: row.providerVersion, normalizerVersion: row.normalizerVersion, qualityScore: row.qualityScore, qualityFlags: row.qualityFlags, ingestionSequence: this.nextSequence(), schemaVersion: this.config.get('schemaVersion'), pipelineVersion: this.config.get('pipelineVersion'), ingestionHash }, update: {} }).catch(() => this.metrics.dedupHitRate.inc({ provider: providerName, stream: 'money_flow' }));
  }
}
