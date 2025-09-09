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
import { RealDataBanner } from '../components/RealDataBanner';


const conversionData = [
  { stage: 'Lead Generation', value: 100 },
  { stage: 'Qualified Leads', value: 75 },
  { stage: 'Demo Scheduled', value: 50 },
  { stage: 'Demo Completed', value: 25 },
  { stage: 'Closed Won', value: 10 },
];

// Campaign data now comes from database via state

const recentCalls = [
  { id: 1, contact: 'John Smith', campaign: 'Summer Sale', duration: '3:45', status: 'completed' },
  {
    id: 2,
    contact: 'Sarah Johnson',
    campaign: 'Product Launch',
    duration: '2:30',
    status: 'in-progress',
  },
  {
    id: 3,
    contact: 'Mike Davis',
    campaign: 'Customer Win-back',
    duration: '5:12',
    status: 'completed',
  },
  {
    id: 4,
    contact: 'Emily Brown',
    campaign: 'Holiday Promo',
    duration: '1:55',
    status: 'completed',
  },
  { id: 5, contact: 'David Wilson', campaign: 'Lead Nurture', duration: '4:20', status: 'missed' },
];

export default function Dashboard() {
  console.log('Dashboard component rendering...');

  
  // Chart data that depends on translations
  const recentCallsData = [
    { name: 'Monday', calls: 24, successful: 18, inbound: 8, outbound: 16 },
    { name: 'Tuesday', calls: 32, successful: 28, inbound: 10, outbound: 22 },
    { name: 'Wednesday', calls: 28, successful: 22, inbound: 12, outbound: 16 },
    { name: 'Thursday', calls: 45, successful: 38, inbound: 15, outbound: 30 },
    { name: 'Friday', calls: 38, successful: 31, inbound: 14, outbound: 24 },
    { name: 'Saturday', calls: 22, successful: 19, inbound: 7, outbound: 15 },
    { name: 'Sunday', calls: 15, successful: 12, inbound: 5, outbound: 10 },
  ];

  const callOutcomesData = [
    { name: 'Connected', value: 68, color: '#10b981' },
    { name: 'Voicemail', value: 22, color: '#f59e0b' },
    { name: 'Busy', value: 7, color: '#6b7280' },
    { name: 'Failed', value: 3, color: '#ef4444' },
  ];

  // Call volume data is now declared as state in line 210
  const navigate = useNavigate();
  const { userContext } = useUserContext();
  const { user } = useUser();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  const [selectedVoiceAgent, setSelectedVoiceAgent] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [activeAssistants] = useState(8);
  const [totalCalls, setTotalCalls] = useState(12543);
  const [successRate, setSuccessRate] = useState(72.5);
  const [totalCost, setTotalCost] = useState(1502.34);
  const [leadsGenerated, setLeadsGenerated] = useState(437);
  const [conversionRate, setConversionRate] = useState(12.8);

  useEffect(() => {
    console.log('Dashboard useEffect running...');
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalCalls((prev) => prev + Math.floor(Math.random() * 3));
      setSuccessRate((prev) => Math.max(70, Math.min(80, prev + (Math.random() - 0.5) * 2)));
      setTotalCost((prev) => prev + Math.random() * 0.5);
      setLeadsGenerated((prev) => prev + (Math.random() > 0.7 ? 1 : 0));
      setConversionRate((prev) => Math.max(20, Math.min(30, prev + (Math.random() - 0.5) * 1)));
    }, 30000);

    return () => clearInterval(interval);
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
    totalCost: 0,
  });
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [callVolumeData, setCallVolumeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      // Fetch campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*');
      
      // Fetch calls
      const { data: calls } = await supabase
        .from('calls')
        .select('*');
      
      // Calculate real stats
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const totalCalls = calls?.length || 0;
      const successfulCalls = calls?.filter(c => c.status === 'completed').length || 0;
      const conversionRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
      const totalCost = calls?.reduce((sum, call) => sum + (call.cost || 0), 0) || 0;
      
      setRealStats({
        totalCalls,
        activeCampaigns,
        conversionRate,
        totalCost,
      });
      
      // Set campaign data for chart
      const campaignPerf = campaigns?.map(c => ({
        name: c.name,
        successRate: c.total_calls > 0 ? (c.successful_calls / c.total_calls) * 100 : 0,
        value: c.successful_calls || 0,
      })) || [];
      
      setCampaignData(campaignPerf);
      
      // Generate call volume data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          calls: Math.floor(Math.random() * 10), // Will be replaced with real data
        };
      });
      
      setCallVolumeData(last7Days);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
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
      title: 'Total Cost',
      value: `£${realStats.totalCost.toFixed(2)}`,
      change: 'GBP',
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

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-black">
      <div className="w-full mt-8 space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Real Data Banner */}
      <RealDataBanner hasData={realStats.totalCalls > 0} />
      
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
                    <span className="text-xs text-gray-500">Weekly growth</span>
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
            {recentCalls.map((call) => (
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
