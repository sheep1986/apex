-- =====================================================
-- APEX PLATFORM: Row-Level Security (RLS) Policies
-- =====================================================
-- This file implements secure, organization-scoped access control
-- Run this in Supabase SQL Editor after disabling RLS
-- https://supabase.com/dashboard/project/twigokrtbvigiqnaybfy/sql

-- =====================================================
-- STEP 1: Enable RLS on all tables
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qualification_field_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_qualification_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_qualification_data ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop existing policies (if any)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own organization" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Platform owners can manage all users" ON public.users;

DROP POLICY IF EXISTS "Users can view own organization details" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update own organization" ON public.organizations;
DROP POLICY IF EXISTS "Platform owners can manage all organizations" ON public.organizations;

DROP POLICY IF EXISTS "Users can view own organization campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can manage own organization campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Platform owners can manage all campaigns" ON public.campaigns;

DROP POLICY IF EXISTS "Users can view own organization calls" ON public.calls;
DROP POLICY IF EXISTS "Users can create calls" ON public.calls;
DROP POLICY IF EXISTS "Platform owners can manage all calls" ON public.calls;

DROP POLICY IF EXISTS "Users can view own organization leads" ON public.leads;
DROP POLICY IF EXISTS "Users can manage own organization leads" ON public.leads;
DROP POLICY IF EXISTS "Platform owners can manage all leads" ON public.leads;

-- =====================================================
-- STEP 3: Users Table Policies
-- =====================================================

-- Users can view other users in their organization
CREATE POLICY "Users can view own organization"
ON public.users
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub');

-- Platform owners can manage all users
CREATE POLICY "Platform owners can manage all users"
ON public.users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role = 'platform_owner'
  )
);

-- =====================================================
-- STEP 4: Organizations Table Policies
-- =====================================================

-- Users can view their own organization
CREATE POLICY "Users can view own organization details"
ON public.organizations
FOR SELECT
USING (
  id IN (
    SELECT organization_id
    FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

-- Admins can update their own organization
CREATE POLICY "Admins can update own organization"
ON public.organizations
FOR UPDATE
USING (
  id IN (
    SELECT organization_id
    FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role IN ('client_admin', 'platform_owner')
  )
);

-- Platform owners can manage all organizations
CREATE POLICY "Platform owners can manage all organizations"
ON public.organizations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role = 'platform_owner'
  )
);

-- =====================================================
-- STEP 5: Campaigns Table Policies
-- =====================================================

-- Users can view campaigns in their organization
CREATE POLICY "Users can view own organization campaigns"
ON public.campaigns
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

-- Admins can manage campaigns in their organization
CREATE POLICY "Admins can manage own organization campaigns"
ON public.campaigns
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role IN ('client_admin', 'client_user', 'platform_owner')
  )
);

-- Platform owners can manage all campaigns
CREATE POLICY "Platform owners can manage all campaigns"
ON public.campaigns
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role = 'platform_owner'
  )
);

-- =====================================================
-- STEP 6: Calls Table Policies
-- =====================================================

-- Users can view calls in their organization
CREATE POLICY "Users can view own organization calls"
ON public.calls
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

-- Users can create calls (for VAPI webhooks)
CREATE POLICY "Users can create calls"
ON public.calls
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
  OR true -- Allow service role to insert (for VAPI webhooks)
);

-- Users can update calls in their organization
CREATE POLICY "Users can update calls"
ON public.calls
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

-- Platform owners can manage all calls
CREATE POLICY "Platform owners can manage all calls"
ON public.calls
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role = 'platform_owner'
  )
);

-- =====================================================
-- STEP 7: Leads Table Policies
-- =====================================================

-- Users can view leads in their organization
CREATE POLICY "Users can view own organization leads"
ON public.leads
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

-- Users can manage leads in their organization
CREATE POLICY "Users can manage own organization leads"
ON public.leads
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role IN ('client_admin', 'client_user', 'platform_owner')
  )
);

-- Platform owners can manage all leads
CREATE POLICY "Platform owners can manage all leads"
ON public.leads
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role = 'platform_owner'
  )
);

-- =====================================================
-- STEP 8: Contacts Table Policies (same as leads)
-- =====================================================

CREATE POLICY "Users can view own organization contacts"
ON public.contacts
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can manage own organization contacts"
ON public.contacts
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role IN ('client_admin', 'client_user', 'platform_owner')
  )
);

-- =====================================================
-- STEP 9: Supporting Tables (Phone Numbers, etc.)
-- =====================================================

-- Phone Numbers - organization scoped
CREATE POLICY "Users can view own organization phone numbers"
ON public.phone_numbers
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Admins can manage own organization phone numbers"
ON public.phone_numbers
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id
    FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role IN ('client_admin', 'platform_owner')
  )
);

-- Campaign Phone Numbers - join table
CREATE POLICY "Users can view campaign phone numbers"
ON public.campaign_phone_numbers
FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns
    WHERE organization_id IN (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
    )
  )
);

-- Campaign Calls - join table
CREATE POLICY "Users can view campaign calls"
ON public.campaign_calls
FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns
    WHERE organization_id IN (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
    )
  )
);

-- =====================================================
-- STEP 10: Service Role Bypass (for backend operations)
-- =====================================================

-- Allow service role to bypass RLS for backend operations
-- This is automatically enabled in Supabase for service_role key

-- =====================================================
-- STEP 11: Grant necessary permissions
-- =====================================================

-- Grant authenticated users access to tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.campaigns TO authenticated;
GRANT ALL ON public.calls TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.contacts TO authenticated;
GRANT SELECT ON public.phone_numbers TO authenticated;
GRANT SELECT ON public.campaign_phone_numbers TO authenticated;
GRANT SELECT ON public.campaign_calls TO authenticated;

-- Grant service role full access (for backend)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify RLS is working correctly:

-- 1. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'organizations', 'campaigns', 'calls', 'leads');

-- 2. List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Test as specific user (replace with actual user ID)
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = '<clerk_id_here>';
-- SELECT * FROM campaigns; -- Should only see own org campaigns
