import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Security Settings Backend
 *
 * Provides authenticated GET/POST for organization security settings
 * with audit logging. Only admin/owner roles can modify settings.
 *
 * GET:  Returns the security settings for the caller's organization
 * POST: Updates security settings (validates admin/owner role, logs changes)
 */

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // ─── Auth ──────────────────────────────────────────────────────────
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // ─── Lookup Org ────────────────────────────────────────────────────
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not a member of any organization' }) };
    }

    const orgId = member.organization_id;

    // ─── GET: Return security settings ─────────────────────────────────
    if (event.httpMethod === 'GET') {
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          security: org?.settings?.security || {},
        }),
      };
    }

    // ─── POST: Update security settings ────────────────────────────────
    if (event.httpMethod === 'POST') {
      // Only admin/owner can modify security settings
      const role = member.role?.toLowerCase();
      if (role !== 'admin' && role !== 'owner' && role !== 'platform_owner') {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Only admins can modify security settings' }) };
      }

      const body = JSON.parse(event.body || '{}');
      const { security } = body;

      if (!security || typeof security !== 'object') {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid security settings' }) };
      }

      // Get current settings to compute diff for audit log
      const { data: currentOrg } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single();

      const currentSettings = currentOrg?.settings || {};
      const previousSecurity = currentSettings.security || {};

      // Merge security into existing settings (preserve other settings keys)
      const updatedSettings = {
        ...currentSettings,
        security,
      };

      // Update organization settings
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ settings: updatedSettings })
        .eq('id', orgId);

      if (updateError) {
        console.error('Failed to update security settings:', updateError);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to update settings' }) };
      }

      // Compute changed fields for audit log
      const changedFields: Record<string, { from: any; to: any }> = {};
      const allKeys = new Set([...Object.keys(previousSecurity), ...Object.keys(security)]);
      for (const key of allKeys) {
        if (JSON.stringify(previousSecurity[key]) !== JSON.stringify(security[key])) {
          changedFields[key] = { from: previousSecurity[key], to: security[key] };
        }
      }

      // Write audit log
      await supabase.from('audit_logs').insert({
        organization_id: orgId,
        actor_id: user.id,
        action: 'UPDATE',
        resource_type: 'security_settings',
        resource_id: orgId,
        changes: changedFields,
        metadata: {
          ip: event.headers['x-forwarded-for']?.split(',')[0]?.trim() || null,
          user_agent: event.headers['user-agent'] || null,
        },
      }).catch((err) => {
        console.warn('Audit log insert failed (non-critical):', err);
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, changedFields: Object.keys(changedFields) }),
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (error: any) {
    console.error('Security settings error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
