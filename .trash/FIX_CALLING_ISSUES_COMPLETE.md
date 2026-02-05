# Complete Fix for APEX Platform Calling Issues

## Current Status

### ✅ Fixed
- Phone numbers table now has 'country' column
- Phone numbers loading in dashboard (3 phone numbers showing)
- Campaigns are configured with Assistant IDs and Phone Number IDs
- VAPI API key is configured in organization

### ❌ Still Issues
1. **Leads table schema mismatch** - The table doesn't have `first_name` and `last_name` columns
2. **No actual phone numbers in database** - 0 phone numbers available for calling
3. **VAPI IDs might be invalid** - Need to verify the Assistant and Phone Number IDs are current

## Immediate Actions Required

### 1. Fix Leads Table Schema
Run this in Supabase SQL Editor:
```sql
-- Check current leads table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Add missing columns if needed
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- If you have a 'name' column, split it into first_name and last_name
UPDATE leads 
SET 
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = SPLIT_PART(name, ' ', 2)
WHERE name IS NOT NULL 
  AND first_name IS NULL;
```

### 2. Add Phone Numbers to Database
You need actual VAPI phone numbers. Run this to add test phone numbers:
```sql
-- Add test phone numbers (replace with your actual VAPI phone numbers)
INSERT INTO phone_numbers (
  organization_id,
  phone_number,
  country,
  status,
  provider,
  provider_id,
  friendly_name
) VALUES 
(
  '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
  '+14155551234',
  'US',
  'active',
  'vapi',
  'd49a7d01-7caa-4421-b634-e8057494913d', -- This needs to be your actual VAPI phone number ID
  'Main Sales Line'
);
```

### 3. Verify VAPI Credentials
1. Go to https://dashboard.vapi.ai
2. Check your Phone Numbers section - get the actual phone number ID
3. Check your Assistants section - get the actual assistant ID
4. Update your campaigns with the correct IDs

### 4. Add Test Leads
```sql
-- Add test leads to a campaign
INSERT INTO leads (
  organization_id,
  campaign_id,
  first_name,
  last_name,
  phone,
  email,
  status,
  call_status
) VALUES 
(
  '2566d8c5-2245-4a3c-b539-4cea21a07d9b',
  'dd797a17-0998-4240-b592-f8ef268ae242', -- Test 123 campaign
  'John',
  'Doe',
  '+447777888999', -- Replace with a real phone number
  'john@example.com',
  'new',
  'pending'
);
```

## Testing the Fix

### Quick Test Script
I've created `make-test-call-now.cjs` for you:

1. Edit the file:
   ```bash
   nano make-test-call-now.cjs
   ```

2. Change the test phone number to yours:
   ```javascript
   const testPhoneNumber = '+447777888999'; // Your actual number
   ```

3. Uncomment the function call:
   ```javascript
   makeTestCall(); // Uncomment this
   ```

4. Run it:
   ```bash
   node make-test-call-now.cjs
   ```

## Why Calls Aren't Working

1. **Database Schema Issues**: The leads table is missing expected columns
2. **No Phone Numbers**: The phone_numbers table has 0 records
3. **VAPI Configuration**: The Assistant/Phone Number IDs might not be valid in VAPI

## Complete Solution Checklist

- [ ] Fix leads table schema (add first_name, last_name columns)
- [ ] Add actual VAPI phone numbers to phone_numbers table
- [ ] Verify VAPI Assistant ID is valid
- [ ] Verify VAPI Phone Number ID is valid
- [ ] Add test leads with valid phone numbers
- [ ] Run the test call script
- [ ] Monitor the calls table for results

## Expected Outcome After Fixes

Once all fixes are applied:
1. Dashboard loads without errors
2. Campaigns show available phone numbers
3. Leads display correctly
4. Clicking "Start Campaign" initiates calls
5. VAPI makes actual phone calls
6. Call records appear in the database

## Need Help?

If VAPI IDs are invalid, you'll see errors like:
- "Invalid phoneNumberId"
- "Invalid assistantId"

This means you need to:
1. Log into VAPI dashboard
2. Create/verify your assistant
3. Purchase/verify a phone number
4. Update the campaign settings with correct IDs

## Test Command

After applying all fixes, test with:
```bash
cd /Users/seanwentz/Desktop/Apex
node make-test-call-now.cjs
```

The phone should ring if everything is configured correctly!