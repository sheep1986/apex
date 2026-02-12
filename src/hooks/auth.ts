// Centralized auth hooks — Supabase only
// All components import useUser/useAuth from here for consistency.

import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

export function useUser() {
  const { user, dbUser } = useSupabaseAuth();

  if (!user) return { isSignedIn: false, isLoaded: true, user: null };
  if (!dbUser) return { isSignedIn: false, isLoaded: false, user: null };

  return {
    isSignedIn: true,
    isLoaded: true,
    user: {
      id: user.id,
      firstName: dbUser.full_name?.split(' ')[0] || '',
      lastName: dbUser.full_name?.split(' ').slice(1).join(' ') || '',
      fullName: dbUser.full_name || user.email || '',
      email: user.email,
      emailAddresses: [{ emailAddress: user.email }],
      primaryEmailAddress: { emailAddress: user.email },
      imageUrl: dbUser.avatar_url,
      role: dbUser.role,
      organization_id: dbUser.organization_id,
      organizationName: dbUser.organizationName || dbUser.organizations?.name,
      ...dbUser,
    },
  };
}

export function useAuth() {
  const { user, dbUser, signOut, session } = useSupabaseAuth();

  return {
    isLoaded: true,
    isSignedIn: !!user && !!dbUser,
    user:
      user && dbUser
        ? {
            id: user.id,
            firstName: dbUser.full_name?.split(' ')[0] || '',
            lastName: dbUser.full_name?.split(' ').slice(1).join(' ') || '',
            fullName: dbUser.full_name || user.email || '',
            email: user.email,
            emailAddresses: [{ emailAddress: user.email }],
            primaryEmailAddress: { emailAddress: user.email },
            imageUrl: dbUser.avatar_url,
            role: dbUser.role,
            organization_id: dbUser.organization_id,
            organizationName: dbUser.organizationName || dbUser.organizations?.name,
            ...dbUser,
          }
        : null,
    signOut,
    getToken: async () => session?.access_token || null,
    userId: user?.id || null,
  };
}

export function useDevRole() {
  const { dbUser } = useSupabaseAuth();
  return {
    role: dbUser?.role || 'client_user',
    currentRole: dbUser?.role || 'client_user',
    switchRole: () => {
      console.warn('Role switching not available in production');
    },
  };
}
