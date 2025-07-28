import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  Shield,
  AlertTriangle,
  Download,
  FileText,
  Calendar,
  Filter,
  Building,
  Phone,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Database,
  Server,
  Globe,
  CreditCard,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Lock,
  BarChart3,
  PieChart as PieChartIcon,
  FileDown,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Sample data - in production this would come from API
const revenueData = [
  { month: 'Jan', revenue: 45000, mrr: 38000, growth: 12 },
  { month: 'Feb', revenue: 52000, mrr: 41000, growth: 15 },
  { month: 'Mar', revenue: 48000, mrr: 43000, growth: 8 },
  { month: 'Apr', revenue: 61000, mrr: 47000, growth: 18 },
  { month: 'May', revenue: 58000, mrr: 51000, growth: 14 },
  { month: 'Jun', revenue: 67000, mrr: 56000, growth: 22 },
];

const clientRevenueData = [
  { name: 'TechCorp Solutions', revenue: 12500, calls: 8420, leads: 342 },
  { name: 'Global Fitness Inc', revenue: 9800, calls: 6230, leads: 287 },
  { name: 'Healthcare Partners', revenue: 8200, calls: 5140, leads: 198 },
  { name: 'Real Estate Pro', revenue: 7600, calls: 4890, leads: 176 },
  { name: 'E-commerce Plus', revenue: 6400, calls: 3920, leads: 145 },
];

const usageMetrics = {
  totalCalls: 128450,
  totalLeads: 3847,
  avgSuccessRate: 74.3,
  activeClients: 47,
  totalAgents: 156,
  avgCallDuration: '3:24',
};

const systemHealthData = [
  { name: 'API Gateway', status: 'operational', uptime: 99.98, latency: 42 },
  { name: 'Database', status: 'operational', uptime: 99.95, latency: 18 },
  { name: 'AI Processing', status: 'operational', uptime: 99.92, latency: 156 },
  { name: 'Voice Services', status: 'degraded', uptime: 98.76, latency: 234 },
  { name: 'Analytics Engine', status: 'operational', uptime: 99.89, latency: 67 },
];

const errorLogs = [
  {
    id: 1,
    timestamp: '2024-01-07 14:23:45',
    service: 'Voice API',
    error: 'Connection timeout',
    severity: 'warning',
  },
  {
    id: 2,
    timestamp: '2024-01-07 13:45:12',
    service: 'Database',
    error: 'Slow query detected',
    severity: 'info',
  },
  {
    id: 3,
    timestamp: '2024-01-07 12:18:33',
    service: 'AI Engine',
    error: 'Rate limit exceeded',
    severity: 'error',
  },
  {
    id: 4,
    timestamp: '2024-01-07 11:02:45',
    service: 'Analytics',
    error: 'Data sync delayed',
    severity: 'warning',
  },
];

