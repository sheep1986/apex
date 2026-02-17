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
  const [timedOut, setTimedOut] = useState(false);

  // Timeout: if isLoaded never becomes true (dbUser stuck null), proceed after 8s
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const ready = isLoaded || timedOut;
    // Only check onboarding status if user is signed in and we're not already on the onboarding page
    if (ready && isSignedIn && user?.id && location.pathname !== '/onboarding') {
      checkOnboarding(user.id);
    } else if (ready && isSignedIn && location.pathname === '/onboarding') {
      // If we're already on onboarding, skip the check
      setOnboardingChecked(true);
      setNeedsOnboarding(false);
    } else if (ready) {
      setOnboardingChecked(true);
    }
  }, [isLoaded, isSignedIn, user?.id, location.pathname, timedOut]);

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

  const ready = isLoaded || timedOut;

  // Show loading spinner while checking auth (max 8 seconds)
  if (!ready || !onboardingChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
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
