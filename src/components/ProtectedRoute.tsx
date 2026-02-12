import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser, useAuth } from '../hooks/auth';
import { supabase } from '../services/supabase-client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    // Only check onboarding status if user is signed in and we're not already on the onboarding page
    if (isLoaded && isSignedIn && user?.id && location.pathname !== '/onboarding') {
      checkOnboarding(user.id);
    } else if (isLoaded && isSignedIn && location.pathname === '/onboarding') {
      // If we're already on onboarding, skip the check
      setOnboardingChecked(true);
      setNeedsOnboarding(false);
    } else {
      setOnboardingChecked(true);
    }
  }, [isLoaded, isSignedIn, user?.id, location.pathname]);

  const checkOnboarding = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, organization_id')
        .eq('id', userId)
        .single();

      if (profile && profile.onboarding_completed !== true) {
        // User hasn't completed onboarding
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }
    } catch (err) {
      // If we can't check (e.g. column doesn't exist yet), don't block the user
      console.warn('Onboarding check failed, proceeding:', err);
      setNeedsOnboarding(false);
    } finally {
      setOnboardingChecked(true);
    }
  };

  // Show loading spinner while checking auth
  if (!isLoaded || !onboardingChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If needs onboarding and not already on the onboarding page
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};
