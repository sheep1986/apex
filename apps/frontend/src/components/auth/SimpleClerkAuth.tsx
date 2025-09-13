import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function SimpleClerkAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      navigate('/login', { replace: true });
      return;
    }

    // Get role from Clerk metadata or database
    const clerkRole = user?.publicMetadata?.role as string;
    const orgId = user?.publicMetadata?.organizationId as string;
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    
    console.log('Auth check:', {
      email: userEmail,
      role: clerkRole,
      organizationId: orgId,
      metadata: user?.publicMetadata
    });
    
    // Store organization info in session for easy access
    if (orgId) {
      sessionStorage.setItem('organizationId', orgId);
      sessionStorage.setItem('organizationName', user?.publicMetadata?.organizationName as string || '');
      sessionStorage.setItem('userRole', clerkRole || 'user');
    }
    
    // Route based on role
    if (clerkRole === 'platform_owner') {
      console.log('Redirecting to platform (owner)');
      navigate('/platform', { replace: true });
    } else if (clerkRole === 'user_admin' || clerkRole === 'client_admin') {
      console.log('Redirecting to dashboard (admin)');
      navigate('/dashboard', { replace: true });
    } else {
      // Default to dashboard for other users
      console.log('Redirecting to dashboard (default)');
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, isSignedIn, user, navigate]);

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

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">Redirecting to your dashboard...</h2>
      </div>
    </div>
  );
}