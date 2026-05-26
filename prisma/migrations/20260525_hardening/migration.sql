-- Phase 2 integrity + normalization schema hardening
CREATE TYPE "ValidityState" AS ENUM ('VALID','WARNING','INVALID');
CREATE TYPE "LifecycleState" AS ENUM ('ACTIVE','HALTED','SUSPENDED','REOPENED','DELISTED');

ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS validity_state "ValidityState" NOT NULL DEFAULT 'VALID';
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS validation_reason TEXT;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS validation_version TEXT NOT NULL DEFAULT 'validation-v1';
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS provider_latency_ms INTEGER NOT NULL DEFAULT 0;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS staleness_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS lineage_raw_payload_id UUID;

ALTER TABLE money_flow_snapshots ADD COLUMN IF NOT EXISTS validity_state "ValidityState" NOT NULL DEFAULT 'VALID';
ALTER TABLE money_flow_snapshots ADD COLUMN IF NOT EXISTS validation_reason TEXT;
ALTER TABLE money_flow_snapshots ADD COLUMN IF NOT EXISTS validation_version TEXT NOT NULL DEFAULT 'validation-v1';
ALTER TABLE money_flow_snapshots ADD COLUMN IF NOT EXISTS provider_latency_ms INTEGER NOT NULL DEFAULT 0;
ALTER TABLE money_flow_snapshots ADD COLUMN IF NOT EXISTS staleness_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE money_flow_snapshots ADD COLUMN IF NOT EXISTS lineage_raw_payload_id UUID;

CREATE TABLE IF NOT EXISTS corporate_actions (
  id UUID PRIMARY KEY,
  instrument_id UUID NOT NULL REFERENCES instruments(id),
  action_type TEXT NOT NULL,
  effective_date DATE NOT NULL,
  adjustment_factor NUMERIC(18,8) NOT NULL,
  adjustment_version TEXT NOT NULL DEFAULT 'corp-action-v1',
  metadata_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instrument_lifecycle_events (
  id UUID PRIMARY KEY,
  instrument_id UUID NOT NULL REFERENCES instruments(id),
  provider_name TEXT NOT NULL,
  state_from "LifecycleState" NOT NULL,
  state_to "LifecycleState" NOT NULL,
  event_timestamp_utc TIMESTAMPTZ NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS anomaly_events (
  id UUID PRIMARY KEY,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  affected_instrument_id UUID REFERENCES instruments(id),
  timestamp_utc TIMESTAMPTZ NOT NULL,
  provider TEXT NOT NULL,
  anomaly_metadata JSONB NOT NULL,
  raw_payload_reference UUID REFERENCES raw_api_payloads(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canonical_market_timeline (
  id UUID PRIMARY KEY,
  instrument_id UUID NOT NULL REFERENCES instruments(id),
  interval_start_utc TIMESTAMPTZ NOT NULL,
  interval_end_utc TIMESTAMPTZ NOT NULL,
  marker TEXT NOT NULL,
  timeline_hash TEXT NOT NULL,
  integrity_flags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(instrument_id, interval_start_utc)
);
