-- ============================================================================
-- Trinity Platform: Credit-Based Pricing Migration
-- Moves from flat per-minute overage to credit-based billing with
-- model-aware consumption rates. "AI Employees" is the customer-facing
-- concept; credits are the internal billing engine.
-- ============================================================================

-- ── 1. Credit Rates (Rate Card) ──────────────────────────────────────────────
-- Stores the per-action credit consumption rates. Editable by platform owner
-- without code deploys. The authoritative source for billing calculations.

CREATE TABLE IF NOT EXISTS credit_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL UNIQUE,       -- 'voice_budget', 'voice_standard', 'voice_premium', 'voice_ultra', 'sms', 'email', 'phone_number'
    credits_per_unit INTEGER NOT NULL,      -- credits consumed per unit
    unit TEXT NOT NULL DEFAULT 'minute',    -- 'minute', 'message', 'month'
    cogs_per_unit NUMERIC NOT NULL,         -- underlying cost in GBP for margin tracking
    label TEXT NOT NULL DEFAULT '',         -- display name e.g. "Standard (GPT-4o)"
    is_active BOOLEAN DEFAULT true,
    effective_from TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial rates
INSERT INTO credit_rates (action_type, credits_per_unit, unit, cogs_per_unit, label) VALUES
    ('voice_budget',   18, 'minute',  0.07,   'Budget (Gemini Flash)'),
    ('voice_standard', 30, 'minute',  0.12,   'Standard (GPT-4o)'),
    ('voice_premium',  35, 'minute',  0.14,   'Premium (GPT-4o + ElevenLabs)'),
    ('voice_ultra',    40, 'minute',  0.16,   'Ultra (Claude Sonnet + ElevenLabs)'),
    ('sms',             3, 'message', 0.009,  'SMS'),
    ('email',           1, 'message', 0.0003, 'Email'),
    ('phone_number',  200, 'month',   0.90,   'Phone Number')
ON CONFLICT (action_type) DO NOTHING;

-- RLS: Platform owners can manage, authenticated users can read
ALTER TABLE credit_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read credit rates" ON credit_rates
    FOR SELECT TO authenticated
    USING (true);


-- ── 2. Plan Tiers (Database-Driven) ─────────────────────────────────────────
-- Replaces hardcoded PLAN_LIMITS in billing-webhook.ts and plans.ts config.
-- Single source of truth for plan definitions.

