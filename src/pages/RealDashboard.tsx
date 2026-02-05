import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import {
  Phone,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  PhoneCall,
  Calendar,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '../services/supabase-client';
import { useUserContext } from '../services/MinimalUserProvider';
import { useUser } from '../hooks/auth';

interface DashboardStats {
  totalCalls: number;
  activeCampaigns: number;
  conversionRate: number;
  totalCost: number;
  totalLeads: number;
  successfulCalls: number;
  failedCalls: number;
  avgCallDuration: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  total_calls: number;
  successful_calls: number;
  total_cost: number;
  created_at: string;
}

interface RecentCall {
  id: string;
  campaign_name: string;
  lead_name: string;
  duration: number;
  status: string;
  outcome: string;
  created_at: string;
}

export default function RealDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const userContext = useUserContext();
  const { user } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    activeCampaigns: 0,
    conversionRate: 0,
    totalCost: 0,
    totalLeads: 0,
    successfulCalls: 0,
    failedCalls: 0,
    avgCallDuration: 0,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [callVolumeData, setCallVolumeData] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      fetchDashboardData(); // Refresh every minute
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (campaignsError) throw campaignsError;
      
      // Fetch calls
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (callsError) throw callsError;
      
      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*');
      
      if (leadsError) throw leadsError;
      
      // Calculate stats
      const activeCampaigns = campaignsData?.filter(c => c.status === 'active').length || 0;
      const totalCalls = callsData?.length || 0;
      const successfulCalls = callsData?.filter(c => c.status === 'completed').length || 0;
      const failedCalls = callsData?.filter(c => c.status === 'failed').length || 0;
      const conversionRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
      const totalCost = callsData?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;
      const totalDuration = callsData?.reduce((sum, call) => sum + (call.duration || 0), 0) || 0;
      const avgCallDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
      
      setStats({
        totalCalls,
        activeCampaigns,
        conversionRate,
        totalCost,
        totalLeads: leadsData?.length || 0,
        successfulCalls,
        failedCalls,
        avgCallDuration,
      });
      
      setCampaigns(campaignsData || []);
      
      // Prepare recent calls with campaign names
      const recentCallsWithNames = await Promise.all(
        (callsData?.slice(0, 10) || []).map(async (call) => {
          const campaign = campaignsData?.find(c => c.id === call.campaign_id);
          const { data: lead } = await supabase
            .from('leads')
            .select('first_name, last_name')
            .eq('id', call.lead_id)
            .single();
          
          return {
            id: call.id,
            campaign_name: campaign?.name || 'Unknown',
            lead_name: lead ? `${lead.first_name} ${lead.last_name}` : 'Unknown',
            duration: call.duration || 0,
            status: call.status,
            outcome: call.outcome || 'pending',
            created_at: call.created_at,
          };
        })
      );
      
      setRecentCalls(recentCallsWithNames);
      
      // Generate call volume data for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          date: date.toISOString().split('T')[0],
          calls: 0,
        };
      });
      
      callsData?.forEach(call => {
        const callDate = new Date(call.created_at).toISOString().split('T')[0];
        const dayData = last7Days.find(d => d.date === callDate);
        if (dayData) {
          dayData.calls++;
        }
      });
      
      setCallVolumeData(last7Days);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Calls',
      value: stats.totalCalls.toLocaleString(),
      change: stats.successfulCalls > 0 ? `${stats.successfulCalls} successful` : 'No calls yet',
      icon: Phone,
      color: 'purple',
      trend: 'up',
    },
    {
      title: 'Active Campaigns',
      value: stats.activeCampaigns.toString(),
      change: `${campaigns.length} total`,
      icon: Target,
      color: 'emerald',
      trend: 'neutral',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      change: `${stats.successfulCalls}/${stats.totalCalls} calls`,
      icon: TrendingUp,
      color: 'pink',
      trend: stats.conversionRate > 30 ? 'up' : 'down',
    },
    {
      title: 'Total Cost',
      value: formatCurrency(stats.totalCost),
      change: `Avg ${formatCurrency(stats.totalCalls > 0 ? stats.totalCost / stats.totalCalls : 0)}/call`,
      icon: DollarSign,
      color: 'blue',
      trend: 'neutral',
    },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-black">
      <div className="w-full mt-8 space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-400">
              {getGreeting()}, {userContext?.firstName || user?.firstName || 'User'}! • {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => navigate('/campaign-processor')}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Activity className="mr-2 h-4 w-4" />
              Processor
            </Button>
            <Button
              onClick={() => navigate('/campaigns')}
              className="bg-emerald-600 font-medium text-white transition-all duration-200 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Real Data Alert */}
        {stats.totalCalls === 0 && (
          <Alert className="border-yellow-800 bg-yellow-900/20">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300">
              This dashboard now shows real data. Import leads and start campaigns to see activity.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card
              key={stat.title}
              className="cursor-pointer border-gray-800 bg-gray-900 transition-all duration-200 hover:border-gray-600 hover:bg-gray-800/50"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-semibold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                  <div className={`rounded-full p-2 bg-${stat.color}-500/10`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Call Volume Chart */}
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-white">Call Volume</CardTitle>
              <CardDescription className="text-gray-400">Last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={callVolumeData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorCalls)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Campaign Performance */}
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-white">Campaign Performance</CardTitle>
              <CardDescription className="text-gray-400">Success rate by campaign</CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.slice(0, 5).map((campaign) => {
                    const successRate = campaign.total_calls > 0 
                      ? (campaign.successful_calls / campaign.total_calls) * 100 
                      : 0;
                    
                    return (
                      <div key={campaign.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">{campaign.name}</span>
                          <span className="text-sm text-gray-400">
                            {campaign.total_calls} calls
                          </span>
                        </div>
                        <Progress value={successRate} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center">
                  <p className="text-gray-500">No campaigns yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Calls */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Calls</CardTitle>
                <CardDescription className="text-gray-400">Recent Activity</CardDescription>
              </div>
              <Button
                onClick={() => navigate('/all-calls')}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentCalls.length > 0 ? (
              <div className="space-y-4">
                {recentCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between rounded-lg border border-gray-800 p-3 hover:bg-gray-800/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-emerald-500/10 p-2">
                        <PhoneCall className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{call.lead_name}</p>
                        <p className="text-xs text-gray-400">{call.campaign_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-300">{formatDuration(call.duration)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(call.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge
                        variant={call.status === 'completed' ? 'success' : 'secondary'}
                        className="text-xs"
                      >
                        {call.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center">
                <div className="text-center">
                  <Phone className="mx-auto h-8 w-8 text-gray-600 mb-2" />
                  <p className="text-gray-500">No calls yet</p>
                  <p className="text-xs text-gray-600 mt-1">Start a campaign to see call activity</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}