-- Check what tables exist in your database
-- Run this in Supabase SQL editor to see all tables

-- 1. List all tables
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check if phone_numbers table exists
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'phone_numbers'
) AS phone_numbers_exists;

-- 3. If phone_numbers exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'phone_numbers'
ORDER BY ordinal_position;

-- 4. Check for any table with 'phone' in the name
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%phone%';

-- 5. Check the campaigns table to see if it has phone-related columns
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'campaigns'
AND column_name LIKE '%phone%'
ORDER BY ordinal_position;