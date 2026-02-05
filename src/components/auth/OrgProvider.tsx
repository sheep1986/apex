import { useUser } from '@clerk/clerk-react';
import { ReactNode, createContext, useContext } from 'react';

interface OrgContextType {
  orgId: string | undefined;
  orgName: string | undefined;
  userRole: string | undefined;
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

/**
 * cleanOrgProvider
 * 
 * Provides organization context derived directly from Clerk user metadata.
 * This avoids RLS issues and recursive DB lookups for basic context.
 */
export function OrgProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  
  const orgId = user?.publicMetadata?.organizationId as string | undefined;
  const orgName = user?.publicMetadata?.organizationName as string | undefined;
  const userRole = user?.publicMetadata?.role as string | undefined;
  
  const value = {
    orgId,
    orgName,
    userRole,
    isLoading: !isLoaded,
  };
  
  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrgContext() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrgContext must be used within an OrgProvider');
  }
  return context;
}
