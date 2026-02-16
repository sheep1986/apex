import { useUser } from '@/hooks/auth';
import { supabase } from '@/services/supabase-client';
import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

export interface UserContextType {
  userContext: {
    firstName?: string;
    lastName?: string;
    organizationName?: string;
    organization_id?: string;
    email?: string;
    role?: string;
    plan?: string;
    subscription_status?: string;
    included_minutes?: number;
    max_phone_numbers?: number;
    max_assistants?: number;
    max_concurrent_calls?: number;
  } | null;
  setUserContext: (context: any) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const MinimalUserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userContext, setUserContext] = useState(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    // Only update if user ID changes to prevent infinite loops
    const currentUserId = user?.id || user?.email || null;
    
    if (isLoaded && user && currentUserId !== lastUserId) {
      setLastUserId(currentUserId);
      
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
        role: user.role || 'client_user', // Use role from Supabase database
      };
      
      // Initialize Voice Service
      if (userInfo.organization_id) {
          import('./voice-service').then(({ voiceService }) => {
              voiceService.initializeWithOrganization(userInfo.organization_id!)
                  .then((success) => {
                      if (!success) {
                          console.warn('⚠️ Voice Service Initialization Failed (Likely no API Key)');
                      }
                  })
                  .catch(err => console.error('❌ Voice Service Initialization Error:', err));
          });

          // Fetch org plan info
          supabase
            .from('organizations')
            .select('plan, subscription_status, included_minutes, max_phone_numbers, max_assistants, max_concurrent_calls')
            .eq('id', userInfo.organization_id)
            .single()
            .then(({ data: org }) => {
              if (org) {
                setUserContext((prev: any) => prev ? { ...prev, ...org } : prev);
              }
            })
            .catch(() => {});
      } else {
          console.warn('⚠️ No Organization ID found for Voice Service Initialization');
      }

      setUserContext(userInfo);
    } else if (isLoaded && !user && lastUserId !== null) {
      setLastUserId(null);
      setUserContext(null);
    }
  }, [user?.id, user?.email, isLoaded, lastUserId]);

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
