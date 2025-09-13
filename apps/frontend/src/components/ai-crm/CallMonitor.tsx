import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneCall, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Pause, 
  Play, 
  Square,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';

interface CallMonitorProps {
  campaignId: string;
  websocketUrl: string;
  token: string;
}

interface ActiveCall {
  id: string;
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadCompany?: string;
  status: 'ringing' | 'connected' | 'completed' | 'failed';
  startTime: Date;
  duration: number;
  cost: number;
  transcript?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  qualificationScore?: number;
  aiInsights?: string;
}

interface CallStats {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  totalCost: number;
  averageDuration: number;
  connectionRate: number;
  qualificationRate: number;
}

interface TranscriptSegment {
  speaker: 'agent' | 'customer' | 'system';
  text: string;
  timestamp: Date;
  confidence?: number;
}

export const CallMonitor: React.FC<CallMonitorProps> = ({ 
  campaignId, 
  websocketUrl, 
  token 
}) => {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [callStats, setCallStats] = useState<CallStats>({
    totalCalls: 0,
    activeCalls: 0,
    completedCalls: 0,
    totalCost: 0,
    averageDuration: 0,
    connectionRate: 0,
    qualificationRate: 0
  });
  const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const wsRef = useRef<WebSocket | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    connectWebSocket();
    startDurationTimer();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${websocketUrl}?token=${token}&campaignId=${campaignId}`);
      
      ws.onopen = () => {
        console.log('Connected to AI CRM WebSocket');
        setConnected(true);
        
        // Subscribe to campaign updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          data: {
            type: 'campaign',
            resourceId: campaignId
          }
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      ws.onclose = () => {
        console.log('Disconnected from AI CRM WebSocket');
        setConnected(false);
        
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnected(false);
    }
  };

  const handleWebSocketMessage = (message: any) => {
    setLastUpdate(new Date());
    
    switch (message.type) {
      case 'call_update':
        handleCallUpdate(message.data);
        break;
      case 'call_detail_update':
        handleCallDetailUpdate(message.data);
        break;
      case 'call_transcript':
        handleTranscriptUpdate(message.data);
        break;
      case 'campaign_metrics_update':
        handleStatsUpdate(message.data.metrics);
        break;
      case 'call_sentiment_update':
        handleSentimentUpdate(message.data);
        break;
      case 'lead_qualified':
        handleLeadQualified(message.data);
        break;
    }
  };

  const handleCallUpdate = (data: any) => {
    const callUpdate: ActiveCall = {
      id: data.callId,
      leadId: data.leadId,
      leadName: data.leadName || 'Unknown',
      leadPhone: data.leadPhone || '',
      leadCompany: data.leadCompany,
      status: data.status,
      startTime: new Date(data.timestamp),
      duration: data.duration || 0,
      cost: data.cost || 0,
      qualificationScore: data.qualification_score
    };

    setActiveCalls(prev => {
      const existingIndex = prev.findIndex(call => call.id === callUpdate.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...callUpdate };
        return updated;
      } else {
        return [...prev, callUpdate];
      }
    });
  };

  const handleCallDetailUpdate = (data: any) => {
    if (selectedCall && selectedCall.id === data.callId) {
      setSelectedCall(prev => ({
        ...prev!,
        ...data,
        transcript: data.transcript,
        aiInsights: data.ai_insights
      }));
    }
  };

  const handleTranscriptUpdate = (data: any) => {
    if (selectedCall && selectedCall.id === data.callId) {
      const segment: TranscriptSegment = {
        speaker: data.speaker,
        text: data.text,
        timestamp: new Date(),
        confidence: data.confidence
      };
      setTranscript(prev => [...prev, segment]);
    }
  };

  const handleStatsUpdate = (metrics: any) => {
    setCallStats({
      totalCalls: metrics.total_calls || 0,
      activeCalls: metrics.active_calls || 0,
      completedCalls: metrics.completed_calls || 0,
      totalCost: metrics.total_cost || 0,
      averageDuration: metrics.average_duration || 0,
      connectionRate: metrics.connection_rate || 0,
      qualificationRate: metrics.qualification_rate || 0
    });
  };

  const handleSentimentUpdate = (data: any) => {
    if (selectedCall && selectedCall.id === data.callId) {
      setSelectedCall(prev => ({
        ...prev!,
        sentiment: data.sentiment
      }));
    }
  };

  const handleLeadQualified = (data: any) => {
    // Show notification or update UI for qualified lead
    console.log('Lead qualified:', data);
  };

  const startDurationTimer = () => {
    intervalRef.current = setInterval(() => {
      setActiveCalls(prev => 
        prev.map(call => ({
          ...call,
          duration: call.status === 'connected' 
            ? Math.floor((Date.now() - call.startTime.getTime()) / 1000)
            : call.duration
        }))
      );
    }, 1000);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'ringing': return 'bg-yellow-500';
      case 'connected': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ringing': return <Phone className="w-4 h-4" />;
      case 'connected': return <PhoneCall className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Phone className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (sentiment?: string): string => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-xs text-gray-500">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold">{callStats.totalCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{callStats.activeCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{callStats.completedCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(callStats.totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold">{formatDuration(callStats.averageDuration)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Connection Rate</p>
                <p className="text-2xl font-bold">{callStats.connectionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Qualification Rate</p>
                <p className="text-2xl font-bold">{callStats.qualificationRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Calls List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Active Calls ({activeCalls.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {activeCalls.map((call) => (
                  <div
                    key={call.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCall?.id === call.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCall(call)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(call.status)}
                        <Badge 
                          variant="secondary" 
                          className={`text-white ${getStatusColor(call.status)}`}
                        >
                          {call.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDuration(call.duration)}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-medium">{call.leadName}</p>
                      <p className="text-sm text-gray-600">{call.leadPhone}</p>
                      {call.leadCompany && (
                        <p className="text-sm text-gray-500">{call.leadCompany}</p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          Cost: {formatCurrency(call.cost)}
                        </span>
                        {call.qualificationScore && (
                          <span className="text-green-600 font-medium">
                            Score: {call.qualificationScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {activeCalls.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No active calls</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Call Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Call Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCall ? (
              <Tabs defaultValue="transcript" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="transcript">Transcript</TabsTrigger>
                  <TabsTrigger value="insights">AI Insights</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="transcript" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Live Transcript</h3>
                    {selectedCall.sentiment && (
                      <Badge className={getSentimentColor(selectedCall.sentiment)}>
                        {selectedCall.sentiment.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  
                  <ScrollArea className="h-80 border rounded-lg p-4" ref={transcriptRef}>
                    <div className="space-y-3">
                      {transcript.map((segment, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            segment.speaker === 'agent' 
                              ? 'bg-blue-50 ml-4' 
                              : segment.speaker === 'customer'
                              ? 'bg-gray-50 mr-4'
                              : 'bg-yellow-50 mx-8'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">
                              {segment.speaker.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400">
                              {segment.timestamp.toLocaleTimeString()}
                            </span>
                            {segment.confidence && (
                              <span className="text-xs text-gray-400">
                                {Math.round(segment.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <p className="text-sm">{segment.text}</p>
                        </div>
                      ))}
                      
                      {transcript.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No transcript available</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="insights" className="space-y-4">
                  <div className="space-y-4">
                    {selectedCall.qualificationScore && (
                      <div>
                        <h4 className="font-medium mb-2">Qualification Score</h4>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedCall.qualificationScore} className="flex-1" />
                          <span className="text-sm font-medium">
                            {selectedCall.qualificationScore}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {selectedCall.aiInsights && (
                      <div>
                        <h4 className="font-medium mb-2">AI Insights</h4>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm">{selectedCall.aiInsights}</p>
                        </div>
                      </div>
                    )}
                    
                    {!selectedCall.aiInsights && !selectedCall.qualificationScore && (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No AI insights available yet</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Lead Name</p>
                      <p className="font-medium">{selectedCall.leadName}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium">{selectedCall.leadPhone}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="font-medium">{selectedCall.leadCompany || 'N/A'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={`${getStatusColor(selectedCall.status)} text-white`}>
                        {selectedCall.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="font-medium">{formatDuration(selectedCall.duration)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Cost</p>
                      <p className="font-medium">{formatCurrency(selectedCall.cost)}</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <PhoneCall className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a call to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};