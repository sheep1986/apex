-- Audit Logs Table for tracking deletions, VAPI credential changes, and other sensitive operations
-- Run this in your Supabase SQL editor

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id TEXT,                    -- Clerk user ID
    user_email TEXT,                 -- User email for display
    action TEXT NOT NULL,            -- delete, bulk_delete, vapi_credential_update, etc.
    resource_type TEXT,              -- campaign, lead, call, etc.
    resource_id TEXT,                -- ID of the affected resource
    resource_name TEXT,              -- Name/description of the resource for display
    details JSONB,                   -- Additional details about the action
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view audit logs for their organization
CREATE POLICY "Users can view their organization's audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM users
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- RLS Policy: Service role can insert audit logs (for backend API)
-- The backend uses SUPABASE_SERVICE_KEY which bypasses RLS
-- This policy allows authenticated users to insert into their org's logs
CREATE POLICY "Service role can create audit logs"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Stores audit trail for deletions, VAPI credential changes, and other sensitive operations';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (e.g., delete, bulk_delete, vapi_credential_update)';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Type of resource affected (campaign, lead, call, etc.)';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN public.audit_logs.resource_name IS 'Human-readable name of the resource for display';
COMMENT ON COLUMN public.audit_logs.details IS 'JSON object containing additional details about the action';