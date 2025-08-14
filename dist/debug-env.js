// Debug environment variable issue
// Run this in the browser console

console.log('🔍 Debugging Environment Variables...');
console.log('=====================================');

// Check if import.meta.env exists
if (typeof import !== 'undefined' && import.meta && import.meta.env) {
  console.log('✅ import.meta.env exists');
  console.log('📋 All env vars:', import.meta.env);
  console.log('🔑 VITE_USE_DEV_AUTH:', import.meta.env.VITE_USE_DEV_AUTH);
  console.log('🔑 VITE_USE_DEV_AUTH === "true":', import.meta.env.VITE_USE_DEV_AUTH === 'true');
  console.log('🔑 Type of VITE_USE_DEV_AUTH:', typeof import.meta.env.VITE_USE_DEV_AUTH);
} else {
  console.error('❌ import.meta.env is not available');
}

// Check localStorage
console.log('\n📦 LocalStorage Check:');
console.log('dev-auth-role:', localStorage.getItem('dev-auth-role'));

// Try to access window.__VITE_USE_DEV_AUTH__ (sometimes Vite exposes env vars this way)
console.log('\n🪟 Window Check:');
if (window.__VITE_USE_DEV_AUTH__) {
  console.log('window.__VITE_USE_DEV_AUTH__:', window.__VITE_USE_DEV_AUTH__);
}

// Manual test with dev auth
console.log('\n🧪 Manual API Test with Dev Auth:');
console.log('Run testWithDevAuth() to test API with manual dev auth token');

window.testWithDevAuth = async function() {
  try {
    const response = await fetch('/api/vapi-data/assistants', {
      headers: {
        'Authorization': 'Bearer test-token-client_admin',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Response status:', response.status);
    const data = await response.json();
    console.log('✅ Data received:', data);
    console.log('✅ Assistants count:', data.assistants?.length);
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
  }
};