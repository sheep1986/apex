-- Migration: 20260207_voice_events_p0
-- Description: Strict Append-Only Event Log & Idempotency.

-- 1. Voice Call Events (Append-Only Log)
CREATE TABLE IF NOT EXISTS voice_call_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) not null,
  voice_call_id text not null, -- Normalized Trinity Call ID (or Provider ID if mapped)
  event_type text not null,
  payload jsonb not null, -- REDACTED payload
  created_at timestamptz default now()
);

-- Optimization for Timeline Queries
CREATE INDEX idx_voice_events_timeline ON voice_call_events(voice_call_id, created_at DESC);
CREATE INDEX idx_voice_events_org ON voice_call_events(organization_id);

-- Enforce Append-Only (Logic layer should also respect this, but DB enforcement is safer)
REVOKE UPDATE, DELETE ON voice_call_events FROM authenticated, service_role;

-- 2. Idempotency Lock (Deduplication)
-- Used to prevent processing the same webhook event twice
CREATE TABLE IF NOT EXISTS voice_event_deduplication (
  event_id text primary key, -- Provider Message ID or Hash(Payload)
  processed_at timestamptz default now()
);

-- 3. Voice Tool Executions (Execution Lock)
CREATE TABLE IF NOT EXISTS voice_tool_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  voice_call_id text not null,
  tool_call_id text not null,
  tool_name text not null,
  status text check (status in ('pending', 'completed', 'failed')) default 'pending',
  result jsonb,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  CONSTRAINT uq_tool_execution UNIQUE (voice_call_id, tool_call_id)
);

CREATE INDEX idx_tool_executions_call ON voice_tool_executions(voice_call_id);

-- RLS
ALTER TABLE voice_call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tool_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org Read Access Events" ON voice_call_events
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE auth.uid() = profiles.id));

CREATE POLICY "Org Read Access Tools" ON voice_tool_executions
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE auth.uid() = profiles.id));
