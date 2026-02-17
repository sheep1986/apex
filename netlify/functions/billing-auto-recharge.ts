import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Types ────────────────────────────────────────────────────────────────────
interface AutoRechargeConfig {
  organization_id: string;
  enabled: boolean;
  threshold_usd: number;
  recharge_amount_usd: number;
  max_monthly_recharges: number;
  recharges_this_month: number;
  month_reset_at: string;
  stripe_payment_method_id: string | null;
}

interface Organization {
  id: string;
  credit_balance: number;
  stripe_customer_id: string | null;
}

// ── Auto-Recharge Check ─────────────────────────────────────────────────────
async function processAutoRecharges(): Promise<{ processed: number; errors: string[] }> {
  const errors: string[] = [];
  let processed = 0;

  // Reset monthly counters where needed
  const now = new Date();
  await supabase
    .from('auto_recharge_config')
    .update({ recharges_this_month: 0, month_reset_at: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString() })
    .lt('month_reset_at', now.toISOString())
    .eq('enabled', true);

  // Find orgs that need recharging:
  // enabled = true, have a payment method, under threshold, under monthly cap
  const { data: configs, error: configError } = await supabase
    .from('auto_recharge_config')
    .select('*')
    .eq('enabled', true)
    .not('stripe_payment_method_id', 'is', null);

  if (configError || !configs) {
    return { processed: 0, errors: [configError?.message || 'Failed to fetch configs'] };
  }

  for (const config of configs as AutoRechargeConfig[]) {
    try {
      // Check monthly cap
      if (config.recharges_this_month >= config.max_monthly_recharges) {
        continue;
      }

      // Get org's current balance
      const { data: org } = await supabase
        .from('organizations')
        .select('id, credit_balance, stripe_customer_id')
        .eq('id', config.organization_id)
        .single();

      if (!org) continue;
      const orgData = org as Organization;

      // Check if balance is below threshold
      if (orgData.credit_balance >= config.threshold_usd) {
        continue;
      }

      // Need Stripe customer ID
      if (!orgData.stripe_customer_id) {
        errors.push(`Org ${config.organization_id}: No Stripe customer ID`);
        continue;
      }

      // Create off-session payment
      const amountCents = Math.round(config.recharge_amount_usd * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        customer: orgData.stripe_customer_id,
        payment_method: config.stripe_payment_method_id!,
        off_session: true,
        confirm: true,
        description: `Auto-recharge: $${config.recharge_amount_usd} (balance was $${orgData.credit_balance.toFixed(2)})`,
        metadata: {
          organizationId: config.organization_id,
          type: 'auto_recharge',
          trigger: 'balance_below_threshold',
          threshold: config.threshold_usd.toString(),
        },
      });

      if (paymentIntent.status === 'succeeded') {
        // Credit the balance via RPC
        const { error: ledgerError } = await supabase.rpc('apply_ledger_entry', {
          p_organization_id: config.organization_id,
          p_amount: config.recharge_amount_usd,
          p_type: 'credit',
          p_description: `Auto-recharge: $${config.recharge_amount_usd} (triggered at $${orgData.credit_balance.toFixed(2)})`,
          p_reference_id: paymentIntent.id,
          p_metadata: {
            type: 'auto_recharge',
            payment_intent: paymentIntent.id,
            previous_balance: orgData.credit_balance,
            threshold: config.threshold_usd,
          },
        });

        if (ledgerError) {
          errors.push(`Org ${config.organization_id}: Ledger error - ${ledgerError.message}`);
          continue;
        }

        // Update auto-recharge config
        await supabase
          .from('auto_recharge_config')
          .update({
            recharges_this_month: config.recharges_this_month + 1,
            last_recharge_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', config.organization_id);

        // Insert a server-side notification (if table exists)
        await supabase.from('notifications_server').insert({
          organization_id: config.organization_id,
          type: 'billing_alert',
          title: 'Auto-Recharge Successful',
          message: `$${config.recharge_amount_usd} has been added to your balance. Previous balance: $${orgData.credit_balance.toFixed(2)}`,
          severity: 'medium',
          category: 'billing',
          metadata: { amount: config.recharge_amount_usd, previous_balance: orgData.credit_balance },
        }).then(() => {}).catch(() => {}); // Non-critical, don't fail on this

        // Resume any credit-gated campaigns
        const { data: pausedCampaigns } = await supabase
          .from('campaigns')
          .select('id, name')
          .eq('organization_id', config.organization_id)
          .eq('status', 'paused')
          .eq('paused_reason', 'insufficient_credits');

        if (pausedCampaigns && pausedCampaigns.length > 0) {
          await supabase
            .from('campaigns')
            .update({ status: 'running', paused_reason: null, updated_at: new Date().toISOString() })
            .eq('organization_id', config.organization_id)
            .eq('status', 'paused')
            .eq('paused_reason', 'insufficient_credits');

          for (const camp of pausedCampaigns) {
            await supabase.from('notifications_server').insert({
              organization_id: config.organization_id,
              type: 'campaign_alert',
              title: 'Campaign Resumed',
              message: `"${camp.name}" has been automatically resumed after credits were restored.`,
              severity: 'medium',
              category: 'campaigns',
              metadata: { campaign_id: camp.id, reason: 'auto_recharge_restored_credits' },
            }).catch(() => {});
          }
          console.log(`[CreditGate] Resumed ${pausedCampaigns.length} campaign(s) for org ${config.organization_id}`);
        }

        processed++;
        console.log(`Auto-recharged org ${config.organization_id}: $${config.recharge_amount_usd}`);
      } else {
        errors.push(`Org ${config.organization_id}: Payment status ${paymentIntent.status}`);
      }
    } catch (err: any) {
      // Handle card declined or authentication required
      if (err.code === 'authentication_required') {
        errors.push(`Org ${config.organization_id}: Card requires authentication — disabling auto-recharge`);
        await supabase
          .from('auto_recharge_config')
          .update({ enabled: false, updated_at: new Date().toISOString() })
          .eq('organization_id', config.organization_id);
      } else {
        errors.push(`Org ${config.organization_id}: ${err.message}`);
      }
    }
  }

  return { processed, errors };
}

// ── Config CRUD (for frontend) ──────────────────────────────────────────────
async function handleConfigRequest(event: HandlerEvent) {
  const authHeader = event.headers.authorization;
  if (!authHeader) return { statusCode: 401, body: 'Unauthorized' };

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return { statusCode: 401, body: 'Unauthorized' };

  // Get user's org
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return { statusCode: 403, body: 'No organization' };
  const orgId = profile.organization_id;

  if (event.httpMethod === 'GET') {
    const { data: config } = await supabase
      .from('auto_recharge_config')
      .select('*')
      .eq('organization_id', orgId)
      .single();

    return {
      statusCode: 200,
      body: JSON.stringify(config || {
        organization_id: orgId,
        enabled: false,
        threshold_usd: 10,
        recharge_amount_usd: 50,
        max_monthly_recharges: 5,
        recharges_this_month: 0,
        stripe_payment_method_id: null,
        last_recharge_at: null,
      }),
    };
  }

  if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
    const body = JSON.parse(event.body || '{}');

    const configData = {
      organization_id: orgId,
      enabled: body.enabled ?? false,
      threshold_usd: Math.max(2, Math.min(100, body.threshold_usd ?? 10)),
      recharge_amount_usd: Math.max(10, Math.min(500, body.recharge_amount_usd ?? 50)),
      max_monthly_recharges: Math.max(1, Math.min(20, body.max_monthly_recharges ?? 5)),
      stripe_payment_method_id: body.stripe_payment_method_id || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('auto_recharge_config')
      .upsert(configData, { onConflict: 'organization_id' })
      .select()
      .single();

    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify(data) };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
}

// ── Handler ─────────────────────────────────────────────────────────────────
export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Scheduled invocation (cron) — process all auto-recharges
  if (event.httpMethod === 'GET' && !event.headers.authorization) {
    const result = await processAutoRecharges();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  }

  // Frontend config management
  const response = await handleConfigRequest(event);
  return { ...response, headers };
};
