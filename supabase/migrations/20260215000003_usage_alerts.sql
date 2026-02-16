-- Usage alerts tracking table to prevent duplicate notifications
CREATE TABLE IF NOT EXISTS usage_alerts_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,  -- 'minutes_50', 'minutes_75', 'minutes_90', 'minutes_100', 'balance_low', 'balance_critical', 'daily_limit'
  threshold_value NUMERIC,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_start TIMESTAMPTZ,   -- For dedup within billing period
  UNIQUE(organization_id, alert_type, period_start)
);

ALTER TABLE usage_alerts_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_alerts_select_org_members" ON usage_alerts_sent
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_usage_alerts_org ON usage_alerts_sent(organization_id, alert_type);
