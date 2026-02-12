import { CallLogDetailsModal } from '@/components/CallLogDetailsModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/services/MinimalUserProvider';
import { voiceService, type VoiceCall, type CallAnalytics } from '@/services/voice-service';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Play,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatCost = (cost: number): string => {
  return `$${(cost || 0).toFixed(4)}`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ended':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    case 'in-progress':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'ringing':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    case 'queued':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }
};

const getSentimentColor = (sentiment?: string) => {
  switch (sentiment) {
    case 'positive':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'negative':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    case 'neutral':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    default:
      return '';
  }
};

const getCallTypeIcon = (type: string) => {
  switch (type) {
    case 'inboundPhoneCall':
      return <PhoneIncoming className="h-4 w-4 text-emerald-400" />;
    case 'outboundPhoneCall':
      return <PhoneOutgoing className="h-4 w-4 text-blue-400" />;
    case 'webCall':
      return <Phone className="h-4 w-4 text-purple-400" />;
    default:
      return <Phone className="h-4 w-4 text-gray-400" />;
  }
};

const getCallTypeLabel = (type: string) => {
  switch (type) {
    case 'inboundPhoneCall':
      return 'Inbound';
    case 'outboundPhoneCall':
      return 'Outbound';
    case 'webCall':
      return 'Web';
    default:
      return type;
  }
};

// ─── Component ───────────────────────────────────────────────────

