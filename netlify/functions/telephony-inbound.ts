
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
        .select('id, organization_id, inbound_route_id, ai_enabled, ai_disabled_forward_to')
        .eq('e164', calledNumber)
        .single();

    if (!phoneNumber) {
        // Zero-Trace / Anti-Enumeration: Return 200 OK
        console.warn(`❌ Unknown Number: ${maskPhoneNumber(calledNumber)}`);
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    const orgId = phoneNumber.organization_id;

    // --- B2: AI ON/OFF TOGGLE ---
    if (phoneNumber.ai_enabled === false) {
        if (phoneNumber.ai_disabled_forward_to) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    assistantId: null,
                    destination: {
                        type: 'number',
                        number: phoneNumber.ai_disabled_forward_to,
                        message: 'Transferring your call now.',
                    },
                }),
            };
        }
        return { statusCode: 200, headers, body: JSON.stringify({ assistantId: null }) };
    }

    // --- B3: KNOWN-CALLER DETECTION ---
    let knownContact: any = null;
    if (callerNumber) {
        const { data: contact } = await supabase
            .from('contacts')
            .select('id, name, email, phone_e164')
            .eq('organization_id', orgId)
            .eq('phone_e164', callerNumber)
            .maybeSingle();
        if (contact) knownContact = contact;
    }

    // --- PHASE 3.7 GOVERNANCE ENFORCEMENT ---
    const { data: controls } = await supabase
        .from('organization_controls')
        .select('is_suspended, shadow_mode')
        .eq('organization_id', orgId)
        .single();

    if (controls?.is_suspended) {
        console.warn(`⛔ [Governance] Suspended Org ${orgId} attempted Inbound Call`);
        return { statusCode: 403, body: 'Forbidden' };
    }

    if (controls?.shadow_mode) {
         console.log(`👻 [Governance] Shadow Mode: Simulating Inbound Call Success`);
         // In Shadow Mode, we verify the number but DO NOT dispatch to valid Assistant (or send mock response)
         // For inbound webhooks (Vapi), typically we return a JSON config. 
         // Initializing a mock assistant or simple hangup is safest.
         return { 
             statusCode: 200, 
             headers,
             body: JSON.stringify({ 
                 assistantId: null, 
                 error: "Shadow Mode Active - No Dispatch" 
             }) 
         };
    }
    // ----------------------------------------

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
        // Return same instructions (simplified for idempotency)
        return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
    }

    // 5. RESOLVE ROUTE & GOVERNANCE
    let routeConfig: any = {};
    let resolvedAssistant: any = null;
    let routeBusinessHours: any = null;
    let routeAfterHoursAction: string | null = null;
    let routeAfterHoursForwardTo: string | null = null;
    let routeAfterHoursGreeting: string | null = null;

    if (phoneNumber.inbound_route_id) {
         const { data: route } = await supabase
            .from('inbound_routes')
            .select('config, business_hours, after_hours_action, after_hours_forward_to, after_hours_greeting')
            .eq('id', phoneNumber.inbound_route_id)
            .single();
         if (route) {
             routeConfig = route.config;
             routeBusinessHours = route.business_hours;
             routeAfterHoursAction = route.after_hours_action;
             routeAfterHoursForwardTo = route.after_hours_forward_to;
             routeAfterHoursGreeting = route.after_hours_greeting;
         }
    }

    // --- B1: BUSINESS HOURS CHECK ---
    if (routeBusinessHours?.enabled && routeBusinessHours.schedule) {
        const tz = routeBusinessHours.timezone || 'America/New_York';
        const nowInTz = new Date().toLocaleString('en-US', { timeZone: tz });
        const localDate = new Date(nowInTz);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[localDate.getDay()];
        const currentMinutes = localDate.getHours() * 60 + localDate.getMinutes();

        const daySchedule = routeBusinessHours.schedule[dayName];
        let withinHours = false;

        if (daySchedule?.enabled) {
            const [startH, startM] = (daySchedule.start || '09:00').split(':').map(Number);
            const [endH, endM] = (daySchedule.end || '17:00').split(':').map(Number);
            const startMins = startH * 60 + startM;
            const endMins = endH * 60 + endM;
            withinHours = currentMinutes >= startMins && currentMinutes < endMins;
        }

        if (!withinHours) {
            // After hours handling
            if (routeAfterHoursAction === 'forward' && routeAfterHoursForwardTo) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        assistantId: null,
                        destination: {
                            type: 'number',
                            number: routeAfterHoursForwardTo,
                            message: routeAfterHoursGreeting || 'We are currently closed. Transferring to our answering service.',
                        },
                    }),
                };
            }
            if (routeAfterHoursAction === 'hangup') {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ assistantId: null, error: 'After hours' }),
                };
            }
            // Default: 'voicemail' — continue to assistant but with after-hours greeting injected
        }
    }

    // Resolve Target Assistant (Phase 3.6 Logic)
    let trinityAssistantId = null;
    let providerAssistantId = null;
    let runtimeConfig: any = {};

    if (routeConfig.destination?.type === 'assistant') {
        trinityAssistantId = routeConfig.destination.targetId;
        const { data: assistant } = await supabase
            .from('assistants')
            .select('provider_assistant_id, runtime_config, model_config')
            .eq('id', trinityAssistantId)
            .single();
        
        if (assistant) {
            resolvedAssistant = assistant;
            providerAssistantId = assistant.provider_assistant_id;
            runtimeConfig = assistant.runtime_config || {};
        }
    }

    // 6. CREATE CALL (with contact_id if known caller)
    const callInsert: any = {
        organization_id: orgId,
        phone_number_id: phoneNumber.id,
        inbound_route_id: phoneNumber.inbound_route_id,
        direction: 'inbound',
        status: 'ringing',
        customer_number: callerNumber,
        provider_call_id: providerCallId,
        provider: 'voice_engine',
        recording_policy: routeConfig.recordingPolicy || 'none',
    };
    if (knownContact) callInsert.contact_id = knownContact.id;

    const { data: callRow, error: callError } = await supabase
        .from('voice_calls')
        .insert(callInsert)
        .select('id')
        .single();

    if (callError) {
        // RACE CONDITION HANDLING (Code 23505 = Unique Violation)
        if (callError.code === '23505') {
            return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
        }
        console.error('❌ DB Insert Fail'); 
        return { statusCode: 500, body: 'Internal Error' };
    }
    const trinityCallId = callRow.id;

    // 7. EVENT TRACE (Zero-Trace Safe)
    await supabase.from('voice_call_events').insert([
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
        }
    ]);

    // 8. UPDATE & RETURN with GOVERNANCE OVERRIDES
    if (trinityAssistantId) {
        await supabase.from('voice_calls').update({ assistant_id: trinityAssistantId }).eq('id', trinityCallId);
    }

    if (!providerAssistantId) {
        // Fallback or Error? 
        return { statusCode: 200, body: JSON.stringify({ error: "Configuration Error" }) }; 
    }

    // Prepare Overrides (Governance + Known Caller)
    const assistantOverrides: any = {
        metadata: {
            trinityCallId: trinityCallId,
            organizationId: orgId,
        },
        variableValues: {},
    };

    // --- B3: Inject known-caller context ---
    if (knownContact) {
        assistantOverrides.variableValues.callerName = knownContact.name || '';
        assistantOverrides.variableValues.callerEmail = knownContact.email || '';
        assistantOverrides.variableValues.callerType = 'returning';
        assistantOverrides.variableValues.contactId = knownContact.id;
        assistantOverrides.metadata.contactId = knownContact.id;
    } else {
        assistantOverrides.variableValues.callerType = 'new';
    }

    // Apply Runtime Config Limits
    if (runtimeConfig.max_duration_seconds) {
        assistantOverrides.maxDurationSeconds = runtimeConfig.max_duration_seconds;
        console.log(`[Governance] Enforcing max_duration: ${runtimeConfig.max_duration_seconds}s`);
    }

    // Apply Compliance Mode (Optional Vapi Flag or simply enforcing recording)
    if (runtimeConfig.compliance_mode) {
        // E.g. force recording on if not already
        // assistantOverrides.recordingEnabled = true; (Check Vapi docs, usually top level)
    }

    // Model Whitelist Check (Soft Check)
    if (runtimeConfig.model_whitelist && resolvedAssistant.model_config) {
        const currentModel = resolvedAssistant.model_config.model;
        if (currentModel && !runtimeConfig.model_whitelist.includes(currentModel)) {
             console.warn(`[Governance] Model ${currentModel} NOT in whitelist. Allowing but logging warning.`);
             // Hard block? For now, soft warning.
        }
    }

    // Zero-Trace Response
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            assistantId: providerAssistantId,
            assistantOverrides: assistantOverrides
        })
    };

  } catch (error) {
      console.error('❌ Inbound Unhandled Exception');
      return { statusCode: 500, body: 'Internal Error' };
  }
};
