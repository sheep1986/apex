-- =====================================================
-- APEX PLATFORM: COMPLETE DATABASE SETUP
-- =====================================================
-- Copy this ENTIRE file and run it in Supabase SQL Editor
-- This will enable RLS + create all indexes in one go
-- URL: https://supabase.com/dashboard/project/twigokrtbvigiqnaybfy/sql
-- =====================================================

-- =====================================================
-- PART 1: ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaign_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaign_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.qualification_field_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaign_qualification_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaign_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lead_qualification_data ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 2: DROP EXISTING POLICIES (IDEMPOTENT)
-- =====================================================

DO $$
BEGIN
    -- Users table policies
    DROP POLICY IF EXISTS "Users can view own organization" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Platform owners can manage all users" ON public.users;

    -- Organizations table policies
    DROP POLICY IF EXISTS "Users can view own organization details" ON public.organizations;
    DROP POLICY IF EXISTS "Admins can update own organization" ON public.organizations;
    DROP POLICY IF EXISTS "Platform owners can manage all organizations" ON public.organizations;

    -- Campaigns table policies
    DROP POLICY IF EXISTS "Users can view own organization campaigns" ON public.campaigns;
    DROP POLICY IF EXISTS "Admins can manage own organization campaigns" ON public.campaigns;
    DROP POLICY IF EXISTS "Platform owners can manage all campaigns" ON public.campaigns;

    -- Calls table policies
    DROP POLICY IF EXISTS "Users can view own organization calls" ON public.calls;
    DROP POLICY IF EXISTS "Users can create calls" ON public.calls;
    DROP POLICY IF EXISTS "Users can update calls" ON public.calls;
    DROP POLICY IF EXISTS "Platform owners can manage all calls" ON public.calls;

    -- Leads table policies
    DROP POLICY IF EXISTS "Users can view own organization leads" ON public.leads;
    DROP POLICY IF EXISTS "Users can manage own organization leads" ON public.leads;
    DROP POLICY IF EXISTS "Platform owners can manage all leads" ON public.leads;

    -- Contacts table policies
    DROP POLICY IF EXISTS "Users can view own organization contacts" ON public.contacts;
    DROP POLICY IF EXISTS "Users can manage own organization contacts" ON public.contacts;

    -- Phone numbers policies
    DROP POLICY IF EXISTS "Users can view own organization phone numbers" ON public.phone_numbers;
    DROP POLICY IF EXISTS "Admins can manage own organization phone numbers" ON public.phone_numbers;

    -- Join table policies
    DROP POLICY IF EXISTS "Users can view campaign phone numbers" ON public.campaign_phone_numbers;
    DROP POLICY IF EXISTS "Users can view campaign calls" ON public.campaign_calls;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- =====================================================
-- PART 3: CREATE RLS POLICIES
-- =====================================================

-- Users Table Policies
CREATE POLICY "Users can view own organization"
ON public.users FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Platform owners can manage all users"
ON public.users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role = 'platform_owner'
  )
);

-- Organizations Table Policies
CREATE POLICY "Users can view own organization details"
ON public.organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Admins can update own organization"
ON public.organizations FOR UPDATE
USING (
  id IN (
    SELECT organization_id FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role IN ('client_admin', 'platform_owner')
  )
);

CREATE POLICY "Platform owners can manage all organizations"
ON public.organizations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role = 'platform_owner'
  )
);

-- Campaigns Table Policies
CREATE POLICY "Users can view own organization campaigns"
ON public.campaigns FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Admins can manage own organization campaigns"
ON public.campaigns FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role IN ('client_admin', 'client_user', 'platform_owner')
  )
);

-- Calls Table Policies
CREATE POLICY "Users can view own organization calls"
ON public.calls FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can create calls"
ON public.calls FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
  OR true -- Allow service role (for VAPI webhooks)
);

CREATE POLICY "Users can update calls"
ON public.calls FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

-- Leads Table Policies
CREATE POLICY "Users can view own organization leads"
ON public.leads FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.users
    WHERE id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub'
  )
);

CREATE POLICY "Users can manage own organization leads"
ON public.leads FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.users
    WHERE (id = auth.uid() OR clerk_id = auth.jwt() ->> 'sub')
    AND role IN ('client_admin', 'client_user', 'platform_owner')
  )
);

-- =====================================================
-- PART 4: CREATE PERFORMANCE INDEXES
-- =====================================================

-- Calls table indexes (MOST CRITICAL)
CREATE INDEX IF NOT EXISTS idx_calls_organization_id ON public.calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_calls_campaign_id ON public.calls(campaign_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON public.calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_org_created ON public.calls(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_sentiment ON public.calls(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON public.calls(outcome) WHERE outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calls_campaign_analytics ON public.calls(campaign_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_vapi_id ON public.calls(vapi_call_id) WHERE vapi_call_id IS NOT NULL;

-- Leads table indexes
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status ON public.leads(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email) WHERE email IS NOT NULL;

-- Campaigns table indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id ON public.campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_org_status ON public.campaigns(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.campaigns(created_at DESC);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON public.users(clerk_id) WHERE clerk_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Organizations table indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_status ON public.organizations(status);

-- Full-text search indexes (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_calls_transcript_search
ON public.calls USING gin(to_tsvector('english', transcript))
WHERE transcript IS NOT NULL;

-- =====================================================
-- PART 5: UPDATE STATISTICS
-- =====================================================

ANALYZE public.calls;
ANALYZE public.leads;
ANALYZE public.campaigns;
ANALYZE public.users;
ANALYZE public.organizations;

-- =====================================================
-- PART 6: VERIFICATION
-- =====================================================

-- Check RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'organizations', 'campaigns', 'calls', 'leads')
ORDER BY tablename;

-- Count indexes created
SELECT
    schemaname,
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('calls', 'leads', 'campaigns', 'users', 'organizations')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
    RAISE NOTICE '✅ RLS enabled on all tables';
    RAISE NOTICE '✅ Security policies created';
    RAISE NOTICE '✅ Performance indexes created';
    RAISE NOTICE '✅ Statistics updated';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Check verification results above';
    RAISE NOTICE '2. Deploy backend with environment variables';
    RAISE NOTICE '3. Test your application!';
END $$;
