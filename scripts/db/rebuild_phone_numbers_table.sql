-- Complete rebuild of phone_numbers table
-- Your current table only has 2 columns, so we'll drop and recreate it properly

-- Step 1: Drop the existing table (it only has 2 columns anyway)
DROP TABLE IF EXISTS phone_numbers CASCADE;

-- Step 2: Create the table with the correct structure
CREATE TABLE phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  
  -- Phone number details (no underscores!)
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  friendly_name VARCHAR(255),
  country_code VARCHAR(5) DEFAULT '+1',
  area_code VARCHAR(10),
  
  -- Provider information
  provider VARCHAR(50) DEFAULT 'vapi',
  provider_id VARCHAR(255),
  provider_sid VARCHAR(255),
  
  -- Configuration
  voice_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  mms_enabled BOOLEAN DEFAULT false,
  fax_enabled BOOLEAN DEFAULT false,
  
  -- Usage and status
  status VARCHAR(50) DEFAULT 'active',
  is_available BOOLEAN DEFAULT true,
  current_campaign_id UUID,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Rate limiting
  max_calls_per_hour INTEGER DEFAULT 60,
  max_calls_per_day INTEGER DEFAULT 500,
  current_hour_calls INTEGER DEFAULT 0,
  current_day_calls INTEGER DEFAULT 0,
  rate_limit_reset_hour TIMESTAMP WITH TIME ZONE,
  rate_limit_reset_day TIMESTAMP WITH TIME ZONE,
  
  -- Cost tracking
  monthly_cost DECIMAL(10, 2) DEFAULT 0,
  per_minute_cost DECIMAL(10, 4) DEFAULT 0.01,
  billing_type VARCHAR(50) DEFAULT 'metered',
  
  -- Capabilities
  capabilities JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Step 3: Create indexes
CREATE INDEX idx_phone_numbers_organization_id ON phone_numbers(organization_id);
CREATE INDEX idx_phone_numbers_status ON phone_numbers(status);
CREATE INDEX idx_phone_numbers_is_available ON phone_numbers(is_available);
CREATE INDEX idx_phone_numbers_phone_number ON phone_numbers(phone_number);

-- Step 4: Enable RLS (Row Level Security)
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
CREATE POLICY "Enable all operations for authenticated users"
  ON phone_numbers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 5: Insert sample phone numbers
INSERT INTO phone_numbers (
  organization_id,
  phone_number,
  friendly_name,
  country_code,
  area_code,
  provider,
  provider_id,
  status,
  is_available,
  capabilities
) VALUES 
  (
    '2566d8c5-2245-4a3c-b539-4cea21a07d9b', -- Emerald Green Energy
    '+14155551234',
    'Main Sales Line',
    '+1',
    '415',
    'vapi',
    'vapi_phone_abc123',
    'active',
    true,
    '{"voice": true, "sms": false, "recording": true, "transcription": true}'::jsonb
  ),
  (
    '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
    '+14155551235',
    'Sales Line 2',
    '+1',
    '415',
    'vapi',
    'vapi_phone_def456',
    'active',
    true,
    '{"voice": true, "sms": false, "recording": true, "transcription": true}'::jsonb
  ),
  (
    '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
    '+14155551236',
    'Support Line',
    '+1',
    '415',
    'vapi',
    'vapi_phone_ghi789',
    'active',
    true,
    '{"voice": true, "sms": false, "recording": true, "transcription": true}'::jsonb
  ),
  (
    '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
    '+442079461234',
    'UK Sales Line',
    '+44',
    '207',
    'vapi',
    'vapi_phone_uk001',
    'active',
    true,
    '{"voice": true, "sms": false, "recording": true, "transcription": true}'::jsonb
  );

-- Step 6: Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'phone_numbers'
ORDER BY ordinal_position;

-- Step 7: Show the inserted data
SELECT 
    id,
    phone_number,
    friendly_name,
    status,
    is_available,
    provider,
    organization_id
FROM phone_numbers
ORDER BY created_at;