# How to Add Leads to Campaign "K"

## Issue
Campaign "K" shows: **0 leads, 0 calls, 0 completed**

Without leads (contacts with phone numbers), the campaign has no one to call!

## Solution: Add Leads to Your Campaign

### Option 1: Add Leads via SQL (Quick Test)

Run this in Supabase SQL Editor to add a test lead:

```sql
-- Add a test lead to Campaign "K"
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
  'Test',
  'Lead',
  '+15555551234', -- IMPORTANT: Use real phone number for actual calls
  'test@example.com',
  'new',
  'manual',
  NOW()
);

-- Verify the lead was added
SELECT
  c.name as campaign_name,
  COUNT(l.id) as lead_count
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
WHERE c.name = 'K'
  AND c.organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b'
GROUP BY c.name;
```

### Option 2: Upload CSV via Dashboard (Recommended for Production)

1. **Prepare CSV file** with these columns:
   ```
   first_name,last_name,phone,email,company
   John,Doe,+15555551234,john@example.com,Acme Corp
   Jane,Smith,+15555555678,jane@example.com,Beta Inc
   ```

2. **In Dashboard**: Navigate to the campaign details page
3. **Click "Upload Leads"** or "Import CSV"
4. **Select your CSV file**
5. **Map columns** to lead fields
6. **Import**

### Option 3: Add via API (Programmatic)

```javascript
// POST /api/campaigns/{campaignId}/leads
const response = await fetch('/api/campaigns/55a733c5-d318-426c-91db-8efb53602216/leads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${clerkToken}`
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    phone: '+15555551234',
    email: 'john@example.com',
    company: 'Acme Corp'
  })
});
```

## Verify Campaign is Ready to Call

After adding leads, check campaign status:

```sql
-- Check campaign is active and has leads
SELECT
  c.id,
  c.name,
  c.status,
  c.assistant_id,
  c.phone_number_ids,
  c.working_hours,
  COUNT(l.id) as total_leads,
  COUNT(CASE WHEN l.status = 'new' THEN 1 END) as leads_to_call
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
WHERE c.name = 'K'
  AND c.organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b'
GROUP BY c.id, c.name, c.status, c.assistant_id, c.phone_number_ids, c.working_hours;
```

**Expected Results:**
- ✅ status: `active`
- ✅ total_leads: > 0
- ✅ leads_to_call: > 0
- ✅ assistant_id: Present (VAPI assistant)
- ✅ phone_number_ids: Present (VAPI phone number)

## Check if Campaign Can Make Calls Right Now

```sql
-- Check if within working hours
SELECT
  name,
  status,
  working_hours,
  working_days,
  CURRENT_TIMESTAMP AT TIME ZONE 'America/New_York' as current_time_est
FROM campaigns
WHERE name = 'K';
```

Default working hours are **9AM-5PM EST**. If it's outside this window, the campaign won't make calls until working hours resume.

To test **immediately**, change to 24/7:

```sql
UPDATE campaigns
SET working_hours = '{"start": "00:00", "end": "23:59", "timezone": "America/New_York"}'::jsonb,
    working_days = '{"monday": true, "tuesday": true, "wednesday": true, "thursday": true, "friday": true, "saturday": true, "sunday": true}'::jsonb
WHERE name = 'K'
  AND organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
```

## Timeline After Adding Leads

1. **Immediately**: Leads appear in campaign
2. **Within 1 minute**: Campaign executor processes campaign (Vercel cron)
3. **Within 2 minutes**: Calls queued in `call_queue` table
4. **Within 3 minutes**: First call is made via VAPI
5. **Check Dashboard**: "All Calls" page shows new calls

## Important: Phone Number Format

- ✅ **Correct**: `+15555551234` (E.164 format with country code)
- ❌ **Wrong**: `555-555-1234`, `(555) 555-1234`

For testing, use your own phone number to verify calls are being made!

## Troubleshooting

### Leads added but still no calls?

1. **Check campaign status**:
   ```sql
   SELECT status FROM campaigns WHERE name = 'K';
   ```
   If `draft`, change to `active`:
   ```sql
   UPDATE campaigns SET status = 'active' WHERE name = 'K';
   ```

2. **Check working hours** - Make sure current time is within working hours

3. **Check VAPI configuration**:
   ```sql
   SELECT assistant_id, phone_number_ids FROM campaigns WHERE name = 'K';
   ```
   Both must be set!

4. **Check Vercel logs** - Campaign executor runs every minute
   - Go to Vercel dashboard
   - Check function logs
   - Look for "Campaign executor" or "Processing campaign K"

5. **Check call queue**:
   ```sql
   SELECT * FROM call_queue WHERE campaign_id = '55a733c5-d318-426c-91db-8efb53602216';
   ```
   If empty, campaign executor hasn't run yet or can't create calls

## Next Steps

1. **Add at least 1 test lead** (use your phone number)
2. **Activate campaign** (if status is 'draft')
3. **Set to 24/7** (for immediate testing)
4. **Wait 2-3 minutes** for campaign executor to run
5. **Check "All Calls" page** in dashboard
6. **Answer your phone!** 📞
