import { Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { SimpleAuthFlow } from './components/auth/SimpleAuthFlow';
import { SimpleOrgProvider, RequireOrg } from './contexts/SimpleOrgContext';

// Layouts
import { PlatformLayout } from './layouts/PlatformLayout';
import { OrgLayout } from './layouts/OrgLayout';

// Pages
import { Landing } from './pages/Landing';
import PlatformOwnerDashboard from './pages/PlatformOwnerDashboard';
import Dashboard from './pages/Dashboard';
import { Campaigns } from './pages/Campaigns';
import { Analytics } from './pages/Analytics';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * Example of clean authentication implementation
 * 
 * Key features:
 * 1. Simple routing structure: /org/[orgId]/[page]
 * 2. No complex redirects or role checking in components
 * 3. Organization context available everywhere under /org routes
 * 4. Platform owner has separate /platform routes
 */
function AppWithAuth() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={
          <div className="min-h-screen bg-gray-950 flex items-center justify-center">
            <SignIn 
              afterSignInUrl="/auth/redirect"
              appearance={{
                elements: {
                  rootBox: "w-full max-w-md",
                  card: "bg-gray-900 border-gray-800",
                }
              }}
            />
          </div>
        } />

        {/* Auth Redirect - Determines where user goes */}
        <Route path="/auth/redirect" element={
          <SignedIn>
            <SimpleAuthFlow />
          </SignedIn>
        } />

        {/* Platform Owner Routes (No org context needed) */}
        <Route path="/platform/*" element={
          <SignedIn>
            <RequireRole role="platform_owner">
              <PlatformLayout>
                <Routes>
                  <Route index element={<PlatformOwnerDashboard />} />
                  <Route path="organizations" element={<Organizations />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="analytics" element={<PlatformAnalytics />} />
                </Routes>
              </PlatformLayout>
            </RequireRole>
          </SignedIn>
        } />

        {/* Organization-Scoped Routes */}
        <Route path="/org/:orgId/*" element={
          <SignedIn>
            <SimpleOrgProvider>
              <RequireOrg>
                <OrgLayout>
                  <Routes>
                    {/* Client Routes */}
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="campaigns" element={<Campaigns />} />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="settings" element={<OrgSettings />} />
                    
                    {/* Agency Routes */}
                    <Route path="agency" element={<AgencyDashboard />} />
                    <Route path="clients" element={<ClientList />} />
                  </Routes>
                </OrgLayout>
              </RequireOrg>
            </SimpleOrgProvider>
          </SignedIn>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ClerkProvider>
  );
}

/**
 * Simple role check component
 */
function RequireRole({ role, children }: { role: string; children: React.ReactNode }) {
  const userRole = sessionStorage.getItem('userRole');
  
  if (userRole !== role) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

export default AppWithAuth;