import React, { createContext, useContext, ReactNode } from 'react';
import { useParams } from 'react-router-dom';

interface OrgContextType {
  orgId: string | null;
  orgName: string | null;
  userRole: string | null;
  isOrgRoute: boolean;
}

const OrgContext = createContext<OrgContextType>({
  orgId: null,
  orgName: null,
  userRole: null,
  isOrgRoute: false,
});

/**
 * Simple organization context that reads from session storage
 * No API calls, no re-renders, just static data
 */
export function SimpleOrgProvider({ children }: { children: ReactNode }) {
  const { orgId: routeOrgId } = useParams<{ orgId: string }>();
  
  // Get data from session storage (set during auth)
  const orgId = routeOrgId || sessionStorage.getItem('orgId');
  const orgName = sessionStorage.getItem('orgName');
  const userRole = sessionStorage.getItem('userRole');
  
  const value: OrgContextType = {
    orgId,
    orgName,
    userRole,
    isOrgRoute: !!routeOrgId,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within SimpleOrgProvider');
  }
  return context;
};

/**
 * HOC to protect org-specific routes
 */
export function RequireOrg({ children }: { children: ReactNode }) {
  const { orgId } = useOrg();
  
  if (!orgId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">No Organization Found</h2>
          <p className="text-gray-400">Please contact support.</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}