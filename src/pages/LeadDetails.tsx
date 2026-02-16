import { CallLogDetailsModal } from '@/components/CallLogDetailsModal';
import { LeadCallHistory } from '@/components/LeadCallHistory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Activity,
    ArrowLeft,
    ArrowUp,
    Briefcase,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    Edit3,
    FileText,
    Globe,
    Mail,
    MapPin,
    MessageSquare,
    Pause,
    Phone,
    Play,
    Plus,
    Star,
    Tag,
    Target,
    TrendingUp,
    User,
    UserPlus,
    Volume2,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  status: 'new' | 'contacted' | 'interested' | 'qualified' | 'converted' | 'unqualified';
  priority: 'low' | 'medium' | 'high';
  source: string;
  campaign: string;
  tags: string[];
  lastContacted: string;
  nextFollowUp: string;
  notes: string;
  customFields: Record<string, any>;
  campaignType: 'b2c' | 'b2b';
  score: number;
  value: number;
  outcome?:
    | 'interested'
    | 'not_interested'
    | 'callback'
    | 'voicemail'
    | 'no_answer'
    | 'wrong_number'
    | 'do_not_call';
  assignedTo?: string;
  nextAction?: string;
  lastInteraction?: string;
  address?: string;
  website?: string;
}

interface CallHistory {
  id: string;
  date: string;
  duration: string;
  status: 'completed' | 'failed' | 'busy' | 'no-answer';
  outcome: string;
  transcript: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  recording?: string;
  notes: string;
  followUpScheduled?: string;
}

interface Note {
  id: string;
  date: string;
  author: string;
  content: string;
  type: 'general' | 'call' | 'meeting' | 'task' | 'email';
}

