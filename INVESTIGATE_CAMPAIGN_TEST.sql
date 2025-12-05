-- =============================================================================
-- INVESTIGATE WHY CAMPAIGN "TEST" ISN'T MAKING CALLS
-- =============================================================================
-- Campaign "Test" has 3 leads but 0 calls made - let's find out why
-- =============================================================================

-- 1. Check campaign configuration
SELECT
  id,
  name,
  status, -- Should be 'active' not 'draft'
  assistant_id, -- Should be present
  phone_number_ids, -- Should be present
  working_hours,
  working_days,
  call_limit_settings,
  retry_settings,
  created_at,
  scheduled_start,
  organization_id
FROM campaigns
WHERE name = 'Test'
  AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';

-- 2. Check the 3 leads in this campaign
SELECT
  id,
  first_name,
  last_name,
  phone, -- Should have valid phone numbers in E.164 format
  email,
  status, -- Should have some 'new' leads
  lead_source,
  created_at,
  campaign_id
FROM leads
WHERE campaign_id IN (
  SELECT id FROM campaigns WHERE name = 'Test'
)
ORDER BY created_at DESC;

-- 3. Check if any calls have been attempted (might be failed calls)
SELECT
  id,
  status,
  outcome,
  phone_number,
  duration,
  cost,
  error_message,
  created_at,
  started_at,
  ended_at
FROM calls
WHERE campaign_id IN (
  SELECT id FROM campaigns WHERE name = 'Test'
)
ORDER BY created_at DESC;

-- 4. Check call queue (are calls queued but not executed?)
SELECT
  id,
  status,
  phone_number,
  contact_name,
  attempt,
  scheduled_for,
  last_outcome,
  next_retry_at,
  created_at
FROM call_queue
WHERE campaign_id IN (
  SELECT id FROM campaigns WHERE name = 'Test'
)
ORDER BY scheduled_for ASC;

-- 5. Check current time vs working hours
SELECT
  name,
  status,
  working_hours,
  working_days,
  CURRENT_TIMESTAMP AT TIME ZONE 'UTC' as current_time_utc,
  CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York' as current_time_est,
  -- Extract working hours for comparison
  (working_hours->>'start') as work_start,
  (working_hours->>'end') as work_end,
  (working_hours->>'timezone') as work_timezone,
  -- Check today's day of week
  to_char(CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York', 'Day') as current_day
FROM campaigns
WHERE name = 'Test';

-- =============================================================================
-- QUICK FIXES FOR CAMPAIGN "TEST"
-- =============================================================================

-- Fix 1: Activate campaign if status is 'draft'
-- Run this ONLY if query 1 shows status = 'draft'
/*
UPDATE campaigns
SET status = 'active'
WHERE name = 'Test'
  AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
*/

-- Fix 2: Set working hours to 24/7 for immediate testing
/*
UPDATE campaigns
SET working_hours = '{"start": "00:00", "end": "23:59", "timezone": "America/New_York"}'::jsonb
WHERE name = 'Test'
  AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
*/

-- Fix 3: Enable all working days
/*
UPDATE campaigns
SET working_days = '{
  "monday": true,
  "tuesday": true,
  "wednesday": true,
  "thursday": true,
  "friday": true,
  "saturday": true,
  "sunday": true
}'::jsonb
WHERE name = 'Test'
  AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
*/

-- Fix 4: Set assistant and phone number if missing
-- First, check available assistants and phone numbers:
SELECT
  vapi_assistant_ids,
  vapi_phone_number_ids
FROM organizations
WHERE id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';

-- Then update campaign (replace with actual IDs from query above):
/*
UPDATE campaigns
SET
  assistant_id = 'YOUR_ASSISTANT_ID', -- From organization vapi_assistant_ids
  phone_number_ids = ARRAY['YOUR_PHONE_NUMBER_ID'] -- From organization vapi_phone_number_ids
WHERE name = 'Test'
  AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
*/

-- =============================================================================
-- COMPREHENSIVE FIX FOR ALL CAMPAIGNS
-- =============================================================================
-- If you want to make ALL campaigns callable immediately:

/*
-- 1. Activate all draft campaigns
UPDATE campaigns
SET status = 'active'
WHERE status = 'draft'
  AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';

-- 2. Set all campaigns to 24/7 working hours
UPDATE campaigns
SET
  working_hours = '{"start": "00:00", "end": "23:59", "timezone": "America/New_York"}'::jsonb,
  working_days = '{
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": true,
    "sunday": true
  }'::jsonb
WHERE organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';

-- 3. Set missing assistant/phone for campaigns (requires actual IDs)
-- Get the first assistant and phone from organization:
WITH org_config AS (
  SELECT
    (vapi_assistant_ids[1]) as first_assistant,
    (vapi_phone_number_ids[1]) as first_phone
  FROM organizations
  WHERE id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b'
)
UPDATE campaigns
SET
  assistant_id = COALESCE(campaigns.assistant_id, org_config.first_assistant),
  phone_number_ids = CASE
    WHEN campaigns.phone_number_ids IS NULL OR campaigns.phone_number_ids = '{}'::text[]
    THEN ARRAY[org_config.first_phone]
    ELSE campaigns.phone_number_ids
  END
FROM org_config
WHERE campaigns.organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
*/

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running fixes, verify campaign is ready:

SELECT
  name,
  status,
  assistant_id IS NOT NULL as has_assistant,
  phone_number_ids IS NOT NULL AND array_length(phone_number_ids, 1) > 0 as has_phone,
  (SELECT COUNT(*) FROM leads WHERE leads.campaign_id = campaigns.id) as total_leads,
  (SELECT COUNT(*) FROM leads WHERE leads.campaign_id = campaigns.id AND leads.status = 'new') as leads_ready,
  working_hours,
  working_days
FROM campaigns
WHERE name = 'Test'
  AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
