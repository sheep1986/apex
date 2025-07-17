import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CallLogDetailsModal } from './CallLogDetailsModal';
import { formatCustomDate } from '../lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  User,
  MessageSquare,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CallRecord {
  id: string;
  type: 'inbound' | 'outbound' | 'missed';
  agent: {
    name: string;
    avatar: string;
  };
  campaign?: {
    name: string;
    id: string;
  };
  startTime: string;
  duration: number;
  outcome: 'connected' | 'voicemail' | 'no_answer' | 'busy' | 'failed';
  sentiment: 'positive' | 'neutral' | 'negative';
  recording?: string;
  transcript?: string;
  notes?: string;
  nextAction?: {
    type: 'callback' | 'email' | 'meeting' | 'none';
    scheduledFor?: string;
  };
  metrics?: {
    talkTime: number;
    holdTime: number;
    objections: number;
    positiveSignals: number;
  };
}

interface LeadCallHistoryProps {
  leadId: string;
  leadName: string;
}

// Mock data
const mockCallHistory: CallRecord[] = [
  {
    id: '1',
    type: 'outbound',
    agent: {
      name: 'Sarah Johnson',
      avatar: '/avatars/sarah.jpg',
    },
    campaign: {
      name: 'Q1 Enterprise Outreach',
      id: 'c1',
    },
    startTime: '2025-01-07T14:30:00Z',
    duration: 425,
    outcome: 'connected',
    sentiment: 'positive',
    recording: '/recordings/call-1.mp3',
    transcript: 'Full transcript available',
    notes: 'Interested in our enterprise solution. Scheduled demo for next week.',
    nextAction: {
      type: 'meeting',
      scheduledFor: '2025-01-14T15:00:00Z',
    },
    metrics: {
      talkTime: 380,
      holdTime: 45,
      objections: 2,
      positiveSignals: 5,
    },
  },
  {
    id: '2',
    type: 'outbound',
    agent: {
      name: 'Mike Rodriguez',
      avatar: '/avatars/mike.jpg',
    },
    campaign: {
      name: 'Initial Outreach',
      id: 'c2',
    },
    startTime: '2025-01-05T10:15:00Z',
    duration: 180,
    outcome: 'voicemail',
    sentiment: 'neutral',
    notes: 'Left voicemail about our new features.',
    nextAction: {
      type: 'callback',
      scheduledFor: '2025-01-08T10:00:00Z',
    },
  },
  {
    id: '3',
    type: 'missed',
    agent: {
      name: 'Emma Wilson',
      avatar: '/avatars/emma.jpg',
    },
    startTime: '2025-01-03T16:45:00Z',
    duration: 0,
    outcome: 'no_answer',
    sentiment: 'neutral',
  },
];

