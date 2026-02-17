import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../services/MinimalUserProvider';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

export const RoleBasedRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { userContext } = useUserContext();
  const { user, loading } = useSupabaseAuth();
  const [waited, setWaited] = useState(false);

  // Timeout fallback: if role doesn't load within 5s, redirect to dashboard
  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // If no auth user at all, go to login
    if (!loading && !user) {
      navigate('/login', { replace: true });
      return;
    }

    const role = userContext?.role?.toLowerCase();

    // If role is loaded, redirect based on it
    if (role) {
      switch (role) {
        case 'platform_owner':
          navigate('/platform', { replace: true });
          break;
        case 'agency_owner':
        case 'agency_admin':
        case 'agency_user':
          navigate('/agency', { replace: true });
          break;
        case 'org_owner':
        case 'org_admin':
        case 'client_admin':
        case 'client_user':
        default:
          navigate('/dashboard', { replace: true });
          break;
      }
      return;
    }

    // If we've waited long enough and still no role, fall back to dashboard
    if (waited && user) {
      console.warn('RoleBasedRedirect: timed out waiting for role, falling back to /dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [userContext?.role, navigate, user, loading, waited]);

  // Show loading while determining redirect
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500"></div>
        <p className="text-gray-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};
