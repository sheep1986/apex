import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Play,
  FileText,
  Phone,
  PhoneCall,
  PhoneOff,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/auth';
import { CallLogDetailsModal } from '@/components/CallLogDetailsModal';

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
  status: 'completed' | 'in-progress' | 'missed';
}

interface CallMetrics {
  totalCalls: number;
  connectedCalls: number;
  totalDuration: number;
  totalCost: number;
  averageDuration: number;
  connectionRate: number;
  positiveRate: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const outcomeColors = {
  connected: 'bg-green-500',
  interested: 'bg-emerald-500',
  callback: 'bg-blue-500',
  voicemail: 'bg-yellow-500',
  no_answer: 'bg-orange-500',
  busy: 'bg-red-500',
  failed: 'bg-red-600',
  not_interested: 'bg-gray-500',
};

const sentimentColors = {
  positive: 'bg-green-500',
  neutral: 'bg-gray-500',
  negative: 'bg-red-500',
};

export default function AllCalls() {
  const navigate = useNavigate();
  const [showCallDetails, setShowCallDetails] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const { getToken } = useAuth();
  const { toast } = useToast();

  // State management
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<CallMetrics>({
    totalCalls: 0,
    connectedCalls: 0,
    totalDuration: 0,
    totalCost: 0,
    averageDuration: 0,
    connectionRate: 0,
    positiveRate: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    outcome: 'all',
    sentiment: 'all',
    agent: 'all',
    campaign: 'all',
    dateRange: 'all',
  });
  const [sortBy, setSortBy] = useState<'startTime' | 'duration' | 'cost'>('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch calls from API
  const fetchCalls = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        sortBy,
        sortOrder,
        ...filters,
      });

