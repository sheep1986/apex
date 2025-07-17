// Centralized auth imports that switch between Clerk and Dev Auth
import { useUser as useClerkUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useUser as useDevUser, useAuth as useDevAuth, useDevRole } from '../services/dev-auth';

const USE_DEV_AUTH =
  import.meta.env.VITE_USE_DEV_AUTH === 'true' || !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export const useUser = USE_DEV_AUTH ? useDevUser : useClerkUser;
export const useAuth = USE_DEV_AUTH ? useDevAuth : useClerkAuth;

// Export dev role switching hook for development mode
export { useDevRole } from '../services/dev-auth';
