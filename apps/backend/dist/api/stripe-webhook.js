"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = void 0;
const stripe_service_1 = require("../services/stripe-service");
const handleStripeWebhook = async (req, res) => {
    try {
        const stripeService = new stripe_service_1.StripeService();
        await stripeService.handleWebhook(req, res);
    }
    catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(400).json({ error: 'Webhook processing failed' });
    }
};
exports.handleStripeWebhook = handleStripeWebhook;
