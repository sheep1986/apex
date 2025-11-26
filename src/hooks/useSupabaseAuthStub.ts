/**
 * Stub hook for legacy components that use useSupabaseAuth
 * This exists only to prevent errors - Clerk is the primary auth system
 */
export function useSupabaseAuth() {
  console.warn('useSupabaseAuth called - this is a stub. Use Clerk for authentication.');

  return {
    user: null,
    dbUser: null,
    session: null,
    loading: false,
    signUp: async () => ({ data: null, error: new Error('Use Clerk for authentication') }),
    signIn: async () => ({ data: null, error: new Error('Use Clerk for authentication') }),
    signOut: async () => {},
    resetPassword: async () => ({ data: null, error: new Error('Use Clerk for authentication') })
  };
}
