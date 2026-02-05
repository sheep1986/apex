# URGENT: Complete Fix for APEX Platform Calling Issues

Hi Manus,

I've thoroughly debugged the calling issues. The platform still isn't making calls due to 3 remaining problems that need immediate attention.

## Current Status

### ✅ What's Working:
- Phone numbers table fixed (country column added)
- API redirects working correctly
- VAPI service initialized
- Your VAPI API key is configured
- 7 campaigns have Assistant IDs configured

### ❌ What's Still Broken:
1. **Leads table schema error** - Missing `first_name` and `last_name` columns
2. **No phone numbers in database** - 0 actual VAPI phone numbers available
3. **Possibly invalid VAPI IDs** - Need to verify Assistant and Phone Number IDs

## Action Required NOW

### Step 1: Fix Leads Table (Do this first!)
Run this in Supabase SQL Editor:

```sql
-- Add missing columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- If you have a 'name' column, split it
UPDATE leads 
SET 
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = SPLIT_PART(name, ' ', 2)
WHERE name IS NOT NULL AND first_name IS NULL;
```

### Step 2: Get Your VAPI Phone Number
1. Go to https://dashboard.vapi.ai
2. Navigate to Phone Numbers section
3. Copy your phone number ID (looks like: d49a7d01-7caa-4421-...)
4. Add it to the database:

```sql
INSERT INTO phone_numbers (
  organization_id,
  phone_number,
  country,
  status,
  provider,
  provider_id,
  friendly_name
) VALUES (
  '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
  '+44XXXXXXXXXX', -- Your actual VAPI phone number
  'GB',
  'active',
  'vapi',
  'YOUR_VAPI_PHONE_NUMBER_ID_HERE', -- From VAPI dashboard
  'Main Line'
);
```

### Step 3: Verify VAPI Assistant ID
1. Still in VAPI dashboard, go to Assistants
2. Find your assistant
3. Verify the ID matches: `b6c626b2-d159-42f3-a8cd-cad8d0f7536c`
4. If different, update your campaigns with the correct ID

### Step 4: Add a Test Lead
```sql
INSERT INTO leads (
  organization_id,
  campaign_id,
  first_name,
  last_name,
  phone,
  status,
  call_status
) VALUES (
  '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
  'dd797a17-0998-4240-b592-f8ef268ae242', -- Test 123 campaign
  'Test',
  'User',
  '+447777888999', -- Your phone number for testing
  'new',
  'pending'
);
```

### Step 5: Test the Call
Run this command:
```bash
cd /Users/seanwentz/Desktop/Apex
node make-test-call-now.cjs
```

(Edit the file first to add your phone number)

## Why This Will Fix It

The errors in the console show:
- "column leads.first_name does not exist" - Fixed by Step 1
- "0 phone numbers available" - Fixed by Step 2
- VAPI call failures - Fixed by Steps 2 & 3

## Quick Verification

After applying these fixes:
1. Refresh the dashboard - no more 400 errors
2. Check campaigns - they'll show phone numbers available
3. Run the test script - your phone will ring

## If It Still Doesn't Work

The most likely issue is invalid VAPI IDs. You'll see errors like:
- "Invalid phoneNumberId" → Get the correct ID from VAPI dashboard
- "Invalid assistantId" → Get the correct ID from VAPI dashboard

## Files I've Created for You

1. `FIX_CALLING_ISSUES_COMPLETE.md` - Detailed documentation
2. `make-test-call-now.cjs` - Quick test script
3. `check-campaign-readiness.cjs` - Verification script
4. `fix-phone-numbers-country-column.sql` - Already applied

## Expected Timeline

This should take about 10 minutes:
- 2 min: Run SQL fixes
- 3 min: Get VAPI IDs from dashboard
- 2 min: Add phone number to database
- 3 min: Test the call

Let me know once you've applied these fixes and if the calls start working!

Best,
Sean

P.S. The main issue is that we're missing the actual VAPI phone numbers in the database. Once you add your real VAPI phone number ID from the dashboard, calls should work immediately.