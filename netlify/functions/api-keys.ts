import { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { corsHeaders } from './utils/cors';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `tl_${randomBytes}`;
}

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function getPrefix(key: string): string {
  return key.substring(0, 11); // "tl_" + first 8 hex chars
}

function getExpirationDate(expiry: string): string | null {
  const now = new Date();
  switch (expiry) {
    case '30d':
      now.setDate(now.getDate() + 30);
      return now.toISOString();
    case '90d':
      now.setDate(now.getDate() + 90);
      return now.toISOString();
    case '1y':
      now.setFullYear(now.getFullYear() + 1);
      return now.toISOString();
    case 'never':
    default:
      return null;
  }
}

// ── Auth helper ──────────────────────────────────────────────────────────────

async function authenticateRequest(event: HandlerEvent) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return { error: 'No authorization token', user: null, orgId: null };
  }

  // Verify the JWT and get user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { error: 'Invalid token', user: null, orgId: null };
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!membership) {
    return { error: 'No organization found', user: null, orgId: null };
  }

  const isAdmin = ['client_admin', 'agency_owner', 'agency_admin', 'platform_owner'].includes(membership.role);

  return { error: null, user, orgId: membership.organization_id, role: membership.role, isAdmin };
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function listKeys(orgId: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch API keys' }) };
  }

  // Map to frontend format
  const keys = (data || []).map((k: any) => {
    let status: 'active' | 'expired' | 'revoked' = 'active';
    if (k.revoked_at) status = 'revoked';
    else if (k.expires_at && new Date(k.expires_at) < new Date()) status = 'expired';

    return {
      id: k.id,
      name: k.name,
      key: `${k.key_prefix}${'•'.repeat(40)}`,
      prefix: k.key_prefix,
      lastUsed: k.last_used_at,
      createdAt: k.created_at,
      expiresAt: k.expires_at,
      permissions: k.permissions || ['read'],
      status,
      usage: {
        calls: k.usage_count || 0,
        lastCall: k.last_used_at,
      },
    };
  });

  return { statusCode: 200, body: JSON.stringify(keys) };
}

async function createKey(orgId: string, userId: string, body: any) {
  const { name, permissions = ['read'], expiry = 'never' } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name is required' }) };
  }

  // Check key count limit (max 25 active keys per org)
  const { count } = await supabase
    .from('api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('revoked_at', null);

  if ((count || 0) >= 25) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Maximum of 25 active API keys allowed' }) };
  }

  const plainKey = generateApiKey();
  const keyHash = hashKey(plainKey);
  const keyPrefix = getPrefix(plainKey);
  const expiresAt = getExpirationDate(expiry);

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      organization_id: orgId,
      name: name.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
      permissions: permissions,
      expires_at: expiresAt,
      created_by: userId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create API key:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create API key' }) };
  }

  // Return the plaintext key — this is the ONLY time it's available
  return {
    statusCode: 201,
    body: JSON.stringify({
      id: data.id,
      key: plainKey,
      prefix: keyPrefix,
      message: 'Store this key securely. It will not be shown again.',
    }),
  };
}

async function revokeKey(orgId: string, keyId: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('organization_id', orgId)
    .is('revoked_at', null)
    .select('id')
    .single();

  if (error || !data) {
    return { statusCode: 404, body: JSON.stringify({ error: 'API key not found or already revoked' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true, message: 'API key revoked' }) };
}

// ── Main Handler ─────────────────────────────────────────────────────────────

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Content-Type': 'application/json',
    ...corsHeaders(),
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const auth = await authenticateRequest(event);
  if (auth.error) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: auth.error }) };
  }

  const { orgId, user, isAdmin } = auth;
  const path = event.path || '';

  try {
    switch (event.httpMethod) {
      case 'GET': {
        return { ...await listKeys(orgId!), headers };
      }

      case 'POST': {
        if (!isAdmin) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'Only admins can create API keys' }) };
        }
        const body = JSON.parse(event.body || '{}');
        return { ...await createKey(orgId!, user!.id, body), headers };
      }

      case 'DELETE': {
        if (!isAdmin) {
          return { statusCode: 403, headers, body: JSON.stringify({ error: 'Only admins can revoke API keys' }) };
        }
        // Extract key ID from path: /.netlify/functions/api-keys/KEY_ID
        const segments = path.split('/').filter(Boolean);
        const keyId = segments[segments.length - 1];
        if (!keyId || keyId === 'api-keys') {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Key ID required' }) };
        }
        return { ...await revokeKey(orgId!, keyId), headers };
      }

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
  } catch (err: any) {
    console.error('API Keys error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
