import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

export const SimpleRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    
    console.log('SimpleRedirect - User loaded:', user?.emailAddresses?.[0]?.emailAddress);
    
    // For now, redirect all authenticated users to platform
    // This bypasses the backend role check
    if (user) {
      console.log('Redirecting to /platform...');
      navigate('/platform', { replace: true });
    }
  }, [user, isLoaded, navigate]);

  // Use a visible UI to debug the black screen issue
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500 animate-ping"></div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">
          Redirecting to Platform Dashboard...
        </h1>
        {user && (
          <p className="text-gray-400">
            Welcome, {user.emailAddresses?.[0]?.emailAddress}
          </p>
        )}
        <button
          onClick={() => navigate('/platform')}
          className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          Continue to Platform
        </button>
      </div>
    </div>
  );
};