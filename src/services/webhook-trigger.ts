/**
 * Webhook Trigger Utility
 *
 * Lightweight fire-and-forget helper for dispatching webhook events
 * from the frontend after CRM operations (contact.created, deal.stage_changed, etc.).
 *
 * Calls the webhook-dispatch Netlify Function which handles:
 * - Fan-out to all active endpoints subscribed to the event type
 * - HMAC signing with customer secrets
 * - Delivery tracking and retry logic
 */

export async function triggerWebhook(
  organizationId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    await fetch('/.netlify/functions/webhook-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, eventType, payload }),
    });
  } catch {
    // Non-critical: webhook dispatch failure should never block user actions
  }
}
