-- Auto-Recharge Configuration
-- Allows organizations to automatically top-up credits when balance drops below threshold

CREATE TABLE IF NOT EXISTS auto_recharge_config (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT false,
    threshold_usd NUMERIC NOT NULL DEFAULT 10.00,
    recharge_amount_usd NUMERIC NOT NULL DEFAULT 50.00,
    max_monthly_recharges INTEGER NOT NULL DEFAULT 5,
    recharges_this_month INTEGER NOT NULL DEFAULT 0,
    month_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()) + interval '1 month',
    stripe_payment_method_id TEXT,
    last_recharge_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE auto_recharge_config ENABLE ROW LEVEL SECURITY;

-- Org admins/owners can view and manage auto-recharge config
CREATE POLICY "Org members can view own auto-recharge config"
    ON auto_recharge_config FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Org admins can manage auto-recharge config"
    ON auto_recharge_config FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'client_admin', 'platform_owner')
    ));

-- Index for the scheduled check query
CREATE INDEX IF NOT EXISTS idx_auto_recharge_enabled
    ON auto_recharge_config (enabled)
    WHERE enabled = true;
