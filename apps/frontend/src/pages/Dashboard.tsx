import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

// Sample data - in real app this would come from API

const voiceAgentPerformance = [
  { name: 'Sales Pro', successRate: 82, calls: 145, avgCost: 0.12 },
  { name: 'Support Agent', successRate: 78, calls: 98, avgCost: 0.1 },
  { name: 'Outbound AI', successRate: 75, calls: 203, avgCost: 0.08 },
  { name: 'Custom Agent 1', successRate: 71, calls: 67, avgCost: 0.11 },
];

const campaignPerformance = [
  { name: 'Healthcare Q1', successRate: 76, totalCalls: 432, avgCost: 0.11, leads: 87 },
  { name: 'Fitness Centers', successRate: 82, totalCalls: 289, avgCost: 0.13, leads: 72 },
  { name: 'B2B Software', successRate: 69, totalCalls: 178, avgCost: 0.15, leads: 45 },
  { name: 'Real Estate', successRate: 73, totalCalls: 356, avgCost: 0.12, leads: 93 },
];


const conversionData = [
  { stage: 'Lead Generation', value: 100 },
  { stage: 'Qualified Leads', value: 75 },
  { stage: 'Demo Scheduled', value: 50 },
  { stage: 'Demo Completed', value: 25 },
  { stage: 'Closed Won', value: 10 },
];

const campaignData = [
  { name: 'Summer Sale', success: 78 },
  { name: 'Product Launch', success: 65 },
  { name: 'Customer Win-back', success: 82 },
  { name: 'Holiday Promo', success: 91 },
  { name: 'Lead Nurture', success: 73 },
];

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

  const { t } = useTranslation('dashboard');
  
  // Chart data that depends on translations
  const recentCallsData = [
    { name: t('chart_labels.monday'), calls: 24, successful: 18, inbound: 8, outbound: 16 },
    { name: t('chart_labels.tuesday'), calls: 32, successful: 28, inbound: 10, outbound: 22 },
    { name: t('chart_labels.wednesday'), calls: 28, successful: 22, inbound: 12, outbound: 16 },
    { name: t('chart_labels.thursday'), calls: 45, successful: 38, inbound: 15, outbound: 30 },
    { name: t('chart_labels.friday'), calls: 38, successful: 31, inbound: 14, outbound: 24 },
    { name: t('chart_labels.saturday'), calls: 22, successful: 19, inbound: 7, outbound: 15 },
    { name: t('chart_labels.sunday'), calls: 15, successful: 12, inbound: 5, outbound: 10 },
  ];

  const callOutcomesData = [
    { name: t('chart_labels.connected'), value: 68, color: '#10b981' },
    { name: t('chart_labels.voicemail'), value: 22, color: '#f59e0b' },
    { name: t('chart_labels.busy'), value: 7, color: '#6b7280' },
    { name: t('chart_labels.failed'), value: 3, color: '#ef4444' },
  ];

  const callVolumeData = [
    { date: t('chart_labels.monday'), calls: 320 },
    { date: t('chart_labels.tuesday'), calls: 450 },
    { date: t('chart_labels.wednesday'), calls: 380 },
    { date: t('chart_labels.thursday'), calls: 520 },
    { date: t('chart_labels.friday'), calls: 480 },
    { date: t('chart_labels.saturday'), calls: 350 },
    { date: t('chart_labels.sunday'), calls: 290 },
  ];
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
      title: t('notifications.export_started'),
      description: t('notifications.exporting_data_as', { format: format.toUpperCase() }),
    });
  };

  const stats = [
    {
      title: t('stats.total_calls'),
      value: '12,543',
      change: '+12.5%',
      icon: Phone,
      color: 'purple',
    },
    {
      title: t('stats.active_campaigns'),
      value: '24',
      change: '+3',
      icon: Target,
      color: 'emerald',
    },
    {
      title: t('stats.conversion_rate'),
      value: '32.8%',
      change: '+5.2%',
      icon: TrendingUp,
      color: 'pink',
    },
    {
      title: t('stats.revenue'),
      value: '$45,231',
      change: '+18.7%',
      icon: DollarSign,
      color: 'blue',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('welcome.good_morning');
    if (hour < 18) return t('welcome.good_afternoon');
    return t('welcome.good_evening');
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-black">
      <div className="w-full mt-8 space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-400">
            {getGreeting()}, {userContext?.firstName || user?.firstName || t('welcome.default_name')}! • {currentTime.toLocaleDateString('en-US', {
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
            {t('quick_actions.create_campaign')}
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
                    <span className="text-xs text-gray-500">{t('stats.weekly_growth')}</span>
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
            <CardTitle className="text-lg font-semibold text-white">{t('charts.call_volume')}</CardTitle>
            <CardDescription className="text-sm text-gray-400">
              {t('charts.last_7_days')}
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
            <CardTitle className="text-lg font-semibold text-white">{t('charts.campaign_performance')}</CardTitle>
            <CardDescription className="text-sm text-gray-400">
              {t('charts.success_rate_by_campaign')}
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
              <CardTitle className="text-lg font-semibold text-white">{t('calls.title')}</CardTitle>
              <CardDescription className="text-sm text-gray-400">
                {t('recent_activity.title')}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/all-calls')}
              className="text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white"
            >
              {t('recent_activity.view_all')}
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
                      {call.status === 'completed' ? t('calls.completed') : 
                       call.status === 'in-progress' ? t('calls.in_progress') : 
                       call.status === 'missed' ? t('calls.missed') : call.status}
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
