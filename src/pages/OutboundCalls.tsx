import { useAuth } from '@/hooks/auth';
import {
    ArrowLeft,
    Building,
    Clock,
    Download,
    Eye,
    Filter,
    Phone,
    Play,
    RefreshCw,
    Search,
    User,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import { useToast } from '../hooks/use-toast';

interface CallResult {
  id: string;
  callId: string;
  leadName: string;
  customerPhone: string;
  company?: string;
  email?: string;
  jobTitle?: string;
  status: string;
  endedReason: string;
  duration: number;
  cost: number;
  startTime: string;
  endTime?: string;
  successEvaluation: string;
  sentiment?: string;
  hasRecording: boolean;
  hasTranscript: boolean;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  phoneNumber: string;
}

interface Statistics {
  totalCalls: number;
  endedCalls: number;
  pickedUpCalls: number;
  voicemailCalls: number;
}

export default function OutboundCalls() {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [statistics, setStatistics] = useState<Statistics>({
    totalCalls: 0,
    endedCalls: 0,
    pickedUpCalls: 0,
    voicemailCalls: 0,
  });
  const [calls, setCalls] = useState<CallResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCall, setSelectedCall] = useState<CallResult | null>(null);

  const fetchCampaignCalls = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await fetch(
        `/api/campaign/campaigns/${campaignId}/calls`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCampaign(data.campaign);
      setStatistics(data.statistics);
      setCalls(data.calls || []);
    } catch (error) {
      console.error('Error fetching campaign calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch campaign calls. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchCampaignCalls();
    }
  }, [campaignId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchCampaignCalls, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="border-green-600/30 bg-green-600/20 text-green-400">Completed</Badge>
        );
      case 'in-progress':
        return (
          <Badge className="border-blue-600/30 bg-blue-600/20 text-blue-400">In Progress</Badge>
        );
      case 'failed':
        return <Badge className="border-red-600/30 bg-red-600/20 text-red-400">Failed</Badge>;
      case 'queued':
        return (
          <Badge className="border-yellow-600/30 bg-yellow-600/20 text-yellow-400">Queued</Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEndedReasonBadge = (reason: string) => {
    switch (reason) {
      case 'customer-ended-call':
        return (
          <Badge className="border-green-600/30 bg-green-600/20 text-green-400">
            Customer Ended
          </Badge>
        );
      case 'assistant-ended-call':
        return (
          <Badge className="border-blue-600/30 bg-blue-600/20 text-blue-400">Assistant Ended</Badge>
        );
      case 'voicemail':
        return (
          <Badge className="border-yellow-600/30 bg-yellow-600/20 text-yellow-400">Voicemail</Badge>
        );
      case 'no-answer':
        return <Badge className="border-gray-600/30 bg-gray-600/20 text-gray-400">No Answer</Badge>;
      case 'busy':
        return (
          <Badge className="border-orange-600/30 bg-orange-600/20 text-orange-400">Busy</Badge>
        );
      default:
        return <Badge variant="outline">{reason}</Badge>;
    }
  };

  const handleCallClick = (call: CallResult) => {
    // Navigate to call details page
    navigate(`/calls/${call.id}`);
  };

  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      call.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.customerPhone.includes(searchTerm) ||
      (call.company && call.company.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-lg text-white">Loading campaign calls...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex h-full flex-col">
        <div className="flex-shrink-0 p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                className="flex items-center text-lg font-semibold text-white transition-colors hover:text-emerald-400"
                onClick={() => navigate('/campaigns')}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Campaigns
              </button>
              <div className="h-6 w-px bg-gray-600" />
              <div>
                <h1 className="mb-2 text-4xl font-bold text-white">
                  {campaign?.name || 'Campaign'}
                </h1>
                <p className="text-gray-400">{campaign?.description || 'Outbound Call Results'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchCampaignCalls}
                className="border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-700">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Calls</p>
                    <p className="text-3xl font-bold text-white">{statistics.totalCalls}</p>
                  </div>
                  <Phone className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Ended Calls</p>
                    <p className="text-3xl font-bold text-white">{statistics.endedCalls}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Picked Up Calls</p>
                    <p className="text-3xl font-bold text-white">{statistics.pickedUpCalls}</p>
                  </div>
                  <User className="h-8 w-8 text-emerald-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Voicemail Calls</p>
                    <p className="text-3xl font-bold text-white">{statistics.voicemailCalls}</p>
                  </div>
                  <Users className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search by name, phone, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-gray-700 bg-gray-800/50 pl-10 text-white placeholder-gray-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full border-gray-700 bg-gray-800/50 text-white sm:w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-700">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Call Results Table */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Call Results</CardTitle>
              <CardDescription className="text-gray-400">
                {filteredCalls.length} calls found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-700/50">
                    <TableHead className="text-gray-300">Call ID</TableHead>
                    <TableHead className="text-gray-300">Customer</TableHead>
                    <TableHead className="text-gray-300">Phone</TableHead>
                    <TableHead className="text-gray-300">Ended Reason</TableHead>
                    <TableHead className="text-gray-300">Success Evaluation</TableHead>
                    <TableHead className="text-gray-300">Duration</TableHead>
                    <TableHead className="text-gray-300">Start Time</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow
                      key={call.id}
                      className="cursor-pointer border-gray-700 hover:bg-gray-700/30"
                      onClick={() => handleCallClick(call)}
                    >
                      <TableCell className="font-mono text-sm text-white">
                        {call.callId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{call.leadName}</span>
                          {call.company && (
                            <span className="flex items-center text-sm text-gray-400">
                              <Building className="mr-1 h-3 w-3" />
                              {call.company}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-white">{call.customerPhone}</TableCell>
                      <TableCell>{getEndedReasonBadge(call.endedReason)}</TableCell>
                      <TableCell>
                        <span className="text-gray-300">{call.successEvaluation}</span>
                      </TableCell>
                      <TableCell className="text-white">{formatDuration(call.duration)}</TableCell>
                      <TableCell className="text-sm text-gray-300">
                        {formatDateTime(call.startTime)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {call.hasRecording && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 hover:bg-blue-600/20"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:bg-gray-600/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCallClick(call);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredCalls.length === 0 && (
                <div className="py-12 text-center">
                  <Phone className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                  <h3 className="mb-2 text-lg font-semibold text-white">No calls found</h3>
                  <p className="text-gray-400">
                    {calls.length === 0
                      ? "This campaign hasn't made any calls yet."
                      : 'No calls match your current filters.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
