-- SMS Messages table
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'received')),
  provider_id TEXT, -- Twilio SID
  error_message TEXT,
  credits_used NUMERIC(10,4) DEFAULT 0,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email Messages table
CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  template_id UUID,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  provider_id TEXT, -- Resend message ID
  error_message TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email Templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT[] DEFAULT '{}', -- e.g. {'{{first_name}}', '{{company}}', '{{phone}}'}
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'follow_up', 'appointment', 'welcome', 'nurture', 're_engagement')),
  is_active BOOLEAN DEFAULT true,
  usage_count INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign Sequences for multi-step automation
CREATE TABLE IF NOT EXISTS campaign_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES campaign_sequences(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('call', 'sms', 'email', 'wait', 'condition')),
  config JSONB NOT NULL DEFAULT '{}',
  -- For 'call': { assistant_id }
  -- For 'sms': { body }
  -- For 'email': { template_id, subject, body }
  -- For 'wait': { duration_hours }
  -- For 'condition': { field, operator, value, true_step, false_step }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track sequence execution per contact
CREATE TABLE IF NOT EXISTS campaign_sequence_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES campaign_sequences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  current_step_id UUID REFERENCES campaign_sequence_steps(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed', 'exited')),
  next_action_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(sequence_id, contact_id)
);

-- RLS
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sequence_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_sms" ON sms_messages
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org_members_email" ON email_messages
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org_members_email_templates" ON email_templates
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org_members_sequences" ON campaign_sequences
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org_members_sequence_steps" ON campaign_sequence_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM campaign_sequences cs
      WHERE cs.id = campaign_sequence_steps.sequence_id
      AND cs.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "org_members_sequence_progress" ON campaign_sequence_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM campaign_sequences cs
      WHERE cs.id = campaign_sequence_progress.sequence_id
      AND cs.organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_messages_org ON sms_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_campaign ON sms_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_contact ON sms_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_org ON email_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_campaign ON email_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_contact ON email_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_campaign ON campaign_sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON campaign_sequence_steps(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_progress_sequence ON campaign_sequence_progress(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_progress_next ON campaign_sequence_progress(next_action_at) WHERE status = 'active';
