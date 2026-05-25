# TSETMC Collector - Phase 1

Production-grade market data infrastructure for Tehran Stock Exchange ingestion.

## Architecture
Provider -> Raw Archive -> Normalizer -> Validator (implicit in normalizer) -> Deduplicator -> Persistence.

## Key properties
- Provider abstraction (`MarketDataProvider`)
- Immutable raw payload archive
- Replay-safe normalized snapshots
- SHA256 ingestion deduplication
- Observability via `/health` and `/metrics`
- Retry with exponential backoff + timeout guards

## Run
```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run build
npm start
```

## Docker
```bash
docker compose up --build
```

## Stress Tests
Run:
```bash
npm run test:stress
```
Scenarios included: duplicate storms, out-of-order timestamps, provider partial failure, corrupted payloads, DB slowness, burst traffic, provider timeout.
