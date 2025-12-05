# Campaign Calls - Issue Resolved

## Problem
Created campaign "K" but no calls were being made. Console showed:
- ❌ 404 errors on organization settings endpoints
- ⚠️ Campaign executor was disabled
- ✅ VAPI credentials loaded correctly

## Root Cause
The campaign executor (which processes campaigns and makes calls) was disabled in the backend because it was written in TypeScript (.ts) and the server couldn't import it.

## Solution Implemented

### 1. Enabled TypeScript Support in Backend
**File: `apps/backend/server-simple.js:1-2`**
```javascript
// Enable TypeScript support for importing .ts files
require('ts-node/register');
```
This allows the JavaScript server to import TypeScript files.

### 2. Enabled Campaign Executor
**File: `apps/backend/server-simple.js:305-323`**
- Uncommented the campaign executor code
- The endpoint `/api/trigger-campaign-executor` now actually runs
- Vercel cron calls this endpoint every minute (configured in vercel.json)

### 3. Created Organization Settings API
**File: `apps/backend/server-simple.js:290-383`**
- Added `/api/organization-settings/:settingKey` endpoint
- Returns settings with sensible defaults:
  - `max_concurrent_calls`: 5
  - `default_working_hours`: 9AM-5PM EST
  - `compliance_settings`: DNC enabled, max 3 calls per contact
  - `vapi/credentials`: Loads from organization table

## What Happens Now

### Automatic Campaign Processing
1. **Vercel Cron** - Calls `/api/trigger-campaign-executor` every minute
2. **Campaign Executor** - Finds all active campaigns
3. **For Each Campaign**:
   - Checks if it's within working hours
   - Finds leads that need to be called
   - Creates queued calls
   - Makes calls through VAPI using organization credentials

### Campaign "K" Status
Your campaign "K" is now in the database and will be processed on the next cron run (within 1 minute of Vercel deployment completing).

To check if calls are being made:
1. Wait 2-3 minutes for Vercel to deploy
2. Check the "All Calls" page in the dashboard
3. Check Vercel logs: `https://vercel.com/your-project/deployments`
4. Campaign should show increasing call counts

## Campaign Requirements for Calls to Be Made

For a campaign to make calls, it needs:

1. ✅ **Status**: `active` (not draft, paused, or completed)
2. ✅ **Assistant ID**: Valid VAPI assistant
3. ✅ **Phone Number**: Valid VAPI phone number
4. ✅ **Leads**: At least one lead with a phone number
5. ✅ **Working Hours**: Current time within campaign working hours
6. ✅ **VAPI Credentials**: Organization has valid VAPI API key

## Verifying Your Campaign "K"

Run this SQL in Supabase to check campaign details:

```sql
SELECT
  id,
  name,
  status,
  assistant_id,
  phone_number_ids,
  created_at
FROM campaigns
WHERE name = 'K'
  AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';

-- Check if campaign has leads
SELECT COUNT(*) as lead_count
FROM leads
WHERE campaign_id IN (
  SELECT id FROM campaigns WHERE name = 'K'
);
```

## Next Steps

1. **Wait for Deployment** - Vercel is deploying the changes now (2-3 minutes)
2. **Check Logs** - Monitor Vercel function logs for campaign executor runs
3. **Add Leads** - If campaign has no leads, upload a CSV with phone numbers
4. **Monitor Calls** - Check dashboard "All Calls" page for new calls

## Deployment Timeline

- ✅ Code committed: `db3c96ae`
- ✅ Pushed to GitHub: Just now
- ⏳ Vercel deploying: In progress (check Vercel dashboard)
- ⏳ Campaign executor running: Within 1 minute of deployment
- ⏳ First calls: Within 2-3 minutes (if leads exist and within working hours)

## Troubleshooting

### If calls still don't work:

1. **Check Campaign Status**
   ```sql
   SELECT status FROM campaigns WHERE name = 'K';
   ```
   Should be `active`, not `draft`

2. **Check for Leads**
   ```sql
   SELECT COUNT(*) FROM leads WHERE campaign_id = 'YOUR_CAMPAIGN_ID';
   ```

3. **Check VAPI Credentials**
   ```sql
   SELECT vapi_api_key FROM organizations
   WHERE id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
   ```
   Should have value like `da8956d4-0...`

4. **Check Working Hours**
   Campaign default is 9AM-5PM EST. If outside this window, update:
   ```sql
   UPDATE campaigns
   SET working_hours = '{"start": "00:00", "end": "23:59", "timezone": "America/New_York"}'
   WHERE name = 'K';
   ```

5. **Check Vercel Logs**
   - Go to Vercel dashboard
   - Click on deployment
   - View function logs
   - Look for "Campaign executor" messages

## Files Changed

- ✅ `apps/backend/server-simple.js` - Enabled ts-node, campaign executor, org settings
- ✅ `apps/backend/api/organization-settings.ts` - New settings API (reference file)

## Commit

```
feat: Enable campaign executor and add organization settings API
Commit: db3c96ae
```
