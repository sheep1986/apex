import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = `test_proof_${Date.now()}@apex.com`;
  const password = 'Password123!';

  console.log(`Creating user: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Error signing up:', error);
    process.exit(1);
  }

  if (data.session) {
    console.log('TOKEN:', data.session.access_token);
    console.log('USER_ID:', data.user.id);
  } else {
    // Maybe auto-confirm is off? Try sign in.
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (loginError) {
        console.error('Login error:', loginError);
        process.exit(1);
    }
    console.log('TOKEN:', loginData.session.access_token);
    console.log('USER_ID:', loginData.user.id);
  }
}

main();
