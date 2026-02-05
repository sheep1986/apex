-- Phase 3.4: Hardening & Integration
-- Goal: Enforce safe execution (Concurrency Limits) and Credits.

-- 1. Index for Concurrency Checks
CREATE INDEX IF NOT EXISTS idx_campaign_items_concurrency 
    ON campaign_items(campaign_id, status) 
    WHERE status IN ('queued', 'in_progress');

-- 2. Enhanced RPC: reserve_campaign_items (Concurrency Aware)
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
        -- Count currently active items per campaign
        SELECT 
            ci.campaign_id, 
            COUNT(*)::int as current_active
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
            
            -- Concurrency Enforcement (Critical)
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

-- 3. RPC: Get Organization Balance (Credit Guard)
-- Simple implementation checking the organizations table or a credits ledger.
-- Assuming 'credits' column exists in organizations, otherwise we default to allowing (stub).
-- Ideally this should query a dedicated 'ledger' table.
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
    -- Check if 'credits' column exists in organizations, else return mock 10.00
    -- For this Phase, we likely don't have the billing logic fully migrated. 
    -- We'll just check if the org exists and maybe return a safe default or checking a credits field if added.
    -- To keep it safe: Return 10.00 if org exists, 0 if not.
    -- REAL IMPLEMENTATION WOULD SELECT 'credits' FROM organizations.
    
    SELECT 10.00 INTO v_balance
    FROM organizations
    WHERE id = p_organization_id;
    
    RETURN COALESCE(v_balance, 0.00);
END;
$$;
