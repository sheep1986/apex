import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { callsService, type CallDetails } from '@/services/calls.service';
import { useToast } from '@/hooks/use-toast';
import { crmService, type Lead } from '@/services/crm-service';

export default function CallDetailsPage() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [call, setCall] = useState<CallDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [createdLead, setCreatedLead] = useState<Lead | null>(null);
  const [leadCreationLoading, setLeadCreationLoading] = useState(false);

  useEffect(() => {
    if (callId) {
      loadCallDetails();
    }
  }, [callId]);

  const loadCallDetails = async () => {
    try {
      setLoading(true);

      // Mock call details data
      const mockCallDetails = {
        id: callId,
        customerName: 'John Smith',
        customerPhone: '+1 (555) 123-4567',
        customerEmail: 'john.smith@company.com',
        customerCompany: 'TechCorp Solutions',
        campaignName: 'TEst Campaign',
        startedAt: '2025-07-11T14:30:15Z',
        endedAt: '2025-07-11T14:33:20Z',
        duration: 185,
        cost: 0.47,
        outcome: 'Interested - Scheduled Follow-up',
        status: 'completed',
        direction: 'outbound',
        vapiCallId: 'vapi_call_123456789abcdef',
        recording: 'https://storage.vapi.ai/recording-001.wav',
        transcript: `
Agent: Hello, this is Sarah from TechSolutions. May I speak with John Smith?

John: Yes, this is John speaking.

Agent: Hi John! I hope I'm not catching you at a bad time. I'm calling because we've developed an innovative AI calling solution that's been helping companies like yours increase their outreach efficiency by up to 300%. Would you be interested in learning more about how this could benefit your business?

John: Actually, that does sound interesting. We've been struggling with our current calling process. Can you tell me more about what exactly this AI solution does?

Agent: Absolutely! Our AI calling platform can handle hundreds of calls simultaneously, qualify leads automatically, and even schedule follow-up meetings. It integrates with your existing CRM and provides detailed analytics on call outcomes and lead quality. 

John: That sounds really promising. We're definitely looking for ways to scale our outreach. What would be the next step to learn more?

Agent: I'd love to schedule a quick 15-minute demo where I can show you the platform in action and discuss how it would specifically help your business. Do you have availability next Tuesday around 2 PM?

John: Yes, Tuesday at 2 PM works perfectly for me.

Agent: Excellent! I'll send you a calendar invite with the meeting details. Is john.smith@company.com still the best email to reach you?

John: Yes, that's correct.

Agent: Perfect! Thank you so much for your time today, John. I'm excited to show you what our AI solution can do for your business. Have a great rest of your day!

John: Thank you, looking forward to it!
        `,
        summary:
          'Contact expressed strong interest in AI calling features. Scheduled demo for next Tuesday at 2 PM.',
        sentimentScore: 0.85,
        leadQuality: 'hot',
        campaign: {
          id: 'mock-1',
          name: 'TEst Campaign',
        },
        contact: {
          email: 'john.smith@company.com',
          company: 'TechCorp Solutions',
          title: 'Sales Director',
        },
        callAnalytics: {
          talkTime: 145, // seconds agent talked
          listenTime: 40, // seconds prospect talked
          silenceTime: 15, // silence/dead air
          interruptionCount: 2,
          questionsAsked: 3,
          objections: ['Concerns about integration'],
          positiveSignals: [
            'Expressed clear interest',
            'Scheduled follow-up',
            'Asked technical questions',
          ],
          nextActions: ['Send demo invite', 'Prepare integration overview', 'Follow up post-demo'],
        },
      };

      setCall(mockCallDetails);

      // Check if this is a positive outcome and auto-create lead
      if (
        callsService.isPositiveOutcome(mockCallDetails.summary || '', mockCallDetails.transcript)
      ) {
        await checkAndCreateLead(mockCallDetails);
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

      // Check if lead already exists for this call
      const existingLeads = await crmService.searchLeads(callData.customerPhone);
      const existingLead = existingLeads.find(
        (lead) =>
          lead.customFields?.originalCallId === callData.id ||
          lead.customFields?.vapiCallId === callData.vapiCallId
      );

      if (existingLead) {
        setCreatedLead(existingLead);
        console.log('Lead already exists for this call:', existingLead);
        return;
      }

      // Create new lead
      const newLead = await callsService.createLeadFromCall(callData);
      if (newLead) {
        setCreatedLead(newLead);
        toast({
          title: 'Lead Created',
          description: `New lead "${newLead.firstName} ${newLead.lastName}" added to CRM`,
        });
      }
    } catch (error) {
      console.error('Error checking/creating lead:', error);
      // Don't show error toast as this is an automatic background process
    } finally {
      setLeadCreationLoading(false);
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
                    {call.vapiCallId.substring(0, 8)}...
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyToClipboard(call.vapiCallId, 'VAPI Call ID')}
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
                  <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300">
                      {call.transcript}
                    </pre>
                    <div className="mt-4 flex space-x-2">
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
                  <div className="space-y-4">
                    <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Volume2 className="h-5 w-5 text-emerald-400" />
                          <span className="font-medium text-white">Audio Recording</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(call.recording!, '_blank')}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                      <audio
                        controls
                        className="w-full"
                        onPlay={() => setIsPlayingRecording(true)}
                        onPause={() => setIsPlayingRecording(false)}
                        onEnded={() => setIsPlayingRecording(false)}
                      >
                        <source src={call.recording} type="audio/mpeg" />
                        <source src={call.recording} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
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
