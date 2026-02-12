import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Plan → Stripe price ID mapping from environment
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
    // Auth check
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const { mode, organizationId, successUrl, cancelUrl } = body;

    if (!organizationId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing organizationId' }) };
    }

    // ── Mode: Subscription ──────────────────────────────────────────────
    if (mode === 'subscription') {
      const { planId } = body;

      if (!planId || !PLAN_PRICES[planId]) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid plan' }) };
      }

      const priceId = PLAN_PRICES[planId];
      if (!priceId) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Stripe price not configured for this plan' }) };
      }

      // Check if org already has a Stripe customer
      const { data: org } = await supabase
        .from('organizations')
        .select('stripe_customer_id, name')
        .eq('id', organizationId)
        .single();

      let customerId = org?.stripe_customer_id;

      // Create Stripe customer if needed
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: org?.name || undefined,
          metadata: { organizationId, userId: user.id },
        });
        customerId = customer.id;

        // Save customer ID to org
        await supabase
          .from('organizations')
          .update({ stripe_customer_id: customerId })
          .eq('id', organizationId);
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl || `${process.env.URL || 'https://trinitylabs.netlify.app'}/onboarding?subscription_success=true`,
        cancel_url: cancelUrl || `${process.env.URL || 'https://trinitylabs.netlify.app'}/onboarding?subscription_cancelled=true`,
        subscription_data: {
          metadata: {
            organizationId,
            planId,
            type: 'subscription',
          },
        },
        metadata: {
          organizationId,
          planId,
          type: 'subscription',
        },
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ sessionId: session.id, url: session.url }),
      };
    }

    // ── Mode: Credit Top-Up (one-time payment) ─────────────────────────
    const { amount } = body;

    if (!amount || amount < 5) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Minimum top-up is $5' }) };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Overage Credits',
              description: 'Credits for usage beyond your plan\'s included minutes',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.URL || 'https://trinitylabs.netlify.app'}/billing?success=true`,
      cancel_url: cancelUrl || `${process.env.URL || 'https://trinitylabs.netlify.app'}/billing?cancelled=true`,
      metadata: {
        organizationId,
        type: 'credit_topup',
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error: any) {
    console.error('Checkout Session Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create checkout session' }),
    };
  }
};
