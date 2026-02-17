import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { corsHeaders } from './utils/cors';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const DELIVERY_TIMEOUT_MS = 10_000; // 10-second timeout per delivery

/**
 * Webhook Dispatch Worker
 *
 * Called internally by other functions (voice-webhook, campaign-manager, etc.)
 * when an event occurs. Fans out to all active webhook endpoints for the org.
 *
 * Can also be called as a scheduled function to retry failed deliveries.
 *
 * POST body: { organizationId, eventType, payload }
 * OR no body (scheduled mode — retries failed deliveries)
 */
export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders(),
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Authentication: require either an internal secret header or a valid Supabase JWT
    const internalSecret = process.env.WEBHOOK_DISPATCH_SECRET || process.env.INTERNAL_API_SECRET;
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const internalHeader = event.headers['x-internal-secret'];

    const isInternalCall = internalSecret && internalHeader === internalSecret;
    const isScheduledCall = event.headers?.['x-netlify-event'] === 'schedule';

    if (!isInternalCall && !isScheduledCall) {
      // Require valid Supabase auth for non-internal calls
      if (!authHeader?.startsWith('Bearer ')) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
      const token = authHeader.split(' ')[1];
      const { error: authError } = await supabase.auth.getUser(token);
      if (authError) {
        return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { organizationId, eventType, payload, endpointId } = body;

    if (organizationId && eventType && payload) {
      // === Direct dispatch mode: fan out to matching endpoints ===
      await dispatchEvent(organizationId, eventType, payload, endpointId);
    } else {
      // === Retry mode: pick up failed deliveries from last 24h ===
      await retryFailedDeliveries();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error: any) {
    console.error('Webhook dispatch error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

/**
 * Dispatch an event to active endpoints subscribed to this event type.
 *
 * If endpointId is provided, delivers ONLY to that specific endpoint
 * (used by test.ping to target a single endpoint regardless of event_types).
 */
async function dispatchEvent(organizationId: string, eventType: string, payload: any, endpointId?: string) {
  // Find all active endpoints for this org
  const { data: endpoints } = await supabase
    .from('webhook_endpoints')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (!endpoints || endpoints.length === 0) return;

  let matching: any[];

  if (endpointId) {
    // Target a specific endpoint (e.g., test.ping targets one endpoint)
    matching = endpoints.filter(ep => ep.id === endpointId);
  } else {
    // Filter endpoints that listen for this event type
    matching = endpoints.filter(ep =>
      ep.event_types && ep.event_types.includes(eventType)
    );
  }

  if (matching.length === 0) return;

  // Deliver to each endpoint concurrently
  const deliveryPromises = matching.map(ep => deliverToEndpoint(ep, eventType, payload));
  await Promise.allSettled(deliveryPromises);
}

/**
 * Deliver a single webhook payload to an endpoint.
 */
async function deliverToEndpoint(
  endpoint: any,
  eventType: string,
  payload: any,
  retryAttempt = 0
) {
  const deliveryPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: payload,
  };

  const bodyStr = JSON.stringify(deliveryPayload);

  // Generate HMAC signature using the endpoint's secret
  const signature = endpoint.secret
    ? crypto.createHmac('sha256', endpoint.secret).update(bodyStr).digest('hex')
    : '';

  let statusCode = 0;
  let responseBody = '';
  let success = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Event': eventType,
        'X-Webhook-Delivery': crypto.randomUUID(),
        'User-Agent': 'TrinityAI-Webhooks/1.0',
      },
      body: bodyStr,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    statusCode = response.status;

    // Read response body (truncate to 1KB)
    try {
      const text = await response.text();
      responseBody = text.slice(0, 1024);
    } catch {
      responseBody = '';
    }

    success = statusCode >= 200 && statusCode < 300;
  } catch (err: any) {
    statusCode = 0;
    responseBody = err.message || 'Connection failed';
    success = false;
  }

  // Record delivery attempt
  await supabase.from('webhook_deliveries').insert({
    webhook_endpoint_id: endpoint.id,
    organization_id: endpoint.organization_id,
    event_type: eventType,
    payload: deliveryPayload,
    status_code: statusCode,
    response_body: responseBody,
    success,
    attempted_at: new Date().toISOString(),
  });

  // Update endpoint's last_triggered_at
  await supabase
    .from('webhook_endpoints')
    .update({ last_triggered_at: new Date().toISOString() })
    .eq('id', endpoint.id);

  return { success, statusCode };
}

/**
 * Retry failed deliveries from the last 24 hours (max 50 per run).
 */
async function retryFailedDeliveries() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Find failed deliveries that haven't been retried more than 3 times
  const { data: failedDeliveries } = await supabase
    .from('webhook_deliveries')
    .select('*, webhook_endpoints(*)')
    .eq('success', false)
    .gte('attempted_at', twentyFourHoursAgo)
    .order('attempted_at', { ascending: true })
    .limit(50);

  if (!failedDeliveries || failedDeliveries.length === 0) return;

  // Group by endpoint+event to count retries
  const retryMap = new Map<string, number>();
  for (const d of failedDeliveries) {
    const key = `${d.webhook_endpoint_id}:${d.event_type}`;
    retryMap.set(key, (retryMap.get(key) || 0) + 1);
  }

  // Only retry deliveries that haven't exceeded 3 attempts
  const toRetry = failedDeliveries.filter(d => {
    const key = `${d.webhook_endpoint_id}:${d.event_type}`;
    return (retryMap.get(key) || 0) <= 3;
  });

  // Deduplicate — only retry the latest failure per endpoint+event
  const seen = new Set<string>();
  const deduped = toRetry.filter(d => {
    const key = `${d.webhook_endpoint_id}:${d.event_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const delivery of deduped) {
    if (delivery.webhook_endpoints?.is_active) {
      await deliverToEndpoint(
        delivery.webhook_endpoints,
        delivery.event_type,
        delivery.payload?.data || delivery.payload,
        (retryMap.get(`${delivery.webhook_endpoint_id}:${delivery.event_type}`) || 0)
      );
    }
  }
}

/**
 * Helper: Call this from other functions to dispatch a webhook event.
 * Can be called directly via fetch() from other Netlify functions:
 *
 * await fetch(`${process.env.URL}/.netlify/functions/webhook-dispatch`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ organizationId, eventType: 'call.completed', payload: callData }),
 * });
 */
