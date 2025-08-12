import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User role constants - mapped to existing Apex roles
export const USER_ROLES = {
  PLATFORM_OWNER: 'platform_owner',  // Maps to Manus's 'owner'
  CLIENT_ADMIN: 'client_admin',      // Maps to Manus's 'admin'
  CLIENT_USER: 'client_user',        // Maps to Manus's 'client'
  AGENCY_OWNER: 'agency_owner',      // New agency roles
  AGENCY_ADMIN: 'agency_admin',
  AGENCY_USER: 'agency_user',
  USER: 'user'                       // Default user role
}

// Portal URLs based on user roles - using existing Apex routes
export const PORTAL_URLS = {
  [USER_ROLES.PLATFORM_OWNER]: '/platform',
  [USER_ROLES.CLIENT_ADMIN]: '/dashboard',
  [USER_ROLES.CLIENT_USER]: '/dashboard',
  [USER_ROLES.AGENCY_OWNER]: '/agency',
  [USER_ROLES.AGENCY_ADMIN]: '/agency',
  [USER_ROLES.AGENCY_USER]: '/agency',
  [USER_ROLES.USER]: '/dashboard'
}

// Get user profile from existing users table
export async function getUserProfile(clerkUserId: string) {
  try {
    // First try the existing users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUserId)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

// Create or update user profile - compatible with existing schema
export async function upsertUserProfile(clerkUser: any) {
  try {
    // Map to existing users table schema
    const userProfile = {
      clerk_id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      first_name: clerkUser.firstName || '',
      last_name: clerkUser.lastName || '',
      username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0],
      role: USER_ROLES.CLIENT_USER, // Default role
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(userProfile, { 
        onConflict: 'clerk_id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in upsertUserProfile:', error)
    return null
  }
}

// Get portal URL based on user role
export function getPortalUrl(userRole: string | null) {
  return PORTAL_URLS[userRole] || PORTAL_URLS[USER_ROLES.USER]
}

// Check if using new auth system
export function useNewAuthSystem() {
  return import.meta.env.VITE_USE_NEW_AUTH === 'true'
}