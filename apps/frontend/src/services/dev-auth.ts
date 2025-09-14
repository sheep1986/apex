// @ts-nocheck
import type { ReactNode } from "react";

/** Toggle via VITE_USE_DEV_AUTH="true" (but bundlers still need this file to exist) */
export const isDevAuth =
  (typeof import.meta \!== "undefined" &&
    import.meta.env &&
    String(import.meta.env.VITE_USE_DEV_AUTH).toLowerCase() === "true") || false;

export type DevUser = {
  id: string;
  email?: string;
  name?: string;
  roles?: string[];
};

export const getDevUser = (): DevUser | null =>
  isDevAuth ? { id: "dev_user", email: "dev@example.com", name: "Dev User" } : null;

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

export const withDevAuth = (component: ReactNode) => component;

/** Default export with the same members for default-import callers */
const devAuth = { isDevAuth, getDevUser, signInDev, signOutDev, useDevAuth, withDevAuth };
export default devAuth;