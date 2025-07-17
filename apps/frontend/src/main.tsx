import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { DevAuthProvider } from './services/dev-auth';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MinimalUserProvider } from './services/MinimalUserProvider';

// Check if we should use dev auth
const USE_DEV_AUTH =
  import.meta.env.VITE_USE_DEV_AUTH === 'true' || !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Get Clerk publishable key - use fallback for development
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_fallback';

if (USE_DEV_AUTH) {
  console.log('🔓 Using Dev Auth Mode - Clerk disabled');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {USE_DEV_AUTH ? (
        <DevAuthProvider>
          <MinimalUserProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </MinimalUserProvider>
        </DevAuthProvider>
      ) : (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <MinimalUserProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </MinimalUserProvider>
        </ClerkProvider>
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
