/* @ts-nocheck */

/** Toggle via VITE_USE_DEV_AUTH="true" (bundlers still need this file to exist) */
export const isDevAuth =
  String(import.meta?.env?.VITE_USE_DEV_AUTH ?? '').toLowerCase() === 'true';

export type DevUser = {
  id: string;
  email?: string;
  name?: string;
  roles?: string[];
};

export const getDevUser = (): DevUser | null =>
  isDevAuth ? { id: 'dev_user', email: 'dev@example.com', name: 'Dev User' } : null;

export const signInDev = async () => getDevUser();
export const signOutDev = async () => true;

export function useDevAuth() {
  return {
    isDevAuth,
    user: getDevUser(),
    signIn: signInDev,
    signOut: signOutDev,
  };
}

export const withDevAuth = (component: any) => component;

const devAuth = { isDevAuth, getDevUser, signInDev, signOutDev, useDevAuth, withDevAuth };
export default devAuth;
