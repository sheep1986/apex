-- Simple fix for phone_numbers table
-- Run this in Supabase SQL editor

-- First, let's check what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'phone_numbers'
ORDER BY ordinal_position;

-- Add the is_available column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'phone_numbers' 
    AND column_name = 'is_available'
  ) THEN
    ALTER TABLE phone_numbers ADD COLUMN is_available BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_available column';
  ELSE
    RAISE NOTICE 'is_available column already exists';
  END IF;
END $$;

-- Update any NULL values to true
UPDATE phone_numbers 
SET is_available = true 
WHERE is_available IS NULL;

-- Now let's check the data
SELECT 
  id,
  phone_number,
  status,
  is_available,
  organization_id,
  created_at
FROM phone_numbers
LIMIT 10;