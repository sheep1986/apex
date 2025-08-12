// Quick script to enable dev auth mode
console.log('🔧 Enabling dev auth mode...');

// Enable dev auth
localStorage.setItem('dev-auth-enabled', 'true');
localStorage.setItem('dev-auth-role', 'client_admin');

console.log('✅ Dev auth enabled!');
console.log('   Role: client_admin');
console.log('   Organization: Test Corp (0f88ab8a-b760-4c2a-b289-79b54d7201cf)');
console.log('');
console.log('🔄 Reloading page to apply changes...');

// Reload after a short delay to show the message
setTimeout(() => {
  location.reload();
}, 2000);