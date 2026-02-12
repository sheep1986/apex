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
DROP TABLE IF EXISTS assistant_tools CASCADE; -- New
DROP TABLE IF EXISTS voice_tools CASCADE; -- New
DROP TABLE IF EXISTS voice_files CASCADE; -- New
DROP TABLE IF EXISTS voice_squads CASCADE; -- New
DROP TABLE IF EXISTS assistants CASCADE;
DROP TABLE IF EXISTS voice_assistants CASCADE; -- Alias cleanup if needed
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
-- Renaming to voice_assistants to align with project consistency? Keeping as 'assistants' for now to avoid breaking existing code
create table assistants (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) not null,
  vapi_assistant_id text not null, -- The ID from Vapi API
  name text not null,
  type text check (type in ('outbound', 'inbound')) default 'outbound',
  configuration jsonb default '{}'::jsonb, -- Store local copy of prompt/voice settings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Create alias view if needed or just stick to table name

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

-- 9. KNOWLEDGE BASE (Files)
create table voice_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  vapi_file_id text not null, -- The ID returned by Vapi API
  filename text not null,
  status text check (status in ('processing', 'ready', 'failed')) default 'processing',
  url text, -- Signed URL or original upload path
  size_bytes bigint,
  created_at timestamptz default now()
);

-- 10. VOICE TOOLS (Function Definitions)
create table voice_tools (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  description text,
  schema jsonb not null, -- The JSON Schema for the function parameters
  type text default 'function', -- 'function', 'dtmf', 'endCall'
  server_url text, -- Optional override for a specific tool webhook
  created_at timestamptz default now()
);

-- 11. ASSISTANT TOOLS (Many-to-Many)
create table assistant_tools (
  assistant_id uuid references assistants(id) on delete cascade,
  tool_id uuid references voice_tools(id) on delete cascade,
  primary key (assistant_id, tool_id)
);

-- 12. SQUADS (Department Routing)
create table voice_squads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  vapi_squad_id text, -- unique ID from Vapi (if persistent)
  members_config jsonb not null, -- Vapi 'members' array JSON
  ui_config jsonb, -- React Flow graph state (nodes, edges)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
alter table voice_files enable row level security;
alter table voice_tools enable row level security;
alter table assistant_tools enable row level security;
alter table voice_squads enable row level security;

-- Policy: Organizations (Users can see their own org)
create policy "Users can view own organization" on organizations
  for select using (id in (select organization_id from profiles where auth.uid() = profiles.id));

-- Policy: Profiles (Users can see profiles in their org)
create policy "Users can view members of own org" on profiles
  for select using (organization_id in (select organization_id from profiles where auth.uid() = profiles.id));

-- Policy: Everything else (Generic Org Filter)
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

-- New Policies for KB/Tools/Squads
create policy "Users can view own files" on voice_files
  for all using (organization_id in (select organization_id from profiles where auth.uid() = profiles.id));

create policy "Users can view own tools" on voice_tools
  for all using (organization_id in (select organization_id from profiles where auth.uid() = profiles.id));

create policy "Users can view assistant tools" on assistant_tools
  for all using (exists (
      select 1 from assistants va
      join profiles p on va.organization_id = p.organization_id
      where va.id = assistant_tools.assistant_id and p.id = auth.uid()
  ));

create policy "Users can view own squads" on voice_squads
  for all using (organization_id in (select organization_id from profiles where auth.uid() = profiles.id));
