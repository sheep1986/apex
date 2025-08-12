import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { MinimalUserProvider } from './services/MinimalUserProvider';
import App from './App';
import './index.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

// Router bridge component to give Clerk access to React Router navigation
function ClerkWithRouterBridge() {
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkWithRouterBridge />
    </BrowserRouter>
  </React.StrictMode>
);