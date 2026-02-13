import { Handler, schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { hashIdentifier } from './security';
import { CircuitBreakerService } from './circuit-breaker';

// Environment
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiApiKey = process.env.VAPI_PRIVATE_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Configuration
const BATCH_SIZE = 10;
const WORKER_ID = `worker-${Date.now()}-${uuidv4().substring(0, 8)}`;
const MIN_BALANCE_THRESHOLD = 1.00; // $1.00 minimum to start calls

// Provider Factory (simplified inline for now)
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
        // Default: Vapi provider
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
                        metadata: {
                            trinityCallId: payload.trinityCallId,
                            campaignType: payload.campaignType
                        }
                    })
                });
                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(`Vapi API Error: ${response.status} - ${err}`);
                }
                const data = await response.json();
                return { providerCallId: data.id };
            }
        };
    }
};

const runWorker = async () => {
    console.log(`[CampaignManager] Starting Run: ${WORKER_ID}`);

    try {
        // 1. Atomic Reservation via RPC (Concurrency Aware)
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
            return { statusCode: 200, body: JSON.stringify({ processed: 0 }) };
        }

        console.log(`[CampaignManager] Reserved ${items.length} items.`);

        // 2. Process Batch
        const results = await Promise.allSettled(items.map(async (item: any) => {
            return processItem(item);
        }));

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        console.log(`[CampaignManager] Batch Complete. Success: ${successCount}/${items.length}`);

        return { statusCode: 200, body: JSON.stringify({ processed: items.length, success: successCount }) };

    } catch (err: any) {
        console.error('[CampaignManager] Fatal Error', err);
        return { statusCode: 500, body: err.message };
    }
};

export const handler: Handler = schedule('* * * * *', async (event) => {
    return runWorker();
});

async function processItem(item: any) {
    const { id: itemId, campaign_id, contact_id, organization_id, attempt_count } = item;
    const hashedItemId = hashIdentifier(itemId);

    try {
        // A. Credit Enforcement (Hardening P0)
        const { data: balance, error: balError } = await supabase
            .rpc('get_organization_balance', { p_organization_id: organization_id });

        if (balError) throw balError;

        if ((balance || 0) < MIN_BALANCE_THRESHOLD) {
             throw new Error('Insufficient Funds: Balance below threshold.');
        }

        // --- GOVERNANCE ENFORCEMENT ---
        const { data: controls } = await supabase
            .from('organization_controls')
            .select('is_suspended, shadow_mode, max_concurrency_override')
            .eq('organization_id', organization_id)
            .single();

        if (controls?.is_suspended) {
             throw new Error('Governance: Organization Suspended.');
        }

        const isShadowMode = controls?.shadow_mode || false;

        // CIRCUIT BREAKER CHECK
        const breaker = new CircuitBreakerService(supabase);
        const { allowed, reason } = await breaker.checkLimit(organization_id, 0.10);

        if (!allowed) {
            throw new Error(`Circuit Breaker: ${reason}`);
        }

        // B. Fetch Contact Data (Securely)
        const { data: contact } = await supabase
            .from('contacts')
            .select('phone_e164, name')
            .eq('id', contact_id)
            .single();

        if (!contact || !contact.phone_e164) {
             throw new Error('Invalid Contact Data');
        }

        // C. Fetch Campaign Config
        const { data: campaign } = await supabase
            .from('campaigns')
            .select('script_config, type')
            .eq('id', campaign_id)
            .single();

        // D. Create Outbound Call Record
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

        // E. Dispatch to Telephony Provider
        const providerCallId = await dispatchCall(
            contact.phone_e164,
            campaign?.script_config,
            trinityCallId,
            campaign?.type,
            contact.name,
            isShadowMode
        );

        // F. Update Item State (Success)
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
        const isTerminalInfo = err.message.includes('Insufficient Funds') || err.message.includes('Invalid Contact');

        await supabase
            .from('campaign_items')
            .update({
                status: isTerminalInfo ? 'failed' : 'pending',
                last_error: err.message?.substring(0, 255),
                attempt_count: nextAttempt,
                reserved_at: null,
                reserved_by: null,
                next_try_at: new Date(Date.now() + (isTerminalInfo ? 1000 * 60 * 60 * 24 : 1000 * 60 * 5)).toISOString()
            })
            .eq('id', itemId);

        throw err;
    }
}

async function dispatchCall(to: string, config: any, trinityId: string, type: string, name: string, isShadowMode: boolean = false) {
    const providerType = isShadowMode ? 'shadow' : 'vapi';
    const provider = ProviderFactory.getProvider(providerType);

    const payload = {
        to,
        trinityCallId: trinityId,
        campaignType: type,
        customerName: name,
        assistantId: config?.assistantId,
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
