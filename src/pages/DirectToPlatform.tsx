import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const DirectToPlatform = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Directly render the platform dashboard content
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Platform Owner Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-2">Organizations</h2>
            <p className="text-gray-400">Manage all organizations</p>
            <a href="/organizations" className="mt-4 inline-block text-emerald-500 hover:text-emerald-400">
              View Organizations →
            </a>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-2">Users</h2>
            <p className="text-gray-400">Manage platform users</p>
            <a href="/user-management" className="mt-4 inline-block text-emerald-500 hover:text-emerald-400">
              Manage Users →
            </a>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-2">Analytics</h2>
            <p className="text-gray-400">Platform-wide analytics</p>
            <a href="/platform-analytics" className="mt-4 inline-block text-emerald-500 hover:text-emerald-400">
              View Analytics →
            </a>
          </div>
        </div>

        <div className="mt-8 bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <p className="text-yellow-400">
            ⚠️ Note: Database connection is currently experiencing issues. Some features may be limited.
          </p>
        </div>
      </div>
    </div>
  );
};