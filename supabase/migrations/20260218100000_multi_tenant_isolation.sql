-- ============================================================================
-- Multi-Tenant Isolation: Add missing RLS policies + ownership columns
-- ============================================================================
-- Tables that have RLS ENABLED but NO POLICY created:
--   phone_numbers, inbound_routes, forwarding_targets,
--   voice_call_private, voice_call_recordings, voice_call_events,
--   voice_call_finalisations, voice_files, voice_tools, voice_tool_files,
--   assistant_tools, voice_squads, voice_tool_executions
-- ============================================================================

-- Helper: Standard org-member check subquery (reused in all policies below)
-- Pattern: organization_id IN (SELECT org from org_members WHERE user) OR from profiles

-- ── phone_numbers ─────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'phone_numbers' AND policyname = 'Org members can manage phone numbers') THEN
    CREATE POLICY "Org members can manage phone numbers" ON phone_numbers
      FOR ALL USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── inbound_routes ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inbound_routes' AND policyname = 'Org members can manage inbound routes') THEN
    CREATE POLICY "Org members can manage inbound routes" ON inbound_routes
      FOR ALL USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── forwarding_targets ───────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forwarding_targets' AND policyname = 'Org members can manage forwarding targets') THEN
    CREATE POLICY "Org members can manage forwarding targets" ON forwarding_targets
      FOR ALL USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── voice_call_private ───────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_call_private' AND policyname = 'Org members can view call private data') THEN
    CREATE POLICY "Org members can view call private data" ON voice_call_private
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── voice_call_recordings ────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_call_recordings' AND policyname = 'Org members can view call recordings') THEN
    CREATE POLICY "Org members can view call recordings" ON voice_call_recordings
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── voice_call_events ────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_call_events' AND policyname = 'Org members can view call events') THEN
    CREATE POLICY "Org members can view call events" ON voice_call_events
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── voice_call_finalisations ─────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_call_finalisations' AND policyname = 'Org members can view call finalisations') THEN
    CREATE POLICY "Org members can view call finalisations" ON voice_call_finalisations
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── voice_files ──────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_files' AND policyname = 'Org members can manage voice files') THEN
    CREATE POLICY "Org members can manage voice files" ON voice_files
      FOR ALL USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── voice_tools ──────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_tools' AND policyname = 'Org members can manage voice tools') THEN
    CREATE POLICY "Org members can manage voice tools" ON voice_tools
      FOR ALL USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── voice_squads ─────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_squads' AND policyname = 'Org members can manage voice squads') THEN
    CREATE POLICY "Org members can manage voice squads" ON voice_squads
      FOR ALL USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── voice_tool_executions ────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'voice_tool_executions' AND policyname = 'Org members can view tool executions') THEN
    CREATE POLICY "Org members can view tool executions" ON voice_tool_executions
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- Add missing columns needed for multi-tenant isolation
-- The live DB uses different column names than full_schema_sync.sql
-- ══════════════════════════════════════════════════════════════════════════

-- ── phone_numbers: add provider tracking columns ─────────────────────────
-- Live schema has: id, organization_id, number, status, ai_enabled, ai_disabled_forward_to, created_at
-- Need: vapi_number_id (to look up in Vapi), provider, name
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS vapi_number_id TEXT;
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'trinity';
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS name TEXT;
CREATE INDEX IF NOT EXISTS idx_phone_numbers_vapi_id ON phone_numbers(vapi_number_id) WHERE vapi_number_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_phone_numbers_org ON phone_numbers(organization_id);

-- ── assistants: already has vapi_assistant_id — just ensure index ─────────
-- Live schema has: id, organization_id, name, vapi_assistant_id, type, created_at, updated_at
CREATE INDEX IF NOT EXISTS idx_assistants_vapi_id ON assistants(vapi_assistant_id) WHERE vapi_assistant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assistants_org ON assistants(organization_id);

-- ── voice_tools: add provider_tool_id if missing ─────────────────────────
ALTER TABLE voice_tools ADD COLUMN IF NOT EXISTS provider_tool_id TEXT;

-- ── Unique indexes for ownership lookups ─────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_squads_provider_id ON voice_squads(provider_squad_id) WHERE provider_squad_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_tools_provider_id ON voice_tools(provider_tool_id) WHERE provider_tool_id IS NOT NULL;
