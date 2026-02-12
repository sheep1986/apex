-- Phase 3.8: Enterprise Visibility Layer - Missing Tables

-- 1. Call State Transitions (for Timeline)
CREATE TABLE IF NOT EXISTS call_state_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    call_id UUID NOT NULL REFERENCES voice_calls(id),
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    trigger_source TEXT DEFAULT 'system', -- 'system', 'user', 'provider'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for timeline lookup
CREATE INDEX IF NOT EXISTS idx_call_state_transitions_call_id ON call_state_transitions(call_id);

-- RLS
ALTER TABLE call_state_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view transitions in their org" ON call_state_transitions
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- 2. Workflow Hook Logs (for Hook Monitor)
-- Pre-requisite: workflow_hooks table check (handled by IF NOT EXISTS logic in application or separate migration if truly missing. 
-- Assuming workflow_hooks might be needed if grep failed, but sticking to logs first as requested by HookMonitor).

CREATE TABLE IF NOT EXISTS workflow_hook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    hook_id UUID, -- Nullable if hook deleted, but normally FK
    call_id UUID REFERENCES voice_calls(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    attempt_count INTEGER DEFAULT 0,
    last_response_code INTEGER,
    request_payload JSONB,
    response_body TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for monitor
CREATE INDEX IF NOT EXISTS idx_workflow_hook_logs_org_created ON workflow_hook_logs(organization_id, created_at DESC);

-- RLS
ALTER TABLE workflow_hook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view hook logs" ON workflow_hook_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'developer')
        )
    );
