import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserContext } from '../services/MinimalUserProvider';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/dashboard',
}) => {
  const { userContext } = useUserContext();

  // If user context is not loaded yet, show loading
  if (!userContext) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const userRole = userContext.role?.toLowerCase();
  const hasAccess = allowedRoles.some((role) => role.toLowerCase() === userRole);

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
