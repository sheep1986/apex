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
import { voiceService, type CallAnalytics, type VoiceAssistant } from '@/services/voice-service';
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  Phone,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const ENDED_REASON_LABELS: Record<string, string> = {
  'customer-ended-call': 'Customer Hung Up',
  'assistant-ended-call': 'Assistant Ended',
  'silence-timed-out': 'Silence Timeout',
  'customer-did-not-give-microphone-permission': 'No Mic Permission',
  'exceeded-max-duration': 'Max Duration',
  'assistant-not-found': 'Assistant Not Found',
  'assistant-request-returned-error': 'Assistant Error',
  'pipeline-error-openai-llm-failed': 'LLM Failed',
  'pipeline-error-deepgram-transcriber-failed': 'Transcriber Failed',
  'pipeline-error-eleven-labs-voice-failed': 'Voice Failed',
  'voicemail-reached': 'Voicemail',
  'call-forwarded': 'Forwarded',
  'phone-call-provider-closed-websocket': 'Provider Closed',
  'unknown': 'Unknown',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
};

const formatCost = (cost: number) => `$${cost.toFixed(2)}`;

export function Analytics() {
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [assistants, setAssistants] = useState<VoiceAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [voiceReady, setVoiceReady] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState('7d');
  const [assistantFilter, setAssistantFilter] = useState('all');

  // Voice service readiness
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

  const fetchAnalytics = useCallback(async () => {
    if (!voiceReady) return;
    setLoading(true);
    try {
      const now = new Date();
      let startDate: string | undefined;
      switch (dateRange) {
        case '1d': startDate = new Date(now.getTime() - 86400000).toISOString(); break;
        case '7d': startDate = new Date(now.getTime() - 7 * 86400000).toISOString(); break;
        case '30d': startDate = new Date(now.getTime() - 30 * 86400000).toISOString(); break;
        case '90d': startDate = new Date(now.getTime() - 90 * 86400000).toISOString(); break;
      }
      const data = await voiceService.getCallAnalytics({
        startDate,
        assistantId: assistantFilter !== 'all' ? assistantFilter : undefined,
      });
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [voiceReady, dateRange, assistantFilter]);

  useEffect(() => {
    if (!voiceReady) return;
    const fetchAssistants = async () => {
      try {
        const data = await voiceService.getAssistants();
        setAssistants(data || []);
      } catch { /* ignore */ }
    };
    fetchAssistants();
  }, [voiceReady]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getAssistantName = useCallback((id: string) => {
    const a = assistants.find(a => a.id === id);
    return a?.name || id.slice(0, 12) + '...';
  }, [assistants]);

  // Prepare ended reason data for pie chart
  const endedReasonData = analytics
    ? Object.entries(analytics.endedReasonBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([reason, count]) => ({
          name: ENDED_REASON_LABELS[reason] || reason,
          value: count,
        }))
    : [];

  // Prepare sentiment data
  const sentimentData = analytics
    ? [
        { name: 'Positive', value: analytics.sentimentBreakdown.positive, color: '#10b981' },
        { name: 'Neutral', value: analytics.sentimentBreakdown.neutral, color: '#6b7280' },
        { name: 'Negative', value: analytics.sentimentBreakdown.negative, color: '#ef4444' },
      ].filter(d => d.value > 0)
    : [];

  // Prepare cost breakdown data
  const costData = analytics
    ? [
        { name: 'STT', value: Math.round(analytics.costBreakdownTotals.stt * 100) / 100, color: '#3b82f6' },
        { name: 'LLM', value: Math.round(analytics.costBreakdownTotals.llm * 100) / 100, color: '#8b5cf6' },
        { name: 'TTS', value: Math.round(analytics.costBreakdownTotals.tts * 100) / 100, color: '#10b981' },
        { name: 'Platform', value: Math.round(analytics.costBreakdownTotals.vapi * 100) / 100, color: '#f59e0b' },
        { name: 'Transport', value: Math.round(analytics.costBreakdownTotals.transport * 100) / 100, color: '#ef4444' },
      ].filter(d => d.value > 0)
    : [];

  if (!voiceReady || (loading && !analytics)) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-gray-400">
          {!voiceReady ? 'Connecting to voice service...' : 'Loading analytics...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
              <p className="text-gray-400">Call performance, costs, and insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32 border-gray-700 bg-gray-900 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-900 text-white">
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assistantFilter} onValueChange={setAssistantFilter}>
              <SelectTrigger className="w-48 border-gray-700 bg-gray-900 text-white">
                <SelectValue placeholder="All Assistants" />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-900 text-white">
                <SelectItem value="all">All Assistants</SelectItem>
                {assistants.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name || a.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={fetchAnalytics}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {analytics && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">Total Calls</p>
                    <Phone className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.totalCalls.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {analytics.successfulCalls.toLocaleString()} successful
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">Avg Duration</p>
                    <Clock className="h-5 w-5 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{formatDuration(analytics.averageDuration)}</p>
                  <p className="text-sm text-gray-500 mt-1">per call</p>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">Total Cost</p>
                    <DollarSign className="h-5 w-5 text-yellow-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{formatCost(analytics.totalCost)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {analytics.totalCalls > 0 ? formatCost(analytics.totalCost / analytics.totalCalls) + '/call' : '—'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">Success Rate</p>
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.conversionRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500 mt-1">calls &gt; 30s</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1: Calls Over Time + Cost Breakdown */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Calls Over Time */}
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    Calls Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.callsByDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={analytics.callsByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                          labelStyle={{ color: '#f3f4f6' }}
                          labelFormatter={(v) => new Date(v).toLocaleDateString()}
                        />
                        <defs>
                          <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorCalls)" strokeWidth={2} name="Calls" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[280px] items-center justify-center text-gray-500">No call data for this period</div>
                  )}
                </CardContent>
              </Card>

              {/* Cost Breakdown */}
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-400" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {costData.length > 0 ? (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={280}>
                        <RechartsPieChart>
                          <Pie data={costData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={(e) => `${e.name}: $${e.value}`}>
                            {costData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-3">
                        {costData.map(d => (
                          <div key={d.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                              <span className="text-sm text-gray-300">{d.name}</span>
                            </div>
                            <span className="text-sm font-medium text-white">${d.value.toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-gray-800 pt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-300">Total</span>
                          <span className="text-sm font-bold text-white">{formatCost(analytics.totalCost)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[280px] items-center justify-center text-gray-500">No cost data available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2: Calls by Hour + Ended Reasons */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Calls by Hour */}
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-emerald-400" />
                    Calls by Hour of Day
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analytics.callsByHour}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="hour" stroke="#6b7280" tickFormatter={(v) => `${v}:00`} />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                        labelFormatter={(v) => `${v}:00 - ${v}:59`}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} name="Calls" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Ended Reasons */}
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-400" />
                    Call Outcome Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {endedReasonData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <RechartsPieChart>
                        <Pie
                          data={endedReasonData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          dataKey="value"
                          label={(e) => `${e.name}: ${e.value}`}
                        >
                          {endedReasonData.map((_entry, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[280px] items-center justify-center text-gray-500">No ended reason data</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sentiment */}
            {sentimentData.length > 0 && (
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8">
                    {sentimentData.map(d => (
                      <div key={d.name} className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: d.color }} />
                        <div>
                          <p className="text-sm font-medium text-white">{d.name}</p>
                          <p className="text-lg font-bold text-white">{d.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-gray-800">
                    {sentimentData.map(d => {
                      const total = sentimentData.reduce((s, x) => s + x.value, 0);
                      const pct = total > 0 ? (d.value / total) * 100 : 0;
                      return (
                        <div key={d.name} className="h-full" style={{ width: `${pct}%`, backgroundColor: d.color }} />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assistant Comparison */}
            {analytics.assistantBreakdown.length > 1 && (
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Assistant Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-4 text-xs font-medium text-gray-500 px-4">
                      <span>Assistant</span>
                      <span className="text-right">Calls</span>
                      <span className="text-right">Avg Duration</span>
                      <span className="text-right">Cost</span>
                      <span className="text-right">Success Rate</span>
                    </div>
                    {analytics.assistantBreakdown
                      .sort((a, b) => b.calls - a.calls)
                      .map(ab => (
                        <div key={ab.assistantId} className="grid grid-cols-5 gap-4 items-center rounded-lg border border-gray-800 bg-black/30 p-4">
                          <span className="text-sm font-medium text-white truncate">
                            {getAssistantName(ab.assistantId)}
                          </span>
                          <span className="text-sm text-gray-300 text-right">{ab.calls.toLocaleString()}</span>
                          <span className="text-sm text-gray-300 text-right">{formatDuration(ab.avgDuration)}</span>
                          <span className="text-sm text-gray-300 text-right">{formatCost(ab.cost)}</span>
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-2 w-16 rounded-full bg-gray-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${ab.successRate >= 80 ? 'bg-emerald-500' : ab.successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${ab.successRate}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-300">{ab.successRate}%</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Cost Chart */}
            {analytics.callsByDay.length > 1 && (
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-400" />
                    Daily Cost Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={analytics.callsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#6b7280" tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                      />
                      <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="cost" stroke="#f59e0b" fill="url(#colorCost)" strokeWidth={2} name="Cost" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* No data state */}
        {analytics && analytics.totalCalls === 0 && (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <BarChart3 className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-white">No Call Data</h3>
              <p className="mx-auto max-w-sm text-sm text-gray-400">
                No calls found for the selected time period. Analytics will appear once your assistants start handling calls.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
