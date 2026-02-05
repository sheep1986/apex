-- Complete phone_numbers table creation
-- This will DROP and RECREATE the table if it exists with wrong structure

-- First, check if the table exists
DO $$ 
BEGIN
    -- Drop the table if it exists (BE CAREFUL - this will delete all data!)
    -- Comment out these lines if you want to preserve existing data
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'phone_numbers'
    ) THEN
        DROP TABLE phone_numbers CASCADE;
        RAISE NOTICE 'Dropped existing phone_numbers table';
    END IF;
END $$;

-- Now create the table fresh
CREATE TABLE phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  
  -- Phone number details
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

-- Create indexes
CREATE INDEX idx_phone_numbers_organization_id ON phone_numbers(organization_id);
CREATE INDEX idx_phone_numbers_status ON phone_numbers(status);
CREATE INDEX idx_phone_numbers_is_available ON phone_numbers(is_available);
CREATE INDEX idx_phone_numbers_current_campaign_id ON phone_numbers(current_campaign_id);
CREATE INDEX idx_phone_numbers_provider ON phone_numbers(provider);
CREATE INDEX idx_phone_numbers_phone_number ON phone_numbers(phone_number);
CREATE INDEX idx_phone_numbers_last_used_at ON phone_numbers(last_used_at);

-- Add foreign key constraints if tables exist
DO $$ 
BEGIN
    -- Add foreign key to organizations if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations'
    ) THEN
        ALTER TABLE phone_numbers 
        ADD CONSTRAINT fk_phone_numbers_organization 
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) 
        ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key to organizations';
    END IF;

    -- Add foreign key to campaigns if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'campaigns'
    ) THEN
        ALTER TABLE phone_numbers 
        ADD CONSTRAINT fk_phone_numbers_campaign 
        FOREIGN KEY (current_campaign_id) 
        REFERENCES campaigns(id) 
        ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key to campaigns';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view phone numbers in their organization"
  ON phone_numbers FOR SELECT
  USING (true); -- Simplified for now, adjust based on your auth setup

CREATE POLICY "Users can insert phone numbers"
  ON phone_numbers FOR INSERT
  WITH CHECK (true); -- Simplified for now

CREATE POLICY "Users can update phone numbers"
  ON phone_numbers FOR UPDATE
  USING (true); -- Simplified for now

CREATE POLICY "Users can delete phone numbers"
  ON phone_numbers FOR DELETE
  USING (true); -- Simplified for now

-- Insert sample phone numbers
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
    'sample_vapi_1',
    'active',
    true,
    '{"voice": true, "sms": false, "recording": true}'::jsonb
  ),
  (
    '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
    '+14155551235',
    'Sales Line 2',
    '+1',
    '415',
    'vapi',
    'sample_vapi_2',
    'active',
    true,
    '{"voice": true, "sms": false, "recording": true}'::jsonb
  ),
  (
    '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
    '+442079461234',
    'UK Sales Line',
    '+44',
    '207',
    'vapi',
    'sample_vapi_uk',
    'active',
    true,
    '{"voice": true, "sms": false, "recording": true}'::jsonb
  );

-- Verify the table was created
SELECT 
    'Table created successfully!' as status,
    COUNT(*) as phone_numbers_count
FROM phone_numbers;

-- Show the inserted data
SELECT 
    phone_number,
    friendly_name,
    status,
    is_available,
    provider
FROM phone_numbers
ORDER BY created_at;