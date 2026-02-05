-- Fix phone_numbers table by adding missing columns
-- Run this if you get "column does not exist" errors

-- Add missing columns to phone_numbers table
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS current_campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS max_calls_per_hour INTEGER DEFAULT 60;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS max_calls_per_day INTEGER DEFAULT 500;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS current_hour_calls INTEGER DEFAULT 0;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS current_day_calls INTEGER DEFAULT 0;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS rate_limit_reset_hour TIMESTAMP WITH TIME ZONE;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS rate_limit_reset_day TIMESTAMP WITH TIME ZONE;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS monthly_cost DECIMAL(10, 2) DEFAULT 0;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS per_minute_cost DECIMAL(10, 4) DEFAULT 0.01;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS billing_type VARCHAR(50) DEFAULT 'metered';

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{}';

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS tags TEXT[];

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS friendly_name VARCHAR(255);

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(5) DEFAULT '+1';

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS area_code VARCHAR(10);

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'vapi';

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS provider_sid VARCHAR(255);

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT true;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS mms_enabled BOOLEAN DEFAULT false;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS fax_enabled BOOLEAN DEFAULT false;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_phone_numbers_is_available ON phone_numbers(is_available);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_current_campaign_id ON phone_numbers(current_campaign_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_provider ON phone_numbers(provider);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_phone_number ON phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_last_used_at ON phone_numbers(last_used_at);

-- Update existing records to have default values
UPDATE phone_numbers 
SET 
  is_available = COALESCE(is_available, true),
  max_calls_per_hour = COALESCE(max_calls_per_hour, 60),
  max_calls_per_day = COALESCE(max_calls_per_day, 500),
  current_hour_calls = COALESCE(current_hour_calls, 0),
  current_day_calls = COALESCE(current_day_calls, 0),
  monthly_cost = COALESCE(monthly_cost, 0),
  per_minute_cost = COALESCE(per_minute_cost, 0.01),
  billing_type = COALESCE(billing_type, 'metered'),
  capabilities = COALESCE(capabilities, '{}'),
  settings = COALESCE(settings, '{}'),
  provider = COALESCE(provider, 'vapi'),
  voice_enabled = COALESCE(voice_enabled, true),
  sms_enabled = COALESCE(sms_enabled, false),
  mms_enabled = COALESCE(mms_enabled, false),
  fax_enabled = COALESCE(fax_enabled, false),
  country_code = COALESCE(country_code, '+1')
WHERE true;

-- Check the current structure
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'phone_numbers'
ORDER BY ordinal_position;