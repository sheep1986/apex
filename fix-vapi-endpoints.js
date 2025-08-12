// Fix script to update backend VAPI endpoints to handle missing organization IDs
console.log('🔧 This script will help fix the VAPI endpoints issue');
console.log('');
console.log('The issue is that the backend VAPI endpoints are returning 500 errors because:');
console.log('1. The user making the request might not have an organization_id in the database');
console.log('2. The endpoints require an organization_id to fetch VAPI settings');
console.log('');
console.log('To fix this, we need to update the backend endpoints to:');
console.log('1. Return a better error message when organization_id is missing');
console.log('2. Or use a default/test organization for development');
console.log('');
console.log('Please update the following files in the backend:');
console.log('');
console.log('📁 apps/backend/api/vapi-data.ts');
console.log('Change lines 15-20 to:');
console.log(`
    if (!organizationId) {
      console.log('⚠️ User has no organization_id, checking for default...');
      
      // In development, use a default organization for testing
      if (process.env.NODE_ENV === 'development') {
        organizationId = '47a8e3ea-cd34-4746-a786-dd31e8f8105e'; // Emerald Green Corp
        console.log('🔄 Using default organization for development:', organizationId);
      } else {
        return res.status(400).json({ 
          error: 'User not associated with an organization. Please contact your administrator.',
          assistants: [],
          requiresSetup: true
        });
      }
    }
`);
console.log('');
console.log('Apply the same fix to the phone-numbers endpoint at lines 60-65');
console.log('');
console.log('📁 Alternatively, check your user record in the database:');
console.log('1. Make sure your user has an organization_id set');
console.log('2. Run: SELECT id, email, organization_id FROM users WHERE email = YOUR_EMAIL');
console.log('');
console.log('📁 Or update your user in the database:');
console.log("UPDATE users SET organization_id = '47a8e3ea-cd34-4746-a786-dd31e8f8105e' WHERE email = 'YOUR_EMAIL';");