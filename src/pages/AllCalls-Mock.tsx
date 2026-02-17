import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Calendar,
  Play,
  Download,
  FileText,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  User,
  Bot,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  MoreHorizontal,
  RefreshCw,
  Settings,
  BarChart3,
  CheckCircle,
  DollarSign,
  Activity,
  X,
  Calculator,
  AlertCircle,
  Zap,
  Pause,
  Volume2,
  FileAudio,
  Brain,
  Mic,
  Shield,
  Star,
  ChevronDown,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CallRecord {
  id: string;
  type: 'inbound' | 'outbound' | 'missed';
  contact: {
    name: string;
    phone: string;
    company?: string;
  };
  agent: {
    name: string;
    type: 'human' | 'ai';
  };
  campaign?: {
    name: string;
    id: string;
  };
  startTime: string;
  duration: number;
  outcome:
    | 'connected'
    | 'voicemail'
    | 'no_answer'
    | 'busy'
    | 'failed'
    | 'interested'
    | 'not_interested'
    | 'callback';
  sentiment: 'positive' | 'neutral' | 'negative';
  cost: number;
  recording?: string;
  transcript?: string;
  notes?: string;
  leadId?: string;
  status: 'completed' | 'in-progress' | 'missed' | 'failed';
}

// Mock data generator for thousands of calls
const generateMockCalls = (count: number): CallRecord[] => {
  const outcomes = [
    'connected',
    'voicemail',
    'no_answer',
    'busy',
    'failed',
    'interested',
    'not_interested',
    'callback',
  ];
  const sentiments = ['positive', 'neutral', 'negative'];
  const types = ['inbound', 'outbound', 'missed'];
  const agents = [
    { name: 'Sarah Johnson', type: 'human' },
    { name: 'AI Sales Pro', type: 'ai' },
    { name: 'Mike Chen', type: 'human' },
    { name: 'AI Support Agent', type: 'ai' },
    { name: 'Lisa Rodriguez', type: 'human' },
    { name: 'AI Outbound', type: 'ai' },
  ];
  const campaigns = [
    { name: 'Q1 Healthcare', id: 'hc1' },
    { name: 'B2B Software', id: 'b2b1' },
    { name: 'Real Estate', id: 're1' },
    { name: 'Fitness Centers', id: 'fc1' },
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `call-${i + 1}`,
    type: types[Math.floor(Math.random() * types.length)] as any,
    contact: {
      name: `Contact ${i + 1}`,
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      company: Math.random() > 0.3 ? `Company ${Math.floor(Math.random() * 100)}` : undefined,
    },
    agent: agents[Math.floor(Math.random() * agents.length)] as any,
    campaign:
      Math.random() > 0.2 ? campaigns[Math.floor(Math.random() * campaigns.length)] : undefined,
    startTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    duration: Math.floor(Math.random() * 600),
    outcome: outcomes[Math.floor(Math.random() * outcomes.length)] as any,
    sentiment: sentiments[Math.floor(Math.random() * sentiments.length)] as any,
    cost: Math.random() * 2 + 0.05,
    recording: Math.random() > 0.3 ? `recording-${i + 1}.mp3` : undefined,
    transcript: Math.random() > 0.4 ? `transcript-${i + 1}.txt` : undefined,
    notes: Math.random() > 0.7 ? `Notes for call ${i + 1}` : undefined,
    leadId: Math.random() > 0.5 ? `lead-${Math.floor(Math.random() * 1000)}` : undefined,
    status: Math.random() > 0.5 ? 'completed' : Math.random() > 0.5 ? 'in-progress' : 'missed',
  }));
};

