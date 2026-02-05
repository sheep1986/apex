import { Toaster } from '@/components/ui/toaster';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import AIAssistants from './pages/AIAssistants';
import { Analytics } from './pages/Analytics';
import Billing from './pages/Billing';
import CRM from './pages/CRM';
import CampaignDetails from './pages/CampaignDetails';
import CostAnalytics from './pages/CostAnalytics';
import Dashboard from './pages/Dashboard';
import { LiveCalls } from './pages/LiveCalls';
import PhoneNumbers from './pages/PhoneNumbers';
import PlatformOwnerDashboard from './pages/PlatformOwnerDashboard';
import ScaleArchitecture from './pages/ScaleArchitecture';
import Settings from './pages/Settings';
import SupportTicketingSystem from './pages/SupportTicketingSystem';
import UserManagement from './pages/UserManagement';
import VoiceDashboard from './pages/VoiceDashboard';

import { RoleBasedRedirect } from './components/RoleBasedRedirect';
import { RoleBasedRoute } from './components/RoleBasedRoute';
import { ContactsProvider } from './contexts/ContactsContext';
import { OrganizationProvider } from './contexts/OrganizationContext';
import AcceptInvitation from './pages/AcceptInvitation';
import AllCalls from './pages/AllCalls';
import ApiKeys from './pages/ApiKeys';
import Appointments from './pages/Appointments';
import AuditLogs from './pages/AuditLogs';
import CallDetails from './pages/CallDetails';
import CampaignCalls from './pages/CampaignCalls';
import CampaignProcessor from './pages/CampaignProcessor';
import ForceLogout from './pages/ForceLogout';
import LeadPage from './pages/LeadPage';
import { Login } from './pages/Login';
import Messaging from './pages/Messaging';
import Notifications from './pages/Notifications';
import OrganizationManagement from './pages/OrganizationManagement';
import OrganizationSettingsV2 from './pages/OrganizationSettingsV2';
import OrganizationSetupWizard from './pages/OrganizationSetupWizard';
import { Organizations } from './pages/Organizations';
import PlatformAnalytics from './pages/PlatformAnalytics';
import { Signup } from './pages/Signup';
import SystemHealth from './pages/SystemHealth';

function App() {
  return (
    <ContactsProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/crm" replace />} />
          {/* Fixed: Removed routing="path" and path props as per Manu's solution */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/accept-invitation" element={<AcceptInvitation />} />
          <Route path="/force-logout" element={<ForceLogout />} />
          <Route
            path="/portal"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />
          <Route path="/scale-architecture" element={<ScaleArchitecture />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Client Portal Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Phase 3.3 Campaigns */}
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/new" element={<CampaignWizard />} />
            <Route path="/campaigns/:id" element={<CampaignDetails />} />
            
            <Route path="/voice-dashboard" element={<VoiceDashboard />} />
            <Route path="/assistants" element={<AIAssistants />} />
            <Route path="/campaigns/:campaignId/calls" element={<CampaignCalls />} />
            <Route path="/campaign-processor" element={<CampaignProcessor />} />
            <Route path="/calls/:callId" element={<CallDetails />} />
            <Route path="/leads/:leadId" element={<LeadPage />} />
            <Route path="/all-calls" element={<AllCalls />} />
            <Route path="/live-calls" element={<LiveCalls />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/cost-analytics" element={<CostAnalytics />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/phone-numbers" element={<PhoneNumbers />} />
            <Route path="/messaging" element={<Messaging />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/organization-settings"
              element={
                <RoleBasedRoute allowedRoles={['client_admin', 'platform_owner']} redirectTo="/dashboard">
                  <OrganizationProvider>
                    <OrganizationSettingsV2 />
                  </OrganizationProvider>
                </RoleBasedRoute>
              }
            />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Platform Owner Routes */}
            <Route
              path="/platform"
              element={
                <RoleBasedRoute allowedRoles={['platform_owner']} redirectTo="/dashboard">
                  <PlatformOwnerDashboard />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/platform-owner"
              element={
                <RoleBasedRoute allowedRoles={['platform_owner']} redirectTo="/dashboard">
                  <PlatformOwnerDashboard />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/organizations"
              element={
                <RoleBasedRoute allowedRoles={['platform_owner']} redirectTo="/dashboard">
                  <Organizations />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/organizations/:id"
              element={
                <RoleBasedRoute allowedRoles={['platform_owner', 'client_admin']} redirectTo="/dashboard">
                  <OrganizationManagement />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/organization-setup"
              element={
                <RoleBasedRoute allowedRoles={['platform_owner']} redirectTo="/dashboard">
                  <OrganizationSetupWizard />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <RoleBasedRoute allowedRoles={['platform_owner']} redirectTo="/dashboard">
                  <UserManagement />
                </RoleBasedRoute>
              }
            />
            {/* Team Management - HIDDEN for V1
            <Route
              path="/team-management"
              element={
                <RoleBasedRoute
                  allowedRoles={['platform_owner', 'client_admin', 'agency_admin']}
                  redirectTo="/dashboard"
                >
                  <TeamManagement />
                </RoleBasedRoute>
              }
            /> */}
            <Route
              path="/support-tickets"
              element={
                <RoleBasedRoute allowedRoles={['platform_owner']} redirectTo="/dashboard">
                  <SupportTicketingSystem />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/platform-analytics"
              element={
                <RoleBasedRoute allowedRoles={['platform_owner']} redirectTo="/dashboard">
                  <PlatformAnalytics />
                </RoleBasedRoute>
              }
            />

            {/* Agency Routes - HIDDEN for V1
            <Route
              path="/agency"
              element={
                <RoleBasedRoute
                  allowedRoles={['agency_owner', 'agency_admin', 'agency_user']}
                  redirectTo="/dashboard"
                >
                  <AgencyDashboard />
                </RoleBasedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <RoleBasedRoute
                  allowedRoles={['agency_owner', 'agency_admin', 'platform_owner']}
                  redirectTo="/dashboard"
                >
                  <Clients />
                </RoleBasedRoute>
              }
            /> */}
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/system-health" element={<SystemHealth />} />

            {/* Catch all route */}
            <Route
              path="*"
              element={
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-950">
                  <div className="text-center">
                    <h1 className="mb-4 text-4xl font-bold text-white">404 - Page Not Found</h1>
                    <p className="text-gray-400">The page you're looking for doesn't exist.</p>
                  </div>
                </div>
              }
            />
          </Route>
        </Routes>
        <Toaster />
      </ErrorBoundary>
    </ContactsProvider>
  );
}

export default App;