      const response = await fetch(`${API_BASE_URL}/calls?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Calls fetched from API:', data);
        setCalls(data.calls || []);
        setMetrics(data.metrics || metrics);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch calls');
      }
    } catch (error) {
      console.error('❌ Error fetching calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch calls. Please try again.',
        variant: 'destructive',
      });
      setCalls([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch call metrics
  const fetchMetrics = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/calls/metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('❌ Error fetching metrics:', error);
    }
  };

  useEffect(() => {
    fetchCalls();
    fetchMetrics();
  }, [currentPage, pageSize, searchTerm, filters, sortBy, sortOrder]);

  // Export calls to CSV
  const exportToCSV = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/calls/export`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters, searchTerm }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calls-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Success',
          description: 'Data exported successfully.',
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('❌ Error exporting calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format cost
  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(2)}`;
  };

  const handleViewCallDetails = (call: CallRecord) => {
    setSelectedCall(call);
    setShowCallDetails(true);
  };

  // Filter calls
  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.contact.phone.includes(searchTerm) ||
      (call.contact.company &&
        call.contact.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      call.agent.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filters.type === 'all' || call.type === filters.type;
    const matchesOutcome = filters.outcome === 'all' || call.outcome === filters.outcome;
    const matchesSentiment = filters.sentiment === 'all' || call.sentiment === filters.sentiment;
    const matchesAgent = filters.agent === 'all' || call.agent.name === filters.agent;
    const matchesCampaign = filters.campaign === 'all' || call.campaign?.id === filters.campaign;

    return (
      matchesSearch &&
      matchesType &&
      matchesOutcome &&
      matchesSentiment &&
      matchesAgent &&
      matchesCampaign
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="text-zinc-400">Loading call data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400">View and manage all your calls</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchCalls} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">Total Calls</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.totalCalls.toLocaleString()}
                </p>
              </div>
              <Phone className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">Connected</p>
                <p className="text-2xl font-bold text-white">
                  {metrics.connectedCalls.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">{metrics.connectionRate.toFixed(1)}% connection rate</p>
              </div>
              <PhoneCall className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">Total Duration</p>
                <p className="text-2xl font-bold text-white">
                  {formatDuration(metrics.totalDuration)}
                </p>
                <p className="text-xs text-zinc-500">
                  Avg: {formatDuration(metrics.averageDuration)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">Total Cost</p>
                <p className="text-2xl font-bold text-white">{formatCost(metrics.totalCost)}</p>
                <p className="text-xs text-zinc-500">{metrics.positiveRate.toFixed(1)}% positive rate</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-zinc-400" />
                <Input
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 pl-10 text-white"
                />
              </div>
            </div>

            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger className="w-32 border-zinc-700 bg-zinc-800 text-white">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-800">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.outcome}
              onValueChange={(value) => setFilters({ ...filters, outcome: value })}
            >
              <SelectTrigger className="w-40 border-zinc-700 bg-zinc-800 text-white">
                <SelectValue placeholder="Filter by outcome" />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-800">
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="callback">Callback</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sentiment}
              onValueChange={(value) => setFilters({ ...filters, sentiment: value })}
            >
              <SelectTrigger className="w-32 border-zinc-700 bg-zinc-800 text-white">
                <SelectValue placeholder="Filter by sentiment" />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-800">
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calls Table */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Call Records ({filteredCalls.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCalls.length === 0 ? (
            <div className="py-12 text-center">
              <Phone className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
              <p className="text-zinc-400">No calls found</p>
              <p className="text-sm text-zinc-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-4 transition-all duration-200 hover:bg-zinc-700/50"
                  onClick={() => handleViewCallDetails(call)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {call.type === 'inbound' ? (
                        <Phone className="h-5 w-5 text-green-500" />
                      ) : call.type === 'outbound' ? (
                        <PhoneCall className="h-5 w-5 text-blue-500" />
                      ) : (
                        <PhoneOff className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-white">{call.contact.name}</p>
                        <Badge className={`${outcomeColors[call.outcome]} text-white`}>
                          {call.outcome.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        <Badge className={`${sentimentColors[call.sentiment]} text-white`}>
                          {call.sentiment.charAt(0).toUpperCase() + call.sentiment.slice(1)}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-zinc-400">
                        <span>{call.contact.phone}</span>
                        {call.contact.company && <span>{call.contact.company}</span>}
                        <span>
                          {call.agent.name} ({call.agent.type.charAt(0).toUpperCase() + call.agent.type.slice(1)})
                        </span>
                        {call.campaign && <span>{call.campaign.name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-zinc-400">
                    <div className="text-right">
                      <p className="text-white">{new Date(call.startTime).toLocaleDateString()}</p>
                      <p>{new Date(call.startTime).toLocaleTimeString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white">{formatDuration(call.duration)}</p>
                      <p>{formatCost(call.cost)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-zinc-700 bg-zinc-800">
                        <DropdownMenuItem
                          onClick={() => handleViewCallDetails(call)}
                          className="text-zinc-300 hover:text-white"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {call.recording && (
                          <DropdownMenuItem
                            onClick={() => handleViewCallDetails(call)}
                            className="text-zinc-300 hover:text-white"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Play Recording
                          </DropdownMenuItem>
                        )}
                        {call.transcript && (
                          <DropdownMenuItem
                            onClick={() => handleViewCallDetails(call)}
                            className="text-zinc-300 hover:text-white"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Transcript
                          </DropdownMenuItem>
                        )}
                        {call.leadId && (
                          <DropdownMenuItem
                            onClick={() => navigate(`/leads/${call.leadId}`)}
                            className="text-zinc-300 hover:text-white"
                          >
                            <Users className="mr-2 h-4 w-4" />
                            View Lead
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-zinc-400">Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(parseInt(value))}
          >
            <SelectTrigger className="w-20 border-zinc-700 bg-zinc-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-800">
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-zinc-400">per page</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-zinc-400">Page {currentPage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={filteredCalls.length < pageSize}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Call Details Modal */}
      <CallLogDetailsModal
        isOpen={showCallDetails}
        onClose={() => setShowCallDetails(false)}
        callData={
          selectedCall
            ? {
                id: selectedCall.id,
                duration: selectedCall.duration,
                transcript: selectedCall.transcript
                  ? [
                      {
                        speaker: 'ai',
                        text: 'Call transcript would be parsed and displayed here...',
                      },
                      { speaker: 'user', text: 'User responses would be shown alternately.' },
                    ]
                  : [],
                recording: selectedCall.recording,
                cost: selectedCall.cost,
                analysis: {
                  sentiment:
                    selectedCall.sentiment === 'positive'
                      ? 0.8
                      : selectedCall.sentiment === 'negative'
                        ? 0.2
                        : 0.5,
                  keywords: ['inquiry', 'interested', 'follow-up'],
                  summary: `Call with ${selectedCall.contact.name} resulted in ${selectedCall.outcome}.`,
                },
              }
            : undefined
        }
      />
    </div>
  );
}
