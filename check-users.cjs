const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from your .env file
const SUPABASE_URL = 'https://twigokrtbvigiqnaybfy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6InNlcnZpY2UiLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.RWx1G9hgb-_kfQM1qSNGRHf0XBe5-IolQhYQPTdJpSI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkUsers() {
  console.log('🔍 Checking for existing users...\n');

  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .limit(5);

  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  if (users && users.length > 0) {
    console.log('✅ Found users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Name: ${user.full_name || 'No name'}`);
      console.log(`  Email: ${user.email || 'No email'}`);
      console.log(`  Role: ${user.role || 'No role'}\n`);
    });
    
    console.log(`\n💡 You can use this user ID in your campaign creation: ${users[0].id}`);
  } else {
    console.log('❌ No users found in the database');
    
    // Try to create a test user
    console.log('\n📝 Creating a test user...');
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'admin'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating user:', createError);
    } else {
      console.log('✅ Test user created:', newUser);
    }
  }
}

checkUsers();