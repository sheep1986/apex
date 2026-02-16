import { Handler, schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { hashIdentifier } from './security';
import { CircuitBreakerService } from './circuit-breaker';

// ─── Environment ────────────────────────────────────────────────────
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiApiKey = process.env.VAPI_PRIVATE_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
const siteUrl = process.env.URL || 'http://localhost:8888';

// ─── Configuration ──────────────────────────────────────────────────
const BATCH_SIZE = 50;                   // Up from 10 — 50 items per cron tick
const MAX_RETRIES = 5;                   // Max attempts before permanent failure
const MIN_BALANCE_THRESHOLD = 1.00;      // $1.00 minimum to start calls
const DEFAULT_ORG_CONCURRENCY = 20;      // Default org-level concurrent call cap
const WORKER_ID = `worker-${Date.now()}-${uuidv4().substring(0, 8)}`;

// ─── Error Classification ───────────────────────────────────────────
enum ErrorType {
    TERMINAL = 'terminal',       // Never retry (bad data, invalid contact)
    TRANSIENT = 'transient',     // Retry with backoff (network, provider 5xx)
    RATE_LIMITED = 'rate_limited', // Retry with longer backoff (429s)
    BUDGET = 'budget',           // Don't retry until balance restored
}

function classifyError(err: Error): ErrorType {
    const msg = err.message.toLowerCase();
    if (msg.includes('insufficient funds') || msg.includes('balance below') || msg.includes('circuit breaker')) return ErrorType.BUDGET;
    if (msg.includes('invalid contact') || msg.includes('not found') || msg.includes('governance') || msg.includes('access denied')) return ErrorType.TERMINAL;
    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many')) return ErrorType.RATE_LIMITED;
    return ErrorType.TRANSIENT;
}

// ─── Retry Backoff with Jitter ──────────────────────────────────────
function getRetryDelay(attemptCount: number, errorType: ErrorType): number {
    const baseDelays: Record<ErrorType, number> = {
        [ErrorType.TERMINAL]: 24 * 60 * 60 * 1000,  // 24 hours (won't actually retry)
        [ErrorType.BUDGET]: 30 * 60 * 1000,          // 30 min (check balance later)
        [ErrorType.RATE_LIMITED]: 5 * 60 * 1000,     // 5 min base for rate limits
        [ErrorType.TRANSIENT]: 60 * 1000,            // 1 min base for transient
    };

    const base = baseDelays[errorType];
    // Exponential backoff: base * 2^attempt (capped at 1 hour)
    const exponential = Math.min(base * Math.pow(2, attemptCount), 60 * 60 * 1000);
    // Add jitter: ±25% randomization to prevent thundering herd
    const jitter = exponential * (0.75 + Math.random() * 0.5);
    return Math.round(jitter);
}

// ─── Provider Factory ───────────────────────────────────────────────
const ProviderFactory = {
    getProvider(type: string) {
        if (type === 'shadow') {
            return {
                async dispatch(payload: any) {
                    console.log(`[Shadow] Would dispatch call to ${payload.to}`);
                    return { providerCallId: `shadow-${uuidv4()}` };
                }
            };
        }
        return {
            async dispatch(payload: any) {
                const response = await fetch('https://api.vapi.ai/call/phone', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${vapiApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        assistantId: payload.assistantId,
                        customer: {
                            number: payload.to,
                            name: payload.customerName
                        },
                        phoneNumberId: payload.phoneNumberId,
                        assistantOverrides: payload.assistantOverrides,
                        metadata: {
                            trinityCallId: payload.trinityCallId,
                            campaignType: payload.campaignType,
                            campaignId: payload.campaignId,
                        }
                    })
                });
                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(`Provider API Error: ${response.status} - ${err}`);
                }
                const data = await response.json();
                return { providerCallId: data.id };
            }
        };
    }
};

// ─── Org Concurrency Check ──────────────────────────────────────────
async function checkOrgConcurrency(organizationId: string): Promise<boolean> {
    // Count all currently active calls for this org across ALL campaigns
    const { count, error } = await supabase
        .from('campaign_items')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .in('status', ['queued', 'in_progress']);

    if (error) {
        console.error('[ConcurrencyCheck] Query error:', error.message);
        return true; // Allow on error to avoid blocking all calls
    }

    // Check if org has a custom override
    const { data: controls } = await supabase
        .from('organization_controls')
        .select('max_concurrency_override')
        .eq('organization_id', organizationId)
        .single();

    const maxConcurrency = controls?.max_concurrency_override || DEFAULT_ORG_CONCURRENCY;
    const currentActive = count || 0;

    if (currentActive >= maxConcurrency) {
        console.log(`[ConcurrencyCheck] Org ${hashIdentifier(organizationId)}: ${currentActive}/${maxConcurrency} — at limit`);
        return false;
    }
    return true;
}

// ─── Campaign Completion Sync ───────────────────────────────────────
async function syncCampaignCompletion() {
    try {
        // Find campaigns that are 'running' where ALL items are in terminal states
        const { data: runningCampaigns } = await supabase
            .from('campaigns')
            .select('id')
            .eq('status', 'running');

        if (!runningCampaigns || runningCampaigns.length === 0) return;

        for (const campaign of runningCampaigns) {
            // Count items still pending/queued/in_progress
            const { count: activeCount } = await supabase
                .from('campaign_items')
                .select('id', { count: 'exact', head: true })
                .eq('campaign_id', campaign.id)
                .in('status', ['pending', 'queued', 'in_progress']);

            if ((activeCount || 0) === 0) {
                // All items are in terminal states — mark campaign completed
                const { count: totalCount } = await supabase
                    .from('campaign_items')
                    .select('id', { count: 'exact', head: true })
                    .eq('campaign_id', campaign.id);

                const { count: completedCount } = await supabase
                    .from('campaign_items')
                    .select('id', { count: 'exact', head: true })
                    .eq('campaign_id', campaign.id)
                    .eq('status', 'completed');

                const { count: failedCount } = await supabase
                    .from('campaign_items')
                    .select('id', { count: 'exact', head: true })
                    .eq('campaign_id', campaign.id)
                    .eq('status', 'failed');

                await supabase
                    .from('campaigns')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                        results_summary: {
                            total: totalCount || 0,
                            completed: completedCount || 0,
                            failed: failedCount || 0,
                        }
                    })
                    .eq('id', campaign.id);

                console.log(`[CampaignManager] Campaign ${hashIdentifier(campaign.id)} completed: ${completedCount}/${totalCount} success, ${failedCount} failed`);

                // Dispatch webhook for campaign completion
                try {
                    await fetch(`${siteUrl}/.netlify/functions/webhook-dispatch`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            organizationId: campaign.organization_id,
                            eventType: 'campaign.completed',
                            payload: {
                                campaignId: campaign.id,
                                total: totalCount || 0,
                                completed: completedCount || 0,
                                failed: failedCount || 0,
                            },
                        }),
                    });
                } catch {
                    // Non-critical
                }
            }
        }
    } catch (err: any) {
        console.error('[CampaignManager] Completion sync error:', err.message);
    }
}

