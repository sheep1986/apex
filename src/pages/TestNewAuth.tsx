import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

export const TestNewAuth: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  
  const isNewAuthEnabled = import.meta.env.VITE_USE_NEW_AUTH === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">New Auth System Test Page</h1>
        
        <div className="bg-gray-900/80 backdrop-blur-md rounded-lg border border-gray-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">System Status</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">New Auth System:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${isNewAuthEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {isNewAuthEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Clerk Loaded:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${isLoaded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {isLoaded ? 'Yes' : 'Loading...'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">User Signed In:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${isSignedIn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {isSignedIn ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {isNewAuthEnabled ? (
          <div className="bg-gray-900/80 backdrop-blur-md rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Test New Auth System</h2>
            <div className="space-y-4">
              <p className="text-gray-400">The new auth system is enabled. Test the following flows:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/auth-new/sign-in')}
                  className="bg-gradient-to-r from-emerald-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-emerald-600 hover:to-pink-600 transition-all"
                >
                  Test Sign In
                </button>
                
                <button
                  onClick={() => navigate('/auth-new/sign-up')}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
                >
                  Test Sign Up
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Instructions:</h3>
                <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Click "Test Sign In" to test the new login page</li>
                  <li>Enter your credentials (use existing account or create new)</li>
                  <li>Watch for redirect to appropriate portal based on role</li>
                  <li>Check browser console for debug information</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/80 backdrop-blur-md rounded-lg border border-yellow-800 p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-4">New Auth System Disabled</h2>
            <p className="text-gray-400 mb-4">
              To enable the new auth system, set <code className="bg-gray-800 px-2 py-1 rounded">VITE_USE_NEW_AUTH=true</code> in your environment.
            </p>
            <p className="text-sm text-gray-500">
              Current environment: {import.meta.env.MODE}
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-800 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-800 text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};