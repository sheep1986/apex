
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiPrivateKey = process.env.VAPI_PRIVATE_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 1. Security check
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

    // 2. Org Context
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (!member) return { statusCode: 403, headers, body: JSON.stringify({ error: 'No Organization' }) };
    const organizationId = member.organization_id;

    // 3. Purchase Logic
    const { phoneNumber } = JSON.parse(event.body || '{}'); // Expects E.164
    if (!phoneNumber) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing phone number' }) };

    // In a real implementation, we would call Vapi/Twilio API here.
    // await vapi.buyNumber(phoneNumber);
    // For MVP/Zero-Trace Demo: We simulate the purchase success return a mock Provider ID.
    const providerSid = `pn_${Math.random().toString(36).substring(7)}`;

    // 4. Save to DB
    const { data, error } = await supabase
      .from('phone_numbers')
      .insert({
        organization_id: organizationId,
        e164: phoneNumber,
        status: 'active',
        provider_number_sid: providerSid, // Internal only
        capabilities: { voice: true, sms: true }
      })
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, number: data })
    };

  } catch (error: any) {
    console.error('Numbers Purchase Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Purchase Failed' }) };
  }
};
