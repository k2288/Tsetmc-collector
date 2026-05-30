# TSETMC Collector — Phase 0

Production-oriented NestJS infrastructure for provider-based Tehran Stock Exchange market data acquisition.

Phase 0 intentionally focuses only on data ingestion infrastructure. It does **not** implement strategies, indicators, machine learning, dashboards, or broker execution.

## Project structure

```text
src/
  common/                    # Cross-cutting utilities such as retry/backoff
  config/                    # Environment and TypeORM configuration
  providers/
    brsapi/                  # BRS API provider implementation (disabled by default)
    tsetmc/                  # TSETMC provider implementation
  market-data/
    dto/                     # Normalized DTO contracts
    entities/                # PostgreSQL entities for raw and normalized data
    normalizers/             # Provider-specific normalization
    services/                # Scheduler, collection, health, archival services
  storage/                   # Redis integration
```

## What it does

- Polls enabled market data providers every 30 seconds with `@nestjs/schedule`.
- Fetches TSETMC market watch data through a provider abstraction.
- Includes a BRS API provider that can be enabled with an API key.
- Retries provider requests with exponential backoff.
- Logs structured JSON events through NestJS logging.
- Tracks provider health in memory for operational visibility.
- Archives immutable raw payloads to the filesystem in UTC paths:

```text
raw-data/<provider-name>/<YYYY-MM-DD>/<HH-mm-ss>-<hash>.json
```

- Stores raw provider payloads and normalized market snapshots in PostgreSQL.
- Uses Redis `SET NX` keys plus PostgreSQL unique indexes for deduplication support.
- Normalizes timestamps to UTC `Date` values.

## Quick start

```bash
cp env.example .env

docker compose up
```

The API is exposed at:

- Health: <http://localhost:3000/api/health>
- Swagger: <http://localhost:3000/docs>

## Environment

All runtime settings are configured with environment variables. See [`env.example`](env.example) for defaults.

Key variables:

| Variable                   | Purpose                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `TSETMC_ENABLED`           | Enables the TSETMC provider. Defaults to `true`.                                   |
| `TSETMC_BASE_URL`          | TSETMC base URL. Defaults to `https://cdn.tsetmc.com`.                             |
| `TSETMC_MARKET_WATCH_PATH` | Market-watch endpoint path.                                                        |
| `BRSAPI_ENABLED`           | Enables the BRS API provider. Defaults to `false`.                                 |
| `BRSAPI_API_KEY`           | Required when BRS API provider is enabled.                                         |
| `RAW_DATA_ROOT`            | Root directory for immutable raw payload archives.                                 |
| `TYPEORM_SYNCHRONIZE`      | Development schema sync switch. Set to `false` for migration-managed environments. |

## Data model

### `raw_provider_payloads`

Stores the full provider response with a content hash and filesystem archive path.

### `market_snapshots`

Stores normalized per-symbol market snapshots with indexed provider, symbol, and timestamp columns. `dedupe_key` is unique to make ingestion idempotent.

## Docker services

`docker compose up` starts:

- NestJS app with hot reload
- PostgreSQL 17 with persistent volume and health check
- Redis 8 with append-only persistence and health check
- Persistent `raw_data` volume for raw payload archival

## Development commands

```bash
npm run start:dev
npm run build
npm run test
```

> Note: local development requires PostgreSQL and Redis matching the variables in `.env`.