CREATE TABLE IF NOT EXISTS plan_tiers (
    id TEXT PRIMARY KEY,                        -- 'employee_1', 'employee_3', 'employee_5', 'enterprise'
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,                  -- '1 AI Employee', '3 AI Employees', etc.
    ai_employees INTEGER NOT NULL DEFAULT 1,
    monthly_price_gbp NUMERIC NOT NULL,
    included_credits INTEGER NOT NULL,
    overage_credit_price NUMERIC NOT NULL,       -- £ per credit for overage
    max_phone_numbers INTEGER DEFAULT 3,
    max_assistants INTEGER DEFAULT 5,
    max_concurrent_calls INTEGER DEFAULT 5,
    max_users INTEGER DEFAULT 5,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    contact_sales BOOLEAN DEFAULT false,
    stripe_price_id TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed plan tiers
INSERT INTO plan_tiers (id, name, display_name, ai_employees, monthly_price_gbp, included_credits, overage_credit_price, max_phone_numbers, max_assistants, max_concurrent_calls, max_users, is_popular, contact_sales, sort_order, features) VALUES
    ('employee_1', 'starter', '1 AI Employee', 1, 2500, 200000, 0.012, 3, 5, 5, 5, false, false, 1,
     '["CRM + Pipeline", "Campaigns + Sequences", "SMS + Email Follow-up", "Call Recording + Transcription", "Analytics Dashboard"]'::jsonb),
    ('employee_3', 'growth', '3 AI Employees', 3, 6500, 650000, 0.011, 8, 15, 15, 15, true, false, 2,
     '["Everything in Starter", "Webhooks + API", "Advanced Analytics", "Priority Support"]'::jsonb),
    ('employee_5', 'business', '5 AI Employees', 5, 10000, 1100000, 0.010, 15, 30, 25, 50, false, false, 3,
     '["Everything in Growth", "White-label Branding", "Dedicated Account Manager", "Premium AI Training", "Custom Integrations"]'::jsonb),
    ('enterprise', 'enterprise', '10+ AI Employees', 10, 0, 0, 0, 0, 0, 0, 0, false, true, 4,
     '["Everything in Business", "Bespoke AI Training", "Custom SLA", "Volume Pricing", "Dedicated Infrastructure"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE plan_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plan tiers" ON plan_tiers
    FOR SELECT TO authenticated
    USING (true);


-- ── 3. Extend Organizations for Credit Model ────────────────────────────────

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS included_credits INTEGER DEFAULT 200000;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS credits_used_this_period INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS overage_credit_price NUMERIC DEFAULT 0.012;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS ai_employees INTEGER DEFAULT 1;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_tier_id TEXT DEFAULT 'employee_1';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS parent_organization_id UUID REFERENCES organizations(id);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS org_type TEXT DEFAULT 'direct'; -- 'direct', 'agency', 'agency_client'


-- ── 4. Extend Subscription Usage for Credits ────────────────────────────────

ALTER TABLE subscription_usage ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;
ALTER TABLE subscription_usage ADD COLUMN IF NOT EXISTS credits_included INTEGER DEFAULT 0;
ALTER TABLE subscription_usage ADD COLUMN IF NOT EXISTS overage_credits_used INTEGER DEFAULT 0;


-- ── 5. Extend Credits Ledger ─────────────────────────────────────────────────

ALTER TABLE credits_ledger ADD COLUMN IF NOT EXISTS credits INTEGER;
ALTER TABLE credits_ledger ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE credits_ledger ADD COLUMN IF NOT EXISTS unit_count NUMERIC;


-- ── 6. RPC: record_credit_usage ──────────────────────────────────────────────
-- Called from voice-webhook, sms-send, email-send to deduct credits.
-- Splits usage between included credits (free) and overage (charged to balance).

CREATE OR REPLACE FUNCTION record_credit_usage(
    p_organization_id UUID,
    p_credits INTEGER,
    p_action_type TEXT,
    p_unit_count NUMERIC DEFAULT 0,
    p_description TEXT DEFAULT '',
    p_reference_id TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
    v_org RECORD;
    v_usage RECORD;
    v_credits_remaining INTEGER;
    v_from_included INTEGER;
    v_from_balance INTEGER;
    v_balance_deducted NUMERIC;
    v_period_start TIMESTAMPTZ;
BEGIN
    -- Lock org row to prevent race conditions
    SELECT included_credits, subscription_period_start, overage_credit_price, credit_balance,
           subscription_status
    INTO v_org FROM organizations WHERE id = p_organization_id FOR UPDATE;

    IF v_org IS NULL THEN
        RETURN jsonb_build_object('error', 'Organization not found');
    END IF;

    v_period_start := COALESCE(v_org.subscription_period_start, date_trunc('month', now()));

    -- Ensure usage row exists for current period
    INSERT INTO subscription_usage (
        organization_id, period_start, period_end,
        minutes_used, calls_count, credits_used, credits_included
    ) VALUES (
        p_organization_id,
        v_period_start,
        v_period_start + interval '1 month',
        0, 0, 0, COALESCE(v_org.included_credits, 200000)
    )
    ON CONFLICT (organization_id, period_start) DO NOTHING;

    -- Get current period usage
    SELECT credits_used, credits_included INTO v_usage
    FROM subscription_usage
    WHERE organization_id = p_organization_id
      AND period_start = v_period_start;

    v_credits_remaining := COALESCE(v_usage.credits_included, v_org.included_credits) - COALESCE(v_usage.credits_used, 0);

    -- Split between included and overage
    IF v_credits_remaining >= p_credits THEN
        v_from_included := p_credits;
        v_from_balance := 0;
    ELSIF v_credits_remaining > 0 THEN
        v_from_included := v_credits_remaining;
        v_from_balance := p_credits - v_credits_remaining;
    ELSE
        v_from_included := 0;
        v_from_balance := p_credits;
    END IF;

    -- Update period usage
    UPDATE subscription_usage
    SET credits_used = COALESCE(credits_used, 0) + p_credits,
        overage_credits_used = COALESCE(overage_credits_used, 0) + v_from_balance,
        updated_at = now()
    WHERE organization_id = p_organization_id
      AND period_start = v_period_start;

    -- Deduct from dollar balance if overage
    v_balance_deducted := 0;
    IF v_from_balance > 0 THEN
        v_balance_deducted := v_from_balance * COALESCE(v_org.overage_credit_price, 0.012);

        -- Use existing apply_ledger_entry for the dollar deduction
        PERFORM apply_ledger_entry(
            p_organization_id,
            -v_balance_deducted,
            'credit_overage',
            p_description,
            p_reference_id,
            p_metadata || jsonb_build_object(
                'credits', v_from_balance,
                'action_type', p_action_type,
                'credit_rate', v_org.overage_credit_price
            )
        );
    END IF;

    -- Always log credit consumption to ledger (even included usage, for audit)
    INSERT INTO credits_ledger (
        organization_id, credits, action_type, unit_count,
        type, amount, description, reference_id, metadata, created_at
    ) VALUES (
        p_organization_id, -p_credits, p_action_type, p_unit_count,
        'credit_usage', -v_balance_deducted, p_description, p_reference_id,
        p_metadata || jsonb_build_object(
            'from_included', v_from_included,
            'from_balance', v_from_balance
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'credits_charged', p_credits,
        'from_included', v_from_included,
        'from_balance', v_from_balance,
        'balance_deducted_gbp', v_balance_deducted,
        'credits_remaining', GREATEST(0, v_credits_remaining - p_credits),
        'total_credits_used', COALESCE(v_usage.credits_used, 0) + p_credits
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 7. RPC: check_credits_allowed ────────────────────────────────────────────
-- Called before making a call, sending SMS, etc. to verify the org can afford it.

CREATE OR REPLACE FUNCTION check_credits_allowed(
    p_organization_id UUID,
    p_credits_needed INTEGER DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
    v_org RECORD;
    v_credits_used INTEGER;
    v_credits_remaining INTEGER;
    v_period_start TIMESTAMPTZ;
BEGIN
    SELECT included_credits, subscription_status, credit_balance, overage_credit_price,
           subscription_period_start, ai_employees, plan_tier_id
    INTO v_org FROM organizations WHERE id = p_organization_id;

    IF v_org IS NULL THEN
        RETURN jsonb_build_object('allowed', false, 'reason', 'Organization not found');
    END IF;

    -- Check subscription status
    IF COALESCE(v_org.subscription_status, 'trialing') NOT IN ('active', 'trialing') THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Subscription is ' || COALESCE(v_org.subscription_status, 'inactive') || '. Please update your billing.'
        );
    END IF;

    v_period_start := COALESCE(v_org.subscription_period_start, date_trunc('month', now()));

    -- Get current period usage
    SELECT COALESCE(credits_used, 0) INTO v_credits_used
    FROM subscription_usage
    WHERE organization_id = p_organization_id
      AND period_start = v_period_start;

    v_credits_used := COALESCE(v_credits_used, 0);
    v_credits_remaining := COALESCE(v_org.included_credits, 200000) - v_credits_used;

    -- If included credits cover it, allow
    IF v_credits_remaining >= p_credits_needed THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'source', 'included',
            'credits_remaining', v_credits_remaining,
            'balance', COALESCE(v_org.credit_balance, 0),
            'ai_employees', v_org.ai_employees,
            'plan', v_org.plan_tier_id
        );
    END IF;

    -- Otherwise check purchased balance can cover overage cost
    IF COALESCE(v_org.credit_balance, 0) > 0 THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'source', 'balance',
            'credits_remaining', v_credits_remaining,
            'balance', v_org.credit_balance,
            'ai_employees', v_org.ai_employees,
            'plan', v_org.plan_tier_id
        );
    END IF;

    RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'No credits remaining. Top up or upgrade your plan.',
        'credits_remaining', v_credits_remaining,
        'balance', COALESCE(v_org.credit_balance, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 8. Agency Credit Markup ──────────────────────────────────────────────────
-- For agencies (Business+ tier) who resell to their clients with markup.

CREATE TABLE IF NOT EXISTS agency_credit_markup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    markup_multiplier NUMERIC DEFAULT 1.5,      -- 1.5x = 50% markup
    override_credits_per_unit INTEGER,           -- optional: fixed rate instead of multiplier
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_agency_action UNIQUE (agency_organization_id, action_type)
);

ALTER TABLE agency_credit_markup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can manage markup" ON agency_credit_markup
    FOR ALL TO authenticated
    USING (
        agency_organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );


-- ── 9. Indexes ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_credit_rates_action ON credit_rates (action_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_plan_tiers_active ON plan_tiers (id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_org_plan_tier ON organizations (plan_tier_id);
CREATE INDEX IF NOT EXISTS idx_org_parent ON organizations (parent_organization_id) WHERE parent_organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_credits ON credits_ledger (organization_id, action_type) WHERE credits IS NOT NULL;


-- ── 10. Set defaults for existing orgs ───────────────────────────────────────

UPDATE organizations
SET included_credits = 200000,
    credits_used_this_period = 0,
    overage_credit_price = 0.012,
    ai_employees = 1,
    plan_tier_id = 'employee_1',
    org_type = 'direct'
WHERE plan_tier_id IS NULL OR plan_tier_id = '';
