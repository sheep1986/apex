const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runEmergencyFix() {
  console.log('🚨 Running Emergency RLS Fix...');
  console.log('Supabase URL:', process.env.SUPABASE_URL);
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in backend/.env');
    console.log('\nTo fix this:');
    console.log('1. Go to Supabase Dashboard → Settings → API');
    console.log('2. Copy the "service_role" key (starts with eyJ...)');
    console.log('3. Add to apps/backend/.env:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=eyJ...');
    return;
  }
  
  try {
    // Test connection first
    console.log('\n📊 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      if (testError.message.includes('infinite recursion')) {
        console.log('❌ CONFIRMED: RLS infinite recursion detected!');
        console.log('\nThis is blocking authentication. We need to disable RLS.');
        console.log('\nPlease run this SQL in Supabase Dashboard → SQL Editor:');
        console.log('\n--- COPY AND RUN THIS SQL ---');
        console.log('ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;');
        console.log('ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;');
        console.log('--- END SQL ---\n');
      } else {
        console.error('❌ Connection error:', testError.message);
      }
      return;
    }
    
    // If we got here, RLS might already be disabled
    console.log('✅ Supabase connection successful!');
    
    // Test user query
    console.log('\n🧪 Testing user query for sean@artificialmedia.co.uk...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'sean@artificialmedia.co.uk')
      .single();
    
    if (userError) {
      if (userError.code === 'PGRST116') {
        console.log('⚠️  User not found in database');
        console.log('\nThis might mean:');
        console.log('1. User exists in Clerk but not synced to Supabase');
        console.log('2. Different email in database');
        console.log('3. Users table is empty');
        
        // Check if any users exist
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        console.log(`\nTotal users in database: ${count || 0}`);
      } else {
        console.error('❌ User query failed:', userError.message);
      }
    } else {
      console.log('✅ User found successfully!');
      console.log('Email:', userData.email);
      console.log('Role:', userData.role);
      console.log('Organization:', userData.organization_id);
      console.log('\n🎉 Database is accessible! You can proceed with authentication implementation.');
    }
    
    // Check which tables exist
    console.log('\n📋 Checking existing tables...');
    const tables = ['users', 'profiles', 'user_profiles', 'organizations', 'calls', 'campaigns'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log(`❌ Table '${table}' does not exist`);
      } else if (error) {
        console.log(`⚠️  Table '${table}' exists but has issues:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible`);
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err.stack);
  }
}

runEmergencyFix();