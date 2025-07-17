import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser, useAuth } from '../hooks/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  // Use test-token for development instead of real Clerk tokens
  React.useEffect(() => {
    if (isSignedIn) {
      // Use test-token since backend is configured for it
      localStorage.setItem('auth_token', 'test-token');
      console.log('🔑 Set development authentication token (test-token)');
    }
  }, [isSignedIn, getToken]);

  // Show loading spinner while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not signed in, redirect to landing page
  if (!isSignedIn) {
    // Temporary: Allow test-token for development
    const hasTestToken = localStorage.getItem('auth_token') === 'test-token';
    if (!hasTestToken) {
      return <Navigate to="/" replace />;
    }
  }

  // If signed in, render the protected content
  return <>{children}</>;
};
