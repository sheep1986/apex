import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from '../services/supabase-client';
import type { DatabaseUser } from '../services/supabase-service';
import { supabaseService } from '../services/supabase-service';

interface AuthContextType {
  user: User | null;
  dbUser: DatabaseUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<any>;
  organization: { id: string; name: string; slug: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DatabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabase();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadDbUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle password recovery — redirect to reset page
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/reset-password';
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadDbUser(session.user);
      } else {
        setDbUser(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadDbUser = async (authUser: User) => {
    try {
      // First try to get user by email (more reliable for existing users)
      let dbUser = await supabaseService.getUserByEmail(authUser.email!);

      // Fallback to auth ID if not found by email
      if (!dbUser) {
        dbUser = await supabaseService.getUserById(authUser.id);
      }

      setDbUser(dbUser);
    } catch (error) {
      console.error('❌ Error loading database user:', error);
      setDbUser(null);
    }
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      
      // Create database user record
      if (data.user && userData) {
        try {
          await supabaseService.createUser({
            email: data.user.email!,
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            role: userData.role || 'client_user',
            organization_id: userData.organizationId,
            status: 'active',
            permissions: {},
            email_verified: false,
            timezone: 'UTC',
            language: 'en'
          });
        } catch (dbError) {
          console.error('Error creating database user:', dbError);
        }
      }
      
      return { data, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return { data, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Reset state
      setUser(null);
      setDbUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    return { data, error };
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      return { data, error };
    } catch (error) {
      console.error('Error signing in with OAuth:', error);
      throw error;
    }
  };

  const value = {
    user,
    dbUser,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithOAuth,
    organization: dbUser?.organizations || null
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