import { Button } from '@/components/ui/button';
import { BarChart3, Phone, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TestDashboard() {
  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <h1 className="mb-6 text-4xl font-bold text-emerald-500">🚀 TRINITY LABS AI PLATFORM</h1>
      <div className="mb-6 rounded-lg bg-gray-800 p-6">
        <h2 className="mb-4 text-2xl font-semibold">System Status: WORKING! ✅</h2>
        <p className="mb-4 text-gray-300">Your Voice add-on platform is ready to go!</p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-2 text-xl font-semibold text-white">Create New Campaign</h2>
            <p className="mb-4 text-gray-400">Start a new AI calling campaign</p>
            <Button asChild className="w-full">
              <Link to="/campaigns">
                <Phone className="mr-2 h-4 w-4" />
                New Campaign
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-2 text-xl font-semibold text-white">Campaign Dashboard</h2>
            <p className="mb-4 text-gray-400">View all your campaigns</p>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/campaigns">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Campaigns
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="mb-2 text-xl font-semibold text-white">Manage Leads</h2>
            <p className="mb-4 text-gray-400">Upload and manage your leads</p>
            <Button
              asChild
              variant="default"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Link to="/leads">
                <Users className="mr-2 h-4 w-4" />
                Manage Leads
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg bg-gray-700 p-4">
          <h3 className="mb-2 text-lg font-semibold">🎯 Voice Integration Active</h3>
          <ul className="list-inside list-disc space-y-1 text-gray-300">
            <li>Marcus Assistant: 724fac0a-f43c-4f96-8a57-c0f164c4a60f</li>
            <li>Joanne Assistant: fc7afcac-972d-4e6c-b791-6d2577820ae9</li>
            <li>Phone Number: +44 (7482) 792343</li>
            <li>API Key: ******************************9382e</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
