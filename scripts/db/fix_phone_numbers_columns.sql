-- Fix phone_numbers table column names
-- The table has phone_number (with underscore) but should be phone_number

-- First, let's see all columns in the table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'phone_numbers'
ORDER BY ordinal_position;

-- Add all the missing columns that the application expects
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Rename phone_number column if it exists with underscore
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'phone_numbers' 
        AND column_name = 'phone_number'
    ) THEN
        -- Column already exists correctly, do nothing
        RAISE NOTICE 'phone_number column already exists correctly';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'phone_numbers' 
        AND column_name = 'phone_number'
    ) THEN
        -- Column exists with underscore, rename it
        ALTER TABLE phone_numbers RENAME COLUMN phone_number TO phone_number;
        RAISE NOTICE 'Renamed phone_number to phone_number';
    ELSE
        -- Column doesn't exist at all, create it
        ALTER TABLE phone_numbers ADD COLUMN phone_number VARCHAR(20);
        RAISE NOTICE 'Added phone_number column';
    END IF;
END $$;

-- Add other essential columns
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
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS current_campaign_id UUID;

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
ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{}';

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- If there's data in phone_number column, copy it to phone_number
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'phone_numbers' 
        AND column_name = 'phone_number'
    ) THEN
        UPDATE phone_numbers 
        SET phone_number = phone_number 
        WHERE phone_number IS NOT NULL 
        AND phone_number IS NULL;
        RAISE NOTICE 'Copied data from phone_number to phone_number';
    END IF;
END $$;

-- Check the final structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'phone_numbers'
ORDER BY ordinal_position;

-- Add sample data if table is empty
INSERT INTO phone_numbers (
    organization_id,
    phone_number,
    friendly_name,
    status,
    is_available,
    provider,
    provider_id
)
SELECT 
    '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
    '+14155551234',
    'Main Sales Line',
    'active',
    true,
    'vapi',
    'vapi_phone_1'
WHERE NOT EXISTS (
    SELECT 1 FROM phone_numbers WHERE phone_number = '+14155551234'
);

INSERT INTO phone_numbers (
    organization_id,
    phone_number,
    friendly_name,
    status,
    is_available,
    provider,
    provider_id
)
SELECT 
    '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
    '+14155551235',
    'Sales Line 2',
    'active',
    true,
    'vapi',
    'vapi_phone_2'
WHERE NOT EXISTS (
    SELECT 1 FROM phone_numbers WHERE phone_number = '+14155551235'
);

-- Show the data
SELECT 
    phone_number,
    friendly_name,
    status,
    is_available,
    provider
FROM phone_numbers;