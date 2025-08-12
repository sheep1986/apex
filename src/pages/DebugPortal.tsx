import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useUserContext } from '../services/MinimalUserProvider';

export const DebugPortal: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, userId } = useAuth();
  const { userContext } = useUserContext();
  const [debugInfo, setDebugInfo] = useState<any>({});

  // Immediate console log
  console.log('🚀 DebugPortal rendered!', {
    isSignedIn,
    userId,
    userContext,
    hasRole: !!userContext?.role
  });

  useEffect(() => {
    const info = {
      isSignedIn,
      clerkUserId: userId,
      userContext: userContext,
      role: userContext?.role,
      backendUrl: import.meta.env.VITE_BACKEND_URL || 'NOT SET',
      apiUrl: import.meta.env.VITE_API_URL || 'NOT SET',
    };
    
    setDebugInfo(info);
    console.log('🔍 Debug Portal Info:', info);

    // If we have a role, redirect based on it
    if (userContext?.role) {
      const role = userContext.role.toLowerCase();
      console.log('✅ Role detected:', role);
      
      setTimeout(() => {
        switch (role) {
          case 'platform_owner':
            navigate('/platform', { replace: true });
            break;
          case 'agency_owner':
          case 'agency_admin':
          case 'agency_user':
            navigate('/agency', { replace: true });
            break;
          default:
            navigate('/dashboard', { replace: true });
        }
      }, 2000); // 2 second delay to see debug info
    }
  }, [isSignedIn, userId, userContext, navigate]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: 'white', padding: '2rem' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <h1 className="text-3xl font-bold mb-6">Portal Debug Page</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <p>Signed In: <span className={isSignedIn ? 'text-green-400' : 'text-red-400'}>{String(isSignedIn)}</span></p>
            <p>Clerk User ID: <span className="text-blue-400">{userId || 'None'}</span></p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Context</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(userContext, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <div className="space-y-2">
            <p>Backend URL: <span className="text-yellow-400">{debugInfo.backendUrl}</span></p>
            <p>API URL: <span className="text-yellow-400">{debugInfo.apiUrl}</span></p>
          </div>
        </div>

        {userContext?.role && (
          <div className="bg-green-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
            <p>Role detected: <span className="font-bold">{userContext.role}</span></p>
            <p>Redirecting to appropriate dashboard in 2 seconds...</p>
          </div>
        )}

        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => navigate('/platform')}
            className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
          >
            Go to Platform
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};