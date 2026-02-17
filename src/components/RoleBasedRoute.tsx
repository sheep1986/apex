import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserContext } from '../services/MinimalUserProvider';

// Routes accessible even when subscription is canceled
const CANCELED_ALLOWED_ROUTES = ['/billing', '/settings', '/logout'];

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
  const location = useLocation();

  // If user context is not loaded yet, show loading
  if (!userContext) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Role check
  const userRole = userContext.role?.toLowerCase();
  const hasAccess = allowedRoles.some((role) => role.toLowerCase() === userRole);

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  // Subscription enforcement: canceled subscriptions can only access billing/settings
  const subscriptionStatus = userContext.subscription_status;
  if (subscriptionStatus === 'canceled') {
    const isAllowed = CANCELED_ALLOWED_ROUTES.some(
      (route) => location.pathname === route || location.pathname.startsWith(route + '/')
    );
    if (!isAllowed) {
      return <Navigate to="/billing" replace />;
    }
  }

  return <>{children}</>;
};
