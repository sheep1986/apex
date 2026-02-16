-- ============================================================================
-- Trinity Platform: Subscription Billing Migration
-- Adds plan tiers, subscription tracking, usage metering, and limit enforcement
-- ============================================================================

-- ── 1. Extend organizations table ──────────────────────────────────────────

-- Subscription tracking
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_period_start TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;

-- Plan limits (defaults = Starter tier)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS included_minutes INTEGER DEFAULT 1000;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_phone_numbers INTEGER DEFAULT 1;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_assistants INTEGER DEFAULT 3;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 3;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS overage_rate_per_minute NUMERIC DEFAULT 0.15;

-- Ensure plan column exists with correct default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'plan'
  ) THEN
    ALTER TABLE organizations ADD COLUMN plan TEXT DEFAULT 'starter';
  END IF;
END $$;

-- Ensure subscription_status exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE organizations ADD COLUMN subscription_status TEXT DEFAULT 'trialing';
  END IF;
END $$;

-- Ensure max_concurrent_calls exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'max_concurrent_calls'
  ) THEN
    ALTER TABLE organizations ADD COLUMN max_concurrent_calls INTEGER DEFAULT 2;
  END IF;
END $$;

-- Soft-deprecate org-level provider keys (COMMENT only, don't drop)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'vapi_private_key'
  ) THEN
    COMMENT ON COLUMN organizations.vapi_private_key IS 'DEPRECATED: All orgs now use platform master key. Do not read.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'vapi_public_key'
  ) THEN
    COMMENT ON COLUMN organizations.vapi_public_key IS 'DEPRECATED: All orgs now use platform master key. Do not read.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'vapi_org_id'
  ) THEN
    COMMENT ON COLUMN organizations.vapi_org_id IS 'DEPRECATED: All orgs now use platform master key. Do not read.';
  END IF;
END $$;


-- ── 2. Subscription Usage Tracking ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    minutes_used NUMERIC DEFAULT 0,
    overage_minutes NUMERIC DEFAULT 0,
    overage_billed BOOLEAN DEFAULT false,
    calls_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_usage_period UNIQUE (organization_id, period_start)
);

ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Org members can view their own usage
CREATE POLICY "Org members can view usage" ON subscription_usage
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Only service role can write (backend functions)
GRANT SELECT ON subscription_usage TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON subscription_usage FROM authenticated;


-- ── 3. RPC: record_call_usage ──────────────────────────────────────────────
-- Called from voice-webhook.ts at end-of-call to atomically track minutes used.

