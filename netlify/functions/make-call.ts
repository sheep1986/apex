
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
    // 1. Security: Authenticate User
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing or invalid Authorization header' }) };
    }
    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth Error:', authError);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // 2. Identify Organization (Server-Side)
    // Lookup organization_id from organization_members for this user
    const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();
    
    if (memberError || !member) {
        // Fallback: Check if user is owner directly in organizations (if schema supports it, strictly requested members)
        console.error('Org Lookup Failed:', memberError);
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'User does not belong to an organization' }) };
    }

    const organizationId = member.organization_id;

    // 3. Parse Body (No organizationId trusted from client)
    const { assistantId, phoneNumber } = JSON.parse(event.body || '{}');

    if (!assistantId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing Assistant ID' }) };
    }

    // 4. Check credit allowance (new credit-based system, falls back to legacy)
    // Estimate ~30 credits for a 1-minute call at standard rate as a pre-check
    const { data: creditAllowed, error: creditCheckError } = await supabase.rpc('check_credits_allowed', {
      p_organization_id: organizationId,
      p_credits_needed: 30,  // ~1 min at standard rate
    });

    if (!creditCheckError && creditAllowed) {
      if (!creditAllowed.allowed) {
        const reason = creditAllowed.reason || 'No credits remaining';
        console.warn(`Call blocked for Org ${organizationId}: ${reason}`);
        return {
          statusCode: 402,
          headers,
          body: JSON.stringify({ error: reason }),
        };
      }
    } else {
      // Fallback to legacy check if new RPC doesn't exist yet
      const { data: allowed, error: checkError } = await supabase.rpc('check_call_allowed', {
        p_organization_id: organizationId,
      });

      if (checkError) {
        console.error('Call check RPC failed:', checkError);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to verify call allowance' }) };
      }

      if (!allowed?.allowed) {
        const reason = allowed?.reason || 'Call not permitted';
        console.warn(`Call blocked for Org ${organizationId}: ${reason}`);
        return {
          statusCode: 402,
          headers,
          body: JSON.stringify({ error: reason }),
        };
      }
    }

    // 5. Lookup Assistant & Verify Ownership
    const { data: assistant } = await supabase
        .from('assistants')
        .select('vapi_assistant_id, organization_id')
        .eq('id', assistantId)
        .single();
    
    if (!assistant) return { statusCode: 404, body: JSON.stringify({ error: 'Assistant not found' })};
    
    // Security: Ensure assistant belongs to the user's org
    if (assistant.organization_id !== organizationId) {
        console.error(`⛔ Access Denied: User ${user.id} (Org ${organizationId}) tried to use Assistant ${assistantId} (Org ${assistant.organization_id})`);
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Access Denied' }) };
    }

    // 6. ID MAPPING: Create Trinity Call Row (Initiating)
    const { data: callRow, error: callError } = await supabase
      .from('voice_calls')
      .insert({
        organization_id: organizationId,
        assistant_id: assistantId,
        status: 'initiating',
        customer_number: phoneNumber,
        provider: 'voice_engine' 
      })
      .select('id')
      .single();

    if (callError || !callRow) {
      console.error("Failed to create call row:", callError);
      throw new Error("Internal Service Error");
    }

    const trinityCallId = callRow.id;
    console.log(`📞 Initiating Call ${trinityCallId}...`);

    // 7. Initiate Call via Provider
    const callPayload: any = {
      assistantId: assistant.vapi_assistant_id,
      // Pass Trinity ID in metadata so webhook can map it back
      assistant: {
        metadata: {
          trinityCallId: trinityCallId,
          organizationId: organizationId
        }
      }
    };

    if (phoneNumber) {
      callPayload.customer = { number: phoneNumber };
      callPayload.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    } else {
      if (!process.env.VAPI_PHONE_NUMBER_ID) {
         return { statusCode: 500, headers, body: JSON.stringify({ error: 'Configuration Error' }) };
      }
    }

    const vapiResponse = await axios.post(
      'https://api.vapi.ai/call',
      callPayload,
      {
        headers: {
          'Authorization': `Bearer ${vapiPrivateKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const providerCallId = vapiResponse.data.id;

    // 8. ID MAPPING: Update with Provider ID
    await supabase
      .from('voice_calls')
      .update({
        provider_call_id: providerCallId,
        status: vapiResponse.data.status || 'initiated'
      })
      .eq('id', trinityCallId);

    // 9. Return ONLY Trinity ID
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        callId: trinityCallId, 
        status: 'initiated'
      })
    };

  } catch (error: any) {
    console.error('❌ Make Call Error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Call Initiation Failed' })
    };
  }
};
