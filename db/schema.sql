-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 0. CLEANUP (Wipe old & new to start fresh)
-- Legacy tables found in analysis
DROP TABLE IF EXISTS billing CASCADE;
DROP TABLE IF EXISTS billing_records CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE; 
-- Our Target Schema tables (in reverse dependency order)
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS crm_deals CASCADE;
DROP TABLE IF EXISTS crm_leads CASCADE;
DROP TABLE IF EXISTS phone_numbers CASCADE;
DROP TABLE IF EXISTS assistants CASCADE;
DROP TABLE IF EXISTS credits_ledger CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- 1. ORGANIZATIONS (The Tenant)
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Billing & Keys
  stripe_customer_id text,
  subscription_status text default 'active', -- active, past_due, canceled
  credit_balance numeric default 0.00, -- The "Float" logic
  
  -- Vapi & Twilio Config (Stored securely, or we use Master Key)
  vapi_org_id text, -- If we use Vapi Sub-Orgs
  twilio_sid text
);

-- 2. PROFILES (Users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  organization_id uuid references organizations(id),
  role text check (role in ('super_admin', 'org_owner', 'admin', 'agent')) default 'agent',
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CREDITS LEDGER (The Money Trail)
create table credits_ledger (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) not null,
  amount numeric not null, -- Positive for Topup, Negative for Usage
  balance_after numeric not null, -- Snapshot of balance at this time
  type text check (type in ('topup', 'usage', 'monthly_fee', 'adjustment', 'refund')) not null,
  description text, -- e.g. "Call to +447..."
  reference_id text, -- Stripe Charge ID or Call UUID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ASSISTANTS (Vapi Agents)
create table assistants (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) not null,
  vapi_assistant_id text not null, -- The ID from Vapi API
  name text not null,
  type text check (type in ('outbound', 'inbound')) default 'outbound',
  configuration jsonb default '{}'::jsonb, -- Store local copy of prompt/voice settings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. PHONE NUMBERS (Twilio + Vapi)
create table phone_numbers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) not null,
  number text not null, -- E.164 format (+44...)
  twilio_sid text,
  vapi_phone_id text,
  assigned_assistant_id uuid references assistants(id),
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. CRM: LEADS (The People we call)
create table crm_leads (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) not null,
  first_name text,
  last_name text,
  phone text not null,
  email text,
  status text default 'new', -- new, contacted, qualified, converted, lost
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. CRM: DEALS (The Sales Pipeline)
create table crm_deals (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) not null,
  lead_id uuid references crm_leads(id),
  title text not null, -- e.g. "Interested in Premium Plan"
  value numeric,
  stage text default 'pipeline', -- pipeline, negotiation, closed_won, closed_lost
  assigned_to_user_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. CALL LOGS & TRANSCRIPTS (The Analyst Integration)
create table call_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) not null,
  assistant_id uuid references assistants(id),
  lead_id uuid references crm_leads(id),
  vapi_call_id text not null,
  duration_seconds integer,
  cost numeric,
  recording_url text,
  transcript text,
  summary text, -- AI Generated Summary
  sentiment_score numeric, -- AI Sentiment
  outcome_label text, -- "Sale", "Voicemail", etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Goal: Users can ONLY see data from their own Organization.

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table credits_ledger enable row level security;
alter table assistants enable row level security;
alter table phone_numbers enable row level security;
alter table crm_leads enable row level security;
alter table crm_deals enable row level security;
alter table call_logs enable row level security;

-- Policy: Organizations (Users can see their own org)
create policy "Users can view own organization" on organizations
  for select using (id in (select organization_id from profiles where auth.uid() = profiles.id));

-- Policy: Profiles (Users can see profiles in their org)
create policy "Users can view members of own org" on profiles
  for select using (organization_id in (select organization_id from profiles where auth.uid() = profiles.id));

-- Policy: Everything else (Generic Org Filter)
-- Applies to: credits_ledger, assistants, phone_numbers, crm_leads, crm_deals, call_logs
create policy "Users can view own credits" on credits_ledger
  for select using (organization_id in (select organization_id from profiles where auth.uid() = profiles.id));
  
create policy "Users can view own assistants" on assistants
  for all using (organization_id in (select organization_id from profiles where auth.uid() = profiles.id));

create policy "Users can view own phones" on phone_numbers
  for all using (organization_id in (select organization_id from profiles where auth.uid() = profiles.id));

create policy "Users can view own leads" on crm_leads
  for all using (organization_id in (select organization_id from profiles where auth.uid() = profiles.id));

create policy "Users can view own deals" on crm_deals
  for all using (organization_id in (select organization_id from profiles where auth.uid() = profiles.id));
  
create policy "Users can view own logs" on call_logs
  for select using (organization_id in (select organization_id from profiles where auth.uid() = profiles.id));