export default function PlatformAnalytics() {
  const [selectedDateRange, setSelectedDateRange] = useState('last30days');
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedCampaignType, setSelectedCampaignType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Simulate role check - in production this would come from auth context
  const userRole = 'admin'; // This should be fetched from auth context
  const isAdmin = userRole === 'admin' || userRole === 'platform_owner';

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: 'Access Denied',
        description: "You don't have permission to view this page.",
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [isAdmin, navigate, toast]);

  const handleExportData = (format: 'csv' | 'pdf') => {
    setIsLoading(true);
    setTimeout(() => {
      toast({
        title: 'Export Started',
        description: `Exporting platform analytics as ${format.toUpperCase()}...`,
      });
      setIsLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-emerald-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'warning':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'info':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Admin Badge */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Platform Analytics</h1>
              <Badge className="border-red-600/30 bg-red-600/20 text-red-400">
                <Lock className="mr-1 h-3 w-3" />
                Admin Only
              </Badge>
            </div>
            <p className="text-gray-400">
              Comprehensive platform metrics and system health monitoring
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
              onClick={() => handleExportData('csv')}
              disabled={isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
              onClick={() => handleExportData('pdf')}
              disabled={isLoading}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Filter className="mr-2 h-5 w-5 text-emerald-500" />
              Data Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Date Range</label>
                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                  <SelectTrigger className="border-gray-700 bg-gray-900/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-900">
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="last90days">Last 90 Days</SelectItem>
                    <SelectItem value="thisYear">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Client Organization
                </label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="border-gray-700 bg-gray-900/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-900">
                    <SelectItem value="all">All Clients</SelectItem>
                    {clientRevenueData.map((client) => (
                      <SelectItem key={client.name} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Campaign Type
                </label>
                <Select value={selectedCampaignType} onValueChange={setSelectedCampaignType}>
                  <SelectTrigger className="border-gray-700 bg-gray-950/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-900">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 border border-gray-800 bg-gray-900/90">
            <TabsTrigger
              value="revenue"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Revenue Overview
            </TabsTrigger>
            <TabsTrigger
              value="usage"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Activity className="mr-2 h-4 w-4" />
              Usage Metrics
            </TabsTrigger>
            <TabsTrigger
              value="clients"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Building className="mr-2 h-4 w-4" />
              Top Clients
            </TabsTrigger>
            <TabsTrigger
              value="health"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Server className="mr-2 h-4 w-4" />
              System Health
            </TabsTrigger>
          </TabsList>

          {/* Revenue Overview Tab */}
          <TabsContent value="revenue" className="space-y-6">
            {/* Key Revenue Metrics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                      <p className="mt-1 text-2xl font-bold text-white">$321,000</p>
                      <div className="mt-2 flex items-center text-emerald-400">
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                        <p className="text-xs">+18.5% from last month</p>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                      <DollarSign className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">MRR</p>
                      <p className="mt-1 text-2xl font-bold text-white">$56,000</p>
                      <div className="mt-2 flex items-center text-emerald-400">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        <p className="text-xs">+12.3% growth</p>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Avg Revenue/Client</p>
                      <p className="mt-1 text-2xl font-bold text-white">$6,830</p>
                      <div className="mt-2 flex items-center text-orange-400">
                        <Users className="mr-1 h-3 w-3" />
                        <p className="text-xs">47 active clients</p>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                      <Building className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Churn Rate</p>
                      <p className="mt-1 text-2xl font-bold text-white">2.1%</p>
                      <div className="mt-2 flex items-center text-emerald-400">
                        <TrendingDown className="mr-1 h-3 w-3" />
                        <p className="text-xs">-0.5% from last month</p>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                      <TrendingDown className="h-5 w-5 text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Revenue & MRR Trends</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monthly revenue and recurring revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.3}
                          name="Total Revenue"
                        />
                        <Area
                          type="monotone"
                          dataKey="mrr"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                          name="MRR"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Revenue by Client</CardTitle>
                  <CardDescription className="text-gray-400">
                    Top 5 revenue generating clients
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clientRevenueData.map((client, index) => (
                      <div key={client.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 font-semibold text-emerald-400">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-white">{client.name}</p>
                            <p className="text-sm text-gray-400">
                              {client.calls.toLocaleString()} calls
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">
                            ${client.revenue.toLocaleString()}
                          </p>
                          <p className="text-xs text-emerald-400">
                            {((client.revenue / 321000) * 100).toFixed(1)}% of total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Usage Metrics Tab */}
          <TabsContent value="usage" className="space-y-6">
            {/* Usage Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Calls</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {usageMetrics.totalCalls.toLocaleString()}
                      </p>
                    </div>
                    <Phone className="h-8 w-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Leads</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {usageMetrics.totalLeads.toLocaleString()}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Success Rate</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {usageMetrics.avgSuccessRate}%
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Active Clients</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {usageMetrics.activeClients}
                      </p>
                    </div>
                    <Building className="h-8 w-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Agents</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {usageMetrics.totalAgents}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Avg Duration</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {usageMetrics.avgCallDuration}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Usage Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Call Volume by Hour</CardTitle>
                  <CardDescription className="text-gray-400">
                    Platform-wide call distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { hour: '8AM', calls: 1200 },
                          { hour: '9AM', calls: 2800 },
                          { hour: '10AM', calls: 3400 },
                          { hour: '11AM', calls: 3100 },
                          { hour: '12PM', calls: 2200 },
                          { hour: '1PM', calls: 2600 },
                          { hour: '2PM', calls: 3200 },
                          { hour: '3PM', calls: 3500 },
                          { hour: '4PM', calls: 2900 },
                          { hour: '5PM', calls: 1800 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="hour" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="calls" fill="#10b981" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Lead Conversion Funnel</CardTitle>
                  <CardDescription className="text-gray-400">
                    Platform-wide conversion metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm text-gray-300">Calls Made</span>
                        <span className="text-sm font-medium text-white">128,450</span>
                      </div>
                      <Progress value={100} className="h-3 bg-gray-800" />
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm text-gray-300">Connected</span>
                        <span className="text-sm font-medium text-white">95,414 (74.3%)</span>
                      </div>
                      <Progress value={74.3} className="h-3 bg-gray-800" />
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm text-gray-300">Interested</span>
                        <span className="text-sm font-medium text-white">28,624 (22.3%)</span>
                      </div>
                      <Progress value={22.3} className="h-3 bg-gray-800" />
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm text-gray-300">Qualified Leads</span>
                        <span className="text-sm font-medium text-white">3,847 (3.0%)</span>
                      </div>
                      <Progress value={3.0} className="h-3 bg-gray-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Top Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Top Performing Clients</CardTitle>
                    <CardDescription className="text-gray-400">
                      Ranked by revenue contribution and performance metrics
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700 hover:border-emerald-600 hover:bg-emerald-600/10"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Charts
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700 hover:border-emerald-600 hover:bg-emerald-600/10"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                          Client Organization
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                          Revenue
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                          Call Volume
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                          Leads Generated
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                          Conversion Rate
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientRevenueData.map((client, index) => (
                        <tr
                          key={client.name}
                          className="border-b border-gray-800 transition-colors hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-lg font-semibold ${
                                index === 0
                                  ? 'bg-yellow-600/20 text-yellow-400'
                                  : index === 1
                                    ? 'bg-gray-600/20 text-gray-300'
                                    : index === 2
                                      ? 'bg-orange-600/20 text-orange-400'
                                      : 'bg-gray-800 text-gray-400'
                              }`}
                            >
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-white">{client.name}</p>
                              <p className="text-xs text-gray-400">Active since Jan 2023</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold text-white">
                                ${client.revenue.toLocaleString()}
                              </p>
                              <p className="text-xs text-emerald-400">+12% MoM</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-white">{client.calls.toLocaleString()}</p>
                              <p className="text-xs text-gray-400">calls/month</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-white">{client.leads}</p>
                              <p className="text-xs text-gray-400">qualified leads</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={(client.leads / client.calls) * 100}
                                className="h-2 w-16"
                              />
                              <span className="text-sm text-white">
                                {((client.leads / client.calls) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="border-emerald-600/30 bg-emerald-600/20 text-emerald-400">
                              Active
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Client Performance Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Distribution</CardTitle>
                  <CardDescription className="text-gray-400">Client revenue share</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clientRevenueData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="revenue"
                          label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                        >
                          {clientRevenueData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === 0
                                  ? '#10b981'
                                  : index === 1
                                    ? '#3b82f6'
                                    : index === 2
                                      ? '#8b5cf6'
                                      : index === 3
                                        ? '#f59e0b'
                                        : '#ef4444'
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Client Growth Trends</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monthly client acquisition
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: 'Jan', clients: 32 },
                          { month: 'Feb', clients: 35 },
                          { month: 'Mar', clients: 38 },
                          { month: 'Apr', clients: 42 },
                          { month: 'May', clients: 45 },
                          { month: 'Jun', clients: 47 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9ca3af" />
                        <YAxis stroke="#9ca3af" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="clients"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="health" className="space-y-6">
            {/* System Status Overview */}
            <Alert className="border-gray-800 bg-gray-900/90">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertTitle className="text-white">System Status</AlertTitle>
              <AlertDescription className="text-gray-300">
                Voice Services experiencing minor degradation. All other systems operational.
              </AlertDescription>
            </Alert>

            {/* Service Health Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {systemHealthData.map((service) => (
                <Card
                  key={service.name}
                  className="border-gray-800 bg-gray-900/90 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-medium text-white">{service.name}</h3>
                      <Badge
                        className={
                          service.status === 'operational'
                            ? 'border-emerald-600/30 bg-emerald-600/20 text-emerald-400'
                            : service.status === 'degraded'
                              ? 'border-yellow-600/30 bg-yellow-600/20 text-yellow-400'
                              : 'border-red-600/30 bg-red-600/20 text-red-400'
                        }
                      >
                        {service.status}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Uptime</span>
                        <span className={`text-sm font-medium ${getStatusColor(service.status)}`}>
                          {service.uptime}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Latency</span>
                        <span className="text-sm font-medium text-white">{service.latency}ms</span>
                      </div>
                      <Progress value={service.uptime} className="h-2 bg-gray-800" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Error Logs */}
            <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Recent Error Logs</CardTitle>
                    <CardDescription className="text-gray-400">
                      System errors and warnings
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Full Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {errorLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border border-gray-800 bg-gray-950/50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <Badge className={getSeverityColor(log.severity)}>{log.severity}</Badge>
                            <span className="text-sm text-gray-400">{log.timestamp}</span>
                          </div>
                          <p className="font-medium text-white">{log.service}</p>
                          <p className="mt-1 text-sm text-gray-300">{log.error}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="hover:bg-gray-800">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* API Usage Stats */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-800 bg-gray-900/90">
                <CardHeader>
                  <CardTitle className="text-white">API Usage Stats</CardTitle>
                  <CardDescription className="text-gray-400">Last 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-gray-950/50 p-3">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-emerald-400" />
                        <span className="text-white">Total API Calls</span>
                      </div>
                      <span className="font-semibold text-white">2.4M</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-950/50 p-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                        <span className="text-white">Success Rate</span>
                      </div>
                      <span className="font-semibold text-white">99.7%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-950/50 p-3">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-yellow-400" />
                        <span className="text-white">Avg Response Time</span>
                      </div>
                      <span className="font-semibold text-white">142ms</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-950/50 p-3">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-400" />
                        <span className="text-white">Failed Requests</span>
                      </div>
                      <span className="font-semibold text-white">7,234</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Database Performance</CardTitle>
                  <CardDescription className="text-gray-400">Current metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm text-gray-300">CPU Usage</span>
                        <span className="text-sm font-medium text-white">42%</span>
                      </div>
                      <Progress value={42} className="h-2 bg-gray-800" />
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm text-gray-300">Memory Usage</span>
                        <span className="text-sm font-medium text-white">68%</span>
                      </div>
                      <Progress value={68} className="h-2 bg-gray-800" />
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm text-gray-300">Storage Used</span>
                        <span className="text-sm font-medium text-white">234 GB / 500 GB</span>
                      </div>
                      <Progress value={46.8} className="h-2 bg-gray-800" />
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm text-gray-300">Active Connections</span>
                        <span className="text-sm font-medium text-white">127 / 200</span>
                      </div>
                      <Progress value={63.5} className="h-2 bg-gray-800" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
