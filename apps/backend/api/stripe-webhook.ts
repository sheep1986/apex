import { Request, Response } from 'express';
import { StripeService } from '../services/stripe-service';

/**
 * Stripe webhook handler for payment processing
 */
export const handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const stripeService = new StripeService();
    await stripeService.handleWebhook(req, res);
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
};