-- Scheduled Reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'usage' CHECK (report_type IN ('usage', 'calls', 'campaigns', 'billing', 'team', 'deals')),
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INT, -- 0=Sunday for weekly
  day_of_month INT, -- 1-28 for monthly
  recipients TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_scheduled_reports" ON scheduled_reports
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_org ON scheduled_reports(organization_id);
