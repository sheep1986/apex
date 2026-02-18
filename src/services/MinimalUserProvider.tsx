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
  const { user } = useUser();

  useEffect(() => {
    // Only update if user ID changes to prevent infinite loops
    const currentUserId = user?.id || user?.email || null;

    if (user && currentUserId !== lastUserId) {
      setLastUserId(currentUserId);

      const resolveAndSetContext = async () => {
        // Use data from the auth system (dev or supabase via useUser hook)
        const email = user.primaryEmailAddress?.emailAddress ||
                     user.emailAddresses?.[0]?.emailAddress ||
                     user.email ||
                     'user@example.com';

        // Use actual user data from the authentication system
        const userInfo: any = {
          firstName: user.firstName || user.first_name || 'User',
          lastName: user.lastName || user.last_name || '',
          organizationName: user.organizationName || user.organizations?.name || 'Organization',
          organization_id: user.organization_id,
          email: email,
          role: user.role || 'client_user', // Use role from Supabase database
        };

        // Fallback: if useUser() returned incomplete data (dbUser failed to load due to
        // AbortError during navigation), query the profile directly to get org + role
        if (!userInfo.organization_id && user.id) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('organization_id, role, full_name')
              .eq('id', user.id)
              .single();

            if (profile) {
              if (profile.organization_id) {
                userInfo.organization_id = profile.organization_id;
              }
              if (profile.role) {
                userInfo.role = profile.role;
              }
              if (profile.full_name) {
                const parts = profile.full_name.split(' ');
                userInfo.firstName = parts[0] || userInfo.firstName;
                userInfo.lastName = parts.slice(1).join(' ') || userInfo.lastName;
              }
              console.log('✅ Resolved user context from direct profile query fallback');
            }
          } catch {
            console.warn('⚠️ Direct profile query fallback failed');
          }
        }

        // Fallback 2: if STILL no organization_id, check organization_members table
        if (!userInfo.organization_id && user.id) {
          try {
            const { data: membership } = await supabase
              .from('organization_members')
              .select('organization_id')
              .eq('user_id', user.id)
              .limit(1)
              .single();

            if (membership?.organization_id) {
              userInfo.organization_id = membership.organization_id;
              console.log('✅ Resolved organization_id from organization_members fallback');
            }
          } catch {
            // No membership found — user genuinely has no org yet
            console.warn('⚠️ No organization found for user via fallback');
          }
        }

        // Set context immediately so downstream components get data
        setUserContext(userInfo);

        // Initialize Voice Service + fetch org plan info
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
      };

      resolveAndSetContext();
    } else if (!user && lastUserId !== null) {
      setLastUserId(null);
      setUserContext(null);
    }
  }, [user?.id, user?.email, lastUserId]);

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
