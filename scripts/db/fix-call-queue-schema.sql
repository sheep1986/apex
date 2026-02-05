-- First check what columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'call_queue';

-- Add missing columns to call_queue table
ALTER TABLE call_queue 
ADD COLUMN IF NOT EXISTS attempt INTEGER DEFAULT 1;

ALTER TABLE call_queue 
ADD COLUMN IF NOT EXISTS contact_id TEXT;

ALTER TABLE call_queue 
ADD COLUMN IF NOT EXISTS contact_name TEXT;

ALTER TABLE call_queue 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE call_queue 
ADD COLUMN IF NOT EXISTS last_call_id TEXT;

ALTER TABLE call_queue 
ADD COLUMN IF NOT EXISTS last_outcome TEXT;

ALTER TABLE call_queue 
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE call_queue 
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_call_queue_campaign_id ON call_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_queue_status ON call_queue(status);
CREATE INDEX IF NOT EXISTS idx_call_queue_scheduled_for ON call_queue(scheduled_for);

-- Check the updated schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'call_queue'
ORDER BY ordinal_position;