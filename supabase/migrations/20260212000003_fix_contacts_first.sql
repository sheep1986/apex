-- ============================================================================
-- STEP 1: Fix the contacts table FIRST, then run the full migration after
-- ============================================================================
-- Run this FIRST, then run 20260212000002_complete_fix.sql after
-- ============================================================================

-- Check what we're working with
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contacts' ORDER BY ordinal_position;

-- Drop the contacts table entirely and recreate it clean
-- This is safe because it's a fresh platform with no real data yet
DROP TABLE IF EXISTS contacts CASCADE;

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    phone_e164 TEXT,
    email TEXT,
    name TEXT,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_contacts_org_phone UNIQUE (organization_id, phone_e164)
);

CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON contacts(organization_id, phone_e164);
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Now also drop and recreate any tables that reference contacts
-- so the full migration can recreate them cleanly
DROP TABLE IF EXISTS campaign_items CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS voice_call_events CASCADE;
DROP TABLE IF EXISTS voice_call_finalisations CASCADE;
DROP TABLE IF EXISTS voice_call_private CASCADE;
DROP TABLE IF EXISTS voice_call_recordings CASCADE;
DROP TABLE IF EXISTS voice_event_deduplication CASCADE;
DROP TABLE IF EXISTS voice_tool_executions CASCADE;
DROP TABLE IF EXISTS voice_tool_files CASCADE;
DROP TABLE IF EXISTS assistant_tools CASCADE;
DROP TABLE IF EXISTS voice_squads CASCADE;
DROP TABLE IF EXISTS voice_tools CASCADE;
DROP TABLE IF EXISTS voice_files CASCADE;
DROP TABLE IF EXISTS organization_controls CASCADE;
DROP TABLE IF EXISTS call_state_transitions CASCADE;
DROP TABLE IF EXISTS workflow_hook_logs CASCADE;
DROP TABLE IF EXISTS workflow_hooks CASCADE;
DROP TABLE IF EXISTS conversation_outcome_rules CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
