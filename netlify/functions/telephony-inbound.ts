
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { hashIdentifier, maskPhoneNumber, redactPII, verifyTrinitySignature } from './security';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.TRINITY_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };

  try {
    // 1. RAW BODY HANDLING
    const rawBody = event.isBase64Encoded 
      ? Buffer.from(event.body || '', 'base64').toString('utf8') 
      : event.body || '';

    // 2. WEBHOOK SECURITY
    // Fail closed in production if secret is missing
    if (!webhookSecret) {
        console.error('⛔ Configuration Error: Missing TRINITY_WEBHOOK_SECRET');
        if (process.env.NODE_ENV === 'production' || process.env.NETLIFY) {
             return { statusCode: 500, body: 'Internal Server Error' };
        }
    }

    const signature = event.headers['x-trinity-signature'] || event.headers['X-Trinity-Signature'];
    const timestamp = event.headers['x-trinity-timestamp'] || event.headers['X-Trinity-Timestamp'];

    if (!signature || !timestamp) {
        console.error('⛔ Security: Missing Headers');
        return { statusCode: 401, body: 'Unauthorized' };
    }

    // Drift Check (5 mins)
    const now = Date.now();
    const eventTime = parseInt(timestamp, 10);
    if (isNaN(eventTime) || Math.abs(now - eventTime) > 5 * 60 * 1000) {
        console.error('⛔ Security: Timestamp Drift');
        return { statusCode: 400, body: 'Expired' };
    }

    // HMAC Verification
    if (webhookSecret && !verifyTrinitySignature(rawBody, signature, webhookSecret)) {
        console.error('⛔ Security: Invalid Signature');
        return { statusCode: 401, body: 'Unauthorized' };
    }
    
    const body = JSON.parse(rawBody);
    
    // Extract standardized fields
    const callerNumber = body.message?.customer?.number || body.customer?.number;
    const calledNumber = body.message?.phoneNumber?.number || body.phoneNumber?.number; 
    const providerCallId = body.message?.call?.id || body.call?.id;

    // Validate Constraints
    if (!calledNumber || !providerCallId) {
         console.warn('⚠️ Invalid Payload: Missing number or ID');
         return { statusCode: 400, body: 'Bad Request' };
    }

    const hashedProviderId = hashIdentifier(providerCallId);

    // 3. ORDER OF OPERATIONS: Resolve Number -> Org
    const { data: phoneNumber } = await supabase
        .from('phone_numbers')
        .select('id, organization_id, inbound_route_id')
        .eq('e164', calledNumber)
        .single();

    if (!phoneNumber) {
        // Zero-Trace / Anti-Enumeration: Return 200 OK
        // Log locally with redaction
        console.warn(`❌ Unknown Number: ${maskPhoneNumber(calledNumber)}`); 
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }
    
    const orgId = phoneNumber.organization_id;

    // 4. IDEMPOTENCY
    // Check against Organization + ProviderID
    const { data: existingCall } = await supabase
        .from('voice_calls')
        .select('id, assistant_id')
        .eq('organization_id', orgId)
        .eq('provider_call_id', providerCallId)
        .single();

    if (existingCall) {
        console.log(`♻️ Idempotent Replay: ${existingCall.id}`);
        
        let providerAssistantId = null;
        if (existingCall.assistant_id) {
             const { data: ast } = await supabase.from('assistants').select('provider_assistant_id').eq('id', existingCall.assistant_id).single();
             if (ast) providerAssistantId = ast.provider_assistant_id;
        }

        // Return same instructions
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                assistantId: providerAssistantId,
                assistantOverrides: {
                    metadata: {
                        trinityCallId: existingCall.id,
                        organizationId: orgId
                    }
                }
            })
        };
    }

    // 5. RESOLVE ROUTE
    let routeConfig: any = {};
    if (phoneNumber.inbound_route_id) {
         const { data: route } = await supabase
            .from('inbound_routes')
            .select('config')
            .eq('id', phoneNumber.inbound_route_id)
            .single();
         if (route) routeConfig = route.config;
    }

    // 6. CREATE CALL
    const { data: callRow, error: callError } = await supabase
        .from('voice_calls')
        .insert({
            organization_id: orgId,
            phone_number_id: phoneNumber.id,
            inbound_route_id: phoneNumber.inbound_route_id,
            direction: 'inbound',
            status: 'ringing',
            customer_number: callerNumber, // PII stored encrypted/RLS'd in DB is ok, just not in logs
            provider_call_id: providerCallId,
            provider: 'voice_engine',
            recording_policy: routeConfig.recordingPolicy || 'none'
        })
        .select('id')
        .single();

    if (callError) {
        // RACE CONDITION HANDLING (Code 23505 = Unique Violation)
        if (callError.code === '23505') {
            console.log(`♻️ Race Condition Handling: Fetching existing call for ${hashedProviderId}`);
            
            const { data: existingRace } = await supabase
                .from('voice_calls')
                .select('id, assistant_id')
                .eq('organization_id', orgId)
                .eq('provider_call_id', providerCallId)
                .single();
            
            if (existingRace) {
                let providerAssistantId = null;
                if (existingRace.assistant_id) {
                     const { data: ast } = await supabase.from('assistants').select('provider_assistant_id').eq('id', existingRace.assistant_id).single();
                     if (ast) providerAssistantId = ast.provider_assistant_id;
                }

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        assistantId: providerAssistantId,
                        assistantOverrides: {
                            metadata: {
                                trinityCallId: existingRace.id,
                                organizationId: orgId
                            }
                        }
                    })
                };
            }
        }
        
        console.error('❌ DB Insert Fail'); // Don't log full error object if it contains params
        return { statusCode: 500, body: 'Internal Error' };
    }
    const trinityCallId = callRow.id;

    // 7. EVENT TRACE (Zero-Trace Safe)
    const eventsToInsert: any[] = [
        {
            organization_id: orgId,
            call_id: trinityCallId,
            type: 'resolved_number',
            payload: redactPII({ phoneNumberId: phoneNumber.id, calledNumber }) 
        },
        {
            organization_id: orgId,
            call_id: trinityCallId,
            type: 'created_call',
            payload: { providerId: 'REDACTED', direction: 'inbound' }
        },
    ];

    if (routeConfig.businessHours) {
        eventsToInsert.push({
            organization_id: orgId,
            call_id: trinityCallId,
            type: 'evaluated_business_hours',
            payload: { open: true, note: 'Mock Evaluation' }
        });
    }

    // Routing Logic
    let assistantId = null;
    let trinityAssistantId = null;

    if (routeConfig.destination?.type === 'assistant') {
        trinityAssistantId = routeConfig.destination.targetId;
        const { data: assistant } = await supabase
            .from('assistants')
            .select('provider_assistant_id')
            .eq('id', trinityAssistantId)
            .single();
        if (assistant) assistantId = assistant.provider_assistant_id;
    }

    eventsToInsert.push({
        organization_id: orgId,
        call_id: trinityCallId,
        type: assistantId ? 'routed' : 'routing_failed',
        payload: { targetType: routeConfig.destination?.type }
    });
    
    await supabase.from('voice_call_events').insert(eventsToInsert);

    // 8. UPDATE & RETURN
    if (trinityAssistantId) {
        await supabase.from('voice_calls').update({ assistant_id: trinityAssistantId }).eq('id', trinityCallId);
    }

    if (!assistantId) {
        return { statusCode: 200, body: JSON.stringify({ error: "Configuration Error" }) }; 
    }

    // Zero-Trace Response
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            assistantId: assistantId,
            assistantOverrides: {
                metadata: {
                    trinityCallId: trinityCallId,
                    organizationId: orgId
                }
            }
        })
    };

  } catch (error) {
      console.error('❌ Inbound Unhandled Exception');
      return { statusCode: 500, body: 'Internal Error' };
  }
};
