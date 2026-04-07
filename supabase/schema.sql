-- WashBuddy Schema
-- Run this in: Supabase Dashboard > SQL Editor

-- ── Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS businesses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT,
  email       TEXT UNIQUE,
  password    TEXT,
  role        TEXT NOT NULL DEFAULT 'USER',
  business_id UUID REFERENCES businesses(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  price       NUMERIC NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS agents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  phone       TEXT,
  business_id UUID NOT NULL REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS vehicles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate TEXT NOT NULL UNIQUE,
  owner_name    TEXT,
  owner_phone   TEXT,
  vehicle_type  TEXT
);

CREATE TABLE IF NOT EXISTS queue_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status         TEXT NOT NULL DEFAULT 'IN_QUEUE',
  business_id    UUID NOT NULL REFERENCES businesses(id),
  vehicle_id     UUID NOT NULL REFERENCES vehicles(id),
  service_id     UUID NOT NULL REFERENCES services(id),
  agent_id       UUID REFERENCES agents(id),
  extra_services TEXT,
  total_amount   NUMERIC,
  payment_method TEXT,
  check_in_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

-- ── Disable RLS for development ────────────────────────────────────────────
-- Remove these lines and add proper policies before going to production

ALTER TABLE businesses  DISABLE ROW LEVEL SECURITY;
ALTER TABLE users       DISABLE ROW LEVEL SECURITY;
ALTER TABLE services    DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents      DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles    DISABLE ROW LEVEL SECURITY;
ALTER TABLE queue_items DISABLE ROW LEVEL SECURITY;
