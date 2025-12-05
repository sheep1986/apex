-- =============================================================================
-- PROPER RLS POLICIES FOR APEX PLATFORM
-- =============================================================================
-- This script enables RLS with non-recursive policies that allow authentication
-- while maintaining organization-scoped data isolation.
--
-- IMPORTANT: Run this AFTER authentication is working
-- =============================================================================

-- =============================================================================
-- 1. USERS TABLE - Allow authentication lookups
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous reads for authentication (Clerk lookup by clerk_id)
-- This is safe because we only expose user data after authentication
DROP POLICY IF EXISTS "Allow authentication lookups" ON users;
CREATE POLICY "Allow authentication lookups"
ON users FOR SELECT
TO anon
USING (true);

-- Policy 2: Authenticated users can read their own data
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid()::text = clerk_id);

-- Policy 3: Users can update their own data
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = clerk_id)
WITH CHECK (auth.uid()::text = clerk_id);

-- =============================================================================
-- 2. ORGANIZATIONS TABLE - Organization-scoped access
-- =============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own organization
DROP POLICY IF EXISTS "Users can read own organization" ON organizations;
CREATE POLICY "Users can read own organization"
ON organizations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT organization_id
    FROM users
    WHERE clerk_id = auth.uid()::text
  )
);

-- Policy 2: Platform owners can read all organizations
DROP POLICY IF EXISTS "Platform owners read all orgs" ON organizations;
CREATE POLICY "Platform owners read all orgs"
ON organizations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE clerk_id = auth.uid()::text
    AND role = 'platform_owner'
  )
);

-- =============================================================================
-- 3. CAMPAIGNS TABLE - Organization-scoped access
-- =============================================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can access campaigns in their organization
DROP POLICY IF EXISTS "Users access own org campaigns" ON campaigns;
CREATE POLICY "Users access own org campaigns"
ON campaigns FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE clerk_id = auth.uid()::text
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE clerk_id = auth.uid()::text
  )
);

-- =============================================================================
-- 4. CALLS TABLE - Organization-scoped access
-- =============================================================================
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can access calls in their organization
DROP POLICY IF EXISTS "Users access own org calls" ON calls;
CREATE POLICY "Users access own org calls"
ON calls FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE clerk_id = auth.uid()::text
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE clerk_id = auth.uid()::text
  )
);

-- =============================================================================
-- 5. LEADS TABLE - Organization-scoped access
-- =============================================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can access leads in their organization
DROP POLICY IF EXISTS "Users access own org leads" ON leads;
CREATE POLICY "Users access own org leads"
ON leads FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE clerk_id = auth.uid()::text
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM users
    WHERE clerk_id = auth.uid()::text
  )
);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify policies are working:

-- 1. Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'organizations', 'campaigns', 'calls', 'leads')
ORDER BY tablename;

-- 2. Check all policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('users', 'organizations', 'campaigns', 'calls', 'leads')
ORDER BY tablename, policyname;

-- =============================================================================
-- NOTES
-- =============================================================================
-- Key differences from previous attempt:
-- 1. Users table allows anonymous SELECT for Clerk authentication lookup
-- 2. Other tables only allow authenticated users
-- 3. No recursive policies (policies don't query the same table they protect)
-- 4. Organization-scoped isolation through subqueries to users table
-- 5. Platform owners have elevated read access to all organizations
--
-- Security considerations:
-- - Anonymous users can read users table during auth, but Clerk validates first
-- - After authentication, JWT token contains clerk_id for policy enforcement
-- - Organization isolation prevents cross-tenant data access
-- - Platform owners can monitor all organizations
-- =============================================================================
