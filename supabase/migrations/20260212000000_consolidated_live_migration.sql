-- ============================================================================
-- CONSOLIDATED LIVE MIGRATION FOR TRINITY AI PLATFORM
-- ============================================================================
-- Date: 2026-02-12
-- Purpose: Apply all missing schema to live Supabase (APEX ADMIN Users project)
--
-- EXISTING in live DB:
--   ✅ profiles (id, organization_id, role, full_name, avatar_url, created_at)
--   ✅ organizations (id, name, created_at, stripe_customer_id, subscription_status)
--   ✅ RLS enabled on profiles and organizations
--
-- MISSING from live DB (this migration adds):
--   ❌ organizations.credit_balance + organizations.updated_at
--   ❌ organization_members table
--   ❌ credits_ledger table
--   ❌ apply_ledger_entry RPC function
--   ❌ assistants table
--   ❌ voice_calls table + extensions
--   ❌ phone_numbers table
--   ❌ inbound_routes table
--   ❌ forwarding_targets table
--   ❌ contacts table
--   ❌ campaigns + campaign_items tables
--   ❌ tickets, notes, activities tables
--   ❌ voice_call_events, voice_call_finalisations, voice_call_private
--   ❌ voice_call_recordings table
--   ❌ voice_files, voice_tools, voice_squads tables
--   ❌ assistant_tools, voice_tool_files join tables
--   ❌ voice_tool_executions, voice_event_deduplication
--   ❌ organization_controls, call_state_transitions, workflow_hooks
--   ❌ conversation_outcome_rules, audit_logs, workflow_hook_logs
--   ❌ All RPC functions and triggers
--
-- HOW TO RUN:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--   4. Verify no errors
-- ============================================================================

-- Enable UUID extension (should already exist)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: EXTEND EXISTING TABLES
-- ============================================================================

