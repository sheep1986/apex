-- Phase 3.7: Enterprise Control & Scale
-- Objectives: Kill Switches, Circuit Breakers, State Machine, Provider Abstraction.

-- 1. Organization Controls (Kill Switches)
-- One-to-one extension of organizations table for high-stakes controls.
CREATE TABLE IF NOT EXISTS organization_controls (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    is_suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    shadow_mode BOOLEAN DEFAULT false, -- If true, system MOCKS dispatch (Safety/Audit mode)
    max_concurrency_override INTEGER, -- If set, overrides campaign limits
    compliance_level TEXT DEFAULT 'standard', -- 'standard', 'hipaa', 'pci_dss'
    daily_spend_limit_usd NUMERIC DEFAULT 100.00, -- Circuit breaker limit
    alert_threshold_percent INTEGER DEFAULT 80,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Service Role & Admin Read Only
ALTER TABLE organization_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view controls" ON organization_controls
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));
    
-- 2. Call State Transitions (Audit Trail)
-- Immutable ledger of call states
CREATE TABLE IF NOT EXISTS call_state_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_call_id UUID NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
    from_state TEXT,
    to_state TEXT NOT NULL,
    actor TEXT DEFAULT 'system', -- 'provider_webhook', 'system_gc', 'user_action'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Service Role Only (Strict Audit)
ALTER TABLE call_state_transitions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON call_state_transitions FROM anon;
REVOKE ALL ON call_state_transitions FROM authenticated;

-- 3. Workflow Hooks (Outcome Automation)
CREATE TABLE IF NOT EXISTS workflow_hooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    trigger_condition JSONB NOT NULL, -- e.g. { "outcome": "Appointment Set" }
    action_type TEXT NOT NULL, -- 'webhook', 'crm_update'
    action_config JSONB NOT NULL, -- { "url": "..." }
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Admins Manage their hooks
ALTER TABLE workflow_hooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage hooks" ON workflow_hooks
    FOR ALL USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- 4. PAL (Provider Abstraction) Updates
-- Update Assistants to support Generic Provider Refs
ALTER TABLE assistants 
ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'vapi', -- 'vapi', 'twilio', 'mock'
ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}'::jsonb;

-- Migrating old 'provider_assistant_id' to generic structure if needed, 
-- but for now we keep 'provider_assistant_id' as the generic ref (it's already a text/uuid).

-- 5. Helper Function: Check Circuit Breaker
-- Returns current usage for last 24h
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
