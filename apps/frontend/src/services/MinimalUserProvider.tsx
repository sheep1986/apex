import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@/hooks/auth';
import { supabaseService, type DatabaseUser, type Organization } from './supabase-service';

export interface UserContextType {
  userContext: {
    id?: string;
    firstName?: string;
    lastName?: string;
    organizationId?: string;
    organizationName?: string;
    email?: string;
    role?: string;
    permissions?: Record<string, any>;
    avatar_url?: string;
  } | null;
  setUserContext: (context: any) => void;
  dbUser: DatabaseUser | null;
  organization: Organization | null;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const MinimalUserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userContext, setUserContext] = useState(null);
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const { user, isLoaded } = useUser();

  const refreshUserData = async () => {
    console.log('🔄 MinimalUserProvider: refreshUserData called', {
      user: user,
      userRole: user?.role,
      userId: user?.id,
      isLoaded
    });
    
    if (!user) {
      console.log('⚠️ MinimalUserProvider: No user, exiting refreshUserData');
      return;
    }

    try {
      // First, try to find user in database
      let databaseUser = await supabaseService.getUserByClerkId(user.id);
      
      if (!databaseUser) {
        // If user doesn't exist, we need to create them
        // For now, we'll create a default organization or use an existing one
        let defaultOrg = await supabaseService.getOrganizations();
        
        if (defaultOrg.length === 0) {
          // Create default organization if none exists
          defaultOrg = [await supabaseService.createOrganization({
            name: 'Artificial Media',
            slug: 'artificial-media',
            type: 'agency',
            status: 'active',
            plan: 'professional',
            monthly_cost: 599.00,
            primary_color: '#2563eb',
            secondary_color: '#1e40af',
            call_limit: 1000,
            user_limit: 10,
            storage_limit_gb: 10,
          })];
        }

        // Create user in database
        databaseUser = await supabaseService.createUser({
          clerk_id: user.id,
          organization_id: defaultOrg[0].id,
          first_name: user.firstName || 'User',
          last_name: user.lastName || '',
          email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '',
          avatar_url: user.imageUrl,
          role: user.role || 'client_admin', // Use the role from dev auth, default to client_admin
          permissions: {},
          status: 'active',
          email_verified: user.primaryEmailAddress?.verification?.status === 'verified',
          timezone: 'UTC',
          language: 'en',
        });
      } else {
        // Update existing user with latest Clerk data
        databaseUser = await supabaseService.updateUser(databaseUser.id, {
          first_name: user.firstName || databaseUser.first_name,
          last_name: user.lastName || databaseUser.last_name,
          email: user.primaryEmailAddress?.emailAddress || databaseUser.email,
          avatar_url: user.imageUrl || databaseUser.avatar_url,
          role: user.role || databaseUser.role, // Update role from dev auth if available
          email_verified: user.primaryEmailAddress?.verification?.status === 'verified',
          last_login_at: new Date().toISOString(),
        });
      }

      // Get organization data
      const orgData = await supabaseService.getOrganization(databaseUser.organization_id);

      // Update state
      setDbUser(databaseUser);
      setOrganization(orgData);

      // Update user context for UI - prioritize user.role which comes from dev-auth
      const userInfo = {
        id: databaseUser.id,
        firstName: databaseUser.first_name,
        lastName: databaseUser.last_name,
        organizationId: databaseUser.organization_id,
        organizationName: orgData.name,
        email: databaseUser.email,
        role: user.role || databaseUser.role, // Prioritize user.role from dev auth
        permissions: databaseUser.permissions,
        avatar_url: databaseUser.avatar_url,
      };

      console.log('🔄 MinimalUserProvider: Setting user context', {
        devAuthRole: user.role,
        dbRole: databaseUser.role,
        finalRole: userInfo.role,
        userInfo,
        timestamp: new Date().toISOString()
      });

      setUserContext(userInfo);
      console.log('✅ MinimalUserProvider: User context set successfully');

      // Set token for API calls
      localStorage.setItem('auth_token', 'supabase-connected');
      localStorage.setItem('user_id', databaseUser.id);
      localStorage.setItem('organization_id', databaseUser.organization_id);

    } catch (error) {
      console.error('Error syncing user data with Supabase:', error);
      
      // Fallback to basic user info if database sync fails
      const fallbackUserInfo = {
        firstName: user.firstName || 'User',
        lastName: user.lastName || '',
        organizationName: 'Default Organization',
        email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || 'user@example.com',
        role: user.role || 'client_user', // Use role from dev auth
      };

      console.log('⚠️ MinimalUserProvider: Using fallback user info', {
        fallbackUserInfo,
        devAuthRole: user.role,
        error: error.message
      });

      setUserContext(fallbackUserInfo);
      localStorage.setItem('auth_token', 'fallback-mode');
    }
  };

  useEffect(() => {
    console.log('🔄 MinimalUserProvider: useEffect triggered', {
      isLoaded,
      hasUser: !!user,
      userRole: user?.role,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
    
    if (isLoaded && user) {
      console.log('✅ MinimalUserProvider: Calling refreshUserData');
      refreshUserData();
    } else if (isLoaded && !user) {
      console.log('🔓 MinimalUserProvider: User logged out, clearing state');
      // User logged out
      setUserContext(null);
      setDbUser(null);
      setOrganization(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('organization_id');
    }
  }, [user, isLoaded, user?.role, user?.id]); // Also listen for user.role changes from dev auth

  return (
    <UserContext.Provider value={{ 
      userContext, 
      setUserContext, 
      dbUser, 
      organization, 
      refreshUserData 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a MinimalUserProvider');
  }
  return context;
};
