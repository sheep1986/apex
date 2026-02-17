-- ============================================================================
-- FULL SCHEMA SYNC — Trinity AI Platform
-- ============================================================================
-- Date: 2026-02-17
-- Purpose: Bring production Supabase fully up to date with all code expectations.
--          Combines ALL 36 migration files into one idempotent script.
--          Safe to run multiple times (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
--          CREATE OR REPLACE, ON CONFLICT DO NOTHING throughout).
--
-- HOW TO RUN:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--   4. Should complete with no errors
--   5. Hard-refresh the deployed site (Cmd+Shift+R)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: PROFILES (extend existing table)
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client_user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/London';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- SECTION 2: ORGANIZATIONS (extend existing table — ALL columns the code needs)
-- ============================================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credit_balance NUMERIC DEFAULT 0.00;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Billing / Subscription
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;

-- Plan limits (minutes-based legacy)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS included_minutes INTEGER DEFAULT 1000;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_phone_numbers INTEGER DEFAULT 3;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_assistants INTEGER DEFAULT 5;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS overage_rate_per_minute NUMERIC DEFAULT 0.15;

-- Concurrent calls
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'max_concurrent_calls'
  ) THEN
    ALTER TABLE organizations ADD COLUMN max_concurrent_calls INTEGER DEFAULT 5;
  END IF;
END $$;

-- Credit-based pricing columns
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS included_credits INTEGER DEFAULT 200000;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credits_used_this_period INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS overage_credit_price NUMERIC DEFAULT 0.012;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ai_employees INTEGER DEFAULT 1;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_tier_id TEXT DEFAULT 'employee_1';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS parent_organization_id UUID;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS org_type TEXT DEFAULT 'direct';

-- Settings JSONB (used by GDPR, branding, security, etc.)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Onboarding / Activation
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS first_call_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS activation_checklist JSONB DEFAULT '{}'::jsonb;

-- GDPR / Compliance
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS data_retention_days INTEGER DEFAULT 365;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS default_recording_policy TEXT DEFAULT 'always_announce';

-- ============================================================================
-- SECTION 3: UTILITY FUNCTION — updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 4: ORGANIZATION MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if table was partially created
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Unique constraint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organization_members_organization_id_user_id_key') THEN
        ALTER TABLE organization_members ADD CONSTRAINT organization_members_organization_id_user_id_key UNIQUE (organization_id, user_id);
    END IF;
END $$;

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view their own memberships" ON organization_members
        FOR SELECT TO authenticated
        USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 5: ORGANIZATION CONTROLS
-- ============================================================================

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

-- ============================================================================
-- SECTION 6: CREDITS LEDGER
-- ============================================================================

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

-- Idempotency constraint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_ledger_entry') THEN
        ALTER TABLE credits_ledger ADD CONSTRAINT unique_ledger_entry UNIQUE (organization_id, reference_id, type);
    END IF;
END $$;

-- Credit-based pricing columns on ledger
ALTER TABLE credits_ledger ADD COLUMN IF NOT EXISTS credits INTEGER;
ALTER TABLE credits_ledger ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE credits_ledger ADD COLUMN IF NOT EXISTS unit_count NUMERIC;

ALTER TABLE credits_ledger ENABLE ROW LEVEL SECURITY;

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
-- SECTION 7: ASSISTANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS assistants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'vapi',
    provider_assistant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'outbound',
    config JSONB DEFAULT '{}'::jsonb,
    configuration JSONB DEFAULT '{}'::jsonb,
    runtime_config JSONB DEFAULT '{}'::jsonb,
    provider_type TEXT DEFAULT 'vapi',
    provider_config JSONB DEFAULT '{}'::jsonb,
    recording_policy TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns if table existed before
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS configuration JSONB DEFAULT '{}'::jsonb;
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS recording_policy TEXT;
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

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
-- SECTION 8: INBOUND ROUTES, PHONE NUMBERS, FORWARDING
-- ============================================================================

CREATE TABLE IF NOT EXISTS inbound_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb,
    business_hours JSONB DEFAULT '{}'::jsonb,
    after_hours_action TEXT DEFAULT 'voicemail',
    after_hours_forward_to TEXT,
    after_hours_greeting TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inbound_routes ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'::jsonb;
ALTER TABLE inbound_routes ADD COLUMN IF NOT EXISTS after_hours_action TEXT DEFAULT 'voicemail';
ALTER TABLE inbound_routes ADD COLUMN IF NOT EXISTS after_hours_forward_to TEXT;
ALTER TABLE inbound_routes ADD COLUMN IF NOT EXISTS after_hours_greeting TEXT;

CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    e164 TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    inbound_route_id UUID REFERENCES inbound_routes(id),
    provider_number_sid TEXT,
    capabilities JSONB DEFAULT '{}'::jsonb,
    ai_enabled BOOLEAN DEFAULT true,
    ai_disabled_forward_to TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true;
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS ai_disabled_forward_to TEXT;

CREATE TABLE IF NOT EXISTS forwarding_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    e164 TEXT NOT NULL,
    strategy TEXT DEFAULT 'direct',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inbound_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE forwarding_targets ENABLE ROW LEVEL SECURITY;

