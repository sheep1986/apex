-- ============================================================================
-- COMPLETE FIX MIGRATION — Run this in Supabase SQL Editor
-- ============================================================================
-- This script is 100% defensive. Every statement checks before acting.
-- Safe to run multiple times. Order: tables first, then constraints,
-- then policies, then functions, then triggers.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PHASE A: EXTEND EXISTING TABLES (organizations, profiles)
-- ============================================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credit_balance NUMERIC DEFAULT 0.00;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- PHASE B: CREATE ALL TABLES (no FKs to tables that don't exist yet)
-- ============================================================================

-- B1. Organization Members
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, user_id)
);
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- B2. Credits Ledger
CREATE TABLE IF NOT EXISTS credits_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    reference_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_ledger_entry') THEN
        ALTER TABLE credits_ledger ADD CONSTRAINT unique_ledger_entry UNIQUE (organization_id, reference_id, type);
    END IF;
END $$;

-- B3. Assistants
CREATE TABLE IF NOT EXISTS assistants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'vapi',
    provider_assistant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'outbound',
    config JSONB DEFAULT '{}'::jsonb,
    runtime_config JSONB DEFAULT '{}'::jsonb,
    provider_type TEXT DEFAULT 'vapi',
    provider_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;

-- B4. Inbound Routes (needed before phone_numbers FK)
CREATE TABLE IF NOT EXISTS inbound_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE inbound_routes ENABLE ROW LEVEL SECURITY;

-- B5. Phone Numbers
CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    e164 TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    inbound_route_id UUID,
    provider_number_sid TEXT,
    capabilities JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- B6. Forwarding Targets
CREATE TABLE IF NOT EXISTS forwarding_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    e164 TEXT NOT NULL,
    strategy TEXT DEFAULT 'direct',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE forwarding_targets ENABLE ROW LEVEL SECURITY;

-- B7. Contacts — fix the phone column issue
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') THEN
        CREATE TABLE contacts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID NOT NULL REFERENCES organizations(id),
            phone_e164 TEXT,
            email TEXT,
            name TEXT,
            attributes JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
    ELSE
        -- Table exists, make sure it has the right columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='phone_e164') THEN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='phone') THEN
                ALTER TABLE contacts RENAME COLUMN phone TO phone_e164;
            ELSE
                ALTER TABLE contacts ADD COLUMN phone_e164 TEXT;
            END IF;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='email') THEN
            ALTER TABLE contacts ADD COLUMN email TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='name') THEN
            ALTER TABLE contacts ADD COLUMN name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='attributes') THEN
            ALTER TABLE contacts ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='updated_at') THEN
            ALTER TABLE contacts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name='organization_id') THEN
            ALTER TABLE contacts ADD COLUMN organization_id UUID REFERENCES organizations(id);
        END IF;
    END IF;
END $$;

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_contacts_org_phone') THEN
        ALTER TABLE contacts ADD CONSTRAINT uq_contacts_org_phone UNIQUE (organization_id, phone_e164);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add contacts unique constraint: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON contacts(organization_id, phone_e164);

-- B8. Voice Calls (big table, lots of columns)
CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    assistant_id UUID,
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

