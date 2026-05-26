You are a senior market infrastructure engineer building a production-grade Tehran Stock Exchange data collector using NestJS.

Build Phase 0 only: provider-based market data acquisition infrastructure.

## STACK
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- Redis
- Docker Compose
- Axios or native fetch
- @nestjs/schedule

## GOAL
Create a reliable multi-provider market data collection system for Tehran Stock Exchange (TSETMC).

DO NOT implement:
- trading strategies
- indicators
- machine learning
- dashboards
- broker execution

Focus ONLY on robust data acquisition infrastructure.

--------------------------------------------------
ARCHITECTURE
--------------------------------------------------

Implement modular architecture:

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

--------------------------------------------------
PROVIDER SYSTEM
--------------------------------------------------

Create abstract provider interface:

interface MarketDataProvider {
  fetchMarketSnapshot(): Promise<any>;
}

Implement:
- TsetmcProvider
- BrsApiProvider (stub allowed)

--------------------------------------------------
FUNCTIONAL REQUIREMENTS
--------------------------------------------------

- scheduled polling every 30 seconds
- retry logic with exponential backoff
- structured logging
- provider health monitoring
- graceful failure handling
- UTC timestamp normalization
- raw payload archival to filesystem
- normalized DTO generation
- deduplication support

--------------------------------------------------
DATA STORAGE
--------------------------------------------------

Store BOTH:

1. Raw provider payloads
2. Normalized market snapshots

Implement:
- PostgreSQL entities
- timestamp indexes
- proper relationships
- migration-ready structure

--------------------------------------------------
RAW PAYLOAD ARCHIVAL
--------------------------------------------------

Save immutable raw payloads to filesystem:

/raw-data
  /provider-name
    /YYYY-MM-DD
      HH-mm-ss.json

--------------------------------------------------
DOCKER REQUIREMENTS
--------------------------------------------------

Provide complete Docker setup including:

1. Dockerfile for NestJS app
2. docker-compose.yml
3. PostgreSQL service
4. Redis service
5. volume persistence
6. environment variable support
7. health checks
8. hot reload for development

The system must run using:

docker compose up

--------------------------------------------------
OUTPUT REQUIREMENTS
--------------------------------------------------

Provide:
- full working code
- project structure
- environment examples
- TypeORM configuration
- example scheduler
- example provider implementation
- Docker setup
- startup instructions

This is ONLY Phase 0 of a future quant trading infrastructure system.