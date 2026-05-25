ALTER TABLE market_snapshots
  ADD COLUMN provider_timestamp_utc timestamptz,
  ADD COLUMN ingested_at_utc timestamptz DEFAULT now(),
  ADD COLUMN provider_version text DEFAULT 'unknown',
  ADD COLUMN normalizer_version text DEFAULT 'unknown',
  ADD COLUMN ingestion_sequence bigint,
  ADD COLUMN quality_score numeric(5,4) DEFAULT 1,
  ADD COLUMN quality_flags text[] DEFAULT ARRAY[]::text[];

ALTER TABLE money_flow_snapshots
  ADD COLUMN provider_timestamp_utc timestamptz,
  ADD COLUMN ingested_at_utc timestamptz DEFAULT now(),
  ADD COLUMN provider_version text DEFAULT 'unknown',
  ADD COLUMN normalizer_version text DEFAULT 'unknown',
  ADD COLUMN ingestion_sequence bigint,
  ADD COLUMN quality_score numeric(5,4) DEFAULT 1,
  ADD COLUMN quality_flags text[] DEFAULT ARRAY[]::text[];

UPDATE market_snapshots SET provider_timestamp_utc = timestamp_utc WHERE provider_timestamp_utc IS NULL;
UPDATE money_flow_snapshots SET provider_timestamp_utc = timestamp_utc WHERE provider_timestamp_utc IS NULL;
UPDATE market_snapshots SET ingestion_sequence = (extract(epoch from created_at) * 1000000)::bigint WHERE ingestion_sequence IS NULL;
UPDATE money_flow_snapshots SET ingestion_sequence = (extract(epoch from created_at) * 1000000)::bigint WHERE ingestion_sequence IS NULL;

ALTER TABLE market_snapshots ALTER COLUMN provider_timestamp_utc SET NOT NULL;
ALTER TABLE money_flow_snapshots ALTER COLUMN provider_timestamp_utc SET NOT NULL;
ALTER TABLE market_snapshots ALTER COLUMN ingested_at_utc SET NOT NULL;
ALTER TABLE money_flow_snapshots ALTER COLUMN ingested_at_utc SET NOT NULL;
ALTER TABLE market_snapshots ALTER COLUMN ingestion_sequence SET NOT NULL;
ALTER TABLE money_flow_snapshots ALTER COLUMN ingestion_sequence SET NOT NULL;

CREATE UNIQUE INDEX market_snapshots_ingestion_sequence_key ON market_snapshots(ingestion_sequence);
CREATE UNIQUE INDEX money_flow_snapshots_ingestion_sequence_key ON money_flow_snapshots(ingestion_sequence);

CREATE TABLE dead_letter_payloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_payload_id uuid NOT NULL REFERENCES raw_api_payloads(id),
  provider_name text NOT NULL,
  failure_stage text NOT NULL,
  failure_reason text NOT NULL,
  payload_json jsonb NOT NULL,
  stack_trace text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE instrument_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES instruments(id),
  provider_name text NOT NULL,
  external_symbol text NOT NULL,
  external_id text,
  valid_from timestamptz NOT NULL,
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
