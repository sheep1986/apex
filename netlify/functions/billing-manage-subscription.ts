import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PLAN_PRICES: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  growth: process.env.STRIPE_PRICE_GROWTH || '',
  business: process.env.STRIPE_PRICE_BUSINESS || '',
};

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // Auth
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // Get org
    let organizationId: string | null = null;
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (member) {
      organizationId = member.organization_id;
      // Only owners and admins can change plans
      if (!['owner', 'admin', 'org_owner'].includes(member.role)) {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Only admins can manage subscriptions' }) };
      }
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      organizationId = profile?.organization_id || null;
    }

    if (!organizationId) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'No organization' }) };
    }

    const { action, newPlanId } = JSON.parse(event.body || '{}');

    // Get current org subscription info
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_subscription_id, plan')
      .eq('id', organizationId)
      .single();

    if (!org?.stripe_subscription_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No active subscription' }) };
    }

    // ── Change plan ──
    if (action === 'change_plan' && newPlanId) {
      const newPriceId = PLAN_PRICES[newPlanId];
      if (!newPriceId) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid plan' }) };
      }

      if (newPlanId === org.plan) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Already on this plan' }) };
      }

      // Get current subscription to find the subscription item
      const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
      const subscriptionItemId = subscription.items.data[0]?.id;

      if (!subscriptionItemId) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Subscription item not found' }) };
      }

      // Update subscription — Stripe handles proration automatically
      const updated = await stripe.subscriptions.update(org.stripe_subscription_id, {
        items: [{ id: subscriptionItemId, price: newPriceId }],
        metadata: { organizationId, planId: newPlanId, type: 'subscription' },
        proration_behavior: 'create_prorations',
      });

      console.log(`Plan changed for org ${organizationId}: ${org.plan} → ${newPlanId}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          previousPlan: org.plan,
          newPlan: newPlanId,
          effectiveDate: new Date().toISOString(),
        }),
      };
    }

    // ── Cancel subscription ──
    if (action === 'cancel') {
      // Cancel at end of period, not immediately
      await stripe.subscriptions.update(org.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      console.log(`Subscription scheduled for cancellation: org ${organizationId}`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Subscription will cancel at end of billing period',
        }),
      };
    }

    // ── Reactivate cancelled subscription ──
    if (action === 'reactivate') {
      await stripe.subscriptions.update(org.stripe_subscription_id, {
        cancel_at_period_end: false,
      });

      await supabase
        .from('organizations')
        .update({ subscription_status: 'active' })
        .eq('id', organizationId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Subscription reactivated' }),
      };
    }

    // ── Get billing portal ──
    if (action === 'portal') {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('stripe_customer_id')
        .eq('id', organizationId)
        .single();

      if (!orgData?.stripe_customer_id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'No billing account' }) };
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: orgData.stripe_customer_id,
        return_url: `${process.env.URL || 'https://trinitylabs.netlify.app'}/billing`,
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ url: portalSession.url }),
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action' }) };
  } catch (error: any) {
    console.error('Subscription management error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to manage subscription' }),
    };
  }
};
