
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
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 1. Auth & Org Context
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];
    
    // Verify user and get org
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    
    // (Optional) Org check logic here if needed for purchasing limits

    const { areaCode, country = 'US' } = event.queryStringParameters || {};

    // 2. Proxy to Provider (Vapi calls Twilio under the hood, or we call Twilio directly?)
    // For Zero-Trace, we wrap this completely.
    // If Vapi doesn't expose a Search API easily, we might mock this for the "Simulation" or use a Twilio key if available.
    // Assuming we use Vapi's buy-phone-number flow, they usually auto-assign. 
    // Let's implement a Mock for Phase 3.1 MVP or use a realistic simulation if VAPI_PRIVATE_KEY is set.
    
    // MOCK RESPONSE for MVP Stability
    const availableNumbers = [
      { e164: `+1${areaCode || '415'}5550100`, friendlyName: `(${areaCode || '415'}) 555-0100`, location: 'San Francisco, CA' },
      { e164: `+1${areaCode || '415'}5550101`, friendlyName: `(${areaCode || '415'}) 555-0101`, location: 'San Francisco, CA' },
      { e164: `+1${areaCode || '415'}5550102`, friendlyName: `(${areaCode || '415'}) 555-0102`, location: 'San Francisco, CA' },
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, numbers: availableNumbers })
    };

  } catch (error: any) {
    console.error('Numbers Search Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
