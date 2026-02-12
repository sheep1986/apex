import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { verifyVapiSignature } from './security';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiWebhookSecret = process.env.VAPI_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

type ToolCall = {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string | Record<string, any>;
  };
};

function getMessage(payload: any) {
  return payload?.message || payload;
}

function getOrganizationId(payload: any) {
  const message = getMessage(payload);
  return (
    message?.call?.assistant?.metadata?.organizationId ||
    message?.call?.metadata?.organizationId ||
    payload?.call?.assistant?.metadata?.organizationId ||
    payload?.call?.metadata?.organizationId ||
    null
  );
}

function getProviderCallId(payload: any) {
  const message = getMessage(payload);
  return message?.call?.id || payload?.call?.id || null;
}

async function ensureCallRow(organizationId: string, providerCallId: string | null) {
  if (!providerCallId) return null;

  const { data: existing } = await supabase
    .from('voice_calls')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('provider_call_id', providerCallId)
    .single();

  if (existing?.id) return existing.id;

  const { data: inserted, error } = await supabase
    .from('voice_calls')
    .insert({
      organization_id: organizationId,
      provider_call_id: providerCallId,
      status: 'unknown'
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create voice_calls row:', error);
    return null;
  }

  return inserted?.id || null;
}

async function recordEvent(organizationId: string, payload: any, type: string) {
  const providerCallId = getProviderCallId(payload);
  const callId = await ensureCallRow(organizationId, providerCallId);

  await supabase.from('voice_call_events').insert({
    organization_id: organizationId,
    call_id: callId,
    provider_call_id: providerCallId,
    type,
    payload
  });
}

async function getToolByName(organizationId: string, name: string) {
  const { data, error } = await supabase
    .from('voice_tools')
    .select('id, name, config, schema, is_active')
    .eq('organization_id', organizationId)
    .eq('name', name)
    .eq('is_active', true)
    .single();

  if (error) {
    return null;
  }

  return data;
}

async function getToolExecution(organizationId: string, toolCallId: string) {
  const { data } = await supabase
    .from('voice_tool_executions')
    .select('id, result, status')
    .eq('organization_id', organizationId)
    .eq('tool_call_id', toolCallId)
    .single();
  return data || null;
}

async function saveToolExecution(organizationId: string, toolCallId: string, toolId: string | null, status: string, result: string) {
  await supabase.from('voice_tool_executions').insert({
    organization_id: organizationId,
    tool_call_id: toolCallId,
    tool_id: toolId,
    status,
    result
  });
}

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Make sure you POST!' };
  }

  const rawBody = event.body || '';
  const signature = event.headers['x-vapi-signature'] || event.headers['X-Vapi-Signature'];

  if (vapiWebhookSecret) {
    if (!signature || !verifyVapiSignature(rawBody, signature, vapiWebhookSecret)) {
      console.error('Invalid Vapi signature');
      return { statusCode: 401, headers, body: JSON.stringify({ message: 'Unauthorized' }) };
    }
  } else {
    console.warn('VAPI_WEBHOOK_SECRET not set. Router is insecure.');
  }

  try {
    const payload = JSON.parse(rawBody);
    const message = getMessage(payload);
    const organizationId = getOrganizationId(payload);

    if (!organizationId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'organizationId is required' }) };
    }

    // Persist non-tool events
    if (message?.type === 'transcript' || message?.type === 'transcript-ready' || message?.type === 'transcript-complete') {
      await recordEvent(organizationId, payload, 'transcript');
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'acknowledged' }) };
    }

    if (message?.type === 'end-of-call-report' || message?.type === 'call-ended') {
      await recordEvent(organizationId, payload, 'end_of_call');
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'acknowledged' }) };
    }

    if (message?.type === 'status-update' || message?.type === 'call-started' || message?.type === 'conversation-update') {
      await recordEvent(organizationId, payload, 'status');
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'acknowledged' }) };
    }

    if (message?.type !== 'tool-calls') {
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'acknowledged' }) };
    }

    const toolCalls: ToolCall[] = message.toolCalls || [];

    const toolResults = await Promise.all(toolCalls.map(async (toolCall) => {
      const { type, function: func } = toolCall;
      if (type !== 'function') return null;

      // Idempotency
      const existing = await getToolExecution(organizationId, toolCall.id);
      if (existing) {
        return {
          toolCallId: toolCall.id,
          result: existing.result
        };
      }

      const tool = await getToolByName(organizationId, func.name);
      if (!tool) {
        const result = `Tool ${func.name} not found or not active for this organization.`;
        await saveToolExecution(organizationId, toolCall.id, null, 'error', result);
        return { toolCallId: toolCall.id, result };
      }

      let args: any = func.arguments;
      try {
        if (typeof args === 'string') args = JSON.parse(args);
      } catch {
        // Keep raw string if parsing fails
      }

      const serverUrl = tool.config?.serverUrl;
      if (!serverUrl) {
        const result = `Tool ${func.name} has no serverUrl configured.`;
        await saveToolExecution(organizationId, toolCall.id, tool.id, 'error', result);
        return { toolCallId: toolCall.id, result };
      }

      try {
        const response = await fetch(serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(tool.config?.headers || {})
          },
          body: JSON.stringify({
            organizationId,
            tool: { id: tool.id, name: tool.name },
            arguments: args,
            call: message.call || payload.call || null
          })
        });

        const responseText = await response.text();
        const result = responseText || 'ok';
        await saveToolExecution(organizationId, toolCall.id, tool.id, 'success', result);
        return { toolCallId: toolCall.id, result };
      } catch (err: any) {
        const result = `Error executing ${func.name}: ${err.message}`;
        await saveToolExecution(organizationId, toolCall.id, tool.id, 'error', result);
        return { toolCallId: toolCall.id, result };
      }
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results: toolResults.filter(Boolean) })
    };
  } catch (error: any) {
    console.error('Router Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Router Error' }) };
  }
};
