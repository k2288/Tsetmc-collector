# TSETMC Collector - Phase 2 (Data Integrity + Market Normalization)

Phase 2 extends the production ingestion stack with deterministic, replay-safe market integrity infrastructure.

## Updated Architecture

Provider -> Raw Archive -> Forward-Compatible Normalizer -> Validation Engine -> Anomaly Journal -> Deduplicator -> Persistence -> Canonical Timeline + Reprocessing.

## Phase 2 capabilities

- Rule-driven validation engine (`validity_state`, `quality_flags`, `validation_reason`).
- Corporate action infrastructure with versioned adjustment chain support.
- Instrument lifecycle state transition model and event journaling.
- Canonical market timeline with deterministic gap markers.
- Quantitative data quality scoring (`quality_score`, `provider_latency_ms`, `staleness_score`).
- Reprocessing engine for deterministic historical reconstruction.
- End-to-end lineage fields for raw-payload provenance.
- Anomaly events journal (never silent discard).
- Market calendar enriched for special sessions and abnormal conditions.
- Historical consistency validation hooks through stress tests.

## Schema additions

- `corporate_actions`
- `instrument_lifecycle_events`
- `anomaly_events`
- `canonical_market_timeline`
- validation + lineage columns on snapshot tables

## Stress tests

```bash
npm run test:stress
```

Includes malformed replay, lifecycle integrity, adjustment correctness, gap reconstruction, stale floods, and deterministic reprocessing.
