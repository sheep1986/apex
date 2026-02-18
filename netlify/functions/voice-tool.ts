import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const vapiApiKey = process.env.VAPI_PRIVATE_API_KEY;

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // ── Org context ──────────────────────────────────────────────────────
    let organizationId: string | null = null;

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (member) {
      organizationId = member.organization_id;
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      organizationId = profile?.organization_id || null;
    }

    if (!organizationId) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'No organization' }) };
    }

    if (!vapiApiKey) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Voice credentials not configured' }) };
    }

    const pathParts = event.path.split('/');
    const toolId = pathParts.length > 4 ? pathParts[4] : null;

    // ── GET (list all) — Query Supabase, enrich from Vapi ────────────────
    if (!toolId && event.httpMethod === 'GET') {
      const { data: dbTools } = await supabase
        .from('voice_tools')
        .select('id, provider_tool_id, name, description, type, created_at')
        .eq('organization_id', organizationId);

      const enriched = await Promise.all((dbTools || []).map(async (t) => {
        if (!t.provider_tool_id) {
          return { id: t.id, name: t.name, description: t.description, type: t.type };
        }
        try {
          const resp = await fetch(`https://api.vapi.ai/tool/${t.provider_tool_id}`, {
            headers: { 'Authorization': `Bearer ${vapiApiKey}` }
          });
          if (resp.ok) {
            const vapi: any = await resp.json();
            return { ...vapi, _dbId: t.id, _organizationId: organizationId };
          }
        } catch {}
        return { id: t.provider_tool_id, name: t.name, description: t.description, type: t.type };
      }));

      return { statusCode: 200, headers, body: JSON.stringify(enriched) };
    }

    // ── POST (create) — Proxy to Vapi, save ownership ────────────────────
    if (event.httpMethod === 'POST') {
      const response = await fetch('https://api.vapi.ai/tool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vapiApiKey}`
        },
        body: event.body
      });

      const vapiResult: any = await response.json();

      if (response.ok && vapiResult.id) {
        try {
          await supabase.from('voice_tools').insert({
            organization_id: organizationId,
            provider_tool_id: vapiResult.id,
            name: vapiResult.function?.name || vapiResult.name || 'New Tool',
            description: vapiResult.function?.description || '',
            type: vapiResult.type || 'function',
          });
        } catch (dbErr) {
          console.error('⚠️ Failed to save tool ownership:', dbErr);
        }
      }

      return { statusCode: response.status, headers, body: JSON.stringify(vapiResult) };
    }

    // ── GET/PATCH/DELETE (single) — Verify ownership ─────────────────────
    if (toolId) {
      const { data: owned } = await supabase
        .from('voice_tools')
        .select('id, provider_tool_id')
        .or(`provider_tool_id.eq.${toolId},id.eq.${toolId}`)
        .eq('organization_id', organizationId)
        .single();

      if (!owned) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Tool not found' }) };
      }

      const vapiId = owned.provider_tool_id || toolId;
      const url = `https://api.vapi.ai/tool/${vapiId}`;

      const response = await fetch(url, {
        method: event.httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vapiApiKey}`
        },
        body: ['GET', 'DELETE'].includes(event.httpMethod) ? undefined : event.body
      });

      // Clean up on delete
      if (event.httpMethod === 'DELETE' && response.ok) {
        await supabase.from('voice_tools').delete().eq('id', owned.id);
      }

      const text = await response.text();
      return { statusCode: response.status, headers, body: text };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Internal error' }) };
  }
};
