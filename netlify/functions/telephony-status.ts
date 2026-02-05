
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { hashIdentifier, verifyTrinitySignature } from './security';

// Environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.TRINITY_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export const handler: Handler = async (event) => {
    const headers = { 'Content-Type': 'application/json' };
    
    // 1. SECURITY & DRIFT
    if (!webhookSecret) {
        console.error('⛔ Config Error: Missing Secret');
        return { statusCode: 500, body: 'Internal Error' };
    }

    const signature = event.headers['x-trinity-signature'] || event.headers['X-Trinity-Signature'];
    const timestamp = event.headers['x-trinity-timestamp'] || event.headers['X-Trinity-Timestamp'];

    if (!signature || !timestamp) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    const now = Date.now();
    const eventTime = parseInt(timestamp, 10);
    if (isNaN(eventTime) || Math.abs(now - eventTime) > 5 * 60 * 1000) {
        return { statusCode: 400, body: 'Expired' };
    }

    const rawBody = event.isBase64Encoded 
        ? Buffer.from(event.body || '', 'base64').toString('utf8') 
        : event.body || '';

    if (!verifyTrinitySignature(rawBody, signature, webhookSecret)) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    // 2. PARSE PAYLOAD
    let body;
    try {
        body = JSON.parse(rawBody);
    } catch (e) {
        return { statusCode: 400, body: 'Invalid JSON' };
    }

    const msg = body.message || body;
    const providerCallId = msg.call?.id || msg.providerCallId;
    
    if (!providerCallId) {
        return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    const hashedCallId = hashIdentifier(providerCallId);
    console.log(`[Status] Processing ${hashedCallId}`);

    try {
        // 3. LOOKUP CALL
        const { data: voiceCall } = await supabase
            .from('voice_calls')
            .select('id, organization_id, campaign_id, contact_id')
            .eq('provider_call_id', providerCallId)
            .single();

        if (!voiceCall) {
            console.warn(`⚠️ Unknown Call Reported: ${hashedCallId}`);
            return { statusCode: 200, body: JSON.stringify({ received: true }) };
        }

        const trinityCallId = voiceCall.id;
        const orgId = voiceCall.organization_id;

        // 4. IDEMPOTENCY LOCK
        const eventType = msg.type || 'end-of-call-report'; 
        const { error: idemError } = await supabase
            .from('voice_call_finalisations')
            .insert({
                organization_id: orgId,
                provider_call_id: providerCallId,
                event_type: eventType
            });

        if (idemError) {
            if (idemError.code === '23505') {
                 console.log(`♻️ Idempotent Replay: ${hashedCallId}`);
                 return { statusCode: 200, body: JSON.stringify({ received: true }) };
            }
            throw idemError; 
        }

        // 5. EXTRACT METRICS
        const durationSeconds = Math.round(msg.duration || 0);
        const cost = msg.cost || 0;
        const rawReason = msg.endedReason || msg.status || 'completed';
        const transcriptSummary = msg.summary || msg.transcript || msg.analysis?.summary || null;
        const recordingUrl = msg.recordingUrl || msg.recording_url || null;

        // 6. CLASSIFY OUTCOME
        let classifiedOutcome = rawReason;
        const { data: rules } = await supabase
            .from('conversation_outcome_rules')
            .select('trigger_pattern, outcome_label')
            .eq('organization_id', orgId)
            .eq('is_active', true)
            .order('priority', { ascending: false });

        if (rules && rules.length > 0 && transcriptSummary) {
            for (const rule of rules) {
                try {
                    const regex = new RegExp(rule.trigger_pattern, 'i');
                    if (regex.test(transcriptSummary)) {
                        classifiedOutcome = rule.outcome_label;
                        break;
                    }
                } catch (rxErr) {
                    console.warn(`Invalid Regex in Rule: ${rule.trigger_pattern}`);
                }
            }
        }

        // 7. UPDATE VOICE CALL (Public Metrics Only)
        // **CRITICAL**: Do NOT write PII (transcript/summary) here unless it's strictly the "Outcome Label".
        await supabase
            .from('voice_calls')
            .update({
                status: 'ended',
                ended_at: new Date().toISOString(),
                duration_seconds: durationSeconds,
                outcome: classifiedOutcome,
                cost: cost,
                updated_at: new Date().toISOString()
            })
            .eq('id', trinityCallId);

        // 8. PRIVATE DATA STORAGE (Service Role Only)
        // Store Transcript & Summary here securely.
        if (transcriptSummary || recordingUrl) {
            await supabase
                .from('voice_call_private')
                .insert({
                    organization_id: orgId,
                    voice_call_id: trinityCallId,
                    transcript_full: msg.transcript || null,
                    transcript_summary: transcriptSummary || null,
                    provider_recording_ref: recordingUrl || null
                });
        }

        // 9. RECORDING REF (Legacy Table support as requested)
        if (recordingUrl) {
            await supabase
                .from('voice_call_recordings')
                .insert({
                    organization_id: orgId,
                    voice_call_id: trinityCallId,
                    provider_recording_ref: recordingUrl,
                    status: 'pending'
                });
        }

        // 10. EVENTS
        await supabase.from('voice_call_events').insert({
            organization_id: orgId,
            call_id: trinityCallId,
            type: 'call.ended',
            payload: { 
                outcome: classifiedOutcome, 
                duration: durationSeconds,
                has_recording: !!recordingUrl,
                has_transcript: !!transcriptSummary
            }
        });

        // 11. LEDGER
        if (cost > 0) {
            await supabase.rpc('apply_ledger_entry', {
                p_organization_id: orgId,
                p_amount: -Math.abs(cost),
                p_type: 'usage_voice',
                p_description: `Voice Call ${classifiedOutcome}`,
                p_reference_id: trinityCallId, 
                p_metadata: { duration: durationSeconds, source: 'telephony-status' }
            });
        }

        // 12. CAMPAIGN LOOP
        if (voiceCall.campaign_id) {
            console.log(`[Status] Linking to Campaign ${hashIdentifier(voiceCall.campaign_id)}`);
            
            const failures = ['failed', 'busy', 'no-answer', 'voicemail'];
            const lowerOutcome = classifiedOutcome.toLowerCase();
            // Default to completed unless explicit failure or DNC?
            // User requirement: "completed or failed".
            let itemStatus = 'completed';
            
            // Logic: If outcome implies no contact was made or tech failure -> failed?
            // If outcome is "Appointment Set" -> completed.
            // If outcome is "Not Interested" -> completed.
            if (failures.some(f => lowerOutcome.includes(f))) {
                itemStatus = 'failed';
            }

            await supabase
                .from('campaign_items')
                .update({
                    status: itemStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('voice_call_id', trinityCallId)
                .eq('campaign_id', voiceCall.campaign_id);
        }

        return { statusCode: 200, body: JSON.stringify({ received: true }) };

    } catch (err: any) {
        console.error(`❌ Status Error ${hashedCallId}:`, err.message);
        return { statusCode: 500, body: 'Internal Error' };
    }
};
