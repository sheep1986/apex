
-- Phase 3.2: CRM Foundation

-- 1. Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    phone_e164 TEXT,
    email TEXT,
    name TEXT,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure phone is unique per org to avoid duplicates
    CONSTRAINT uq_contacts_org_phone UNIQUE (organization_id, phone_e164)
);

-- Index for lookup speed during inbound call
CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON contacts(organization_id, phone_e164);

-- 2. Link voice_calls (Already verified column exists, adding index if needed)
CREATE INDEX IF NOT EXISTS idx_voice_calls_contact ON voice_calls(contact_id);

-- 3. RLS Policies
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts in their org" ON contacts
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert contacts in their org" ON contacts
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update contacts in their org" ON contacts
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );
