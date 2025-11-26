/**
 * DEPRECATED: This file is kept for backward compatibility only
 * Clerk is the primary authentication system
 * This exports a stub hook to prevent errors in legacy components
 */
import React from 'react';

// Re-export the stub hook
export { useSupabaseAuth } from '../hooks/useSupabaseAuthStub';

// Deprecated - do not use
export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  console.warn('SupabaseAuthProvider is deprecated - remove from component tree');
  return <>{children}</>;
}
