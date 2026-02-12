import { SupabaseClient } from '@supabase/supabase-js';

// Service to enforce rolling spend limits
export class CircuitBreakerService {
    private supabase: SupabaseClient;

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Checks if an organization can afford an estimated cost within their daily limit.
     * @param orgId Organization UUID
     * @param estimatedCostUSD Estimated cost of the operation (e.g. 0.10 for init)
     * @returns { allowed: boolean, reason?: string }
     */
    async checkLimit(orgId: string, estimatedCostUSD: number = 0.05): Promise<{ allowed: boolean, reason?: string }> {
        try {
            // 1. Get Controls (Limit)
            const { data: controls, error: ctrlError } = await this.supabase
                .from('organization_controls')
                .select('daily_spend_limit_usd, alert_threshold_percent')
                .eq('organization_id', orgId)
                .single();

            if (ctrlError) {
                // If no controls set, assume default safe limit or allow?
                // Fail-safe: Allow if no specific row found (assuming standard org), 
                // but if DB error, maybe fail open or closed?
                // Policy: Fail Open for missing controls row (default limits apply elsewhere), 
                // but Fail Closed for DB Connection errors.
                if (ctrlError.code === 'PGRST116') return { allowed: true }; // No row found
                console.error('CheckLimit DB Error', ctrlError);
                return { allowed: false, reason: 'System Error' }; 
            }

            const limit = controls.daily_spend_limit_usd || 100.00; // Default $100
            
            // 2. Get Current Spend (Rolling 24h)
            // Using the RPC created in Migration 0007
            const { data: currentSpend, error: rpcError } = await this.supabase
                .rpc('get_daily_spend', { p_organization_id: orgId });

            if (rpcError) {
                console.error('CheckSpend RPC Error', rpcError);
                return { allowed: false, reason: 'System Error' };
            }

            const total = (currentSpend || 0) + estimatedCostUSD;

            if (total > limit) {
                return { 
                    allowed: false, 
                    reason: `Daily Limit Exceeded: $${total.toFixed(2)} / $${limit}` 
                };
            }

            // 3. Alerting (Placeholder)
            // If total > limit * 0.8, should fire alert (async)

            return { allowed: true };

        } catch (err: any) {
            console.error('CircuitBreaker Exception', err);
            return { allowed: false, reason: 'Internal Error' };
        }
    }
}
