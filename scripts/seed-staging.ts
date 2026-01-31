
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials (VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedStaging() {
  console.log('🌱 Seeding Staging Database...');

  // 1. Create a Test Organization
  const orgName = 'Acme Corp (Staging)';
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .upsert({ 
      id: '00000000-0000-0000-0000-000000000001', // Fixed ID for idempotency
      name: orgName, 
      vapi_api_key: 'sk_test_mock_key_12345' 
    })
    .select()
    .single();

  if (orgError) {
    console.error('Error creating Org:', orgError);
    return;
  }
  console.log(`✅ Organization created: ${org.name}`);

  // 2. Create a Mock Call (for Dashboard stats)
  const { error: callError } = await supabase
    .from('calls')
    .upsert([
      {
        id: 'mock-call-1',
        org_id: org.id,
        status: 'completed',
        cost: 0.15,
        duration: 120,
        summary: 'Customer interested in product demo.',
        transcript: 'Agent: Hello... Customer: Yes I would like a demo...',
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
      },
      {
        id: 'mock-call-2',
        org_id: org.id,
        status: 'completed',
        cost: 0.05,
        duration: 45,
        summary: 'Voicemail left.',
        transcript: 'Agent: Hello... [Beep]',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      }
    ]);

  if (callError) {
    console.warn('Warning creating calls (table might be missing org_id or different schema):', callError.message);
  } else {
    console.log('✅ Mock calls created');
  }

  console.log('🚀 Staging Seed Completed!');
}

seedStaging();
