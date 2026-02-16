import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

/**
 * Calendar Sync: Generate .ics file for appointments or handle Google Calendar OAuth
 *
 * POST /calendar-sync
 * Actions:
 *   - generate-ics: Generate downloadable .ics file for an appointment
 *   - sync-google: Initiate Google Calendar OAuth flow
 *   - sync-callback: Handle OAuth callback from Google
 */
export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'No organization found' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { action } = body;

    switch (action) {
      case 'generate-ics': {
        const { appointmentId } = body;
        if (!appointmentId) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing appointmentId' }) };
        }

        const { data: appointment } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .eq('organization_id', member.organization_id)
          .single();

        if (!appointment) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Appointment not found' }) };
        }

        // Generate ICS content
        const startDate = new Date(appointment.scheduled_at || appointment.start_time);
        const endDate = new Date(startDate.getTime() + (appointment.duration_minutes || 30) * 60000);

        const formatICSDate = (d: Date) => {
          return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        };

        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Trinity Labs AI//NONSGML v1.0//EN',
          'CALSCALE:GREGORIAN',
          'METHOD:REQUEST',
          'BEGIN:VEVENT',
          `DTSTART:${formatICSDate(startDate)}`,
          `DTEND:${formatICSDate(endDate)}`,
          `SUMMARY:${appointment.title || 'Appointment'}`,
          `DESCRIPTION:${(appointment.notes || appointment.description || '').replace(/\n/g, '\\n')}`,
          `LOCATION:${appointment.location || 'Phone Call'}`,
          `UID:${appointment.id}@trinityai.com`,
          `ORGANIZER:mailto:noreply@trinityai.com`,
          appointment.contact_email ? `ATTENDEE:mailto:${appointment.contact_email}` : '',
          'STATUS:CONFIRMED',
          `DTSTAMP:${formatICSDate(new Date())}`,
          'END:VEVENT',
          'END:VCALENDAR',
        ].filter(Boolean).join('\r\n');

        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'text/calendar; charset=utf-8',
            'Content-Disposition': `attachment; filename="appointment-${appointment.id}.ics"`,
          },
          body: icsContent,
        };
      }

      case 'google-auth-url': {
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.URL}/.netlify/functions/calendar-sync`;

        if (!googleClientId) {
          return { statusCode: 501, headers, body: JSON.stringify({ error: 'Google Calendar not configured. Set GOOGLE_CLIENT_ID env var.' }) };
        }

        const scopes = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');
        const state = Buffer.from(JSON.stringify({ userId: user.id, orgId: member.organization_id })).toString('base64');

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${googleClientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${scopes}` +
          `&access_type=offline` +
          `&prompt=consent` +
          `&state=${state}`;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ authUrl }),
        };
      }

      case 'sync-status': {
        // Check if org has Google Calendar connected
        const { data: org } = await supabase
          .from('organizations')
          .select('settings')
          .eq('id', member.organization_id)
          .single();

        const googleConnected = !!(org?.settings?.google_calendar_token);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            google: {
              connected: googleConnected,
              lastSync: org?.settings?.google_calendar_last_sync || null,
            },
          }),
        };
      }

      case 'disconnect-google': {
        const { data: org } = await supabase
          .from('organizations')
          .select('settings')
          .eq('id', member.organization_id)
          .single();

        const updatedSettings = { ...(org?.settings || {}) };
        delete updatedSettings.google_calendar_token;
        delete updatedSettings.google_calendar_refresh_token;
        delete updatedSettings.google_calendar_last_sync;

        await supabase
          .from('organizations')
          .update({ settings: updatedSettings })
          .eq('id', member.organization_id);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Google Calendar disconnected' }),
        };
      }

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown action: ${action}` }) };
    }
  } catch (error: any) {
    console.error('Calendar sync error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
