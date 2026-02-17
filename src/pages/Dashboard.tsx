import React, { useState, useEffect, useMemo } from 'react';
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
  Wallet,
  RefreshCw,
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
import { getPlanById, getDefaultPlan } from '@/config/plans';
import { useSubscriptionGate } from '@/components/SubscriptionGuard';
import { ActivationChecklist } from '@/components/ActivationChecklist';

// Import Supabase client
import { supabase } from '../services/supabase-client';

// ── Credit Usage Progress Ring ──────────────────────────────────────────────
function CreditProgressRing({
  percent,
  size = 80,
  strokeWidth = 7,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (clampedPercent / 100) * circumference;

  // Color based on usage percentage
  const getColor = (pct: number) => {
    if (pct >= 80) return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.3)' }; // red
    if (pct >= 50) return { stroke: '#f59e0b', glow: 'rgba(245,158,11,0.3)' }; // amber
    return { stroke: '#10b981', glow: 'rgba(16,185,129,0.3)' }; // green / emerald
  };

  const colors = getColor(clampedPercent);

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      {/* background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(55,65,81,0.4)"
        strokeWidth={strokeWidth}
      />
      {/* progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colors.stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease',
          filter: `drop-shadow(0 0 4px ${colors.glow})`,
        }}
      />
      {/* center percentage text */}
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="text-xs font-bold"
        fill={colors.stroke}
      >
        {Math.round(clampedPercent)}%
      </text>
    </svg>
  );
}


// All data comes from Supabase — no hardcoded values

