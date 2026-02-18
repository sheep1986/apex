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
    const numberId = maybeId || null;

    // ── GET (list all) — Query Supabase, enrich from Vapi ────────────────
    if (!numberId && event.httpMethod === 'GET') {
      const { data: dbNumbers } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('organization_id', organizationId)
        .in('status', ['active', 'pending']);

      // Enrich each from Vapi for live data (assistantId, etc.)
      const enriched = await Promise.all((dbNumbers || []).map(async (num) => {
        if (!num.vapi_number_id) {
          return { ...num, id: num.id, number: num.number };
        }
        try {
          const resp = await fetch(`https://api.vapi.ai/phone-number/${num.vapi_number_id}`, {
            headers: { 'Authorization': `Bearer ${vapiApiKey}` }
          });
          if (resp.ok) {
            const vapi: any = await resp.json();
            return {
              ...vapi,
              id: vapi.id || num.vapi_number_id,
              number: vapi.number || num.number,
              name: num.name || vapi.name,
              provider: num.provider || 'trinity',
              _dbId: num.id,
              _organizationId: organizationId,
            };
          }
        } catch {}
        return { ...num, id: num.vapi_number_id || num.id, number: num.number };
      }));

      return { statusCode: 200, headers, body: JSON.stringify(enriched) };
    }

    // ── GET (single) — Verify ownership before proxying ──────────────────
    if (numberId && event.httpMethod === 'GET') {
      const { data: owned } = await supabase
        .from('phone_numbers')
        .select('id, vapi_number_id')
        .eq('vapi_number_id', numberId)
        .eq('organization_id', organizationId)
        .single();

      if (!owned) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Phone number not found' }) };
      }

      const response = await fetch(`https://api.vapi.ai/phone-number/${numberId}`, {
        headers: { 'Authorization': `Bearer ${vapiApiKey}` }
      });
      const text = await response.text();
      return { statusCode: response.status, headers, body: text };
    }

    // ── POST (create) — Proxy to Vapi, then save ownership to Supabase ──
    if (event.httpMethod === 'POST') {
      const response = await fetch('https://api.vapi.ai/phone-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vapiApiKey}`
        },
        body: event.body
      });

      const vapiResult: any = await response.json();

      if (response.ok && vapiResult.id) {
        // Save ownership to Supabase
        try {
          await supabase
            .from('phone_numbers')
            .upsert({
              organization_id: organizationId,
              number: vapiResult.number || vapiResult.phoneNumber || '',
              status: 'active',
              vapi_number_id: vapiResult.id,
              provider: 'trinity',
              name: vapiResult.name || `Number ${vapiResult.number || ''}`,
                          }, { onConflict: 'vapi_number_id' })
            .select();
        } catch (dbErr) {
          console.error('⚠️ Failed to save phone number ownership:', dbErr);
        }
      }

      return { statusCode: response.status, headers, body: JSON.stringify(vapiResult) };
    }

    // ── PATCH (update) — Verify ownership before proxying ────────────────
    if (numberId && event.httpMethod === 'PATCH') {
      const { data: owned } = await supabase
        .from('phone_numbers')
        .select('id')
        .eq('vapi_number_id', numberId)
        .eq('organization_id', organizationId)
        .single();

      if (!owned) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Phone number not found' }) };
      }

      const response = await fetch(`https://api.vapi.ai/phone-number/${numberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vapiApiKey}`
        },
        body: event.body
      });
      const text = await response.text();
      return { statusCode: response.status, headers, body: text };
    }

    // ── DELETE — Verify ownership before proxying ────────────────────────
    if (numberId && event.httpMethod === 'DELETE') {
      const { data: owned } = await supabase
        .from('phone_numbers')
        .select('id')
        .eq('vapi_number_id', numberId)
        .eq('organization_id', organizationId)
        .single();

      if (!owned) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Phone number not found' }) };
      }

      const response = await fetch(`https://api.vapi.ai/phone-number/${numberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${vapiApiKey}` }
      });

      // Mark as released in local DB
      if (response.ok) {
        await supabase
          .from('phone_numbers')
          .update({ status: 'released' })
          .eq('vapi_number_id', numberId)
          .eq('organization_id', organizationId);
      }

      const text = await response.text();
      return { statusCode: response.status, headers, body: text };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Internal error' }) };
  }
};
