-- ============================================================================
-- FIX: Infinite recursion in platform-owner RLS policies
-- ============================================================================
-- Problem: The "Platform owners can read all profiles" policy on the profiles
-- table queries the profiles table itself, causing infinite recursion.
-- Additionally, platform-owner policies on organizations, voice_calls, and
-- campaigns also query profiles, which triggers the same recursive RLS.
--
-- Solution: Create a SECURITY DEFINER function that bypasses RLS to check
-- if the current user is a platform_owner. This is the standard Supabase
-- pattern for avoiding recursive RLS policies.
-- ============================================================================

-- Step 1: Create a helper function that bypasses RLS
CREATE OR REPLACE FUNCTION is_platform_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'platform_owner'
    );
$$;

-- Step 2: Drop the recursive policies
DROP POLICY IF EXISTS "Platform owners can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Platform owners can read all orgs" ON organizations;
DROP POLICY IF EXISTS "Platform owners can view all calls" ON voice_calls;
DROP POLICY IF EXISTS "Platform owners can view all campaigns" ON campaigns;

-- Step 3: Recreate using the helper function (no recursion)
CREATE POLICY "Platform owners can read all profiles" ON profiles
    FOR SELECT USING (is_platform_owner());

CREATE POLICY "Platform owners can read all orgs" ON organizations
    FOR SELECT USING (is_platform_owner());

CREATE POLICY "Platform owners can view all calls" ON voice_calls
    FOR SELECT USING (is_platform_owner());

CREATE POLICY "Platform owners can view all campaigns" ON campaigns
    FOR SELECT USING (is_platform_owner());

-- ============================================================================
-- Also fix the support_tickets policies that reference profiles in a similar way
-- (from the earlier sms_email migration — these could also cause recursion)
-- ============================================================================

-- Check if these exist and recreate them safely
DROP POLICY IF EXISTS "platform_owners_support_tickets" ON support_tickets;
DROP POLICY IF EXISTS "platform_owners_ticket_messages" ON support_ticket_messages;

-- Recreate support ticket policies using the helper function
CREATE POLICY "platform_owners_support_tickets" ON support_tickets
    FOR ALL USING (
        is_platform_owner()
        OR organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "platform_owners_ticket_messages" ON support_ticket_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM support_tickets st
            WHERE st.id = support_ticket_messages.ticket_id
            AND (
                is_platform_owner()
                OR st.organization_id IN (
                    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Drop the old org-members-only ticket select policy (now merged into the above)
DROP POLICY IF EXISTS "org_members_own_tickets" ON support_tickets;

-- ============================================================================
-- DONE! The is_platform_owner() function uses SECURITY DEFINER which bypasses
-- RLS, so it can safely read the profiles table without triggering recursion.
-- ============================================================================
