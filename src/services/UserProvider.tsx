import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, useUser } from '@/hooks/auth';

export interface UserContextType {
  userContext: {
    firstName?: string;
    lastName?: string;
    organizationName?: string;
    email?: string;
    role?: string;
  } | null;
  setUserContext: (context: any) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const UserContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { getToken, isSignedIn } = useAuth();
  const { user, isLoaded } = useUser();
  const [userContext, setUserContext] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoaded) {
        console.log('🔄 Waiting for Clerk to load...');
        return;
      }

      if (!isSignedIn || !user) {
        console.log('🚪 User not signed in, clearing context');
        setUserContext(null);
        return;
      }

      console.log(
        '🔧 Fetching real user data from API for:',
        user.primaryEmailAddress?.emailAddress
      );

      try {
        // Get real Clerk token
        const token = await getToken();

        if (!token) {
          console.error('❌ No Clerk token available');
          setUserContext(null);
          return;
        }

        console.log('🔑 Got Clerk token, making API request...');

        // Clear any old development tokens
        localStorage.removeItem('simulate_owner');
        localStorage.removeItem('dev_auth_mode');

        const response = await fetch(`${API_BASE_URL}/user-profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ Got real user data from API:', userData);

          // Use real data from API with proper role detection
          const userEmail = userData.email || user.primaryEmailAddress?.emailAddress || '';
          const isPlatformOwnerEmail =
            userEmail === 'sean@artificialmedia.co.uk' || userEmail === 'sean@apex-ai.com';

          const newContext = {
            firstName: userData.first_name || user.firstName || '',
            lastName: userData.last_name || user.lastName || '',
            organizationName: userData.organization_name || '',
            email: userEmail,
            role: isPlatformOwnerEmail ? 'platform_owner' : userData.role || 'client_user',
          };

          console.log('🔄 Setting real user context:', newContext);
          console.log('🔍 Final role assigned:', newContext.role);

          // Temporarily store role for API client token selection
          localStorage.setItem('user_role', newContext.role);

          setUserContext(newContext);
        } else {
          console.error('❌ API returned error:', response.status, response.statusText);

          // Fallback using Clerk data only
          const userEmail = user.primaryEmailAddress?.emailAddress || '';
          const isPlatformOwnerEmail =
            userEmail === 'sean@artificialmedia.co.uk' || userEmail === 'sean@apex-ai.com';

          const fallbackContext = {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            organizationName: isPlatformOwnerEmail ? 'Artificial Media' : '',
            email: userEmail,
            role: isPlatformOwnerEmail ? 'platform_owner' : 'client_user',
          };

          console.log('⚠️ Using Clerk fallback context:', fallbackContext);
          setUserContext(fallbackContext);
        }
      } catch (error) {
        console.error('❌ Error fetching user data:', error);

        // Emergency fallback using Clerk data
        const userEmail = user.primaryEmailAddress?.emailAddress || '';
        const isPlatformOwnerEmail =
          userEmail === 'sean@artificialmedia.co.uk' || userEmail === 'sean@apex-ai.com';

        const emergencyContext = {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          organizationName: isPlatformOwnerEmail ? 'Artificial Media' : '',
          email: userEmail,
          role: isPlatformOwnerEmail ? 'platform_owner' : 'client_user',
        };

        console.log('🆘 Using emergency Clerk context:', emergencyContext);
        setUserContext(emergencyContext);
      }
    };

    fetchUserData();
  }, [isLoaded, isSignedIn, user, getToken]); // React to auth state changes

  return (
    <UserContext.Provider value={{ userContext, setUserContext }}>{children}</UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};
