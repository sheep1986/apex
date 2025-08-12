const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
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
    // Step 1: Check current policies
    console.log('📋 Step 1: Checking current RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies_for_table', { table_name: 'users' });
    
    if (policiesError) {
      // Try alternative query
      const { data: altPolicies, error: altError } = await supabase.rpc('query', {
        query: "SELECT policyname, qual FROM pg_policies WHERE tablename = 'users';"
      });
      
      if (altError) {
        console.log('⚠️  Could not fetch policies, but continuing...');
      } else {
        console.log('Current policies:', altPolicies);
      }
    } else {
      console.log('Current policies:', policies);
    }

    // Step 2: Test the problematic query
    console.log('\n🧪 Step 2: Testing user query...');
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'sean@artificialmedia.co.uk')
      .single();

    if (testError && testError.message.includes('infinite recursion')) {
      console.log('❌ Confirmed: Infinite recursion error detected');
      console.log('🚑 Applying emergency fix...\n');

      // Step 3: Emergency fix - disable RLS temporarily
      console.log('🔓 Step 3: Temporarily disabling RLS on users table...');
      const { error: disableError } = await supabase.rpc('query', {
        query: 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;'
      });

      if (disableError) {
        console.error('❌ Failed to disable RLS:', disableError);
        console.log('\n📝 Manual fix required in Supabase dashboard:');
        console.log('1. Go to Supabase SQL Editor');
        console.log('2. Run: ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
        console.log('3. Then re-run this script');
        return;
      }

      console.log('✅ RLS disabled successfully');

      // Step 4: Test again
      console.log('\n🧪 Step 4: Testing query again...');
      const { data: retestUser, error: retestError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'sean@artificialmedia.co.uk')
        .single();

      if (retestError) {
        console.error('❌ Still getting error:', retestError);
      } else {
        console.log('✅ User query successful!');
        console.log('User data:', retestUser);
      }

      console.log('\n⚠️  IMPORTANT: RLS is now disabled on the users table');
      console.log('This is temporary. To re-enable with safe policies:');
      console.log('1. Go to Supabase SQL Editor');
      console.log('2. Run the safe policies from supabase-rls-fix.sql');
      console.log('3. Re-enable RLS: ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;');

    } else if (testError) {
      console.error('❌ Different error:', testError);
    } else {
      console.log('✅ User query successful! No infinite recursion detected');
      console.log('User data:', testUser);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixRLSPolicies();