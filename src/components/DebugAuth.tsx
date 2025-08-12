import { useUser, useAuth } from '@/hooks/auth';
import { useUserContext } from '@/services/MinimalUserProvider';
import { useUser as useClerkUser } from '@clerk/clerk-react';

export function DebugAuth() {
  const userHook = useUser();
  const { userContext } = useUserContext();
  const { user: clerkUser } = useClerkUser();
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 p-4 rounded-lg text-xs text-white max-w-md">
      <h3 className="font-bold mb-2">Debug Auth Info</h3>
      
      <div className="mb-2">
        <strong>Clerk User:</strong>
        <pre className="text-gray-300">{JSON.stringify({
          id: clerkUser?.id,
          email: clerkUser?.primaryEmailAddress?.emailAddress,
          metadata: clerkUser?.publicMetadata
        }, null, 2)}</pre>
      </div>
      
      <div className="mb-2">
        <strong>Hook User:</strong>
        <pre className="text-gray-300">{JSON.stringify({
          isLoaded: userHook.isLoaded,
          isSignedIn: userHook.isSignedIn,
          email: userHook.user?.email,
          role: userHook.user?.role,
          organization_id: userHook.user?.organization_id
        }, null, 2)}</pre>
      </div>
      
      <div>
        <strong>User Context:</strong>
        <pre className="text-gray-300">{JSON.stringify(userContext, null, 2)}</pre>
      </div>
    </div>
  );
}