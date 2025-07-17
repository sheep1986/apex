import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@/hooks/auth';

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

export const MinimalUserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userContext, setUserContext] = useState(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      // Use data from the auth system (dev or clerk)
      const userInfo = {
        firstName: user.firstName || 'User',
        lastName: user.lastName || '',
        organizationName: 'Artificial Media',
        email:
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress ||
          'user@example.com',
        role: user.role || 'platform_owner', // Use role from dev auth system
      };

      // Set token for API calls
      localStorage.setItem('auth_token', 'test-token');

      setUserContext(userInfo);
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
