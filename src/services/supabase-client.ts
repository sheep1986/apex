import { createClient } from '@supabase/supabase-js';

// Hard-code values for production to ensure they work
const PRODUCTION_SUPABASE_URL = 'https://twigokrtbvigiqnaybfy.supabase.co';
const PRODUCTION_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || PRODUCTION_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || PRODUCTION_ANON_KEY;

// Ensure URL has https:// prefix
const finalSupabaseUrl = supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`;

if (!finalSupabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or anonymous key is missing from environment variables.');
}

// Export a getter instead of a singleton
// The first time anyone calls getSupabase() it will create the client
let _supabase: ReturnType<typeof createClient> | undefined;

export function getSupabase() {
  if (!_supabase) {
    // Only run in the browser
    if (typeof window === 'undefined') {
      throw new Error('Supabase client can only be used in the browser');
    }
    
    // CRITICAL: Ensure the URL always has https://
    const safeUrl = finalSupabaseUrl.startsWith('http') 
      ? finalSupabaseUrl 
      : `https://${finalSupabaseUrl.replace(/^https?:\/\//, '')}`;
    
    _supabase = createClient(safeUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: window.localStorage,
        storageKey: 'sb-twigokrtbvigiqnaybfy-auth-token',
        detectSessionInUrl: true,
      },
      // Force HTTPS in all requests
      global: {
        headers: {
          'X-Client-Info': 'apex-frontend'
        }
      }
    });
  }
  return _supabase;
}

// For backward compatibility, export a proxy that calls getSupabase()
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop, receiver) {
    const client = getSupabase();
    return Reflect.get(client, prop, receiver);
  }
});
