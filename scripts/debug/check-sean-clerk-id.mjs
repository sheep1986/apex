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

async function checkSeanClerkId() {
  console.log('🔍 Checking Sean\'s Clerk IDs...\n');
  
  const clerkIdFromUI = 'user_2zVJzaukJKKI2vfeC1Zuj874HHq';
  
  try {
    // Check by email
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'sean@artificialmedia.co.uk')
      .single();
    
    if (emailError) {
      console.error('Error fetching by email:', emailError);
    } else {
      console.log('✅ User found by email:');
      console.log('  Email:', userByEmail.email);
      console.log('  Role:', userByEmail.role);
      console.log('  DB Clerk ID:', userByEmail.clerk_id);
      console.log('  UI Clerk ID:', clerkIdFromUI);
      console.log('  IDs Match?', userByEmail.clerk_id === clerkIdFromUI);
      
      if (userByEmail.clerk_id !== clerkIdFromUI) {
        console.log('\n⚠️  CLERK IDs DO NOT MATCH!');
        console.log('  This is why the role is showing as client_user');
        console.log('\n  To fix, update the database:');
        console.log(`  UPDATE users SET clerk_id = '${clerkIdFromUI}' WHERE email = 'sean@artificialmedia.co.uk';`);
      }
    }
    
    // Try to fetch by the UI Clerk ID
    const { data: userByClerkId, error: clerkError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkIdFromUI)
      .single();
    
    if (clerkError) {
      console.log('\n❌ No user found with UI Clerk ID:', clerkIdFromUI);
    } else {
      console.log('\n✅ User found by UI Clerk ID:', userByClerkId);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkSeanClerkId();