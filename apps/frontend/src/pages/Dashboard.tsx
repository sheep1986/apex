import { memo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Phone, 
  TrendingUp, 
  Calendar,
  Activity,
  DollarSign,
  Target,
  CheckCircle
} from 'lucide-react';

function DashboardPage() {
  const stats = [
    { label: 'Total Leads', value: '6', icon: Users, color: 'bg-blue-500' },
    { label: 'Active Campaigns', value: '1', icon: Target, color: 'bg-green-500' },
    { label: 'Calls Today', value: '0', icon: Phone, color: 'bg-purple-500' },
    { label: 'Conversion Rate', value: '0%', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  const quickActions = [
    { to: '/crm', label: 'View Leads', icon: Users, desc: 'Manage your contacts and leads' },
    { to: '/campaigns', label: 'Campaigns', icon: Target, desc: 'Launch and track campaigns' },
    { to: '/all-calls', label: 'Call Logs', icon: Phone, desc: 'View all call history' },
    { to: '/analytics', label: 'Analytics', icon: Activity, desc: 'View performance metrics' },
  ];

  const recentActivity = [
    { time: 'Just now', event: 'Dashboard loaded', type: 'system' },
    { time: '5 min ago', event: '6 leads imported', type: 'success' },
    { time: '1 hour ago', event: 'Campaign created', type: 'info' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Apex AI</h1>
        <p className="opacity-90">Your Voice AI Platform Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">{stat.value}</span>
            </div>
            <p className="text-gray-400 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.to}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center mb-3">
                <action.icon className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-white font-medium">{action.label}</span>
              </div>
              <p className="text-gray-400 text-sm">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                <span className="text-gray-300">{item.event}</span>
              </div>
              <span className="text-gray-500 text-sm">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Status */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Campaign Status</h2>
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-300">Test Campaign</span>
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm">Pending</span>
          </div>
          <div className="text-sm text-gray-400">
            6 leads ready • 0 calls made • Awaiting launch
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(DashboardPage);