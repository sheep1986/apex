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
  const [orgFallback, setOrgFallback] = useState<{ id: string; name: string; slug: string } | null>(null);
  const supabase = getSupabase();

  useEffect(() => {
    let loadedUserId: string | null = null;
    let loadingUserId: string | null = null; // Prevents duplicate concurrent loads
    let loadVersion = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const loadDbUser = async (authUser: User, isRetry = false) => {
      // Prevent duplicate concurrent loads for the same user
      if (loadingUserId === authUser.id && !isRetry) return;
      loadingUserId = authUser.id;
      const thisVersion = ++loadVersion;
      try {
        // getUserById retries up to 2x with 1.5s delays — give it 6s total then fall back
        const result = await Promise.race([
          supabaseService.getUserById(authUser.id),
          new Promise<null>((resolve) => setTimeout(() => {
            console.warn('⚠️ loadDbUser timed out after 6s — proceeding without profile');
            resolve(null);
          }, 6000)),
        ]);
        if (thisVersion !== loadVersion) return;

        if (result) {
          setDbUser(result);
          if (result.organizations) setOrgFallback(null); // only clear fallback if org is populated
          loadedUserId = authUser.id;
        } else if (!isRetry) {
          // Profile came back null — retry once after 2s delay
          retryTimer = setTimeout(() => {
            if (loadVersion === thisVersion) {
              loadDbUser(authUser, true);
            }
          }, 2000);
        } else {
          // All retries exhausted — do a lightweight org fallback query
          // so pages that depend on organization?.id can still load data
          setDbUser(null);
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('organization_id')
              .eq('id', authUser.id)
              .single();
            if (profile?.organization_id) {
              const { data: org } = await supabase
                .from('organizations')
                .select('id, name, slug')
                .eq('id', profile.organization_id)
                .single();
              if (org && thisVersion === loadVersion) {
                setOrgFallback({ id: org.id, name: org.name || '', slug: org.slug || '' });
                console.log('✅ Resolved organization from auth context fallback');
              }
            }
          } catch {
            // Non-critical — MinimalUserProvider has its own fallback
          }
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        console.error('❌ Error loading database user:', error);
        if (thisVersion === loadVersion) {
          setDbUser(null);
        }
      } finally {
        if (thisVersion === loadVersion) {
          loadingUserId = null;
        }
      }
    };

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/reset-password';
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Skip if already loaded OR already loading this user's profile
        if (loadedUserId === session.user.id) return;
        // Fire-and-forget — loadDbUser deduplicates internally
        loadDbUser(session.user);
      } else {
        loadVersion++;
        loadedUserId = null;
        loadingUserId = null;
        setDbUser(null);
        setOrgFallback(null);
      }

      setLoading(false);
    });

    return () => {
      loadVersion++;
      if (retryTimer) clearTimeout(retryTimer);
      subscription.unsubscribe();
    };
  }, []);

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
      setOrgFallback(null);
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
    organization: dbUser?.organizations || orgFallback || null
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