// ─── Sync voice_call status back to campaign_items ──────────────────
async function syncCallStatuses() {
    try {
        // Find in_progress campaign_items whose voice calls have ended
        const { data: staleItems } = await supabase
            .from('campaign_items')
            .select('id, voice_call_id')
            .eq('status', 'in_progress')
            .not('voice_call_id', 'is', null)
            .limit(100);

        if (!staleItems || staleItems.length === 0) return;

        for (const item of staleItems) {
            const { data: call } = await supabase
                .from('voice_calls')
                .select('status, duration')
                .eq('id', item.voice_call_id)
                .single();

            if (!call) continue;

            // Map voice_call terminal statuses to campaign_item statuses
            if (['completed', 'failed', 'no_answer', 'voicemail'].includes(call.status)) {
                const itemStatus = call.status === 'completed' ? 'completed' : 'failed';
                await supabase
                    .from('campaign_items')
                    .update({
                        status: itemStatus,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', item.id);
            }
        }
    } catch (err: any) {
        console.error('[CampaignManager] Call status sync error:', err.message);
    }
}

// ─── Main Worker ────────────────────────────────────────────────────
const runWorker = async () => {
    console.log(`[CampaignManager] Starting Run: ${WORKER_ID}`);

    try {
        // Phase 1: Sync call statuses (voice_calls → campaign_items)
        await syncCallStatuses();

        // Phase 2: Sync campaign completion
        await syncCampaignCompletion();

        // Phase 3: Atomic Reservation via RPC (Concurrency Aware)
        const { data: items, error: rpcError } = await supabase
            .rpc('reserve_campaign_items', {
                p_batch_size: BATCH_SIZE,
                p_worker_id: WORKER_ID
            });

        if (rpcError) {
            console.error('RPC Fail', rpcError);
            return { statusCode: 500, body: JSON.stringify({ error: rpcError }) };
        }

        if (!items || items.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ processed: 0, synced: true }) };
        }

        console.log(`[CampaignManager] Reserved ${items.length} items.`);

        // Phase 4: Process Batch (parallel with concurrency awareness)
        const results = await Promise.allSettled(items.map((item: any) => processItem(item)));

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;
        console.log(`[CampaignManager] Batch Complete. Success: ${successCount}, Failed: ${failCount}, Total: ${items.length}`);

        return { statusCode: 200, body: JSON.stringify({ processed: items.length, success: successCount, failed: failCount }) };

    } catch (err: any) {
        console.error('[CampaignManager] Fatal Error', err);
        return { statusCode: 500, body: err.message };
    }
};

export const handler: Handler = schedule('* * * * *', async (event) => {
    return runWorker();
});

