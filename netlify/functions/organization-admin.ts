import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Auth helper ──────────────────────────────────────────────────────────────

async function authenticateRequest(event: HandlerEvent) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) return { error: 'No authorization token', user: null };

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { error: 'Invalid token', user: null };

  // Check if user is platform owner or agency owner
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!membership) return { error: 'No organization', user: null };

  const isPlatformOwner = membership.role === 'platform_owner';
  const isAgencyOwner = ['agency_owner', 'agency_admin'].includes(membership.role);

  if (!isPlatformOwner && !isAgencyOwner) {
    return { error: 'Insufficient permissions', user: null };
  }

  return { error: null, user, role: membership.role, orgId: membership.organization_id };
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function createOrganization(body: any) {
  const { name, plan = 'starter', ownerEmail, slug } = body;

  if (!name?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Organization name is required' }) };
  }

  const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      name: name.trim(),
      slug: orgSlug,
      plan,
      status: 'active',
      subscription_status: 'active',
      credit_balance: plan === 'enterprise' ? 100 : plan === 'professional' ? 50 : 10,
      included_minutes: plan === 'enterprise' ? 10000 : plan === 'professional' ? 2000 : 500,
      max_phone_numbers: plan === 'enterprise' ? 50 : plan === 'professional' ? 10 : 3,
      max_assistants: plan === 'enterprise' ? 50 : plan === 'professional' ? 20 : 5,
      max_concurrent_calls: plan === 'enterprise' ? 25 : plan === 'professional' ? 10 : 3,
      max_users: plan === 'enterprise' ? 100 : plan === 'professional' ? 25 : 5,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create organization:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create organization' }) };
  }

  // If owner email provided, look up and add as admin
  if (ownerEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', ownerEmail.trim().toLowerCase())
      .maybeSingle();

    if (profile) {
      await supabase.from('organization_members').insert({
        organization_id: org.id,
        user_id: profile.id,
        role: 'client_admin',
      });
    }
  }

  // Create organization_controls entry
  await supabase.from('organization_controls').insert({
    organization_id: org.id,
    is_suspended: false,
    shadow_mode: false,
  }).select().maybeSingle();

  return { statusCode: 201, body: JSON.stringify({ success: true, organization: org }) };
}

async function suspendOrganization(orgId: string) {
  // Update org status
  const { error: orgErr } = await supabase
    .from('organizations')
    .update({ status: 'suspended' })
    .eq('id', orgId);

  if (orgErr) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to suspend organization' }) };
  }

  // Update controls
  await supabase
    .from('organization_controls')
    .upsert({ organization_id: orgId, is_suspended: true }, { onConflict: 'organization_id' });

  return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Organization suspended' }) };
}

async function reactivateOrganization(orgId: string) {
  const { error: orgErr } = await supabase
    .from('organizations')
    .update({ status: 'active' })
    .eq('id', orgId);

  if (orgErr) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to reactivate organization' }) };
  }

  await supabase
    .from('organization_controls')
    .upsert({ organization_id: orgId, is_suspended: false }, { onConflict: 'organization_id' });

  return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Organization reactivated' }) };
}

async function softDeleteOrganization(orgId: string) {
  const { error } = await supabase
    .from('organizations')
    .update({ status: 'deleted' })
    .eq('id', orgId);

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to delete organization' }) };
  }

  // Suspend to prevent API access
  await supabase
    .from('organization_controls')
    .upsert({ organization_id: orgId, is_suspended: true }, { onConflict: 'organization_id' });

  return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Organization deleted' }) };
}

async function getOrgStats(orgId: string) {
  const [usersResult, campaignsResult, callsResult] = await Promise.all([
    supabase.from('organization_members').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('voice_calls').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
  ]);

  return {
    users_count: usersResult.count || 0,
    campaigns_count: campaignsResult.count || 0,
    total_calls: callsResult.count || 0,
  };
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const auth = await authenticateRequest(event);
  if (auth.error) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: auth.error }) };
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const action = body.action || event.queryStringParameters?.action;

  try {
    switch (action) {
      case 'create':
        return { ...await createOrganization(body), headers };

      case 'suspend':
        if (!body.organizationId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'organizationId required' }) };
        return { ...await suspendOrganization(body.organizationId), headers };

      case 'reactivate':
        if (!body.organizationId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'organizationId required' }) };
        return { ...await reactivateOrganization(body.organizationId), headers };

      case 'delete':
        if (!body.organizationId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'organizationId required' }) };
        return { ...await softDeleteOrganization(body.organizationId), headers };

      case 'stats':
        if (!body.organizationId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'organizationId required' }) };
        const stats = await getOrgStats(body.organizationId);
        return { statusCode: 200, headers, body: JSON.stringify(stats) };

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid action. Supported: create, suspend, reactivate, delete, stats' }) };
    }
  } catch (err: any) {
    console.error('Organization admin error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
