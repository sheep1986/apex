# Fix for Trinity Labs AI Platform Calling Issues

## Issues Identified

1. **Phone Numbers Table Error (400)**
   - The frontend is querying `phone_numbers` table with `country=eq.GB` filter
   - The table is missing the `country` column causing 400 errors
   - Query: `phone_numbers?select=*&status=eq.active&country=eq.GB`

2. **API Redirects Working Correctly**
   - Netlify redirects are properly configured
   - `/api/*` redirects to Vercel backend: `https://apex-backend-vercel-alh0xjd6q-seans-projects-aabd20b2.vercel.app`

3. **VAPI Service Configuration**
   - VAPI service initializes correctly
   - Organization has VAPI credentials stored
   - Assistant IDs and Phone Number IDs are configured in campaigns

## Solutions

### 1. Fix Phone Numbers Table (Execute in Supabase SQL Editor)

```sql
-- Run the fix script:
-- /Users/seanwentz/Desktop/Apex/fix-phone-numbers-country-column.sql

-- Quick fix:
ALTER TABLE phone_numbers 
ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'GB';

UPDATE phone_numbers 
SET country = 'GB' 
WHERE country IS NULL;
```

### 2. Verify VAPI Phone Numbers

First, check if you have any VAPI phone numbers:
```bash
cd /Users/seanwentz/Desktop/Apex
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24 node scripts/diagnostics/check-vapi-resources.cjs
```

### 3. Making Calls Work

#### Option A: Use the Campaign Processor (Simulated Calls)
This creates simulated calls for testing:
```bash
cd /Users/seanwentz/Desktop/Apex
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24 node scripts/campaign-automation/start-campaign-processor.cjs
```

#### Option B: Make Real VAPI Calls
For real calls using VAPI:
```bash
cd /Users/seanwentz/Desktop/Apex
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24 node scripts/vapi-calls/call-new-campaign.cjs
```

### 4. Required Setup for Real Calls

1. **VAPI Account**: Ensure you have an active VAPI account
2. **Phone Number**: Purchase a phone number in VAPI dashboard
3. **Assistant**: Create an assistant in VAPI dashboard
4. **Campaign Configuration**: 
   - Set the assistant_id in campaign settings
   - Set the phone_number_id in campaign settings
   - Add leads with valid phone numbers

### 5. Check Organization Settings

Verify your organization has VAPI credentials:
```sql
SELECT 
    name,
    vapi_private_key IS NOT NULL as has_private_key,
    vapi_public_key IS NOT NULL as has_public_key,
    settings->>'vapi' as vapi_settings
FROM organizations 
WHERE id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
```

## Quick Test

After fixing the phone_numbers table, refresh your Apex dashboard. The 400 error should be resolved and phone numbers should load properly.

## Next Steps

1. Execute the SQL fix for phone_numbers table
2. Verify phone numbers are loading in the dashboard
3. Create a campaign with leads
4. Use the campaign processor to make calls
5. Monitor the calls table for results

## Important Notes

- The API is redirecting correctly from Netlify to Vercel
- VAPI service is initialized and waiting for valid credentials
- Campaign automation scripts are ready to process calls
- The main issue was the missing 'country' column in phone_numbers table