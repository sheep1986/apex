import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';

export const PortalRedirect = () => {
  const navigate = useNavigate();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Wait for both auth and user to be loaded
    if (!authLoaded || !userLoaded) {
      return;
    }

    // If not signed in, go to login
    if (!isSignedIn) {
      navigate('/login', { replace: true });
      return;
    }

    // Prevent multiple redirects
    if (isRedirecting) {
      return;
    }

    setIsRedirecting(true);

    // Use window.location to ensure full page reload and proper routing
    setTimeout(() => {
      window.location.href = '/platform';
    }, 500);
  }, [authLoaded, userLoaded, isSignedIn, navigate, isRedirecting]);

  // Show nothing while loading to prevent flashing
  if (!authLoaded || !userLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-white">Redirecting...</h2>
        {user && (
          <p className="text-gray-400 mt-2">Welcome back, {user.emailAddresses?.[0]?.emailAddress}</p>
        )}
      </div>
    </div>
  );
};