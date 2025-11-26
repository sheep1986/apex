import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from '../services/supabase-client';
import { supabaseService } from '../services/supabase-service';
import type { User, Session } from '@supabase/supabase-js';
import type { DatabaseUser } from '../services/supabase-service';

interface AuthContextType {
  user: User | null;
  dbUser: DatabaseUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false); // Set to false since we're using Clerk as primary auth

  // Stub provider - we're using Clerk as primary auth
  // This provider exists only to prevent "useSupabaseAuth must be used within..." errors
  // from legacy components that still reference it

  useEffect(() => {
    console.log('SupabaseAuthProvider mounted (stub mode - Clerk is primary auth)');
  }, []);

  // Stub functions - not used since Clerk is primary auth
  const signUp = async (email: string, password: string, userData?: any) => {
    console.warn('SupabaseAuthProvider.signUp called but Clerk is primary auth');
    return { data: null, error: new Error('Use Clerk for authentication') };
  };

  const signIn = async (email: string, password: string) => {
    console.warn('SupabaseAuthProvider.signIn called but Clerk is primary auth');
    return { data: null, error: new Error('Use Clerk for authentication') };
  };

  const signOut = async () => {
    console.warn('SupabaseAuthProvider.signOut called but Clerk is primary auth');
  };

  const resetPassword = async (email: string) => {
    console.warn('SupabaseAuthProvider.resetPassword called but Clerk is primary auth');
    return { data: null, error: new Error('Use Clerk for authentication') };
  };

  const value = {
    user,
    dbUser,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}