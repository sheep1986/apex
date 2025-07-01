import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Campaigns } from './pages/Campaigns'
import { PhoneNumbers } from './pages/PhoneNumbers'
import { Login } from './pages/Login'
import CRM from './pages/CRM'
import Leads from './pages/Leads'
import NewCampaign from './pages/NewCampaign'
import CampaignDetails from './pages/CampaignDetails'
import { VapiDashboard } from './pages/VapiDashboard'
import { Analytics } from './pages/Analytics'
import { Team } from './pages/Team'
import { Billing } from './pages/Billing'
import { Settings } from './pages/Settings'
import { Onboarding } from './pages/Onboarding'
import { Clients } from './pages/Clients'
import { LiveCalls } from './pages/LiveCalls'
import './App.css'
import { TooltipProvider } from './components/ui/tooltip'

function App() {
  return (
    <TooltipProvider delayDuration={0}>
      <Router>
        <div className="min-h-screen bg-gray-950 text-white">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="campaigns/new" element={<NewCampaign />} />
              <Route path="campaigns/:id" element={<CampaignDetails />} />
              <Route path="phone-numbers" element={<PhoneNumbers />} />
              <Route path="leads" element={<Leads />} />
              <Route path="crm" element={<CRM />} />
              <Route path="vapi" element={<VapiDashboard />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="team" element={<Team />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<Settings />} />
              <Route path="clients" element={<Clients />} />
              <Route path="live-calls" element={<LiveCalls />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </TooltipProvider>
  )
}

export default App
