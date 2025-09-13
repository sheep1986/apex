import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/auth';

interface AuthRedirectProps {
  children: React.ReactNode;
}

// This component prevents signed-in users from accessing auth pages
export const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  
  // Show loading while checking auth
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

  // If already signed in, redirect to dashboard
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not signed in, show the auth page
  return <>{children}</>;
};