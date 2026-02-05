-- Fix phone_numbers table to resolve the 400 error
-- The application is trying to filter by 'country' column which doesn't exist

-- Add the missing 'country' column
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'GB';

-- Update existing records to have a country value
UPDATE phone_numbers 
SET country = 'GB' 
WHERE country IS NULL;

-- Also ensure status column exists and has valid values
UPDATE phone_numbers 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Create index for performance on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON phone_numbers(status);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_country ON phone_numbers(country);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_organization_id ON phone_numbers(organization_id);

-- Verify the structure
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'phone_numbers'
ORDER BY ordinal_position;

-- Check if there are any phone numbers with proper data
SELECT 
    id,
    phone_number,
    status,
    country,
    organization_id,
    provider
FROM phone_numbers
LIMIT 5;