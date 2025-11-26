import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { MinimalUserProvider } from './services/MinimalUserProvider';
import App from './App';
import './index.css';

// Add diagnostic logging
console.log('main.tsx: Starting application initialization');
console.log('main.tsx: Environment:', {
  NODE_ENV: import.meta.env.MODE,
  VITE_CLERK_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Present' : 'Missing',
  VITE_API_URL: import.meta.env.VITE_API_URL || 'Missing',
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'Missing'
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_dW5pdGVkLWNob3ctMTMuY2xlcmsuYWNjb3VudHMuZGV2JA';

console.log('main.tsx: Clerk key configured:', clerkPubKey ? 'Yes' : 'No');

// Router bridge component to give Clerk access to React Router navigation
function ClerkWithRouterBridge() {
  console.log('main.tsx: ClerkWithRouterBridge component rendering');
  const navigate = useNavigate();
  
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
      signInUrl="/login"
      signUpUrl="/signup"
      // These prevent full page reloads during MFA
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <MinimalUserProvider>
        <App />
      </MinimalUserProvider>
    </ClerkProvider>
  );
}

// Error boundary to catch any rendering errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#0a0a0a' }}>
          <h1>Application Error</h1>
          <pre style={{ color: 'red' }}>{this.state.error?.toString()}</pre>
          <p>Check the browser console for details.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Diagnostic component if all else fails
function DiagnosticApp() {
  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#0a0a0a', fontFamily: 'monospace' }}>
      <h1>Apex AI - Diagnostic Mode</h1>
      <p>React is running but there may be an initialization issue.</p>
      <h2>Environment Variables:</h2>
      <pre>{JSON.stringify({
        MODE: import.meta.env.MODE,
        CLERK_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? 'Present' : 'Missing',
        API_URL: import.meta.env.VITE_API_URL || 'Missing',
        SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'Missing',
        BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'Missing',
        USE_DEV_AUTH: import.meta.env.VITE_USE_DEV_AUTH || 'Missing'
      }, null, 2)}</pre>
      <h2>Attempting to load main app...</h2>
    </div>
  );
}

console.log('main.tsx: Looking for root element');
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('main.tsx: Root element not found!');
  document.body.innerHTML = '<div style="color: white; padding: 20px;">Error: Root element not found in DOM</div>';
} else {
  console.log('main.tsx: Root element found, creating React root');
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('main.tsx: React root created, attempting render');
    
    // Try rendering with full app
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <BrowserRouter>
            <ClerkWithRouterBridge />
          </BrowserRouter>
        </ErrorBoundary>
      </React.StrictMode>
    );
    
    console.log('main.tsx: Render method called successfully');
  } catch (error) {
    console.error('main.tsx: Fatal error during render:', error);
    
    // Fallback to diagnostic mode
    try {
      const root = ReactDOM.createRoot(rootElement);
      root.render(<DiagnosticApp />);
      console.log('main.tsx: Rendered diagnostic app');
    } catch (fallbackError) {
      console.error('main.tsx: Even diagnostic app failed:', fallbackError);
      rootElement.innerHTML = `<div style="color: white; padding: 20px;">
        <h1>Critical Error</h1>
        <p>Failed to initialize React application</p>
        <pre>${fallbackError}</pre>
      </div>`;
    }
  }
}

console.log('main.tsx: Script execution completed');