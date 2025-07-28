import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@/hooks/auth';

export interface UserContextType {
  userContext: {
    firstName?: string;
    lastName?: string;
    organizationName?: string;
    organization_id?: string;
    email?: string;
    role?: string;
  } | null;
  setUserContext: (context: any) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const MinimalUserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userContext, setUserContext] = useState(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      console.log('🔍 MinimalUserProvider: User data received:', {
        email: user.email,
        role: user.role,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        organization_id: user.organization_id
      });
      
      // Use data from the auth system (dev or supabase via useUser hook)
      const email = user.primaryEmailAddress?.emailAddress || 
                   user.emailAddresses?.[0]?.emailAddress || 
                   user.email || 
                   'user@example.com';
      
      // Use actual user data from the authentication system
      const userInfo = {
        firstName: user.firstName || user.first_name || 'User',
        lastName: user.lastName || user.last_name || '',
        organizationName: user.organizationName || user.organizations?.name || 'Organization',
        organization_id: user.organization_id,
        email: email,
        role: user.role, // Use actual role from database user
      };
      
      console.log('🎯 MinimalUserProvider: Setting user context:', userInfo);

      // Set token for API calls (dev mode uses role-specific token, supabase uses JWT)
      if (import.meta.env.VITE_USE_DEV_AUTH === 'true') {
        // For dev mode, use the role-specific token
        const devToken = userInfo.role === 'platform_owner' ? 'test-token-platform_owner' : 'test-token';
        localStorage.setItem('auth_token', devToken);
        console.log('🔑 Dev auth token set:', devToken);
      }

      setUserContext(userInfo);
    } else if (isLoaded && !user) {
      setUserContext(null);
    }
  }, [user, isLoaded]);

  return (
    <UserContext.Provider value={{ userContext, setUserContext }}>{children}</UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a MinimalUserProvider');
  }
  return context;
};
