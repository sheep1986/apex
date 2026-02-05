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

async function checkClerkIds() {
  console.log('🔍 Checking Clerk IDs in database...\n');
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, clerk_id')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log('👥 Users and their Clerk IDs:');
    users.forEach(user => {
      console.log(`\n  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Clerk ID: ${user.clerk_id || '❌ NOT SET'}`);
      console.log(`  User ID: ${user.id}`);
    });
    
    // Check if we need to update clerk_ids
    const usersWithoutClerkId = users.filter(u => !u.clerk_id);
    if (usersWithoutClerkId.length > 0) {
      console.log(`\n⚠️  ${usersWithoutClerkId.length} users don't have Clerk IDs set!`);
      console.log('\nTo fix this, we need to update the clerk_id field with the Clerk user IDs.');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkClerkIds();