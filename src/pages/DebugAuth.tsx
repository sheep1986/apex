import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase-client';
import { supabaseService } from '@/services/supabase-service';

export default function DebugAuth() {
  const [authUser, setAuthUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setError(`Session error: ${sessionError.message}`);
          return;
        }

        if (!session) {
          setError('No active session');
          return;
        }

        setAuthUser(session.user);

        // Get database user
        const dbUserData = await supabaseService.getUserByEmail(session.user.email!);
        setDbUser(dbUserData);

      } catch (err: any) {
        setError(`Error: ${err.message}`);
      }
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Information</h1>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 p-4 rounded mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-gray-800 p-6 rounded">
          <h2 className="text-xl font-semibold mb-4">Supabase Auth User</h2>
          {authUser ? (
            <pre className="text-sm overflow-auto">
              {JSON.stringify({
                id: authUser.id,
                email: authUser.email,
                email_confirmed_at: authUser.email_confirmed_at,
                created_at: authUser.created_at,
                updated_at: authUser.updated_at
              }, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-400">No auth user</p>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded">
          <h2 className="text-xl font-semibold mb-4">Database User</h2>
          {dbUser ? (
            <pre className="text-sm overflow-auto">
              {JSON.stringify({
                id: dbUser.id,
                email: dbUser.email,
                first_name: dbUser.first_name,
                last_name: dbUser.last_name,
                role: dbUser.role,
                organization_id: dbUser.organization_id,
                organization_name: dbUser.organizations?.name || dbUser.organizationName
              }, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-400">No database user</p>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <button
            onClick={async () => {
              // Sign out from Supabase
              const { error } = await supabase.auth.signOut();
              
              // Clear all storage
              localStorage.clear();
              sessionStorage.clear();
              
              // Clear cookies
              document.cookie.split(";").forEach((c) => {
                document.cookie = c
                  .replace(/^ +/, "")
                  .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
              });
              
              // Clear IndexedDB (Supabase stores auth here too)
              if ('indexedDB' in window) {
                const databases = await indexedDB.databases();
                databases.forEach(db => {
                  if (db.name?.includes('supabase')) {
                    indexedDB.deleteDatabase(db.name);
                  }
                });
              }
              
              // Force reload to login
              window.location.href = '/login';
            }}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Force Sign Out (Aggressive)
          </button>
        </div>
      </div>
    </div>
  );
}