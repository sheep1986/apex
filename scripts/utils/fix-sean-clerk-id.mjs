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

async function fixSeanClerkId() {
  console.log('🔧 Fixing Sean\'s Clerk ID...\n');
  
  const correctClerkId = 'user_2zVJzaukJKKI2vfeC1Zuj874HHq'; // From Clerk UI
  const email = 'sean@artificialmedia.co.uk';
  
  try {
    // Update the clerk_id
    const { data, error } = await supabase
      .from('users')
      .update({ clerk_id: correctClerkId })
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
      .eq('clerk_id', correctClerkId)
      .single();
    
    console.log('\n✅ Verification - Platform owner can now be found by Clerk ID:', verifyData);
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

fixSeanClerkId();