-- Campaign Capacity & Credit-Gate Enhancements

-- Add paused_reason to campaigns for credit-gate and schedule pausing
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS paused_reason TEXT;
-- Values: 'insufficient_credits', 'manual', 'schedule_ended', null

-- Add schedule_config JSONB if not present (may already exist)
-- ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT '{}'::jsonb;

-- Index for quickly finding paused campaigns to resume
CREATE INDEX IF NOT EXISTS idx_campaigns_paused ON campaigns(organization_id, status) WHERE status = 'paused';

-- Index for credit-gate: quickly find running campaigns per org
CREATE INDEX IF NOT EXISTS idx_campaigns_running ON campaigns(organization_id, status) WHERE status = 'running';
