
-- Unique Constraint for Idempotency
ALTER TABLE credits_ledger
ADD CONSTRAINT unique_ledger_entry UNIQUE (organization_id, reference_id, type);

-- Updated apply_ledger_entry with Conflict Handling
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
  -- Insert with Conflict Handling
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
  ) 
  ON CONFLICT (organization_id, reference_id, type) DO NOTHING
  RETURNING id INTO v_ledger_id;

  -- If inserted, update balance
  IF v_ledger_id IS NOT NULL THEN
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
  ELSE
    -- Already exists
    SELECT id, credit_balance INTO v_ledger_id, v_new_balance 
    FROM credits_ledger l
    JOIN organizations o ON o.id = l.organization_id
    WHERE l.organization_id = p_organization_id 
      AND l.reference_id = p_reference_id 
      AND l.type = p_type;
      
    RETURN jsonb_build_object('success', true, 'id', v_ledger_id, 'message', 'Already processed');
  END IF;
END;
$$ LANGUAGE plpgsql;
