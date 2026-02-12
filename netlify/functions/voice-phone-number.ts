import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const vapiApiKey = process.env.VAPI_PRIVATE_API_KEY;

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // Check organization_members first, then fall back to profiles.organization_id
    let organizationId: string | null = null;

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (member) {
      organizationId = member.organization_id;
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      organizationId = profile?.organization_id || null;
    }

    if (!organizationId) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'No organization' }) };
    }

    if (!vapiApiKey) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Voice credentials not configured' }) };
    }
    const apiKey = vapiApiKey;

    const pathParts = event.path.split('/');
    const maybeId = pathParts.length > 4 ? pathParts[4] : null;
    const numberId = maybeId || null;

    const url = numberId
      ? `https://api.vapi.ai/phone-number/${numberId}`
      : 'https://api.vapi.ai/phone-number';

    const response = await fetch(url, {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: ['GET', 'DELETE'].includes(event.httpMethod) ? undefined : event.body
    });

    const text = await response.text();

    return {
      statusCode: response.status,
      headers,
      body: text
    };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Internal error' }) };
  }
};
