import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Phone,
  Users,
  Target,
  DollarSign,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  PieChart,
  LineChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Globe,
  Mail,
  Database,
  Search,
  Settings,
} from 'lucide-react';

interface AnalyticsData {
  totalCalls: number;
  totalMinutes: number;
  successRate: number;
  averageCallDuration: number;
  totalCost: number;
  leadsGenerated: number;
  conversionRate: number;
  activeCampaigns: number;
  revenueGenerated: number;
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
}

interface CallData {
  id: string;
  campaignName: string;
  phoneNumber: string;
  duration: number;
  status: 'completed' | 'failed' | 'busy' | 'no-answer';
  cost: number;
  timestamp: string;
  leadQuality: 'hot' | 'warm' | 'cold';
  location: string;
}

interface CampaignPerformance {
  id: string;
  name: string;
  totalCalls: number;
  successRate: number;
  cost: number;
  leads: number;
  revenue: number;
  status: 'active' | 'paused' | 'completed';
}

export default function ReportsAnalytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last-30-days');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'calls' | 'leads' | 'revenue'>('overview');

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalCalls: 12567,
    totalMinutes: 45230,
    successRate: 73.2,
    averageCallDuration: 3.6,
    totalCost: 8450.25,
    leadsGenerated: 1834,
    conversionRate: 14.6,
    activeCampaigns: 8,
    revenueGenerated: 125400,
    callsToday: 234,
    callsThisWeek: 1456,
    callsThisMonth: 5789,
  });

  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([
    {
      id: '1',
      name: 'Lead Generation Campaign',
      totalCalls: 3456,
      successRate: 78.5,
      cost: 2340.50,
      leads: 567,
      revenue: 45600,
      status: 'active',
    },
    {
      id: '2',
      name: 'Customer Follow-up',
      totalCalls: 2123,
      successRate: 84.2,
      cost: 1456.75,
      leads: 289,
      revenue: 28900,
      status: 'active',
    },
    {
      id: '3',
      name: 'Event Promotion',
      totalCalls: 1890,
      successRate: 65.8,
      cost: 1234.25,
      leads: 234,
      revenue: 18900,
      status: 'completed',
    },
  ]);

  const [recentCalls, setRecentCalls] = useState<CallData[]>([
    {
      id: '1',
      campaignName: 'Lead Generation',
      phoneNumber: '+1 (555) 123-4567',
      duration: 245,
      status: 'completed',
      cost: 2.35,
      timestamp: '2024-01-15T14:30:00Z',
      leadQuality: 'hot',
      location: 'San Francisco, CA',
    },
    {
      id: '2',
      campaignName: 'Customer Follow-up',
      phoneNumber: '+1 (555) 234-5678',
      duration: 180,
      status: 'completed',
      cost: 1.95,
      timestamp: '2024-01-15T14:25:00Z',
      leadQuality: 'warm',
      location: 'New York, NY',
    },
    {
      id: '3',
      campaignName: 'Event Promotion',
      phoneNumber: '+1 (555) 345-6789',
      duration: 0,
      status: 'no-answer',
      cost: 0.15,
      timestamp: '2024-01-15T14:20:00Z',
      leadQuality: 'cold',
      location: 'Chicago, IL',
    },
  ]);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedCampaign]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  const exportReport = (format: 'csv' | 'pdf' | 'excel') => {
    toast({
      title: 'Export Started',
      description: `Generating ${format.toUpperCase()} report for ${dateRange}...`,
    });
    // Simulate export
    setTimeout(() => {
      toast({
        title: 'Export Complete',
        description: `Report has been downloaded as ${format.toUpperCase()}.`,
      });
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'active': return 'bg-emerald-600';
      case 'failed': return 'bg-red-600';
      case 'paused': return 'bg-yellow-600';
      case 'busy': return 'bg-orange-600';
      case 'no-answer': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getLeadQualityColor = (quality: string) => {
    switch (quality) {
      case 'hot': return 'bg-red-600';
      case 'warm': return 'bg-yellow-600';
      case 'cold': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-pink-500/20 rounded-lg">
              <BarChart3 className="h-8 w-8 text-pink-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
              <p className="text-gray-400">Comprehensive insights into your calling campaigns and performance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadAnalyticsData}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48 border-gray-700 bg-gray-800 text-white">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 rounded-lg bg-gray-900 p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'campaigns', label: 'Campaigns', icon: Target },
            { id: 'calls', label: 'Call Details', icon: Phone },
            { id: 'leads', label: 'Lead Analysis', icon: Users },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Calls</CardTitle>
                  <div className="rounded-lg p-2 border border-purple-500/20 bg-purple-500/10">
                    <Phone className="h-4 w-4 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analyticsData.totalCalls.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-emerald-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +12.5% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Success Rate</CardTitle>
                  <div className="rounded-lg p-2 border border-emerald-500/20 bg-emerald-500/10">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analyticsData.successRate}%</div>
                  <div className="flex items-center text-xs text-emerald-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +2.1% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Cost</CardTitle>
                  <div className="rounded-lg p-2 border border-pink-500/20 bg-pink-500/10">
                    <DollarSign className="h-4 w-4 text-pink-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">${analyticsData.totalCost.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-red-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +8.3% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Leads Generated</CardTitle>
                  <div className="rounded-lg p-2 border border-blue-500/20 bg-blue-500/10">
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analyticsData.leadsGenerated.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-emerald-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +18.7% from last month
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Call Volume Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Today</span>
                    <span className="font-medium text-white">{analyticsData.callsToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">This Week</span>
                    <span className="font-medium text-white">{analyticsData.callsThisWeek}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">This Month</span>
                    <span className="font-medium text-white">{analyticsData.callsThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Avg Duration</span>
                    <span className="font-medium text-white">{analyticsData.averageCallDuration} min</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Conversion Rate</span>
                    <span className="font-medium text-emerald-400">{analyticsData.conversionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Active Campaigns</span>
                    <span className="font-medium text-white">{analyticsData.activeCampaigns}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Minutes</span>
                    <span className="font-medium text-white">{analyticsData.totalMinutes.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Revenue Generated</span>
                    <span className="font-medium text-emerald-400">${analyticsData.revenueGenerated.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Export Reports</CardTitle>
                  <CardDescription className="text-gray-400">
                    Download comprehensive reports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => exportReport('pdf')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF Report
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => exportReport('excel')}
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Export Excel Report
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => exportReport('csv')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Campaign Performance Tab */}
        {activeTab === 'campaigns' && (
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-white">Campaign Performance</CardTitle>
              <CardDescription className="text-gray-400">
                Detailed performance metrics for all campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignPerformance.map((campaign) => (
                  <div key={campaign.id} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-white">{campaign.name}</h3>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="mr-2 h-4 w-4" />
                          Manage
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                      <div>
                        <p className="text-xs text-gray-400">Total Calls</p>
                        <p className="text-lg font-bold text-white">{campaign.totalCalls.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Success Rate</p>
                        <p className="text-lg font-bold text-emerald-400">{campaign.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Total Cost</p>
                        <p className="text-lg font-bold text-white">${campaign.cost.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Leads</p>
                        <p className="text-lg font-bold text-blue-400">{campaign.leads}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Revenue</p>
                        <p className="text-lg font-bold text-emerald-400">${campaign.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">ROI</p>
                        <p className="text-lg font-bold text-green-400">
                          {((campaign.revenue - campaign.cost) / campaign.cost * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call Details Tab */}
        {activeTab === 'calls' && (
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-white">Recent Call Details</CardTitle>
              <CardDescription className="text-gray-400">
                Detailed log of individual call records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCalls.map((call) => (
                  <div key={call.id} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{call.phoneNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {call.campaignName}
                        </Badge>
                        <Badge className={getStatusColor(call.status)}>
                          {call.status.replace('-', ' ')}
                        </Badge>
                        <Badge className={getLeadQualityColor(call.leadQuality)}>
                          {call.leadQuality} lead
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{new Date(call.timestamp).toLocaleString()}</span>
                        <span>{call.location}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Duration: </span>
                        <span className="text-white">{call.duration > 0 ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Cost: </span>
                        <span className="text-white">${call.cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lead Analysis Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* Lead Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analyticsData.leadsGenerated.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-emerald-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +24.3% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Hot Leads</CardTitle>
                  <Zap className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">287</div>
                  <div className="flex items-center text-xs text-emerald-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +15.6% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Warm Leads</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">623</div>
                  <div className="flex items-center text-xs text-emerald-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +8.9% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Cold Leads</CardTitle>
                  <XCircle className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-400">924</div>
                  <div className="flex items-center text-xs text-red-400">
                    <TrendingDown className="mr-1 h-3 w-3" />
                    -3.2% from last month
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lead Quality Distribution */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Lead Quality Distribution</CardTitle>
                  <CardDescription className="text-gray-400">
                    Breakdown of lead quality across all campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <span className="text-sm text-gray-300">Hot Leads</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">287</span>
                        <span className="text-xs text-gray-400">(15.6%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                        <span className="text-sm text-gray-300">Warm Leads</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">623</span>
                        <span className="text-xs text-gray-400">(34.0%)</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-300">Cold Leads</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">924</span>
                        <span className="text-xs text-gray-400">(50.4%)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Lead Source Analysis</CardTitle>
                  <CardDescription className="text-gray-400">
                    Top performing campaigns by lead generation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaignPerformance.map((campaign, index) => (
                      <div key={campaign.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-blue-600 text-xs font-bold text-white">
                            {index + 1}
                          </div>
                          <span className="text-sm text-gray-300">{campaign.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{campaign.leads}</span>
                          <span className="text-xs text-gray-400">leads</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lead Actions */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Lead Management Actions</CardTitle>
                <CardDescription className="text-gray-400">
                  Export and manage your lead data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Button
                    variant="outline"
                    onClick={() => exportReport('csv')}
                    className="justify-start"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Lead CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: 'Lead Import',
                        description: 'Opening lead import tool...',
                      });
                    }}
                    className="justify-start"
                  >
                    <Database className="mr-2 h-4 w-4" />
                    Import Leads
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: 'Lead Cleanup',
                        description: 'Starting duplicate lead cleanup...',
                      });
                    }}
                    className="justify-start"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Clean Duplicates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-400">${analyticsData.revenueGenerated.toLocaleString()}</div>
                  <div className="flex items-center text-xs text-emerald-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +32.1% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Revenue per Lead</CardTitle>
                  <Target className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    ${(analyticsData.revenueGenerated / analyticsData.leadsGenerated).toFixed(2)}
                  </div>
                  <div className="flex items-center text-xs text-emerald-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +5.7% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Cost per Acquisition</CardTitle>
                  <Activity className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    ${(analyticsData.totalCost / analyticsData.leadsGenerated).toFixed(2)}
                  </div>
                  <div className="flex items-center text-xs text-red-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +12.3% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">ROI</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-400">
                    {(((analyticsData.revenueGenerated - analyticsData.totalCost) / analyticsData.totalCost) * 100).toFixed(1)}%
                  </div>
                  <div className="flex items-center text-xs text-emerald-400">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +18.9% from last month
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue by Campaign */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Revenue by Campaign</CardTitle>
                <CardDescription className="text-gray-400">
                  Revenue performance breakdown by campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignPerformance.map((campaign) => {
                    const roi = ((campaign.revenue - campaign.cost) / campaign.cost) * 100;
                    return (
                      <div key={campaign.id} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-medium text-white">{campaign.name}</h3>
                          <Badge className={roi > 200 ? 'bg-emerald-600' : roi > 100 ? 'bg-yellow-600' : 'bg-red-600'}>
                            ROI: {roi.toFixed(1)}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                          <div>
                            <p className="text-xs text-gray-400">Revenue</p>
                            <p className="text-lg font-bold text-emerald-400">${campaign.revenue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Cost</p>
                            <p className="text-lg font-bold text-white">${campaign.cost.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Profit</p>
                            <p className="text-lg font-bold text-emerald-400">
                              ${(campaign.revenue - campaign.cost).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Revenue/Lead</p>
                            <p className="text-lg font-bold text-white">
                              ${(campaign.revenue / campaign.leads).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Cost/Lead</p>
                            <p className="text-lg font-bold text-white">
                              ${(campaign.cost / campaign.leads).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Projections */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Monthly Revenue Trend</CardTitle>
                  <CardDescription className="text-gray-400">
                    Revenue growth over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { month: 'October 2024', revenue: 89200, growth: 15.3 },
                      { month: 'November 2024', revenue: 102800, growth: 18.2 },
                      { month: 'December 2024', revenue: 118400, growth: 12.1 },
                      { month: 'January 2025', revenue: 125400, growth: 5.9 },
                    ].map((data, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">{data.month}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-white">
                            ${data.revenue.toLocaleString()}
                          </span>
                          <Badge className={data.growth > 10 ? 'bg-emerald-600' : 'bg-yellow-600'}>
                            +{data.growth}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Actions</CardTitle>
                  <CardDescription className="text-gray-400">
                    Optimize and analyze revenue performance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: 'Revenue Forecast',
                        description: 'Generating 90-day revenue forecast...',
                      });
                    }}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Generate Revenue Forecast
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => exportReport('pdf')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export Revenue Report
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      toast({
                        title: 'ROI Optimizer',
                        description: 'Analyzing campaigns for ROI optimization...',
                      });
                    }}
                  >
                    <Target className="mr-2 h-4 w-4" />
                    ROI Optimization Analysis
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}