import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Phone,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../hooks/auth';

interface CallAttempt {
  id: string;
  phone_number: string;
  contact_name?: string;
  vapi_call_id?: string;
  call_started_at: string;
  call_ended_at?: string;
  duration_seconds: number;
  outcome: string;
  outcome_reason?: string;
  ai_sentiment_score?: number;
  ai_qualification_score?: number;
  ai_summary?: string;
  ai_next_action?: string;
  is_qualified: boolean;
  qualification_notes?: string;
  call_cost_usd: number;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface Analytics {
  total_calls: number;
  answered_calls: number;
  qualified_calls: number;
  answer_rate: number;
  qualification_rate: number;
  total_cost_usd: number;
  avg_sentiment_score: number;
}

interface CampaignCallLogProps {
  campaignId: string;
  onViewTranscript?: (callId: string) => void;
}

export const CampaignCallLog: React.FC<CampaignCallLogProps> = ({
  campaignId,
  onViewTranscript
}) => {
  const { getToken } = useAuth();
  const [callAttempts, setCallAttempts] = useState<CallAttempt[]>([]);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [qualifiedFilter, setQualifiedFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCalls, setTotalCalls] = useState(0);
  const itemsPerPage = 25;

  useEffect(() => {
    if (campaignId) {
      fetchCallAttempts();
      fetchAnalytics();
    }
  }, [campaignId, currentPage, outcomeFilter, qualifiedFilter, dateFrom, dateTo]);

  const fetchCallAttempts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (outcomeFilter !== 'all') params.append('outcome', outcomeFilter);
      if (qualifiedFilter !== 'all') params.append('qualified', qualifiedFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const response = await fetch(`/api/call-attempts/${campaignId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch call attempts');
      }

      const data = await response.json();
      setCallAttempts(data.callAttempts || []);
      setCampaign(data.campaign);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCalls(data.pagination?.total || 0);
      
    } catch (err) {
      console.error('Error fetching call attempts:', err);
      setError('Failed to load call attempts');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/call-attempts/${campaignId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const exportToCsv = async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      
      if (outcomeFilter !== 'all') params.append('outcome', outcomeFilter);
      if (qualifiedFilter !== 'all') params.append('qualified', qualifiedFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const response = await fetch(`/api/call-attempts/${campaignId}/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `campaign-calls-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV');
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'answered': return <PhoneCall className="h-4 w-4 text-green-500" />;
      case 'qualified': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'voicemail': return <PhoneMissed className="h-4 w-4 text-yellow-500" />;
      case 'no_answer': return <PhoneOff className="h-4 w-4 text-gray-500" />;
      case 'not_interested': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'busy': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Phone className="h-4 w-4 text-gray-400" />;
    }
  };

  const getOutcomeBadge = (outcome: string, isQualified: boolean) => {
    if (isQualified) {
      return <Badge className="bg-emerald-500 text-white">Qualified</Badge>;
    }
    
    const colorMap: { [key: string]: string } = {
      answered: 'bg-green-500 text-white',
      voicemail: 'bg-yellow-500 text-white',
      no_answer: 'bg-gray-500 text-white',
      not_interested: 'bg-red-500 text-white',
      busy: 'bg-orange-500 text-white',
      failed: 'bg-red-600 text-white'
    };
    
    return (
      <Badge className={colorMap[outcome] || 'bg-gray-400 text-white'}>
        {outcome.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSentimentIcon = (score?: number) => {
    if (!score) return null;
    if (score > 0.3) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (score < -0.3) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <TrendingUp className="h-4 w-4 text-yellow-500" />;
  };

  const clearFilters = () => {
    setOutcomeFilter('all');
    setQualifiedFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  if (loading && callAttempts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading call attempts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Call Log: {campaign?.name}
          </h2>
          <p className="text-gray-400">
            {totalCalls} total call attempts
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={exportToCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-400">Total Calls</div>
                  <div className="text-2xl font-bold text-white">{analytics.total_calls}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-sm text-gray-400">Answer Rate</div>
                  <div className="text-2xl font-bold text-white">{analytics.answer_rate}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
                <div>
                  <div className="text-sm text-gray-400">Qualified Rate</div>
                  <div className="text-2xl font-bold text-white">{analytics.qualification_rate}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-sm text-gray-400">Total Cost</div>
                  <div className="text-2xl font-bold text-white">${analytics.total_cost_usd.toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="All Outcomes" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={qualifiedFilter} onValueChange={setQualifiedFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="All Leads" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="true">Qualified Only</SelectItem>
                <SelectItem value="false">Not Qualified</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
            
            <Input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
            
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Call Attempts Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750 border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-medium">Contact</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Outcome</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Duration</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Sentiment</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Cost</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Date</th>
                  <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {callAttempts.map((call, index) => (
                  <tr key={call.id} className={`border-b border-gray-700 hover:bg-gray-750 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-825'}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {getOutcomeIcon(call.outcome)}
                        <div>
                          <div className="text-white font-medium">
                            {call.contact_name || 'Unknown'}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {call.phone_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getOutcomeBadge(call.outcome, call.is_qualified)}
                    </td>
                    <td className="p-4 text-gray-300">
                      {formatDuration(call.duration_seconds)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(call.ai_sentiment_score)}
                        <span className="text-gray-300">
                          {call.ai_sentiment_score ? call.ai_sentiment_score.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      ${call.call_cost_usd.toFixed(3)}
                    </td>
                    <td className="p-4 text-gray-300 text-sm">
                      {formatDate(call.call_started_at)}
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewTranscript?.(call.id)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {callAttempts.length === 0 && !loading && (
            <div className="text-center p-8 text-gray-400">
              No call attempts found for the selected filters.
            </div>
          )}
          
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-gray-700">
            <div className="text-gray-400 text-sm">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCalls)} of {totalCalls} calls
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-gray-300 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-400 text-center p-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default CampaignCallLog;