-- View: voice_phone_numbers → phone_numbers (code queries this view)
-- Only create if it doesn't already exist as a table
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'voice_phone_numbers' AND n.nspname = 'public' AND c.relkind = 'r'
    ) THEN
        EXECUTE 'CREATE OR REPLACE VIEW voice_phone_numbers AS SELECT * FROM phone_numbers';
    END IF;
END $$;

-- ============================================================================
-- SECTION 9: VOICE CALLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    assistant_id UUID,
    provider_call_id TEXT,
    provider TEXT DEFAULT 'voice_engine',
    status TEXT DEFAULT 'initiating',
    customer_number TEXT,
    phone_number TEXT,
    direction TEXT DEFAULT 'outbound',
    cost NUMERIC DEFAULT 0,
    ended_at TIMESTAMPTZ,
    ended_reason TEXT,
    duration_seconds INTEGER DEFAULT 0,
    outcome TEXT,
    disposition TEXT,
    recording_path TEXT,
    transcript_summary TEXT,
    transcript_path TEXT,
    phone_number_id UUID,
    inbound_route_id UUID,
    forwarding_target_id UUID,
    recording_policy TEXT DEFAULT 'none',
    contact_id UUID,
    campaign_id UUID,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist if table was created by earlier partial migration
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS assistant_id UUID;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS provider_call_id TEXT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'voice_engine';
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'initiating';
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS customer_number TEXT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'outbound';
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS disposition TEXT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS recording_path TEXT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS transcript_summary TEXT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS transcript_path TEXT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS phone_number_id UUID;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS inbound_route_id UUID;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS forwarding_target_id UUID;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS campaign_id UUID;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
-- Phase 2 QA columns
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS qa_score SMALLINT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS sentiment TEXT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS qa_notes TEXT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS recording_policy TEXT DEFAULT 'none';
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS ended_reason TEXT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE voice_calls ADD COLUMN IF NOT EXISTS duration INTEGER;

