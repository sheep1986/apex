
-- Phase 3.1 Fix: Add unique constraint to prevent race conditions on Inbound Webhook
-- Constraint: uq_voice_calls_provider_id (organization_id, provider_call_id)

ALTER TABLE voice_calls
ADD CONSTRAINT uq_voice_calls_provider_id UNIQUE (organization_id, provider_call_id);

-- Optional: Index is implicitly created by UNIQUE constraint in Postgres, 
-- but we can be explicit if needed or just rely on the constraint.
-- Explicit index for read performance on idempotency checks:
CREATE INDEX IF NOT EXISTS idx_voice_calls_org_provider
ON voice_calls (organization_id, provider_call_id);
