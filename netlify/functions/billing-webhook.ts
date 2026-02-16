import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Credit-based plan limits — mirrors src/config/plans.ts (AI Employee model)
// Plan IDs: 'employee_1', 'employee_3', 'employee_5', 'enterprise'
// Legacy IDs 'starter', 'growth', 'business' mapped for backward compat
const PLAN_LIMITS: Record<string, {
  includedCredits: number;
  includedMinutes: number;  // Legacy: approximate standard-tier minutes
  aiEmployees: number;
  maxPhoneNumbers: number;
  maxAssistants: number;
  maxConcurrentCalls: number;
  maxUsers: number;
  overageCreditPrice: number;  // £ per credit
  overagePerMinute: number;    // Legacy: approximate for display
}> = {
  employee_1: {
    includedCredits: 200_000,
    includedMinutes: 6_667,
    aiEmployees: 1,
    maxPhoneNumbers: 3,
    maxAssistants: 5,
    maxConcurrentCalls: 5,
    maxUsers: 5,
    overageCreditPrice: 0.012,
    overagePerMinute: 0.36,  // 30 cr/min × £0.012
  },
  employee_3: {
    includedCredits: 650_000,
    includedMinutes: 21_667,
    aiEmployees: 3,
    maxPhoneNumbers: 8,
    maxAssistants: 15,
    maxConcurrentCalls: 15,
    maxUsers: 15,
    overageCreditPrice: 0.011,
    overagePerMinute: 0.33,
  },
  employee_5: {
    includedCredits: 1_100_000,
    includedMinutes: 36_667,
    aiEmployees: 5,
    maxPhoneNumbers: 15,
    maxAssistants: 30,
    maxConcurrentCalls: 25,
    maxUsers: 50,
    overageCreditPrice: 0.010,
    overagePerMinute: 0.30,
  },
  // Legacy aliases
  starter: {
    includedCredits: 200_000,
    includedMinutes: 6_667,
    aiEmployees: 1,
    maxPhoneNumbers: 3,
    maxAssistants: 5,
    maxConcurrentCalls: 5,
    maxUsers: 5,
    overageCreditPrice: 0.012,
    overagePerMinute: 0.36,
  },
  growth: {
    includedCredits: 650_000,
    includedMinutes: 21_667,
    aiEmployees: 3,
    maxPhoneNumbers: 8,
    maxAssistants: 15,
    maxConcurrentCalls: 15,
    maxUsers: 15,
    overageCreditPrice: 0.011,
    overagePerMinute: 0.33,
  },
  business: {
    includedCredits: 1_100_000,
    includedMinutes: 36_667,
    aiEmployees: 5,
    maxPhoneNumbers: 15,
    maxAssistants: 30,
    maxConcurrentCalls: 25,
    maxUsers: 50,
    overageCreditPrice: 0.010,
    overagePerMinute: 0.30,
  },
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return { statusCode: 400, body: 'Missing signature or secret' };
  }

  let stripeEvent: Stripe.Event;

  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body || '';

    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return { statusCode: 400, body: 'Signature Error' };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(stripeEvent.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled Stripe event: ${stripeEvent.type}`);
    }
  } catch (error: any) {
    console.error(`Error handling ${stripeEvent.type}:`, error);
    // Return 200 to prevent Stripe retries for processing errors
    // The error is logged and can be investigated
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

// ── checkout.session.completed ──────────────────────────────────────────────
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId;
  const type = session.metadata?.type;

  if (!organizationId) {
    console.warn('Checkout completed but no organizationId in metadata');
    return;
  }

  // ── Subscription checkout ──
  if (type === 'subscription' && session.subscription) {
    const planId = session.metadata?.planId || 'starter';
    const limits = PLAN_LIMITS[planId] || PLAN_LIMITS.starter;
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id;

    // Fetch subscription details for period dates
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const { error } = await supabase
      .from('organizations')
      .update({
        plan: planId,
        plan_tier_id: planId,
        subscription_status: 'active',
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        // Credit-based fields
        included_credits: limits.includedCredits,
        overage_credit_price: limits.overageCreditPrice,
        ai_employees: limits.aiEmployees,
        // Legacy fields (backward compat)
        included_minutes: limits.includedMinutes,
        max_phone_numbers: limits.maxPhoneNumbers,
        max_assistants: limits.maxAssistants,
        max_concurrent_calls: limits.maxConcurrentCalls,
        max_users: limits.maxUsers,
        overage_rate_per_minute: limits.overagePerMinute,
      })
      .eq('id', organizationId);

    if (error) {
      console.error('Failed to activate subscription:', error);
      throw error;
    }

    // Initialize usage tracking for first period (credit + legacy)
    await supabase.from('subscription_usage').upsert({
      organization_id: organizationId,
      period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      minutes_used: 0,
      calls_count: 0,
      credits_used: 0,
      credits_included: limits.includedCredits,
      overage_credits_used: 0,
    }, { onConflict: 'organization_id,period_start' });

    console.log(`Subscription activated for org ${organizationId}: ${planId}`);
    return;
  }

  // ── Credit top-up checkout ──
  if (type === 'credit_topup') {
    const amount = (session.amount_total || 0) / 100;

    if (amount > 0) {
      const { data, error } = await supabase.rpc('apply_ledger_entry', {
        p_organization_id: organizationId,
        p_amount: amount,
        p_type: 'credit',
        p_description: `Top-up: ${session.payment_intent}`,
        p_reference_id: session.id,
        p_metadata: { payment_intent: session.payment_intent },
      });

      if (error) {
        console.error('Ledger Update Error:', error);
        throw error;
      }
      console.log(`Credit top-up for org ${organizationId}: $${amount}`, data);
    }
  }
}

// ── invoice.paid ────────────────────────────────────────────────────────────
// Fires on each successful subscription renewal
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id;

  if (!subscriptionId) return;

  // Look up org by subscription ID
  const { data: org } = await supabase
    .from('organizations')
    .select('id, plan')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!org) {
    console.warn(`No org found for subscription ${subscriptionId}`);
    return;
  }

  // Fetch subscription for new period dates
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodStart = new Date(subscription.current_period_start * 1000).toISOString();
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

  // Update org period dates
  await supabase
    .from('organizations')
    .update({
      subscription_status: 'active',
      subscription_period_start: periodStart,
      subscription_period_end: periodEnd,
    })
    .eq('id', org.id);

  // Mark previous period overage as billed
  await supabase
    .from('subscription_usage')
    .update({ overage_billed: true })
    .eq('organization_id', org.id)
    .lt('period_end', periodStart);

  // Get plan limits for credit reset
  const planLimits = PLAN_LIMITS[org.plan] || PLAN_LIMITS.employee_1;

  // Initialize new period usage (credits + legacy)
  await supabase.from('subscription_usage').upsert({
    organization_id: org.id,
    period_start: periodStart,
    period_end: periodEnd,
    minutes_used: 0,
    overage_minutes: 0,
    calls_count: 0,
    credits_used: 0,
    credits_included: planLimits.includedCredits,
    overage_credits_used: 0,
  }, { onConflict: 'organization_id,period_start' });

  // Reset period credit counter on org
  await supabase
    .from('organizations')
    .update({ credits_used_this_period: 0 })
    .eq('id', org.id);

  // Record subscription payment in ledger for audit trail
  const amount = (invoice.amount_paid || 0) / 100;
  if (amount > 0) {
    await supabase.rpc('apply_ledger_entry', {
      p_organization_id: org.id,
      p_amount: 0, // Subscription payments don't affect credit_balance
      p_type: 'subscription_renewal',
      p_description: `${org.plan} plan renewal - $${amount}`,
      p_reference_id: invoice.id,
      p_metadata: {
        plan: org.plan,
        amount_paid: amount,
        period_start: periodStart,
        period_end: periodEnd,
      },
    });
  }

  console.log(`Invoice paid for org ${org.id}: $${amount}, new period ${periodStart} to ${periodEnd}`);
}

// ── customer.subscription.updated ───────────────────────────────────────────
// Handles plan upgrades/downgrades
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId;

  // Try metadata first, then look up by subscription ID
  let orgId = organizationId;
  if (!orgId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    orgId = org?.id;
  }

  if (!orgId) {
    console.warn(`No org found for subscription update ${subscription.id}`);
    return;
  }

  const planId = subscription.metadata?.planId;
  const limits = planId ? PLAN_LIMITS[planId] : null;

  const updateData: Record<string, any> = {
    subscription_status: subscription.status === 'active' ? 'active'
      : subscription.status === 'trialing' ? 'trialing'
      : subscription.status === 'past_due' ? 'past_due'
      : subscription.status,
    subscription_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  };

  // If plan changed, update limits (credit-based + legacy)
  if (planId && limits) {
    updateData.plan = planId;
    updateData.plan_tier_id = planId;
    updateData.included_credits = limits.includedCredits;
    updateData.overage_credit_price = limits.overageCreditPrice;
    updateData.ai_employees = limits.aiEmployees;
    // Legacy fields
    updateData.included_minutes = limits.includedMinutes;
    updateData.max_phone_numbers = limits.maxPhoneNumbers;
    updateData.max_assistants = limits.maxAssistants;
    updateData.max_concurrent_calls = limits.maxConcurrentCalls;
    updateData.max_users = limits.maxUsers;
    updateData.overage_rate_per_minute = limits.overagePerMinute;
  }

  await supabase
    .from('organizations')
    .update(updateData)
    .eq('id', orgId);

  console.log(`Subscription updated for org ${orgId}: status=${subscription.status}, plan=${planId || 'unchanged'}`);
}

// ── customer.subscription.deleted ───────────────────────────────────────────
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  let orgId = subscription.metadata?.organizationId;

  if (!orgId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    orgId = org?.id;
  }

  if (!orgId) return;

  await supabase
    .from('organizations')
    .update({
      subscription_status: 'canceled',
      // Don't null out the plan — keep it for reference
      // Features will be blocked by check_call_allowed RPC checking subscription_status
    })
    .eq('id', orgId);

  console.log(`Subscription canceled for org ${orgId}`);
}

// ── invoice.payment_failed ──────────────────────────────────────────────────
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id;

  if (!subscriptionId) return;

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (!org) return;

  await supabase
    .from('organizations')
    .update({ subscription_status: 'past_due' })
    .eq('id', org.id);

  console.log(`Payment failed for org ${org.id}, marked as past_due`);
}