CREATE INDEX IF NOT EXISTS idx_voice_calls_provider_id ON voice_calls(provider_call_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_org_id ON voice_calls(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_calls_org_provider_unique
    ON voice_calls(organization_id, provider_call_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_contact ON voice_calls(contact_id);

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
-- SECTION 10: CONTACTS (CRM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    phone_e164 TEXT,
    email TEXT,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    attributes JSONB DEFAULT '{}'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    source TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist if table was created by earlier partial migration
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_e164 TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Unique constraint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_contacts_org_phone') THEN
        ALTER TABLE contacts ADD CONSTRAINT uq_contacts_org_phone UNIQUE (organization_id, phone_e164);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON contacts(organization_id, phone_e164);

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
-- SECTION 11: CRM DEALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID,
    title TEXT NOT NULL DEFAULT '',
    value NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'GBP',
    stage TEXT DEFAULT 'lead',
    priority TEXT DEFAULT 'medium',
    assigned_to UUID,
    notes TEXT,
    source_campaign_id UUID,
    source_call_id UUID,
    attributed_at TIMESTAMPTZ DEFAULT now(),
    expected_close_date DATE,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist if table was created by earlier partial migration
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GBP';
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'lead';
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS source_campaign_id UUID;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS source_call_id UUID;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS attributed_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_crm_deals_org ON crm_deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(organization_id, stage);

ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Org members can manage deals" ON crm_deals
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
-- SECTION 12: CAMPAIGNS
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
    settings JSONB DEFAULT '{}'::jsonb,
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    paused_reason TEXT,
    results_summary JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist if table was created by earlier partial migration
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'voice_broadcast';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS script_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS concurrency_limit INTEGER DEFAULT 1;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS successful_calls INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS paused_reason TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS results_summary JSONB DEFAULT '{}'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_campaigns_paused ON campaigns(organization_id, status) WHERE status = 'paused';
CREATE INDEX IF NOT EXISTS idx_campaigns_running ON campaigns(organization_id, status) WHERE status = 'running';

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

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

-- Campaign Items
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

-- Ensure all columns exist if table was created by earlier partial migration
ALTER TABLE campaign_items ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE campaign_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE campaign_items ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0;
ALTER TABLE campaign_items ADD COLUMN IF NOT EXISTS next_try_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE campaign_items ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE campaign_items ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ;
ALTER TABLE campaign_items ADD COLUMN IF NOT EXISTS reserved_by TEXT;
ALTER TABLE campaign_items ADD COLUMN IF NOT EXISTS voice_call_id UUID;
ALTER TABLE campaign_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_campaign_id_contact_id') THEN
        ALTER TABLE campaign_items ADD CONSTRAINT uq_campaign_id_contact_id UNIQUE (campaign_id, contact_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_items_runner ON campaign_items(status, next_try_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_campaign_items_campaign ON campaign_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_items_concurrency ON campaign_items(campaign_id, status) WHERE status IN ('queued', 'in_progress');

ALTER TABLE campaign_items ENABLE ROW LEVEL SECURITY;

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
-- SECTION 13: TICKETS, NOTES, ACTIVITIES (CRM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID,
    source TEXT DEFAULT 'system',
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    description TEXT,
    assignment_id UUID,
    reference_call_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'system';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assignment_id UUID;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS reference_call_id UUID;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_tickets_org_ref_source') THEN
        ALTER TABLE tickets ADD CONSTRAINT uq_tickets_org_ref_source UNIQUE (organization_id, reference_call_id, source);
    END IF;
END $$;

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
    created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_activities_org_type_ref') THEN
        ALTER TABLE activities ADD CONSTRAINT uq_activities_org_type_ref UNIQUE (organization_id, type, reference_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activities_timeline ON activities(organization_id, contact_id, occurred_at DESC);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 14: VOICE CALL EVENTS, FINALISATIONS, PRIVATE, RECORDINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS voice_call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    call_id UUID,
    provider_call_id TEXT,
    type TEXT NOT NULL DEFAULT 'unknown',
    status TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voice_call_events ADD COLUMN IF NOT EXISTS call_id UUID;
ALTER TABLE voice_call_events ADD COLUMN IF NOT EXISTS provider_call_id TEXT;
ALTER TABLE voice_call_events ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE voice_call_events ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE voice_call_events ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE voice_call_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_voice_call_events_org ON voice_call_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_events_call ON voice_call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_events_type ON voice_call_events(type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_call_events_idempotency
    ON voice_call_events (organization_id, call_id, type, reference_id)
    WHERE reference_id IS NOT NULL;

ALTER TABLE voice_call_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS voice_call_finalisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    provider_call_id TEXT NOT NULL DEFAULT '',
    event_type TEXT NOT NULL DEFAULT '',
    processed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voice_call_finalisations ADD COLUMN IF NOT EXISTS provider_call_id TEXT DEFAULT '';
ALTER TABLE voice_call_finalisations ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT '';
ALTER TABLE voice_call_finalisations ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ DEFAULT now();

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_finalisation_idempotency') THEN
        ALTER TABLE voice_call_finalisations ADD CONSTRAINT uq_finalisation_idempotency UNIQUE (organization_id, provider_call_id, event_type);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_voice_call_finalisations_lookup ON voice_call_finalisations(provider_call_id);

ALTER TABLE voice_call_finalisations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS voice_call_private (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    voice_call_id UUID NOT NULL,
    provider_recording_ref TEXT,
    transcript_full TEXT,
    transcript_summary TEXT,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voice_call_private ENABLE ROW LEVEL SECURITY;

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

CREATE TABLE IF NOT EXISTS voice_event_deduplication (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SECTION 15: KNOWLEDGE BASE, TOOLS, SQUADS
-- ============================================================================

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
CREATE INDEX IF NOT EXISTS idx_voice_files_provider_id ON voice_files(provider_file_id);

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
    members_config JSONB NOT NULL DEFAULT '[]'::jsonb,
    ui_config JSONB,
    provider_metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_squads_org ON voice_squads(organization_id);

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
    updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_tool_execution') THEN
        ALTER TABLE voice_tool_executions ADD CONSTRAINT uq_tool_execution UNIQUE (voice_call_id, tool_call_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_voice_tool_executions_org ON voice_tool_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_call ON voice_tool_executions(voice_call_id);

ALTER TABLE voice_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tool_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_tool_executions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 16: SUBSCRIPTION USAGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    minutes_used NUMERIC DEFAULT 0,
    overage_minutes NUMERIC DEFAULT 0,
    overage_billed BOOLEAN DEFAULT false,
    calls_count INTEGER DEFAULT 0,
    credits_used INTEGER DEFAULT 0,
    credits_included INTEGER DEFAULT 0,
    overage_credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscription_usage ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;
ALTER TABLE subscription_usage ADD COLUMN IF NOT EXISTS credits_included INTEGER DEFAULT 0;
ALTER TABLE subscription_usage ADD COLUMN IF NOT EXISTS overage_credits_used INTEGER DEFAULT 0;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_usage_period') THEN
        ALTER TABLE subscription_usage ADD CONSTRAINT unique_usage_period UNIQUE (organization_id, period_start);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscription_usage_org_period ON subscription_usage (organization_id, period_start);

ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Org members can view usage" ON subscription_usage
        FOR SELECT TO authenticated
        USING (
            organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
            OR organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 17: CREDIT RATES + PLAN TIERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL UNIQUE,
    credits_per_unit INTEGER NOT NULL,
    unit TEXT NOT NULL DEFAULT 'minute',
    cogs_per_unit NUMERIC NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO credit_rates (action_type, credits_per_unit, unit, cogs_per_unit, label) VALUES
    ('voice_budget',   18, 'minute',  0.07,   'Budget (Gemini Flash)'),
    ('voice_standard', 30, 'minute',  0.12,   'Standard (GPT-4o)'),
    ('voice_premium',  35, 'minute',  0.14,   'Premium (GPT-4o + ElevenLabs)'),
    ('voice_ultra',    40, 'minute',  0.16,   'Ultra (Claude Sonnet + ElevenLabs)'),
    ('sms',             3, 'message', 0.009,  'SMS'),
    ('email',           1, 'message', 0.0003, 'Email'),
    ('phone_number',  200, 'month',   0.90,   'Phone Number')
ON CONFLICT (action_type) DO NOTHING;

ALTER TABLE credit_rates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Anyone can read credit rates" ON credit_rates
        FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS plan_tiers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    ai_employees INTEGER NOT NULL DEFAULT 1,
    monthly_price_gbp NUMERIC NOT NULL,
    included_credits INTEGER NOT NULL,
    overage_credit_price NUMERIC NOT NULL,
    max_phone_numbers INTEGER DEFAULT 3,
    max_assistants INTEGER DEFAULT 5,
    max_concurrent_calls INTEGER DEFAULT 5,
    max_users INTEGER DEFAULT 5,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    contact_sales BOOLEAN DEFAULT false,
    stripe_price_id TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO plan_tiers (id, name, display_name, ai_employees, monthly_price_gbp, included_credits, overage_credit_price, max_phone_numbers, max_assistants, max_concurrent_calls, max_users, is_popular, contact_sales, sort_order, features) VALUES
    ('employee_1', 'starter', '1 AI Employee', 1, 2500, 200000, 0.012, 3, 5, 5, 5, false, false, 1,
     '["CRM + Pipeline", "Campaigns + Sequences", "SMS + Email Follow-up", "Call Recording + Transcription", "Analytics Dashboard"]'::jsonb),
    ('employee_3', 'growth', '3 AI Employees', 3, 6500, 650000, 0.011, 8, 15, 15, 15, true, false, 2,
     '["Everything in Starter", "Webhooks + API", "Advanced Analytics", "Priority Support"]'::jsonb),
    ('employee_5', 'business', '5 AI Employees', 5, 10000, 1100000, 0.010, 15, 30, 25, 50, false, false, 3,
     '["Everything in Growth", "White-label Branding", "Dedicated Account Manager", "Premium AI Training", "Custom Integrations"]'::jsonb),
    ('enterprise', 'enterprise', '10+ AI Employees', 10, 0, 0, 0, 0, 0, 0, 0, false, true, 4,
     '["Everything in Business", "Bespoke AI Training", "Custom SLA", "Volume Pricing", "Dedicated Infrastructure"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE plan_tiers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Anyone can read plan tiers" ON plan_tiers
        FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 18: AUTO RECHARGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS auto_recharge_config (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    threshold_usd NUMERIC NOT NULL DEFAULT 10.00,
    recharge_amount_usd NUMERIC NOT NULL DEFAULT 50.00,
    max_monthly_recharges INTEGER NOT NULL DEFAULT 5,
    recharges_this_month INTEGER NOT NULL DEFAULT 0,
    month_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month',
    stripe_payment_method_id TEXT,
    last_recharge_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE auto_recharge_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Org members can view own auto-recharge config" ON auto_recharge_config
        FOR SELECT USING (organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Org admins can manage auto-recharge config" ON auto_recharge_config
        FOR ALL USING (organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'client_admin', 'platform_owner')
        ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_auto_recharge_enabled ON auto_recharge_config (enabled) WHERE enabled = true;

-- ============================================================================
-- SECTION 19: AGENCY CREDIT MARKUP
-- ============================================================================

CREATE TABLE IF NOT EXISTS agency_credit_markup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    markup_multiplier NUMERIC DEFAULT 1.5,
    override_credits_per_unit INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_agency_action') THEN
        ALTER TABLE agency_credit_markup ADD CONSTRAINT unique_agency_action UNIQUE (agency_organization_id, action_type);
    END IF;
END $$;

ALTER TABLE agency_credit_markup ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Agency owners can manage markup" ON agency_credit_markup
        FOR ALL TO authenticated
        USING (
            agency_organization_id IN (
                SELECT organization_id FROM organization_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 20: GOVERNANCE (Audit, Workflow Hooks, Outcome Rules, State Transitions)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_call_state_transitions_call_id ON call_state_transitions(call_id);
ALTER TABLE call_state_transitions ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX IF NOT EXISTS idx_workflow_hook_logs_org_created ON workflow_hook_logs(organization_id, created_at DESC);
ALTER TABLE workflow_hook_logs ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- SECTION 21: PROVIDER HEALTH (Phase 2 — S9)
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'healthy',
    response_time_ms INTEGER,
    error_message TEXT,
    checked_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_health_latest ON provider_health(provider, checked_at DESC);

-- ============================================================================
-- SECTION 22: NOTIFICATIONS (server-side)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications_server (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_server_org ON notifications_server(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_server_user ON notifications_server(user_id, read) WHERE read = false;

ALTER TABLE notifications_server ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view their notifications" ON notifications_server
        FOR SELECT TO authenticated
        USING (
            user_id = auth.uid()
            OR organization_id IN (
                SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
            )
            OR organization_id IN (
                SELECT organization_id FROM profiles WHERE id = auth.uid()
            )
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create "notifications" view only if it doesn't already exist as a table
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'notifications' AND n.nspname = 'public' AND c.relkind = 'r'
    ) THEN
        EXECUTE 'CREATE OR REPLACE VIEW notifications AS SELECT * FROM notifications_server';
    END IF;
END $$;

-- ============================================================================
-- SECTION 23: COMMUNICATION — SMS, EMAIL, TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID,
    contact_id UUID,
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    body TEXT NOT NULL,
    direction TEXT DEFAULT 'outbound',
    status TEXT DEFAULT 'queued',
    provider_id TEXT,
    error_message TEXT,
    credits_used NUMERIC(10,4) DEFAULT 0,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID,
    contact_id UUID,
    template_id UUID,
    from_email TEXT NOT NULL,
    from_name TEXT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT,
    body_text TEXT,
    status TEXT DEFAULT 'queued',
    provider_id TEXT,
    error_message TEXT,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    usage_count INT DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "org_members_sms" ON sms_messages FOR ALL USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "org_members_email" ON email_messages FOR ALL USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "org_members_email_templates" ON email_templates FOR ALL USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_sms_messages_org ON sms_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_org ON email_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(organization_id);

-- ============================================================================
-- SECTION 24: CAMPAIGN SEQUENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_sequence_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID NOT NULL REFERENCES campaign_sequences(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    step_type TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_sequence_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID NOT NULL REFERENCES campaign_sequences(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    current_step_id UUID,
    status TEXT DEFAULT 'active',
    next_action_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_seq_contact') THEN
        ALTER TABLE campaign_sequence_progress ADD CONSTRAINT uq_seq_contact UNIQUE (sequence_id, contact_id);
    END IF;
END $$;

ALTER TABLE campaign_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sequence_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "org_members_sequences" ON campaign_sequences FOR ALL USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_sequences_campaign ON campaign_sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON campaign_sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_progress_sequence ON campaign_sequence_progress(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_progress_next ON campaign_sequence_progress(next_action_at) WHERE status = 'active';

-- ============================================================================
-- SECTION 25: API KEYS
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "api_keys_select_org_members" ON api_keys FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 26: WEBHOOKS
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    secret TEXT NOT NULL,
    description TEXT,
    event_types TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    status_code INT,
    response_body TEXT,
    success BOOLEAN DEFAULT false,
    attempted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "org_members_webhook_endpoints" ON webhook_endpoints FOR ALL USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "org_members_webhook_deliveries" ON webhook_deliveries FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_org ON webhook_endpoints(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(webhook_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_org ON webhook_deliveries(organization_id);

-- ============================================================================
-- SECTION 27: SUPPORT TICKETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL DEFAULT 'TKT-000',
    organization_id UUID REFERENCES organizations(id),
    organization_name TEXT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    category TEXT DEFAULT 'technical',
    department TEXT DEFAULT 'technical',
    assigned_to TEXT,
    client_email TEXT,
    client_phone TEXT,
    starred BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    author_type TEXT DEFAULT 'support',
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "platform_owners_support_tickets" ON support_tickets FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid()
            AND p.role IN ('platform_owner', 'agency_owner', 'agency_admin')
        )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "org_members_own_tickets" ON support_tickets FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id);

CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1;

-- ============================================================================
-- SECTION 28: SCHEDULED REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    report_type TEXT NOT NULL DEFAULT 'usage',
    frequency TEXT NOT NULL DEFAULT 'weekly',
    day_of_week INT,
    day_of_month INT,
    recipients TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "org_members_scheduled_reports" ON scheduled_reports FOR ALL USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_org ON scheduled_reports(organization_id);

-- ============================================================================
-- SECTION 29: USAGE ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_alerts_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    threshold_value NUMERIC,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    period_start TIMESTAMPTZ
);

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_usage_alert') THEN
        ALTER TABLE usage_alerts_sent ADD CONSTRAINT uq_usage_alert UNIQUE (organization_id, alert_type, period_start);
    END IF;
END $$;

ALTER TABLE usage_alerts_sent ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "usage_alerts_select_org_members" ON usage_alerts_sent FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_usage_alerts_org ON usage_alerts_sent(organization_id, alert_type);

-- ============================================================================
-- SECTION 30: RPC FUNCTIONS (CREATE OR REPLACE — always safe)
-- ============================================================================

-- 30a. apply_ledger_entry (Atomic credit operations)
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
    INSERT INTO credits_ledger (
        organization_id, amount, type, description, reference_id, metadata, created_at
    ) VALUES (
        p_organization_id, p_amount, p_type, p_description, p_reference_id, p_metadata, now()
    )
    ON CONFLICT (organization_id, reference_id, type) DO NOTHING
    RETURNING id INTO v_ledger_id;

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
        SELECT credit_balance INTO v_new_balance
        FROM organizations WHERE id = p_organization_id;

        RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'message', 'Already processed');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 30b. record_credit_usage (Credit-based billing deduction)
CREATE OR REPLACE FUNCTION record_credit_usage(
    p_organization_id UUID,
    p_credits INTEGER,
    p_action_type TEXT,
    p_unit_count NUMERIC DEFAULT 0,
    p_description TEXT DEFAULT '',
    p_reference_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
    v_org RECORD;
    v_usage RECORD;
    v_credits_remaining INTEGER;
    v_from_included INTEGER;
    v_from_balance INTEGER;
    v_balance_deducted NUMERIC;
    v_period_start TIMESTAMPTZ;
BEGIN
    SELECT included_credits, subscription_period_start, overage_credit_price, credit_balance, subscription_status
    INTO v_org FROM organizations WHERE id = p_organization_id FOR UPDATE;

    IF v_org IS NULL THEN
        RETURN jsonb_build_object('error', 'Organization not found');
    END IF;

    v_period_start := COALESCE(v_org.subscription_period_start, date_trunc('month', now()));

    INSERT INTO subscription_usage (
        organization_id, period_start, period_end, minutes_used, calls_count, credits_used, credits_included
    ) VALUES (
        p_organization_id, v_period_start, v_period_start + interval '1 month',
        0, 0, 0, COALESCE(v_org.included_credits, 200000)
    )
    ON CONFLICT (organization_id, period_start) DO NOTHING;

    SELECT credits_used, credits_included INTO v_usage
    FROM subscription_usage
    WHERE organization_id = p_organization_id AND period_start = v_period_start;

    v_credits_remaining := COALESCE(v_usage.credits_included, v_org.included_credits) - COALESCE(v_usage.credits_used, 0);

    IF v_credits_remaining >= p_credits THEN
        v_from_included := p_credits; v_from_balance := 0;
    ELSIF v_credits_remaining > 0 THEN
        v_from_included := v_credits_remaining; v_from_balance := p_credits - v_credits_remaining;
    ELSE
        v_from_included := 0; v_from_balance := p_credits;
    END IF;

    UPDATE subscription_usage
    SET credits_used = COALESCE(credits_used, 0) + p_credits,
        overage_credits_used = COALESCE(overage_credits_used, 0) + v_from_balance,
        updated_at = now()
    WHERE organization_id = p_organization_id AND period_start = v_period_start;

    v_balance_deducted := 0;
    IF v_from_balance > 0 THEN
        v_balance_deducted := v_from_balance * COALESCE(v_org.overage_credit_price, 0.012);
        PERFORM apply_ledger_entry(
            p_organization_id, -v_balance_deducted, 'credit_overage', p_description, p_reference_id,
            p_metadata || jsonb_build_object('credits', v_from_balance, 'action_type', p_action_type, 'credit_rate', v_org.overage_credit_price)
        );
    END IF;

    INSERT INTO credits_ledger (
        organization_id, credits, action_type, unit_count,
        type, amount, description, reference_id, metadata, created_at
    ) VALUES (
        p_organization_id, -p_credits, p_action_type, p_unit_count,
        'credit_usage', -v_balance_deducted, p_description, p_reference_id,
        p_metadata || jsonb_build_object('from_included', v_from_included, 'from_balance', v_from_balance),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'credits_charged', p_credits,
        'from_included', v_from_included,
        'from_balance', v_from_balance,
        'balance_deducted_gbp', v_balance_deducted,
        'credits_remaining', GREATEST(0, v_credits_remaining - p_credits),
        'total_credits_used', COALESCE(v_usage.credits_used, 0) + p_credits
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 30c. check_credits_allowed (Pre-action credit check)
CREATE OR REPLACE FUNCTION check_credits_allowed(
    p_organization_id UUID,
    p_credits_needed INTEGER DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
    v_org RECORD;
    v_credits_used INTEGER;
    v_credits_remaining INTEGER;
    v_period_start TIMESTAMPTZ;
BEGIN
    SELECT included_credits, subscription_status, credit_balance, overage_credit_price,
           subscription_period_start, ai_employees, plan_tier_id
    INTO v_org FROM organizations WHERE id = p_organization_id;

    IF v_org IS NULL THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'Organization not found');
    END IF;

    IF COALESCE(v_org.subscription_status, 'trialing') NOT IN ('active', 'trialing') THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'Subscription is ' || COALESCE(v_org.subscription_status, 'inactive'));
    END IF;

    v_period_start := COALESCE(v_org.subscription_period_start, date_trunc('month', now()));

    SELECT COALESCE(credits_used, 0) INTO v_credits_used
    FROM subscription_usage WHERE organization_id = p_organization_id AND period_start = v_period_start;

    v_credits_used := COALESCE(v_credits_used, 0);
    v_credits_remaining := COALESCE(v_org.included_credits, 200000) - v_credits_used;

    IF v_credits_remaining >= p_credits_needed THEN
        RETURN jsonb_build_object('allowed', true, 'source', 'included', 'credits_remaining', v_credits_remaining, 'balance', COALESCE(v_org.credit_balance, 0));
    END IF;

    IF COALESCE(v_org.credit_balance, 0) > 0 THEN
        RETURN jsonb_build_object('allowed', true, 'source', 'balance', 'credits_remaining', v_credits_remaining, 'balance', v_org.credit_balance);
    END IF;

    RETURN jsonb_build_object('allowed', false, 'reason', 'No credits remaining.', 'credits_remaining', v_credits_remaining, 'balance', COALESCE(v_org.credit_balance, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 30d. record_call_usage (Minutes-based usage tracking)
CREATE OR REPLACE FUNCTION record_call_usage(
    p_organization_id UUID,
    p_duration_seconds INTEGER,
    p_call_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_org RECORD;
    v_usage RECORD;
    v_minutes NUMERIC;
    v_included_minutes INTEGER;
    v_overage_before NUMERIC;
    v_overage_after NUMERIC;
BEGIN
    SELECT plan, included_minutes, subscription_period_start, subscription_period_end,
           overage_rate_per_minute, subscription_status
    INTO v_org FROM organizations WHERE id = p_organization_id;

    IF v_org IS NULL THEN RETURN jsonb_build_object('error', 'Organization not found'); END IF;

    v_minutes := ROUND(p_duration_seconds / 60.0, 2);
    v_included_minutes := COALESCE(v_org.included_minutes, 1000);

    SELECT GREATEST(0, minutes_used - v_included_minutes) INTO v_overage_before
    FROM subscription_usage
    WHERE organization_id = p_organization_id
      AND period_start = COALESCE(v_org.subscription_period_start, date_trunc('month', now()));
    v_overage_before := COALESCE(v_overage_before, 0);

    INSERT INTO subscription_usage (organization_id, period_start, period_end, minutes_used, calls_count)
    VALUES (
        p_organization_id,
        COALESCE(v_org.subscription_period_start, date_trunc('month', now())),
        COALESCE(v_org.subscription_period_end, date_trunc('month', now()) + interval '1 month'),
        v_minutes, 1
    )
    ON CONFLICT (organization_id, period_start) DO UPDATE SET
        minutes_used = subscription_usage.minutes_used + v_minutes,
        calls_count = subscription_usage.calls_count + 1,
        updated_at = now()
    RETURNING * INTO v_usage;

    v_overage_after := GREATEST(0, v_usage.minutes_used - v_included_minutes);

    UPDATE subscription_usage SET overage_minutes = v_overage_after WHERE id = v_usage.id;

    RETURN jsonb_build_object(
        'success', true, 'minutes_used', v_usage.minutes_used,
        'included_minutes', v_included_minutes, 'overage_minutes', v_overage_after,
        'calls_count', v_usage.calls_count, 'plan', v_org.plan
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 30e. check_call_allowed (Pre-call verification)
CREATE OR REPLACE FUNCTION check_call_allowed(
    p_organization_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_org RECORD;
    v_minutes_used NUMERIC;
    v_included_minutes INTEGER;
BEGIN
    SELECT plan, subscription_status, included_minutes, max_concurrent_calls,
           overage_rate_per_minute, credit_balance, subscription_period_start
    INTO v_org FROM organizations WHERE id = p_organization_id;

    IF v_org IS NULL THEN RETURN jsonb_build_object('allowed', false, 'reason', 'Organization not found'); END IF;

    IF COALESCE(v_org.subscription_status, 'trialing') NOT IN ('active', 'trialing') THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'Subscription is ' || COALESCE(v_org.subscription_status, 'inactive'));
    END IF;

    SELECT minutes_used INTO v_minutes_used FROM subscription_usage
    WHERE organization_id = p_organization_id
      AND period_start = COALESCE(v_org.subscription_period_start, date_trunc('month', now()));

    v_minutes_used := COALESCE(v_minutes_used, 0);
    v_included_minutes := COALESCE(v_org.included_minutes, 1000);

    IF v_minutes_used >= v_included_minutes AND COALESCE(v_org.credit_balance, 0) <= 0 THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'No minutes or credits remaining.',
            'minutes_used', v_minutes_used, 'included_minutes', v_included_minutes);
    END IF;

    RETURN jsonb_build_object('allowed', true, 'minutes_used', v_minutes_used,
        'included_minutes', v_included_minutes,
        'remaining_minutes', GREATEST(0, v_included_minutes - v_minutes_used),
        'credit_balance', COALESCE(v_org.credit_balance, 0), 'plan', v_org.plan);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 30f. reserve_campaign_items (Concurrency-aware batch reservation)
CREATE OR REPLACE FUNCTION reserve_campaign_items(
    p_batch_size INTEGER,
    p_worker_id TEXT
) RETURNS TABLE (
    id UUID,
    campaign_id UUID,
    contact_id UUID,
    organization_id UUID,
    attempt_count INTEGER
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    WITH active_counts AS (
        SELECT ci.campaign_id, COUNT(*)::int as current_active
        FROM campaign_items ci
        WHERE ci.status IN ('queued', 'in_progress')
        GROUP BY ci.campaign_id
    )
    UPDATE campaign_items
    SET status = 'queued', reserved_at = now(), reserved_by = p_worker_id, updated_at = now()
    WHERE campaign_items.id IN (
        SELECT ci.id
        FROM campaign_items ci
        JOIN campaigns c ON ci.campaign_id = c.id
        LEFT JOIN active_counts ac ON c.id = ac.campaign_id
        WHERE ci.status = 'pending' AND ci.next_try_at <= now()
          AND c.status = 'running'
          AND COALESCE(ac.current_active, 0) < c.concurrency_limit
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    )
    RETURNING campaign_items.id, campaign_items.campaign_id, campaign_items.contact_id,
              campaign_items.organization_id, campaign_items.attempt_count;
END;
$$;

-- 30g. get_daily_spend (Circuit breaker)
CREATE OR REPLACE FUNCTION get_daily_spend(p_organization_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_spend NUMERIC;
BEGIN
    SELECT COALESCE(SUM(cost), 0) INTO v_spend FROM voice_calls
    WHERE organization_id = p_organization_id AND created_at > (now() - INTERVAL '24 hours');
    RETURN v_spend;
END;
$$;

-- 30h. get_organization_balance (Balance lookup)
CREATE OR REPLACE FUNCTION get_organization_balance(p_organization_id UUID)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_balance NUMERIC;
BEGIN
    SELECT COALESCE(credit_balance, 0) INTO v_balance FROM organizations WHERE id = p_organization_id;
    RETURN COALESCE(v_balance, 0.00);
END;
$$;

-- 30i. get_credits_used_this_period (Frontend calls this via .rpc())
CREATE OR REPLACE FUNCTION get_credits_used_this_period(p_organization_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_period_start TIMESTAMPTZ;
    v_used INTEGER;
BEGIN
    SELECT COALESCE(subscription_period_start, date_trunc('month', now()))
    INTO v_period_start FROM organizations WHERE id = p_organization_id;

    SELECT COALESCE(credits_used, 0) INTO v_used
    FROM subscription_usage
    WHERE organization_id = p_organization_id AND period_start = v_period_start;

    RETURN COALESCE(v_used, 0);
END;
$$;

-- ============================================================================
-- SECTION 31: TRIGGER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_audit_log_safe()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_actor_id UUID;
    v_changed_fields TEXT[] := ARRAY[]::TEXT[];
    v_old_json JSONB;
    v_new_json JSONB;
BEGIN
    IF (TG_OP = 'DELETE') THEN v_org_id := OLD.organization_id;
    ELSE v_org_id := NEW.organization_id; END IF;

    v_actor_id := auth.uid();

    IF (TG_OP = 'UPDATE') THEN
        v_old_json := to_jsonb(OLD); v_new_json := to_jsonb(NEW);
        SELECT array_agg(key) INTO v_changed_fields
        FROM jsonb_each(v_new_json) AS n(key, value)
        WHERE n.value IS DISTINCT FROM v_old_json -> n.key;
    END IF;

    INSERT INTO audit_logs (organization_id, actor_id, resource_type, resource_id, action, changed_fields)
    VALUES (v_org_id, v_actor_id, TG_TABLE_NAME::text, COALESCE(NEW.id, OLD.id), TG_OP, v_changed_fields);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_voice_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 32: TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_voice_files_updated_at ON voice_files;
CREATE TRIGGER update_voice_files_updated_at BEFORE UPDATE ON voice_files
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_tools_updated_at ON voice_tools;
CREATE TRIGGER update_voice_tools_updated_at BEFORE UPDATE ON voice_tools
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_squads_updated_at ON voice_squads;
CREATE TRIGGER update_voice_squads_updated_at BEFORE UPDATE ON voice_squads
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_call_events_updated_at ON voice_call_events;
CREATE TRIGGER update_voice_call_events_updated_at BEFORE UPDATE ON voice_call_events
    FOR EACH ROW EXECUTE PROCEDURE update_voice_events_updated_at();

DROP TRIGGER IF EXISTS audit_campaigns ON campaigns;
CREATE TRIGGER audit_campaigns AFTER INSERT OR UPDATE OR DELETE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log_safe();

DROP TRIGGER IF EXISTS audit_contacts ON contacts;
CREATE TRIGGER audit_contacts AFTER INSERT OR UPDATE OR DELETE ON contacts
    FOR EACH ROW EXECUTE FUNCTION trigger_audit_log_safe();

-- ============================================================================
-- SECTION 33: PERFORMANCE INDEXES (additional)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_credit_rates_action ON credit_rates (action_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_plan_tiers_active ON plan_tiers (id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_org_plan_tier ON organizations (plan_tier_id);
CREATE INDEX IF NOT EXISTS idx_org_parent ON organizations (parent_organization_id) WHERE parent_organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_credits ON credits_ledger (organization_id, action_type) WHERE credits IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_sub ON organizations (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voice_calls_campaign_id ON voice_calls(campaign_id);

-- ============================================================================
-- SECTION 34: SET DEFAULTS FOR EXISTING DATA
-- ============================================================================

-- Ensure existing orgs have starter defaults
UPDATE organizations
SET plan = COALESCE(plan, 'starter'),
    subscription_status = COALESCE(subscription_status, 'trialing'),
    included_minutes = COALESCE(included_minutes, 1000),
    max_phone_numbers = COALESCE(max_phone_numbers, 3),
    max_assistants = COALESCE(max_assistants, 5),
    max_concurrent_calls = COALESCE(max_concurrent_calls, 5),
    max_users = COALESCE(max_users, 5),
    overage_rate_per_minute = COALESCE(overage_rate_per_minute, 0.15),
    included_credits = COALESCE(included_credits, 200000),
    credits_used_this_period = COALESCE(credits_used_this_period, 0),
    overage_credit_price = COALESCE(overage_credit_price, 0.012),
    ai_employees = COALESCE(ai_employees, 1),
    plan_tier_id = COALESCE(plan_tier_id, 'employee_1'),
    org_type = COALESCE(org_type, 'direct'),
    settings = COALESCE(settings, '{}'::jsonb),
    activation_checklist = COALESCE(activation_checklist, '{}'::jsonb)
WHERE plan IS NULL OR plan_tier_id IS NULL OR settings IS NULL;

-- Mark existing profiles as onboarded (they're already past onboarding)
UPDATE profiles
SET onboarding_completed = true
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- ============================================================================
-- SECTION 35: PLATFORM-OWNER READ-ALL POLICIES
-- ============================================================================

-- Allow platform owners to read all organizations
DO $$ BEGIN
    CREATE POLICY "Platform owners can read all orgs" ON organizations
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_owner')
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow platform owners to read all profiles
DO $$ BEGIN
    CREATE POLICY "Platform owners can read all profiles" ON profiles
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_owner')
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow platform owners to read all voice calls
DO $$ BEGIN
    CREATE POLICY "Platform owners can view all calls" ON voice_calls
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_owner')
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow platform owners to read all campaigns
DO $$ BEGIN
    CREATE POLICY "Platform owners can view all campaigns" ON campaigns
        FOR SELECT USING (
            EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'platform_owner')
        );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- DONE!
-- Verify: SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- ============================================================================
