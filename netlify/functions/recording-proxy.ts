import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

/**
 * Recording Proxy — Streams call recordings through our server
 * so the end user never sees the upstream provider URL (zero-trace).
 *
 * GET /api/recording/{callId}
 *   → Looks up recording URL from voice_call_private / voice_call_recordings
 *   → Streams the audio back with proper Content-Type
 */

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiPrivateKey = process.env.VAPI_PRIVATE_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export const handler: Handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    // Auth check
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    // Get organization
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
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: 'No organization' }) };
    }

    // Extract call ID from path: /api/recording/{callId}
    const pathParts = event.path.split('/');
    const callId = pathParts[pathParts.length - 1];

    if (!callId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing call ID' }) };
    }

    // Strategy 1: Look up from our DB (voice_call_private)
    let recordingUrl: string | null = null;

    const { data: privateData } = await supabase
      .from('voice_call_private')
      .select('provider_recording_ref')
      .eq('voice_call_id', callId)
      .eq('organization_id', organizationId)
      .single();

    if (privateData?.provider_recording_ref) {
      recordingUrl = privateData.provider_recording_ref;
    }

    // Strategy 2: Check voice_call_recordings table
    if (!recordingUrl) {
      const { data: recording } = await supabase
        .from('voice_call_recordings')
        .select('provider_recording_ref, storage_path')
        .eq('voice_call_id', callId)
        .eq('organization_id', organizationId)
        .single();

      recordingUrl = recording?.storage_path || recording?.provider_recording_ref || null;
    }

    // Strategy 3: Fetch from voice provider API using provider_call_id
    if (!recordingUrl) {
      const { data: callRow } = await supabase
        .from('voice_calls')
        .select('provider_call_id')
        .eq('id', callId)
        .eq('organization_id', organizationId)
        .single();

      if (callRow?.provider_call_id && vapiPrivateKey) {
        try {
          const callResponse = await fetch(`https://api.vapi.ai/call/${callRow.provider_call_id}`, {
            headers: { 'Authorization': `Bearer ${vapiPrivateKey}` }
          });
          if (callResponse.ok) {
            const callData: any = await callResponse.json();
            recordingUrl = callData.recordingUrl || null;
          }
        } catch (e) {
          console.warn('Failed to fetch recording from provider:', e);
        }
      }
    }

    if (!recordingUrl) {
      return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Recording not found' }) };
    }

    // Stream the recording through our proxy (zero-trace)
    const audioResponse = await fetch(recordingUrl);

    if (!audioResponse.ok) {
      return {
        statusCode: audioResponse.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to fetch recording' })
      };
    }

    const buffer = await audioResponse.buffer();
    const contentType = audioResponse.headers.get('content-type') || 'audio/wav';

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="recording-${callId}.wav"`,
        'Cache-Control': 'private, max-age=3600'
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error: any) {
    console.error('Recording proxy error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal error' })
    };
  }
};
