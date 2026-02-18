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
    const maybeId = pathParts.length > 4 ? pathParts[4] : null;
    const assistantId = maybeId || (event.queryStringParameters?.id || null);

    // ── GET (list all) — Query Supabase, enrich from Vapi ────────────────
    if (!assistantId && event.httpMethod === 'GET') {
      const { data: dbAssistants } = await supabase
        .from('assistants')
        .select('id, vapi_assistant_id, name, created_at')
        .eq('organization_id', organizationId);

      // Enrich each from Vapi for live config
      const enriched = await Promise.all((dbAssistants || []).map(async (a) => {
        if (!a.vapi_assistant_id) {
          return { id: a.id, name: a.name };
        }
        try {
          const resp = await fetch(`https://api.vapi.ai/assistant/${a.vapi_assistant_id}`, {
            headers: { 'Authorization': `Bearer ${vapiApiKey}` }
          });
          if (resp.ok) {
            const vapi: any = await resp.json();
            return {
              ...vapi,
              _dbId: a.id,
              _organizationId: organizationId,
            };
          }
        } catch {}
        return { id: a.vapi_assistant_id, name: a.name };
      }));

      return { statusCode: 200, headers, body: JSON.stringify(enriched) };
    }

    // ── Enforce assistant limit on creation (count from Supabase, not Vapi) ─
    if (event.httpMethod === 'POST') {
      const { data: orgLimits } = await supabase
        .from('organizations')
        .select('max_assistants')
        .eq('id', organizationId)
        .single();

      const maxAssistants = orgLimits?.max_assistants ?? 3;
      if (maxAssistants !== -1) {
        const { count } = await supabase
          .from('assistants')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId);

        if ((count || 0) >= maxAssistants) {
          return {
            statusCode: 403, headers,
            body: JSON.stringify({ error: `Assistant limit reached (${maxAssistants}). Upgrade your plan for more.` })
          };
        }
      }

      // Proxy creation to Vapi
      const response = await fetch('https://api.vapi.ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vapiApiKey}`
        },
        body: event.body
      });

      const vapiResult: any = await response.json();

      // Save ownership to Supabase
      if (response.ok && vapiResult.id) {
        try {
          await supabase
            .from('assistants')
            .insert({
              organization_id: organizationId,
              vapi_assistant_id: vapiResult.id,
              name: vapiResult.name || 'New Assistant',
            });
        } catch (dbErr) {
          console.error('⚠️ Failed to save assistant ownership:', dbErr);
        }
      }

      return { statusCode: response.status, headers, body: JSON.stringify(vapiResult) };
    }

    // ── GET (single) — Verify ownership before proxying ──────────────────
    if (assistantId && event.httpMethod === 'GET') {
      const { data: owned } = await supabase
        .from('assistants')
        .select('id, vapi_assistant_id')
        .or(`vapi_assistant_id.eq.${assistantId},id.eq.${assistantId}`)
        .eq('organization_id', organizationId)
        .single();

      if (!owned) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Assistant not found' }) };
      }

      const vapiId = owned.vapi_assistant_id || assistantId;
      const response = await fetch(`https://api.vapi.ai/assistant/${vapiId}`, {
        headers: { 'Authorization': `Bearer ${vapiApiKey}` }
      });
      const text = await response.text();
      return { statusCode: response.status, headers, body: text };
    }

    // ── PATCH (update) — Verify ownership before proxying ────────────────
    if (assistantId && event.httpMethod === 'PATCH') {
      const { data: owned } = await supabase
        .from('assistants')
        .select('id, vapi_assistant_id')
        .or(`vapi_assistant_id.eq.${assistantId},id.eq.${assistantId}`)
        .eq('organization_id', organizationId)
        .single();

      if (!owned) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Assistant not found' }) };
      }

      const vapiId = owned.vapi_assistant_id || assistantId;
      const response = await fetch(`https://api.vapi.ai/assistant/${vapiId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vapiApiKey}`
        },
        body: event.body
      });

      const vapiResult: any = await response.json();

      // Update local name cache
      if (response.ok && vapiResult.name) {
        try {
          await supabase
            .from('assistants')
            .update({ name: vapiResult.name })
            .eq('id', owned.id);
        } catch {}
      }

      return { statusCode: response.status, headers, body: JSON.stringify(vapiResult) };
    }

    // ── DELETE — Verify ownership before proxying ────────────────────────
    if (assistantId && event.httpMethod === 'DELETE') {
      const { data: owned } = await supabase
        .from('assistants')
        .select('id, vapi_assistant_id')
        .or(`vapi_assistant_id.eq.${assistantId},id.eq.${assistantId}`)
        .eq('organization_id', organizationId)
        .single();

      if (!owned) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Assistant not found' }) };
      }

      const vapiId = owned.vapi_assistant_id || assistantId;
      const response = await fetch(`https://api.vapi.ai/assistant/${vapiId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${vapiApiKey}` }
      });

      // Remove from local DB
      if (response.ok) {
        await supabase.from('assistants').delete().eq('id', owned.id);
      }

      const text = await response.text();
      return { statusCode: response.status, headers, body: text };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Internal error' }) };
  }
};