export default function AllCalls() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState<'startTime' | 'duration' | 'cost'>('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    type: 'all',
    outcome: 'all',
    sentiment: 'all',
    agent: 'all',
    campaign: 'all',
    dateRange: 'all',
  });

  // Initialize with mock data
  useEffect(() => {
    const initializeCalls = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockCalls = generateMockCalls(5000); // Generate 5000 calls for testing
      setCalls(mockCalls);
      setLoading(false);
    };
    initializeCalls();
  }, []);

  // Filtered and sorted calls
  const filteredCalls = useMemo(() => {
    let filtered = calls.filter((call) => {
      const matchesSearch =
        searchTerm === '' ||
        call.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.contact.phone.includes(searchTerm) ||
        call.contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.agent.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filters.type === 'all' || call.type === filters.type;
      const matchesOutcome = filters.outcome === 'all' || call.outcome === filters.outcome;
      const matchesSentiment = filters.sentiment === 'all' || call.sentiment === filters.sentiment;
      const matchesAgent = filters.agent === 'all' || call.agent.name === filters.agent;
      const matchesCampaign =
        filters.campaign === 'all' || call.campaign?.name === filters.campaign;

      let matchesDateRange = true;
      if (filters.dateRange !== 'all') {
        const callDate = new Date(call.startTime);
        const now = new Date();
        switch (filters.dateRange) {
          case 'today':
            matchesDateRange = callDate.toDateString() === now.toDateString();
            break;
          case 'week':
            matchesDateRange = callDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            matchesDateRange = callDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesOutcome &&
        matchesSentiment &&
        matchesAgent &&
        matchesCampaign &&
        matchesDateRange
      );
    });

    // Sort calls
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'startTime':
          aValue = new Date(a.startTime).getTime();
          bValue = new Date(b.startTime).getTime();
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'cost':
          aValue = a.cost;
          bValue = b.cost;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [calls, searchTerm, filters, sortBy, sortOrder]);

  // Paginated calls
  const paginatedCalls = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCalls.slice(startIndex, startIndex + pageSize);
  }, [filteredCalls, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredCalls.length / pageSize);

  // Utility functions
  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return 'No answer';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'inbound':
        return <PhoneIncoming className="icon-sharp h-4 w-4" />;
      case 'outbound':
        return <PhoneOutgoing className="icon-sharp h-4 w-4" />;
      case 'missed':
        return <PhoneMissed className="icon-sharp h-4 w-4" />;
      default:
        return <Phone className="icon-sharp h-4 w-4" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'connected':
      case 'interested':
        return 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30';
      case 'callback':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'voicemail':
        return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
      case 'not_interested':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😟';
      case 'neutral':
        return '😐';
      default:
        return '🤔';
    }
  };

  const handleViewDetails = (call: CallRecord) => {
    if (call.leadId) {
      navigate(`/leads/${call.leadId}`);
    } else {
      toast({
        title: 'Call Details',
        description: 'Detailed view coming soon',
      });
    }
  };

  const handlePlayRecording = (call: CallRecord) => {
    if (call.recording) {
      toast({
        title: 'Playing Recording',
        description: `Playing recording for call with ${call.contact.name}`,
      });
    } else {
      toast({
        title: 'No Recording',
        description: 'No recording available for this call',
        variant: 'destructive',
      });
    }
  };

  const exportToCSV = () => {
    // Convert filtered calls to CSV
    const headers = [
      'Date',
      'Type',
      'Contact',
      'Phone',
      'Campaign',
      'Duration',
      'Status',
      'Outcome',
      'Sentiment',
      'Assistant',
      'Cost',
    ];
    const rows = filteredCalls.map((call) => [
      formatDate(call.startTime),
      call.type,
      call.contact.name,
      call.contact.phone,
      call.campaign?.name || 'N/A',
      call.duration,
      call.status,
      call.outcome,
      call.sentiment,
      call.agent.name,
      call.cost.toFixed(2),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calls-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: 'Export Successful',
      description: 'Your call data has been exported to CSV',
    });
  };

  const resetFilters = () => {
    setFilters({
      type: 'all',
      outcome: 'all',
      sentiment: 'all',
      agent: 'all',
      campaign: 'all',
      dateRange: 'all',
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Load calls function for refresh
  const loadCalls = async () => {
    setLoading(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const mockCalls = generateMockCalls(5000);
    setCalls(mockCalls);
    setLoading(false);
    toast({
      title: 'Calls Refreshed',
      description: 'Call data has been updated',
    });
  };

  // Get unique values for filter options
  const uniqueAgents = [...new Set(calls.map((call) => call.agent.name))];
  const uniqueCampaigns = [...new Set(calls.map((call) => call.campaign?.name).filter(Boolean))];

  // Calculate stats
  const stats = useMemo(() => {
    const totalCalls = filteredCalls.length;
    const totalCost = filteredCalls.reduce((sum, call) => sum + call.cost, 0);
    const avgDuration =
      filteredCalls.reduce((sum, call) => sum + call.duration, 0) / totalCalls || 0;
    const connectedCalls = filteredCalls.filter(
      (call) => call.outcome === 'connected' || call.outcome === 'interested'
    ).length;
    const connectionRate = totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : 0;

    return {
      totalCalls,
      totalCost,
      avgDuration,
      connectionRate,
      connectedCalls,
    };
  }, [filteredCalls]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-white">Loading call history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Real-time Status Bar */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
              <span className="text-xs uppercase tracking-wider text-zinc-400">Live System</span>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Phone className="h-4 w-4 text-emerald-400" />
                <span className="font-medium text-white">
                  {calls.filter((c) => c.status === 'in-progress').length}
                </span>
                <span className="text-zinc-500">Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="font-medium text-white">{stats.connectedCalls}</span>
                <span className="text-zinc-500">Connected</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <span className="font-medium text-white">{stats.connectionRate.toFixed(1)}%</span>
                <span className="text-zinc-500">Success Rate</span>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4 text-yellow-400" />
                <span className="font-medium text-white">${stats.totalCost.toFixed(2)}</span>
                <span className="text-zinc-500">Total Cost</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadCalls()}
              className="hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-700 hover:bg-zinc-800"
              onClick={() => navigate('/live-calls')}
            >
              <Activity className="mr-2 h-4 w-4" />
              Live Monitor
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Call Intelligence</h1>
            <p className="mt-1 text-zinc-500">
              Advanced analytics and insights from {filteredCalls.length.toLocaleString()} calls
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                  <Settings className="mr-2 h-4 w-4" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-zinc-800 bg-zinc-900">
                <DropdownMenuItem onClick={() => setPageSize(25)}>25 per page</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPageSize(50)}>50 per page</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPageSize(100)}>100 per page</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-zinc-800 bg-zinc-900">
                <DropdownMenuItem onClick={() => exportToCSV()}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Phone className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white">Advanced Filters</CardTitle>
              <div className="flex items-center space-x-2">
                {Object.values(filters).some((v) => v !== 'all' && v !== '') && (
                  <Badge className="border-0 bg-emerald-600/20 text-emerald-400">
                    {Object.values(filters).filter((v) => v !== 'all' && v !== '').length} Active
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="hover:bg-zinc-800"
                >
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-zinc-400">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    placeholder="Search contacts, phones, campaigns, agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-zinc-700 bg-zinc-800 pl-10 text-white placeholder:text-zinc-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-400">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-zinc-700 bg-zinc-800">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-900">
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-400">Campaign</label>
                <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                  <SelectTrigger className="border-zinc-700 bg-zinc-800">
                    <SelectValue placeholder="All campaigns" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-900">
                    <SelectItem value="all">All campaigns</SelectItem>
                    <SelectItem value="summer-sale">Summer Sale 2024</SelectItem>
                    <SelectItem value="product-launch">Product Launch</SelectItem>
                    <SelectItem value="customer-winback">Customer Win-back</SelectItem>
                    <SelectItem value="holiday-promo">Holiday Promo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-400">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="border-zinc-700 bg-zinc-800">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-900">
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last7days">Last 7 days</SelectItem>
                    <SelectItem value="last30days">Last 30 days</SelectItem>
                    <SelectItem value="thisMonth">This month</SelectItem>
                    <SelectItem value="lastMonth">Last month</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stats Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600/10">
                  <Phone className="h-6 w-6 text-emerald-400" />
                </div>
                <Badge className="border-0 bg-zinc-800 text-zinc-400">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +12%
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {filteredCalls.length.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-zinc-400">Total Calls</p>
                <div className="mt-3 flex items-center text-xs text-zinc-500">
                  <Clock className="mr-1 h-3 w-3" />
                  {formatDuration(stats.avgDuration)} avg duration
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600/10">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <Badge className="border-0 bg-zinc-800 text-zinc-400">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +8%
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">{stats.connectionRate.toFixed(1)}%</p>
                <p className="mt-1 text-sm text-zinc-400">Connection Rate</p>
                <div className="mt-3 flex items-center text-xs text-zinc-500">
                  <Phone className="mr-1 h-3 w-3" />
                  {stats.connectedCalls} connected calls
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10">
                  <Bot className="h-6 w-6 text-blue-400" />
                </div>
                <Badge className="border-0 bg-zinc-800 text-zinc-400">AI: 68%</Badge>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">
                  {filteredCalls.filter((c) => c.agent.type === 'ai').length}
                </p>
                <p className="mt-1 text-sm text-zinc-400">AI Handled</p>
                <div className="mt-3 flex items-center text-xs text-zinc-500">
                  <User className="mr-1 h-3 w-3" />
                  {filteredCalls.filter((c) => c.agent.type === 'human').length} human calls
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-700">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-600/10">
                  <DollarSign className="h-6 w-6 text-yellow-400" />
                </div>
                <Badge className="border-0 bg-zinc-800 text-zinc-400">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  -5%
                </Badge>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">${stats.totalCost.toFixed(2)}</p>
                <p className="mt-1 text-sm text-zinc-400">Total Cost</p>
                <div className="mt-3 flex items-center text-xs text-zinc-500">
                  <Calculator className="mr-1 h-3 w-3" />$
                  {(stats.totalCost / stats.totalCalls).toFixed(3)} per call
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calls Table */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Campaign
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Outcome
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Sentiment
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Assistant
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Time</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCalls.map((call) => (
                    <tr
                      key={call.id}
                      className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800">
                            {getCallIcon(call.type)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-white">{call.contact.name}</p>
                          <p className="text-sm text-zinc-500">{call.contact.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">{call.campaign?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-white">{formatDuration(call.duration)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            call.status === 'completed'
                              ? 'default'
                              : call.status === 'in-progress'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={cn(
                            'border-0',
                            call.status === 'completed' && 'bg-emerald-500/10 text-emerald-400',
                            call.status === 'in-progress' && 'bg-blue-500/10 text-blue-400',
                            call.status === 'missed' && 'bg-zinc-700 text-zinc-400',
                            call.status === 'failed' && 'bg-red-500/10 text-red-400'
                          )}
                        >
                          {call.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-sm',
                            call.outcome === 'connected' && 'text-green-400',
                            call.outcome === 'voicemail' && 'text-yellow-400',
                            call.outcome === 'no_answer' && 'text-zinc-400',
                            call.outcome === 'failed' && 'text-red-400'
                          )}
                        >
                          {call.outcome}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getSentimentIcon(call.sentiment)}</span>
                          <span className="text-sm capitalize text-zinc-400">{call.sentiment}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">{call.agent.name}</td>
                      <td className="px-4 py-3 text-white">${call.cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(call.startTime)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(call)}
                            className="hover:bg-zinc-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePlayRecording(call)}
                            className="hover:bg-zinc-800"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredCalls.length)} of {filteredCalls.length}{' '}
                calls
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        'h-8 w-8 p-0',
                        currentPage === i + 1
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'border-zinc-700 hover:bg-zinc-800'
                      )}
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
