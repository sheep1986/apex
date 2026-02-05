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

async function updateClerkId() {
  console.log('🔧 Updating Clerk ID for seanwentz99@gmail.com...\n');
  
  const clerkUserId = 'user_30YowJ7d9kTMTfyzUZFVkFv7tCZ'; // From Manus
  const email = 'seanwentz99@gmail.com';
  
  try {
    // Update the clerk_id
    const { data, error } = await supabase
      .from('users')
      .update({ clerk_id: clerkUserId })
      .eq('email', email)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating clerk_id:', error);
      return;
    }
    
    console.log('✅ Successfully updated Clerk ID!');
    console.log('Updated user:', {
      email: data.email,
      role: data.role,
      clerk_id: data.clerk_id
    });
    
    // Verify the update
    const { data: verifyData } = await supabase
      .from('users')
      .select('email, role, clerk_id')
      .eq('clerk_id', clerkUserId)
      .single();
    
    console.log('\n✅ Verification - User can now be found by Clerk ID:', verifyData);
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

updateClerkId();