import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    // Verify the user via their Supabase JWT
    const authHeader = event.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing authorization token' }) };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) };
    }

    const email = user.email;
    const firstName = user.user_metadata?.full_name?.split(' ')[0] || 'User';
    const lastName = user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

    console.log(`Bootstrapping user: ${email}`);

    // 1. Check if profile exists (profiles.id references auth.users.id)
    let { data: profile } = await supabase
      .from('profiles')
      .select('id, organization_id, role')
      .eq('id', user.id)
      .single();

    // Platform owners are super-admins who manage all orgs — skip bootstrap entirely
    if (profile && profile.role === 'platform_owner') {
      console.log('Platform owner detected, skipping bootstrap');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, role: 'platform_owner', skipped: true })
      };
    }

    if (!profile) {
      console.log('Creating new profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: `${firstName} ${lastName}`.trim(),
          role: 'org_owner',
        })
        .select('id, organization_id')
        .single();

      if (createError) {
        console.error('Failed to create profile:', createError);
        throw createError;
      }
      profile = newProfile;
    }

    if (!profile) throw new Error('Profile creation failed');

    // 2. Check if user already has an organization
    if (profile.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name, credit_balance')
        .eq('id', profile.organization_id)
        .single();

      console.log('User already has organization');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          org,
          role: 'owner'
        })
      };
    }

    // 3. Create Organization
    console.log('Creating new organization...');
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: `${firstName}'s Organization`,
      })
      .select('id, name')
      .single();

    if (orgError) throw orgError;

    // 4. Link profile to organization
    await supabase
      .from('profiles')
      .update({ organization_id: newOrg.id, role: 'org_owner' })
      .eq('id', user.id);

    // 4b. Also insert into organization_members (voice/billing functions use this table)
    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert({
        organization_id: newOrg.id,
        user_id: user.id,
        role: 'owner'
      }, { onConflict: 'organization_id,user_id' });

    if (memberError) {
      console.warn('organization_members insert skipped:', memberError.message);
    }

    // 5. Apply trial credit via atomic RPC
    console.log('Applying trial credit via RPC...');
    const { data: newBalance, error: rpcError } = await supabase.rpc('apply_ledger_entry', {
      p_organization_id: newOrg.id,
      p_amount: 5.00,
      p_type: 'trial',
      p_description: 'Welcome Trial Credit',
      p_reference_id: `bootstrap_trial_${newOrg.id}`
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
    }

    console.log('Bootstrap complete! Balance:', newBalance);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        org: { ...newOrg, credit_balance: newBalance },
        role: 'owner'
      })
    };

  } catch (error: any) {
    console.error('Bootstrap Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
