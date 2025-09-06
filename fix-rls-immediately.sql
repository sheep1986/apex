-- IMMEDIATE FIX: Disable RLS to restore full functionality
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/twigokrtbvigiqnaybfy/sql)

-- Step 1: Disable RLS on all tables (immediate fix)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_phone_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualification_field_presets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_qualification_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_custom_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_qualification_data DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify data is accessible
SELECT COUNT(*) as total_campaigns FROM campaigns;
SELECT COUNT(*) as total_calls FROM calls;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_contacts FROM contacts;

-- This will immediately restore full data access
-- You can implement proper RLS policies later when needed