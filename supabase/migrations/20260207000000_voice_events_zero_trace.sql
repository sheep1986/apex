-- Zero-Trace Voice Event & Tool Execution Tables
-- Provider-agnostic fields, RLS enabled (policies deferred)

-- Updated-at trigger
CREATE OR REPLACE FUNCTION update_voice_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Voice Call Events
CREATE TABLE IF NOT EXISTS voice_call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  call_id UUID REFERENCES voice_calls(id),
  provider_call_id TEXT,
  type TEXT NOT NULL,
  status TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER update_voice_call_events_updated_at
  BEFORE UPDATE ON voice_call_events
  FOR EACH ROW EXECUTE PROCEDURE update_voice_events_updated_at();

CREATE INDEX IF NOT EXISTS idx_voice_call_events_org ON voice_call_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_events_call ON voice_call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_events_provider_call ON voice_call_events(provider_call_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_events_type ON voice_call_events(type);

ALTER TABLE voice_call_events ENABLE ROW LEVEL SECURITY;

-- Voice Tool Executions (Idempotency)
CREATE TABLE IF NOT EXISTS voice_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  tool_id UUID REFERENCES voice_tools(id),
  tool_call_id TEXT NOT NULL,
  status TEXT NOT NULL,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (organization_id, tool_call_id)
);

CREATE TRIGGER update_voice_tool_executions_updated_at
  BEFORE UPDATE ON voice_tool_executions
  FOR EACH ROW EXECUTE PROCEDURE update_voice_events_updated_at();

CREATE INDEX IF NOT EXISTS idx_voice_tool_executions_org ON voice_tool_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_voice_tool_executions_tool ON voice_tool_executions(tool_id);

ALTER TABLE voice_tool_executions ENABLE ROW LEVEL SECURITY;
