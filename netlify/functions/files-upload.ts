
import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';
import fetch from 'node-fetch';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vapiPrivateKey = process.env.VAPI_PRIVATE_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 1. Auth Check
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };

    // Get Org (check organization_members first, then profiles fallback)
    let orgId: string | null = null;
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
    if (member) {
      orgId = member.organization_id;
    } else {
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      orgId = profile?.organization_id || null;
    }
    if (!orgId) return { statusCode: 403, headers, body: JSON.stringify({ error: 'No Organization' }) };

    // 2. Handle Upload (Requires multipart parsing - complicated in Netlify Functions without middy/busboy)
    // For simplicity in this Wrapper Demo, we will assume the client sends a JSON with file content (base64) OR
    // we use a presigned URL approach. 
    // Vapi requires a POST to /file with multipart/form-data.

    // Let's implement the "Import from URL" or "Raw Text" first as it's easier.
    // If receiving binary, we need 'isBase64Encoded: true' in Netlify.

    const body = JSON.parse(event.body || '{}');
    
    // Scenario A: Uploading a file (Base64)
    if (body.file && body.filename) {
        if (!vapiPrivateKey) throw new Error("Vapi Key Missing");

        const form = new FormData();
        const fileBuffer = Buffer.from(body.file, 'base64');
        form.append('file', fileBuffer, body.filename);
        
        // Call Vapi
        const response = await fetch('https://api.vapi.ai/file', {
            method: 'POST',
            body: form,
            headers: {
                'Authorization': `Bearer ${vapiPrivateKey}`,
                // FormData headers are auto-managed
            }
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Vapi Upload Failed: ${err}`);
        }

        const vapiFile = await response.json();

        // 3. Save to DB
        const { data: dbFile, error } = await supabase.from('voice_files').insert({
            organization_id: orgId,
            vapi_file_id: vapiFile.id,
            filename: body.filename,
            status: 'ready',
            url: vapiFile.url,
            size_bytes: fileBuffer.length // Approx
        }).select().single();

        if (error) throw error;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, file: dbFile })
        };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'No file provided' }) };

  } catch (error: any) {
    console.error('File Upload Error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || 'Server Error' }) };
  }
};
