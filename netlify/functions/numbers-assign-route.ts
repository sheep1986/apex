
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export const handler: Handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    const { data: { user } } = await supabase.auth.getUser(authHeader.split(' ')[1]);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

    // Check organization_members first, then profiles fallback
    let organizationId: string | null = null;
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (member) {
      organizationId = member.organization_id;
    } else {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      organizationId = profile?.organization_id || null;
    }
    if (!organizationId) return { statusCode: 403, headers, body: JSON.stringify({ error: 'No Org' }) };

    const { phoneNumberId, routeId } = JSON.parse(event.body || '{}');

    // Verify ownership
    const { data: num } = await supabase.from('phone_numbers').select('id').eq('id', phoneNumberId).eq('organization_id', organizationId).single();
    if (!num) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Number not found' }) };

    // Verify route
    if (routeId) {
      const { data: route } = await supabase.from('inbound_routes').select('id').eq('id', routeId).eq('organization_id', organizationId).single();
      if (!route) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Route not found' }) };
    }

    // Update
    const { error } = await supabase
      .from('phone_numbers')
      .update({ inbound_route_id: routeId })
      .eq('id', phoneNumberId);

    if (error) throw error;

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch (error: any) {
    console.error('Route Assign Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Error' }) };
  }
};
