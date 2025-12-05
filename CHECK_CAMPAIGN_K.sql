-- =============================================================================
-- CHECK CAMPAIGN "K" CONFIGURATION
-- =============================================================================
-- Run this in Supabase SQL Editor to verify campaign is ready to make calls
-- =============================================================================

-- 1. Check campaign details
SELECT
  id,
  name,
  status,
  assistant_id,
  phone_number_ids,
  working_hours,
  working_days,
  call_limit_settings,
  retry_settings,
  created_at,
  scheduled_start,
  organization_id
FROM campaigns
WHERE name = 'K'
  AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';

-- 2. Check if campaign has leads
SELECT
  COUNT(*) as total_leads,
  COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as leads_with_phone,
  COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
  COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads
FROM leads
WHERE campaign_id IN (
  SELECT id FROM campaigns
  WHERE name = 'K'
  AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b'
);

-- 3. Check organization VAPI credentials
SELECT
  id,
  name,
  vapi_api_key,
  vapi_phone_number_ids,
  vapi_assistant_ids,
  max_concurrent_calls
FROM organizations
WHERE id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';

-- 4. Check for any existing calls from this campaign
SELECT
  id,
  status,
  outcome,
  duration,
  cost,
  created_at,
  started_at,
  ended_at
FROM calls
WHERE campaign_id IN (
  SELECT id FROM campaigns WHERE name = 'K'
)
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check if there are any queued calls waiting to be made
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
  SELECT id FROM campaigns WHERE name = 'K'
)
ORDER BY scheduled_for ASC
LIMIT 10;

-- =============================================================================
-- EXPECTED RESULTS
-- =============================================================================
--
-- Query 1 (Campaign Details):
-- - status should be 'active' (if 'draft', calls won't be made)
-- - assistant_id should be set to a valid VAPI assistant ID
-- - phone_number_ids should contain at least one VAPI phone number
-- - working_hours should show {"start": "09:00", "end": "17:00", "timezone": "America/New_York"}
--
-- Query 2 (Leads):
-- - total_leads should be > 0 (if 0, no one to call)
-- - leads_with_phone should be > 0 (if 0, no phone numbers)
-- - new_leads should be > 0 (if all contacted, campaign may be done)
--
-- Query 3 (VAPI Credentials):
-- - vapi_api_key should be present (like 'da8956d4-0...')
-- - max_concurrent_calls should be set (default 5)
--
-- Query 4 (Existing Calls):
-- - Will show if any calls have already been made
-- - Empty result means no calls yet (expected for new campaign)
--
-- Query 5 (Queued Calls):
-- - Shows calls waiting to be made
-- - Campaign executor creates these from leads
-- - Empty result means either:
--   a) No leads in campaign
--   b) Campaign executor hasn't run yet
--   c) Campaign is outside working hours
-- =============================================================================

-- =============================================================================
-- QUICK FIXES IF CAMPAIGN NOT WORKING
-- =============================================================================

-- Fix 1: Activate campaign if status is 'draft'
-- UPDATE campaigns
-- SET status = 'active'
-- WHERE name = 'K'
--   AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';

-- Fix 2: Set working hours to 24/7 for testing
-- UPDATE campaigns
-- SET working_hours = '{"start": "00:00", "end": "23:59", "timezone": "America/New_York"}'
-- WHERE name = 'K'
--   AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';

-- Fix 3: Enable all working days
-- UPDATE campaigns
-- SET working_days = '{
--   "monday": true,
--   "tuesday": true,
--   "wednesday": true,
--   "thursday": true,
--   "friday": true,
--   "saturday": true,
--   "sunday": true
-- }'::jsonb
-- WHERE name = 'K'
--   AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
-- =============================================================================
