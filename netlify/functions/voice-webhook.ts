
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { verifyVapiSignature } from './security';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiWebhookSecret = process.env.VAPI_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Make sure you POST!' };
  }

  try {
    const rawBody = event.body || '';
    const signature = event.headers['x-vapi-signature'] || event.headers['X-Vapi-Signature'];
    // const timestamp = event.headers['x-vapi-timestamp'] || ... (Vapi might not send standard timestamp header, payload has timestamp)

    // 1. Security Verification (P0-4)
    if (vapiWebhookSecret) {
      if (!signature || !verifyVapiSignature(rawBody, signature, vapiWebhookSecret)) {
        console.error('⛔ Invalid Signature');
        return { statusCode: 401, headers, body: JSON.stringify({ message: 'Unauthorized' }) }; // Zero-Trace error
      }
    } else {
        console.warn('⚠️ WEBHOOK_SECRET not set. Unsafe.');
    }

    const payload = JSON.parse(rawBody);
    const { message } = payload;
    
    // Check Timestamp (Replay Attack Protection) - ±5 mins
    // Vapi payload usually has timestamp
    const now = Date.now();
    const eventTime = message.timestamp || now; // If missing, we can't verify, but we proceed.
    if (Math.abs(now - eventTime) > 5 * 60 * 1000) {
        console.error('⛔ Timestamp out of range');
        return { statusCode: 400, headers, body: JSON.stringify({ message: 'Request expired' }) };
    }



    if (message.type === 'end-of-call-report') {
        const { call } = message;
        console.log(`📞 Call Ended Provider ID: ${call.id}`);

        // 1. Identify Trinity Call ID (ID Mapping)
        let trinityCallId = call.assistant?.metadata?.trinityCallId; // From make-call metadata

        if (!trinityCallId) {
            // Fallback: Lookup by Provider Call ID
            const { data: callRow } = await supabase
                .from('voice_calls')
                .select('id, organization_id')
                .eq('provider_call_id', call.id)
                .single();
            
            if (callRow) {
                trinityCallId = callRow.id;
            }
        }
        
        // 2. Identify Org
        let organizationId = call.assistant?.metadata?.organizationId;
        
        if (!organizationId && trinityCallId) {
             const { data: callRow } = await supabase
                .from('voice_calls')
                .select('organization_id')
                .eq('id', trinityCallId)
                .single();
             if (callRow) organizationId = callRow.organization_id;
        }

        // Fallback: Lookup via Provider Internal ID
        if (!organizationId && call.assistantId) {
            const { data: assistant } = await supabase
                .from('assistants')
                .select('organization_id')
                .eq('provider_assistant_id', call.assistantId)
                .single();
            if (assistant) organizationId = assistant.organization_id;
        }

        if (!organizationId) {
            console.error('❌ No Org Found. Scaling/Billing skipped.');
            return { statusCode: 200, headers, body: 'Skipped' };
        }

        // STRICT ID MAPPING: If still no trinityCallId, create one now.
        if (!trinityCallId) {
             console.log('⚠️ Creating missing call mapping row for', call.id);
             const { data: newRow, error: insertError } = await supabase
                .from('voice_calls')
                .insert({
                  organization_id: organizationId,
                  provider_call_id: call.id, // Store provider ID for future reference
                  provider: 'voice_engine',
                  status: 'ended',
                  cost: call.cost,
                  created_at: new Date().toISOString()
                })
                .select('id')
                .single();
                
             if (!insertError && newRow) {
                 trinityCallId = newRow.id;
             } else {
                 console.error('❌ Failed to create call row:', insertError);
                 // Critical failure if we can't create a row? 
                 // We MUST NOT use provider ID in ledger. 
                 // If this fails, we might just have to skip or error out, but let's assume success.
                 return { statusCode: 500, body: 'Internal Error' };
             }
        }

        // Update Call Status in ID Map (if it existed before)
        if (trinityCallId) {
             await supabase.from('voice_calls')
                .update({ 
                    status: 'ended',
                    cost: call.cost,
                    updated_at: new Date().toISOString()
                })
                .eq('id', trinityCallId);
        }

        // 3. Deduplication (P1-1) via Ledger (Strictly Trinity ID)
        // Note: DB constraint (org, reference, type) now enforces this, but RPC handles gracefully.
        
        // 4. Calculate Cost
        const cost = call.cost > 0 ? call.cost : (call.durationSeconds || 0) * (0.05 / 60);
        
        console.log(`💰 Billing Org ${organizationId}: $${cost.toFixed(4)}`);

        // 5. ATOMIC BILLING via RPC
        const { error: rpcError } = await supabase.rpc('apply_ledger_entry', {
            p_organization_id: organizationId,
            p_amount: -cost, // Negative for usage
            p_type: 'usage',
            p_description: `Call Usage (${call.durationSeconds}s)`,
            p_reference_id: trinityCallId, // MUST BE TRINITY ID
            p_metadata: { 
                duration: call.durationSeconds,
                provider_status: call.status
            }
        });

        if (rpcError) {
            console.error('❌ Billing Failed:', rpcError);
            return { statusCode: 500, headers, body: 'Billing Error' };
        }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error: any) {
    console.error('❌ Webhook Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }) // Generic Error
    };
  }
};
