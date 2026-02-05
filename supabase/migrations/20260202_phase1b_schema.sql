-- Phase 1B: Zero-Trace Core Backend Schema
-- REVISED: Uses public.profiles, abstract provider columns, and atomic ledger functions.

-- 1. Ensure Profiles Exist (Foreign Key Target)
-- We assume auth.users exists. We create public.profiles to extend it if not already present.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  clerk_id TEXT UNIQUE, -- Legacy support
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  avatar_url TEXT,
  role TEXT DEFAULT 'client_user'
);

-- Enable RLS on profiles if mostly new
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);


-- 2. Organizations: Add credit_balance
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10, 4) DEFAULT 0.0000;


-- 3. Organization Members (Corrected FK)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- References PROFILES
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);


-- 4. Assistants (Zero-Trace Abstraction)
CREATE TABLE IF NOT EXISTS public.assistants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'vapi', -- Internal only
  provider_assistant_id TEXT NOT NULL, -- Was vapi_assistant_id
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. Credits Ledger (Security Enforced)
CREATE TABLE IF NOT EXISTS public.credits_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount DECIMAL(10, 4) NOT NULL, -- Negative for cost, Positive for top-up
  type TEXT NOT NULL, -- 'trial', 'topup', 'usage'
  description TEXT,
  reference_id TEXT, -- stripe_charge_id or call_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Atomic Ledger Function (P0-3) behavior
CREATE OR REPLACE FUNCTION apply_ledger_entry(
  p_org_id UUID,
  p_amount DECIMAL,
  p_type TEXT,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  -- Insert Ledger
  INSERT INTO public.credits_ledger (organization_id, amount, type, description, reference_id)
  VALUES (p_org_id, p_amount, p_type, p_description, p_reference_id);

  -- Update Balance (Atomic)
  UPDATE public.organizations
  SET credit_balance = credit_balance + p_amount
  WHERE id = p_org_id
  RETURNING credit_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. RLS & Permissions Strategy

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;

-- Organization Members
CREATE POLICY "Users can view their own memberships" ON public.organization_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid()); -- Simple check since profiles.id = auth.uid

-- Organizations
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.organizations.id
      AND user_id = auth.uid()
    )
  );
  
CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Assistants
CREATE POLICY "Org members can view assistants" ON public.assistants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.assistants.organization_id
      AND user_id = auth.uid()
    )
  );

-- Credits Ledger (Strict Security P0-2)
-- Authenticated users: SELECT only (via membership), NO INSERT/UPDATE
GRANT SELECT ON public.credits_ledger TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.credits_ledger FROM authenticated;

CREATE POLICY "Org members can view ledger" ON public.credits_ledger
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = public.credits_ledger.organization_id
      AND user_id = auth.uid()
    )
  );
