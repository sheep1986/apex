-- ============================================================================
-- Ensure authenticated users can read/update their own profile row
-- ============================================================================
-- The "Users can view own profile" policy was originally created in
-- 20260202_phase1b_schema.sql, but may be missing if the live DB was
-- provisioned from 20260217100000_full_schema_sync.sql (which only
-- creates the platform_owner policy). This migration is idempotent.
-- ============================================================================

DO $$
BEGIN
  -- SELECT policy: users can read their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT TO authenticated
      USING (auth.uid() = id);
    RAISE NOTICE 'Created "Users can view own profile" policy';
  ELSE
    RAISE NOTICE '"Users can view own profile" policy already exists';
  END IF;

  -- UPDATE policy: users can update their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE TO authenticated
      USING (auth.uid() = id);
    RAISE NOTICE 'Created "Users can update own profile" policy';
  ELSE
    RAISE NOTICE '"Users can update own profile" policy already exists';
  END IF;
END $$;
