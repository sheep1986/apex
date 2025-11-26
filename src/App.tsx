import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Toaster } from '@/components/ui/toaster';
import { MatrixRoute } from './components/MatrixRoute';
import './App.css';

// Pages
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import { Landing } from './pages/Landing';
import ScaleArchitecture from './pages/ScaleArchitecture';
import SupportTicketingSystem from './pages/SupportTicketingSystem';
import PhoneNumbers from './pages/PhoneNumbers';
import VapiDashboard from './pages/VapiDashboard';
import { Analytics } from './pages/Analytics';
import { Clients } from './pages/Clients';
import { LiveCalls } from './pages/LiveCalls';
import PlatformOwnerDashboard from './pages/PlatformOwnerDashboard';
import Billing from './pages/Billing';
import CRM from './pages/CRM';
import { Team } from './pages/Team';
import CostAnalytics from './pages/CostAnalytics';
import AddUser from './pages/AddUser';
import Settings from './pages/Settings';
import TeamManagement from './pages/TeamManagement';
import CampaignDetails from './pages/CampaignDetails';
import AIAssistants from './pages/AIAssistants';
import LeadImport from './pages/LeadImport';
import CampaignLauncher from './pages/CampaignLauncher';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { LoginPage } from './components/auth/LoginPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { EnhancedLoginPage } from './components/auth/EnhancedLoginPage';
import { EnhancedSignUpPage } from './components/auth/EnhancedSignUpPage';
import Messaging from './pages/Messaging';
import LeadDetails from './pages/LeadDetails';
import CampaignSetupWizard from './pages/CampaignSetupWizard';
import AuditLogs from './pages/AuditLogs';
import SystemHealth from './pages/SystemHealth';
import AllCalls from './pages/AllCalls';
import Notifications from './pages/Notifications';
import { Organizations } from './pages/Organizations';
import OrganizationSettingsV2 from './pages/OrganizationSettingsV2';
import { OrganizationProvider } from './contexts/OrganizationContext';
import OrganizationSetupWizard from './pages/OrganizationSetupWizard';
import OrganizationManagement from './pages/OrganizationManagement';
import PlatformAnalytics from './pages/PlatformAnalytics';
import ApiKeys from './pages/ApiKeys';
import OutboundCalls from './pages/OutboundCalls';
import CampaignProcessor from './pages/CampaignProcessor';
import CallDetails from './pages/CallDetails';
import CampaignCalls from './pages/CampaignCalls';
import LeadPage from './pages/LeadPage';
import Appointments from './pages/Appointments';
import AgencyDashboard from './pages/AgencyDashboard';
import AcceptInvitation from './pages/AcceptInvitation';
import ForceLogout from './pages/ForceLogout';
import Unauthorized from './pages/Unauthorized';
import { RoleBasedRedirect } from './components/RoleBasedRedirect';
import { RoleBasedRoute } from './components/RoleBasedRoute';
import { ContactsProvider } from './contexts/ContactsContext';
import { AuthRedirect } from './components/AuthRedirect';

function App() {
  return (
    <ContactsProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/crm" replace />} />
          {/* Fixed: Removed routing="path" and path props as per Manu's solution */}
          <Route path="/login/*" element={<AuthRedirect><SignIn /></AuthRedirect>} />
          <Route path="/signup/*" element={<AuthRedirect><SignUp /></AuthRedirect>} />
          <Route path="/accept-invitation" element={<AcceptInvitation />} />
          <Route path="/force-logout" element={<ForceLogout />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
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
            <Route path="/campaigns" element={<VapiDashboard />} />
            <Route path="/vapi-dashboard" element={<VapiDashboard />} />
            <Route path="/test-campaigns" element={<VapiDashboard />} />
            <Route path="/assistants" element={<AIAssistants />} />
            <Route path="/campaign-wizard" element={<CampaignSetupWizard />} />
            <Route path="/campaigns/:id" element={<CampaignDetails />} />
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
            />
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

            {/* Agency Routes */}
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
            />
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