export default function AllCalls() {
  const { toast } = useToast();
  const { userContext } = useUserContext();

  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Detail modal
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // ─── Voice service readiness ─────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      if (voiceService.isInitialized()) {
        setVoiceReady(true);
        clearInterval(interval);
      }
    }, 500);
    if (voiceService.isInitialized()) setVoiceReady(true);
    return () => clearInterval(interval);
  }, []);

  // ─── Data fetching ───────────────────────────────────────────

  useEffect(() => {
    if (voiceReady) {
      fetchCalls();
    }
  }, [voiceReady]);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const [callsData, analyticsData] = await Promise.all([
        voiceService.getCalls({ limit: 100 }),
        voiceService.getCallAnalytics(),
      ]);
      setCalls(callsData || []);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to fetch calls:', err);
      toast({
        title: 'Error',
        description: 'Failed to load call data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Filtering ───────────────────────────────────────────────

  const filteredCalls = calls.filter((call) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      call.customer?.name?.toLowerCase().includes(searchLower) ||
      call.customer?.number?.includes(searchTerm) ||
      call.id.toLowerCase().includes(searchLower) ||
      call.summary?.toLowerCase().includes(searchLower);

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'inbound' && call.type === 'inboundPhoneCall') ||
      (typeFilter === 'outbound' && call.type === 'outboundPhoneCall') ||
      (typeFilter === 'web' && call.type === 'webCall');

    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;

    const matchesSentiment =
      sentimentFilter === 'all' || call.analysis?.sentiment === sentimentFilter;

    return matchesSearch && matchesType && matchesStatus && matchesSentiment;
  });

  const totalPages = Math.ceil(filteredCalls.length / pageSize);
  const paginatedCalls = filteredCalls.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ─── Export ──────────────────────────────────────────────────

  const exportToCSV = () => {
    if (filteredCalls.length === 0) return;

    const headers = ['ID', 'Type', 'Customer', 'Phone', 'Status', 'Duration', 'Cost', 'Sentiment', 'Date'];
    const rows = filteredCalls.map((call) => [
      call.id,
      getCallTypeLabel(call.type),
      call.customer?.name || 'Unknown',
      call.customer?.number || '',
      call.status,
      formatDuration(call.duration || 0),
      formatCost(call.cost || 0),
      call.analysis?.sentiment || '',
      call.startedAt ? new Date(call.startedAt).toISOString() : '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trinity-calls-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({ title: 'Exported', description: `${filteredCalls.length} calls exported to CSV.` });
  };

  // ─── Call detail ─────────────────────────────────────────────

  const handleViewDetails = (call: VoiceCall) => {
    setSelectedCall(call);
    setShowDetails(true);
  };

  const getTranscript = (call: VoiceCall) => {
    if (call.messages && call.messages.length > 0) {
      return call.messages
        .filter((m) => m.role === 'assistant' || m.role === 'user')
        .map((m) => ({
          speaker: m.role === 'user' ? ('user' as const) : ('ai' as const),
          text: m.message,
        }));
    }
    if (call.transcript) {
      const lines = call.transcript.split('\n').filter(Boolean);
      return lines.map((line) => {
        const isUser = line.startsWith('User:') || line.startsWith('user:');
        return {
          speaker: isUser ? ('user' as const) : ('ai' as const),
          text: line.replace(/^(User:|user:|AI:|ai:|Assistant:)\s*/, '').trim(),
        };
      });
    }
    return [];
  };

  // ─── Loading state ───────────────────────────────────────────

  if (!voiceReady || loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-gray-400">
          {!voiceReady ? 'Connecting to voice service...' : 'Loading calls...'}
        </p>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="w-full space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-gray-400">View and manage all your AI calls</p>
          <div className="flex gap-2">
            <Button
              onClick={fetchCalls}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={exportToCSV}
              variant="outline"
              size="sm"
              disabled={filteredCalls.length === 0}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Calls</p>
                  <p className="text-2xl font-bold text-white">
                    {(analytics?.totalCalls || calls.length).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                  <Phone className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Successful</p>
                  <p className="text-2xl font-bold text-white">
                    {(analytics?.successfulCalls || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {analytics && analytics.totalCalls > 0
                      ? `${((analytics.successfulCalls / analytics.totalCalls) * 100).toFixed(1)}%`
                      : 'No data'}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <PhoneCall className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Duration</p>
                  <p className="text-2xl font-bold text-white">
                    {formatDuration(analytics?.averageDuration || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Cost</p>
                  <p className="text-2xl font-bold text-white">
                    ${(analytics?.totalCost || 0).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg border border-pink-500/20 bg-pink-500/10 p-3">
                  <DollarSign className="h-5 w-5 text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-800 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search by name, phone, or ID..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border-gray-700 bg-gray-800 pl-10 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-36 border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-36 border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="ringing">Ringing</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sentimentFilter} onValueChange={(v) => { setSentimentFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-36 border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sentiment</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Calls List */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader className="border-b border-gray-800 p-4">
            <CardTitle className="text-white">
              Call Records ({filteredCalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCalls.length === 0 ? (
              <div className="py-16 text-center">
                <Phone className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <p className="text-lg font-medium text-white">No calls found</p>
                <p className="mt-1 text-sm text-gray-400">
                  {calls.length === 0
                    ? 'Calls will appear here once your AI assistants start making or receiving calls.'
                    : 'Try adjusting your filters.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {paginatedCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex cursor-pointer items-center justify-between px-4 py-3 transition-all hover:bg-gray-800/50"
                    onClick={() => handleViewDetails(call)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                        {getCallTypeIcon(call.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">
                            {call.customer?.name || call.customer?.number || 'Unknown Caller'}
                          </p>
                          <Badge variant="outline" className={getStatusColor(call.status)}>
                            {call.status === 'in-progress' ? 'Live' : call.status}
                          </Badge>
                          {call.analysis?.sentiment && (
                            <Badge variant="outline" className={getSentimentColor(call.analysis.sentiment)}>
                              {call.analysis.sentiment}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                          <span>{getCallTypeLabel(call.type)}</span>
                          {call.customer?.number && <span>{call.customer.number}</span>}
                          {call.summary && (
                            <span className="max-w-xs truncate text-gray-400">{call.summary}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right text-sm">
                        <p className="text-white">
                          {call.startedAt ? new Date(call.startedAt).toLocaleDateString() : '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {call.startedAt ? new Date(call.startedAt).toLocaleTimeString() : ''}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-white">{formatDuration(call.duration || 0)}</p>
                        <p className="text-xs text-gray-500">{formatCost(call.cost || 0)}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-white"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-gray-700 bg-gray-800">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(call)}
                            className="text-gray-300 hover:text-white"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {call.recordingUrl && (
                            <DropdownMenuItem className="text-gray-300 hover:text-white">
                              <Play className="mr-2 h-4 w-4" />
                              Play Recording
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredCalls.length)} of {filteredCalls.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-gray-700 text-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-gray-700 text-gray-300"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Call Details Modal */}
        <CallLogDetailsModal
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          callData={
            selectedCall
              ? {
                  id: selectedCall.id,
                  duration: selectedCall.duration || 0,
                  transcript: getTranscript(selectedCall),
                  recording: selectedCall.recordingUrl,
                  cost: selectedCall.cost,
                  customerName: selectedCall.customer?.name || 'Unknown',
                  customerPhone: selectedCall.customer?.number || '',
                  status: selectedCall.status,
                  startedAt: selectedCall.startedAt,
                  endedAt: selectedCall.endedAt,
                  direction: selectedCall.type === 'inboundPhoneCall' ? 'inbound' : 'outbound',
                  providerCallId: selectedCall.id,
                  analysis: {
                    sentiment:
                      selectedCall.analysis?.sentiment === 'positive'
                        ? 0.8
                        : selectedCall.analysis?.sentiment === 'negative'
                          ? 0.2
                          : 0.5,
                    keywords: [],
                    summary: selectedCall.summary || '',
                  },
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
