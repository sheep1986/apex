-- Phase 3.5: Telephony Status & Finalization
-- Goal: Support call completion webhook, store metrics, and ensure idempotency.
-- Critical: Segregate sensitive data (Recordings, Transcripts) and lock down PII.

-- 1. Extend voice_calls for Finalization (Non-Sensitive Metrics)
ALTER TABLE voice_calls
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS outcome TEXT, -- e.g. completed, busy, failed, voicemail
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS recording_path TEXT; -- File path in storage (populated later, NOT the raw URL)

-- 2. Voice Call Finalisations (Idempotency Lock)
-- Prevents double-processing of the 'end-of-call-report' or similar terminal webhooks.
CREATE TABLE IF NOT EXISTS voice_call_finalisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    provider_call_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- e.g. 'end-of-call-report'
    processed_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT uq_finalisation_idempotency UNIQUE (organization_id, provider_call_id, event_type)
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_voice_call_finalisations_lookup 
    ON voice_call_finalisations(provider_call_id);

-- 3. Security: RLS for Finalisations (Service Role Only)
ALTER TABLE voice_call_finalisations ENABLE ROW LEVEL SECURITY;
-- No policies = No access for generic users. Service role bypasses.
REVOKE ALL ON voice_call_finalisations FROM anon;
REVOKE ALL ON voice_call_finalisations FROM authenticated;


-- 4. Voice Call Private Data (Zero-Trace P0)
-- Stores Sensitive Transcripts, Summaries, and Recording Refs.
-- Strictly Service-Role access.
CREATE TABLE IF NOT EXISTS voice_call_private (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    voice_call_id UUID NOT NULL REFERENCES voice_calls(id),
    
    -- Sensitive Fields
    provider_recording_ref TEXT, -- Raw Provider URL
    transcript_full TEXT,
    transcript_summary TEXT, -- Explicitly moved here to avoid leaking PII in main table
    provider_metadata JSONB DEFAULT '{}'::jsonb, -- Any other dump
    
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voice_call_private ENABLE ROW LEVEL SECURITY;
-- Explicitly revoke from anon/auth
REVOKE ALL ON voice_call_private FROM anon;
REVOKE ALL ON voice_call_private FROM authenticated;


-- 5. Voice Call Recordings (Legacy/Specific Ref Table)
-- We merge this concept into 'voice_call_private' effectively, but keeping existing table if created previously.
-- To be safe, we create if not exists, but we will prefer using 'voice_call_private' for new logic 
-- OR use this specifically for the file references.
-- Let's stick to the User request: "store provider recording reference ONLY in voice_call_recordings.provider_recording_ref"
-- So we keep usage of 'voice_call_recordings' for the Ref, and 'voice_call_private' for Transcripts?
-- Actually, simpler to put all sensitive post-call artifacts in one restricted place if fresh, 
-- but user specific request: "store provider recording reference ONLY in voice_call_recordings".
-- We will honor that specific table for the recording ref.

CREATE TABLE IF NOT EXISTS voice_call_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    voice_call_id UUID REFERENCES voice_calls(id),
    provider_recording_ref TEXT, -- Sensitive: Provider URL
    storage_path TEXT, -- Internal Storage Path
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE voice_call_recordings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON voice_call_recordings FROM anon;
REVOKE ALL ON voice_call_recordings FROM authenticated;

-- Ensure we didn't miss creating the table in previous runs
-- (Included in create block above)
