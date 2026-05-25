import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  readonly ingestionFailures: Counter<string>;
  readonly ingestionRuns: Counter<string>;
  readonly providerLatency: Histogram<string>;
  readonly providerHealthState: Gauge<string>;
  readonly queueDepth: Gauge<string>;
  readonly ingestionLagMs: Histogram<string>;
  readonly deadLetterCounter: Counter<string>;
  readonly circuitState: Gauge<string>;
  readonly dedupHitRate: Counter<string>;
  readonly replayOrderingGap: Counter<string>;
  readonly overloadCounter: Counter<string>;

  constructor() {
    collectDefaultMetrics({ register: this.registry });
    this.ingestionFailures = new Counter({ name: 'ingestion_failures_total', help: 'Ingestion failures', labelNames: ['provider'], registers: [this.registry] });
    this.ingestionRuns = new Counter({ name: 'ingestion_runs_total', help: 'Ingestion runs', labelNames: ['provider', 'status'], registers: [this.registry] });
    this.providerLatency = new Histogram({ name: 'provider_fetch_latency_ms', help: 'Provider fetch latency', labelNames: ['provider', 'endpoint'], buckets: [50, 100, 250, 500, 1000, 3000, 10000], registers: [this.registry] });
    this.providerHealthState = new Gauge({ name: 'provider_health_state', help: '0=down,1=degraded,2=healthy', labelNames: ['provider'], registers: [this.registry] });
    this.queueDepth = new Gauge({ name: 'ingestion_queue_depth', help: 'Queue depth', labelNames: ['provider'], registers: [this.registry] });
    this.ingestionLagMs = new Histogram({ name: 'ingestion_lag_ms', help: 'Ingestion lag in ms', labelNames: ['provider'], buckets: [100, 250, 1000, 5000, 20000], registers: [this.registry] });
    this.deadLetterCounter = new Counter({ name: 'dead_letter_payload_total', help: 'Dead letter payloads', labelNames: ['provider', 'stage'], registers: [this.registry] });
    this.circuitState = new Gauge({ name: 'provider_circuit_state', help: '0=closed,1=half_open,2=open', labelNames: ['provider'], registers: [this.registry] });
    this.dedupHitRate = new Counter({ name: 'deduplication_hits_total', help: 'Deduplication hits', labelNames: ['provider', 'stream'], registers: [this.registry] });
    this.replayOrderingGap = new Counter({ name: 'replay_ordering_gap_total', help: 'Sequence gaps', labelNames: ['provider'], registers: [this.registry] });
    this.overloadCounter = new Counter({ name: 'load_shedding_total', help: 'Overload count', labelNames: ['provider', 'policy'], registers: [this.registry] });
  }
}
