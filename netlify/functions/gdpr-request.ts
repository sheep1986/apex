import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from './utils/cors';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

/**
 * GDPR Data Subject Request handler
 *
 * Actions:
 *   - export: Compile all user data into JSON and return downloadable link
 *   - delete-request: Initiate account deletion (30-day cooling period)
 *   - delete-cancel: Cancel pending deletion
 *   - delete-status: Check if deletion is pending
 */
export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders(),
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Authenticate
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { action } = JSON.parse(event.body || '{}');

    switch (action) {
      case 'export': {
        // Gather all user data from various tables
        const [profile, memberships, calls, contacts, appointments] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).single(),
          supabase.from('organization_members').select('*, organizations(name, slug)').eq('user_id', user.id),
          supabase.from('voice_calls').select('id, phone_number, status, duration, cost, created_at').eq('created_by', user.id).limit(1000),
          supabase.from('contacts').select('id, first_name, last_name, email, phone, company, created_at').eq('created_by', user.id).limit(1000),
          supabase.from('appointments').select('id, title, scheduled_at, status, created_at').eq('created_by', user.id).limit(500),
        ]);

        const exportData = {
          exported_at: new Date().toISOString(),
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
          },
          profile: profile.data,
          organization_memberships: memberships.data || [],
          voice_calls: calls.data || [],
          contacts: contacts.data || [],
          appointments: appointments.data || [],
        };

        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="data-export-${user.id.slice(0, 8)}.json"`,
          },
          body: JSON.stringify(exportData, null, 2),
        };
      }

      case 'delete-request': {
        const { reason } = JSON.parse(event.body || '{}');

        // Set deletion scheduled for 30 days from now
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + 30);

        const { error } = await supabase
          .from('profiles')
          .update({
            deletion_requested_at: new Date().toISOString(),
            deletion_scheduled_at: deletionDate.toISOString(),
            deletion_reason: reason || 'User requested',
          })
          .eq('id', user.id);

        if (error) {
          console.error('Delete request error:', error);
          return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to process deletion request' }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Account deletion scheduled',
            deletion_date: deletionDate.toISOString(),
            cooling_period_days: 30,
          }),
        };
      }

      case 'delete-cancel': {
        const { error } = await supabase
          .from('profiles')
          .update({
            deletion_requested_at: null,
            deletion_scheduled_at: null,
            deletion_reason: null,
          })
          .eq('id', user.id);

        if (error) {
          return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to cancel deletion' }) };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Account deletion cancelled' }),
        };
      }

      case 'delete-status': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('deletion_requested_at, deletion_scheduled_at')
          .eq('id', user.id)
          .single();

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            pending: !!profile?.deletion_requested_at,
            requested_at: profile?.deletion_requested_at,
            scheduled_at: profile?.deletion_scheduled_at,
          }),
        };
      }

      case 'admin-list': {
        // Admin action: list all DSAR requests for the org
        const orgHeader = event.headers['x-organization-id'];
        if (!orgHeader) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing x-organization-id header' }) };
        }

        // Verify admin role
        const { data: adminMember } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .eq('organization_id', orgHeader)
          .single();

        if (!adminMember || !['admin', 'owner'].includes(adminMember.role)) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'Admin access required' }) };
        }

        // Get all members with deletion requests
        const { data: membersWithRequests } = await supabase
          .from('organization_members')
          .select('user_id, profiles(id, email, full_name, deletion_requested_at, deletion_scheduled_at, deletion_reason)')
          .eq('organization_id', orgHeader);

        const dsarRequests = (membersWithRequests || [])
          .filter((m: any) => m.profiles?.deletion_requested_at)
          .map((m: any) => ({
            id: m.profiles.id,
            user_id: m.user_id,
            email: m.profiles.email,
            full_name: m.profiles.full_name,
            action: 'delete-request',
            requested_at: m.profiles.deletion_requested_at,
            scheduled_at: m.profiles.deletion_scheduled_at,
            reason: m.profiles.deletion_reason,
          }));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ requests: dsarRequests }),
        };
      }

      case 'admin-process': {
        // Admin action: mark a DSAR request as in-progress
        const { targetUserId } = JSON.parse(event.body || '{}');
        if (!targetUserId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing targetUserId' }) };
        }

        // Verify admin role
        const { data: processMember } = await supabase
          .from('organization_members')
          .select('role, organization_id')
          .eq('user_id', user.id)
          .single();

        if (!processMember || !['admin', 'owner'].includes(processMember.role)) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'Admin access required' }) };
        }

        // Audit log
        await supabase.from('audit_logs').insert({
          organization_id: processMember.organization_id,
          action: 'gdpr_dsar_processed',
          actor_id: user.id,
          details: `DSAR request for user ${targetUserId.slice(0, 8)} marked as in-progress`,
          created_at: new Date().toISOString(),
        }).catch(() => {});

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'DSAR request marked as in-progress' }),
        };
      }

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
    }
  } catch (error: any) {
    console.error('GDPR request error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