CREATE INDEX IF NOT EXISTS idx_voice_calls_provider_id ON voice_calls(provider_call_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_org_id ON voice_calls(organization_id);
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

-- B9. Campaigns
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
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- B10. Campaign Items
CREATE TABLE IF NOT EXISTS campaign_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    contact_id UUID,
    status TEXT DEFAULT 'pending',
    attempt_count INTEGER DEFAULT 0,
    next_try_at TIMESTAMPTZ DEFAULT now(),
    last_error TEXT,
    reserved_at TIMESTAMPTZ,
    reserved_by TEXT,
    voice_call_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_items_runner ON campaign_items(status, next_try_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_campaign_items_campaign ON campaign_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_items_concurrency ON campaign_items(campaign_id, status) WHERE status IN ('queued', 'in_progress');
ALTER TABLE campaign_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_campaign_id_contact_id') THEN
        ALTER TABLE campaign_items ADD CONSTRAINT uq_campaign_id_contact_id UNIQUE (campaign_id, contact_id);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- B11. Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID,
    source TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    description TEXT,
    assignment_id UUID,
    reference_call_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_org_contact ON tickets(organization_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- B12. Notes
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
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- B13. Activities
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID,
    type TEXT NOT NULL,
    reference_id UUID,
    summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activities_timeline ON activities(organization_id, contact_id, occurred_at DESC);
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_activities_org_type_ref') THEN
        ALTER TABLE activities ADD CONSTRAINT uq_activities_org_type_ref UNIQUE (organization_id, type, reference_id);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- B14. Voice Call Events
CREATE TABLE IF NOT EXISTS voice_call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    call_id UUID,
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
ALTER TABLE voice_call_events ENABLE ROW LEVEL SECURITY;

-- B15. Voice Call Finalisations
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

-- B16. Voice Call Private
CREATE TABLE IF NOT EXISTS voice_call_private (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    voice_call_id UUID,
    provider_recording_ref TEXT,
    transcript_full TEXT,
    transcript_summary TEXT,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE voice_call_private ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON voice_call_private FROM anon;
REVOKE ALL ON voice_call_private FROM authenticated;

-- B17. Voice Call Recordings
CREATE TABLE IF NOT EXISTS voice_call_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    voice_call_id UUID,
    provider_recording_ref TEXT,
    status TEXT DEFAULT 'pending',
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE voice_call_recordings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON voice_call_recordings FROM anon;
REVOKE ALL ON voice_call_recordings FROM authenticated;

-- B18. Voice Event Deduplication
CREATE TABLE IF NOT EXISTS voice_event_deduplication (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT now()
);

-- B19. Voice Files
CREATE TABLE IF NOT EXISTS voice_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    provider_file_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    url TEXT,
    size_bytes BIGINT,
    status TEXT DEFAULT 'processing',
    status_reason TEXT,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_voice_files_org ON voice_files(organization_id);
ALTER TABLE voice_files ENABLE ROW LEVEL SECURITY;

-- B20. Voice Tools
CREATE TABLE IF NOT EXISTS voice_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'function',
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_voice_tools_org ON voice_tools(organization_id);
ALTER TABLE voice_tools ENABLE ROW LEVEL SECURITY;

-- B21. Voice Tool Files (join)
CREATE TABLE IF NOT EXISTS voice_tool_files (
    tool_id UUID REFERENCES voice_tools(id) ON DELETE CASCADE,
    file_id UUID REFERENCES voice_files(id) ON DELETE CASCADE,
    PRIMARY KEY (tool_id, file_id),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE voice_tool_files ENABLE ROW LEVEL SECURITY;

-- B22. Assistant Tools (join)
CREATE TABLE IF NOT EXISTS assistant_tools (
    assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE,
    tool_id UUID REFERENCES voice_tools(id) ON DELETE CASCADE,
    PRIMARY KEY (assistant_id, tool_id),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE assistant_tools ENABLE ROW LEVEL SECURITY;

-- B23. Voice Squads
CREATE TABLE IF NOT EXISTS voice_squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    provider_squad_id TEXT,
    members_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    ui_config JSONB,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_voice_squads_org ON voice_squads(organization_id);
ALTER TABLE voice_squads ENABLE ROW LEVEL SECURITY;

-- B24. Voice Tool Executions
CREATE TABLE IF NOT EXISTS voice_tool_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    tool_id UUID,
    voice_call_id TEXT NOT NULL,
    tool_call_id TEXT NOT NULL,
    tool_name TEXT,
    status TEXT DEFAULT 'pending',
    result JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_tool_execution UNIQUE (voice_call_id, tool_call_id)
);
CREATE INDEX IF NOT EXISTS idx_voice_tool_executions_org ON voice_tool_executions(organization_id);
ALTER TABLE voice_tool_executions ENABLE ROW LEVEL SECURITY;

-- B25. Organization Controls
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

-- B26. Call State Transitions
CREATE TABLE IF NOT EXISTS call_state_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    voice_call_id UUID,
    call_id UUID,
    from_state TEXT,
    to_state TEXT NOT NULL,
    actor TEXT DEFAULT 'system',
    trigger_source TEXT DEFAULT 'system',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE call_state_transitions ENABLE ROW LEVEL SECURITY;

-- B27. Workflow Hooks
CREATE TABLE IF NOT EXISTS workflow_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    trigger_condition JSONB NOT NULL DEFAULT '{}'::jsonb,
    action_type TEXT NOT NULL,
    action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE workflow_hooks ENABLE ROW LEVEL SECURITY;

-- B28. Workflow Hook Logs
CREATE TABLE IF NOT EXISTS workflow_hook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    hook_id UUID,
    call_id UUID,
    status TEXT NOT NULL DEFAULT 'pending',
    attempt_count INTEGER DEFAULT 0,
    last_response_code INTEGER,
    request_payload JSONB,
    response_body TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE workflow_hook_logs ENABLE ROW LEVEL SECURITY;

-- B29. Conversation Outcome Rules
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

-- B30. Audit Logs
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


-- ============================================================================
-- PHASE C: RPC FUNCTIONS (all idempotent via CREATE OR REPLACE)
-- ============================================================================

-- C1. Apply Ledger Entry
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
    INSERT INTO credits_ledger (organization_id, amount, type, description, reference_id, metadata, created_at)
    VALUES (p_organization_id, p_amount, p_type, p_description, p_reference_id, p_metadata, now())
    ON CONFLICT (organization_id, reference_id, type) DO NOTHING
    RETURNING id INTO v_ledger_id;

    IF v_ledger_id IS NOT NULL THEN
        UPDATE organizations
        SET credit_balance = COALESCE(credit_balance, 0) + p_amount, updated_at = now()
        WHERE id = p_organization_id
        RETURNING credit_balance INTO v_new_balance;
        RETURN jsonb_build_object('success', true, 'ledger_id', v_ledger_id, 'new_balance', v_new_balance);
    ELSE
        SELECT credit_balance INTO v_new_balance FROM organizations WHERE id = p_organization_id;
        RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'message', 'Already processed');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C2. Reserve Campaign Items
CREATE OR REPLACE FUNCTION reserve_campaign_items(p_batch_size INTEGER, p_worker_id TEXT)
RETURNS TABLE (id UUID, campaign_id UUID, contact_id UUID, organization_id UUID, attempt_count INTEGER)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    WITH active_counts AS (
        SELECT ci.campaign_id, COUNT(*)::int as current_active
        FROM campaign_items ci WHERE ci.status IN ('queued', 'in_progress') GROUP BY ci.campaign_id
    )
    UPDATE campaign_items
    SET status = 'queued', reserved_at = now(), reserved_by = p_worker_id, updated_at = now()
    WHERE campaign_items.id IN (
        SELECT ci.id FROM campaign_items ci
        JOIN campaigns c ON ci.campaign_id = c.id
        LEFT JOIN active_counts ac ON c.id = ac.campaign_id
        WHERE ci.status = 'pending' AND ci.next_try_at <= now() AND c.status = 'running'
            AND COALESCE(ac.current_active, 0) < c.concurrency_limit
        LIMIT p_batch_size FOR UPDATE SKIP LOCKED
    )
    RETURNING campaign_items.id, campaign_items.campaign_id, campaign_items.contact_id,
              campaign_items.organization_id, campaign_items.attempt_count;
END;
$$;

-- C3. Get Organization Balance
CREATE OR REPLACE FUNCTION get_organization_balance(p_organization_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance NUMERIC;
BEGIN
    SELECT COALESCE(credit_balance, 0) INTO v_balance FROM organizations WHERE id = p_organization_id;
    RETURN COALESCE(v_balance, 0.00);
END;
$$;

-- C4. Get Daily Spend
CREATE OR REPLACE FUNCTION get_daily_spend(p_organization_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_spend NUMERIC;
BEGIN
    SELECT COALESCE(SUM(cost), 0) INTO v_spend FROM voice_calls
    WHERE organization_id = p_organization_id AND created_at > (now() - INTERVAL '24 hours');
    RETURN v_spend;
END;
$$;

-- C5. Utility triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_voice_events_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

-- C6. Audit trigger
CREATE OR REPLACE FUNCTION trigger_audit_log_safe()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID; v_actor_id UUID; v_changed_fields TEXT[] := ARRAY[]::TEXT[];
    v_old_json JSONB; v_new_json JSONB;
BEGIN
    IF (TG_OP = 'DELETE') THEN v_org_id := OLD.organization_id;
    ELSE v_org_id := NEW.organization_id; END IF;
    v_actor_id := auth.uid();
    IF (TG_OP = 'UPDATE') THEN
        v_old_json := to_jsonb(OLD); v_new_json := to_jsonb(NEW);
        SELECT array_agg(key) INTO v_changed_fields FROM jsonb_each(v_new_json) AS n(key, value)
        WHERE n.value IS DISTINCT FROM v_old_json -> n.key;
    END IF;
    INSERT INTO audit_logs (organization_id, actor_id, resource_type, resource_id, action, changed_fields)
    VALUES (v_org_id, v_actor_id, TG_TABLE_NAME::text, COALESCE(NEW.id, OLD.id), TG_OP, v_changed_fields);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- PHASE D: RLS POLICIES (all wrapped in exception handlers)
-- ============================================================================

DO $$ BEGIN
    CREATE POLICY "org_members_select" ON organization_members FOR SELECT TO authenticated USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "ledger_select" ON credits_ledger FOR SELECT TO authenticated USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "assistants_all" ON assistants FOR ALL USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "voice_calls_select" ON voice_calls FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "contacts_all" ON contacts FOR ALL USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "campaigns_all" ON campaigns FOR ALL USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "campaign_items_all" ON campaign_items FOR ALL USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        OR organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- PHASE E: TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_voice_files_updated_at ON voice_files;
CREATE TRIGGER update_voice_files_updated_at BEFORE UPDATE ON voice_files FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_tools_updated_at ON voice_tools;
CREATE TRIGGER update_voice_tools_updated_at BEFORE UPDATE ON voice_tools FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_squads_updated_at ON voice_squads;
CREATE TRIGGER update_voice_squads_updated_at BEFORE UPDATE ON voice_squads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_call_events_updated_at ON voice_call_events;
CREATE TRIGGER update_voice_call_events_updated_at BEFORE UPDATE ON voice_call_events FOR EACH ROW EXECUTE PROCEDURE update_voice_events_updated_at();

DROP TRIGGER IF EXISTS audit_campaigns ON campaigns;
CREATE TRIGGER audit_campaigns AFTER INSERT OR UPDATE OR DELETE ON campaigns FOR EACH ROW EXECUTE FUNCTION trigger_audit_log_safe();

DROP TRIGGER IF EXISTS audit_contacts ON contacts;
CREATE TRIGGER audit_contacts AFTER INSERT OR UPDATE OR DELETE ON contacts FOR EACH ROW EXECUTE FUNCTION trigger_audit_log_safe();


-- ============================================================================
-- DONE!
-- Verify: SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- ============================================================================