interface CallRecord {
  id: string;
  date: string;
  duration: string;
  outcome: string;
  cost: number;
  recordingUrl?: string;
  transcriptUrl?: string;
  agent: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface TimelineEvent {
  id: string;
  type: 'call' | 'email' | 'note' | 'status_change' | 'assignment';
  date: string;
  title: string;
  description: string;
  user: string;
  icon?: any;
}

const statusColors: Record<string, string> = {
  new: 'bg-gray-500 text-white',
  contacted: 'bg-blue-500 text-white',
  interested: 'bg-yellow-500 text-black',
  qualified: 'bg-emerald-500 text-white',
  converted: 'bg-green-500 text-white',
  unqualified: 'bg-red-500 text-white',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-400 text-white',
  medium: 'bg-yellow-500 text-black',
  high: 'bg-red-500 text-white',
};

const outcomeColors: Record<string, string> = {
  interested: 'bg-green-500',
  not_interested: 'bg-red-500',
  callback: 'bg-blue-500',
  voicemail: 'bg-yellow-500',
  no_answer: 'bg-gray-500',
  wrong_number: 'bg-orange-500',
  do_not_call: 'bg-red-700',
};

// Mock call history data
const mockCallHistory: CallHistory[] = [
  {
    id: '1',
    date: '2025-06-28 14:30',
    duration: '4:32',
    status: 'completed',
    outcome: 'interested',
    transcript:
      'Lead expressed strong interest in our AI automation platform. Mentioned current pain points with manual processes.',
    sentiment: 'positive',
    recording: '/recordings/call-1.mp3',
    notes: 'Very engaged. Wants to see ROI projections.',
    followUpScheduled: '2025-07-02 10:00',
  },
  {
    id: '2',
    date: '2025-06-25 11:15',
    duration: '2:18',
    status: 'completed',
    outcome: 'initial_contact',
    transcript: 'Introduction call. Explained our services. Lead asked for more information.',
    sentiment: 'neutral',
    notes: 'Initial contact went well. Send follow-up materials.',
  },
];

const mockNotes: Note[] = [
  {
    id: '1',
    date: '2025-06-28 14:35',
    author: 'Sarah Johnson',
    content:
      "Great call! John is very interested in our AI automation solution. He mentioned they're currently using manual processes that take up 30% of their team's time. Send ROI analysis ASAP.",
    type: 'call',
  },
  {
    id: '2',
    date: '2025-06-27 09:00',
    author: 'Sarah Johnson',
    content:
      "Did some research - TechCorp just raised $50M Series B. They're in growth mode and looking to scale operations. Perfect timing for our solution.",
    type: 'general',
  },
  {
    id: '3',
    date: '2025-06-26 15:30',
    author: 'Mike Davis',
    content:
      'Assigning to Sarah - she has experience with similar tech companies and closed 3 deals in this space last quarter.',
    type: 'general',
  },
];

const mockCallRecords: CallRecord[] = [
  {
    id: '1',
    date: '2025-06-28 14:30',
    duration: '12:45',
    outcome: 'Interested - Callback Scheduled',
    cost: 3.25,
    recordingUrl: '/recordings/call-1.mp3',
    transcriptUrl: '/transcripts/call-1.txt',
    agent: 'AI Assistant - Emma',
    sentiment: 'positive',
  },
  {
    id: '2',
    date: '2025-06-25 10:15',
    duration: '5:30',
    outcome: 'Voicemail Left',
    cost: 1.45,
    recordingUrl: '/recordings/call-2.mp3',
    agent: 'AI Assistant - Emma',
    sentiment: 'neutral',
  },
  {
    id: '3',
    date: '2025-06-22 16:00',
    duration: '8:15',
    outcome: 'Initial Contact - Information Sent',
    cost: 2.1,
    recordingUrl: '/recordings/call-3.mp3',
    transcriptUrl: '/transcripts/call-3.txt',
    agent: 'AI Assistant - James',
    sentiment: 'positive',
  },
];

const mockTimeline: TimelineEvent[] = [
  {
    id: '1',
    type: 'call',
    date: '2025-06-28 14:30',
    title: 'Call Completed - Interested',
    description: 'Spoke with John about AI automation needs. Very interested in ROI data.',
    user: 'AI Assistant - Emma',
    icon: Phone,
  },
  {
    id: '2',
    type: 'status_change',
    date: '2025-06-28 14:35',
    title: 'Status Updated',
    description: 'Status changed from "Contacted" to "Interested"',
    user: 'System',
    icon: Activity,
  },
  {
    id: '3',
    type: 'note',
    date: '2025-06-27 09:00',
    title: 'Research Note Added',
    description: 'Company recently raised Series B funding. Good timing for outreach.',
    user: 'Sarah Johnson',
    icon: MessageSquare,
  },
  {
    id: '4',
    type: 'assignment',
    date: '2025-06-26 15:00',
    title: 'Lead Assigned',
    description: 'Lead assigned to Sarah Johnson',
    user: 'Mike Davis',
    icon: UserPlus,
  },
];

// Mock data - in a real app this would come from API based on the ID
const mockLead: Lead = {
  id: '1',
  firstName: 'John',
  lastName: 'Smith',
  email: 'john.smith@techcorp.com',
  phone: '+1 (555) 123-4567',
  company: 'TechCorp Solutions',
  title: 'Chief Technology Officer',
  status: 'interested',
  priority: 'high',
  source: 'LinkedIn',
  campaign: 'Q4 Enterprise Outreach',
  tags: ['Enterprise', 'Tech', 'Decision Maker', 'High Value'],
  lastContacted: '2025-06-28 14:30',
  nextFollowUp: '2025-07-02 10:00',
  notes: 'Interested in AI automation. Wants to see ROI projections.',
  customFields: {
    industry: 'Technology',
    employeeCount: '500-1000',
    annualRevenue: '$10M - $50M',
    companyType: 'Corporation',
    budget: '$100k+',
    linkedin: 'https://linkedin.com/in/johnsmith',
  },
  campaignType: 'b2b',
  outcome: 'interested',
  assignedTo: 'Sarah Johnson',
  nextAction: 'Send ROI analysis document',
  lastInteraction: '2025-06-28 14:30',
  address: '123 Tech Street, San Francisco, CA 94105',
  website: 'https://techcorp.com',
  score: 85,
  value: 75000,
};

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead>(mockLead);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState(lead.outcome || '');
  const [selectedAssignee, setSelectedAssignee] = useState(lead.assignedTo || '');
  const [showCallDetails, setShowCallDetails] = useState(false);
  const [selectedCallRecord, setSelectedCallRecord] = useState<CallRecord | null>(null);
  
