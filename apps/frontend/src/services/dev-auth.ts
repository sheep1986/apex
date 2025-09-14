/* @ts-nocheck */

/** Toggle via VITE_USE_DEV_AUTH="true" (bundlers still must resolve this module). */
export const isDevAuth =
  String(import.meta?.env?.VITE_USE_DEV_AUTH ?? '').toLowerCase() === 'true';

export type DevUser = {
  id: string;
  email?: string;
  name?: string;
  roles?: string[];
};

const DEV_USER: DevUser = {
  id: 'dev_user',
  email: 'dev@example.com',
  name: 'Dev User',
  roles: ['admin'],
};

export const getDevUser = (): DevUser | null => (isDevAuth ? DEV_USER : null);

/* === Hooks expected by src/hooks/auth.ts === */
export function useUser() {
  const user = getDevUser();
  return { user, isLoaded: true, isSignedIn: !!user };
}

export function useAuth() {
  return {
    isLoaded: true,
    userId: isDevAuth ? DEV_USER.id : null,
    sessionId: isDevAuth ? 'dev_session' : null,
    getToken: async () => null,
    signOut: async () => true,
  };
}

export function useDevRole() {
  const roles = DEV_USER.roles || [];
  const hasRole = (r: string) => roles.includes(r);
  return { roles, role: roles[0] || null, hasRole };
}

/* Keep convenience helpers for any other callers */
export const signInDev = async () => getDevUser();
export const signOutDev = async () => true;
export function useDevAuth() {
  return { isDevAuth, user: getDevUser(), signIn: signInDev, signOut: signOutDev };
}
export const withDevAuth = (component: any) => component;

/* Default export (optional; harmless to keep) */
const devAuth = {
  isDevAuth,
  getDevUser,
  useUser,
  useAuth,
  useDevRole,
  signInDev,
  signOutDev,
  useDevAuth,
  withDevAuth,
};
export default devAuth;