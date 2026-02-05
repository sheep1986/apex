
-- Phase 3.2 Completion: CRM Activities, Tickets, Notes & Call Finalization

-- 1. Create Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id),
    source TEXT NOT NULL, -- 'voice_voicemail', 'voice_urgent', 'manual', 'email'
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    description TEXT,
    assignment_id UUID, -- Internal user ID or Team ID (future)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_org_contact ON tickets(organization_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- 2. Create Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    entity_type TEXT NOT NULL, -- 'contact', 'ticket', 'call'
    entity_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_by UUID, -- User ID
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_entity ON notes(organization_id, entity_type, entity_id);

-- 3. Create Activities Table (Unified Timeline)
-- This table is a normalized view or direct store for timeline events
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id),
    type TEXT NOT NULL, -- 'call_inbound', 'call_outbound', 'ticket_created', 'note_added', 'sms_in', 'sms_out'
    reference_id UUID, -- ID of the voice_call, ticket, note, etc.
    summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activities_timeline ON activities(organization_id, contact_id, occurred_at DESC);

-- 4. Extend voice_calls for Finalization
ALTER TABLE voice_calls
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS disposition TEXT, -- 'completed', 'voicemail', 'rejected', 'busy', 'failed'
ADD COLUMN IF NOT EXISTS recording_path TEXT,
ADD COLUMN IF NOT EXISTS transcript_summary TEXT,
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;

-- 5. RLS Policies
-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Tickets Policy
CREATE POLICY "Users can view tickets in their org" ON tickets
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert tickets in their org" ON tickets
    FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update tickets in their org" ON tickets
    FOR UPDATE USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Notes Policy
CREATE POLICY "Users can view notes in their org" ON notes
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert notes in their org" ON notes
    FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Activities Policy
CREATE POLICY "Users can view activities in their org" ON activities
    FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
-- (Activities are mostly system-generated via triggers or edge functions, but if UI creates them:)
CREATE POLICY "Users can insert activities in their org" ON activities
    FOR INSERT WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

