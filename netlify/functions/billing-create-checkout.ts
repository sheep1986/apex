import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount, organizationId, successUrl, cancelUrl } = JSON.parse(event.body || '{}');

    if (!amount || !organizationId) {
      return { statusCode: 400, body: 'Missing required parameters' };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Voice Credits', // Zero-Trace: Removed "Trinity" to be generic or keep consistent? User said remove provider names. "Trinity" is our brand. User said "Remove provider names (Stripe)". "Trinity" is fine.
              description: 'Prepaid credits for voice calls',
            },
            unit_amount: amount * 100, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
        type: 'credit_topup',
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('Checkout Session Error:', error); // Zero-Trace
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create checkout session' }),
    };
  }
};