export function LeadCallHistory({ leadId, leadName }: LeadCallHistoryProps) {
  const [expandedCall, setExpandedCall] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showCallDetails, setShowCallDetails] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return 'Missed';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    return formatCustomDate(dateString);
  };

  const handleViewCallDetails = (call: CallRecord) => {
    setSelectedCall(call);
    setShowCallDetails(true);
  };

  const getMockCallData = (call: CallRecord) => {
    return {
      id: call.id,
      duration: call.duration,
      transcript: [
        {
          speaker: 'ai' as const,
          text: `Hello, this is ${call.agent.name} from Apex AI Solutions. Is this ${leadName}?`,
        },
        { speaker: 'user' as const, text: 'Yes, this is me.' },
        {
          speaker: 'ai' as const,
          text: `Hi ${leadName}, I hope I'm not catching you at a bad time. I'm calling because we've developed an innovative AI calling solution that's been helping companies increase their outreach efficiency. Would you be interested in learning more?`,
        },
        {
          speaker: 'user' as const,
          text:
            call.sentiment === 'positive'
              ? 'Yes, that sounds very interesting. Tell me more.'
              : "I might be interested, but I'm quite busy right now.",
        },
        {
          speaker: 'ai' as const,
          text:
            call.sentiment === 'positive'
              ? 'Great! Our AI platform can handle hundreds of calls simultaneously and provides detailed analytics. Would you like to schedule a demo?'
              : "I understand you're busy. Would it be better if I called back at a more convenient time?",
        },
      ],
      recording: call.recording,
      analysis: {
        sentiment: call.sentiment === 'positive' ? 0.8 : call.sentiment === 'negative' ? 0.2 : 0.5,
        keywords: ['AI', 'solution', 'efficiency', call.campaign?.name || 'outreach'],
        summary: `Call with ${leadName} by ${call.agent.name}. ${call.outcome === 'connected' ? 'Successfully connected and discussed AI solutions.' : call.outcome === 'voicemail' ? 'Left voicemail message.' : 'Call attempt made.'}`,
      },
      cost: +(Math.random() * 2 + 0.25).toFixed(2),
    };
  };

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'inbound':
        return <PhoneIncoming className="h-4 w-4" />;
      case 'outbound':
        return <PhoneOutgoing className="h-4 w-4" />;
      case 'missed':
        return <PhoneMissed className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'connected':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'voicemail':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'no_answer':
      case 'busy':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-emerald-400" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-400" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredCalls =
    activeTab === 'all'
      ? mockCallHistory
      : mockCallHistory.filter((call) => {
          if (activeTab === 'connected') return call.outcome === 'connected';
          if (activeTab === 'voicemail') return call.outcome === 'voicemail';
          if (activeTab === 'missed') return call.type === 'missed';
          return true;
        });

  const stats = {
    totalCalls: mockCallHistory.length,
    connected: mockCallHistory.filter((c) => c.outcome === 'connected').length,
    avgDuration: Math.round(
      mockCallHistory.filter((c) => c.duration > 0).reduce((sum, c) => sum + c.duration, 0) /
        mockCallHistory.filter((c) => c.duration > 0).length || 0
    ),
    lastCall: mockCallHistory[0]?.startTime ? formatDate(mockCallHistory[0].startTime) : 'Never',
  };

  return (
    <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <PhoneCall className="h-5 w-5 text-emerald-500" />
            Call History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-gray-700">
              {stats.totalCalls} calls
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="border-gray-700 hover:border-emerald-600"
            >
              <Phone className="mr-1 h-4 w-4" />
              Call Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats.totalCalls}</p>
            <p className="text-xs text-gray-400">Total Calls</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.connected}</p>
            <p className="text-xs text-gray-400">Connected</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{formatDuration(stats.avgDuration)}</p>
            <p className="text-xs text-gray-400">Avg Duration</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">{stats.lastCall}</p>
            <p className="text-xs text-gray-400">Last Call</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 border-gray-700 bg-gray-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="connected">Connected</TabsTrigger>
            <TabsTrigger value="voicemail">Voicemail</TabsTrigger>
            <TabsTrigger value="missed">Missed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-2">
            {filteredCalls.map((call) => (
              <Collapsible
                key={call.id}
                open={expandedCall === call.id}
                onOpenChange={(open) => setExpandedCall(open ? call.id : null)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3 transition-all hover:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400">{getCallIcon(call.type)}</div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{call.agent.name}</p>
                          <Badge className={getOutcomeColor(call.outcome)}>
                            {call.outcome.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatDate(call.startTime)}
                          {call.campaign && ` • ${call.campaign.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getSentimentIcon(call.sentiment)}
                        <span className="text-sm text-gray-400">
                          {formatDuration(call.duration)}
                        </span>
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          expandedCall === call.id ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-3 rounded-lg bg-gray-800/30 p-4">
                    {/* Call Metrics */}
                    {call.metrics && (
                      <div className="grid grid-cols-4 gap-2">
                        <div className="rounded bg-gray-900/50 p-2 text-center">
                          <p className="text-xs text-gray-400">Talk Time</p>
                          <p className="text-sm font-medium text-white">
                            {formatDuration(call.metrics.talkTime)}
                          </p>
                        </div>
                        <div className="rounded bg-gray-900/50 p-2 text-center">
                          <p className="text-xs text-gray-400">Hold Time</p>
                          <p className="text-sm font-medium text-white">
                            {formatDuration(call.metrics.holdTime)}
                          </p>
                        </div>
                        <div className="rounded bg-gray-900/50 p-2 text-center">
                          <p className="text-xs text-gray-400">Objections</p>
                          <p className="text-sm font-medium text-white">
                            {call.metrics.objections}
                          </p>
                        </div>
                        <div className="rounded bg-gray-900/50 p-2 text-center">
                          <p className="text-xs text-gray-400">Signals</p>
                          <p className="text-sm font-medium text-emerald-400">
                            +{call.metrics.positiveSignals}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {call.notes && (
                      <div>
                        <p className="mb-1 text-xs text-gray-400">Notes</p>
                        <p className="text-sm text-gray-300">{call.notes}</p>
                      </div>
                    )}

                    {/* Next Action */}
                    {call.nextAction && (
                      <div>
                        <p className="mb-1 text-xs text-gray-400">Next Action</p>
                        <Badge variant="outline" className="border-emerald-600/20 text-emerald-400">
                          {call.nextAction.type.charAt(0).toUpperCase() +
                            call.nextAction.type.slice(1)}
                          {call.nextAction.scheduledFor &&
                            ` - ${formatCustomDate(call.nextAction.scheduledFor)}`}
                        </Badge>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      {call.recording && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-700 hover:border-emerald-600"
                        >
                          <Play className="mr-1 h-3 w-3" />
                          Recording
                        </Button>
                      )}
                      {call.transcript && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-700 hover:border-emerald-600"
                          onClick={() => handleViewCallDetails(call)}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          Transcript
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-700 hover:border-emerald-600"
                      >
                        <MessageSquare className="mr-1 h-3 w-3" />
                        Add Note
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Call Details Modal */}
      <CallLogDetailsModal
        isOpen={showCallDetails}
        onClose={() => setShowCallDetails(false)}
        callData={selectedCall ? getMockCallData(selectedCall) : undefined}
      />
    </Card>
  );
}
