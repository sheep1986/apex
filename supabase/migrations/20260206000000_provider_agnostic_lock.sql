-- Migration: 20260206_provider_agnostic_lock
-- Description: Provider-agnostic Voice schema with enterprise controls.
-- Constraints: Zero-trace (no vapi_*), Enterprise Fields, RLS Enabled (Policies Deferred).

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Knowledge Base (Files)
CREATE TABLE IF NOT EXISTS voice_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  
  -- Provider Abstraction
  provider_file_id text not null, -- Maps to Vapi/Twilio/etc
  filename text not null,
  url text,
  size_bytes bigint,
  
  -- Enterprise Lifecycle
  status text check (status in ('processing', 'ready', 'failed')) default 'processing',
  status_reason text,
  provider_metadata jsonb default '{}'::jsonb,
  is_active boolean default true,
  
  -- Audit
  created_by uuid, -- references auth.users normally, strict FK deferred
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER update_voice_files_updated_at
    BEFORE UPDATE ON voice_files
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_voice_files_org ON voice_files(organization_id);
CREATE INDEX idx_voice_files_provider_id ON voice_files(provider_file_id);


-- 2. Voice Tools (Function Definitions)
CREATE TABLE IF NOT EXISTS voice_tools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  
  -- Identity
  name text not null,
  description text,
  type text default 'function', -- 'function', 'dtmf', 'endCall'
  
  -- Functional Config
  schema jsonb not null, -- The JSON Schema
  config jsonb default '{}'::jsonb, -- Additional config (serverUrl, headers)
  
  -- Enterprise Lifecycle
  provider_metadata jsonb default '{}'::jsonb, -- e.g. provider-specific tool IDs
  is_active boolean default true,
  
  -- Audit
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER update_voice_tools_updated_at
    BEFORE UPDATE ON voice_tools
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_voice_tools_org ON voice_tools(organization_id);


-- 3. Tool <-> File (RAG Association)
CREATE TABLE IF NOT EXISTS voice_tool_files (
  tool_id uuid references voice_tools(id) on delete cascade,
  file_id uuid references voice_files(id) on delete cascade,
  primary key (tool_id, file_id),
  created_at timestamptz default now()
);


-- 4. Assistant <-> Tool (Many-to-Many)
-- Note: Assuming 'assistants' table exists. referencing it safely.
CREATE TABLE IF NOT EXISTS assistant_tools (
  assistant_id uuid references assistants(id) on delete cascade,
  tool_id uuid references voice_tools(id) on delete cascade,
  primary key (assistant_id, tool_id),
  created_at timestamptz default now()
);


-- 5. Squads (Routing Groups)
CREATE TABLE IF NOT EXISTS voice_squads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  
  -- Identity
  name text not null,
  
  -- Provider Abstraction
  provider_squad_id text, -- ID from provider (if persistent)
  members_config jsonb not null, -- Abstracted member definition
  
  -- Internal Config
  ui_config jsonb, -- Visual graph state
  
  -- Enterprise Lifecycle
  provider_metadata jsonb default '{}'::jsonb,
  is_active boolean default true,
  
  -- Audit
  created_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TRIGGER update_voice_squads_updated_at
    BEFORE UPDATE ON voice_squads
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX idx_voice_squads_org ON voice_squads(organization_id);
CREATE INDEX idx_voice_squads_provider_id ON voice_squads(provider_squad_id);


-- RLS Strategy: Enabled, Policies Deferred (Safe Default)
ALTER TABLE voice_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tool_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_squads ENABLE ROW LEVEL SECURITY;
