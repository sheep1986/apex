import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { verifyVapiSignature } from './security';

// ─── Credit Rate Constants (mirrors src/config/credit-rates.ts) ──────────
// Duplicated here because Netlify Functions can't import from src/config

type VoiceTier = 'budget' | 'standard' | 'premium' | 'ultra';

const VOICE_TIER_CREDITS: Record<VoiceTier, number> = {
  budget: 18,
  standard: 30,
  premium: 35,
  ultra: 40,
};

const MODEL_TIER_MAP: Record<string, VoiceTier> = {
  'gemini-1.5-flash': 'budget', 'gemini-2.0-flash': 'budget', 'gemini-2.5-flash': 'budget',
  'gpt-3.5-turbo': 'budget', 'llama-3.1-8b-instant': 'budget', 'mixtral-8x7b-32768': 'budget',
  'gpt-4o': 'standard', 'gpt-4o-mini': 'standard', 'gpt-4-turbo': 'standard',
  'gemini-1.5-pro': 'standard', 'gemini-2.5-pro': 'standard', 'llama-3.1-70b-versatile': 'standard',
  'claude-3-5-sonnet-20241022': 'premium', 'claude-3-haiku-20240307': 'premium', 'claude-3-5-haiku-20241022': 'premium',
  'claude-3-opus-20240229': 'ultra', 'claude-3-5-sonnet-latest': 'ultra', 'claude-sonnet-4-20250514': 'ultra',
};

const VOICE_PROVIDER_TIER_MAP: Record<string, VoiceTier> = {
  'deepgram': 'budget', 'rime-ai': 'budget', 'playht': 'budget',
  'openai': 'standard', 'azure': 'standard', 'cartesia': 'standard',
  '11labs': 'premium', 'elevenlabs': 'premium',
};

const TIER_RANK: Record<VoiceTier, number> = { budget: 0, standard: 1, premium: 2, ultra: 3 };

function classifyTier(model?: string, voiceProvider?: string): VoiceTier {
  const mTier = model ? (MODEL_TIER_MAP[model] || 'standard') : 'standard';
  const vTier = voiceProvider ? (VOICE_PROVIDER_TIER_MAP[voiceProvider.toLowerCase()] || 'budget') : 'budget';
  return TIER_RANK[mTier] >= TIER_RANK[vTier] ? mTier : vTier;
}

