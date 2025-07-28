import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Phone,
  Clock,
  User,
  Bot,
  TrendingUp,
  TrendingDown,
  Copy,
  Download,
  X,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../hooks/auth';

interface TranscriptEntry {
  speaker: 'ai' | 'user';
  text: string;
  timestamp?: string;
}

interface CallData {
  id: string;
  phone_number: string;
  contact_name?: string;
  vapi_call_id?: string;
  call_started_at: string;
  call_ended_at?: string;
  duration_seconds: number;
  outcome: string;
  ai_summary?: string;
  ai_sentiment_score?: number;
  campaign_name?: string;
}

interface CallTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string | null;
}

export const CallTranscriptModal: React.FC<CallTranscriptModalProps> = ({
  isOpen,
  onClose,
  callId
}) => {
  const { getToken } = useAuth();
  const [callData, setCallData] = useState<CallData | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && callId) {
      fetchTranscript();
    }
  }, [isOpen, callId]);

  const fetchTranscript = async () => {
    if (!callId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const response = await fetch(`/api/call-attempts/call/${callId}/transcript`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transcript');
      }

      const data = await response.json();
      setCallData(data.call);
      setTranscript(data.transcript || []);
      
    } catch (err) {
      console.error('Error fetching transcript:', err);
      setError('Failed to load transcript');
    } finally {
      setLoading(false);
    }
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

  const getSentimentColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score > 0.3) return 'text-green-500';
    if (score < -0.3) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getSentimentIcon = (score?: number) => {
    if (!score) return null;
    if (score > 0.3) return <TrendingUp className="h-4 w-4" />;
    if (score < -0.3) return <TrendingDown className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  const getOutcomeBadgeColor = (outcome: string) => {
    const colorMap: { [key: string]: string } = {
      answered: 'bg-green-500',
      qualified: 'bg-emerald-500',
      voicemail: 'bg-yellow-500',
      no_answer: 'bg-gray-500',
      not_interested: 'bg-red-500',
      busy: 'bg-orange-500',
      failed: 'bg-red-600'
    };
    return colorMap[outcome] || 'bg-gray-400';
  };

  const copyTranscript = () => {
    const transcriptText = transcript
      .map(entry => `${entry.speaker.toUpperCase()}: ${entry.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(transcriptText);
  };

  const exportTranscript = () => {
    const transcriptText = [
      `Call Transcript - ${callData?.contact_name || callData?.phone_number}`,
      `Campaign: ${callData?.campaign_name}`,
      `Date: ${callData?.call_started_at ? formatDate(callData.call_started_at) : 'N/A'}`,
      `Duration: ${callData?.duration_seconds ? formatDuration(callData.duration_seconds) : 'N/A'}`,
      `Outcome: ${callData?.outcome}`,
      '',
      '--- TRANSCRIPT ---',
      '',
      ...transcript.map(entry => `${entry.speaker.toUpperCase()}: ${entry.text}`),
      '',
      '--- AI SUMMARY ---',
      callData?.ai_summary || 'No summary available'
    ].join('\n');
    
    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${callId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-gray-700 text-white overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">
              Call Transcript
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyTranscript}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportTranscript}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading transcript...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">{error}</div>
          </div>
        ) : callData ? (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Call Details Header */}
            <Card className="bg-gray-800 border-gray-700 mb-4 flex-shrink-0">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="text-sm text-gray-400">Contact</div>
                      <div className="font-medium text-white">
                        {callData.contact_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {callData.phone_number}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="text-sm text-gray-400">Duration & Outcome</div>
                      <div className="font-medium text-white">
                        {formatDuration(callData.duration_seconds)}
                      </div>
                      <Badge className={`mt-1 ${getOutcomeBadgeColor(callData.outcome)} text-white text-xs`}>
                        {callData.outcome.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="text-sm text-gray-400">AI Sentiment</div>
                      <div className={`font-medium flex items-center gap-2 ${getSentimentColor(callData.ai_sentiment_score)}`}>
                        {getSentimentIcon(callData.ai_sentiment_score)}
                        {callData.ai_sentiment_score ? callData.ai_sentiment_score.toFixed(2) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {callData.call_started_at ? formatDate(callData.call_started_at) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {callData.ai_summary && (
                  <div className="mt-4 p-3 bg-gray-750 rounded-lg border border-gray-600">
                    <div className="text-sm text-gray-400 mb-2">AI Summary</div>
                    <div className="text-white text-sm">{callData.ai_summary}</div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Transcript */}
            <Card className="bg-gray-800 border-gray-700 flex-1 overflow-hidden">
              <CardContent className="p-0 h-full">
                <div className="p-4 border-b border-gray-700 bg-gray-750">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium text-white">Conversation Transcript</h3>
                    <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">
                      {transcript.length} messages
                    </Badge>
                  </div>
                </div>
                
                <div className="overflow-y-auto" style={{ height: 'calc(100% - 60px)' }}>
                  {transcript.length > 0 ? (
                    <div className="p-4 space-y-4">
                      {transcript.map((entry, index) => (
                        <div key={index} className={`flex gap-3 ${entry.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`flex gap-3 max-w-[80%] ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              entry.speaker === 'ai' 
                                ? 'bg-blue-500' 
                                : 'bg-green-500'
                            }`}>
                              {entry.speaker === 'ai' ? (
                                <Bot className="h-4 w-4 text-white" />
                              ) : (
                                <User className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div className={`p-3 rounded-lg ${
                              entry.speaker === 'ai' 
                                ? 'bg-gray-700 border border-gray-600' 
                                : 'bg-blue-600'
                            }`}>
                              <div className="text-sm text-white whitespace-pre-wrap">
                                {entry.text}
                              </div>
                              {entry.timestamp && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {formatDate(entry.timestamp)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-gray-400">No transcript available for this call</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default CallTranscriptModal;