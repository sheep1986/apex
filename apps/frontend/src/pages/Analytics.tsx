import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building2,
  MessageSquare,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  LineChart,
  Phone,
  Plus,
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function Analytics() {
  const [activeTab, setActiveTab] = useState('overview');

  // Platform KPIs
  const kpis = {
    revenue: {
      current: 18450,
      previous: 15200,
      change: 21.4,
      trend: 'up',
    },
    organizations: {
      total: 45,
      active: 38,
      new: 5,
      churn: 2,
    },
    tickets: {
      total: 156,
      resolved: 142,
      avgResolutionTime: 2.4,
      satisfaction: 98.2,
    },
    usage: {
      totalCalls: 125420,
      totalMinutes: 421560,
      avgCallDuration: 3.36,
    },
    calls: {
      total: 125420,
      successful: 110000,
      failed: 15420,
    },
  };

  // Revenue trend data
  const revenueData = [
    { date: 'Jan 1', revenue: 12500, organizations: 32 },
    { date: 'Jan 7', revenue: 13200, organizations: 34 },
    { date: 'Jan 14', revenue: 14800, organizations: 37 },
    { date: 'Jan 21', revenue: 15200, organizations: 40 },
    { date: 'Jan 28', revenue: 16900, organizations: 42 },
    { date: 'Feb 4', revenue: 17600, organizations: 44 },
    { date: 'Feb 11', revenue: 18450, organizations: 45 },
  ];

  // Organization distribution by plan
  const planDistribution = [
    { name: 'Starter', value: 18, color: '#3B82F6' },
    { name: 'Professional', value: 22, color: '#8B5CF6' },
    { name: 'Enterprise', value: 5, color: '#F59E0B' },
  ];

  // Support metrics
  const supportMetrics = [
    { category: 'Technical', tickets: 67, avgTime: 2.1 },
    { category: 'Billing', tickets: 34, avgTime: 1.8 },
    { category: 'Onboarding', tickets: 28, avgTime: 3.2 },
    { category: 'Feature Requests', tickets: 27, avgTime: 4.5 },
  ];

  // Organization activity
  const organizationActivity = [
    { name: 'TechFlow Solutions', calls: 12450, revenue: 599, status: 'active' },
    { name: 'Digital Dynamics', calls: 18200, revenue: 1299, status: 'active' },
    { name: 'Growth Partners', calls: 450, revenue: 0, status: 'trial' },
    { name: 'Enterprise Corp', calls: 25100, revenue: 2499, status: 'active' },
    { name: 'StartupHub', calls: 8200, revenue: 299, status: 'active' },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400">
              Comprehensive analytics and insights for your platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Custom Dashboard
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Calls</p>
                  <p className="text-3xl font-bold text-white">
                    {kpis.calls.total.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Phone className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-400">+{kpis.calls.successful} successful</span>
                <span className="text-red-400">-{kpis.calls.failed} failed</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Organizations</p>
                  <p className="text-3xl font-bold text-white">{kpis.organizations.active}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
                  <Building2 className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-green-400">+{kpis.organizations.new} new</span>
                <span className="text-red-400">-{kpis.organizations.churn} churn</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Support Satisfaction</p>
                  <p className="text-3xl font-bold text-white">{kpis.tickets.satisfaction}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/20">
                  <MessageSquare className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{kpis.tickets.avgResolutionTime}h avg resolution</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Platform Usage</p>
                  <p className="text-3xl font-bold text-white">
                    {(kpis.usage.totalCalls / 1000).toFixed(1)}k
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/20">
                  <Activity className="h-6 w-6 text-orange-400" />
                </div>
              </div>
              <div className="text-sm text-gray-400">Total calls this month</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Revenue Trend */}
          <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                Revenue & Growth Trend
                <Badge className="border-green-500/30 bg-green-500/20 text-green-400">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +21.4%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8B5CF6"
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Organization Distribution */}
          <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Organization Distribution by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Support Metrics */}
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Support Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supportMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="tickets" fill="#8B5CF6" />
                <Bar dataKey="avgTime" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Organizations */}
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Top Organizations by Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {organizationActivity.map((org, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-700/50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600">
                      <span className="font-bold text-white">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-white">{org.name}</p>
                      <p className="text-sm text-gray-400">
                        {org.calls.toLocaleString()} calls this month
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">${org.revenue}/mo</p>
                    <Badge
                      className={`text-xs ${
                        org.status === 'active'
                          ? 'border-green-500/30 bg-green-500/20 text-green-400'
                          : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {org.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
