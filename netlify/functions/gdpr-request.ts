import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

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
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
    }
  } catch (error: any) {
    console.error('GDPR request error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
