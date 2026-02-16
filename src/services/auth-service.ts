// =============================================================================
// SUPABASE AUTHENTICATION SERVICE
// Centralized auth management for Trinity Labs AI platform
// =============================================================================

import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase-client";

export interface UserProfile {
  id: string;
  organization_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  role: "platform_owner" | "org_admin" | "manager" | "member" | "viewer";
  permissions: Record<string, any>;
  timezone: string;
  locale: string;
  is_active: boolean;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  description?: string;
  logo_url?: string;
  subscription_plan: string;
  subscription_status: string;
  monthly_call_limit?: number;
  monthly_calls_used: number;
  user_limit?: number;
  features: Record<string, boolean>;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  organization: Organization | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  subscriptionPlan?: string;
  metadata?: Record<string, any>;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  private listeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    user: null,
    profile: null,
    organization: null,
    session: null,
    loading: true,
    error: null,
  };

  constructor() {
    this.initializeAuth();
  }

  // Initialize authentication state
  private async initializeAuth() {
    try {
      // Get initial session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        this.updateState({ error: error.message, loading: false });
        return;
      }

      if (session?.user) {
        await this.handleAuthStateChange(session);
      } else {
        this.updateState({ loading: false });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await this.handleAuthStateChange(session);
        } else if (event === "SIGNED_OUT") {
          this.updateState({
            user: null,
            profile: null,
            organization: null,
            session: null,
            loading: false,
            error: null,
          });
        }
      });
    } catch (error) {
      console.error("Error initializing auth:", error);
      this.updateState({
        error:
          error instanceof Error
            ? error.message
            : "Authentication initialization failed",
        loading: false,
      });
    }
  }

  // Handle authentication state changes
  private async handleAuthStateChange(session: Session | null) {
    this.updateState({ loading: true, error: null });

    if (!session?.user) {
      this.updateState({
        user: null,
        profile: null,
        organization: null,
        session: null,
        loading: false,
      });
      return;
    }

    try {
      // Fetch user profile and organization
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select(
          `
          *,
          organization:organizations(*)
        `
        )
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      this.updateState({
        user: session.user,
        profile: profile,
        organization: profile?.organization || null,
        session,
        loading: false,
        error: null,
      });

      // Update last active timestamp
      await this.updateLastActive();
    } catch (error) {
      console.error("Error fetching user profile:", error);
      this.updateState({
        user: session.user,
        profile: null,
        organization: null,
        session,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load user profile",
      });
    }
  }

  // Update state and notify listeners
  private updateState(updates: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...updates };
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.currentState);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Get current auth state
  getState(): AuthState {
    return this.currentState;
  }

  // Sign up new user
  async signUp(
    data: SignUpData
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      this.updateState({ loading: true, error: null });

      // Call the SaaS signup edge function
      const response = await fetch("/functions/v1/saas-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Signup failed");
      }

      // Sign in the user after successful signup
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (signInError) {
        throw signInError;
      }

      return {
        success: true,
        user: signInData.user,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Signup failed";
      this.updateState({ error: errorMessage, loading: false });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Sign in existing user
  async signIn(
    data: SignInData
  ): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      this.updateState({ loading: true, error: null });

      const { data: signInData, error } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
        user: signInData.user,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign in failed";
      this.updateState({ error: errorMessage, loading: false });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Sign out user
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ loading: true, error: null });

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign out failed";
      this.updateState({ error: errorMessage, loading: false });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Reset password
  async resetPassword(
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Password reset failed",
      };
    }
  }

  // Update password
  async updatePassword(
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Password update failed",
      };
    }
  }

  // Update user profile
  async updateProfile(
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentState.user) {
        throw new Error("No authenticated user");
      }

      const { error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", this.currentState.user.id);

      if (error) {
        throw error;
      }

      // Refresh user data
      await this.handleAuthStateChange(this.currentState.session);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Profile update failed",
      };
    }
  }

  // Update last active timestamp
  private async updateLastActive() {
    try {
      if (!this.currentState.user) return;

      await supabase
        .from("user_profiles")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", this.currentState.user.id);
    } catch (error) {
      console.error("Error updating last active:", error);
      // Don't throw - this is not critical
    }
  }

  // Get current user session
  async getSession(): Promise<Session | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentState.user;
  }

  // Get current user profile
  getCurrentProfile(): UserProfile | null {
    return this.currentState.profile;
  }

  // Get current organization
  getCurrentOrganization(): Organization | null {
    return this.currentState.organization;
  }

  // Check if user has permission
  hasPermission(permission: string): boolean {
    if (!this.currentState.profile) return false;

    // Platform owners have all permissions
    if (this.currentState.profile.role === "platform_owner") return true;

    // Check specific permissions
    return this.currentState.profile.permissions?.[permission] === true;
  }

  // Check if user has role
  hasRole(role: string | string[]): boolean {
    if (!this.currentState.profile) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(this.currentState.profile.role);
  }

  // Get authentication token
  async getToken(): Promise<string | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
