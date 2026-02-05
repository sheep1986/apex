
-- 1. Create voice_calls table for ID Mapping
CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  assistant_id UUID REFERENCES assistants(id),
  provider_call_id TEXT, -- Null initially, populated after provider response
  provider TEXT DEFAULT 'voice_engine',
  status TEXT DEFAULT 'initiating',
  customer_number TEXT,
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_calls_provider_id ON voice_calls(provider_call_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_org_id ON voice_calls(organization_id);

-- 2. Standardize apply_ledger_entry RPC
-- Drops existing to ensure signature match
DROP FUNCTION IF EXISTS apply_ledger_entry;

CREATE OR REPLACE FUNCTION apply_ledger_entry(
  p_organization_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_description TEXT,
  p_reference_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_new_balance NUMERIC;
  v_ledger_id UUID;
BEGIN
  -- Idempotency Check
  IF p_reference_id IS NOT NULL THEN
    SELECT id INTO v_ledger_id FROM credits_ledger WHERE reference_id = p_reference_id LIMIT 1;
    IF v_ledger_id IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'id', v_ledger_id, 'message', 'Already processed');
    END IF;
  END IF;

  -- Insert Ledger Entry
  INSERT INTO credits_ledger (
    organization_id,
    amount,
    type,
    description,
    reference_id,
    metadata,
    created_at
  ) VALUES (
    p_organization_id,
    p_amount,
    p_type,
    p_description,
    p_reference_id,
    p_metadata,
    now()
  ) RETURNING id INTO v_ledger_id;

  -- Update Organization Balance
  UPDATE organizations
  SET credit_balance = COALESCE(credit_balance, 0) + p_amount,
      updated_at = now()
  WHERE id = p_organization_id
  RETURNING credit_balance INTO v_new_balance;

  RETURN jsonb_build_object(
    'success', true,
    'ledger_id', v_ledger_id,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;