export default function Dashboard() {
  const navigate = useNavigate();
  const { userContext } = useUserContext();
  const { user } = useUser();
  const { toast } = useToast();
  const { isReadOnly, isSuspended } = useSubscriptionGate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Platform owners should use /platform, not the client dashboard
  useEffect(() => {
    if (userContext?.role === 'platform_owner') {
      navigate('/platform', { replace: true });
    }
  }, [userContext?.role, navigate]);

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

  // Credit usage widget state
  const [creditUsage, setCreditUsage] = useState({
    creditsUsed: 0,
    creditsIncluded: 200_000,
    creditBalance: 0,
    planId: 'employee_1' as string,
    periodStart: null as string | null,
    periodEnd: null as string | null,
    dailyUsageHistory: [] as { date: string; credits: number }[],
  });

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

      // Fetch org credit balance + plan info
      const { data: org } = await supabase
        .from('organizations')
        .select('credit_balance, plan, plan_tier_id, included_credits, credits_used_this_period, subscription_period_start, subscription_period_end')
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

      // Populate credit usage widget data
      const planId = org?.plan || org?.plan_tier_id || 'employee_1';
      const plan = getPlanById(planId) || getDefaultPlan();
      const creditsUsedThisPeriod = org?.credits_used_this_period || 0;
      const includedCredits = org?.included_credits || plan.includedCredits;

      // Calculate daily usage from call data (last 14 days for trend)
      const dailyUsage = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (13 - i));
        const dayStr = date.toISOString().split('T')[0];
        const dayCredits = allCallsArray
          .filter(call => call.created_at?.startsWith(dayStr))
          .reduce((sum, call) => sum + (call.duration ? Math.ceil((call.duration / 60) * 30) : 0), 0);
        return { date: dayStr, credits: dayCredits };
      });

      setCreditUsage({
        creditsUsed: creditsUsedThisPeriod,
        creditsIncluded: includedCredits,
        creditBalance: org?.credit_balance || 0,
        planId,
        periodStart: org?.subscription_period_start || null,
        periodEnd: org?.subscription_period_end || null,
        dailyUsageHistory: dailyUsage,
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
  ];

  // ── Credit Widget Computed Values ──────────────────────────────────────
  const creditUsagePercent = creditUsage.creditsIncluded > 0
    ? Math.min(100, (creditUsage.creditsUsed / creditUsage.creditsIncluded) * 100)
    : 0;

  const creditStatusColor = useMemo(() => {
    if (creditUsagePercent >= 80) return 'red';
    if (creditUsagePercent >= 50) return 'amber';
    return 'green';
  }, [creditUsagePercent]);

  // Projected depletion date based on recent average daily usage
  const projectedDepletionDate = useMemo(() => {
    const history = creditUsage.dailyUsageHistory;
    const recentDays = history.slice(-7); // last 7 days
    const totalRecentCredits = recentDays.reduce((s, d) => s + d.credits, 0);
    const avgDailyUsage = recentDays.length > 0 ? totalRecentCredits / recentDays.length : 0;

    if (avgDailyUsage <= 0) return null;

    const creditsRemaining = Math.max(0, creditUsage.creditsIncluded - creditUsage.creditsUsed);
    const daysUntilDepletion = Math.ceil(creditsRemaining / avgDailyUsage);
    const depletionDate = new Date();
    depletionDate.setDate(depletionDate.getDate() + daysUntilDepletion);
    return { date: depletionDate, days: daysUntilDepletion };
  }, [creditUsage]);

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
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
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
          {/* Provider Health Indicator */}
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5" title="Voice Provider Status">
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-xs text-gray-400">Voice</span>
          </div>
          <Button
            onClick={() => navigate('/campaigns')}
            disabled={isReadOnly || isSuspended}
            className="bg-emerald-600 font-medium text-white transition-all duration-200 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isReadOnly || isSuspended ? 'Resolve billing to create campaigns' : undefined}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Subscription Warning Card */}
      {(isReadOnly || isSuspended) && (
        <Card className={`mb-6 border ${isSuspended ? 'border-red-700/50 bg-red-950/30' : 'border-amber-700/50 bg-amber-950/30'}`}>
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-full ${isSuspended ? 'bg-red-900/50' : 'bg-amber-900/50'}`}>
                <AlertCircle className={`h-5 w-5 ${isSuspended ? 'text-red-400' : 'text-amber-400'}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${isSuspended ? 'text-red-200' : 'text-amber-200'}`}>
                  {isSuspended ? 'Subscription Canceled' : 'Payment Issue Detected'}
                </p>
                <p className={`text-xs mt-0.5 ${isSuspended ? 'text-red-300/70' : 'text-amber-300/70'}`}>
                  {isSuspended
                    ? 'Your subscription is canceled. Active campaigns have been paused. Reactivate to restore full access.'
                    : 'Your last payment failed. Active campaigns have been paused until billing is resolved. Features are in read-only mode.'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/billing')}
              className={`flex-shrink-0 ${isSuspended ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500'} text-white`}
            >
              <Wallet className="h-4 w-4 mr-1.5" />
              {isSuspended ? 'Reactivate Plan' : 'Fix Billing'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Activation Checklist — shown for new orgs within 14 days of onboarding */}
      {orgId && (
        <ActivationChecklist
          orgId={orgId}
          onboardedAt={null}
        />
      )}

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
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

      {/* Credit Usage Dashboard Widget */}
      <Card className={`mb-8 border transition-all duration-200 ${
        creditStatusColor === 'red'
          ? 'border-red-500/30 bg-gray-900'
          : creditStatusColor === 'amber'
            ? 'border-amber-500/30 bg-gray-900'
            : 'border-gray-800 bg-gray-900'
      }`}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            {/* Left: Progress Ring + Balance */}
            <div className="flex items-center gap-4">
              <CreditProgressRing percent={creditUsagePercent} size={80} strokeWidth={7} />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-400">Credit Balance</p>
                <p className="text-3xl font-bold text-white">
                  {creditUsage.creditsUsed.toLocaleString()}
                  <span className="text-base font-normal text-gray-500">
                    {' '}/ {creditUsage.creditsIncluded.toLocaleString()}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  {(creditUsage.creditsIncluded - creditUsage.creditsUsed).toLocaleString()} credits remaining
                </p>
              </div>
            </div>

            {/* Center: Usage Bar + Depletion Projection */}
            <div className="flex-1 space-y-3">
              {/* Usage bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Usage this period</span>
                  <span className={`font-medium ${
                    creditStatusColor === 'red' ? 'text-red-400'
                    : creditStatusColor === 'amber' ? 'text-amber-400'
                    : 'text-emerald-400'
                  }`}>
                    {Math.round(creditUsagePercent)}% used
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      creditStatusColor === 'red'
                        ? 'bg-red-500'
                        : creditStatusColor === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(creditUsagePercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Projected depletion */}
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                {projectedDepletionDate ? (
                  <span className={`${
                    projectedDepletionDate.days <= 7 ? 'text-red-400'
                    : projectedDepletionDate.days <= 14 ? 'text-amber-400'
                    : 'text-gray-400'
                  }`}>
                    Projected depletion:{' '}
                    {projectedDepletionDate.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    ({projectedDepletionDate.days} day{projectedDepletionDate.days !== 1 ? 's' : ''})
                  </span>
                ) : (
                  <span className="text-gray-500">No usage trend data yet</span>
                )}
              </div>

              {/* Overage balance */}
              <div className="flex items-center gap-2 text-xs">
                <Wallet className="h-3.5 w-3.5 text-gray-500" />
                <span className={creditUsage.creditBalance < 2 ? 'text-red-400' : 'text-gray-400'}>
                  Overage balance: ${creditUsage.creditBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex flex-row gap-2 md:flex-col">
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => navigate('/billing')}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Top Up
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() => navigate('/billing')}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Auto-Recharge
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QA Quality Widget */}
      <Card className="mb-6 border-gray-800 bg-gray-900">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Call Quality Overview</h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs"
              onClick={() => navigate('/call-quality-review')}
            >
              <Eye className="mr-1.5 h-3 w-3" />
              Review Queue
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-400">Avg QA Score</p>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-lg font-bold text-white">
                  {realStats.totalCalls > 0 ? '—' : '—'}
                </span>
                <span className="text-xs text-gray-500">/ 5</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">7-day rolling</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Positive Sentiment</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">—</p>
              <p className="text-xs text-gray-500 mt-0.5">of scored calls</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Awaiting Review</p>
              <p className="mt-1 text-lg font-bold text-amber-400">—</p>
              <p className="text-xs text-gray-500 mt-0.5">unreviewed calls</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Interested Rate</p>
              <p className="mt-1 text-lg font-bold text-white">—</p>
              <p className="text-xs text-gray-500 mt-0.5">outcome breakdown</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Attribution Widget */}
      <Card className="mb-8 border-gray-800 bg-gray-900">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Revenue Attribution</h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs"
              onClick={() => navigate('/pipeline')}
            >
              <Eye className="mr-1.5 h-3 w-3" />
              Pipeline
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-400">Pipeline Value</p>
              <p className="mt-1 text-lg font-bold text-white">—</p>
              <p className="text-xs text-gray-500 mt-0.5">open deals</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Closed Won</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">—</p>
              <p className="text-xs text-gray-500 mt-0.5">this month</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Top Campaign</p>
              <p className="mt-1 text-lg font-bold text-white">—</p>
              <p className="text-xs text-gray-500 mt-0.5">by revenue</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Conversion</p>
              <p className="mt-1 text-lg font-bold text-white">—</p>
              <p className="text-xs text-gray-500 mt-0.5">calls → deals</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
