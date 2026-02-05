-- Phase 3.6: Control & Governance Layer
-- Goal: Audit Logs (PII-Safe), Outcomes, and Runtime Configs.

-- 1. Assistant Runtime Config
ALTER TABLE assistants 
ADD COLUMN IF NOT EXISTS runtime_config JSONB DEFAULT '{
    "max_duration_seconds": 600,
    "cost_limit_usd": 5.00,
    "model_whitelist": ["gpt-4", "gpt-3.5-turbo"],
    "compliance_mode": true
}'::jsonb;

-- 2. Outcome Rules
CREATE TABLE IF NOT EXISTS conversation_outcome_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    trigger_pattern TEXT NOT NULL, -- Regex or Keywords
    outcome_label TEXT NOT NULL, -- The resulting status
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority runs first
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Correct WITH CHECK policies
ALTER TABLE conversation_outcome_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view rules in their org" ON conversation_outcome_rules
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
    
CREATE POLICY "Users can manage rules in their org" ON conversation_outcome_rules
    FOR ALL 
    USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))
    WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- 3. Audit Logging (PII-Safe)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    actor_id UUID, -- User ID or System ID
    resource_type TEXT NOT NULL, -- 'campaign', 'contact', 'call'
    resource_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete'
    changed_fields TEXT[], -- LIST OF COLUMN NAMES ONLY (No Values)
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Read Only for Admins
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );
-- System inserts via bypass/trigger, so no insert policy needed for users.

-- 4. Audit Trigger Function (Safe)
-- Only logs which keys changed, not the values.
CREATE OR REPLACE FUNCTION trigger_audit_log_safe()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_actor_id UUID;
    v_changed_fields TEXT[] := ARRAY[]::TEXT[];
    v_col TEXT;
    v_old_json JSONB;
    v_new_json JSONB;
BEGIN
    -- Determine Org ID
    IF (TG_OP = 'DELETE') THEN
        v_org_id := OLD.organization_id;
    ELSE
        v_org_id := NEW.organization_id;
    END IF;

    -- Get Actor
    v_actor_id := auth.uid();

    -- Calculate Changed Fields (Naive approach using JSONB)
    IF (TG_OP = 'UPDATE') THEN
        v_old_json := to_jsonb(OLD);
        v_new_json := to_jsonb(NEW);
        
        -- Iterate keys and compare
        -- Note: PLPGSQL iteration over keys is verbose, simplified here:
        SELECT array_agg(key) INTO v_changed_fields
        FROM jsonb_each(v_new_json) AS n(key, value)
        WHERE n.value IS DISTINCT FROM v_old_json -> n.key;
    END IF;

    INSERT INTO audit_logs (
        organization_id,
        actor_id,
        resource_type,
        resource_id,
        action,
        changed_fields
    ) VALUES (
        v_org_id,
        v_actor_id,
        TG_TABLE_NAME::text,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        v_changed_fields
    );
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Safe Triggers
DROP TRIGGER IF EXISTS audit_campaigns ON campaigns;
CREATE TRIGGER audit_campaigns
AFTER INSERT OR UPDATE OR DELETE ON campaigns
FOR EACH ROW EXECUTE FUNCTION trigger_audit_log_safe();

DROP TRIGGER IF EXISTS audit_contacts ON contacts;
CREATE TRIGGER audit_contacts
AFTER INSERT OR UPDATE OR DELETE ON contacts
FOR EACH ROW EXECUTE FUNCTION trigger_audit_log_safe();
