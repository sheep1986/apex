import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Eye,
  Users,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  CheckCheck,
  Ban,
  PhoneCall,
  Clock,
  MessageSquare,
  Target,
  RefreshCw,
  BrainCircuit
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';

interface PendingLead {
  id: string;
  phone_number: string;
  customer_name?: string;
  campaign_id: string;
  started_at: string;
  duration: number;
  outcome?: string;
  sentiment?: string;
  summary?: string;
  ai_confidence_score?: number;
  ai_recommendation?: string;
  key_points?: string;
  buying_signals?: string;
  next_steps?: string;
  campaigns?: {
    name: string;
  };
}

interface LeadReviewStats {
  total: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

export const LeadReviewQueue: React.FC = () => {
  const { getToken } = useAuth();
  const [pendingLeads, setPendingLeads] = useState<PendingLead[]>([]);
  const [stats, setStats] = useState<LeadReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    fetchPendingLeads();
  }, []);

  const fetchPendingLeads = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/lead-review/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingLeads(data.pendingLeads);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching pending leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'accept' | 'decline', strategy?: string) => {
    setProcessing(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/lead-review/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          strategy,
          callIds: strategy ? undefined : Array.from(selectedLeads)
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Bulk ${action} completed:`, result);
        await fetchPendingLeads();
        setSelectedLeads(new Set());
      }
    } catch (error) {
      console.error('Error processing bulk action:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleIndividualAction = async (callId: string, action: 'accept' | 'decline') => {
    setProcessing(true);
    try {
      const token = await getToken();
      const response = await fetch(`/api/lead-review/${callId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchPendingLeads();
      }
    } catch (error) {
      console.error('Error processing lead:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'bg-gray-500';
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const filteredLeads = pendingLeads.filter(lead => {
    if (filter === 'all') return true;
    const score = lead.ai_confidence_score || 0;
    if (filter === 'high') return score >= 0.8;
    if (filter === 'medium') return score >= 0.6 && score < 0.8;
    if (filter === 'low') return score < 0.6;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading pending leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-purple-500" />
            Lead Review Queue
          </h2>
          <p className="text-gray-400">
            {stats?.total || 0} leads awaiting your review
          </p>
        </div>
        <Button variant="outline" onClick={fetchPendingLeads} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-sm text-gray-400">Total Pending</div>
                <div className="text-2xl font-bold text-white">{stats?.total || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-sm text-gray-400">High Confidence</div>
                <div className="text-2xl font-bold text-white">{stats?.highConfidence || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-sm text-gray-400">Medium Confidence</div>
                <div className="text-2xl font-bold text-white">{stats?.mediumConfidence || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-sm text-gray-400">Low Confidence</div>
                <div className="text-2xl font-bold text-white">{stats?.lowConfidence || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleBulkAction('accept', 'ai_recommended')}
              disabled={processing || !stats?.highConfidence}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Accept AI Recommended ({stats?.highConfidence || 0})
            </Button>
            
            <Button
              onClick={() => handleBulkAction('accept', 'all')}
              disabled={processing || !stats?.total}
              variant="outline"
              className="border-green-600 text-green-400 hover:bg-green-900"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept All ({stats?.total || 0})
            </Button>

            <Button
              onClick={() => handleBulkAction('decline', 'all')}
              disabled={processing || !stats?.total}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-900"
            >
              <Ban className="h-4 w-4 mr-2" />
              Decline All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({stats?.total || 0})
        </Button>
        <Button
          variant={filter === 'high' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('high')}
        >
          High ({stats?.highConfidence || 0})
        </Button>
        <Button
          variant={filter === 'medium' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('medium')}
        >
          Medium ({stats?.mediumConfidence || 0})
        </Button>
        <Button
          variant={filter === 'low' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('low')}
        >
          Low ({stats?.lowConfidence || 0})
        </Button>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-400">No pending leads to review!</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Lead Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <PhoneCall className="h-5 w-5 text-blue-500" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {lead.customer_name || 'Unknown Contact'}
                        </h3>
                        <p className="text-gray-400">{lead.phone_number}</p>
                      </div>
                      <Badge className={`${getConfidenceColor(lead.ai_confidence_score)} text-white`}>
                        {Math.round((lead.ai_confidence_score || 0) * 100)}% {getConfidenceLabel(lead.ai_confidence_score)}
                      </Badge>
                    </div>

                    {/* Call Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-400">Campaign</p>
                        <p className="text-white">{lead.campaigns?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Duration</p>
                        <p className="text-white">{formatDuration(lead.duration)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Outcome</p>
                        <p className="text-white capitalize">{lead.outcome || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">AI Recommendation</p>
                        <p className={`font-medium ${lead.ai_recommendation === 'accept' ? 'text-green-400' : 'text-yellow-400'}`}>
                          {lead.ai_recommendation === 'accept' ? '✓ Accept' : '⚡ Review'}
                        </p>
                      </div>
                    </div>

                    {/* AI Summary */}
                    {lead.summary && (
                      <div className="bg-gray-900 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-purple-500" />
                          <p className="text-sm font-medium text-gray-300">AI Summary</p>
                        </div>
                        <p className="text-white text-sm">{lead.summary}</p>
                      </div>
                    )}

                    {/* Key Points & Signals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lead.key_points && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Key Points</p>
                          <p className="text-white text-sm">{lead.key_points}</p>
                        </div>
                      )}
                      {lead.buying_signals && (
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Buying Signals</p>
                          <p className="text-green-400 text-sm">{lead.buying_signals}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleIndividualAction(lead.id, 'accept')}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleIndividualAction(lead.id, 'decline')}
                      disabled={processing}
                      className="border-red-600 text-red-400 hover:bg-red-900"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {/* View call details */}}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LeadReviewQueue;