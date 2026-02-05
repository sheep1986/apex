import { useAuth, useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Valid roles in the system
 */
type UserRole = 'platform_owner' | 'agency_owner' | 'client_admin' | 'client_user' | 'agency_admin' | 'agency_user';

/**
 * AuthenticatedApp component
 * 
 * Handles post-login routing based on user role and organization context.
 * This component should be the target of the auth redirect.
 */
export function AuthenticatedApp() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [isChecking, setIsChecking] = useState(true);
  
  // Wait for user data to be fully loaded
  useEffect(() => {
    if (isLoaded) {
      // Small timeout to ensure everything is settled if needed, 
      // but usually isLoaded is enough.
      setIsChecking(false);
    }
  }, [isLoaded]);

  // Bootstrap User (Create Org + Credits if missing)
  useEffect(() => {
    const bootstrapUser = async () => {
      if (isLoaded && isSignedIn && user && !user.publicMetadata?.organizationId) {
        console.log('🚀 Bootstrapping user...');
        try {
          const response = await fetch('/api/bootstrap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              firstName: user.firstName,
              lastName: user.lastName
            })
          });
          
          if (response.ok) {
            console.log('✅ Bootstrap success, reloading user...');
            await user.reload();
          } else {
            console.error('❌ Bootstrap failed', await response.text());
          }
        } catch (error) {
          console.error('❌ Bootstrap error', error);
        }
      }
    };
    
    bootstrapUser();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-green-500"></div>
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }
  
  // Get role from Clerk metadata
  // We use publicMetadata as it can be read on frontend
  const role = (user?.publicMetadata?.role as string) || 'client_user'; 
  const orgId = user?.publicMetadata?.organizationId as string;
  
  // Store in session storage for usage in non-React code (e.g. API services)
  sessionStorage.setItem('userRole', role);
  if (orgId) {
    sessionStorage.setItem('orgId', orgId);
  }
  
  console.log('🔐 AuthenticatedApp: User authenticated', {
    role,
    orgId,
    email: user.primaryEmailAddress?.emailAddress
  });

  // Direct routing based on role
  switch (role as UserRole) {
    case 'platform_owner':
      return <Navigate to="/platform" replace />;
      
    case 'agency_owner':
    case 'agency_admin':
    case 'agency_user':
      // Agencies might have their own dashboard or shared one
      return <Navigate to="/agency" replace />;
      
    case 'client_admin':
    case 'client_user':
    default:
      if (orgId) {
        return <Navigate to={`/org/${orgId}/dashboard`} replace />;
      } else {
        // Fallback if no org ID (shouldn't happen for valid users)
        // Check if we can find one in the list?
        // For now, go to dashboard and let it handle "no org" state
        return <Navigate to="/dashboard" replace />;
      }
  }
}
