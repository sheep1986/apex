
import { Toaster } from '@/components/ui/toaster';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ContactsProvider } from './contexts/ContactsContext';

// Pages
import AIAssistants from './pages/AIAssistants';
import { Analytics } from './pages/Analytics';
import Billing from './pages/Billing';
import Campaigns from './pages/Campaigns';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import KnowledgeBase from './pages/KnowledgeBase';
import { Login } from './pages/Login';
import OnboardingWizard from './pages/OnboardingWizard';
import Organizations from './pages/Organizations';
import PlatformAnalytics from './pages/PlatformAnalytics';
import PlatformOwnerDashboard from './pages/PlatformOwnerDashboard';
import Settings from './pages/Settings';
import { Signup } from './pages/Signup';
import SupportTicketingSystem from './pages/SupportTicketingSystem';
import SystemHealth from './pages/SystemHealth';
import Telephony from './pages/Telephony';
import UserManagement from './pages/UserManagement';

// Feature Pages
import Squads from './pages/Squads';
import Tools from './pages/Tools';

// Other Pages
import AllCalls from './pages/AllCalls';
import LiveCalls from './pages/LiveCalls';

function App() {
  return (
    <ContactsProvider>
      <ErrorBoundary>
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

            
            {/* Squads & Tools Routes */}
            <Route path="/squads" element={<Squads />} />
            <Route path="/tools" element={<Tools />} />
            
            {/* Catch all for dashboard */}
            <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
        <Toaster />
      </ErrorBoundary>
    </ContactsProvider>
  );
}

export default App;
