import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.log('\n📝 Manual fix instructions:');
  console.log('1. Go to Supabase SQL Editor at: https://supabase.com/dashboard/project/twigokrtbvigiqnaybfy/sql');
  console.log('2. Run this query to test:');
  console.log("   SELECT * FROM users WHERE email = 'sean@artificialmedia.co.uk';");
  console.log('\n3. If you get infinite recursion error, run:');
  console.log('   ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
  console.log('\n4. Then test the query again. It should work.');
  console.log('\n5. After fixing, re-run the authentication test.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function fixRLSPolicies() {
  console.log('🔧 Starting RLS Policy Fix...\n');

  try {
    // Step 1: Test the problematic query
    console.log('🧪 Testing user query...');
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'sean@artificialmedia.co.uk')
      .single();

    if (testError && testError.message.includes('infinite recursion')) {
      console.log('❌ Confirmed: Infinite recursion error detected');
      console.log('\n📝 To fix this issue:');
      console.log('1. Go to Supabase SQL Editor');
      console.log('2. Run: ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
      console.log('3. This will temporarily disable RLS and fix the issue');
      console.log('4. After testing, you can re-enable with proper policies');
    } else if (testError) {
      console.error('❌ Different error:', testError.message);
    } else {
      console.log('✅ User query successful! No infinite recursion detected');
      console.log('User found:', testUser?.email, '- Role:', testUser?.role);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixRLSPolicies();