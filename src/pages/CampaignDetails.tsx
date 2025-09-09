import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVapiOutboundService } from '@/services/vapi-outbound.service';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/services/supabase-client';
import { directSupabaseService } from '@/services/direct-supabase.service';
import {
  ArrowLeft,
  Edit3,
  Save,
  X,
  Plus,
  Phone,
  Mic,
  Clock,
  FileText,
  Users,
  DollarSign,
  Settings,
  Play,
  Pause,
  Trash2,
  Copy,
  Download,
  Share,
  BarChart3,
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CallLogDetailsModal } from '@/components/CallLogDetailsModal';
import { useToast } from '@/hooks/use-toast';

// Mock campaign data - in real app this would come from API
const defaultCampaign = {
  id: '',
  name: '',
  description: '',
  productDescription: '',
  status: 'draft',
  progress: 0,
  leadsCalled: 0,
  answered: 0,
  calledBack: 0,
  opportunities: 0,
  tags: [],
  phoneNumbers: [],
  voiceAgent: {
    name: 'AI Assistant',
    voice: 'default',
    language: 'en-US',
    tone: 'professional',
  },
  callingSchedule: {
    timezone: 'America/New_York',
    startTime: '09:00',
    endTime: '17:00',
    daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
  },
  script: {
    introduction: '',
    mainContent: '',
    objections: '',
    closing: '',
  },
  teamMembers: [],
  budget: {
    total: 0,
    perCall: 0,
    dailyLimit: 0,
    spent: 0,
  },
  settings: {
    maxCallsPerDay: 100,
    retryAttempts: 3,
    callDuration: 300,
    voicemailEnabled: true,
  },
  createdAt: new Date().toISOString(),
  lastModified: new Date().toISOString(),
};

const voiceOptions = [
  { value: 'sarah', label: 'Sarah (Professional)', language: 'en-US' },
  { value: 'mike', label: 'Mike (Friendly)', language: 'en-US' },
  { value: 'emma', label: 'Emma (Conversational)', language: 'en-GB' },
  { value: 'david', label: 'David (Authoritative)', language: 'en-US' },
  { value: 'lisa', label: 'Lisa (Warm)', language: 'en-US' },
  { value: 'james', label: 'James (Confident)', language: 'en-GB' },
];

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'warm', label: 'Warm' },
  { value: 'confident', label: 'Confident' },
];