-- Add missing columns to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credit_balance NUMERIC DEFAULT 0.00;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Updated_at trigger utility
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- SECTION 2: ORGANIZATION MEMBERS (Multi-Tenancy Foundation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own memberships
DO $$ BEGIN
    CREATE POLICY "Users can view their own memberships" ON organization_members
        FOR SELECT TO authenticated
        USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 3: CREDITS LEDGER (The Money Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS credits_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL, -- 'trial', 'topup', 'usage', 'monthly_fee', 'adjustment', 'refund', 'credit'
    description TEXT,
    reference_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotency constraint
ALTER TABLE credits_ledger
ADD CONSTRAINT unique_ledger_entry UNIQUE (organization_id, reference_id, type);

ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;

-- Strict: Users can only SELECT their own org's ledger, never INSERT/UPDATE
GRANT SELECT ON credits_ledger TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON credits_ledger FROM authenticated;

DO $$ BEGIN
    CREATE POLICY "Org members can view ledger" ON credits_ledger
        FOR SELECT TO authenticated
        USING (
            organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
            OR
            organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 4: APPLY_LEDGER_ENTRY RPC (Atomic Credit Operations)
-- ============================================================================

DROP FUNCTION IF EXISTS apply_ledger_entry;

CREATE OR REPLACE FUNCTION apply_ledger_entry(
    p_organization_id UUID,
    p_amount NUMERIC,
    p_type TEXT,
    p_description TEXT,
    p_reference_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
    v_new_balance NUMERIC;
    v_ledger_id UUID;
BEGIN
    -- Insert with conflict handling for idempotency
    INSERT INTO credits_ledger (
        organization_id, amount, type, description, reference_id, metadata, created_at
    ) VALUES (
        p_organization_id, p_amount, p_type, p_description, p_reference_id, p_metadata, now()
    )
    ON CONFLICT (organization_id, reference_id, type) DO NOTHING
    RETURNING id INTO v_ledger_id;

    -- If inserted, update org balance
    IF v_ledger_id IS NOT NULL THEN
        UPDATE organizations
        SET credit_balance = COALESCE(credit_balance, 0) + p_amount,
            updated_at = now()
        WHERE id = p_organization_id
        RETURNING credit_balance INTO v_new_balance;

        RETURN jsonb_build_object(
            'success', true,
            'ledger_id', v_ledger_id,
            'new_balance', v_new_balance
        );
    ELSE
        -- Already exists (idempotent)
        SELECT credit_balance INTO v_new_balance
        FROM organizations
        WHERE id = p_organization_id;

        RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'message', 'Already processed');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 5: ASSISTANTS (Voice Agents)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assistants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'vapi',
    provider_assistant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('outbound', 'inbound')) DEFAULT 'outbound',
    config JSONB DEFAULT '{}'::jsonb,
    runtime_config JSONB DEFAULT '{
        "max_duration_seconds": 600,
        "cost_limit_usd": 5.00,
        "model_whitelist": ["gpt-4", "gpt-3.5-turbo"],
        "compliance_mode": true
    }'::jsonb,
    provider_type TEXT DEFAULT 'vapi',
    provider_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Org members can manage assistants" ON assistants
        FOR ALL USING (
            organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
            OR
            organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 6: VOICE CALLS (Call State & Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    assistant_id UUID REFERENCES assistants(id),
    provider_call_id TEXT,
    provider TEXT DEFAULT 'voice_engine',
    status TEXT DEFAULT 'initiating',
    customer_number TEXT,
    direction TEXT DEFAULT 'outbound',
    cost NUMERIC DEFAULT 0,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    outcome TEXT,
    disposition TEXT,
    recording_path TEXT,
    transcript_summary TEXT,
    phone_number_id UUID,
    inbound_route_id UUID,
    forwarding_target_id UUID,
    recording_policy TEXT DEFAULT 'none',
    transcript_path TEXT,
    contact_id UUID,
    campaign_id UUID,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_calls_provider_id ON voice_calls(provider_call_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_org_id ON voice_calls(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_calls_org_provider_unique ON voice_calls(organization_id, provider_call_id);

ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Org members can view calls" ON voice_calls
        FOR SELECT USING (
            organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
            OR
            organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 7: PHONE NUMBERS & INBOUND ROUTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS inbound_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    e164 TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    inbound_route_id UUID REFERENCES inbound_routes(id),
    provider_number_sid TEXT,
    capabilities JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forwarding_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    e164 TEXT NOT NULL,
    strategy TEXT DEFAULT 'direct',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK references now that phone_numbers exists
ALTER TABLE voice_calls
    ADD CONSTRAINT fk_voice_calls_phone_number FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id),
    ADD CONSTRAINT fk_voice_calls_inbound_route FOREIGN KEY (inbound_route_id) REFERENCES inbound_routes(id),
    ADD CONSTRAINT fk_voice_calls_forwarding_target FOREIGN KEY (forwarding_target_id) REFERENCES forwarding_targets(id);

ALTER TABLE inbound_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE forwarding_targets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 8: CRM - CONTACTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
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

-- Add contact FK to voice_calls
ALTER TABLE voice_calls
    ADD CONSTRAINT fk_voice_calls_contact FOREIGN KEY (contact_id) REFERENCES contacts(id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_contact ON voice_calls(contact_id);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage contacts in their org" ON contacts
        FOR ALL USING (
            organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
            OR
            organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 9: CAMPAIGNS (Outbound Dialing Engine)
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    type TEXT DEFAULT 'voice_broadcast',
    script_config JSONB DEFAULT '{}'::jsonb,
    schedule_config JSONB DEFAULT '{}'::jsonb,
    concurrency_limit INTEGER DEFAULT 1,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add campaign FK to voice_calls
ALTER TABLE voice_calls
    ADD CONSTRAINT fk_voice_calls_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_campaign_id ON voice_calls(campaign_id);

CREATE TABLE IF NOT EXISTS campaign_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    contact_id UUID REFERENCES contacts(id),
    status TEXT DEFAULT 'pending',
    attempt_count INTEGER DEFAULT 0,
    next_try_at TIMESTAMPTZ DEFAULT now(),
    last_error TEXT,
    reserved_at TIMESTAMPTZ,
    reserved_by TEXT,
    voice_call_id UUID REFERENCES voice_calls(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_campaign_id_contact_id UNIQUE (campaign_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_items_runner ON campaign_items(status, next_try_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_campaign_items_campaign ON campaign_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_items_concurrency ON campaign_items(campaign_id, status) WHERE status IN ('queued', 'in_progress');

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage campaigns in their org" ON campaigns
        FOR ALL USING (
            organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
            OR
            organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage campaign items in their org" ON campaign_items
        FOR ALL USING (
            organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
            OR
            organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 10: CRM - TICKETS, NOTES, ACTIVITIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id),
    source TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    description TEXT,
    assignment_id UUID,
    reference_call_id UUID REFERENCES voice_calls(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_tickets_org_ref_source UNIQUE (organization_id, reference_call_id, source)
);

CREATE INDEX IF NOT EXISTS idx_tickets_org_contact ON tickets(organization_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(organization_id, entity_type, entity_id);

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id),
    type TEXT NOT NULL,
    reference_id UUID,
    summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_activities_org_type_ref UNIQUE (organization_id, type, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_activities_timeline ON activities(organization_id, contact_id, occurred_at DESC);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 11: VOICE CALL EVENTS & PRIVATE DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    call_id UUID REFERENCES voice_calls(id),
    provider_call_id TEXT,
    type TEXT NOT NULL,
    status TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_call_events_org ON voice_call_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_events_call ON voice_call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_events_type ON voice_call_events(type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_call_events_idempotency
    ON voice_call_events (organization_id, call_id, type, reference_id)
    WHERE reference_id IS NOT NULL;

ALTER TABLE voice_call_events ENABLE ROW LEVEL SECURITY;

-- Voice Call Finalisations (Idempotency Lock)
CREATE TABLE IF NOT EXISTS voice_call_finalisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    provider_call_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_finalisation_idempotency UNIQUE (organization_id, provider_call_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_voice_call_finalisations_lookup ON voice_call_finalisations(provider_call_id);

ALTER TABLE voice_call_finalisations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON voice_call_finalisations FROM anon;
REVOKE ALL ON voice_call_finalisations FROM authenticated;

-- Voice Call Private Data (Zero-Trace)
CREATE TABLE IF NOT EXISTS voice_call_private (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    voice_call_id UUID NOT NULL REFERENCES voice_calls(id),
    provider_recording_ref TEXT,
    transcript_full TEXT,
    transcript_summary TEXT,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voice_call_private ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON voice_call_private FROM anon;
REVOKE ALL ON voice_call_private FROM authenticated;

-- Voice Call Recordings (Service-Role Only)
CREATE TABLE IF NOT EXISTS voice_call_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    voice_call_id UUID REFERENCES voice_calls(id),
    provider_recording_ref TEXT,
    status TEXT DEFAULT 'pending',
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voice_call_recordings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON voice_call_recordings FROM anon;
REVOKE ALL ON voice_call_recordings FROM authenticated;

-- Event Deduplication
CREATE TABLE IF NOT EXISTS voice_event_deduplication (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SECTION 12: KNOWLEDGE BASE, TOOLS, SQUADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    provider_file_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    url TEXT,
    size_bytes BIGINT,
    status TEXT CHECK (status IN ('processing', 'ready', 'failed')) DEFAULT 'processing',
    status_reason TEXT,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_files_org ON voice_files(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_files_provider_id ON voice_files(provider_file_id);

CREATE TABLE IF NOT EXISTS voice_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'function',
    schema JSONB NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_tools_org ON voice_tools(organization_id);

CREATE TABLE IF NOT EXISTS voice_tool_files (
    tool_id UUID REFERENCES voice_tools(id) ON DELETE CASCADE,
    file_id UUID REFERENCES voice_files(id) ON DELETE CASCADE,
    PRIMARY KEY (tool_id, file_id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assistant_tools (
    assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
    tool_id UUID REFERENCES voice_tools(id) ON DELETE CASCADE,
    PRIMARY KEY (assistant_id, tool_id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    provider_squad_id TEXT,
    members_config JSONB NOT NULL,
    ui_config JSONB,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_squads_org ON voice_squads(organization_id);

-- RLS
ALTER TABLE voice_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tool_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_squads ENABLE ROW LEVEL SECURITY;

-- Voice Tool Executions
CREATE TABLE IF NOT EXISTS voice_tool_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    tool_id UUID REFERENCES voice_tools(id),
    voice_call_id TEXT NOT NULL,
    tool_call_id TEXT NOT NULL,
    tool_name TEXT,
    status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_tool_execution UNIQUE (voice_call_id, tool_call_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_tool_executions_org ON voice_tool_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_call ON voice_tool_executions(voice_call_id);

ALTER TABLE voice_tool_executions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 13: ENTERPRISE CONTROLS & GOVERNANCE
-- ============================================================================

-- Organization Controls (Kill Switches)
CREATE TABLE IF NOT EXISTS organization_controls (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    shadow_mode BOOLEAN DEFAULT false,
    max_concurrency_override INTEGER,
    compliance_level TEXT DEFAULT 'standard',
    daily_spend_limit_usd NUMERIC DEFAULT 100.00,
    alert_threshold_percent INTEGER DEFAULT 80,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE organization_controls ENABLE ROW LEVEL SECURITY;

-- Call State Transitions
CREATE TABLE IF NOT EXISTS call_state_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    voice_call_id UUID REFERENCES voice_calls(id) ON DELETE CASCADE,
    call_id UUID REFERENCES voice_calls(id),
    from_state TEXT,
    to_state TEXT NOT NULL,
    actor TEXT DEFAULT 'system',
    trigger_source TEXT DEFAULT 'system',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_state_transitions_call_id ON call_state_transitions(call_id);

ALTER TABLE call_state_transitions ENABLE ROW LEVEL SECURITY;

-- Workflow Hooks
CREATE TABLE IF NOT EXISTS workflow_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    trigger_condition JSONB NOT NULL,
    action_type TEXT NOT NULL,
    action_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workflow_hooks ENABLE ROW LEVEL SECURITY;

-- Workflow Hook Logs
CREATE TABLE IF NOT EXISTS workflow_hook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    hook_id UUID,
    call_id UUID REFERENCES voice_calls(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    attempt_count INTEGER DEFAULT 0,
    last_response_code INTEGER,
    request_payload JSONB,
    response_body TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_hook_logs_org_created ON workflow_hook_logs(organization_id, created_at DESC);

ALTER TABLE workflow_hook_logs ENABLE ROW LEVEL SECURITY;

-- Conversation Outcome Rules
CREATE TABLE IF NOT EXISTS conversation_outcome_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    trigger_pattern TEXT NOT NULL,
    outcome_label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conversation_outcome_rules ENABLE ROW LEVEL SECURITY;

-- Audit Logs (PII-Safe)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    actor_id UUID,
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    action TEXT NOT NULL,
    changed_fields TEXT[],
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Admins can view audit logs" ON audit_logs
        FOR SELECT USING (
            organization_id IN (
                SELECT organization_id FROM organization_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 14: RPC FUNCTIONS
-- ============================================================================

-- Reserve Campaign Items (Concurrency-Aware)
CREATE OR REPLACE FUNCTION reserve_campaign_items(
    p_batch_size INTEGER,
    p_worker_id TEXT
)
RETURNS TABLE (
    id UUID,
    campaign_id UUID,
    contact_id UUID,
    organization_id UUID,
    attempt_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH active_counts AS (
        SELECT ci.campaign_id, COUNT(*)::int as current_active
        FROM campaign_items ci
        WHERE ci.status IN ('queued', 'in_progress')
        GROUP BY ci.campaign_id
    )
    UPDATE campaign_items
    SET
        status = 'queued',
        reserved_at = now(),
        reserved_by = p_worker_id,
        updated_at = now()
    WHERE campaign_items.id IN (
        SELECT ci.id
        FROM campaign_items ci
        JOIN campaigns c ON ci.campaign_id = c.id
        LEFT JOIN active_counts ac ON c.id = ac.campaign_id
        WHERE
            ci.status = 'pending'
            AND ci.next_try_at <= now()
            AND c.status = 'running'
            AND COALESCE(ac.current_active, 0) < c.concurrency_limit
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    RETURNING
        campaign_items.id,
        campaign_items.campaign_id,
        campaign_items.contact_id,
        campaign_items.organization_id,
        campaign_items.attempt_count;
END;
$$;

-- Get Organization Balance
CREATE OR REPLACE FUNCTION get_organization_balance(
    p_organization_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance NUMERIC;
BEGIN
    SELECT COALESCE(credit_balance, 0) INTO v_balance
    FROM organizations
    WHERE id = p_organization_id;

    RETURN COALESCE(v_balance, 0.00);
END;
$$;

-- Get Daily Spend (Circuit Breaker)
CREATE OR REPLACE FUNCTION get_daily_spend(p_organization_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_spend NUMERIC;
BEGIN
    SELECT COALESCE(SUM(cost), 0) INTO v_spend
    FROM voice_calls
    WHERE organization_id = p_organization_id
      AND created_at > (now() - INTERVAL '24 hours');

    RETURN v_spend;
END;
$$;

-- Audit Trigger Function (PII-Safe)
CREATE OR REPLACE FUNCTION trigger_audit_log_safe()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_actor_id UUID;
    v_changed_fields TEXT[] := ARRAY[]::TEXT[];
    v_old_json JSONB;
    v_new_json JSONB;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_org_id := OLD.organization_id;
    ELSE
        v_org_id := NEW.organization_id;
    END IF;

    v_actor_id := auth.uid();

    IF (TG_OP = 'UPDATE') THEN
        v_old_json := to_jsonb(OLD);
        v_new_json := to_jsonb(NEW);
        SELECT array_agg(key) INTO v_changed_fields
        FROM jsonb_each(v_new_json) AS n(key, value)
        WHERE n.value IS DISTINCT FROM v_old_json -> n.key;
    END IF;

    INSERT INTO audit_logs (
        organization_id, actor_id, resource_type, resource_id, action, changed_fields
    ) VALUES (
        v_org_id, v_actor_id, TG_TABLE_NAME::text, COALESCE(NEW.id, OLD.id), TG_OP, v_changed_fields
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated-at trigger for voice events
CREATE OR REPLACE FUNCTION update_voice_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 15: TRIGGERS
-- ============================================================================

-- Updated-at triggers
DROP TRIGGER IF EXISTS update_voice_files_updated_at ON voice_files;
CREATE TRIGGER update_voice_files_updated_at
    BEFORE UPDATE ON voice_files
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_tools_updated_at ON voice_tools;
CREATE TRIGGER update_voice_tools_updated_at
    BEFORE UPDATE ON voice_tools
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_squads_updated_at ON voice_squads;
CREATE TRIGGER update_voice_squads_updated_at
    BEFORE UPDATE ON voice_squads
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_call_events_updated_at ON voice_call_events;
CREATE TRIGGER update_voice_call_events_updated_at
    BEFORE UPDATE ON voice_call_events
    FOR EACH ROW EXECUTE PROCEDURE update_voice_events_updated_at();

-- Audit triggers
DROP TRIGGER IF EXISTS audit_campaigns ON campaigns;
CREATE TRIGGER audit_campaigns
    AFTER INSERT OR UPDATE OR DELETE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log_safe();

DROP TRIGGER IF EXISTS audit_contacts ON contacts;
CREATE TRIGGER audit_contacts
    AFTER INSERT OR UPDATE OR DELETE ON contacts
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log_safe();

-- ============================================================================
-- DONE. Verify with: SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- ============================================================================
