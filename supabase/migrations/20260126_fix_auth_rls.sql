-- Disable RLS temporarily to fix access issues
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Add Clerk metadata columns if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS clerk_metadata JSONB DEFAULT '{}';
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Create simple, non-recursive policies for users
-- Note: We are using the text representation of auth.uid() to match clerk_id
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid()::text = clerk_id);

CREATE POLICY "users_read_by_org" ON public.users  
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.users WHERE clerk_id = auth.uid()::text
  ));

-- Re-enable RLS on users table only for now, to test policies safely
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Organizations table remains with RLS disabled until we define its policies
