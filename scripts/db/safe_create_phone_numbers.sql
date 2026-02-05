-- Safe creation of phone_numbers table
-- This will only create the table if it doesn't exist

-- Check and create table only if it doesn't exist
CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  friendly_name VARCHAR(255),
  country_code VARCHAR(5) DEFAULT '+1',
  area_code VARCHAR(10),
  provider VARCHAR(50) DEFAULT 'vapi',
  provider_id VARCHAR(255),
  provider_sid VARCHAR(255),
  voice_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  mms_enabled BOOLEAN DEFAULT false,
  fax_enabled BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active',
  is_available BOOLEAN DEFAULT true,
  current_campaign_id UUID,
  last_used_at TIMESTAMP WITH TIME ZONE,
  max_calls_per_hour INTEGER DEFAULT 60,
  max_calls_per_day INTEGER DEFAULT 500,
  current_hour_calls INTEGER DEFAULT 0,
  current_day_calls INTEGER DEFAULT 0,
  rate_limit_reset_hour TIMESTAMP WITH TIME ZONE,
  rate_limit_reset_day TIMESTAMP WITH TIME ZONE,
  monthly_cost DECIMAL(10, 2) DEFAULT 0,
  per_minute_cost DECIMAL(10, 4) DEFAULT 0.01,
  billing_type VARCHAR(50) DEFAULT 'metered',
  capabilities JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add unique constraint on phone_number if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'phone_numbers_phone_number_key'
    ) THEN
        ALTER TABLE phone_numbers ADD CONSTRAINT phone_numbers_phone_number_key UNIQUE (phone_number);
    END IF;
END $$;

-- Now check what we have
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'phone_numbers'
ORDER BY ordinal_position;

-- Check if there's any data
SELECT COUNT(*) as existing_records FROM phone_numbers;

-- If empty, add sample data
INSERT INTO phone_numbers (
  organization_id,
  phone_number,
  friendly_name,
  status,
  is_available
)
SELECT 
  '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
  '+14155551001',
  'Sample Phone Line 1',
  'active',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM phone_numbers WHERE phone_number = '+14155551001'
);

INSERT INTO phone_numbers (
  organization_id,
  phone_number,
  friendly_name,
  status,
  is_available
)
SELECT 
  '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
  '+14155551002',
  'Sample Phone Line 2',
  'active',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM phone_numbers WHERE phone_number = '+14155551002'
);

-- Show final result
SELECT 
    phone_number,
    friendly_name,
    status,
    is_available
FROM phone_numbers;