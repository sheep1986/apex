import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import { DevAuthProvider } from './services/dev-auth';
import App from './App.tsx';
import './index.css';
import './i18n'; // Initialize i18n
import { ErrorBoundary } from './components/ErrorBoundary';
import { MinimalUserProvider } from './services/MinimalUserProvider';

// Check if we should use dev auth (for development/testing)
const USE_DEV_AUTH = import.meta.env.VITE_USE_DEV_AUTH === 'true';

// Get Clerk publishable key
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Authentication mode is configured via environment variables

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
      ) : clerkPubKey ? (
        <ClerkProvider publishableKey={clerkPubKey}>
          <MinimalUserProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </MinimalUserProvider>
        </ClerkProvider>
      ) : (
        <SupabaseAuthProvider>
          <MinimalUserProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </MinimalUserProvider>
        </SupabaseAuthProvider>
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
