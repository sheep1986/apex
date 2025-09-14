import React, { createContext, useContext, useState, useEffect } from 'react';

// User roles type
export type UserRole =
  | 'platform_owner'
  | 'agency_owner'
  | 'agency_admin'
  | 'client_admin'
  | 'client_user';

// Dev auth context
interface DevAuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: any;
  currentRole: UserRole;
  getToken: () => Promise<string>;
  signOut: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const DevAuthContext = createContext<DevAuthContextType | null>(null);

// Mock user data for different roles
const createMockUser = (role: UserRole) => {
  const roleData = {
    platform_owner: {
      id: 'dev-user-platform-001',
      firstName: 'Sean',
      lastName: 'Wentz',
      fullName: 'Sean Wentz',
      primaryEmailAddress: { emailAddress: 'sean@artificialmedia.co.uk' },
      role: 'platform_owner',
      organizationId: '2566d8c5-2245-4a3c-b539-4cea21a07d9b', // Emerald Green Energy Ltd
    },
    agency_owner: {
      id: 'dev-user-agency-001',
      firstName: 'Agency',
      lastName: 'Owner',
      fullName: 'Agency Owner',
      primaryEmailAddress: { emailAddress: 'agency@artificialmedia.co.uk' },
      role: 'agency_owner',
    },
    agency_admin: {
      id: 'dev-user-admin-001',
      firstName: 'Agency',
      lastName: 'Admin',
      fullName: 'Agency Admin',
      primaryEmailAddress: { emailAddress: 'admin@artificialmedia.co.uk' },
      role: 'agency_admin',
    },
    client_admin: {
      id: 'dev-user-client-admin-001',
      firstName: 'Client',
      lastName: 'Admin',
      fullName: 'Client Admin',
      primaryEmailAddress: { emailAddress: 'clientadmin@testcorp.com' },
      role: 'client_admin',
      organizationId: '2566d8c5-2245-4a3c-b539-4cea21a07d9b', // Same org as platform_owner for testing
    },
    client_user: {
      id: 'dev-user-client-001',
      firstName: 'Client',
      lastName: 'User',
      fullName: 'Client User',
      primaryEmailAddress: { emailAddress: 'user@testcorp.com' },
      role: 'client_user',
    },
  };

  const userData = roleData[role];
  return {
    ...userData,
    emailAddresses: [userData.primaryEmailAddress],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  };
};

export const DevAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('platform_owner');

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setIsLoaded(true);
      console.log(`🔓 Dev Auth: Loaded with role: ${currentRole}`);
    }, 100);
  }, [currentRole]);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    console.log(`🔄 Dev Auth: Switched to role: ${role}`);
  };

  const currentUser = createMockUser(currentRole);

  const value: DevAuthContextType = {
    isLoaded,
    isSignedIn: true, // Always signed in for dev
    user: currentUser,
    currentRole,
    getToken: async () => {
      // Return test token for API calls with role info
      return `test-token-${currentRole}`;
    },
    signOut: async () => {
      console.log('🔓 Dev Auth: Sign out (no-op in dev mode)');
    },
    switchRole,
  };

  return <DevAuthContext.Provider value={value}>{children}</DevAuthContext.Provider>;
};

// Mock Clerk hooks
export const useUser = () => {
  const context = useContext(DevAuthContext);
  if (!context) {
    throw new Error('useUser must be used within DevAuthProvider');
  }
  return {
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn,
    user: context.user,
  };
};

export const useAuth = () => {
  const context = useContext(DevAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within DevAuthProvider');
  }
  return {
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn,
    user: context.user,
    getToken: context.getToken,
    signOut: context.signOut,
    userId: context.user?.id,
  };
};

// Role switching hook
export const useDevRole = () => {
  const context = useContext(DevAuthContext);
  if (!context) {
    throw new Error('useDevRole must be used within DevAuthProvider');
  }
  return {
    currentRole: context.currentRole,
    switchRole: context.switchRole,
  };
};

// Mock Clerk components
export const SignIn = () => <div>Dev Mode - No Sign In Required</div>;
export const SignUp = () => <div>Dev Mode - No Sign Up Required</div>;
export const UserButton = () => (
  <div className="flex items-center gap-2 text-sm">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
      T
    </div>
    <span>Test User</span>
  </div>
);
