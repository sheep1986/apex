
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ContactsProvider } from './contexts/ContactsContext';

// ─── Route-level code splitting ─────────────────────────────────
// Each page loads in its own chunk, reducing initial bundle size.

const LazyFallback = (
  <div className="flex h-screen items-center justify-center bg-black">
    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
  </div>
);

// Auth (small, kept eager for fast first paint)
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

// Core pages (lazy-loaded)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const OnboardingWizard = lazy(() => import('./pages/OnboardingWizard'));
const AIAssistants = lazy(() => import('./pages/AIAssistants'));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const Billing = lazy(() => import('./pages/Billing'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const Clients = lazy(() => import('./pages/Clients'));
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'));
const Settings = lazy(() => import('./pages/Settings'));
const Telephony = lazy(() => import('./pages/Telephony'));

// Feature pages
const Squads = lazy(() => import('./pages/Squads'));
const Tools = lazy(() => import('./pages/Tools'));
const Workflows = lazy(() => import('./pages/Workflows'));
const TestSuites = lazy(() => import('./pages/TestSuites'));

// Call pages
const AllCalls = lazy(() => import('./pages/AllCalls'));
const LiveCalls = lazy(() => import('./pages/LiveCalls'));

// CRM pages
const Contacts = lazy(() => import('./pages/Contacts'));
const ContactDetail = lazy(() => import('./pages/ContactDetail'));
const SalesPipeline = lazy(() => import('./pages/SalesPipeline'));

// Campaign sub-pages
const CampaignSetupWizard = lazy(() => import('./pages/CampaignSetupWizard'));

// Team & Agent pages
const AgentDashboard = lazy(() => import('./pages/AgentDashboard'));
const Team = lazy(() => import('./pages/Team').then(m => ({ default: m.Team })));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));

// Admin & Settings pages
const OrganizationSettings = lazy(() => import('./pages/OrganizationSettings'));
const SecuritySettings = lazy(() => import('./pages/SecuritySettings'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const DataManagement = lazy(() => import('./pages/DataManagement'));
const ApiKeys = lazy(() => import('./pages/ApiKeys'));
const CampaignDetails = lazy(() => import('./pages/CampaignDetails'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Integrations = lazy(() => import('./pages/Integrations'));
const ScheduledReports = lazy(() => import('./pages/ScheduledReports'));
const EmailTemplates = lazy(() => import('./pages/EmailTemplates'));
const AgencyBranding = lazy(() => import('./pages/AgencyBranding'));
const CostAnalytics = lazy(() => import('./pages/CostAnalytics'));
const ReportsAnalytics = lazy(() => import('./pages/ReportsAnalytics'));

// Platform owner pages
const PlatformOwnerDashboard = lazy(() => import('./pages/PlatformOwnerDashboard'));
const Organizations = lazy(() => import('./pages/Organizations'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const PlatformAnalytics = lazy(() => import('./pages/PlatformAnalytics'));
const SupportTicketingSystem = lazy(() => import('./pages/SupportTicketingSystem'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));

function App() {
  return (
    <ContactsProvider>
      <ErrorBoundary>
        <Suspense fallback={LazyFallback}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Onboarding — protected but full-screen (no sidebar/Layout) */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingWizard />
                </ProtectedRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard Redirect Logic */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Platform Owner Routes */}
              <Route path="/platform" element={<PlatformOwnerDashboard />} />
              <Route path="/platform-owner" element={<Navigate to="/platform" replace />} />
              <Route path="/organizations" element={<Organizations />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/platform-analytics" element={<PlatformAnalytics />} />
              <Route path="/support-tickets" element={<SupportTicketingSystem />} />
              <Route path="/system-health" element={<SystemHealth />} />
              <Route path="/audit-logs" element={<AuditLogs />} />

              {/* Agency/Client Routes */}
              <Route path="/clients" element={<Clients />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/billing" element={<Billing />} />

              {/* Voice Routes */}
              <Route path="/all-calls" element={<AllCalls />} />
              <Route path="/live-calls" element={<LiveCalls />} />
              <Route path="/ai-assistants" element={<AIAssistants />} />
              <Route path="/telephony" element={<Telephony />} />
              <Route path="/knowledge" element={<KnowledgeBase />} />

              {/* CRM Routes */}
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/contacts/:id" element={<ContactDetail />} />
              <Route path="/pipeline" element={<SalesPipeline />} />

              {/* Campaign Sub-routes */}
              <Route path="/campaigns/new" element={<CampaignSetupWizard />} />
              <Route path="/campaigns/:id" element={<CampaignDetails />} />

              {/* Agent Dashboard (Live Handoff) */}
              <Route path="/agent-dashboard" element={<AgentDashboard />} />
              <Route path="/team" element={<Team />} />
              <Route path="/team-management" element={<TeamManagement />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/scheduled-reports" element={<ScheduledReports />} />
              <Route path="/email-templates" element={<EmailTemplates />} />
              <Route path="/agency-branding" element={<AgencyBranding />} />

              {/* Squads & Tools Routes */}
              <Route path="/squads" element={<Squads />} />
              <Route path="/tools" element={<Tools />} />

              {/* Workflows & Test Suites */}
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/test-suites" element={<TestSuites />} />

              {/* Admin & Settings */}
              <Route path="/organization-settings" element={<OrganizationSettings />} />
              <Route path="/security-settings" element={<SecuritySettings />} />
              <Route path="/data-management" element={<DataManagement />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="/cost-analytics" element={<CostAnalytics />} />
              <Route path="/reports" element={<ReportsAnalytics />} />

              {/* Catch all for dashboard */}
              <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
      </ErrorBoundary>
    </ContactsProvider>
  );
}

export default App;
