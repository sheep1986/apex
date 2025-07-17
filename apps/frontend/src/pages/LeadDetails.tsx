import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  X,
  Phone,
  Mail,
  Building,
  User,
  Clock,
  Calendar,
  Edit3,
  Save,
  Star,
  MessageSquare,
  PlayCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  PhoneCall,
  Plus,
  Filter,
  Download,
  ArrowLeft,
  DollarSign,
  Play,
  Pause,
  Volume2,
  FileText,
  Activity,
  CreditCard,
  UserPlus,
  CheckSquare,
  Edit,
  MoreVertical,
  Briefcase,
  Tag,
  MapPin,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { LeadCallHistory } from '@/components/LeadCallHistory';
import { CallLogDetailsModal } from '@/components/CallLogDetailsModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

  const handleDownloadTranscript = (url: string) => {
    // In a real app, this would download the file
    console.log('Downloading transcript:', url);
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
          text: `Hello, this is ${call.agent} from Apex AI Solutions. Is this ${lead.firstName}?`,
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
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-500 text-lg font-semibold text-white">
              {lead.firstName[0]}
              {lead.lastName[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {lead.firstName} {lead.lastName}
              </h2>
              <p className="text-gray-400">
                {lead.title} • {lead.company}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={statusColors[lead.status]}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Badge>
            <Badge className={priorityColors[lead.priority]}>
              {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)} Priority
            </Badge>
            {lead.outcome && (
              <Badge className={`${outcomeColors[lead.outcome]} text-white`}>
                {lead.outcome.replace('_', ' ')}
              </Badge>
            )}
            <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
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
                <Card className="border-gray-800 bg-gray-900/50 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-white">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{lead.email}</span>
                        </div>
                        {lead.website && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Globe className="h-4 w-4 text-gray-500" />
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300"
                            >
                              {lead.website}
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {lead.address && (
                          <div className="flex items-start gap-2 text-gray-300">
                            <MapPin className="mt-0.5 h-4 w-4 text-gray-500" />
                            <span className="text-sm">{lead.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-300">
                          <Tag className="h-4 w-4 text-gray-500" />
                          <div className="flex flex-wrap gap-1">
                            {lead.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-gray-800 text-gray-300"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-gray-800" />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Campaign</label>
                        <p className="text-gray-300">{lead.campaign}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Source</label>
                        <p className="text-gray-300">{lead.source}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Last Interaction</label>
                        <p className="text-gray-300">{lead.lastInteraction || 'Never'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Next Follow-up</label>
                        <p className="text-gray-300">{lead.nextFollowUp || 'Not scheduled'}</p>
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
                    <Card className="border-gray-800 bg-gray-900/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <Star className="h-5 w-5 text-yellow-500" />
                          Lead Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="mb-2 text-4xl font-bold text-white">{lead.score}</div>
                          <Progress value={lead.score} className="h-2 bg-gray-700" />
                          <p className="mt-2 text-sm text-gray-400">
                            {lead.score >= 80
                              ? 'Hot Lead'
                              : lead.score >= 60
                                ? 'Warm Lead'
                                : 'Cold Lead'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card className="border-gray-800 bg-gray-900/50">
                    <CardHeader>
                      <CardTitle className="text-white">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Change Outcome</label>
                        <Select value={selectedOutcome} onValueChange={handleOutcomeChange}>
                          <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
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

                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">Assign To</label>
                        <Select value={selectedAssignee} onValueChange={handleAssigneeChange}>
                          <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
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

                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <Phone className="mr-2 h-4 w-4" />
                        Start Call
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Follow-up
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Next Action */}
                  {lead.nextAction && (
                    <Card className="border-gray-800 bg-gray-900/50">
                      <CardHeader>
                        <CardTitle className="text-white">Next Action</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300">{lead.nextAction}</p>
                        {lead.nextFollowUp && (
                          <p className="mt-2 text-sm text-gray-500">
                            Due: {new Date(lead.nextFollowUp).toLocaleString()}
                          </p>
                        )}
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
                <Card className="border-gray-700 bg-gray-800/50">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <Textarea
                        placeholder="Add a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="border-gray-600 bg-gray-700 text-white"
                        rows={2}
                      />
                      <Button
                        onClick={handleAddNote}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes List */}
                {mockNotes.map((note) => (
                  <Card key={note.id} className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            note.type === 'call'
                              ? 'bg-emerald-500'
                              : note.type === 'email'
                                ? 'bg-blue-500'
                                : note.type === 'meeting'
                                  ? 'bg-green-500'
                                  : 'bg-gray-500'
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
                          <p className="text-white">{note.content}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                            <span>{note.date}</span>
                            <span>•</span>
                            <span>{note.author}</span>
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
                <Card className="border-gray-700 bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-sm text-white">Call Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-400">75%</div>
                    <Progress value={75} className="mt-2" />
                  </CardContent>
                </Card>

                <Card className="border-gray-700 bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-sm text-white">Avg Call Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-400">3:25</div>
                    <p className="mt-1 text-xs text-gray-400">+0:45 vs average</p>
                  </CardContent>
                </Card>

                <Card className="border-gray-700 bg-gray-800/50">
                  <CardHeader>
                    <CardTitle className="text-sm text-white">Estimated Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-400">
                      ${lead.value || 15000}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">Based on lead profile</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Transcript & Recording Tab */}
            <TabsContent value="transcript" className="space-y-6">
              <Card className="border-gray-800 bg-gray-900/50">
                <CardHeader>
                  <CardTitle className="text-white">Call History</CardTitle>
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
                <Card className="border-gray-800 bg-gray-900/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      Total Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">${totalCallCost.toFixed(2)}</div>
                    <p className="mt-1 text-sm text-gray-400">
                      Across {mockCallRecords.length} calls
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-gray-800 bg-gray-900/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Clock className="h-5 w-5 text-blue-500" />
                      Avg Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {avgCallDuration.toFixed(1)}m
                    </div>
                    <p className="mt-1 text-sm text-gray-400">Per call</p>
                  </CardContent>
                </Card>

                <Card className="border-gray-800 bg-gray-900/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <CreditCard className="h-5 w-5 text-emerald-500" />
                      Cost per Minute
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      $
                      {(
                        totalCallCost /
                        mockCallRecords.reduce((sum, call) => {
                          const [min, sec] = call.duration.split(':').map(Number);
                          return sum + min + sec / 60;
                        }, 0)
                      ).toFixed(2)}
                    </div>
                    <p className="mt-1 text-sm text-gray-400">Average rate</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-gray-800 bg-gray-900/50">
                <CardHeader>
                  <CardTitle className="text-white">Call Cost Breakdown</CardTitle>
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
              <Card className="border-gray-800 bg-gray-900/50">
                <CardHeader>
                  <CardTitle className="text-white">Activity Timeline</CardTitle>
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
