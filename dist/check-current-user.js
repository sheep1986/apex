// Script to check the current user and their organization
console.log('🔍 Checking current user authentication...');

async function checkCurrentUser() {
  try {
    // Check if using dev auth
    const USE_DEV_AUTH = localStorage.getItem('dev-auth-enabled') === 'true';
    const devRole = localStorage.getItem('dev-auth-role');
    
    if (USE_DEV_AUTH) {
      console.log('✅ Using Dev Auth');
      console.log('   Role:', devRole);
      console.log('   Token:', `test-token-${devRole}`);
      
      // Dev role to org mapping
      const roleOrgMap = {
        'platform_owner': '47a8e3ea-cd34-4746-a786-dd31e8f8105e',
        'agency_owner': '47a8e3ea-cd34-4746-a786-dd31e8f8105e',
        'agency_admin': '47a8e3ea-cd34-4746-a786-dd31e8f8105e',
        'client_admin': '0f88ab8a-b760-4c2a-b289-79b54d7201cf',
        'client_user': '0f88ab8a-b760-4c2a-b289-79b54d7201cf'
      };
      
      console.log('   Expected Org ID:', roleOrgMap[devRole]);
      return;
    }
    
    // Check Clerk auth
    if (window.Clerk && window.Clerk.user) {
      console.log('✅ Using Clerk Auth');
      const user = window.Clerk.user;
      console.log('   User ID:', user.id);
      console.log('   Email:', user.primaryEmailAddress?.emailAddress);
      console.log('   Name:', user.firstName, user.lastName);
      
      // Get the session token
      if (window.Clerk.session) {
        const token = await window.Clerk.session.getToken();
        console.log('   Token:', token ? token.substring(0, 20) + '...' : 'No token');
      }
      
      // Try to fetch user details from backend
      try {
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${await window.Clerk.session.getToken()}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('📋 Backend User Data:', userData);
          console.log('   Organization ID:', userData.organization_id || 'NOT SET ⚠️');
        } else {
          console.log('❌ Failed to fetch user data from backend:', response.status);
        }
      } catch (err) {
        console.log('❌ Error fetching user data:', err.message);
      }
      
      return;
    }
    
    // Check Supabase auth
    const { createClient } = window.supabase;
    if (createClient) {
      const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL || 'https://twigokrtbvigiqnaybfy.supabase.co';
      const supabaseAnonKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase.auth.token');
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('✅ Using Supabase Auth');
          console.log('   User ID:', session.user.id);
          console.log('   Email:', session.user.email);
          console.log('   Token:', session.access_token.substring(0, 20) + '...');
          
          // Check user record in database
          const { data: userRecord, error } = await supabase
            .from('users')
            .select('id, email, organization_id, role, first_name, last_name')
            .eq('id', session.user.id)
            .single();
            
          if (userRecord) {
            console.log('📋 Database User Record:', userRecord);
            console.log('   Organization ID:', userRecord.organization_id || 'NOT SET ⚠️');
            
            if (!userRecord.organization_id) {
              console.log('');
              console.log('⚠️ WARNING: Your user account has no organization_id set!');
              console.log('This is why VAPI endpoints are failing.');
              console.log('');
              console.log('To fix this, run this SQL query in Supabase:');
              console.log(`UPDATE users SET organization_id = '47a8e3ea-cd34-4746-a786-dd31e8f8105e' WHERE id = '${session.user.id}';`);
            }
          } else if (error) {
            console.log('❌ Error fetching user record:', error);
          }
          
          return;
        }
      }
    }
    
    console.log('❌ No authentication found');
    console.log('   Please sign in to continue');
    
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
  }
}

// Run the check
checkCurrentUser();