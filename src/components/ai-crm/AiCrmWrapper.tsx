import React from 'react';
import { useUser, useAuth } from '../../hooks/auth';
import { AiCrmApp } from './AiCrmApp';

export const AiCrmWrapper: React.FC = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [token, setToken] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchToken = async () => {
      try {
        // For development, use test-token
        const authToken = await getToken();
        setToken(authToken || 'test-token');
      } catch (error) {
        console.error('Error fetching token:', error);
        setToken('test-token');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
          <p className="text-gray-400">Loading AI CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <AiCrmApp 
      token={token} 
      userId={user?.id || 'dev-user-1'} 
    />
  );
};