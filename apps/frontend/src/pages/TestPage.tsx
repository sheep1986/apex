import React from 'react';
import { useAuth } from '../hooks/auth';

export const TestPage: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useAuth();
  const isDev = import.meta.env.VITE_USE_DEV_AUTH === 'true';

  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <div className="space-y-2">
        <p>Dev Mode: {isDev ? 'Enabled' : 'Disabled'}</p>
        <p>Auth Loaded: {isLoaded ? 'Yes' : 'No'}</p>
        <p>Signed In: {isSignedIn ? 'Yes' : 'No'}</p>
        <p>User: {user ? JSON.stringify(user, null, 2) : 'None'}</p>
        <p>Backend URL: {import.meta.env.VITE_API_BASE_URL || 'Not set'}</p>
      </div>
    </div>
  );
};