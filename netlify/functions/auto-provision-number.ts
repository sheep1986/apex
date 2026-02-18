import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiPrivateKey = process.env.VAPI_PRIVATE_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

/**
 * Auto-Provision Number — Used during onboarding to buy and assign a phone number.
 * 1. Validates user + org
 * 2. Calls Vapi API to create a phone number (with area code preference)
 * 3. Optionally assigns it to an assistant
 * 4. Saves to local phone_numbers table
 */
export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // 1. Auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // 2. Get org
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

    // 3. Check phone number limit
    const { count: currentNumbers } = await supabase
      .from('phone_numbers')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['active', 'pending']);

    const { data: orgData } = await supabase
      .from('organizations')
      .select('max_phone_numbers, name')
      .eq('id', organizationId)
      .single();

    const maxNumbers = orgData?.max_phone_numbers || 1;
    if ((currentNumbers || 0) >= maxNumbers) {
      return { statusCode: 403, headers, body: JSON.stringify({
        error: `Phone number limit reached (${maxNumbers}). Upgrade your plan for more.`
      })};
    }

    // 4. Parse request
    const { areaCode, name, assistantId } = JSON.parse(event.body || '{}');

    if (!vapiPrivateKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Voice provider not configured' }) };
    }

    // 5. Buy number via Vapi
    const axios = await import('axios');
    const buyPayload: any = {
      provider: 'vapi',
      name: name || `${orgData?.name || 'Trinity'} Line`,
    };

    // If area code provided, try to get a number in that area
    if (areaCode) {
      buyPayload.areaCode = areaCode;
    }

    // If assistant ID provided, assign it immediately
    if (assistantId) {
      buyPayload.assistantId = assistantId;
    }

    const vapiResponse = await axios.default.post('https://api.vapi.ai/phone-number', buyPayload, {
      headers: {
        'Authorization': `Bearer ${vapiPrivateKey}`,
        'Content-Type': 'application/json',
      },
    });

    const vapiNumber = vapiResponse.data;

    // 6. Save to local DB
    const { data: dbNumber, error: dbError } = await supabase
      .from('phone_numbers')
      .insert({
        organization_id: organizationId,
        number: vapiNumber.number || vapiNumber.phoneNumber,
        status: 'active',
        vapi_number_id: vapiNumber.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB save error:', dbError);
      // Number was bought but DB save failed — log it
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        number: {
          id: vapiNumber.id,
          number: vapiNumber.number || vapiNumber.phoneNumber,
          name: name || buyPayload.name,
          assistantId: assistantId || null,
          provider: 'vapi',
        },
      }),
    };
  } catch (error: any) {
    console.error('Auto-provision error:', error?.response?.data || error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error?.response?.data?.message || 'Failed to provision phone number',
      }),
    };
  }
};