CREATE OR REPLACE FUNCTION record_call_usage(
    p_organization_id UUID,
    p_duration_seconds INTEGER,
    p_call_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_org RECORD;
    v_usage RECORD;
    v_minutes NUMERIC;
    v_included_minutes INTEGER;
    v_overage_before NUMERIC;
    v_overage_after NUMERIC;
    v_overage_this_call NUMERIC;
BEGIN
    -- Get org plan details
    SELECT plan, included_minutes, subscription_period_start, subscription_period_end,
           overage_rate_per_minute, subscription_status
    INTO v_org FROM organizations WHERE id = p_organization_id;

    IF v_org IS NULL THEN
        RETURN jsonb_build_object('error', 'Organization not found');
    END IF;

    v_minutes := ROUND(p_duration_seconds / 60.0, 2);
    v_included_minutes := COALESCE(v_org.included_minutes, 1000);

    -- Get current overage BEFORE this call (for calculating delta)
    SELECT GREATEST(0, minutes_used - v_included_minutes) INTO v_overage_before
    FROM subscription_usage
    WHERE organization_id = p_organization_id
      AND period_start = COALESCE(v_org.subscription_period_start, date_trunc('month', now()));

    v_overage_before := COALESCE(v_overage_before, 0);

    -- Upsert usage for current period
    INSERT INTO subscription_usage (
        organization_id, period_start, period_end, minutes_used, calls_count
    ) VALUES (
        p_organization_id,
        COALESCE(v_org.subscription_period_start, date_trunc('month', now())),
        COALESCE(v_org.subscription_period_end, date_trunc('month', now()) + interval '1 month'),
        v_minutes,
        1
    )
    ON CONFLICT (organization_id, period_start)
    DO UPDATE SET
        minutes_used = subscription_usage.minutes_used + v_minutes,
        calls_count = subscription_usage.calls_count + 1,
        updated_at = now()
    RETURNING * INTO v_usage;

    -- Calculate new overage
    v_overage_after := GREATEST(0, v_usage.minutes_used - v_included_minutes);
    v_overage_this_call := GREATEST(0, v_overage_after - v_overage_before);

    -- Update overage_minutes on the usage row
    UPDATE subscription_usage
    SET overage_minutes = v_overage_after
    WHERE id = v_usage.id;

    RETURN jsonb_build_object(
        'success', true,
        'minutes_used', v_usage.minutes_used,
        'included_minutes', v_included_minutes,
        'overage_minutes', v_overage_after,
        'overage_this_call', v_overage_this_call,
        'overage_rate', COALESCE(v_org.overage_rate_per_minute, 0.15),
        'calls_count', v_usage.calls_count,
        'plan', v_org.plan
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 4. RPC: check_call_allowed ─────────────────────────────────────────────
-- Called before initiating a call to verify the org has capacity.

CREATE OR REPLACE FUNCTION check_call_allowed(
    p_organization_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_org RECORD;
    v_minutes_used NUMERIC;
    v_included_minutes INTEGER;
BEGIN
    SELECT plan, subscription_status, included_minutes, max_concurrent_calls,
           overage_rate_per_minute, credit_balance,
           subscription_period_start
    INTO v_org FROM organizations WHERE id = p_organization_id;

    IF v_org IS NULL THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'Organization not found');
    END IF;

    -- Check subscription status (allow trialing for testing)
    IF COALESCE(v_org.subscription_status, 'trialing') NOT IN ('active', 'trialing') THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Subscription is ' || COALESCE(v_org.subscription_status, 'inactive') || '. Please update your billing.'
        );
    END IF;

    -- Get current period usage
    SELECT minutes_used INTO v_minutes_used
    FROM subscription_usage
    WHERE organization_id = p_organization_id
      AND period_start = COALESCE(v_org.subscription_period_start, date_trunc('month', now()));

    v_minutes_used := COALESCE(v_minutes_used, 0);
    v_included_minutes := COALESCE(v_org.included_minutes, 1000);

    -- If over included minutes, check if they have credit for overage
    IF v_minutes_used >= v_included_minutes THEN
        IF COALESCE(v_org.credit_balance, 0) <= 0 THEN
            RETURN jsonb_build_object(
                'allowed', false,
                'reason', 'Included minutes exhausted and no overage credit available. Please top up or upgrade your plan.',
                'minutes_used', v_minutes_used,
                'included_minutes', v_included_minutes
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'allowed', true,
        'minutes_used', v_minutes_used,
        'included_minutes', v_included_minutes,
        'remaining_minutes', GREATEST(0, v_included_minutes - v_minutes_used),
        'credit_balance', COALESCE(v_org.credit_balance, 0),
        'plan', v_org.plan
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 5. Index for performance ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_subscription_usage_org_period
    ON subscription_usage (organization_id, period_start);

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_sub
    ON organizations (stripe_subscription_id)
    WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer
    ON organizations (stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;


-- ── 6. Set defaults for existing orgs ──────────────────────────────────────
-- Existing orgs get starter defaults if not already set

UPDATE organizations
SET plan = 'starter',
    subscription_status = COALESCE(subscription_status, 'trialing'),
    included_minutes = COALESCE(included_minutes, 1000),
    max_phone_numbers = COALESCE(max_phone_numbers, 1),
    max_assistants = COALESCE(max_assistants, 3),
    max_concurrent_calls = COALESCE(max_concurrent_calls, 2),
    max_users = COALESCE(max_users, 3),
    overage_rate_per_minute = COALESCE(overage_rate_per_minute, 0.15)
WHERE plan IS NULL OR plan = '';
