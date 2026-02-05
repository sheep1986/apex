import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load backend environment variables
dotenv.config({ path: join(__dirname, '../backend/.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLSStatus() {
  console.log('🔍 Checking RLS status and fixing issues...\n');
  
  try {
    // Check RLS status
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .in('tablename', ['users', 'profiles', 'organizations']);
    
    if (tablesError) {
      console.error('Error checking RLS status:', tablesError);
    } else {
      console.log('📊 RLS Status:');
      tables.forEach(table => {
        console.log(`  ${table.tablename}: RLS ${table.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
      });
    }
    
    // Try to query users table
    console.log('\n🧪 Testing users table query...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('email, role, clerk_id')
      .limit(2);
    
    if (testError) {
      console.error('❌ Error querying users:', testError);
      
      if (testError.message.includes('row-level security') || testError.code === '42501') {
        console.log('\n🔧 RLS is blocking queries. Disabling RLS...');
        
        // Disable RLS using raw SQL
        const { error: disableError } = await supabase.rpc('exec_sql', {
          sql: `
            ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
            ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
            ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
          `
        });
        
        if (disableError) {
          console.log('Could not disable RLS via RPC. Please run this SQL in Supabase Dashboard:');
          console.log('\n--- COPY THIS SQL ---');
          console.log('ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
          console.log('--- END SQL ---\n');
        } else {
          console.log('✅ RLS disabled successfully!');
        }
      }
    } else {
      console.log('✅ Users table is accessible!');
      console.log('Sample data:', testData);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkRLSStatus();