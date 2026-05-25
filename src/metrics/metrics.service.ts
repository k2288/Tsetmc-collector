import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  readonly ingestionFailures: Counter<string>;
  readonly ingestionRuns: Counter<string>;
  readonly providerLatency: Histogram<string>;

  constructor() {
    collectDefaultMetrics({ register: this.registry });
    this.ingestionFailures = new Counter({ name: 'ingestion_failures_total', help: 'Ingestion failures', labelNames: ['provider'], registers: [this.registry] });
    this.ingestionRuns = new Counter({ name: 'ingestion_runs_total', help: 'Ingestion runs', labelNames: ['provider', 'status'], registers: [this.registry] });
    this.providerLatency = new Histogram({ name: 'provider_fetch_latency_ms', help: 'Provider fetch latency', labelNames: ['provider', 'endpoint'], buckets: [50, 100, 250, 500, 1000, 3000, 10000], registers: [this.registry] });
  }
}
