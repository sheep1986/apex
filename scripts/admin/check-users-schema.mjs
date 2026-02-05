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

async function checkUsersSchema() {
  console.log('🔍 Checking Supabase users table schema...\n');
  
  try {
    // Get table columns
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' });
    
    if (columnsError) {
      // Try a different approach
      const { data: sample, error: sampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (sample && sample.length > 0) {
        console.log('📊 Users table columns:');
        Object.keys(sample[0]).forEach(col => {
          console.log(`  - ${col}: ${typeof sample[0][col]}`);
        });
      }
    } else {
      console.log('📊 Users table columns:', columns);
    }
    
    // Get all users to understand roles
    console.log('\n👥 Current users in database:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, organization_id, created_at')
      .order('created_at', { ascending: false });
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      users.forEach(user => {
        console.log(`\n  Email: ${user.email}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Organization: ${user.organization_id}`);
        console.log(`  Created: ${new Date(user.created_at).toLocaleDateString()}`);
      });
    }
    
    // Check available roles
    console.log('\n🎭 Unique roles in database:');
    const { data: roles } = await supabase
      .from('users')
      .select('role')
      .order('role');
    
    const uniqueRoles = [...new Set(roles.map(r => r.role))];
    uniqueRoles.forEach(role => {
      console.log(`  - ${role}`);
    });
    
    // Check organizations
    console.log('\n🏢 Organizations in database:');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });
    
    if (orgsError) {
      console.log('  No organizations table or error:', orgsError.message);
    } else {
      orgs.forEach(org => {
        console.log(`\n  ID: ${org.id}`);
        console.log(`  Name: ${org.name}`);
        console.log(`  Created: ${new Date(org.created_at).toLocaleDateString()}`);
      });
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkUsersSchema();