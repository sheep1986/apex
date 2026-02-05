-- Phase 3.2 Hardening: Idempotency & Secure Recording

-- 1. Activities Idempotency
-- Ensure unique activity per type/reference within an org
-- Using checks to avoid errors if data exists (though strictly this is a dev/staging env)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_activities_org_type_ref') THEN
        ALTER TABLE activities
        ADD CONSTRAINT uq_activities_org_type_ref UNIQUE (organization_id, type, reference_id);
    END IF;
END $$;

-- 2. Tickets Idempotency (for Voicemail)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS reference_call_id UUID REFERENCES voice_calls(id);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_tickets_org_ref_source') THEN
        ALTER TABLE tickets
        ADD CONSTRAINT uq_tickets_org_ref_source UNIQUE (organization_id, reference_call_id, source);
    END IF;
END $$;

-- 3. Secure Recording Storage (Pending Sync)
CREATE TABLE IF NOT EXISTS voice_call_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    voice_call_id UUID NOT NULL REFERENCES voice_calls(id),
    provider_recording_ref TEXT NOT NULL, -- Hidden/Private URL or ID
    status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
    storage_path TEXT, -- Internal path after sync
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for Recordings
ALTER TABLE voice_call_recordings ENABLE ROW LEVEL SECURITY;

-- Allow Service Role full access (default), but maybe restrict users until synced?
-- For now, owners can view if they need to debug, but frontend shouldn't query this directly for audio playback until synced.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view recordings in their org' AND tablename = 'voice_call_recordings') THEN
        CREATE POLICY "Users can view recordings in their org" ON voice_call_recordings
            FOR SELECT USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
    END IF;
END $$;

-- 4. Voice Call Events Idempotency (Optional but recommended)
-- Prevent duplicate call.ended events if possible, or application layer handles it.
-- Adding a loose constraint might be tricky if reference_id isn't standard. 
-- For now, reliance on application-layer checks or simple duplication tolerance for raw events is acceptable, 
-- but we'll add an index to help debugging.
CREATE INDEX IF NOT EXISTS idx_voice_call_events_call_type ON voice_call_events(voice_call_id, type);