// ─── Process Single Item ────────────────────────────────────────────
async function processItem(item: any) {
    const { id: itemId, campaign_id, contact_id, organization_id, attempt_count } = item;
    const hashedItemId = hashIdentifier(itemId);

    try {
        // A. Max Retry Check
        const currentCount = attempt_count || 0;
        if (currentCount >= MAX_RETRIES) {
            throw new Error('Max retries exceeded');
        }

        // B. Org-Level Concurrency Check
        const concurrencyAllowed = await checkOrgConcurrency(organization_id);
        if (!concurrencyAllowed) {
            // Release reservation and reschedule — not a failure
            await supabase
                .from('campaign_items')
                .update({
                    status: 'pending',
                    reserved_at: null,
                    reserved_by: null,
                    next_try_at: new Date(Date.now() + 30000).toISOString() // Try again in 30s
                })
                .eq('id', itemId);
            return;
        }

        // C. Credit Enforcement
        const { data: balance, error: balError } = await supabase
            .rpc('get_organization_balance', { p_organization_id: organization_id });

        if (balError) throw balError;

        if ((balance || 0) < MIN_BALANCE_THRESHOLD) {
            throw new Error('Insufficient Funds: Balance below threshold.');
        }

        // D. Governance Enforcement
        const { data: controls } = await supabase
            .from('organization_controls')
            .select('is_suspended, shadow_mode, max_concurrency_override')
            .eq('organization_id', organization_id)
            .single();

        if (controls?.is_suspended) {
            throw new Error('Governance: Organization Suspended.');
        }

        const isShadowMode = controls?.shadow_mode || false;

        // E. Circuit Breaker Check
        const breaker = new CircuitBreakerService(supabase);
        const { allowed, reason } = await breaker.checkLimit(organization_id, 0.10);

        if (!allowed) {
            throw new Error(`Circuit Breaker: ${reason}`);
        }

        // F. Fetch Contact Data
        const { data: contact } = await supabase
            .from('contacts')
            .select('phone_e164, name, metadata')
            .eq('id', contact_id)
            .single();

        if (!contact || !contact.phone_e164) {
            throw new Error('Invalid Contact Data');
        }

        // G. Fetch Campaign Config
        const { data: campaign } = await supabase
            .from('campaigns')
            .select('script_config, type, phone_number_id')
            .eq('id', campaign_id)
            .single();

        // H. Create Outbound Call Record
        const { data: callRow, error: callError } = await supabase
            .from('voice_calls')
            .insert({
                organization_id,
                contact_id,
                direction: 'outbound',
                status: 'queued',
                provider: 'voice_engine',
                campaign_id
            })
            .select('id')
            .single();

        if (callError) throw callError;
        const trinityCallId = callRow.id;

        // I. Build Assistant Overrides (variable mapping from contact metadata)
        const assistantOverrides: any = {};
        if (contact.metadata) {
            assistantOverrides.variableValues = {};
            for (const [key, value] of Object.entries(contact.metadata)) {
                if (typeof value === 'string') {
                    assistantOverrides.variableValues[key] = value;
                }
            }
            // Common mapping: name → firstName
            if (contact.name) {
                assistantOverrides.variableValues.contactName = contact.name;
            }
        }

        // J. Dispatch to Telephony Provider
        await dispatchCall(
            contact.phone_e164,
            campaign?.script_config,
            trinityCallId,
            campaign?.type,
            contact.name,
            isShadowMode,
            campaign?.phone_number_id,
            campaign_id,
            Object.keys(assistantOverrides).length > 0 ? assistantOverrides : undefined
        );

        // K. Update Item State (Success)
        await supabase
            .from('campaign_items')
            .update({
                status: 'in_progress',
                voice_call_id: trinityCallId,
                last_error: null,
                reserved_at: null,
                reserved_by: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', itemId);

        console.log(`[CampaignManager] Dispatched Item ${hashedItemId} -> Call ${hashIdentifier(trinityCallId)}`);

    } catch (err: any) {
        console.error(`[CampaignManager] Item Fail ${hashedItemId}`, err.message);

        const currentCount = attempt_count || 0;
        const nextAttempt = currentCount + 1;
        const errorType = classifyError(err);
        const isTerminal = errorType === ErrorType.TERMINAL || nextAttempt >= MAX_RETRIES;
        const retryDelay = getRetryDelay(nextAttempt, errorType);

        await supabase
            .from('campaign_items')
            .update({
                status: isTerminal ? 'failed' : 'pending',
                last_error: `[${errorType}] ${err.message?.substring(0, 240)}`,
                attempt_count: nextAttempt,
                reserved_at: null,
                reserved_by: null,
                next_try_at: isTerminal
                    ? null
                    : new Date(Date.now() + retryDelay).toISOString()
            })
            .eq('id', itemId);

        throw err;
    }
}

// ─── Dispatch Call ──────────────────────────────────────────────────
async function dispatchCall(
    to: string,
    config: any,
    trinityId: string,
    type: string,
    name: string,
    isShadowMode: boolean = false,
    phoneNumberId?: string,
    campaignId?: string,
    assistantOverrides?: any,
) {
    const providerType = isShadowMode ? 'shadow' : 'vapi';
    const provider = ProviderFactory.getProvider(providerType);

    const payload = {
        to,
        trinityCallId: trinityId,
        campaignType: type,
        campaignId,
        customerName: name,
        assistantId: config?.assistantId,
        phoneNumberId: phoneNumberId || config?.phoneNumberId,
        assistantOverrides,
        scriptConfig: config,
        isShadowMode
    };

    try {
        const response = await provider.dispatch(payload);
        return response.providerCallId;
    } catch (err: any) {
        console.error(`[Dispatch] Provider Error:`, err.message);
        throw err;
    }
}
