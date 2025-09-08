-- Audit Logs Table for tracking VAPI credential changes and other sensitive operations
-- Run this in your Supabase SQL editor

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for faster queries
    INDEX idx_audit_logs_organization_id (organization_id),
    INDEX idx_audit_logs_created_at (created_at),
    INDEX idx_audit_logs_action (action)
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view audit logs for their organization
CREATE POLICY "Users can view their organization's audit logs"
    ON public.audit_logs
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- RLS Policy: Only admins can insert audit logs
CREATE POLICY "Admins can create audit logs"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid() 
            AND role IN ('client_admin', 'platform_owner')
        )
    );

-- Function to send email notifications on VAPI credential changes
CREATE OR REPLACE FUNCTION notify_vapi_credential_change()
RETURNS TRIGGER AS $$
BEGIN
    -- This would integrate with your email service
    -- For now, it just logs the event
    IF (NEW.vapi_private_key IS DISTINCT FROM OLD.vapi_private_key) OR 
       (NEW.vapi_api_key IS DISTINCT FROM OLD.vapi_api_key) THEN
        
        INSERT INTO audit_logs (
            organization_id,
            user_email,
            action,
            details
        ) VALUES (
            NEW.id,
            current_setting('request.jwt.claims', true)::json->>'email',
            'vapi_credential_update_auto',
            jsonb_build_object(
                'changed_fields', 
                CASE 
                    WHEN NEW.vapi_private_key IS DISTINCT FROM OLD.vapi_private_key 
                    THEN ARRAY['vapi_private_key']
                    ELSE ARRAY[]::text[]
                END ||
                CASE 
                    WHEN NEW.vapi_api_key IS DISTINCT FROM OLD.vapi_api_key 
                    THEN ARRAY['vapi_api_key']
                    ELSE ARRAY[]::text[]
                END,
                'timestamp', NOW()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for organizations table
DROP TRIGGER IF EXISTS vapi_credential_change_trigger ON organizations;
CREATE TRIGGER vapi_credential_change_trigger
    AFTER UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION notify_vapi_credential_change();

-- Grant necessary permissions
GRANT ALL ON public.audit_logs TO authenticated;
GRANT USAGE ON SEQUENCE audit_logs_id_seq TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.audit_logs IS 'Stores audit trail for sensitive operations including VAPI credential changes';
COMMENT ON COLUMN public.audit_logs.action IS 'Type of action performed (e.g., vapi_credential_update, user_role_change, etc.)';
COMMENT ON COLUMN public.audit_logs.details IS 'JSON object containing additional details about the action';