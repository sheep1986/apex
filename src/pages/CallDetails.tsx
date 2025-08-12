import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Phone,
  User,
  Clock,
  DollarSign,
  FileText,
  Headphones,
  Calendar,
  Building,
  Mail,
  Copy,
  Play,
  Pause,
  Volume2,
  Download,
  Check,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { callsService, type CallDetails } from '@/services/calls.service';
import { useToast } from '@/hooks/use-toast';
import { crmService, type Lead } from '@/services/crm-service';
import { apiClient } from '@/lib/api-client';

export default function CallDetailsPage() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [call, setCall] = useState<CallDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [createdLead, setCreatedLead] = useState<Lead | null>(null);
  const [leadCreationLoading, setLeadCreationLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (callId) {
      loadCallDetails();
    }
  }, [callId]);

  useEffect(() => {
    if (audioRef.current) {
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(Math.floor(audioRef.current.currentTime));
        }
      };
      
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (audioRef.current) {
      try {
        if (isPlayingRecording) {
          audioRef.current.pause();
          setIsPlayingRecording(false);
        } else {
          await audioRef.current.play();
          setIsPlayingRecording(true);
        }
      } catch (error) {
        console.error('Playback error:', error);
        // If VAPI URL fails, try opening in new tab
        if (call?.recording && call.recording.includes('vapi.ai')) {
          window.open(call.recording, '_blank');
        }
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const loadCallDetails = async () => {
    try {
      setLoading(true);

      // Fetch real call details from API
      const response = await callsService.getCallDetails(callId!);
      
      if (!response) {
        // If no data from API, show error instead of mock data
        toast({
          title: 'Error',
          description: 'Call details not found',
          variant: 'destructive',
        });
        navigate(-1);
        return;
      }
      
      setCall(response);

      // Check if this is a positive outcome and auto-create lead
      const callData = response;
      if (
        callsService.isPositiveOutcome(callData.summary || '', callData.transcript)
      ) {
        await checkAndCreateLead(callData);
      }
    } catch (error) {
      console.error('Failed to load call details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load call details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAndCreateLead = async (callData: CallDetails) => {
    try {
      setLeadCreationLoading(true);
      
      console.log('🔍 Checking/creating lead for call:', {
        callId: callData.id,
        customerPhone: callData.customerPhone,
        customerName: callData.customerName,
        summary: callData.summary
      });

      // Check if lead already exists for this call
      const existingLeads = await crmService.searchLeads(callData.customerPhone);
      console.log('🔍 Found existing leads:', existingLeads.length);
      
      const existingLead = existingLeads.find(
        (lead) =>
          lead.customFields?.originalCallId === callData.id ||
          lead.customFields?.vapiCallId === callData.vapiCallId
      );

      if (existingLead) {
        setCreatedLead(existingLead);
        console.log('✅ Lead already exists for this call:', existingLead);
        return;
      }

      console.log('📝 Creating new lead from call...');
      // Create new lead
      const newLead = await callsService.createLeadFromCall(callData);
      if (newLead) {
        setCreatedLead(newLead);
        console.log('✅ Lead created successfully:', newLead);
        toast({
          title: 'Lead Created',
          description: `New lead "${newLead.firstName} ${newLead.lastName}" added to CRM`,
        });
      } else {
        console.log('⚠️ Lead creation returned null');
      }
    } catch (error) {
      console.error('❌ Error checking/creating lead:', error);
      // Don't show error toast as this is an automatic background process
    } finally {
      setLeadCreationLoading(false);
    }
  };

  const handleSyncCall = async () => {
    if (!call?.vapiCallId) return;

    try {
      setLoading(true);
      const response = await apiClient.post(`/sync-vapi-call/${call.vapiCallId}`);
      
      if (response.data.success) {
        toast({
          title: 'Call Synced',
          description: 'Call data has been updated from VAPI',
        });
        
        // Reload the call data
        await loadCallDetails();
        
        // If AI processing was triggered, show that too
        if (response.data.aiProcessing) {
          toast({
            title: 'AI Processing Started',
            description: 'Call is being analyzed by AI',
          });
        }
      }
    } catch (error) {
      console.error('Error syncing call:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync call data from VAPI',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeadManually = async () => {
    if (!call) return;

    try {
      setLeadCreationLoading(true);
      const newLead = await callsService.createLeadFromCall(call);
      if (newLead) {
        setCreatedLead(newLead);
        toast({
          title: 'Lead Created',
          description: `Lead "${newLead.firstName} ${newLead.lastName}" added to CRM`,
        });
      }
    } catch (error) {
      console.error('Error creating lead manually:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lead in CRM',
        variant: 'destructive',
      });
    } finally {
      setLeadCreationLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500"></div>
          <p className="text-gray-400">Loading call details...</p>
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-400">Call not found</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = callsService.getStatusInfo(call.status);

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Call Details</h1>
              <p className="text-gray-400">View call transcript, recording, and results</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              className={`px-3 py-1 ${
                statusInfo.color === 'green' || statusInfo.color === 'emerald'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : statusInfo.color === 'red'
                    ? 'bg-red-500/20 text-red-400'
                    : statusInfo.color === 'yellow'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {statusInfo.icon} {statusInfo.label}
            </Badge>
            {(call.status === 'in_progress' || call.status === 'ringing' || !call.transcript) && (
              <Button
                onClick={handleSyncCall}
                size="sm"
                variant="outline"
                disabled={loading || !call.vapiCallId}
                className="border-gray-600"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Sync from VAPI
              </Button>
            )}
          </div>
        </div>

        {/* Call Overview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Customer Info */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <User className="mr-2 h-5 w-5 text-emerald-400" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="font-medium text-white">{call.customerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Phone:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-white">{call.customerPhone}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyToClipboard(call.customerPhone, 'Phone number')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {call.customerEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Email:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white">{call.customerEmail}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyToClipboard(call.customerEmail!, 'Email')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {call.customerCompany && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Company:</span>
                  <span className="text-white">{call.customerCompany}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call Details */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Phone className="mr-2 h-5 w-5 text-emerald-400" />
                Call Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Campaign:</span>
                <span className="font-medium text-white">{call.campaignName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Started:</span>
                <span className="text-white">{formatDate(call.startedAt)}</span>
              </div>
              {call.endedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Ended:</span>
                  <span className="text-white">{formatDate(call.endedAt)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="font-mono text-white">
                  {callsService.formatDuration(call.duration)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Direction:</span>
                <span className="capitalize text-white">{call.direction}</span>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <DollarSign className="mr-2 h-5 w-5 text-emerald-400" />
                Call Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Cost:</span>
                <span className="font-bold text-emerald-400">
                  {callsService.formatCost(call.cost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">VAPI Call ID:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-white">
                    {call.vapiCallId ? `${call.vapiCallId.substring(0, 8)}...` : 'N/A'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => call.vapiCallId && handleCopyToClipboard(call.vapiCallId, 'VAPI Call ID')}
                    disabled={!call.vapiCallId}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Has Transcript:</span>
                <span className={call.transcript ? 'text-emerald-400' : 'text-gray-500'}>
                  {call.transcript ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Has Recording:</span>
                <span className={call.recording ? 'text-emerald-400' : 'text-gray-500'}>
                  {call.recording ? 'Yes' : 'No'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CRM Lead Status */}
        {call && (
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Building className="mr-2 h-5 w-5 text-emerald-400" />
                CRM Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {callsService.isPositiveOutcome(call.summary || '', call.transcript) && (
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-emerald-400" />
                    <span className="font-medium text-emerald-400">Positive Outcome Detected</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400">Lead Eligible</Badge>
                </div>
              )}

              {createdLead ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                    <div>
                      <p className="font-medium text-blue-400">Lead Created in CRM</p>
                      <p className="text-sm text-gray-300">
                        {createdLead.firstName} {createdLead.lastName} - {createdLead.company}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/crm/leads/${createdLead.id}`, '_blank')}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      View in CRM
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <p className="font-medium capitalize text-white">{createdLead.status}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Priority:</span>
                      <p className="font-medium capitalize text-white">{createdLead.priority}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Score:</span>
                      <p className="font-medium text-white">{createdLead.score || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : callsService.isPositiveOutcome(call.summary || '', call.transcript) ? (
                <div className="py-4 text-center">
                  <Button
                    onClick={handleCreateLeadManually}
                    disabled={leadCreationLoading}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {leadCreationLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        Creating Lead...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Lead in CRM
                      </>
                    )}
                  </Button>
                  <p className="mt-2 text-xs text-gray-400">
                    Automatically creates a new lead with call details
                  </p>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-gray-400">
                    <X className="h-4 w-4" />
                    <span>No positive outcome detected</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Lead creation is triggered for positive call outcomes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="transcript" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
            <TabsTrigger value="transcript" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Transcript</span>
            </TabsTrigger>
            <TabsTrigger value="recording" className="flex items-center space-x-2">
              <Headphones className="h-4 w-4" />
              <span>Recording</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Summary</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="mt-6">
            <Card className="border-gray-700 bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Call Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                {call.transcript ? (
                  <div className="space-y-4">
                    <div className="relative rounded-lg border border-gray-700 bg-gray-900/50">
                      <div className="max-h-[500px] overflow-y-auto p-6">
                        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300">
                          {call.transcript}
                        </pre>
                        <div className="pb-4" /> {/* Extra padding at bottom for better scrolling */}
                      </div>
                      {/* Fade gradient at bottom when scrollable */}
                      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900/80 to-transparent" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        {call.transcript.split('\n').length} lines • {call.transcript.split(' ').length} words
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyToClipboard(call.transcript!, 'Transcript')}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Transcript
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-gray-500" />
                    <p className="text-gray-400">No transcript available for this call</p>
                    <p className="mt-2 text-sm text-gray-500">
                      Transcripts are generated automatically for completed calls
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recording" className="mt-6">
            <Card className="border-gray-700 bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Call Recording</CardTitle>
              </CardHeader>
              <CardContent>
                {call.recording ? (
                  <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-b from-gray-900/50 to-gray-800/30">
                    <div className="p-6">
                      {/* Clean Header */}
                      <div className="mb-6 flex items-center justify-between">
                        <h4 className="text-lg font-medium text-white">Recording</h4>
                        <div className="rounded-lg bg-gray-800/50 px-3 py-1.5">
                          <span className="font-mono text-sm text-gray-300">
                            {formatDuration(call.duration || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Main Controls */}
                      <div className="space-y-6">
                        {/* Playback Speed Control */}
                        <div className="flex items-center justify-end gap-3">
                          <select
                            value={playbackSpeed}
                            onChange={(e) => handleSpeedChange(Number(e.target.value))}
                            className="rounded-lg border border-gray-600/50 bg-gray-800/50 px-2 py-1 text-xs text-white transition-all focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50"
                          >
                            <option value={0.5}>0.5x</option>
                            <option value={1}>1.0x</option>
                            <option value={1.5}>1.5x</option>
                            <option value={2}>2.0x</option>
                          </select>
                        </div>

                        {/* Waveform and Controls Row */}
                        <div className="flex items-center gap-6">
                          {/* Clean Play Button */}
                          <button onClick={handlePlayPause} className="group relative flex-shrink-0">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg transition-all duration-200 group-hover:scale-105 group-hover:shadow-green-500/30">
                              {isPlayingRecording ? (
                                <Pause className="h-5 w-5 text-white" strokeWidth={2} />
                              ) : (
                                <Play className="ml-0.5 h-5 w-5 text-white" strokeWidth={2} />
                              )}
                            </div>
                          </button>

                          {/* Clean Waveform Visualization */}
                          <div className="relative flex-1 overflow-hidden rounded-xl bg-gray-900/50 p-4">
                            <div className="relative flex h-14 items-end justify-between gap-0.5">
                              {Array.from({ length: 100 }).map((_, i) => {
                                const height = 20 + Math.random() * 80;
                                const isActive = (i / 100) * (call.duration || 0) <= currentTime;

                                return (
                                  <div
                                    key={i}
                                    className="flex-1 rounded-t bg-gray-600 transition-all duration-150"
                                    style={{
                                      height: `${height}%`,
                                      backgroundColor: isActive ? '#10b981' : '#4b5563',
                                      opacity: isActive ? 1 : 0.5,
                                    }}
                                  />
                                );
                              })}
                            </div>

                            {/* Progress Overlay */}
                            <div
                              className="absolute left-0 top-0 h-full w-1 bg-green-400 opacity-50"
                              style={{ left: `${(currentTime / (call.duration || 1)) * 100}%` }}
                            />
                          </div>

                          {/* Download Button */}
                          <button 
                            onClick={() => {
                              if (call.recording) {
                                // For VAPI URLs, open in new tab
                                if (call.recording.includes('vapi.ai')) {
                                  window.open(call.recording, '_blank');
                                } else {
                                  // For other URLs, try to download
                                  const a = document.createElement('a');
                                  a.href = call.recording;
                                  a.download = `call-recording-${call.id}.wav`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }
                              }
                            }}
                            className="group flex flex-shrink-0 items-center gap-2.5 rounded-xl border border-gray-600/50 bg-gray-800/50 px-5 py-3 transition-all duration-200 hover:border-gray-500/50 hover:bg-gray-700/50"
                          >
                            <Download
                              className="h-4 w-4 text-gray-400 group-hover:text-gray-300"
                              strokeWidth={2}
                            />
                            <span className="text-sm font-medium text-gray-300 group-hover:text-gray-200">
                              Audio
                            </span>
                          </button>
                        </div>

                        {/* Time and Progress */}
                        <div className="space-y-3">
                          {/* Time Display */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-mono text-gray-400">
                              {formatDuration(currentTime)}
                            </span>
                            <span className="font-mono text-gray-500">
                              -{formatDuration((call.duration || 0) - currentTime)}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="relative">
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-700/50">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-100"
                                style={{ width: `${(currentTime / (call.duration || 1)) * 100}%` }}
                              />
                            </div>

                            {/* Progress Dot */}
                            <div
                              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-green-400 shadow-lg transition-all duration-100"
                              style={{
                                left: `${(currentTime / (call.duration || 1)) * 100}%`,
                                boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.2)',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hidden audio element */}
                    <audio 
                      ref={audioRef} 
                      src={call.recording}
                      onEnded={() => setIsPlayingRecording(false)}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Headphones className="mx-auto mb-4 h-12 w-12 text-gray-500" />
                    <p className="text-gray-400">No recording available for this call</p>
                    <p className="mt-2 text-sm text-gray-500">
                      Recordings are generated automatically for answered calls
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <Card className="border-gray-700 bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-white">Call Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {call.summary ? (
                  <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                    <div className="leading-relaxed text-gray-300">{call.summary}</div>
                    <div className="mt-4 flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyToClipboard(call.summary!, 'Summary')}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Summary
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-gray-500" />
                    <p className="text-gray-400">No summary available for this call</p>
                    <p className="mt-2 text-sm text-gray-500">
                      AI summaries are generated for completed calls with transcripts
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
