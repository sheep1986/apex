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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Phone,
  Users,
  TrendingUp,
  DollarSign,
  Play,
  Settings,
  Plus,
  ChevronRight,
  Activity,
  Clock,
  Target,
  Zap,
  Rocket,
  Building,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  UserCheck,
  PhoneCall,
  Filter,
  Download,
  Calendar,
  Bot,
  UserPlus,
  Percent,
  TrendingDown,
  FileDown,
  PhoneIncoming,
  PhoneOutgoing,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Star,
  Award,
  Sparkles,
  Crown,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserContext } from '../services/MinimalUserProvider';
import { useUser } from '../hooks/auth';

// Import Supabase client
import { supabase } from '../services/supabase-client';


// All data comes from Supabase — no hardcoded values

export default function Dashboard() {
  const navigate = useNavigate();
  const { userContext } = useUserContext();
  const { user } = useUser();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update clock every minute (not every second)
    return () => clearInterval(timer);
  }, []);

  const handleQuickAction = (action: string, route: string) => {
    navigate(route);
  };

  const handleExportData = (format: 'csv' | 'pdf') => {
    toast({
      title: 'Export Started',
      description: `Exporting data as ${format.toUpperCase()}...`,
    });
  };

  const [realStats, setRealStats] = useState({
    totalCalls: 0,
    activeCampaigns: 0,
    conversionRate: 0,
    creditBalance: 0,
  });
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [callVolumeData, setCallVolumeData] = useState<any[]>([]);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const orgId = userContext?.organization_id;

  useEffect(() => {
    if (orgId) fetchRealData();
  }, [orgId]);

  const fetchRealData = async () => {
    try {
      // Fetch campaigns for this org
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name, status, total_calls, successful_calls')
        .eq('organization_id', orgId);

      // Fetch voice calls for this org (last 90 days for performance)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data: allCalls } = await supabase
        .from('voice_calls')
        .select('id, status, cost, created_at, customer_number, assistant_id, duration')
        .eq('organization_id', orgId)
        .gte('created_at', ninetyDaysAgo.toISOString());

      // Fetch org credit balance
      const { data: org } = await supabase
        .from('organizations')
        .select('credit_balance')
        .eq('id', orgId)
        .single();

      // Fetch recent calls for display
      const { data: recentCallsData } = await supabase
        .from('voice_calls')
        .select('id, status, cost, created_at, customer_number, duration')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate real stats
      const campaignsArray = Array.isArray(campaigns) ? campaigns : [];
      const allCallsArray = Array.isArray(allCalls) ? allCalls : [];

      const activeCampaigns = campaignsArray.filter(c => c.status === 'active').length;
      const totalCallCount = allCallsArray.length;
      const completedCalls = allCallsArray.filter(c => c.status === 'ended' || c.status === 'completed').length;
      const successRate = totalCallCount > 0 ? (completedCalls / totalCallCount) * 100 : 0;

      setRealStats({
        totalCalls: totalCallCount,
        activeCampaigns,
        conversionRate: successRate,
        creditBalance: org?.credit_balance || 0,
      });

      // Campaign performance for chart
      const campaignPerf = campaignsArray.map(c => ({
        name: c.name?.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
        success: c.total_calls > 0 ? Math.round((c.successful_calls / c.total_calls) * 100) : 0,
      }));
      setCampaignData(campaignPerf);

      // Call volume per day (last 7 days) from real data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayStr = date.toISOString().split('T')[0];
        const callsForDay = allCallsArray.filter(call =>
          call.created_at?.startsWith(dayStr)
        ).length;
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          calls: callsForDay,
        };
      });
      setCallVolumeData(last7Days);

      // Format recent calls
      const recentCallsArray = Array.isArray(recentCallsData) ? recentCallsData : [];
      const formattedCalls = recentCallsArray.map((call, index) => ({
        id: call.id || index + 1,
        contact: call.customer_number || 'Unknown',
        campaign: 'Voice Call',
        duration: formatDuration(call.duration || 0),
        status: call.status || 'unknown',
      }));

      setRecentCalls(formattedCalls);
      setLoading(false);
    } catch (error) {
      console.error('Dashboard: Error fetching data:', error);
      setLoading(false);
    }
  };
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = [
    {
      title: 'Total Calls',
      value: realStats.totalCalls.toLocaleString(),
      change: realStats.totalCalls > 0 ? 'Real data' : 'No calls yet',
      icon: Phone,
      color: 'purple',
    },
    {
      title: 'Active Campaigns',
      value: realStats.activeCampaigns.toString(),
      change: 'Live',
      icon: Target,
      color: 'emerald',
    },
    {
      title: 'Conversion Rate',
      value: `${realStats.conversionRate.toFixed(1)}%`,
      change: 'Actual rate',
      icon: TrendingUp,
      color: 'pink',
    },
    {
      title: 'Credit Balance',
      value: `$${realStats.creditBalance.toFixed(2)}`,
      change: realStats.creditBalance > 10 ? 'Healthy' : 'Low balance',
      icon: DollarSign,
      color: 'blue',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-black">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <span className="ml-3 text-gray-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

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
            onClick={() => navigate('/campaigns')}
            className="bg-emerald-600 font-medium text-white transition-all duration-200 hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer border-gray-800 bg-gray-900 transition-all duration-200 hover:border-gray-600 hover:bg-gray-800/50"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-semibold text-white">{stat.value}</p>
                  <div className="flex items-center space-x-1">
                    <span
                      className={`text-xs font-medium ${
                        stat.change.startsWith('+') ? 'text-pink-400' : 'text-red-400'
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500">Last 90 days</span>
                  </div>
                </div>
                <div className={`rounded-lg border p-3 ${ 
                  stat.color === 'purple' ? 'border-purple-500/20 bg-purple-500/10' :
                  stat.color === 'emerald' ? 'border-emerald-500/20 bg-emerald-500/10' :
                  stat.color === 'pink' ? 'border-pink-500/20 bg-pink-500/10' :
                  stat.color === 'blue' ? 'border-blue-500/20 bg-blue-500/10' :
                  'border-gray-700/30 bg-gray-800/50'
                }`}>
                  <stat.icon className={`h-5 w-5 ${
                    stat.color === 'purple' ? 'text-purple-400' :
                    stat.color === 'emerald' ? 'text-emerald-400' :
                    stat.color === 'pink' ? 'text-pink-400' :
                    stat.color === 'blue' ? 'text-blue-400' :
                    'text-gray-300'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Divider */}
      <div className="mb-8 border-b border-gray-700"></div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Call Volume Chart */}
        <Card className="border-gray-800 bg-gray-900 transition-all duration-200 hover:border-gray-600 hover:bg-gray-800/50">
          <CardHeader className="border-b border-gray-800/30 p-4">
            <CardTitle className="text-lg font-semibold text-white">Call Volume</CardTitle>
            <CardDescription className="text-sm text-gray-400">
              Last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={callVolumeData}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(55, 65, 81, 0.3)" />
                  <XAxis dataKey="date" stroke="rgba(156, 163, 175, 0.7)" />
                  <YAxis stroke="rgba(156, 163, 175, 0.7)" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(55, 65, 81, 0.7)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(8px)',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#ec4899"
                    fillOpacity={1}
                    fill="url(#colorCalls)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card className="border-gray-800 bg-gray-900 transition-all duration-200 hover:border-gray-600 hover:bg-gray-800/50">
          <CardHeader className="border-b border-gray-800/30 p-4">
            <CardTitle className="text-lg font-semibold text-white">Campaign Performance</CardTitle>
            <CardDescription className="text-sm text-gray-400">
              Success rate by campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(55, 65, 81, 0.3)" />
                  <XAxis dataKey="name" stroke="rgba(156, 163, 175, 0.7)" />
                  <YAxis stroke="rgba(156, 163, 175, 0.7)" />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(236, 72, 153, 0.5)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 8px 32px rgba(236, 72, 153, 0.2)',
                    }}
                    labelStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(236, 72, 153, 0.1)' }}
                  />
                  <Bar dataKey="success" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Calls */}
      <Card className="border-gray-800 bg-gray-900 transition-all duration-200 hover:border-gray-600 hover:bg-gray-800/50">
        <CardHeader className="border-b border-gray-800/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-white">Recent Calls</CardTitle>
              <CardDescription className="text-sm text-gray-400">
                Recent Activity
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/all-calls')}
              className="text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white"
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-800/30">
            {recentCalls && recentCalls.length > 0 && recentCalls.map((call) => (
              <div
                key={call.id}
                className="group flex cursor-pointer items-center justify-between px-4 py-3 transition-all duration-200 hover:bg-gray-800/30"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      call.status === 'completed'
                        ? 'border border-pink-500/20 bg-pink-500/10'
                        : call.status === 'in-progress'
                          ? 'border border-blue-500/20 bg-blue-500/10'
                          : 'border border-gray-700/30 bg-gray-800/50'
                    }`}
                  >
                    <Phone
                      className={`h-4 w-4 ${
                        call.status === 'completed'
                          ? 'text-pink-400'
                          : call.status === 'in-progress'
                            ? 'text-blue-400'
                            : 'text-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{call.contact}</p>
                    <p className="text-xs text-gray-400">{call.campaign}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xs text-white">{call.duration}</p>
                    <p
                      className={`text-xs ${
                        call.status === 'completed'
                          ? 'text-pink-400'
                          : call.status === 'in-progress'
                            ? 'text-blue-400'
                            : 'text-gray-400'
                      }`}
                    >
                      {call.status === 'completed' ? 'Completed' : 
                       call.status === 'in-progress' ? 'In Progress' : 
                       call.status === 'missed' ? 'Missed' : call.status}
                    </p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-gray-500 transition-all duration-200 group-hover:text-gray-300" />
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
