import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { sanitizeUserError } from "../../src/utils/error-sanitizer";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiPrivateKey = process.env.VAPI_PRIVATE_API_KEY;

const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-organization-id",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    const token = authHeader.split(" ")[1];

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "Invalid or expired token" }) };
    }

    // ── Org context ──────────────────────────────────────────────────────
    let organizationId: string | null = null;
    const { data: member } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .single();

    if (member) {
      organizationId = member.organization_id;
    } else {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
      organizationId = profile?.organization_id || null;
    }

    if (!organizationId) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "No organization" }) };
    }

    // ── Route: GET /api/voice/calls/{id} or GET /api/voice/calls ─────────
    const pathParts = event.path.split("/");
    const callId = pathParts.length > 4 ? pathParts[4] : null;

    if (callId) {
      // ── Single call: verify ownership via Supabase ──────────────────
      const { data: callRow } = await supabaseAdmin
        .from("voice_calls")
        .select("*, provider_call_id")
        .eq("id", callId)
        .eq("organization_id", organizationId)
        .single();

      if (!callRow) {
        // Also try by provider_call_id (Vapi ID)
        const { data: byProvider } = await supabaseAdmin
          .from("voice_calls")
          .select("*, provider_call_id")
          .eq("provider_call_id", callId)
          .eq("organization_id", organizationId)
          .single();

        if (!byProvider) {
          return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: "Call not found" }) };
        }

        // Enrich from Vapi if we have a provider key
        if (vapiPrivateKey && byProvider.provider_call_id) {
          try {
            const resp = await fetch(`https://api.vapi.ai/call/${byProvider.provider_call_id}`, {
              headers: { "Authorization": `Bearer ${vapiPrivateKey}` },
            });
            if (resp.ok) {
              const vapiData = await resp.json();
              return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ...byProvider, ...vapiData }) };
            }
          } catch {}
        }

        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(byProvider) };
      }

      // Enrich from Vapi
      if (vapiPrivateKey && callRow.provider_call_id) {
        try {
          const resp = await fetch(`https://api.vapi.ai/call/${callRow.provider_call_id}`, {
            headers: { "Authorization": `Bearer ${vapiPrivateKey}` },
          });
          if (resp.ok) {
            const vapiData = await resp.json();
            return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ...callRow, ...vapiData }) };
          }
        } catch {}
      }

      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(callRow) };

    } else {
      // ── List calls: query Supabase filtered by organization_id ──────
      const { limit, assistantId } = event.queryStringParameters || {};
      const parsedLimit = limit ? parseInt(limit) : 10;

      let query = supabaseAdmin
        .from("voice_calls")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(parsedLimit);

      if (assistantId) {
        // Look up the internal assistant to get vapi_assistant_id
        const { data: assistant } = await supabaseAdmin
          .from("assistants")
          .select("vapi_assistant_id")
          .eq("id", assistantId)
          .eq("organization_id", organizationId)
          .single();

        if (assistant?.vapi_assistant_id) {
          query = query.eq("assistant_id", assistant.vapi_assistant_id);
        } else {
          // Try direct match (might already be provider ID)
          query = query.eq("assistant_id", assistantId);
        }
      }

      const { data: calls, error } = await query;

      if (error) {
        console.error("❌ voice-calls list error:", error);
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "Failed to fetch calls" }) };
      }

      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(calls || []) };
    }

  } catch (error: any) {
    const sanitized = sanitizeUserError(error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: sanitized.message, code: sanitized.code }),
    };
  }
};
