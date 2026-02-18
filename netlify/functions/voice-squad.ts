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
    const squadId = pathParts.length > 4 ? pathParts[4] : null;

    // ── GET (list all) — Query Supabase, enrich from Vapi ────────────────
    if (!squadId && event.httpMethod === 'GET') {
      const { data: dbSquads } = await supabase
        .from('voice_squads')
        .select('id, provider_squad_id, name, members_config, created_at')
        .eq('organization_id', organizationId);

      const enriched = await Promise.all((dbSquads || []).map(async (s) => {
        if (!s.provider_squad_id) {
          return { id: s.id, name: s.name, members: s.members_config };
        }
        try {
          const resp = await fetch(`https://api.vapi.ai/squad/${s.provider_squad_id}`, {
            headers: { 'Authorization': `Bearer ${vapiApiKey}` }
          });
          if (resp.ok) {
            const vapi: any = await resp.json();
            return { ...vapi, _dbId: s.id, _organizationId: organizationId };
          }
        } catch {}
        return { id: s.provider_squad_id, name: s.name, members: s.members_config };
      }));

      return { statusCode: 200, headers, body: JSON.stringify(enriched) };
    }

    // ── POST (create) — Proxy to Vapi, save ownership ────────────────────
    if (event.httpMethod === 'POST') {
      const response = await fetch('https://api.vapi.ai/squad', {
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
          await supabase.from('voice_squads').insert({
            organization_id: organizationId,
            provider_squad_id: vapiResult.id,
            name: vapiResult.name || 'New Squad',
            members_config: vapiResult.members || [],
          });
        } catch (dbErr) {
          console.error('⚠️ Failed to save squad ownership:', dbErr);
        }
      }

      return { statusCode: response.status, headers, body: JSON.stringify(vapiResult) };
    }

    // ── GET/PATCH/DELETE (single) — Verify ownership ─────────────────────
    if (squadId) {
      const { data: owned } = await supabase
        .from('voice_squads')
        .select('id, provider_squad_id')
        .or(`provider_squad_id.eq.${squadId},id.eq.${squadId}`)
        .eq('organization_id', organizationId)
        .single();

      if (!owned) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Squad not found' }) };
      }

      const vapiId = owned.provider_squad_id || squadId;
      const url = `https://api.vapi.ai/squad/${vapiId}`;

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
        await supabase.from('voice_squads').delete().eq('id', owned.id);
      }

      const text = await response.text();
      return { statusCode: response.status, headers, body: text };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Internal error' }) };
  }
};
