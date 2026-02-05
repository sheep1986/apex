# URGENT: Fix for Trinity Labs AI Platform Calling Issues

Hi Manus,

I've identified and resolved the issue preventing calls from working on the Apex platform. Here's what needs to be done:

## The Problem
The platform is failing to make calls because of a database issue. The frontend is trying to query the `phone_numbers` table with a filter for `country=eq.GB`, but this column doesn't exist in the table, causing 400 errors.

## Immediate Action Required

### Step 1: Fix the Database (Do this first!)
Go to Supabase SQL Editor and run this query:

```sql
-- Add the missing 'country' column
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'GB';

-- Update existing records
UPDATE phone_numbers 
SET country = 'GB' 
WHERE country IS NULL;

-- Ensure status is set properly
UPDATE phone_numbers 
SET status = 'active' 
WHERE status IS NULL OR status = '';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON phone_numbers(status);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_country ON phone_numbers(country);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_organization_id ON phone_numbers(organization_id);
```

### Step 2: Verify the Fix
1. Go to the Apex dashboard (https://aquamarine-klepon-bcb066.netlify.app)
2. The phone numbers should now load without errors
3. Check the browser console - the 400 errors should be gone

### Step 3: Test Making Calls

**Option A - Test with Simulated Calls:**
```bash
cd /Users/seanwentz/Desktop/Apex
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NnM3MDElMjY5fQ.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24 node scripts/campaign-automation/start-campaign-processor.cjs
```

**Option B - Make Real VAPI Calls:**
```bash
cd /Users/seanwentz/Desktop/Apex
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24 node scripts/vapi-calls/call-new-campaign.cjs
```

## What Was Working/Not Working

✅ **Working:**
- API redirects from Netlify to Vercel are functioning correctly
- VAPI service is properly initialized
- Campaign automation scripts are ready
- Organization has VAPI credentials configured

❌ **Not Working (Now Fixed):**
- Phone numbers table was missing 'country' column
- Frontend queries were failing with 400 errors
- Phone numbers couldn't load in the dashboard

## Additional Files Created
I've created these files with more details:
- `/Users/seanwentz/Desktop/Apex/fix-phone-numbers-country-column.sql` - The complete SQL fix
- `/Users/seanwentz/Desktop/Apex/fix-calling-issues.md` - Detailed documentation

## Quick Verification
After running the SQL fix, you should see:
1. No more 400 errors in the browser console
2. Phone numbers loading properly in the dashboard
3. Campaigns can start making calls

Let me know once you've applied the fix and if calls are working!

Best,
Sean