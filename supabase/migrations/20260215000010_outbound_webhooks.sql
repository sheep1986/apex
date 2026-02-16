-- Outbound Webhooks: Let customers receive events from Trinity
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL, -- HMAC signing secret
  description TEXT,
  event_types TEXT[] NOT NULL DEFAULT '{}', -- e.g. {'call.completed', 'lead.qualified', 'deal.closed'}
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Delivery log for debugging
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  status_code INT,
  response_body TEXT,
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_webhook_endpoints" ON webhook_endpoints
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org_members_webhook_deliveries" ON webhook_deliveries
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_org ON webhook_endpoints(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries(webhook_endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_org ON webhook_deliveries(organization_id);
