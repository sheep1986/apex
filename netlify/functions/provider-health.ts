import { Handler, schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiPrivateKey = process.env.VAPI_PRIVATE_API_KEY;
const vapiBaseUrl = process.env.VAPI_BASE_URL || "https://api.vapi.ai";

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

/**
 * Provider Health Check
 *
 * Runs every 5 minutes. Pings the voice provider (Vapi) API
 * to determine health status.
 *
 * States:
 *  - healthy: response < 5s, success
 *  - degraded: response >= 5s but success
 *  - down: 3+ consecutive failures
 *
 * On transition from 'down' → 'healthy':
 *  - Resumes all campaigns paused with paused_reason='provider_outage'
 *  - Creates notification for affected orgs
 */

interface HealthCheckResult {
  status: "healthy" | "degraded" | "down";
  responseTimeMs: number;
  errorMessage: string | null;
}

async function checkVapiHealth(): Promise<HealthCheckResult> {
  if (!vapiPrivateKey) {
    return {
      status: "down",
      responseTimeMs: 0,
      errorMessage: "VAPI_PRIVATE_API_KEY not configured",
    };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${vapiBaseUrl}/assistant?limit=1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${vapiPrivateKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const elapsed = Date.now() - start;

    if (!response.ok) {
      return {
        status: "down",
        responseTimeMs: elapsed,
        errorMessage: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // Check response time
    if (elapsed >= 5000) {
      return {
        status: "degraded",
        responseTimeMs: elapsed,
        errorMessage: `Slow response: ${elapsed}ms`,
      };
    }

    return {
      status: "healthy",
      responseTimeMs: elapsed,
      errorMessage: null,
    };
  } catch (error: any) {
    const elapsed = Date.now() - start;
    return {
      status: "down",
      responseTimeMs: elapsed,
      errorMessage: error.name === "AbortError" ? "Request timeout (10s)" : error.message,
    };
  }
}

async function runHealthCheck() {
  console.log("[provider-health] Starting health check...");

  const result = await checkVapiHealth();
  console.log(`[provider-health] Result: ${result.status} (${result.responseTimeMs}ms)`);

  // Get previous status for transition detection
  const { data: lastCheck } = await supabase
    .from("provider_health")
    .select("status, consecutive_failures")
    .eq("provider", "vapi")
    .order("checked_at", { ascending: false })
    .limit(1)
    .single();

  const previousStatus = lastCheck?.status || "healthy";
  const previousFailures = lastCheck?.consecutive_failures || 0;

  // Calculate consecutive failures
  let consecutiveFailures = 0;
  if (result.status === "down") {
    consecutiveFailures = previousFailures + 1;
  }

  // Determine final status: need 3+ consecutive failures for 'down'
  const finalStatus =
    result.status === "down" && consecutiveFailures < 3
      ? "degraded" // Not enough consecutive failures yet
      : result.status;

  // Store health check record
  await supabase
    .from("provider_health")
    .insert({
      provider: "vapi",
      status: finalStatus,
      response_time_ms: result.responseTimeMs,
      error_message: result.errorMessage,
      consecutive_failures: consecutiveFailures,
      checked_at: new Date().toISOString(),
    })
    .catch((err: any) => {
      console.error("[provider-health] Failed to store health record:", err?.message);
    });

  // ─── Transition Handling ────────────────────────────────────

  // DOWN → HEALTHY: Resume paused campaigns
  if (previousStatus === "down" && finalStatus === "healthy") {
    console.log("[provider-health] Provider recovered! Resuming paused campaigns...");

    const { data: pausedCampaigns } = await supabase
      .from("campaigns")
      .select("id, organization_id, name")
      .eq("status", "paused")
      .eq("paused_reason", "provider_outage");

    if (pausedCampaigns && pausedCampaigns.length > 0) {
      for (const campaign of pausedCampaigns) {
        await supabase
          .from("campaigns")
          .update({
            status: "running",
            paused_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaign.id);

        console.log(`[provider-health] Resumed campaign "${campaign.name}"`);
      }

      // Notify unique orgs
      const orgIds = [...new Set(pausedCampaigns.map((c) => c.organization_id))];
      for (const orgId of orgIds) {
        const orgCampaigns = pausedCampaigns.filter((c) => c.organization_id === orgId);
        await supabase
          .from("notifications")
          .insert({
            organization_id: orgId,
            type: "provider_recovered",
            title: "Voice Provider Recovered",
            message: `Voice provider is back online. ${orgCampaigns.length} campaign(s) have been automatically resumed.`,
            created_at: new Date().toISOString(),
          })
          .catch(() => {});
      }
    }
  }

  // HEALTHY → DOWN: Pause running campaigns
  if (previousStatus !== "down" && finalStatus === "down") {
    console.log("[provider-health] Provider is DOWN! Pausing running campaigns...");

    const { data: runningCampaigns } = await supabase
      .from("campaigns")
      .select("id, organization_id, name")
      .eq("status", "running")
      .is("paused_reason", null);

    if (runningCampaigns && runningCampaigns.length > 0) {
      for (const campaign of runningCampaigns) {
        await supabase
          .from("campaigns")
          .update({
            status: "paused",
            paused_reason: "provider_outage",
            updated_at: new Date().toISOString(),
          })
          .eq("id", campaign.id);
      }

      // Notify unique orgs
      const orgIds = [...new Set(runningCampaigns.map((c) => c.organization_id))];
      for (const orgId of orgIds) {
        const orgCampaigns = runningCampaigns.filter((c) => c.organization_id === orgId);
        await supabase
          .from("notifications")
          .insert({
            organization_id: orgId,
            type: "provider_outage",
            title: "Voice Provider Outage",
            message: `Voice provider is experiencing an outage. ${orgCampaigns.length} campaign(s) have been paused and will resume automatically when service is restored.`,
            created_at: new Date().toISOString(),
          })
          .catch(() => {});
      }
    }
  }

  console.log(`[provider-health] Check complete: ${finalStatus}`);
}

// Schedule: every 5 minutes
const scheduledHandler = schedule("*/5 * * * *", async () => {
  await runHealthCheck();
  return { statusCode: 200, body: "OK" };
});

// Also allow manual trigger and status query
export const handler: Handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  // Scheduled trigger
  if (event.headers?.["x-netlify-event"] === "schedule") {
    return scheduledHandler(event, context);
  }

  // GET: Return current health status
  if (event.httpMethod === "GET") {
    const { data: latest } = await supabase
      .from("provider_health")
      .select("*")
      .eq("provider", "vapi")
      .order("checked_at", { ascending: false })
      .limit(1)
      .single();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        provider: "vapi",
        status: latest?.status || "unknown",
        response_time_ms: latest?.response_time_ms || null,
        last_checked: latest?.checked_at || null,
        consecutive_failures: latest?.consecutive_failures || 0,
      }),
    };
  }

  // POST: Manual health check trigger (requires auth)
  if (event.httpMethod === "POST") {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const token = authHeader.split(" ")[1];
    const { error: authError } = await supabase.auth.getUser(token);
    if (authError) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    await runHealthCheck();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: "Health check completed" }),
    };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
};
