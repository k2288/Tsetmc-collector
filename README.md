# TSETMC Collector - Phase 0

Production-grade market data acquisition infrastructure using NestJS for Tehran Stock Exchange data collection.

## Project Structure

```
src/
  providers/
    tsetmc/
    brsapi/
  market-data/
    dto/
    normalizers/
    entities/
    services/
  storage/
  common/
  config/
```

## Features in Phase 0

- Multi-provider abstraction (`MarketDataProvider`)
- TSETMC provider + BRS API stub provider
- Scheduled polling every 30 seconds (`@nestjs/schedule`)
- Retry with exponential backoff
- Structured logging with provider-level success/failure events
- Provider health state tracking
- Graceful per-provider failure handling (no global crash)
- UTC timestamp normalization
- Immutable raw payload archival to filesystem
- Normalized snapshot DTO generation
- Deduplication support using unique `deduplicationKey`
- PostgreSQL persistence for raw + normalized data

## Data Model

- `raw_payloads` table
  - stores immutable provider payloads
  - indexed by `(provider, receivedAt)`
- `normalized_snapshots` table
  - stores standardized market snapshots
  - indexed by `(provider, snapshotTimeUtc)`
  - unique `deduplicationKey`
  - FK to `raw_payloads`

## Raw Data Archival Layout

```
/raw-data
  /provider-name
    /YYYY-MM-DD
      HH-mm-ss.json
```

## Environment

Copy `.env.example` to `.env` and adjust values.

## Run with Docker

```bash
docker compose up --build
```

## Local Run

```bash
npm install
npm run start:dev
```

## TypeORM Notes

- TypeORM config: `src/config/typeorm.config.ts`
- `synchronize` is disabled for migration-ready production behavior.
- Generate migrations with:

```bash
npm run migration:generate
npm run migration:run
```
