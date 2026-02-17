// Centralized auth hooks — Supabase only
// All components import useUser/useAuth from here for consistency.

import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

export function useUser() {
  const { user, dbUser, loading } = useSupabaseAuth();

  // Still loading auth state
  if (loading) return { isSignedIn: false, isLoaded: false, user: null };
  // No auth user at all
  if (!user) return { isSignedIn: false, isLoaded: true, user: null };
  // Auth user exists but dbUser still loading — signed in but not fully loaded
  if (!dbUser) return { isSignedIn: true, isLoaded: false, user: { id: user.id, email: user.email } as any };

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
  const { user, dbUser, signOut, session, loading } = useSupabaseAuth();

  // isSignedIn = true as long as Supabase auth user exists (don't require dbUser)
  // isLoaded = false while auth is loading OR while dbUser hasn't loaded yet
  const isSignedIn = !!user;
  const isLoaded = !loading && (!!dbUser || !user); // loaded if: not loading AND (dbUser exists OR no user at all)

  return {
    isLoaded,
    isSignedIn,
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
        : user
        ? { id: user.id, email: user.email } as any
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