const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
];

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const vapiOutboundService = useVapiOutboundService(); // Use authenticated service
  const [isEditing, setIsEditing] = useState(false);
  const [campaign, setCampaign] = useState(defaultCampaign);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);

  const handleOpenCallModal = async (call: any) => {
    console.log('Opening call modal with call:', call);
    console.log('🔍 Call from list has transcript?', {
      hasTranscript: !!call.transcript,
      transcriptLength: call.transcript?.length,
      transcriptPreview: call.transcript?.substring(0, 50)
    });
    
    // If we have a call ID, fetch the full details from the API
    if (call.id) {
      try {
        const response = await apiClient.get(`/vapi-outbound/calls/${call.id}`);
        const fullCallData = response.data.call;
        console.log('Full call data from API:', fullCallData);
        console.log('🔍 DEBUG - Transcript check:', {
          hasTranscript: !!fullCallData.transcript,
          transcriptType: typeof fullCallData.transcript,
          transcriptLength: fullCallData.transcript?.length,
          transcriptPreview: fullCallData.transcript?.substring(0, 100)
        });
        
        // CRITICAL DEBUG - Show alert to see if transcript exists
        if (fullCallData.transcript) {
          console.log('✅ TRANSCRIPT EXISTS! Length:', fullCallData.transcript.length);
        } else {
          console.log('❌ NO TRANSCRIPT IN API RESPONSE!');
        }
        
        // DEBUG: Log specific fields we're interested in
        console.log('📊 DEBUG: Raw fullCallData fields:', {
          id: fullCallData.id,
          duration: fullCallData.duration,
          cost: fullCallData.cost,
          recording_url: fullCallData.recording_url,
          recordingUrl: fullCallData.recordingUrl,
          recording: fullCallData.recording,
          customerName: fullCallData.customerName,
          customer_name: fullCallData.customer_name
        });
        
        // Transform the call data to match the modal's expected format
        const transformedCallData = {
          id: fullCallData.id || fullCallData.callId,
          duration: fullCallData.duration || 0,
          recording: fullCallData.recording || fullCallData.recording_url || fullCallData.recordingUrl,
          cost: fullCallData.cost || 0,
          // Add customer information for display
          customerName: fullCallData.customerName || fullCallData.customer_name || 'Unknown',
          customerPhone: fullCallData.customerPhone || fullCallData.customer_phone || fullCallData.phone_number,
          customerEmail: fullCallData.customerEmail || fullCallData.customer_email,
          customerCompany: fullCallData.customerCompany || fullCallData.customer_company,
          // Add call metadata
          status: fullCallData.status || 'unknown',
          startedAt: fullCallData.startedAt || fullCallData.started_at,
          endedAt: fullCallData.endedAt || fullCallData.ended_at,
          campaignName: fullCallData.campaignName || fullCallData.campaign_name,
          direction: fullCallData.direction || 'outbound',
          vapiCallId: fullCallData.vapiCallId || fullCallData.vapi_call_id,
          transcript: (fullCallData.transcript || call.transcript) ? 
            // Parse transcript if it's a string with "User: " and "AI: " format
            (fullCallData.transcript || call.transcript).split('\n')
              .filter((line: string) => line.trim())
              .map((line: string, index: number) => {
                // Check for explicit speaker markers at the start of the line
                const trimmedLine = line.trim();
                const hasUserMarker = /^(User|Customer):/i.test(trimmedLine);
                const hasAIMarker = /^(AI|Agent|Assistant|Voicemail System):/i.test(trimmedLine);
                
                // Determine speaker based on markers
                let speaker: 'user' | 'ai';
                if (hasUserMarker) {
                  speaker = 'user';
                } else if (hasAIMarker) {
                  speaker = 'ai';
                } else {
                  // If no clear marker, this shouldn't happen with VAPI transcripts
                  console.warn('No speaker marker found for line:', trimmedLine);
                  speaker = 'ai'; // Default to AI
                }
                
                // Remove the speaker prefix to get just the text
                const text = trimmedLine.replace(/^(User|Customer|AI|Agent|Assistant|Voicemail System):\s*/i, '').trim();
              
              // Calculate rough timing based on text length and position
              const wordsPerSecond = 2.5; // Average speaking rate
              const words = text.split(' ').length;
              const speakingDuration = words / wordsPerSecond;
              const totalDuration = fullCallData.duration || 0;
              const segmentDuration = totalDuration > 0 ? totalDuration / ((fullCallData.transcript || call.transcript).split('\n').filter((l: string) => l.trim()).length || 1) : 0;
              const startTime = index * segmentDuration;
              const endTime = startTime + Math.min(speakingDuration, segmentDuration);
              
              return {
                speaker: speaker, // Use the speaker variable we determined above
                text: text || trimmedLine,
                timestamp: Date.now() - (fullCallData.duration || 0) * 1000 + (index * 1000),
                startTime,
                endTime
              };
            }) :
            [
              { 
                speaker: 'ai', 
                text: 'No transcript available',
                timestamp: Date.now(),
              },
            ],
          analysis: {
            sentiment: fullCallData.sentiment === 'positive' ? 0.8 : 
                      fullCallData.sentiment === 'negative' ? 0.2 : 0.5,
            keywords: fullCallData.keywords || [],
            summary: fullCallData.summary || 'No summary available',
          },
          messages: [
            {
              type: 'info',
              content: `Call ${fullCallData.status} - ${fullCallData.customerName}`,
              timestamp: Date.now(),
            },
          ],
        };
        
        // DEBUG: Log what we're passing to the modal
        console.log('📊 DEBUG: transformedCallData being passed to modal:', {
          id: transformedCallData.id,
          duration: transformedCallData.duration,
          cost: transformedCallData.cost,
          recording: transformedCallData.recording,
          customerName: transformedCallData.customerName,
          hasTranscript: !!transformedCallData.transcript,
          transcriptType: typeof transformedCallData.transcript,
          transcriptIsArray: Array.isArray(transformedCallData.transcript),
          transcriptLength: transformedCallData.transcript?.length,
          transcriptSample: Array.isArray(transformedCallData.transcript) && transformedCallData.transcript.length > 0 ? 
            JSON.stringify(transformedCallData.transcript[0]) : 'Not an array or empty',
          // Add the full transformed data to see everything
          fullData: transformedCallData
        });
        
        // Final check - what are we actually setting?
        console.log('🚨 FINAL CHECK - Setting selectedCall with:', {
          hasTranscript: !!transformedCallData.transcript,
          transcriptType: typeof transformedCallData.transcript,
          transcriptIsArray: Array.isArray(transformedCallData.transcript),
          transcriptLength: Array.isArray(transformedCallData.transcript) ? 
            transformedCallData.transcript.length : 'not an array',
          // Log the actual keys
          allKeys: Object.keys(transformedCallData)
        });
        
        setSelectedCall(transformedCallData);
        setIsCallModalOpen(true);
      } catch (error) {
        console.error('Error fetching full call details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load call details',
          variant: 'destructive',
        });
      }
    } else {
      // Fallback for calls without full data
      const transformedCallData = {
        id: call.id || 'unknown',
        duration: call.duration || 0,
        recording: call.recording_url || call.recording,
        cost: call.cost || 0,
        transcript: [
          { 
            speaker: 'ai', 
            text: 'Call data is loading...',
            timestamp: Date.now(),
          },
        ],
        analysis: {
          sentiment: 0.5,
          keywords: [],
          summary: 'Loading...',
        },
      };
      
      setSelectedCall(transformedCallData);
      setIsCallModalOpen(true);
    }
  };

  // Calls data for this campaign
  const [calls, setCalls] = useState([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(true);

  // Fetch campaign and calls when component mounts or campaign ID changes
  useEffect(() => {
    fetchCampaignDetails();
    fetchCampaignCalls();
  }, [id]);

  const fetchCampaignDetails = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      let campaignData;
      
      // Always use direct Supabase service since Railway doesn't have the endpoint
      console.log('📊 Fetching campaign details for ID:', id);
      campaignData = await directSupabaseService.getCampaignById(id);
      
      if (!campaignData) {
        console.error('❌ Campaign not found in database');
        // Create a minimal campaign object to prevent undefined errors
        campaignData = {
          id: id,
          name: 'Campaign Not Found',
          status: 'draft',
          totalLeads: 0,
          callsCompleted: 0,
          totalCost: 0,
          successRate: 0,
          settings: {
            total_leads: 0,
            calls_completed: 0,
            totalLeads: 0,
            callsCompleted: 0
          }
        };
      }
      
      console.log('📊 Campaign data from backend:', campaignData);
      
      // Add null safety - if campaignData is undefined, use empty object
      if (!campaignData) {
        console.error('❌ Campaign data is undefined!');
        campaignData = {
          id: id,
          name: 'Loading...',
          status: 'draft',
          totalLeads: 0,
          callsCompleted: 0,
          settings: {}
        };
      }
      
      console.log('📊 Metrics:', {
        totalLeads: campaignData?.totalLeads,
        callsCompleted: campaignData?.callsCompleted,
        metrics: campaignData?.metrics
      });
      
      // Log the data we're about to set
      console.log('📊 Setting campaign state with:', {
        totalLeads: campaignData.totalLeads,
        callsCompleted: campaignData.callsCompleted,
        name: campaignData.name
      });
      
      setCampaign({
        ...defaultCampaign, // Keep default structure as base
        // Override with real data
        id: campaignData.id,
        name: campaignData.name,
        status: campaignData.status,
        phoneNumbers: campaignData.phoneNumbers || [],
        phoneNumberId: campaignData.phoneNumberId,
        phoneNumberDetails: campaignData.phoneNumberDetails || [],
        voiceAgent: {
          ...defaultCampaign.voiceAgent,
          name: campaignData.assistantName || 'AI Assistant',
        },
        script: campaignData.script || defaultCampaign.script,
        team: campaignData.team || [],
        budget: campaignData.budget || defaultCampaign.budget,
        settings: campaignData.settings || defaultCampaign.settings,
        createdAt: campaignData.createdAt,
        lastModified: campaignData.updatedAt,
        // Use the direct values from DirectSupabaseService
        totalLeads: campaignData.totalLeads || 0,
        callsCompleted: campaignData.callsCompleted || 0,
        leadsContacted: campaignData.callsCompleted || 0,
        leadsCalled: campaignData.callsCompleted || 0,
        callsToday: campaignData.callsToday || 0,
        callsConnected: campaignData.callsCompleted || 0,
        answered: campaignData.callsCompleted || 0,
        avgCallDuration: campaignData.avgCallDuration || 120,
        outcomes: {
          answered: campaignData.callsCompleted || 0,
          voicemail: 0,
          noAnswer: 0,
          busy: 0,
          failed: 0,
        },
        meetings: campaignData.meetings || 0,
        opportunities: campaignData.opportunities || 0,
        callbacks: campaignData.callbacks || 0,
        calledBack: campaignData.callbacks || 0,
        progress: campaignData.totalLeads > 0 
          ? Math.round((campaignData.callsCompleted / campaignData.totalLeads) * 100) 
          : 0,
      });
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaignCalls = async () => {
    if (!id) return;
    
    try {
      setIsLoadingCalls(true);
      console.log('🔍 Fetching calls for campaign:', id);
      
      // Try API first, then fallback to Supabase
      let callsData = [];
      
      try {
        const response = await apiClient.get(`/vapi-outbound/campaigns/${id}/calls`);
        console.log('📊 Raw API response:', response);
        console.log('📊 Response data:', response.data);
        
        // Handle different response formats
        if (response.data) {
          if (Array.isArray(response.data)) {
            callsData = response.data;
          } else if (response.data.calls && Array.isArray(response.data.calls)) {
            callsData = response.data.calls;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            callsData = response.data.data;
          }
        }
      } catch (apiError) {
        console.error('❌ API call failed, falling back to Supabase:', apiError);
        
        // Import supabase from vapiOutboundService 
        const { vapiOutboundService } = await import('@/services/vapi-outbound.service');
        
        // Use the getCampaignResults method which has Supabase fallback
        callsData = await vapiOutboundService.getCampaignResults(id);
        console.log('✅ Fetched calls from Supabase fallback:', callsData);
      }
      
      console.log('📊 Extracted calls data:', callsData);
      
      const transformedCalls = callsData.map((call: any) => ({
        id: call.id, // Use actual call ID, not vapi_call_id
        phoneNumber: call.customerPhone || call.customer_phone || call.phone_number || call.lead?.phone,
        contactName: call.customerName || call.customer_name || 
                    (call.lead ? `${call.lead.firstName || ''} ${call.lead.lastName || ''}`.trim() : ''),
        callTime: call.startedAt || call.started_at || call.created_at,
        duration: call.duration || 0,
        cost: call.cost || 0,
        outcome: call.outcome || (call.status === 'completed' ? 'Completed' : 
                 call.status === 'initiated' ? 'In Progress' : 
                 call.status === 'failed' ? 'Failed' : call.status),
        status: call.status,
        recording_url: call.recording || call.recording_url,
        recording: call.recording || call.recording_url,
        transcript: call.transcript,
        summary: call.summary,
        sentimentScore: call.sentiment === 'positive' ? 0.85 : call.sentiment === 'negative' ? 0.15 : 0.5,
        leadQuality: call.sentiment === 'positive' ? 'hot' : call.sentiment === 'negative' ? 'cold' : 'warm',
      }));
      console.log('✅ Transformed calls:', transformedCalls);
      console.log('✅ Setting', transformedCalls.length, 'calls in state');
      setCalls(transformedCalls);
    } catch (error) {
      console.error('❌ Error fetching campaign calls:', error);
      // Show empty array instead of leaving loading state
      setCalls([]);
    } finally {
      console.log('🔍 Setting isLoadingCalls to false');
      setIsLoadingCalls(false);
    }
  };

  // Remove mock data - keeping as comment for reference
  /* const mockCalls = [
    {
      id: 'call-001',
      phoneNumber: '+1 (555) 123-4567',
      contactName: 'John Smith', // Extracted from transcript
      callTime: '2025-07-11T14:30:15Z',
      duration: 185, // seconds
      cost: 0.47,
      outcome: 'Interested - Scheduled Follow-up',
      status: 'completed',
      recording: 'https://storage.vapi.ai/recording-001.wav',
      transcript:
        "Hello, this is John Smith. Yes, I'm interested in learning more about your AI calling solution...",
      summary:
        'Contact expressed strong interest in AI calling features. Scheduled demo for next Tuesday at 2 PM.',
      sentimentScore: 0.85, // positive
      leadQuality: 'hot',
    },
    {
      id: 'call-002',
      phoneNumber: '+1 (555) 987-6543',
      contactName: 'Sarah Johnson',
      callTime: '2025-07-11T14:15:22Z',
      duration: 95,
      cost: 0.28,
      outcome: 'Not Interested',
      status: 'completed',
      recording: 'https://storage.vapi.ai/recording-002.wav',
      transcript:
        "Hi, this is Sarah. I appreciate the call but we're not looking for this type of service right now...",
      summary: 'Contact politely declined. Company already has established calling solution.',
      sentimentScore: 0.15, // neutral-negative
      leadQuality: 'cold',
    },
    {
      id: 'call-003',
      phoneNumber: '+1 (555) 555-0123',
      contactName: 'Michael Davis',
      callTime: '2025-07-11T13:45:08Z',
      duration: 240,
      cost: 0.62,
      outcome: 'Callback Requested',
      status: 'completed',
      recording: 'https://storage.vapi.ai/recording-003.wav',
      transcript:
        "Hello, this is Mike. I'm in a meeting right now but this sounds interesting. Can you call me back tomorrow around 10 AM?",
      summary:
        'Contact requested callback tomorrow at 10 AM. Showed initial interest but needs more time to discuss.',
      sentimentScore: 0.65, // positive
      leadQuality: 'warm',
    },
    {
      id: 'call-004',
      phoneNumber: '+1 (555) 444-7890',
      contactName: null, // No name confirmed yet
      callTime: '2025-07-11T13:30:45Z',
      duration: 12,
      cost: 0.05,
      outcome: 'No Answer',
      status: 'completed',
      recording: null,
      transcript: null,
      summary: 'Call went to voicemail. No response.',
      sentimentScore: null,
      leadQuality: 'unknown',
    },
    {
      id: 'call-005',
      phoneNumber: '+1 (555) 888-9999',
      contactName: 'Lisa Chen',
      callTime: '2025-07-11T13:10:33Z',
      duration: 156,
      cost: 0.41,
      outcome: 'Wrong Number',
      status: 'completed',
      recording: 'https://storage.vapi.ai/recording-005.wav',
      transcript: 'Hello? Who is this? I think you have the wrong number...',
      summary: 'Reached wrong contact. Number may be outdated in database.',
      sentimentScore: -0.2, // confused/negative
      leadQuality: 'invalid',
    },
  ]); */

  const updateCampaign = (field: string, value: any) => {
    setCampaign((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setCampaign((prev) => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any),
        [field]: value,
      },
    }));
  };

  const addPhoneNumber = () => {
    const newNumber = prompt('Enter phone number:');
    if (newNumber && !campaign.phoneNumbers.includes(newNumber)) {
      updateCampaign('phoneNumbers', [...campaign.phoneNumbers, newNumber]);
    }
  };

  const removePhoneNumber = (index: number) => {
    updateCampaign(
      'phoneNumbers',
      campaign.phoneNumbers.filter((_, i) => i !== index)
    );
  };

  const addTeamMember = () => {
    const name = prompt('Enter team member name:');
    const email = prompt('Enter email:');
    const role = prompt('Enter role (manager/agent/viewer):') as 'manager' | 'agent' | 'viewer';

    if (name && email && role) {
      updateCampaign('teamMembers', [
        ...campaign.teamMembers,
        { id: Date.now().toString(), name, email, role },
      ]);
    }
  };

  const removeTeamMember = (id: string) => {
    updateCampaign(
      'teamMembers',
      campaign.teamMembers.filter((member) => member.id !== id)
    );
  };

  const toggleCampaignStatus = () => {
    updateCampaign('status', campaign.status === 'active' ? 'paused' : 'active');
  };

  const saveChanges = () => {
    // Here you would typically save to backend
    console.log('Saving campaign:', campaign);
    setIsEditing(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Paused</Badge>;
      case 'draft':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Draft</Badge>;
      case 'disabled':
        return <Badge className="bg-red-500 hover:bg-red-600">Disabled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500"></div>
          <p className="text-gray-400">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-black px-4">
      <div className="mx-auto mt-8 w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              className="flex items-center text-lg font-semibold text-gray-400 transition-colors hover:text-white"
              onClick={() => navigate('/campaigns')}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Campaigns
            </button>
            <div className="h-6 w-px bg-gray-600" />
            <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
            {getStatusBadge(campaign.status)}
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={toggleCampaignStatus}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {campaign.status === 'active' ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-gray-700 bg-gray-800">
                <DropdownMenuItem className="text-white hover:bg-gray-700">
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Campaign
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-gray-700">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-gray-700">
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400 hover:bg-gray-700">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isEditing ? (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={saveChanges}
                  className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Campaign
              </Button>
            )}
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Leads Called</p>
                  <p className="text-2xl font-bold text-white">{campaign.leadsCalled || campaign.callsCompleted || calls.length || 0}</p>
                </div>
                <Phone className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Answered</p>
                  <p className="text-2xl font-bold text-white">{campaign.answered || campaign.callsConnected || calls.filter(c => c.status === 'completed' || c.outcome === 'Completed').length || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Callbacks</p>
                  <p className="text-2xl font-bold text-white">{campaign.callbacks || 0}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Opportunities</p>
                  <p className="text-2xl font-bold text-white">{campaign.meetings || 0}</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Divider */}
        <div className="mb-8 border-b border-gray-700"></div>

        {/* Progress */}
        <Card className="mb-8 border-gray-800 bg-gray-900">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Campaign Progress</h3>
              <span className="text-gray-400">
                {campaign.totalLeads > 0
                  ? Math.round(((campaign.callsCompleted || calls.length || 0) / campaign.totalLeads) * 100)
                  : calls.length > 0 ? 100 : 0}%
              </span>
            </div>
            <Progress 
              value={
                campaign.totalLeads > 0
                  ? ((campaign.callsCompleted || calls.length || 0) / campaign.totalLeads) * 100
                  : calls.length > 0 ? 100 : 0
              } 
              className="h-3" 
            />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9 bg-gray-800">
            <TabsTrigger value="overview" className="text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="calls" className="text-white">
              Calls
            </TabsTrigger>
            <TabsTrigger value="phone-numbers" className="text-white">
              Phone Numbers
            </TabsTrigger>
            <TabsTrigger value="voice-agent" className="text-white">
              Voice Agent
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-white">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="script" className="text-white">
              Script
            </TabsTrigger>
            <TabsTrigger value="team" className="text-white">
              Team
            </TabsTrigger>
            <TabsTrigger value="budget" className="text-white">
              Budget
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Campaign Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Campaign Name</Label>
                    {isEditing ? (
                      <Input
                        value={campaign.name}
                        onChange={(e) => updateCampaign('name', e.target.value)}
                        className="mt-2 border-gray-700 bg-gray-800 text-white"
                      />
                    ) : (
                      <p className="mt-2 text-gray-300">{campaign.name}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={campaign.description}
                        onChange={(e) => updateCampaign('description', e.target.value)}
                        className="mt-2 border-gray-700 bg-gray-800 text-white"
                        rows={3}
                      />
                    ) : (
                      <p className="mt-2 text-gray-300">{campaign.description}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-white">Product/Service Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={campaign.productDescription}
                        onChange={(e) => updateCampaign('productDescription', e.target.value)}
                        className="mt-2 border-gray-700 bg-gray-800 text-white"
                        rows={4}
                      />
                    ) : (
                      <p className="mt-2 text-gray-300">{campaign.productDescription}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Budget Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Budget:</span>
                    <span className="font-semibold text-white">${campaign.budget.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Spent:</span>
                    <span className="font-semibold text-white">${campaign.budget.spent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Remaining:</span>
                    <span className="font-semibold text-white">
                      ${campaign.budget.total - campaign.budget.spent}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cost per Call:</span>
                    <span className="font-semibold text-white">${campaign.budget.perCall}</span>
                  </div>
                  <Progress
                    value={(campaign.budget.spent / campaign.budget.total) * 100}
                    className="h-2"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calls" className="mt-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Phone className="h-5 w-5" />
                  Campaign Calls ({calls.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCalls ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-500"></div>
                      <p className="text-gray-400">Loading calls...</p>
                    </div>
                  </div>
                ) : calls.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Phone className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                      <p className="text-gray-400">No calls have been made for this campaign yet.</p>
                      <p className="mt-2 text-sm text-gray-500">Calls will appear here once the campaign starts making calls.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="px-4 py-3 text-left font-medium text-gray-300">Call ID</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-300">
                            Phone Number
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-300">
                            Contact Name
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-300">Time</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-300">Duration</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-300">Cost</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-300">Outcome</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-300">Recording</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calls.map((call) => (
                        <tr
                          key={call.id}
                          className="border-b border-gray-800 transition-colors hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm text-emerald-400">{call.id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-white">{call.phoneNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            {call.contactName ? (
                              <span className="text-white">{call.contactName}</span>
                            ) : (
                              <span className="italic text-gray-500">Name not confirmed</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-300">
                              {new Date(call.callTime).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-300">
                              {call.duration > 0 
                                ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`
                                : call.status === 'completed' 
                                  ? 'Unknown'
                                  : '0m 0s'
                              }
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-green-400">
                              ${(call.cost || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={
                                call.outcome === 'interested' || call.outcome.includes('Interested')
                                  ? 'border-green-500 text-green-400'
                                  : call.outcome === 'callback' || call.outcome.includes('Callback')
                                    ? 'border-yellow-500 text-yellow-400'
                                    : call.outcome === 'not_interested' || call.outcome.includes('Not Interested')
                                      ? 'border-red-500 text-red-400'
                                    : call.outcome === 'failed'
                                      ? 'border-orange-500 text-orange-400'
                                    : call.outcome === 'no_answer' || call.outcome.includes('No Answer')
                                        ? 'border-gray-500 text-gray-400'
                                        : call.outcome === 'voicemail'
                                          ? 'border-purple-500 text-purple-400'
                                        : call.outcome === 'completed' || call.outcome === 'Completed'
                                          ? 'border-emerald-500 text-emerald-400'
                                          : 'border-blue-500 text-blue-400'
                              }
                            >
                              {call.outcome === 'failed' ? 'Unsuccessful' : 
                               call.outcome === 'no_answer' ? 'No Answer' :
                               call.outcome === 'interested' ? 'Interested' :
                               call.outcome === 'not_interested' ? 'Not Interested' :
                               call.outcome === 'voicemail' ? 'Voicemail' :
                               call.outcome === 'completed' ? 'Completed' :
                               call.outcome || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {call.status === 'in_progress' || call.status === 'initiated' ? (
                              <span className="text-sm text-yellow-500">In progress...</span>
                            ) : call.status === 'failed' ? (
                              <span className="text-sm text-gray-500">Call failed</span>
                            ) : call.status === 'completed' || call.outcome === 'Completed' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('🎵 Opening call modal for:', call.id);
                                  handleOpenCallModal(call);
                                }}
                              >
                                <Play className="mr-1 h-4 w-4" />
                                Play
                              </Button>
                            ) : (
                              <span className="text-sm text-gray-500">No recording</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phone-numbers" className="mt-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Phone Numbers</CardTitle>
                <CardDescription className="text-gray-400">
                  Phone numbers used for making calls in this campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign.phoneNumbers && campaign.phoneNumbers.length > 0 ? (
                  campaign.phoneNumbers.map((number, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input value={number} readOnly className="flex-1 text-white bg-gray-800 border-gray-700" />
                      {isEditing && (
                        <Button variant="outline" size="sm" onClick={() => removePhoneNumber(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">No phone numbers configured for this campaign</p>
                    {campaign.phoneNumberId && (
                      <p className="text-sm text-gray-500">Phone Number ID: {campaign.phoneNumberId}</p>
                    )}
                  </div>
                )}

                {isEditing && (
                  <Button onClick={addPhoneNumber} variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Phone Number
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice-agent" className="mt-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Voice Agent Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white">Voice Agent Name</Label>
                  {isEditing ? (
                    <Input
                      value={campaign.voiceAgent.name}
                      onChange={(e) => updateNestedField('voiceAgent', 'name', e.target.value)}
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">{campaign.voiceAgent.name}</p>
                  )}
                </div>

                <div>
                  <Label className="text-white">Voice Selection</Label>
                  {isEditing ? (
                    <Select
                      value={campaign.voiceAgent.voice}
                      onValueChange={(value) => updateNestedField('voiceAgent', 'voice', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions.map((voice) => (
                          <SelectItem key={voice.value} value={voice.value}>
                            {voice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-2 text-gray-300">
                      {voiceOptions.find((v) => v.value === campaign.voiceAgent.voice)?.label}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-white">Tone</Label>
                  {isEditing ? (
                    <Select
                      value={campaign.voiceAgent.tone}
                      onValueChange={(value) => updateNestedField('voiceAgent', 'tone', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {toneOptions.map((tone) => (
                          <SelectItem key={tone.value} value={tone.value}>
                            {tone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-2 capitalize text-gray-300">{campaign.voiceAgent.tone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Calling Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white">Timezone</Label>
                  {isEditing ? (
                    <Select
                      value={campaign.callingSchedule.timezone}
                      onValueChange={(value) =>
                        updateNestedField('callingSchedule', 'timezone', value)
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezoneOptions.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-2 text-gray-300">
                      {
                        timezoneOptions.find((t) => t.value === campaign.callingSchedule.timezone)
                          ?.label
                      }
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Start Time</Label>
                    {isEditing ? (
                      <Input
                        type="time"
                        value={campaign.callingSchedule.startTime}
                        onChange={(e) =>
                          updateNestedField('callingSchedule', 'startTime', e.target.value)
                        }
                        className="mt-2"
                      />
                    ) : (
                      <p className="mt-2 text-gray-300">{campaign.callingSchedule.startTime}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-white">End Time</Label>
                    {isEditing ? (
                      <Input
                        type="time"
                        value={campaign.callingSchedule.endTime}
                        onChange={(e) =>
                          updateNestedField('callingSchedule', 'endTime', e.target.value)
                        }
                        className="mt-2"
                      />
                    ) : (
                      <p className="mt-2 text-gray-300">{campaign.callingSchedule.endTime}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-white">Days of Week</Label>
                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {[
                      'monday',
                      'tuesday',
                      'wednesday',
                      'thursday',
                      'friday',
                      'saturday',
                      'sunday',
                    ].map((day) => (
                      <Button
                        key={day}
                        variant={
                          campaign.callingSchedule.daysOfWeek.includes(day) ? 'default' : 'outline'
                        }
                        size="sm"
                        disabled={!isEditing}
                        onClick={() => {
                          if (isEditing) {
                            const days = campaign.callingSchedule.daysOfWeek.includes(day)
                              ? campaign.callingSchedule.daysOfWeek.filter((d) => d !== day)
                              : [...campaign.callingSchedule.daysOfWeek, day];
                            updateNestedField('callingSchedule', 'daysOfWeek', days);
                          }
                        }}
                      >
                        {day.slice(0, 3).toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Start Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={campaign.callingSchedule.startDate}
                        onChange={(e) =>
                          updateNestedField('callingSchedule', 'startDate', e.target.value)
                        }
                        className="mt-2"
                      />
                    ) : (
                      <p className="mt-2 text-gray-300">{campaign.callingSchedule.startDate}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-white">End Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={campaign.callingSchedule.endDate}
                        onChange={(e) =>
                          updateNestedField('callingSchedule', 'endDate', e.target.value)
                        }
                        className="mt-2"
                      />
                    ) : (
                      <p className="mt-2 text-gray-300">{campaign.callingSchedule.endDate}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="script" className="mt-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Calling Script</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white">Introduction</Label>
                  {isEditing ? (
                    <Textarea
                      value={campaign.script.introduction}
                      onChange={(e) => updateNestedField('script', 'introduction', e.target.value)}
                      className="mt-2 border-gray-700 bg-gray-800 text-white"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">{campaign.script.introduction}</p>
                  )}
                </div>

                <div>
                  <Label className="text-white">Main Content</Label>
                  {isEditing ? (
                    <Textarea
                      value={campaign.script.mainContent}
                      onChange={(e) => updateNestedField('script', 'mainContent', e.target.value)}
                      className="mt-2 border-gray-700 bg-gray-800 text-white"
                      rows={4}
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">{campaign.script.mainContent}</p>
                  )}
                </div>

                <div>
                  <Label className="text-white">Objection Handling</Label>
                  {isEditing ? (
                    <Textarea
                      value={campaign.script.objections}
                      onChange={(e) => updateNestedField('script', 'objections', e.target.value)}
                      className="mt-2 border-gray-700 bg-gray-800 text-white"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">{campaign.script.objections}</p>
                  )}
                </div>

                <div>
                  <Label className="text-white">Closing</Label>
                  {isEditing ? (
                    <Textarea
                      value={campaign.script.closing}
                      onChange={(e) => updateNestedField('script', 'closing', e.target.value)}
                      className="mt-2 border-gray-700 bg-gray-800 text-white"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">{campaign.script.closing}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Team Members</CardTitle>
                  {isEditing && (
                    <Button onClick={addTeamMember} variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Member
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign.teamMembers.map((member) => (
                  <Card key={member.id} className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-sm text-gray-400">{member.email}</p>
                          <Badge variant="secondary" className="mt-1">
                            {member.role}
                          </Badge>
                        </div>
                        {isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTeamMember(member.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {campaign.teamMembers.length === 0 && (
                  <p className="py-8 text-center text-gray-400">
                    No team members assigned to this campaign.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Budget Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white">Total Budget ($)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={campaign.budget.total}
                      onChange={(e) =>
                        updateNestedField('budget', 'total', parseFloat(e.target.value) || 0)
                      }
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">${campaign.budget.total}</p>
                  )}
                </div>

                <div>
                  <Label className="text-white">Cost Per Call ($)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={campaign.budget.perCall}
                      onChange={(e) =>
                        updateNestedField('budget', 'perCall', parseFloat(e.target.value) || 0)
                      }
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">${campaign.budget.perCall}</p>
                  )}
                </div>

                <div>
                  <Label className="text-white">Daily Budget Limit ($)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={campaign.budget.dailyLimit}
                      onChange={(e) =>
                        updateNestedField('budget', 'dailyLimit', parseFloat(e.target.value) || 0)
                      }
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">${campaign.budget.dailyLimit}</p>
                  )}
                </div>

                <div className="rounded-lg bg-gray-800/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-gray-400">Budget Usage</span>
                    <span className="text-sm text-gray-400">
                      ${campaign.budget.spent} / ${campaign.budget.total}
                    </span>
                  </div>
                  <Progress
                    value={(campaign.budget.spent / campaign.budget.total) * 100}
                    className="h-2"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    Estimated calls remaining:{' '}
                    {Math.floor(
                      (campaign.budget.total - campaign.budget.spent) / campaign.budget.perCall
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white">Max Calls Per Day</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={campaign.settings.maxCallsPerDay}
                      onChange={(e) =>
                        updateNestedField(
                          'settings',
                          'maxCallsPerDay',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">{campaign.settings.maxCallsPerDay}</p>
                  )}
                </div>

                <div>
                  <Label className="text-white">Retry Attempts</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={campaign.settings.retryAttempts}
                      onChange={(e) =>
                        updateNestedField(
                          'settings',
                          'retryAttempts',
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">{campaign.settings.retryAttempts}</p>
                  )}
                </div>

                <div>
                  <Label className="text-white">Max Call Duration (seconds)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={campaign.settings.callDuration}
                      onChange={(e) =>
                        updateNestedField('settings', 'callDuration', parseInt(e.target.value) || 0)
                      }
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-gray-300">{campaign.settings.callDuration}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="voicemail"
                    checked={campaign.settings.voicemailEnabled}
                    onCheckedChange={(checked) =>
                      updateNestedField('settings', 'voicemailEnabled', checked)
                    }
                    disabled={!isEditing}
                  />
                  <Label htmlFor="voicemail" className="text-white">
                    Enable Voicemail
                  </Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Call Log Details Modal */}
      <CallLogDetailsModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        callData={selectedCall}
      />
    </div>
  );
}
