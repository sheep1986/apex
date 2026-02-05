
-- Phase 3.1: Inbound MVP Schema

-- 1. Phone Numbers Table
CREATE TABLE IF NOT EXISTS phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    e164 TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, released, pending
    inbound_route_id UUID, -- References inbound_routes(id), added in step 2
    provider_number_sid TEXT, -- Zero-Trace: Server-only
    capabilities JSONB DEFAULT '{}'::jsonb, -- sms, voice, mms
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Inbound Routes Table
CREATE TABLE IF NOT EXISTS inbound_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    config JSONB DEFAULT '{}'::jsonb, -- { "business_hours": {...}, "ivr": {...}, "destination": {...} }
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraint now that table exists
ALTER TABLE phone_numbers 
ADD CONSTRAINT fk_inbound_route 
FOREIGN KEY (inbound_route_id) REFERENCES inbound_routes(id);

-- 3. Forwarding Targets
CREATE TABLE IF NOT EXISTS forwarding_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    e164 TEXT NOT NULL,
    strategy TEXT DEFAULT 'direct', -- direct, hunt_group
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Extend voice_calls Table
-- Check column existence to be safe for re-runs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_calls' AND column_name = 'direction') THEN
        ALTER TABLE voice_calls ADD COLUMN direction TEXT DEFAULT 'outbound'; -- inbound, outbound
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_calls' AND column_name = 'phone_number_id') THEN
        ALTER TABLE voice_calls ADD COLUMN phone_number_id UUID REFERENCES phone_numbers(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_calls' AND column_name = 'inbound_route_id') THEN
        ALTER TABLE voice_calls ADD COLUMN inbound_route_id UUID REFERENCES inbound_routes(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_calls' AND column_name = 'forwarding_target_id') THEN
        ALTER TABLE voice_calls ADD COLUMN forwarding_target_id UUID REFERENCES forwarding_targets(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_calls' AND column_name = 'recording_policy') THEN
        ALTER TABLE voice_calls ADD COLUMN recording_policy TEXT DEFAULT 'none'; -- none, always, consent
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_calls' AND column_name = 'recording_path') THEN
        ALTER TABLE voice_calls ADD COLUMN recording_path TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_calls' AND column_name = 'transcript_path') THEN
        ALTER TABLE voice_calls ADD COLUMN transcript_path TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_calls' AND column_name = 'contact_id') THEN
        ALTER TABLE voice_calls ADD COLUMN contact_id UUID; -- Will reference contacts table later
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'voice_calls' AND column_name = 'provider_metadata') THEN
        ALTER TABLE voice_calls ADD COLUMN provider_metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 5. Voice Call Events
CREATE TABLE IF NOT EXISTS voice_call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    call_id UUID NOT NULL REFERENCES voice_calls(id),
    type TEXT NOT NULL, -- ivr_input, routed, forwarded, voicemail
    payload JSONB DEFAULT '{}'::jsonb,
    reference_id TEXT, -- Optional idempotency key (e.g. provider event ID)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotency for Events
CREATE UNIQUE INDEX IF NOT EXISTS idx_voice_call_events_idempotency 
ON voice_call_events (organization_id, call_id, type, reference_id) 
WHERE reference_id IS NOT NULL;
