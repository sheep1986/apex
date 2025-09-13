import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Simple authentication flow that routes users based on their Clerk metadata
 * No complex state management, no infinite loops, just direct routing
 */
export function SimpleAuthFlow() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      navigate('/login', { replace: true });
      return;
    }

    // Get user data from Clerk public metadata
    const role = user?.publicMetadata?.role as string || 'client_user';
    const orgId = user?.publicMetadata?.organizationId as string;
    const orgName = user?.publicMetadata?.organizationName as string;

    // Store in session for quick access (no re-renders!)
    sessionStorage.setItem('userRole', role);
    sessionStorage.setItem('orgId', orgId || '');
    sessionStorage.setItem('orgName', orgName || '');

    // Direct routing based on role
    switch (role) {
      case 'platform_owner':
        navigate('/platform', { replace: true });
        break;
      
      case 'agency_owner':
      case 'agency_admin':
      case 'agency_user':
        navigate(`/org/${orgId}/agency`, { replace: true });
        break;
      
      case 'client_admin':
      case 'client_user':
      default:
        navigate(`/org/${orgId}/dashboard`, { replace: true });
        break;
    }
  }, [isLoaded, isSignedIn, user, navigate]);

  // Simple loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // While redirecting
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Redirecting to your dashboard...</h2>
        <p className="text-gray-400">Organization: {sessionStorage.getItem('orgName') || 'Loading...'}</p>
      </div>
    </div>
  );
}