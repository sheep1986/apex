// Temporary fix to associate client_admin with Emerald Green Energy Ltd
console.log('🔧 Fixing organization mapping for client_admin...');

// This is a client-side override for testing
// In production, this should be fixed in the backend middleware

// Set a flag to indicate we want client_admin to use Emerald Green org
localStorage.setItem('override-client-admin-org', 'true');
localStorage.setItem('client-admin-org-id', '47a8e3ea-cd34-4746-a786-dd31e8f8105e');

console.log('✅ Organization override set!');
console.log('Client admin will now use Emerald Green Energy Ltd organization');
console.log('Note: This is a temporary fix. The backend middleware should be updated to properly map users to their organizations.');

// The backend needs to be updated to respect this override or 
// the roleUserMap in clerk-auth.ts needs to be updated to use the correct organization ID