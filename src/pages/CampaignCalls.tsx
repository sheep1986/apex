import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
    AlertCircle,
    ArrowLeft,
    Bot,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    Eye,
    MessageSquare,
    Phone,
    Play,
    RefreshCw,
    Search,
    Star,
    TrendingDown,
    TrendingUp,
    User,
    XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface TranscriptEntry {
  speaker: 'customer' | 'assistant';
  text: string;
  timestamp?: string;
}

interface CallData {
  id: string;
  providerCallId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerCompany: string | null;
  status: string;
  startedAt: string;
  endedAt: string | null;
  duration: number;
  cost: number;
  hasTranscript: boolean;
  hasRecording: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  transcript?: string;
  formattedTranscript?: TranscriptEntry[];
  summary?: string;
  recording?: string;
}

interface CampaignCallsResponse {
  calls: CallData[];
  campaign: {
    id: string;
    name: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const CampaignCalls: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [calls, setCalls] = useState<CallData[]>([]);
  const [campaign, setCampaign] = useState<{ id: string; name: string } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('started_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCall, setSelectedCall] = useState<CallData | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (campaignId) {
      loadCampaignCalls();
    }
  }, [campaignId, pagination.page, searchTerm, statusFilter, sortBy, sortOrder]);

  const loadCampaignCalls = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      // Temporary API call until getCampaignCalls is implemented
      const response = await fetch(`/api/campaign/campaigns/${campaignId}/calls?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaign calls');
      }

      const result = await response.json();
      setCalls(result.calls);
      setCampaign(result.campaign);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error loading campaign calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign calls',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCall = async (callId: string) => {
    if (!confirm('Are you sure you want to delete this call?')) return;

    try {
      // Implementation for deleting call
      toast({
        title: 'Success',
        description: 'Call deleted successfully',
      });
      loadCampaignCalls();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete call',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in-progress':
        return null;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(cost);
  };

  const TranscriptModal = ({
    call,
    isOpen,
    onClose,
  }: {
    call: CallData;
    isOpen: boolean;
    onClose: () => void;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
          <div className="border-b border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Call Transcript</h2>
                <p className="text-sm text-gray-400">
                  {call.customerName} •{' '}
                  {formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })}
                </p>
              </div>
              <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-6">
            {call.formattedTranscript && call.formattedTranscript.length > 0 ? (
              <div className="space-y-4">
                {call.formattedTranscript.map((entry, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-4 ${
                      entry.speaker === 'customer'
                        ? 'border-l-4 border-blue-500 bg-blue-900/20'
                        : 'border-l-4 border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {entry.speaker === 'customer' ? (
                        <User className="h-4 w-4 text-blue-400" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm font-medium capitalize text-gray-300">
                        {entry.speaker === 'customer' ? 'Customer' : 'Assistant'}
                      </span>
                      {entry.timestamp && (
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed text-gray-100">{entry.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-400">No transcript available for this call</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="h-6 w-px bg-gray-600" />
            <div>
              <h1 className="text-3xl font-bold text-white">Campaign Calls</h1>
              <p className="text-gray-400">{campaign?.name}</p>
            </div>
          </div>
          <Button
            onClick={loadCampaignCalls}
            className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Calls</p>
                  <p className="text-2xl font-bold text-white">{pagination.total}</p>
                </div>
                <Phone className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-white">
                    {calls.filter((c) => c.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Cost</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCost(calls.reduce((sum, call) => sum + call.cost, 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Avg Duration</p>
                  <p className="text-2xl font-bold text-white">
                    {formatDuration(
                      calls.reduce((sum, call) => sum + call.duration, 0) / calls.length || 0
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-gray-800 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 border-gray-700 bg-gray-800 text-white"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800">
                  <SelectItem value="started_at">Date</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="cost">Cost</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2 border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder.toUpperCase()}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calls Table */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">Campaign Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-400">Customer</TableHead>
                    <TableHead className="text-gray-400">Phone</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Duration</TableHead>
                    <TableHead className="text-gray-400">Cost</TableHead>
                    <TableHead className="text-gray-400">Sentiment</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id} className="border-gray-800 hover:bg-gray-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{call.customerName}</p>
                            {call.customerEmail && (
                              <p className="text-sm text-gray-400">{call.customerEmail}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-300">{call.customerPhone}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(call.status)}
                          <Badge
                            variant={call.status === 'completed' ? 'default' : 'secondary'}
                            className="bg-gray-800 text-white"
                          >
                            {call.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-white">{formatDuration(call.duration)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-white">{formatCost(call.cost)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(call.sentiment)}
                          <span className="text-sm capitalize text-white">{call.sentiment}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-300">
                          {formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {call.hasTranscript && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCall(call);
                                setShowTranscript(true);
                              }}
                              className="text-gray-400 hover:text-white"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          )}
                          {call.hasRecording && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(call.recording, '_blank')}
                              className="text-gray-400 hover:text-white"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/calls/${call.id}`)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {calls.length === 0 && (
              <div className="py-8 text-center">
                <Phone className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-400">No calls found for this campaign</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              calls
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <span className="text-sm text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Transcript Modal */}
        {selectedCall && (
          <TranscriptModal
            call={selectedCall}
            isOpen={showTranscript}
            onClose={() => {
              setShowTranscript(false);
              setSelectedCall(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CampaignCalls;
