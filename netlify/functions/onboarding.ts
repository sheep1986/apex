
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

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
    const { organizationId, assistantName, voiceId, goal } = JSON.parse(event.body || '{}');

    if (!organizationId || !assistantName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing Required Fields' }) };
    }

    if (!vapiPrivateKey) {
      console.error('❌ Missing VAPI_PRIVATE_API_KEY');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server Configuration Error' }) };
    }

    console.log(`🤖 Creating Assistant for Org: ${organizationId}`);

    // 1. Create Assistant in Vapi
    const vapiResponse = await axios.post(
      'https://api.vapi.ai/assistant',
      {
        name: assistantName,
        voice: {
          provider: '11labs',
          voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM', // default
        },
        model: {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: goal || 'You are a helpful assistant.'
            }
          ]
        },
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${vapiPrivateKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const vapiAssistant = vapiResponse.data;
    console.log('✅ Vapi Assistant Created:', vapiAssistant.id);

    // 2. Store in Database
    const { data: dbAssistant, error: dbError } = await supabase
      .from('assistants')
      .insert({
        organization_id: organizationId,
        provider: 'vapi', // Internal (Zero-Trace)
        provider_assistant_id: vapiAssistant.id,
        name: assistantName,
        config: vapiAssistant
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('❌ DB Save Failed:', dbError);
      throw dbError;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        assistantId: dbAssistant.id // Return Internal ID only (Zero-Trace)
      })
    };

  } catch (error: any) {
    console.error('❌ Onboarding Error:', error.response?.data || error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
