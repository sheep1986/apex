import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../services/MinimalUserProvider';

export const RoleBasedRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { userContext } = useUserContext();

  useEffect(() => {
    if (!userContext?.role) {
      console.log('🔄 RoleBasedRedirect: No role detected, waiting...');
      return;
    }

    const userRole = userContext.role.toLowerCase();
    console.log('🎯 RoleBasedRedirect: Redirecting based on role:', userRole);

    // Role-based redirect logic
    switch (userRole) {
      case 'platform_owner':
        console.log('→ Redirecting to Platform Owner Dashboard');
        navigate('/platform', { replace: true });
        break;

      case 'agency_owner':
      case 'agency_admin':
      case 'agency_user':
        console.log('→ Redirecting to Agency Dashboard');
        navigate('/agency', { replace: true });
        break;

      case 'client_admin':
      case 'client_user':
      default:
        console.log('→ Redirecting to Client Dashboard');
        navigate('/dashboard', { replace: true });
        break;
    }
  }, [userContext?.role, navigate]);

  // Show loading while determining redirect
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
        <p className="text-gray-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};
