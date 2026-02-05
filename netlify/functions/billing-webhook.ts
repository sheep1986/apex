import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const handler: Handler = async (event, context) => {
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
    // 1. Handle Base64 (Netlify) & Raw Body for Verification
    const rawBody = event.isBase64Encoded 
      ? Buffer.from(event.body || '', 'base64').toString('utf8') 
      : event.body || '';

    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Signature Error: ${err.message}`);
    return { statusCode: 400, body: `Signature Error` };
  }

  // Handle the event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const organizationId = session.metadata?.organizationId;
    const type = session.metadata?.type;
    const amount = (session.amount_total || 0) / 100; 

    if (organizationId && type === 'credit_topup' && amount > 0) {
      try {
        console.log(`Processing top-up for org ${organizationId}: $${amount}`);
        
        // 2. Standardized RPC & Idempotency (p_reference_id)
        const { data, error } = await supabase.rpc('apply_ledger_entry', {
          p_organization_id: organizationId,
          p_amount: amount,
          p_type: 'credit',
          p_description: `Top-up: ${session.payment_intent}`, 
          p_reference_id: session.id, // Idempotency Key
          p_metadata: { payment_intent: session.payment_intent }
        });

        if (error) {
          console.error('Ledger Update Error:', error);
          throw error;
        }

        console.log('Ledger updated successfully:', data);
      } catch (error) {
        console.error('Failed to update ledger:', error);
        return { statusCode: 500, body: 'Failed to update ledger' };
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
