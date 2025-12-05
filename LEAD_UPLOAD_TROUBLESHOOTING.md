# Lead Upload Troubleshooting

## Current Situation

You're uploading leads through the dashboard UI, which requires leads before completing the campaign creation process. This is the correct workflow!

## Why Campaigns Show "0 leads" After Upload

### Possible Reasons:

1. **Upload In Progress**
   - The upload might still be processing
   - Large CSV files can take time to import
   - Refresh the page to see if leads appear

2. **Upload Failed Silently**
   - No error message shown, but upload didn't save
   - Check browser console for errors during upload
   - Check network tab for failed API requests

3. **Leads Uploaded to Wrong Campaign**
   - Leads might be associated with a different campaign_id
   - Check the leads table directly in Supabase

4. **Lead Validation Failed**
   - Invalid phone number format (must be E.164: +1XXXXXXXXXX)
   - Missing required fields (first_name, phone)
   - Leads rejected but no error shown

5. **API Endpoint Missing**
   - Lead upload endpoint might be returning 404
   - Similar to the organization-settings 404 errors
   - Vercel deployment still pending

## Check Lead Upload in Browser Console

While uploading leads, open your browser console (F12) and look for:

### Success Messages:
```
✅ Leads uploaded successfully
✅ Created X leads
📊 Campaign now has X leads
```

### Error Messages:
```
❌ Failed to upload leads
❌ API Error: 404 (endpoint not found)
❌ Invalid phone number format
❌ Database error: ...
```

## Verify Leads Were Actually Saved

### Option 1: Check in Supabase SQL Editor
```sql
-- Check if ANY leads exist in your organization
SELECT
  campaign_id,
  first_name,
  last_name,
  phone,
  status,
  created_at
FROM leads
WHERE organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b'
ORDER BY created_at DESC
LIMIT 20;

-- Count leads per campaign
SELECT
  c.name as campaign_name,
  COUNT(l.id) as lead_count
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
WHERE c.organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b'
GROUP BY c.id, c.name
ORDER BY lead_count DESC;
```

### Option 2: Check in Dashboard
1. Go to the campaign details page
2. Look for "Leads" tab or section
3. Should show list of uploaded leads
4. If empty, upload didn't work

## Common Upload Issues & Fixes

### Issue 1: CSV Format Problems

**Required CSV Format:**
```csv
first_name,last_name,phone,email,company
John,Doe,+15555551234,john@example.com,Acme Corp
Jane,Smith,+15555555678,jane@example.com,Beta Inc
Bob,Johnson,+15555559012,bob@example.com,Gamma Ltd
```

**Important Rules:**
- ✅ Phone must start with `+` (plus sign)
- ✅ Phone must include country code (e.g., `+1` for US)
- ✅ No spaces, dashes, or parentheses in phone
- ✅ Header row must match expected columns
- ❌ Don't use `(555) 555-1234` - won't work!
- ❌ Don't use `555-555-1234` - won't work!

**Valid Phone Formats:**
- ✅ `+15555551234` (US)
- ✅ `+442071234567` (UK)
- ✅ `+61412345678` (Australia)

**Invalid Phone Formats:**
- ❌ `5555551234` (missing country code)
- ❌ `(555) 555-1234` (parentheses and dashes)
- ❌ `555-555-1234` (dashes)
- ❌ `1-555-555-1234` (dashes, missing +)

### Issue 2: API Endpoint Not Deployed

If you see **404 errors** during upload:
1. Wait for Vercel deployment to complete
2. Check Vercel dashboard for deployment status
3. Try upload again after deployment succeeds

### Issue 3: Large File Upload Timeout

If uploading many leads (100+):
1. Split CSV into smaller batches (25-50 leads each)
2. Upload in multiple batches
3. Refresh dashboard between uploads

### Issue 4: Browser Cache

If leads uploaded but not showing:
1. Hard refresh page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Log out and log back in

## What Endpoint is Used for Lead Upload?

Check your browser console Network tab during upload to see which endpoint is called:

### Expected Endpoint:
- `POST /api/campaigns/{campaignId}/leads`
- `POST /api/leads/upload`
- `POST /api/vapi-outbound/campaigns/{campaignId}/leads`

### If You See 404:
The backend needs to have this endpoint deployed. Check if it exists in `server-simple.js`

## Quick Test: Add One Lead Manually via SQL

To verify the system works, add one test lead manually:

```sql
-- Get Campaign K ID first
SELECT id, name FROM campaigns WHERE name = 'K';

-- Add a test lead (replace CAMPAIGN_ID with actual ID from above)
INSERT INTO leads (
  id,
  campaign_id,
  organization_id,
  first_name,
  last_name,
  phone,
  email,
  status,
  lead_source,
  created_at
) VALUES (
  gen_random_uuid(),
  '55a733c5-d318-426c-91db-8efb53602216', -- Campaign K ID
  '2566d8c5-2245-4a3c-b539-4cea21a07d9b', -- Your org ID
  'Manual',
  'Test',
  '+15555551234', -- Use YOUR phone number here!
  'test@example.com',
  'new',
  'manual_import',
  NOW()
);

-- Verify it was added
SELECT
  c.name as campaign,
  COUNT(l.id) as leads
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
WHERE c.name = 'K'
GROUP BY c.name;
```

If this works (shows 1 lead), then the problem is with the upload UI/API, not the database.

## Check Lead Upload API Endpoint

Let me check if the lead upload endpoint exists in the backend:

### Endpoints that should exist:
1. `POST /api/campaigns/:campaignId/leads` - Upload leads to campaign
2. `POST /api/leads/bulk` - Bulk upload leads
3. `POST /api/leads/upload` - Upload from CSV

**If these don't exist in server-simple.js**, that's why upload fails!

## What to Do Right Now

1. **While uploading leads, open Browser Console (F12)**
   - Go to "Console" tab
   - Look for any error messages
   - Take a screenshot if you see errors

2. **Check Network Tab**
   - Go to "Network" tab in F12
   - Try uploading again
   - Look for failed requests (red, 404, 500 errors)
   - Click on failed request to see details

3. **Share the Error Messages**
   - Copy any error messages from console
   - Note which API endpoint is failing
   - This will tell us exactly what's broken

4. **Try the Manual SQL Insert**
   - Run the SQL above to add 1 test lead
   - This proves the database works
   - If this works but upload doesn't, it's the API

## Expected Upload Flow

**Correct Flow:**
1. User fills out campaign wizard
2. User uploads CSV file
3. Frontend sends `POST /api/campaigns/{id}/leads` with CSV data
4. Backend validates phone numbers
5. Backend inserts leads into `leads` table
6. Backend returns success with count
7. Frontend shows "X leads uploaded"
8. Campaign dashboard shows lead count

**If Any Step Fails:**
- Upload appears to work but leads don't save
- Campaign shows "0 leads"
- No error message (silent failure)

## Next Steps

**Tell me what you see when uploading:**
1. Do you see any errors in console?
2. Do you see any failed network requests?
3. Does upload complete with success message?
4. After "success", do leads still show as 0?

This will help me identify exactly what's broken and how to fix it!
