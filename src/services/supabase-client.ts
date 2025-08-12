import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
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
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: window.localStorage,
        storageKey: 'sb-twigokrtbvigiqnaybfy-auth-token',
        detectSessionInUrl: true,
      },
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
