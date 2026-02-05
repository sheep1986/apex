
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { hashIdentifier, verifyTrinitySignature } from './security';

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

    // 2. SECURITY CHECK
    // Fail closed if no secret
    if (!webhookSecret) {
        // Log internally but generic error
        console.error('⛔ Config Error: Missing Secret');
        return { statusCode: 500, body: 'Internal Error' };
    }

    const signature = event.headers['x-trinity-signature'] || event.headers['X-Trinity-Signature'];
    const timestamp = event.headers['x-trinity-timestamp'] || event.headers['X-Trinity-Timestamp'];

    if (!signature || !timestamp) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    // Drift Check (5 mins)
    const now = Date.now();
    const eventTime = parseInt(timestamp, 10);
    if (isNaN(eventTime) || Math.abs(now - eventTime) > 5 * 60 * 1000) {
        return { statusCode: 400, body: 'Expired' };
    }

    // HMAC verification
    if (!verifyTrinitySignature(rawBody, signature, webhookSecret)) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    const body = JSON.parse(rawBody);
    
    // 3. PARSE PAYLOAD (Provider Agnostic)
    const msg = body.message || body;
    const providerCallId = msg.call?.id;
    
    // Unknown call handling: Return 200 OK to avoid enumeration, but don't process.
    if (!providerCallId) {
        return { statusCode: 400, body: 'Bad Request' }; 
    }

    // Log internally with Hash
    const hashedCallId = hashIdentifier(providerCallId);

    if (msg.type !== 'end-of-call-report') {
        // Ignore other events
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    // 4. MAP TO TRINITY CALL
    const { data: voiceCall } = await supabase
        .from('voice_calls')
        .select('id, organization_id, contact_id, status')
        .eq('provider_call_id', providerCallId)
        .single();

    if (!voiceCall) {
        // Zero-Trace: Do NOT return 404. Just log internally.
        console.warn(`⚠️ Unknown Call Status Report: ${hashedCallId}`);
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    const trinityCallId = voiceCall.id;
    const orgId = voiceCall.organization_id;

    // 5. METRICS & FINALIZATION
    const durationSeconds = msg.duration || 
                           (msg.startedAt && msg.endedAt ? (new Date(msg.endedAt).getTime() - new Date(msg.startedAt).getTime()) / 1000 : 0);
    const cost = msg.cost || 0;
    const providerRecordingUrl = msg.recordingUrl || null;
    const transcriptSummary = msg.summary || msg.transcript || null; // Caution: verify summary doesn't leak sensitive data if not needed.
    const endedReason = msg.endedReason || 'completed';

    // Update voice_calls (Idempotent updates are fine)
    // NOTE: We DO NOT store providerRecordingUrl in voice_calls here.
    const updatePayload: any = {
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_seconds: Math.round(durationSeconds),
        cost: cost,
        disposition: endedReason,
        transcript_summary: transcriptSummary 
    };

    const { error: updateError } = await supabase
        .from('voice_calls')
        .update(updatePayload)
        .eq('id', trinityCallId);

    if (updateError) {
        console.error(`❌ DB Update Fail [${hashedCallId}]`);
        // Return 500 here as it's a specific system failure we might want to retry
        return { statusCode: 500, body: 'Internal Error' };
    }

    // 6. RECORDING STORAGE (Pending)
    if (providerRecordingUrl) {
        // Insert into secure pending table
        // We never expose this URL to client.
        const { error: recError } = await supabase
            .from('voice_call_recordings')
            .insert({
                organization_id: orgId,
                voice_call_id: trinityCallId,
                provider_recording_ref: providerRecordingUrl,
                status: 'pending'
            });
        
        if (recError) {
             // If duplicate (race condition), it's fine.
             if (recError.code !== '23505') {
                 console.error(`❌ Rec Insert Fail [${hashedCallId}]`);
             }
        }
    }

    // 7. BILLING (Idempotent via apply_ledger_entry)
    if (cost > 0) {
        const { error: ledgerError } = await supabase
            .rpc('apply_ledger_entry', {
                p_organization_id: orgId,
                p_amount: -Math.abs(cost),
                p_type: 'usage_voice',
                p_description: 'Voice Call Usage', // Generic description
                p_reference_id: trinityCallId,     // Ensures Idempotency
                p_metadata: { duration: durationSeconds, type: 'voice_engine' }
            });

        if (ledgerError) console.error(`❌ Ledger Fail [${hashedCallId}]`);
    }

    // 8. TICKET CREATION (Idempotent via Unique Constraint)
    if (endedReason === 'voicemail' || endedReason === 'customer-did-not-answer') {
         if (voiceCall.contact_id) {
             const { error: ticketError } = await supabase
                .from('tickets')
                .insert({
                    organization_id: orgId,
                    contact_id: voiceCall.contact_id,
                    reference_call_id: trinityCallId, // Enforces Uniqueness
                    source: 'voice_voicemail',
                    status: 'open',
                    priority: 'medium',
                    description: `Voicemail. Duration: ${Math.round(durationSeconds)}s.`
                })
                .select()
                .single();

             // Ignore unique violations (23505) gracefully
             if (ticketError && ticketError.code !== '23505') {
                 console.error(`❌ Ticket Fail [${hashedCallId}]`, ticketError);
             }
         }
    }

    // 9. ACTIVITY TIMELINE (Idempotent via Unique Constraint)
    // Constraint: (organization_id, type, reference_id)
    const { error: actError } = await supabase.from('activities').insert({
        organization_id: orgId,
        contact_id: voiceCall.contact_id,
        type: 'call_inbound', 
        reference_id: trinityCallId,
        summary: `Call ended. Duration: ${Math.round(durationSeconds)}s.`,
        metadata: { cost, disposition: endedReason }
    });

    if (actError && actError.code !== '23505') {
        console.error(`❌ Activity Fail [${hashedCallId}]`);
    }

    // 10. TRACE EVENTS (Legacy)
    // We allow duplicates here for debugging or could use ID. 
    // Ensuring no PII in payload.
    await supabase.from('voice_call_events').insert({
        voice_call_id: trinityCallId,
        type: 'call.ended',
        payload: { 
            duration: durationSeconds, 
            cost, 
            reason: endedReason, 
            recording: providerRecordingUrl ? 'secure_captured' : 'none' // Don't log URL
        }
    });

    console.log(`✅ Finalized [${hashedCallId}]`);
    return { statusCode: 200, body: JSON.stringify({ received: true }) };

  } catch (error) {
      console.error('❌ Status Handler Crash');
      return { statusCode: 500, body: 'Internal Error' };
  }
};
