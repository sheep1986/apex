import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser, useAuth } from '../hooks/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn, user } = useAuth();

  // Show loading spinner while checking auth
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

  // Check if user authentication failed due to database issue
  const authData = useUser() as any;
  if (authData.error === 'USER_NOT_IN_DATABASE') {
    return <Navigate to="/unauthorized" replace />;
  }

  // If not authenticated, redirect to login
  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
