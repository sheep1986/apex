import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { getVoiceEngine } from "../../src/services/voice-engine";
import { sanitizeUserError } from "../../src/utils/error-sanitizer";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiPrivateKey = process.env.VAPI_PRIVATE_API_KEY;

const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);
const voiceEngine = getVoiceEngine(vapiPrivateKey!);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-organization-id",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  try {
    const authHeader = event.headers.authorization;
    if (!authHeader) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "Missing Authorization header" }) };
    }
    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "Invalid or expired token" }) };
    }

    // Route: GET /api/voice/calls -> List, GET /api/voice/calls/{id} -> Get
    const pathParts = event.path.split("/");
    const callId = pathParts.length > 4 ? pathParts[4] : null; // /api/voice/calls/{id}

    if (callId) {
       const call = await voiceEngine.getCall(callId);
       return {
         statusCode: 200,
         headers: corsHeaders,
         body: JSON.stringify(call),
       };
    } else {
       const { limit, assistantId } = event.queryStringParameters || {};
       const calls = await voiceEngine.listCalls({ 
         limit: limit ? parseInt(limit) : 10,
         assistantId
       });
       return {
         statusCode: 200,
         headers: corsHeaders,
         body: JSON.stringify(calls),
       };
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
