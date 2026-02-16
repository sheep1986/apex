
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useNotificationStore } from '@/lib/notification-store';
import { supabase } from '@/services/supabase-client';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Flame,
  Headset,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneForwarded,
  PhoneOff,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Volume2,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────
interface ActiveCall {
  id: string;
  contact_name: string;
  phone_number: string;
  assistant_name: string;
  campaign_name?: string;
  status: 'in_progress' | 'ringing' | 'transferring';
  started_at: string;
  duration_seconds: number;
  lead_score?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  ai_summary?: string;
  buying_signals?: string[];
  objections?: string[];
  current_topic?: string;
  transfer_ready?: boolean;
  estimated_value?: number;
}

interface HandoffRequest {
  id: string;
  call_id: string;
  contact_name: string;
  phone_number: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  lead_score: number;
  ai_brief: string;
  key_points: string[];
  recommended_approach: string;
  estimated_value: number;
  campaign_name?: string;
  created_at: string;
}

interface AgentStats {
  active_calls: number;
  calls_today: number;
  handoffs_today: number;
  avg_lead_score: number;
  conversion_rate: number;
  hot_leads: number;
}

// ─── Component ─────────────────────────────────────────────────
export default function AgentDashboard() {
  const { organization } = useSupabaseAuth();
  const { addNotification } = useNotificationStore();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [handoffRequests, setHandoffRequests] = useState<HandoffRequest[]>([]);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [expandedHandoff, setExpandedHandoff] = useState<string | null>(null);
  const [stats, setStats] = useState<AgentStats>({
    active_calls: 0,
    calls_today: 0,
    handoffs_today: 0,
    avg_lead_score: 0,
    conversion_rate: 0,
    hot_leads: 0,
  });

  // Load active calls from voice_calls table
  const loadActiveCalls = useCallback(async () => {
    if (!organization?.id) return;

    const { data: calls } = await supabase
      .from('voice_calls')
      .select('*')
      .eq('organization_id', organization.id)
      .in('status', ['in-progress', 'ringing'])
      .order('created_at', { ascending: false });

    if (calls) {
      const mapped: ActiveCall[] = calls.map((c: any) => ({
        id: c.id,
        contact_name: c.customer?.name || c.customer?.number || 'Unknown',
        phone_number: c.customer?.number || '',
        assistant_name: c.assistant_name || 'AI Assistant',
        campaign_name: c.metadata?.campaign_name,
        status: c.status === 'ringing' ? 'ringing' : 'in_progress',
        started_at: c.started_at || c.created_at,
        duration_seconds: c.duration || 0,
        lead_score: c.analysis?.lead_score,
        sentiment: c.analysis?.sentiment,
        ai_summary: c.analysis?.summary,
        buying_signals: c.analysis?.buying_signals || [],
        objections: c.analysis?.objections || [],
        current_topic: c.analysis?.current_topic,
        transfer_ready: (c.analysis?.lead_score || 0) >= 70,
        estimated_value: c.analysis?.estimated_value,
      }));
      setActiveCalls(mapped);
    }
  }, [organization?.id]);

  // Load hot leads that need human attention
  const loadHotLeads = useCallback(async () => {
    if (!organization?.id) return;

    const { data: leads } = await supabase
      .from('leads')
      .select('*')
      .eq('organization_id', organization.id)
      .gte('score', 70)
      .eq('status', 'qualified')
      .order('score', { ascending: false })
      .limit(20);

    if (leads) {
      const requests: HandoffRequest[] = leads.map((lead: any) => {
        const cf = lead.custom_fields || {};
        return {
          id: lead.id,
          call_id: lead.last_call_id || '',
          contact_name: lead.name || lead.phone_number,
          phone_number: lead.phone_number,
          reason: lead.score >= 90 ? 'Extremely high interest — ready to close' :
                  lead.score >= 80 ? 'Strong buying signals detected' :
                  'Qualified lead needs human follow-up',
          priority: lead.score >= 90 ? 'urgent' :
                    lead.score >= 80 ? 'high' : 'medium',
          lead_score: lead.score || 0,
          ai_brief: cf.ultraDetailedBrief || cf.summary || 'No AI brief available yet.',
          key_points: [
            cf.interest_level ? `Interest: ${cf.interest_level}` : null,
            cf.budget ? `Budget: ${cf.budget}` : null,
            cf.timeline ? `Timeline: ${cf.timeline}` : null,
            cf.decision_maker ? 'Decision maker confirmed' : null,
            cf.pain_points?.length ? `Pain points: ${cf.pain_points.join(', ')}` : null,
          ].filter(Boolean) as string[],
          recommended_approach: cf.next_steps || cf.recommended_approach || 'Follow up with a personalized call addressing their specific needs.',
          estimated_value: cf.estimated_value || lead.estimated_value || 0,
          campaign_name: lead.campaign_name,
          created_at: lead.updated_at || lead.created_at,
        };
      });
      setHandoffRequests(requests);
    }
  }, [organization?.id]);

  // Load daily stats
  const loadStats = useCallback(async () => {
    if (!organization?.id) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [callsRes, leadsRes] = await Promise.all([
      supabase
        .from('voice_calls')
        .select('id, status, analysis, duration', { count: 'exact' })
        .eq('organization_id', organization.id)
        .gte('created_at', today.toISOString()),
      supabase
        .from('leads')
        .select('id, score, status', { count: 'exact' })
        .eq('organization_id', organization.id)
        .gte('score', 70),
    ]);

    const todayCalls = callsRes.data || [];
    const hotLeads = leadsRes.data || [];
    const activeCt = todayCalls.filter((c: any) => c.status === 'in-progress').length;
    const scores = hotLeads.map((l: any) => l.score || 0);
    const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;

    setStats({
      active_calls: activeCt,
      calls_today: todayCalls.length,
      handoffs_today: hotLeads.filter((l: any) => l.status === 'qualified').length,
      avg_lead_score: Math.round(avgScore),
      conversion_rate: todayCalls.length > 0
        ? Math.round((todayCalls.filter((c: any) => c.analysis?.outcome === 'interested').length / todayCalls.length) * 100)
        : 0,
      hot_leads: hotLeads.length,
    });
  }, [organization?.id]);

  // Initial load + polling
  useEffect(() => {
    if (!organization?.id) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([loadActiveCalls(), loadHotLeads(), loadStats()]);
      setLoading(false);
    };
    load();

    // Poll every 10 seconds for live data
    const interval = setInterval(() => {
      loadActiveCalls();
      loadHotLeads();
      loadStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [organization?.id, loadActiveCalls, loadHotLeads, loadStats]);

  // Accept handoff — mark lead as "in_progress" by human
  const acceptHandoff = async (request: HandoffRequest) => {
    await supabase
      .from('leads')
      .update({ status: 'in_progress', assigned_to: 'human_agent' })
      .eq('id', request.id);

    addNotification({
      type: 'success',
      title: 'Handoff Accepted',
      message: `You've taken over ${request.contact_name}. AI brief loaded.`,
      category: 'calls',
      priority: 'high',
      source: 'agent-dashboard',
    });

    // Refresh
    loadHotLeads();
    loadStats();
  };

  // Dismiss handoff
  const dismissHandoff = async (request: HandoffRequest) => {
    await supabase
      .from('leads')
      .update({ status: 'nurturing' })
      .eq('id', request.id);

    setHandoffRequests(prev => prev.filter(r => r.id !== request.id));
  };

  // Filtered handoffs
  const filteredHandoffs = useMemo(() => {
    if (!searchQuery) return handoffRequests;
    const q = searchQuery.toLowerCase();
    return handoffRequests.filter(
      h => h.contact_name.toLowerCase().includes(q) ||
           h.phone_number.includes(q) ||
           h.campaign_name?.toLowerCase().includes(q)
    );
  }, [handoffRequests, searchQuery]);

  const priorityColor = (p: string) => {
    switch (p) {
      case 'urgent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const sentimentColor = (s?: string) => {
    switch (s) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-gray-400">Loading Agent Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Headset className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Agent Dashboard</h1>
              <p className="text-gray-400">AI-to-human handoff control center</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm text-emerald-400">Live</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Active Calls', value: stats.active_calls, icon: Phone, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
            { label: 'Calls Today', value: stats.calls_today, icon: Clock, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
            { label: 'Hot Leads', value: stats.hot_leads, icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
            { label: 'Handoffs', value: stats.handoffs_today, icon: PhoneForwarded, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
            { label: 'Avg Score', value: stats.avg_lead_score, icon: Target, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
            { label: 'Conversion', value: `${stats.conversion_rate}%`, icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-500/10' },
          ].map(({ label, value, icon: Icon, color, bgColor }) => (
            <Card key={label} className="border-gray-800 bg-gray-900/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1 rounded ${bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                  </div>
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search leads, contacts, campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-gray-800 bg-gray-900 pl-10 text-white placeholder:text-gray-500"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">

          {/* ── Left: Active AI Calls ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Active AI Calls</h2>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {activeCalls.length}
              </Badge>
            </div>

            {activeCalls.length === 0 ? (
              <Card className="border-gray-800 bg-gray-900/50">
                <CardContent className="py-12 text-center">
                  <Phone className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No active calls right now</p>
                  <p className="text-sm text-gray-600 mt-1">Calls will appear here in real-time</p>
                </CardContent>
              </Card>
            ) : (
              activeCalls.map(call => {
                const isExpanded = expandedCall === call.id;
                return (
                  <Card key={call.id} className="border-gray-800 bg-gray-900/50 transition-all hover:border-gray-700">
                    <CardContent className="p-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedCall(isExpanded ? null : call.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-sm font-bold text-white">
                              {(call.contact_name?.[0] || '?').toUpperCase()}
                            </div>
                            {call.status === 'in_progress' && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-gray-900" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{call.contact_name}</p>
                            <p className="text-xs text-gray-500">{call.assistant_name} · {call.phone_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {call.lead_score && call.lead_score >= 70 && (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              <Flame className="h-3 w-3 mr-1" /> {call.lead_score}
                            </Badge>
                          )}
                          <span className={`text-xs ${sentimentColor(call.sentiment)}`}>
                            {call.sentiment || 'analyzing'}
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-gray-800 space-y-3">
                          {call.ai_summary && (
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <BrainCircuit className="h-3.5 w-3.5 text-purple-400" />
                                <span className="text-xs font-medium text-purple-400">AI Summary</span>
                              </div>
                              <p className="text-sm text-gray-300">{call.ai_summary}</p>
                            </div>
                          )}
                          {call.buying_signals && call.buying_signals.length > 0 && (
                            <div>
                              <span className="text-xs text-gray-500">Buying Signals</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {call.buying_signals.map((s, i) => (
                                  <Badge key={i} className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">{s}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {call.objections && call.objections.length > 0 && (
                            <div>
                              <span className="text-xs text-gray-500">Objections</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {call.objections.map((o, i) => (
                                  <Badge key={i} className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">{o}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {call.transfer_ready && (
                            <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                              <PhoneForwarded className="h-4 w-4 mr-2" /> Take Over This Call
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* ── Right: AI Handoff Queue ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-orange-400" />
              <h2 className="text-lg font-semibold text-white">AI Handoff Queue</h2>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                {filteredHandoffs.length}
              </Badge>
            </div>

            <p className="text-xs text-gray-500">
              These leads have been qualified by AI and are ready for human follow-up. The AI has prepared a briefing for each one.
            </p>

            {filteredHandoffs.length === 0 ? (
              <Card className="border-gray-800 bg-gray-900/50">
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No handoff requests</p>
                  <p className="text-sm text-gray-600 mt-1">AI will flag leads when they're ready for human attention</p>
                </CardContent>
              </Card>
            ) : (
              filteredHandoffs.map(request => {
                const isExpanded = expandedHandoff === request.id;
                return (
                  <Card
                    key={request.id}
                    className={`border-gray-800 bg-gray-900/50 transition-all hover:border-gray-700 ${
                      request.priority === 'urgent' ? 'border-l-2 border-l-red-500' :
                      request.priority === 'high' ? 'border-l-2 border-l-orange-500' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedHandoff(isExpanded ? null : request.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500/30 to-red-500/30 flex items-center justify-center text-sm font-bold text-white">
                            {(request.contact_name?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">{request.contact_name}</p>
                              <Badge className={`text-xs ${priorityColor(request.priority)}`}>
                                {request.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">{request.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3 text-purple-400" />
                              <span className="text-sm font-bold text-purple-400">{request.lead_score}</span>
                            </div>
                            {request.estimated_value > 0 && (
                              <span className="text-xs text-green-400">
                                ${request.estimated_value.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-3 border-t border-gray-800 space-y-3">
                          {/* AI Brief - like a colleague briefing you */}
                          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-3 border border-purple-500/20">
                            <div className="flex items-center gap-1.5 mb-2">
                              <BrainCircuit className="h-4 w-4 text-purple-400" />
                              <span className="text-sm font-medium text-purple-400">AI Brief</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">{request.ai_brief}</p>
                          </div>

                          {/* Key Points */}
                          {request.key_points.length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-gray-400">Key Intelligence</span>
                              <div className="mt-1.5 space-y-1">
                                {request.key_points.map((point, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <ArrowRight className="h-3 w-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-300">{point}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommended Approach */}
                          <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/20">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Zap className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-xs font-medium text-emerald-400">Recommended Approach</span>
                            </div>
                            <p className="text-sm text-gray-300">{request.recommended_approach}</p>
                          </div>

                          {/* Campaign info */}
                          {request.campaign_name && (
                            <p className="text-xs text-gray-500">
                              From campaign: <span className="text-gray-400">{request.campaign_name}</span>
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={(e) => { e.stopPropagation(); acceptHandoff(request); }}
                            >
                              <PhoneForwarded className="h-4 w-4 mr-2" /> Accept & Call
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-700 text-gray-400 hover:text-white"
                              onClick={(e) => { e.stopPropagation(); dismissHandoff(request); }}
                            >
                              Defer
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* AI Coaching Tips */}
        <Card className="border-gray-800 bg-gradient-to-r from-gray-900 to-gray-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-purple-400" />
              AI Coaching & Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Top Performing</span>
                </div>
                <p className="text-sm text-gray-300">
                  Leads from campaigns with personalized intros convert 2.3x more. Consider adding custom greetings.
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-400">Timing Insight</span>
                </div>
                <p className="text-sm text-gray-300">
                  Best callback window is within 5 minutes of AI qualification. Response rate drops 60% after 30 min.
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400">Talk Track</span>
                </div>
                <p className="text-sm text-gray-300">
                  When taking over from AI, reference what was discussed: "I see you spoke about [topic] — let me help with that."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
