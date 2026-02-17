
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/services/supabase-client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import {
  ArrowLeft,
  BarChart2,
  Brain,
  Building,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Flame,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface CallRecord {
  id: string;
  status: string;
  direction: string;
  duration: number;
  created_at: string;
  summary?: string;
  transcript?: string;
  sentiment?: string;
  ai_summary?: string;
  ai_sentiment_score?: number;
  ai_qualification_score?: number;
  ai_next_action?: string;
  outcome?: string;
  cost?: number;
  ended_reason?: string;
}

interface LeadRecord {
  id: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  email?: string;
  phone_number?: string;
  status?: string;
  score?: number;
  interest_level?: string;
  qualification_status?: string;
  budget?: string;
  timeline?: string;
  next_call_at?: string;
  last_call_at?: string;
  call_attempts?: number;
  notes?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const { organization } = useSupabaseAuth();
  const navigate = useNavigate();
  const [contact, setContact] = useState<any>(null);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  useEffect(() => {
    if (organization?.id && id) {
      loadData();
    }
  }, [organization, id]);

  const loadData = async () => {
    setLoading(true);

    // 1. Fetch Contact
    const { data: contactData } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization?.id)
      .single();

    setContact(contactData);

    if (!contactData) {
      setLoading(false);
      return;
    }

    // 2. Fetch calls for this contact
    const { data: callData } = await supabase
      .from('voice_calls')
      .select('*')
      .eq('contact_id', id)
      .eq('organization_id', organization?.id)
      .order('created_at', { ascending: false });

    setCalls(callData || []);

    // 3. Fetch associated lead record (by phone)
    if (contactData.phone_e164) {
      const { data: leadData } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', organization?.id)
        .eq('phone_number', contactData.phone_e164)
        .maybeSingle();

      setLead(leadData);
    }

    // 4. Fetch activities timeline
    const { data: activityData } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', id)
      .eq('organization_id', organization?.id)
      .order('occurred_at', { ascending: false });

    setActivities(activityData || []);
    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (sentiment: string | undefined) => {
    if (!sentiment) return 'text-gray-400';
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'text-emerald-400';
      case 'negative': return 'text-red-400';
      case 'neutral': return 'text-gray-400';
      case 'mixed': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-gray-400">Loading contact...</span>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="h-16 w-16 text-gray-600 mx-auto" />
          <h2 className="text-xl text-gray-300">Contact not found</h2>
          <Button variant="outline" onClick={() => navigate('/contacts')}>Back to Contacts</Button>
        </div>
      </div>
    );
  }

  // AI insights from the lead record
  const customFields = lead?.custom_fields || {};
  const interestLevel = customFields.interest_level || lead?.interest_level;
  const painPoints = customFields.pain_points || [];
  const buyingSignals = customFields.buying_signals || [];
  const objections = customFields.objections_raised || [];
  const nextSteps = customFields.nextSteps;
  const ultraBrief = customFields.ultraDetailedBrief;
  const budget = customFields.budget || lead?.budget;
  const timeline = customFields.timeline || lead?.timeline;

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Back button + Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-emerald-500 flex items-center justify-center text-2xl font-bold text-white">
              {(contact.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                {contact.name || 'Unknown Contact'}
                {lead?.score && lead.score >= 70 && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <Flame className="h-3 w-3 mr-1" /> Hot Lead
                  </Badge>
                )}
                {lead?.qualification_status && (
                  <Badge variant="outline" className="text-purple-400 border-purple-500/30">
                    {lead.qualification_status}
                  </Badge>
                )}
              </h1>
              <div className="flex items-center gap-4 mt-1 text-gray-400">
                <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {contact.phone_e164}</span>
                {(contact.email || lead?.email) && (
                  <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {contact.email || lead?.email}</span>
                )}
                {lead?.company && (
                  <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {lead.company}</span>
                )}
                {lead?.job_title && (
                  <span className="text-gray-500">{lead.job_title}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Phone className="h-4 w-4 mr-2" /> Call Now
            </Button>
          </div>
        </div>

        {/* Score Cards */}
        {lead && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {lead.score != null && (
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Lead Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(lead.score)}`}>{lead.score}</p>
                  <Progress value={lead.score} className="h-1.5 mt-2 bg-gray-800" />
                </CardContent>
              </Card>
            )}
            {interestLevel && (
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Interest Level</p>
                  <p className="text-3xl font-bold text-purple-400">{interestLevel}<span className="text-sm text-gray-500">/10</span></p>
                </CardContent>
              </Card>
            )}
            {budget && (
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Budget</p>
                  <p className="text-lg font-bold text-emerald-400">{budget}</p>
                </CardContent>
              </Card>
            )}
            {timeline && (
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Timeline</p>
                  <p className="text-lg font-bold text-blue-400">{timeline}</p>
                </CardContent>
              </Card>
            )}
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Total Calls</p>
                <p className="text-3xl font-bold text-white">{calls.length}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: AI Insights */}
          <div className="space-y-6">
            {/* AI Intelligence Summary */}
            {(ultraBrief || nextSteps || painPoints.length > 0 || buyingSignals.length > 0) && (
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <Brain className="h-5 w-5 text-purple-400" /> AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ultraBrief && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Intelligence Brief</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{typeof ultraBrief === 'string' ? ultraBrief : JSON.stringify(ultraBrief)}</p>
                    </div>
                  )}
                  {nextSteps && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Recommended Next Steps</p>
                      <p className="text-sm text-emerald-400">{nextSteps}</p>
                    </div>
                  )}
                  {painPoints.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Pain Points</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(painPoints) ? painPoints : [painPoints]).map((p: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs text-red-400 border-red-500/30">{p}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {buyingSignals.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Buying Signals</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(buyingSignals) ? buyingSignals : [buyingSignals]).map((s: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs text-emerald-400 border-emerald-500/30">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {objections.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Objections Raised</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(objections) ? objections : [objections]).map((o: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs text-yellow-400 border-yellow-500/30">{o}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Details */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Phone', value: contact.phone_e164, icon: Phone },
                  { label: 'Email', value: contact.email || lead?.email, icon: Mail },
                  { label: 'Company', value: lead?.company, icon: Building },
                  { label: 'Job Title', value: lead?.job_title, icon: User },
                  { label: 'Created', value: new Date(contact.created_at).toLocaleDateString(), icon: Calendar },
                  { label: 'Last Call', value: lead?.last_call_at ? new Date(lead.last_call_at).toLocaleDateString() : undefined, icon: Phone },
                  { label: 'Call Attempts', value: lead?.call_attempts?.toString(), icon: Target },
                ].filter(d => d.value).map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between border-b border-gray-800/50 pb-2">
                    <span className="flex items-center gap-2 text-sm text-gray-400">
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </span>
                    <span className="text-sm text-white">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Lead Notes */}
            {lead?.notes && (
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" /> Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{lead.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Call History + Timeline */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="calls">
              <TabsList className="bg-gray-900 border-gray-800">
                <TabsTrigger value="calls">Call History ({calls.length})</TabsTrigger>
                <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="calls" className="mt-4 space-y-3">
                {calls.length === 0 && (
                  <div className="text-center py-12">
                    <Phone className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No calls recorded yet</p>
                  </div>
                )}

                {calls.map((call) => (
                  <Card
                    key={call.id}
                    className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                    onClick={() => setExpandedCallId(expandedCallId === call.id ? null : call.id)}
                  >
                    <CardContent className="p-4">
                      {/* Call Summary Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            call.status === 'completed' ? 'bg-emerald-900/30 text-emerald-400' :
                            call.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                            'bg-gray-800 text-gray-400'
                          }`}>
                            <Phone className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white capitalize">{call.direction || 'outbound'}</span>
                              <Badge variant="outline" className={`text-xs ${
                                call.status === 'completed' ? 'text-emerald-400 border-emerald-500/30' :
                                call.status === 'failed' ? 'text-red-400 border-red-500/30' :
                                'text-gray-400 border-gray-600'
                              }`}>
                                {call.status}
                              </Badge>
                              {call.ai_sentiment_score != null && (
                                <Badge variant="outline" className={`text-xs ${getSentimentColor(call.sentiment)}`}>
                                  {call.sentiment || `Score: ${call.ai_sentiment_score}`}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                              <span><Clock className="h-3 w-3 inline mr-1" />{formatDuration(call.duration)}</span>
                              <span><Calendar className="h-3 w-3 inline mr-1" />{new Date(call.created_at).toLocaleString()}</span>
                              {call.cost != null && <span><DollarSign className="h-3 w-3 inline mr-1" />${call.cost.toFixed(2)}</span>}
                            </div>
                          </div>
                        </div>
                        {call.ai_qualification_score != null && (
                          <div className="text-right">
                            <span className={`text-lg font-bold ${getScoreColor(call.ai_qualification_score)}`}>
                              {call.ai_qualification_score}
                            </span>
                            <p className="text-xs text-gray-500">Qual. Score</p>
                          </div>
                        )}
                      </div>

                      {/* AI Summary */}
                      {(call.ai_summary || call.summary) && (
                        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                          <p className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-purple-400" /> AI Summary
                          </p>
                          <p className="text-sm text-gray-300">{call.ai_summary || call.summary}</p>
                        </div>
                      )}

                      {/* Expanded: Full transcript + AI analysis */}
                      {expandedCallId === call.id && (
                        <div className="mt-4 space-y-3 border-t border-gray-800 pt-4">
                          {call.ai_next_action && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1">Recommended Next Action</p>
                              <p className="text-sm text-emerald-400">{call.ai_next_action}</p>
                            </div>
                          )}
                          {call.outcome && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1">Outcome</p>
                              <p className="text-sm text-white">{call.outcome}</p>
                            </div>
                          )}
                          {call.ended_reason && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1">Ended Reason</p>
                              <p className="text-sm text-gray-400">{call.ended_reason}</p>
                            </div>
                          )}
                          {call.transcript && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" /> Transcript
                              </p>
                              <div className="bg-gray-800 rounded-lg p-3 max-h-64 overflow-y-auto">
                                <p className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{call.transcript}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="timeline" className="mt-4 space-y-3">
                {activities.length === 0 && (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500">No activity recorded</p>
                  </div>
                )}

                {activities.map((act) => (
                  <Card key={act.id} className="bg-gray-900 border-gray-800">
                    <CardContent className="p-4 flex gap-4">
                      <div className="mt-1">
                        {act.type?.includes('call') ? <Phone className="h-5 w-5 text-blue-400" /> : <FileText className="h-5 w-5 text-yellow-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{act.summary || act.type}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{new Date(act.occurred_at).toLocaleString()}</div>
                        {act.metadata && Object.keys(act.metadata).length > 0 && (
                          <div className="mt-2 text-xs bg-gray-800 p-2 rounded text-gray-400">
                            {Object.entries(act.metadata).map(([key, val]) => (
                              <div key={key}><span className="text-gray-500">{key}:</span> {String(val)}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
