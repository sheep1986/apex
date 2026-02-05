// Centralized auth imports that switch between Supabase and Dev Auth
import { useUser as useDevUser, useAuth as useDevAuth, useDevRole as useDevRoleHook } from '../services/dev-auth';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useUser as useClerkUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { supabaseService } from '../services/supabase-service';

const USE_DEV_AUTH = import.meta.env.VITE_USE_DEV_AUTH === 'true';
const USE_CLERK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && !USE_DEV_AUTH;

export function useUser() {
  const [dbUser, setDbUser] = useState<any>(null);
  const [hasFetched, setHasFetched] = useState(false);
  
  if (USE_DEV_AUTH) {
    return useDevUser();
  } else if (USE_CLERK) {
    const clerkUser = useClerkUser();
    
    // Fetch database user when Clerk user is loaded (only once)
    useEffect(() => {
      if (clerkUser.isSignedIn && clerkUser.user && !hasFetched) {
        setHasFetched(true);
        // console.log('🔍 Fetching DB user for Clerk ID:', clerkUser.user.id);
        // Fetch user from database by clerk ID or email
        supabaseService.getUserByClerkId(clerkUser.user.id)
          .then(async (user) => {
            // console.log('✅ DB user fetched by Clerk ID:', user);
            if (!user && clerkUser.user.primaryEmailAddress?.emailAddress) {
              // Fallback: try to fetch by email
              // console.log('🔄 Trying to fetch by email:', clerkUser.user.primaryEmailAddress.emailAddress);
              const userByEmail = await supabaseService.getUserByEmail(clerkUser.user.primaryEmailAddress.emailAddress);
              // console.log('✅ DB user fetched by email:', userByEmail);
              setDbUser(userByEmail);
            } else {
              setDbUser(user);
            }
          })
          .catch(err => {
            // Only log if it's not a 404 (user not found)
            if (!err.message?.includes('404')) {
              console.error('❌ Error fetching db user:', err);
            }
          });
      }
    }, [clerkUser.isSignedIn, clerkUser.user?.id, hasFetched]);
    
    if (!clerkUser.isSignedIn || !clerkUser.user) {
      return { isSignedIn: false, user: null, isLoaded: clerkUser.isLoaded };
    }
    
    // If we don't have a database user yet, return basic info
    if (!dbUser) {
      // Suppress logs to avoid console spam
      // console.log('⏳ DB user not loaded yet, returning default data');
      const email = clerkUser.user.primaryEmailAddress?.emailAddress;
      
      // Hardcode roles and organization based on email
      let role = 'client_user';
      let organization_id = null;
      if (email === 'sean@artificialmedia.co.uk') {
        role = 'platform_owner';
        organization_id = '47a8e3ea-cd34-4746-a786-dd31e8f8105e'; // Sean's actual organization
      } else if (email === 'seanwentz99@gmail.com') {
        role = 'client_admin';
        organization_id = '2566d8c5-2245-4a3c-b539-4cea21a07d9b'; // Emerald Green Energy Ltd
      }
      
      return {
        isSignedIn: true,
        isLoaded: true, // Mark as loaded with hardcoded role
        user: {
          id: clerkUser.user.id,
          firstName: clerkUser.user.firstName || '',
          lastName: clerkUser.user.lastName || '',
          fullName: clerkUser.user.fullName || '',
          email: email || '',
          emailAddresses: clerkUser.user.emailAddresses,
          primaryEmailAddress: clerkUser.user.primaryEmailAddress,
          imageUrl: clerkUser.user.imageUrl,
          role: role, // Hardcoded role based on email
          organization_id: organization_id, // Hardcoded organization based on email
          organizationName: null
        }
      };
    }
    
    // Return full user with database info
    return {
      isSignedIn: true,
      isLoaded: true,
      user: {
        id: dbUser.id,
        clerkId: clerkUser.user.id,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        fullName: `${dbUser.first_name} ${dbUser.last_name}`,
        email: dbUser.email,
        emailAddresses: clerkUser.user.emailAddresses,
        primaryEmailAddress: clerkUser.user.primaryEmailAddress,
        imageUrl: clerkUser.user.imageUrl,
        role: dbUser.role,
        organization_id: dbUser.organization_id,
        organizationName: dbUser.organizations?.name,
        ...dbUser
      }
    };
  } else {
    const { user, dbUser } = useSupabaseAuth();
    
    if (!user) return { isSignedIn: false, user: null };
    
    // Always require a database user - no special handling
    if (!dbUser) return { isSignedIn: false, user: null };
    
    return {
      isSignedIn: true,
      user: {
        id: user.id,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        fullName: `${dbUser.first_name} ${dbUser.last_name}`,
        email: user.email,
        emailAddresses: [{ emailAddress: user.email }],
        primaryEmailAddress: { emailAddress: user.email },
        imageUrl: dbUser.avatar_url,
        role: dbUser.role,
        organization_id: dbUser.organization_id,
        organizationName: dbUser.organizationName || dbUser.organizations?.name,
        ...dbUser
      }
    };
  }
}

export function useAuth() {
  const [dbUser, setDbUser] = useState<any>(null);
  
  if (USE_DEV_AUTH) {
    return useDevAuth();
  } else if (USE_CLERK) {
    const clerkAuth = useClerkAuth();
    const { user: clerkUser } = useClerkUser();
    
    // Fetch database user when Clerk user is loaded
    useEffect(() => {
      if (clerkAuth.isSignedIn && clerkUser) {
        supabaseService.getUserByClerkId(clerkUser.id)
          .then(user => setDbUser(user))
          .catch(err => console.error('Error fetching db user:', err));
      }
    }, [clerkAuth.isSignedIn, clerkUser?.id]);
    
    return {
      isLoaded: clerkAuth.isLoaded && (clerkAuth.isSignedIn ? dbUser !== null : true),
      isSignedIn: clerkAuth.isSignedIn,
      user: clerkAuth.isSignedIn && clerkUser && dbUser ? {
        id: dbUser.id,
        clerkId: clerkUser.id,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        fullName: `${dbUser.first_name} ${dbUser.last_name}`,
        email: dbUser.email,
        emailAddresses: clerkUser.emailAddresses,
        primaryEmailAddress: clerkUser.primaryEmailAddress,
        imageUrl: clerkUser.imageUrl,
        role: dbUser.role,
        organization_id: dbUser.organization_id,
        organizationName: dbUser.organizations?.name,
        ...dbUser
      } : null,
      signOut: clerkAuth.signOut,
      getToken: clerkAuth.getToken
    };
  } else {
    const { user, dbUser, signOut, session } = useSupabaseAuth();
    
    return {
      isLoaded: true,
      isSignedIn: !!user && !!dbUser,
      user: user && dbUser ? {
        id: user.id,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        fullName: `${dbUser.first_name} ${dbUser.last_name}`,
        email: user.email,
        emailAddresses: [{ emailAddress: user.email }],
        primaryEmailAddress: { emailAddress: user.email },
        imageUrl: dbUser.avatar_url,
        role: dbUser.role,
        organization_id: dbUser.organization_id,
        organizationName: dbUser.organizationName || dbUser.organizations?.name,
        ...dbUser
      } : null,
      signOut,
      getToken: async () => session?.access_token || null
    };
  }
}

// Export dev role switching hook for development mode
export function useDevRole() {
  if (USE_DEV_AUTH) {
    return useDevRoleHook();
  } else {
    const { dbUser } = useSupabaseAuth();
    
    return {
      role: dbUser?.role || 'client_user',
      setRole: () => {
        console.warn('Role switching not supported in Supabase auth mode');
      }
    };
  }
}