/**
 * Voice Webhook — Comprehensive handler for ALL voice provider events.
 *
 * Handles:
 *  - end-of-call-report  → Billing, call record update, transcript/recording storage
 *  - status-update       → Real-time call status tracking
 *  - transcript          → Store real-time transcript segments
 *  - speech-update       → Track speech state changes
 *  - conversation-update → Store conversation messages
 *  - hang                → Detect silence/dead air
 *  - tool-calls          → Delegated to vapi-router (this handler records the event)
 *  - assistant-request   → Dynamic assistant selection for inbound calls
 *  - transfer-destination-request → Dynamic transfer routing
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// ─── Helpers ────────────────────────────────────────────────────────

function resolveOrganizationId(message: any): string | null {
  // Priority: metadata > assistant metadata > call metadata
  return (
    message?.call?.metadata?.organization_id ||
    message?.call?.metadata?.organizationId ||
    message?.call?.assistant?.metadata?.organizationId ||
    message?.metadata?.organizationId ||
    null
  );
}

function resolveTrinityCallId(message: any): string | null {
  return (
    message?.call?.metadata?.trinity_call_id ||
    message?.call?.metadata?.trinityCallId ||
    message?.call?.assistant?.metadata?.trinityCallId ||
    null
  );
}

async function resolveOrgFromProvider(providerCallId: string): Promise<{ organizationId: string | null; trinityCallId: string | null }> {
  const { data: callRow } = await supabase
    .from('voice_calls')
    .select('id, organization_id')
    .eq('provider_call_id', providerCallId)
    .single();

  return {
    organizationId: callRow?.organization_id || null,
    trinityCallId: callRow?.id || null
  };
}

async function ensureCallRow(
  organizationId: string,
  providerCallId: string,
  trinityCallId: string | null,
  status: string = 'in-progress'
): Promise<string> {
  if (trinityCallId) {
    // Update existing row
    await supabase.from('voice_calls')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', trinityCallId);
    return trinityCallId;
  }

  // Check if row exists by provider ID
  const { data: existing } = await supabase
    .from('voice_calls')
    .select('id')
    .eq('provider_call_id', providerCallId)
    .single();

  if (existing) return existing.id;

  // Create new row
  const { data: newRow, error } = await supabase
    .from('voice_calls')
    .insert({
      organization_id: organizationId,
      provider_call_id: providerCallId,
      provider: 'voice_engine',
      status,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create call row:', error);
    throw new Error('Failed to create call mapping');
  }

  return newRow!.id;
}

async function checkDedup(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  const { data } = await supabase
    .from('voice_event_deduplication')
    .select('event_id')
    .eq('event_id', eventId)
    .single();

  if (data) return true; // Already processed

  // Mark as processed
  await supabase.from('voice_event_deduplication').insert({ event_id: eventId }).catch(() => {});
  return false;
}

// ─── Event Handlers ─────────────────────────────────────────────────

async function handleEndOfCallReport(message: any, organizationId: string, trinityCallId: string) {
  const { call } = message;

  // 1. Update call record with final data
  const updateData: any = {
    status: 'ended',
    cost: call.cost || 0,
    duration_seconds: call.durationSeconds || 0,
    updated_at: new Date().toISOString()
  };

  if (call.endedReason) updateData.ended_reason = call.endedReason;

  await supabase.from('voice_calls')
    .update(updateData)
    .eq('id', trinityCallId);

  // 2. Store private data (transcript, recording, summary)
  const privateData: any = {
    organization_id: organizationId,
    voice_call_id: trinityCallId,
    created_at: new Date().toISOString()
  };

  if (call.recordingUrl) privateData.provider_recording_ref = call.recordingUrl;
  if (call.transcript) privateData.transcript_full = call.transcript;
  if (call.summary) privateData.transcript_summary = call.summary;
  if (call.analysis || call.costBreakdown) {
    privateData.provider_metadata = {
      analysis: call.analysis,
      costBreakdown: call.costBreakdown,
      endedReason: call.endedReason,
      messages: call.messages?.length || 0
    };
  }

  // Upsert (idempotent)
  await supabase.from('voice_call_private')
    .upsert(privateData, { onConflict: 'voice_call_id' })
    .catch(async () => {
      // If upsert fails (no unique constraint), try insert
      await supabase.from('voice_call_private').insert(privateData).catch(() => {});
    });

  // 3. Store recording reference
  if (call.recordingUrl) {
    await supabase.from('voice_call_recordings')
      .insert({
        organization_id: organizationId,
        voice_call_id: trinityCallId,
        provider_recording_ref: call.recordingUrl,
        status: 'available'
      })
      .catch(() => {}); // Ignore duplicate
  }

  // 4. Credit-based usage tracking + overage billing
  const durationSeconds = call.durationSeconds || 0;

  if (durationSeconds > 0) {
    // Determine voice tier from assistant config
    const assistantModel = call.assistant?.model?.model || call.assistant?.model || '';
    const voiceProvider = call.assistant?.voice?.provider || '';
    const tier = classifyTier(
      typeof assistantModel === 'string' ? assistantModel : '',
      typeof voiceProvider === 'string' ? voiceProvider : ''
    );
    const creditsPerMinute = VOICE_TIER_CREDITS[tier];
    const minutes = durationSeconds / 60;
    const creditsConsumed = Math.ceil(minutes * creditsPerMinute);
    const actionType = `voice_${tier}`;

    // Record credit usage via the new credit-based RPC
    const { data: creditResult, error: creditError } = await supabase.rpc('record_credit_usage', {
      p_organization_id: organizationId,
      p_credits: creditsConsumed,
      p_action_type: actionType,
      p_unit_count: minutes,
      p_description: `Voice call: ${Math.round(minutes * 10) / 10} min (${tier})`,
      p_reference_id: trinityCallId,
      p_metadata: {
        duration_seconds: durationSeconds,
        tier,
        credits_per_minute: creditsPerMinute,
        model: typeof assistantModel === 'string' ? assistantModel : '',
        voice_provider: typeof voiceProvider === 'string' ? voiceProvider : '',
        provider_cost: call.cost || 0,
        provider_status: call.status,
        ended_reason: call.endedReason,
        cost_breakdown: call.costBreakdown || null,
      },
    });

    if (creditError) {
      console.error('Credit usage RPC failed:', creditError);
    } else if (creditResult) {
      // Log overage info for monitoring
      if (creditResult.from_balance > 0) {
        console.warn(`Overage for org ${organizationId}: ${creditResult.from_balance} credits from balance (£${creditResult.balance_deducted_gbp})`);
      }
    }

    // Also record in legacy minute-based tracking for backward compat
    await supabase.rpc('record_call_usage', {
      p_organization_id: organizationId,
      p_duration_seconds: durationSeconds,
      p_call_id: trinityCallId,
    }).catch((err: any) => {
      console.warn('Legacy usage tracking failed (non-critical):', err?.message);
    });
  }

  // 5. Record event
  await recordEvent(organizationId, trinityCallId, 'end-of-call-report', {
    cost: call.cost || 0,
    duration: call.durationSeconds,
    endedReason: call.endedReason,
    hasRecording: !!call.recordingUrl,
    hasTranscript: !!call.transcript
  });

  // 6. Dispatch webhook event to customer endpoints (fire-and-forget)
  const webhookEventType = (call.endedReason === 'assistant-error' || call.endedReason === 'system-error')
    ? 'call.failed' : 'call.completed';
  const siteUrl = process.env.URL || 'http://localhost:8888';
  fetch(`${siteUrl}/.netlify/functions/webhook-dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organizationId,
      eventType: webhookEventType,
      payload: {
        callId: trinityCallId,
        duration: call.durationSeconds || 0,
        endedReason: call.endedReason,
        cost: call.cost || 0,
        hasRecording: !!call.recordingUrl,
        hasTranscript: !!call.transcript,
      },
    }),
  }).catch(() => {}); // non-blocking — never delay the webhook response
}

async function handleStatusUpdate(message: any, organizationId: string, trinityCallId: string) {
  const status = message.status || message.call?.status;

  await supabase.from('voice_calls')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', trinityCallId);

  await recordEvent(organizationId, trinityCallId, 'status-update', { status });
}

async function handleTranscript(message: any, organizationId: string, trinityCallId: string) {
  await recordEvent(organizationId, trinityCallId, 'transcript', {
    role: message.role,
    transcript: message.transcript,
    transcriptType: message.transcriptType
  });
}

async function handleConversationUpdate(message: any, organizationId: string, trinityCallId: string) {
  await recordEvent(organizationId, trinityCallId, 'conversation-update', {
    messageCount: message.messages?.length || 0
  });
}

async function handleSpeechUpdate(message: any, organizationId: string, trinityCallId: string) {
  await recordEvent(organizationId, trinityCallId, 'speech-update', {
    status: message.status,
    role: message.role
  });
}

async function handleHang(message: any, organizationId: string, trinityCallId: string) {
  await recordEvent(organizationId, trinityCallId, 'hang', {});
}

async function handleAssistantRequest(message: any, organizationId: string): Promise<any> {
  // Dynamic assistant selection for inbound calls
  // Look up the default assistant for the called phone number
  const phoneNumber = message.phoneNumber?.number || message.call?.phoneNumber?.number;

  if (!phoneNumber) {
    console.warn('No phone number in assistant-request');
    return null;
  }

  // Check if we have a configured route for this number
  const { data: route } = await supabase
    .from('voice_phone_routes')
    .select('assistant_id, configuration')
    .eq('organization_id', organizationId)
    .eq('phone_number', phoneNumber)
    .eq('active', true)
    .single();

  if (route?.assistant_id) {
    return { assistantId: route.assistant_id };
  }

  // Fallback: return null to let provider use default
  return null;
}

async function handleTransferRequest(message: any, organizationId: string): Promise<any> {
  // Dynamic transfer destination
  // Could look up transfer rules, CRM data, etc.
  await recordEvent(organizationId, null, 'transfer-destination-request', {
    callId: message.call?.id
  });

  // Return null to use default transfer behavior
  return null;
}

async function recordEvent(
  organizationId: string,
  trinityCallId: string | null,
  eventType: string,
  data: any
) {
  await supabase.from('voice_call_events')
    .insert({
      organization_id: organizationId,
      voice_call_id: trinityCallId,
      event_type: eventType,
      event_data: data,
      created_at: new Date().toISOString()
    })
    .catch((err: any) => {
      console.warn('Failed to record event:', err);
    });
}

// ─── Main Handler ───────────────────────────────────────────────────

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'POST only' };
  }

  try {
    const rawBody = event.body || '';
    const signature = event.headers['x-vapi-signature'] || event.headers['X-Vapi-Signature'];

    // 1. Signature Verification
    if (webhookSecret) {
      if (!signature || !verifyVapiSignature(rawBody, signature, webhookSecret)) {
        console.error('Invalid webhook signature');
        return { statusCode: 401, headers, body: JSON.stringify({ message: 'Unauthorized' }) };
      }
    } else {
      console.warn('WEBHOOK_SECRET not set — accepting unsigned requests');
    }

    const payload = JSON.parse(rawBody);
    const { message } = payload;

    if (!message || !message.type) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid payload' }) };
    }

    // 2. Timestamp validation (replay protection ±5 min)
    const now = Date.now();
    const eventTime = message.timestamp ? new Date(message.timestamp).getTime() : now;
    if (Math.abs(now - eventTime) > 5 * 60 * 1000) {
      console.error('⛔ Timestamp out of range');
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'Request expired' }) };
    }

    // 3. Deduplication
    const eventId = `${message.type}_${message.call?.id || 'unknown'}_${message.timestamp || Date.now()}`;
    if (message.type === 'end-of-call-report') {
      const isDuplicate = await checkDedup(eventId);
      if (isDuplicate) {
        // Duplicate event — already processed
        return { statusCode: 200, headers, body: JSON.stringify({ received: true, duplicate: true }) };
      }
    }

    // 4. Resolve organization
    let organizationId = resolveOrganizationId(message);
    let trinityCallId = resolveTrinityCallId(message);
    const providerCallId = message.call?.id;

    // Fallback: look up from DB
    if (!organizationId && providerCallId) {
      const resolved = await resolveOrgFromProvider(providerCallId);
      organizationId = resolved.organizationId;
      trinityCallId = trinityCallId || resolved.trinityCallId;
    }

    // For assistant-request, org might come from phone number lookup
    if (!organizationId && message.type === 'assistant-request') {
      // Try phone number lookup
      const phoneNumber = message.phoneNumber?.number;
      if (phoneNumber) {
        const { data: phoneData } = await supabase
          .from('voice_phone_routes')
          .select('organization_id')
          .eq('phone_number', phoneNumber)
          .single();
        organizationId = phoneData?.organization_id || null;
      }
    }

    if (!organizationId) {
      console.error('❌ Could not resolve organization for event:', message.type);
      // Return 200 to prevent retries for events we can't process
      return { statusCode: 200, headers, body: JSON.stringify({ received: true, skipped: 'no_org' }) };
    }

    // 5. Ensure call row exists (for events that reference a call)
    if (providerCallId && message.type !== 'assistant-request') {
      trinityCallId = await ensureCallRow(organizationId, providerCallId, trinityCallId);
    }

    // 6. Route to event handler
    let responseBody: any = { received: true };

    switch (message.type) {
      case 'end-of-call-report':
        await handleEndOfCallReport(message, organizationId, trinityCallId!);
        break;

      case 'status-update':
        await handleStatusUpdate(message, organizationId, trinityCallId!);
        break;

      case 'transcript':
        await handleTranscript(message, organizationId, trinityCallId!);
        break;

      case 'conversation-update':
        await handleConversationUpdate(message, organizationId, trinityCallId!);
        break;

      case 'speech-update':
        await handleSpeechUpdate(message, organizationId, trinityCallId!);
        break;

      case 'hang':
        await handleHang(message, organizationId, trinityCallId!);
        break;

      case 'assistant-request': {
        const assistantResponse = await handleAssistantRequest(message, organizationId);
        if (assistantResponse) {
          responseBody = assistantResponse;
        }
        break;
      }

      case 'transfer-destination-request': {
        const transferResponse = await handleTransferRequest(message, organizationId);
        if (transferResponse) {
          responseBody = transferResponse;
        }
        break;
      }

      case 'tool-calls':
        // Tool calls are primarily handled by vapi-router
        // This just records the event for audit
        await recordEvent(organizationId, trinityCallId, 'tool-calls', {
          tools: message.toolCallList?.map((t: any) => t.function?.name) || []
        });
        break;

      default:
        // Record unknown event types for future processing
        await recordEvent(organizationId, trinityCallId, message.type, {
          raw: JSON.stringify(message).substring(0, 500)
        });
        break;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseBody)
    };

  } catch (error: any) {
    console.error('❌ Webhook Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
