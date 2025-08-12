import React from 'react';
import { useUserContext } from '../services/MinimalUserProvider';

export const DebugUserInfo: React.FC = () => {
  const { userContext } = useUserContext();

  // Disabled for production
  return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border border-gray-600 bg-gray-800 p-4 text-xs text-white">
      <div className="mb-2 font-bold">🔍 Debug User Info</div>
      <div>
        <strong>Email:</strong> {userContext?.email || 'None'}
      </div>
      <div>
        <strong>Role:</strong> {userContext?.role || 'None'}
      </div>
      <div>
        <strong>Name:</strong> {userContext?.firstName} {userContext?.lastName}
      </div>
      <div>
        <strong>Org:</strong> {userContext?.organizationName || 'None'}
      </div>
    </div>
  );
};
