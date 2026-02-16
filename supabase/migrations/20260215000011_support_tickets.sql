-- Support Tickets for platform-level support
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL, -- e.g. TKT-001
  organization_id UUID REFERENCES organizations(id),
  organization_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  category TEXT DEFAULT 'technical' CHECK (category IN ('technical', 'billing', 'account', 'feature_request', 'bug_report')),
  department TEXT DEFAULT 'technical',
  assigned_to TEXT,
  client_email TEXT,
  client_phone TEXT,
  starred BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  author_type TEXT DEFAULT 'support' CHECK (author_type IN ('client', 'support', 'ai_bot', 'system')),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Platform owners can see all tickets
CREATE POLICY "platform_owners_support_tickets" ON support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('platform_owner', 'agency_owner', 'agency_admin')
    )
  );

-- Clients can see their own org's tickets
CREATE POLICY "org_members_own_tickets" ON support_tickets
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "platform_owners_ticket_messages" ON support_ticket_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM support_tickets st
      JOIN profiles p ON p.id = auth.uid()
      WHERE st.id = support_ticket_messages.ticket_id
      AND (p.role IN ('platform_owner', 'agency_owner', 'agency_admin')
           OR st.organization_id IN (
             SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
           ))
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id);

-- Sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS support_ticket_seq START 1;
