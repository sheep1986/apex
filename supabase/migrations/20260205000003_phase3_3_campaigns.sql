-- Phase 3.3: Outbound Campaigns (Robust Execution Engine)
-- Goal: Zero-Trace, Robust Job Queue for Outbound Dialing

-- 1. Campaigns Table (The Job Container)
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'running', 'paused', 'completed', 'archived'
    type TEXT DEFAULT 'voice_broadcast',
    script_config JSONB DEFAULT '{}'::jsonb, -- prompt, voice, etc.
    schedule_config JSONB DEFAULT '{}'::jsonb, -- active hours
    concurrency_limit INTEGER DEFAULT 1, -- Pacing
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for Campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view campaigns in their org" ON campaigns
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert campaigns in their org" ON campaigns
    FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update campaigns in their org" ON campaigns
    FOR UPDATE USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- 2. Campaign Items (The Work Queue)
CREATE TABLE IF NOT EXISTS campaign_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    contact_id UUID REFERENCES contacts(id),
    
    -- Execution State
    status TEXT DEFAULT 'pending', -- 'pending', 'queued', 'in_progress', 'completed', 'failed', 'skipped'
    attempt_count INTEGER DEFAULT 0, -- Spec compliance
    next_try_at TIMESTAMPTZ DEFAULT now(),
    last_error TEXT,
    
    -- Reservation / Locking
    reserved_at TIMESTAMPTZ, -- For timeout handling
    reserved_by TEXT, -- Worker Instance ID
    
    -- Result (Linked to Telephony)
    voice_call_id UUID REFERENCES voice_calls(id), -- Spec compliance
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Constraints
    CONSTRAINT uq_campaign_id_contact_id UNIQUE (campaign_id, contact_id)
);

-- Indices for Job Runner
CREATE INDEX IF NOT EXISTS idx_campaign_items_runner 
    ON campaign_items(status, next_try_at) 
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_campaign_items_campaign 
    ON campaign_items(campaign_id);

-- RLS for Items
ALTER TABLE campaign_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view items in their org" ON campaign_items
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert items in their org" ON campaign_items
    FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- 3. Voice Calls Update (Link to Campaign)
ALTER TABLE voice_calls
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_campaign_id ON voice_calls(campaign_id);

-- 4. RPC: Atomic Reservation (Critical for Concurrency)
-- Hardened: SECURITY DEFINER + Search Path
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
        WHERE ci.status = 'pending'
          AND ci.next_try_at <= now()
          AND c.status = 'running'
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