  // Company dropdown fields
  const [employeeCount, setEmployeeCount] = useState(lead.customFields?.employeeCount || '');
  const [annualRevenue, setAnnualRevenue] = useState(lead.customFields?.annualRevenue || '');
  const [companyType, setCompanyType] = useState(lead.customFields?.companyType || '');

  // Dropdown options
  const employeeOptions = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1001-5000',
    '5001-10000',
    '10000+'
  ];

  const revenueOptions = [
    'Under $1M',
    '$1M - $5M',
    '$5M - $10M',
    '$10M - $50M',
    '$50M - $100M',
    '$100M - $500M',
    '$500M - $1B',
    'Over $1B'
  ];

  const companyTypeOptions = [
    'Corporation',
    'LLC',
    'Partnership',
    'Sole Proprietorship',
    'Non-profit',
    'Government',
    'Startup',
    'Other'
  ];

  const totalCallCost = mockCallRecords.reduce((sum, call) => sum + call.cost, 0);
  const avgCallDuration =
    mockCallRecords.reduce((sum, call) => {
      const [min, sec] = call.duration.split(':').map(Number);
      return sum + min + sec / 60;
    }, 0) / mockCallRecords.length;

  const handlePlayRecording = (url: string) => {
    setSelectedRecording(url);
    setIsPlaying(!isPlaying);
  };

  const handleDownloadTranscript = (_url: string) => {
    // TODO: Implement file download via Supabase storage
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      author: 'Current User', // Would come from auth
      content: newNote,
      type: 'general',
    };

    mockNotes.unshift(note);
    setNewNote('');
  };

  const handleOutcomeChange = (value: string) => {
    setSelectedOutcome(value);
    setLead({ ...lead, outcome: value as any });
    // In a real app, this would update the backend
  };

  const handleAssigneeChange = (value: string) => {
    setSelectedAssignee(value);
    setLead({ ...lead, assignedTo: value });
    // In a real app, this would update the backend
  };

  const handleViewCallDetails = (call: CallRecord) => {
    setSelectedCallRecord(call);
    setShowCallDetails(true);
  };

  const getMockCallData = (call: CallRecord) => {
    return {
      id: call.id,
      duration: parseInt(call.duration.split(':')[0]) * 60 + parseInt(call.duration.split(':')[1]),
      transcript: [
        {
          speaker: 'ai' as const,
          text: `Hello, this is ${call.agent} from Trinity AI Solutions. Is this ${lead.firstName}?`,
        },
        { speaker: 'user' as const, text: 'Yes, this is me.' },
        {
          speaker: 'ai' as const,
          text: `Hi ${lead.firstName}, I hope I'm not catching you at a bad time. I'm calling because we've developed an innovative AI calling solution that's been helping companies like ${lead.company} increase their outreach efficiency. Would you be interested in learning more?`,
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
      recording: call.recordingUrl,
      analysis: {
        sentiment: call.sentiment === 'positive' ? 0.8 : call.sentiment === 'negative' ? 0.2 : 0.5,
        keywords: ['AI', 'solution', lead.company, 'efficiency'],
        summary: `Call with ${lead.firstName} ${lead.lastName} by ${call.agent}. ${call.outcome}`,
      },
      cost: call.cost,
    };
  };

  // Update handlers for dropdowns
  const handleEmployeeCountChange = (value: string) => {
    setEmployeeCount(value);
    setLead(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        employeeCount: value
      }
    }));
  };

  const handleAnnualRevenueChange = (value: string) => {
    setAnnualRevenue(value);
    setLead(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        annualRevenue: value
      }
    }));
  };

  const handleCompanyTypeChange = (value: string) => {
    setCompanyType(value);
    setLead(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        companyType: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Enhanced Header */}
      <div className="relative border-b border-gray-800/50 bg-gradient-to-r from-gray-900 via-black to-gray-900">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
        
        <div className="relative container mx-auto px-6 py-8">
          {/* Back button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CRM
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xl font-bold text-white shadow-lg">
                  {lead.firstName[0]}{lead.lastName[0]}
                </div>
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-gray-900" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  {lead.firstName} {lead.lastName}
                </h1>
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="font-medium">{lead.title}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{lead.company}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-400">Customer ID:</span>
                  <span className="text-sm font-mono text-cyan-400">CID{id?.padStart(4, '0') || '0623'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className={`${statusColors[lead.status]} px-3 py-1 text-sm font-semibold`}>
                  {lead.status === 'qualified' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                </Badge>
                <Badge className={`${priorityColors[lead.priority]} px-3 py-1 text-sm font-semibold`}>
                  {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)} Priority
                </Badge>
                {lead.outcome && (
                  <Badge className={`${outcomeColors[lead.outcome]} px-3 py-1 text-sm font-semibold`}>
                    {lead.outcome.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-600 bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200 p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="flex h-full flex-col">
          <TabsList className="justify-start rounded-none border-b border-gray-700 bg-gray-800 p-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="calls" className="data-[state=active]:bg-gray-700">
              Call History
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-gray-700">
              Notes & Tasks
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="transcript" className="data-[state=active]:bg-gray-700">
              Transcript & Recording
            </TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-gray-700">
              Call Costs
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-gray-700">
              Timeline
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Contact Information */}
                <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm lg:col-span-2">
                  <CardHeader className="border-b border-gray-800/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <User className="h-4 w-4 text-blue-400" />
                      </div>
                      <CardTitle className="text-xl font-bold text-white">Personal Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <Phone className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Phone</p>
                            <p className="text-sm font-semibold text-white">{lead.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Mail className="h-4 w-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Email</p>
                            <p className="text-sm font-semibold text-white">{lead.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <Briefcase className="h-4 w-4 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 font-medium">Position</p>
                            <p className="text-sm font-semibold text-white">{lead.title}</p>
                          </div>
                        </div>
                        {lead.website && (
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                              <Globe className="h-4 w-4 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 font-medium">Website</p>
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                              >
                                {lead.website.replace('https://', '')}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {lead.address && (
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20 mt-0.5">
                              <MapPin className="h-4 w-4 text-pink-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-400 font-medium">Address</p>
                              <p className="text-sm font-semibold text-white leading-relaxed">{lead.address}</p>
                            </div>
                          </div>
                        )}
                        <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <Tag className="h-4 w-4 text-amber-400" />
                            </div>
                            <p className="text-xs text-gray-400 font-medium">Tags</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {lead.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                className="bg-gradient-to-r from-gray-700 to-gray-600 text-gray-200 border border-gray-600/50 px-2 py-1 text-xs font-medium"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-gray-800/50 my-6" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <Target className="h-4 w-4 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Campaign</p>
                          <p className="text-sm font-semibold text-white">{lead.campaign}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20">
                          <Activity className="h-4 w-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Source</p>
                          <p className="text-sm font-semibold text-white">{lead.source}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <Clock className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Last Activity</p>
                          <p className="text-sm font-semibold text-white">Mon, Jan 15, 2024 at 1:00 AM</p>
                          <p className="text-xs text-gray-400">Email sent</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/30">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          <UserPlus className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Lead Owner</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                              JD
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">John Doe</p>
                              <p className="text-xs text-gray-400">Sales Manager</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Custom Fields */}
                    {Object.keys(lead.customFields || {}).length > 0 && (
                      <>
                        <Separator className="bg-gray-800" />
                        <div>
                          <h4 className="mb-3 text-sm font-medium text-gray-400">
                            Company Details
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(lead.customFields).map(([key, value]) => {
                              const displayKey = key.replace(/([A-Z])/g, ' $1').trim();
                              
                              // Render dropdowns for specific fields
                              if (key === 'employeeCount') {
                                return (
                                  <div key={key}>
                                    <label className="text-sm capitalize text-gray-400">
                                      {displayKey}
                                    </label>
                                    <Select value={employeeCount} onValueChange={handleEmployeeCountChange}>
                                      <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-gray-300">
                                        <SelectValue placeholder="Select employees" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {employeeOptions.map(option => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              }
                              
                              if (key === 'annualRevenue') {
                                return (
                                  <div key={key}>
                                    <label className="text-sm capitalize text-gray-400">
                                      {displayKey}
                                    </label>
                                    <Select value={annualRevenue} onValueChange={handleAnnualRevenueChange}>
                                      <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-gray-300">
                                        <SelectValue placeholder="Select revenue" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {revenueOptions.map(option => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              }
                              
                              if (key === 'companyType') {
                                return (
                                  <div key={key}>
                                    <label className="text-sm capitalize text-gray-400">
                                      {displayKey}
                                    </label>
                                    <Select value={companyType} onValueChange={handleCompanyTypeChange}>
                                      <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-gray-300">
                                        <SelectValue placeholder="Select company type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {companyTypeOptions.map(option => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              }
                              
                              // Render regular fields as before
                              return (
                                <div key={key}>
                                  <label className="text-sm capitalize text-gray-400">
                                    {displayKey}
                                  </label>
                                  <p className="text-gray-300">{value}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions & Lead Score */}
                <div className="space-y-6">
                  {/* Lead Score */}
                  {lead.score && (
                    <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                      <CardHeader className="border-b border-gray-800/50 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <Star className="h-4 w-4 text-yellow-400" />
                          </div>
                          <CardTitle className="text-xl font-bold text-white">Lead Score</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <div className="relative">
                            <div className="mb-4 text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">{lead.score}</div>
                            <div className="absolute -top-2 -right-2 h-3 w-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
                          </div>
                          <div className="space-y-2">
                            <Progress value={lead.score} className="h-3 bg-gray-800/50 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-700 ease-out" style={{width: `${lead.score}%`}} />
                            </Progress>
                            <p className="text-sm font-semibold text-white">
                              {lead.score >= 80
                                ? '🔥 Hot Lead'
                                : lead.score >= 60
                                  ? '🌡️ Warm Lead'
                                  : '❄️ Cold Lead'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {lead.score >= 80
                                ? 'High conversion probability'
                                : lead.score >= 60
                                  ? 'Good potential for engagement'
                                  : 'Requires nurturing'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                    <CardHeader className="border-b border-gray-800/50 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20">
                          <Activity className="h-4 w-4 text-pink-400" />
                        </div>
                        <CardTitle className="text-xl font-bold text-white">Quick Actions</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <CheckCircle className="h-3 w-3 text-orange-400" />
                          </div>
                          <label className="text-sm font-medium text-gray-300">Change Outcome</label>
                        </div>
                        <Select value={selectedOutcome} onValueChange={handleOutcomeChange}>
                          <SelectTrigger className="border-gray-700/50 bg-gray-800/50 text-white hover:bg-gray-800 transition-colors">
                            <SelectValue placeholder="Select outcome" />
                          </SelectTrigger>
                          <SelectContent className="border-gray-700 bg-gray-800">
                            <SelectItem value="interested">Interested</SelectItem>
                            <SelectItem value="not_interested">Not Interested</SelectItem>
                            <SelectItem value="callback">Callback</SelectItem>
                            <SelectItem value="voicemail">Voicemail</SelectItem>
                            <SelectItem value="no_answer">No Answer</SelectItem>
                            <SelectItem value="wrong_number">Wrong Number</SelectItem>
                            <SelectItem value="do_not_call">Do Not Call</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <UserPlus className="h-3 w-3 text-indigo-400" />
                          </div>
                          <label className="text-sm font-medium text-gray-300">Assign To</label>
                        </div>
                        <Select value={selectedAssignee} onValueChange={handleAssigneeChange}>
                          <SelectTrigger className="border-gray-700/50 bg-gray-800/50 text-white hover:bg-gray-800 transition-colors">
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                          <SelectContent className="border-gray-700 bg-gray-800">
                            <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                            <SelectItem value="Mike Davis">Mike Davis</SelectItem>
                            <SelectItem value="Emily Wilson">Emily Wilson</SelectItem>
                            <SelectItem value="John Smith">John Smith</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="pt-2 space-y-3">
                        <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-2.5 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25">
                          <Phone className="mr-2 h-4 w-4" />
                          Start Call
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full border-gray-600 bg-gray-800/30 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 py-2.5"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Follow-up
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Next Action */}
                  {lead.nextAction && (
                    <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                      <CardHeader className="border-b border-gray-800/50 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                            <Target className="h-4 w-4 text-cyan-400" />
                          </div>
                          <CardTitle className="text-xl font-bold text-white">Next Action</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                            <p className="text-white font-medium leading-relaxed">{lead.nextAction}</p>
                          </div>
                          {lead.nextFollowUp && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20">
                                <Clock className="h-3 w-3 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs text-blue-300 font-medium">Due Date</p>
                                <p className="text-sm font-semibold text-white">
                                  {new Date(lead.nextFollowUp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Call History Tab */}
            <TabsContent value="calls" className="mt-0">
              <LeadCallHistory leadId={lead.id} leadName={`${lead.firstName} ${lead.lastName}`} />
            </TabsContent>

            {/* Notes & Tasks Tab */}
            <TabsContent value="notes" className="mt-0">
              <div className="space-y-4">
                {/* Add Note */}
                <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Textarea
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="border-gray-700/50 bg-gray-800/50 text-white placeholder:text-gray-400 focus:border-cyan-500/50 transition-colors"
                        rows={3}
                      />
                      <Button
                        onClick={handleAddNote}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-4 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes List */}
                {mockNotes.map((note) => (
                  <Card key={note.id} className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                            note.type === 'call'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : note.type === 'email'
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                : note.type === 'meeting'
                                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                  : 'bg-gray-500/10 border-gray-500/20 text-gray-400'
                          }`}
                        >
                          {note.type === 'call' ? (
                            <Phone className="h-4 w-4" />
                          ) : note.type === 'email' ? (
                            <Mail className="h-4 w-4" />
                          ) : note.type === 'meeting' ? (
                            <Calendar className="h-4 w-4" />
                          ) : (
                            <MessageSquare className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                            <p className="text-white leading-relaxed">{note.content}</p>
                          </div>
                          <div className="mt-3 flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span className="text-gray-400">{note.date}</span>
                            </div>
                            <span className="text-gray-600">•</span>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-gray-500" />
                              <span className="text-gray-400 font-medium">{note.author}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-800/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      </div>
                      <CardTitle className="text-lg font-bold text-white">Call Success Rate</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">75%</div>
                      <div className="space-y-2">
                        <Progress value={75} className="h-2 bg-gray-800/50 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700 ease-out" style={{width: '75%'}} />
                        </Progress>
                        <p className="text-xs text-gray-400">Above average performance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-800/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Clock className="h-4 w-4 text-blue-400" />
                      </div>
                      <CardTitle className="text-lg font-bold text-white">Avg Call Duration</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">3:25</div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <ArrowUp className="h-3 w-3 text-blue-400" />
                        <p className="text-xs text-blue-300 font-medium">+0:45 vs average</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-800/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <DollarSign className="h-4 w-4 text-emerald-400" />
                      </div>
                      <CardTitle className="text-lg font-bold text-white">Estimated Value</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                        ${(lead.value || 15000).toLocaleString()}
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-xs text-emerald-300 font-medium">Based on lead profile & activity</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Transcript & Recording Tab */}
            <TabsContent value="transcript" className="space-y-6">
              <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                <CardHeader className="border-b border-gray-800/50 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Volume2 className="h-4 w-4 text-purple-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">Call History</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">
                    View recordings and transcripts from all calls with this lead
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCallRecords.map((call) => (
                      <div
                        key={call.id}
                        className="space-y-3 rounded-lg border border-gray-800 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="font-medium text-white">{call.date}</div>
                              <div className="text-sm text-gray-400">
                                Duration: {call.duration} • Agent: {call.agent}
                              </div>
                            </div>
                            <Badge
                              className={
                                call.sentiment === 'positive'
                                  ? 'bg-green-500 text-white'
                                  : call.sentiment === 'negative'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-500 text-white'
                              }
                            >
                              {call.sentiment}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Cost</div>
                            <div className="font-medium text-white">${call.cost.toFixed(2)}</div>
                          </div>
                        </div>

                        <div className="rounded bg-gray-800/50 p-3">
                          <div className="mb-1 text-sm font-medium text-gray-300">Outcome</div>
                          <div className="text-white">{call.outcome}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          {call.recordingUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-700 text-gray-300 hover:bg-gray-800"
                              onClick={() => handlePlayRecording(call.recordingUrl!)}
                            >
                              {isPlaying && selectedRecording === call.recordingUrl ? (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Play Recording
                                </>
                              )}
                            </Button>
                          )}

                          {call.transcriptUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-700 text-gray-300 hover:bg-gray-800"
                              onClick={() => handleDownloadTranscript(call.transcriptUrl!)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Transcript
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                            onClick={() => handleViewCallDetails(call)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Full Transcript
                          </Button>
                        </div>

                        {/* Audio Player Mockup */}
                        {isPlaying && selectedRecording === call.recordingUrl && (
                          <div className="space-y-3 rounded-lg bg-gray-800 p-4">
                            <div className="flex items-center gap-3">
                              <Button size="icon" variant="ghost" className="text-gray-300">
                                <Volume2 className="h-4 w-4" />
                              </Button>
                              <div className="flex-1">
                                <Progress value={45} className="h-1 bg-gray-700" />
                              </div>
                              <span className="text-sm text-gray-400">2:34 / 5:45</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Call Costs Tab */}
            <TabsContent value="costs" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-800/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20">
                        <DollarSign className="h-4 w-4 text-green-400" />
                      </div>
                      <CardTitle className="text-lg font-bold text-white">Total Cost</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">${totalCallCost.toFixed(2)}</div>
                      <div className="p-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
                        <p className="text-xs text-gray-300 font-medium">
                          Across {mockCallRecords.length} calls
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-800/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Clock className="h-4 w-4 text-blue-400" />
                      </div>
                      <CardTitle className="text-lg font-bold text-white">Avg Duration</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                        {avgCallDuration.toFixed(1)}m
                      </div>
                      <div className="p-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
                        <p className="text-xs text-gray-300 font-medium">Per call</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-800/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CreditCard className="h-4 w-4 text-emerald-400" />
                      </div>
                      <CardTitle className="text-lg font-bold text-white">Cost per Minute</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                        $
                        {(
                          totalCallCost /
                          mockCallRecords.reduce((sum, call) => {
                            const [min, sec] = call.duration.split(':').map(Number);
                            return sum + min + sec / 60;
                          }, 0)
                        ).toFixed(2)}
                      </div>
                      <div className="p-2 rounded-lg bg-gray-800/30 border border-gray-700/30">
                        <p className="text-xs text-gray-300 font-medium">Average rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                <CardHeader className="border-b border-gray-800/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <DollarSign className="h-4 w-4 text-amber-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">Call Cost Breakdown</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockCallRecords.map((call) => (
                      <div
                        key={call.id}
                        className="flex items-center justify-between border-b border-gray-800 py-2 last:border-0"
                      >
                        <div>
                          <div className="font-medium text-white">{call.date}</div>
                          <div className="text-sm text-gray-400">
                            {call.duration} • {call.agent}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white">${call.cost.toFixed(2)}</div>
                          <div className="text-sm text-gray-400">{call.outcome}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-6">
              <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-gray-800/50 backdrop-blur-sm">
                <CardHeader className="border-b border-gray-800/50 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      <Activity className="h-4 w-4 text-indigo-400" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">Activity Timeline</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">
                    Complete history of all interactions and changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockTimeline.map((event, index) => {
                      const Icon = event.icon;
                      return (
                        <div key={event.id} className="flex gap-4">
                          <div className="relative">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                event.type === 'call'
                                  ? 'bg-blue-900/50 text-blue-400'
                                  : event.type === 'status_change'
                                    ? 'bg-emerald-900/50 text-emerald-400'
                                    : event.type === 'note'
                                      ? 'bg-green-900/50 text-green-400'
                                      : event.type === 'assignment'
                                        ? 'bg-yellow-900/50 text-yellow-400'
                                        : 'bg-gray-800 text-gray-400'
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            {index < mockTimeline.length - 1 && (
                              <div className="absolute left-5 top-10 h-full w-0.5 bg-gray-800" />
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="rounded-lg bg-gray-800/50 p-4">
                              <div className="mb-2 flex items-center justify-between">
                                <h4 className="font-medium text-white">{event.title}</h4>
                                <span className="text-sm text-gray-400">{event.date}</span>
                              </div>
                              <p className="text-sm text-gray-300">{event.description}</p>
                              <p className="mt-2 text-xs text-gray-500">By {event.user}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Call Details Modal */}
      <CallLogDetailsModal
        isOpen={showCallDetails}
        onClose={() => setShowCallDetails(false)}
        callData={selectedCallRecord ? getMockCallData(selectedCallRecord) : undefined}
      />
    </div>
  );
}
