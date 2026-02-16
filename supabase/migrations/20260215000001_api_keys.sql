-- API Keys table for customer API access
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,         -- SHA-256 hash of the full key
  key_prefix TEXT NOT NULL,       -- First 8 chars for display (e.g., "tl_abc123")
  permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Org members can view keys
CREATE POLICY "api_keys_select_org_members" ON api_keys
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only admins/owners can create/update/delete
CREATE POLICY "api_keys_insert_admins" ON api_keys
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('client_admin', 'agency_owner', 'agency_admin', 'platform_owner')
    )
  );

CREATE POLICY "api_keys_update_admins" ON api_keys
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('client_admin', 'agency_owner', 'agency_admin', 'platform_owner')
    )
  );

CREATE POLICY "api_keys_delete_admins" ON api_keys
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('client_admin', 'agency_owner', 'agency_admin', 'platform_owner')
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();
