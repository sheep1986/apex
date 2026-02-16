import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Calendar,
    Edit3,
    ExternalLink,
    Mail,
    MessageSquare,
    Phone,
    PhoneCall,
    PlayCircle,
    Plus,
    Save,
    TrendingUp,
    User,
    X
} from 'lucide-react';
import { useState } from 'react';

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
  notes: string;
  score?: number;
  value?: number;
  originalCallId?: string;
  platformCallId?: string;
  sentimentScore?: number;
  leadQuality?: string;
  nextFollowUp?: string;
  lastContactDate?: string;
  assignedTo?: string;
  assignedToId?: string;
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  customFields?: Record<string, any>;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignee: string;
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'proposal' | 'demo' | 'other';
  createdAt: string;
}

interface CallRecord {
  id: string;
  date: string;
  duration: string;
  status: 'completed' | 'missed' | 'cancelled';
  outcome: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  transcript: string;
  recording?: string;
  summary?: string;
  tags?: string[];
  platformCallId?: string;
  cost?: number;
}

interface Email {
  id: string;
  subject: string;
  body: string;
  sentAt: string;
  direction: 'inbound' | 'outbound';
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied';
  attachments?: string[];
}

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  meetingType: 'demo' | 'discovery' | 'proposal' | 'follow_up' | 'closing';
}

interface Note {
  id: string;
  content: string;
  timestamp: string;
  author: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'system';
  tags?: string[];
  attachments?: string[];
}

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLead: Lead) => void;
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

// Enhanced mock data based on actual call data
const mockCalls: CallRecord[] = [
  {
    id: 'call-001',
    date: '2025-07-11 14:30',
    duration: '3:05',
    status: 'completed',
    outcome: 'Interested - Scheduled Follow-up',
    sentiment: 'positive',
    transcript:
      "Hello, this is John Smith. Yes, I'm interested in learning more about your AI calling solution. We've been struggling with our current calling process and this sounds like exactly what we need. Can you tell me more about how this would integrate with our existing CRM? We're currently using Salesforce and have about 50 sales reps.",
    recording: 'https://storage.trinity-ai.com/recording-001.wav',
    summary:
      'Contact expressed strong interest in AI calling features. Scheduled demo for next Tuesday at 2 PM.',
    tags: ['hot-lead', 'enterprise', 'demo-scheduled'],
    platformCallId: 'call_123456789abcdef',
    cost: 0.47,
  },
  {
    id: 'call-historical-1',
    date: '2025-07-09 10:15',
    duration: '2:18',
    status: 'completed',
    outcome: 'Initial contact made',
    sentiment: 'neutral',
    transcript:
      "Hi, this is John from TechCorp. I received your call yesterday but was in a meeting. I'm curious about your AI calling platform. We're always looking for ways to improve our sales efficiency.",
    recording: 'https://storage.example.com/recording-historical-1.wav',
    summary: 'Initial contact established. Lead showed interest in learning more.',
    tags: ['first-contact', 'warm'],
    cost: 0.32,
  },
];

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Demo Presentation - Enterprise Package',
    description:
      'Prepare comprehensive demo focusing on Salesforce integration and multi-user capabilities. Include ROI projections.',
    dueDate: '2025-07-13T14:00:00Z',
    priority: 'high',
    status: 'pending',
    assignee: 'Sarah Wilson',
    type: 'demo',
    createdAt: '2025-07-11T14:35:00Z',
  },
  {
    id: 'task-2',
    title: 'Send follow-up email with case studies',
    description:
      'Send email with relevant case studies from similar tech companies using our platform.',
    dueDate: '2025-07-12T09:00:00Z',
    priority: 'medium',
    status: 'in_progress',
    assignee: 'Mark Johnson',
    type: 'email',
    createdAt: '2025-07-11T15:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Prepare enterprise pricing proposal',
    description: 'Create custom pricing proposal for 50+ user license with Salesforce integration.',
    dueDate: '2025-07-15T17:00:00Z',
    priority: 'high',
    status: 'pending',
    assignee: 'Sarah Wilson',
    type: 'proposal',
    createdAt: '2025-07-11T14:40:00Z',
  },
];

const mockEmails: Email[] = [
  {
    id: 'email-1',
    subject: 'Re: AI Calling Solution - Follow up from our call',
    body: "Hi John, Thank you for the great conversation today. As discussed, I'm attaching some case studies from similar companies in your industry...",
    sentAt: '2025-07-11T15:30:00Z',
    direction: 'outbound',
    status: 'opened',
    attachments: ['TechCorp_Case_Study.pdf', 'ROI_Calculator.xlsx'],
  },
  {
    id: 'email-2',
    subject: 'Questions about integration capabilities',
    body: 'Hi Sarah, Thanks for the information. I have a few technical questions about the Salesforce integration...',
    sentAt: '2025-07-11T16:45:00Z',
    direction: 'inbound',
    status: 'replied',
  },
];

const mockMeetings: Meeting[] = [
  {
    id: 'meeting-1',
    title: 'AI Calling Platform Demo',
    description:
      'Comprehensive demo of AI calling features with focus on enterprise capabilities and Salesforce integration.',
    startTime: '2025-07-13T14:00:00Z',
    endTime: '2025-07-13T15:00:00Z',
    location: 'Zoom Meeting (link will be sent)',
    attendees: ['John Smith', 'Sarah Wilson', 'Technical Support'],
    status: 'scheduled',
    meetingType: 'demo',
  },
];

const mockNotes: Note[] = [
  {
    id: 'note-1',
    content:
      'Lead is decision maker for AI tool procurement. Budget of $100k+ confirmed. Currently using Salesforce with 50 sales reps. Main pain point is manual calling process inefficiency.',
    timestamp: '2025-07-11T14:35:00Z',
    author: 'Sarah Wilson',
    type: 'call',
    tags: ['budget-confirmed', 'decision-maker', 'salesforce'],
  },
  {
    id: 'note-2',
    content:
      'Demo scheduled for Tuesday 2 PM. Focus on: 1) Salesforce integration, 2) Multi-user management, 3) ROI projections, 4) Enterprise security features.',
    timestamp: '2025-07-11T14:40:00Z',
    author: 'Sarah Wilson',
    type: 'note',
    tags: ['demo-prep', 'requirements'],
  },
  {
    id: 'note-3',
    content:
      'Lead responded positively to follow-up email. Asked technical questions about API limitations and data privacy compliance.',
    timestamp: '2025-07-11T17:00:00Z',
    author: 'Mark Johnson',
    type: 'email',
    tags: ['positive-response', 'technical-questions'],
  },
];

// Team members (in real app, this would come from context/props)
const teamMembers = [
  { id: 'user-1', name: 'Sarah Wilson', role: 'sales_manager' },
  { id: 'user-2', name: 'Mark Johnson', role: 'sales_rep' },
  { id: 'user-3', name: 'Emily Chen', role: 'sales_rep' },
  { id: 'user-4', name: 'David Rodriguez', role: 'sales_rep' },
  { id: 'unassigned', name: 'Unassigned', role: 'admin' },
];

export default function LeadDetailsModal({ lead, isOpen, onClose, onSave }: LeadDetailsModalProps) {
  const [editedLead, setEditedLead] = useState<Lead | null>(lead);
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [newTask, setNewTask] = useState('');
  const [newTaskType, setNewTaskType] = useState<Task['type']>('call');

  if (!isOpen || !lead || !editedLead) return null;

  const handleSave = () => {
    if (editedLead) {
      onSave(editedLead);
      setIsEditing(false);
    }
  };

  const handleScheduleCall = () => {
    if (scheduleDateTime) {
      // TODO: Wire to scheduling backend
      setScheduleDateTime('');
    }
  };

  const addNote = () => {
    if (newNote.trim()) {
      // TODO: Wire to notes backend
      setNewNote('');
    }
  };

  const changeStatus = (newStatus: Lead['status']) => {
    if (editedLead) {
      setEditedLead({ ...editedLead, status: newStatus });
      onSave({ ...editedLead, status: newStatus });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const leadScore = editedLead.score || 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        {/* Header */}
        <div className="border-b border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-500 text-lg font-semibold text-white">
                {editedLead.firstName[0]}
                {editedLead.lastName[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {editedLead.firstName} {editedLead.lastName}
                </h2>
                <p className="text-gray-400">
                  {editedLead.title} • {editedLead.company}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge className={statusColors[editedLead.status]}>
                {editedLead.status.charAt(0).toUpperCase() + editedLead.status.slice(1)}
              </Badge>
              <Badge className={priorityColors[editedLead.priority]}>
                {editedLead.priority.charAt(0).toUpperCase() + editedLead.priority.slice(1)}{' '}
                Priority
              </Badge>
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="flex h-full flex-col">
            <TabsList className="justify-start rounded-none border-b border-gray-700 bg-gray-800 p-0">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
                Overview
              </TabsTrigger>
              <TabsTrigger value="calls" className="data-[state=active]:bg-gray-700">
                Calls ({mockCalls.length})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-gray-700">
                Tasks ({mockTasks.length})
              </TabsTrigger>
              <TabsTrigger value="emails" className="data-[state=active]:bg-gray-700">
                Emails ({mockEmails.length})
              </TabsTrigger>
              <TabsTrigger value="meetings" className="data-[state=active]:bg-gray-700">
                Meetings ({mockMeetings.length})
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-gray-700">
                Notes ({mockNotes.length})
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-gray-700">
                Timeline
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Lead Information */}
                  <div className="lg:col-span-2">
                    <Card className="border-gray-700 bg-gray-800/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-white">
                            <User className="h-5 w-5" />
                            Lead Information
                          </CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                            className="border-gray-700 text-gray-300"
                          >
                            {isEditing ? (
                              <Save className="h-4 w-4" />
                            ) : (
                              <Edit3 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Contact Details */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm text-gray-400">First Name</label>
                            {isEditing ? (
                              <Input
                                value={editedLead.firstName}
                                onChange={(e) =>
                                  setEditedLead({ ...editedLead, firstName: e.target.value })
                                }
                                className="mt-1 border-gray-600 bg-gray-700 text-white"
                              />
                            ) : (
                              <div className="group relative mt-1 rounded-md border border-transparent bg-gray-800/50 px-3 py-2 transition-all hover:border-gray-600 hover:bg-gray-700/50">
                                <div className="flex items-center justify-between">
                                  <span className="text-white">{editedLead.firstName}</span>
                                  <Edit3 className="h-4 w-4 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-sm text-gray-400">Email</label>
                            {isEditing ? (
                              <Input
                                value={editedLead.email}
                                onChange={(e) =>
                                  setEditedLead({ ...editedLead, email: e.target.value })
                                }
                                className="mt-1 border-gray-600 bg-gray-700 text-white"
                              />
                            ) : (
                              <div className="group relative mt-1 rounded-md border border-transparent bg-gray-800/50 px-3 py-2 transition-all hover:border-gray-600 hover:bg-gray-700/50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <span className="text-white">{editedLead.email}</span>
                                  </div>
                                  <Edit3 className="h-4 w-4 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-sm text-gray-400">Phone</label>
                            {isEditing ? (
                              <Input
                                value={editedLead.phone}
                                onChange={(e) =>
                                  setEditedLead({ ...editedLead, phone: e.target.value })
                                }
                                className="mt-1 border-gray-600 bg-gray-700 text-white"
                              />
                            ) : (
                              <div className="group relative mt-1 rounded-md border border-transparent bg-gray-800/50 px-3 py-2 transition-all hover:border-gray-600 hover:bg-gray-700/50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-white">{editedLead.phone}</span>
                                  </div>
                                  <Edit3 className="h-4 w-4 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-sm text-gray-400">Position</label>
                            {isEditing ? (
                              <Input
                                value={editedLead.title}
                                onChange={(e) =>
                                  setEditedLead({ ...editedLead, title: e.target.value })
                                }
                                className="mt-1 border-gray-600 bg-gray-700 text-white"
                              />
                            ) : (
                              <div className="group relative mt-1 rounded-md border border-transparent bg-gray-800/50 px-3 py-2 transition-all hover:border-gray-600 hover:bg-gray-700/50">
                                <div className="flex items-center justify-between">
                                  <span className="text-white">{editedLead.title}</span>
                                  <Edit3 className="h-4 w-4 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status and Priority */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm text-gray-400">Status</label>
                            <div className="mt-1">
                              <Select
                                value={editedLead.status}
                                onValueChange={(value: any) => changeStatus(value)}
                              >
                                <SelectTrigger className="border-gray-600 bg-gray-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-gray-600 bg-gray-700">
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="contacted">Contacted</SelectItem>
                                  <SelectItem value="interested">Interested</SelectItem>
                                  <SelectItem value="qualified">Qualified</SelectItem>
                                  <SelectItem value="converted">Converted</SelectItem>
                                  <SelectItem value="unqualified">Unqualified</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm text-gray-400">Priority</label>
                            <div className="mt-1">
                              <Select
                                value={editedLead.priority}
                                onValueChange={(value: any) =>
                                  setEditedLead({ ...editedLead, priority: value })
                                }
                              >
                                <SelectTrigger className="border-gray-600 bg-gray-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-gray-600 bg-gray-700">
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Campaign and Source */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm text-gray-400">Campaign</label>
                            <p className="mt-1 text-white">{editedLead.campaign}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-400">Source</label>
                            <p className="mt-1 text-white">{editedLead.source}</p>
                          </div>
                        </div>

                        {/* Assignment and Lead Quality */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm text-gray-400">Assigned To</label>
                            <div className="mt-1">
                              <Select
                                value={editedLead.assignedToId || 'unassigned'}
                                onValueChange={(value) => {
                                  const member = teamMembers.find((m) => m.id === value);
                                  setEditedLead({
                                    ...editedLead,
                                    assignedToId: value === 'unassigned' ? undefined : value,
                                    assignedTo:
                                      member?.name === 'Unassigned' ? undefined : member?.name,
                                  });
                                }}
                              >
                                <SelectTrigger className="border-gray-600 bg-gray-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-gray-600 bg-gray-700">
                                  {teamMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                      <div className="flex items-center gap-2">
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
                                          {member.name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                        </div>
                                        {member.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm text-gray-400">Lead Quality</label>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge
                                className={
                                  editedLead.leadQuality === 'hot'
                                    ? 'bg-red-500'
                                    : editedLead.leadQuality === 'warm'
                                      ? 'bg-yellow-500'
                                      : editedLead.leadQuality === 'cold'
                                        ? 'bg-blue-500'
                                        : 'bg-gray-500'
                                }
                              >
                                {editedLead.leadQuality || 'Unknown'}
                              </Badge>
                              {editedLead.sentimentScore && (
                                <span className="text-sm text-gray-400">
                                  ({Math.round(editedLead.sentimentScore * 100)}% sentiment)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Original Call Link */}
                        {editedLead.originalCallId && (
                          <div>
                            <label className="text-sm text-gray-400">Original Call</label>
                            <div className="mt-1 flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() =>
                                  window.open(`/calls/${editedLead.originalCallId}`, '_blank')
                                }
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Call {editedLead.originalCallId}
                              </Button>
                              {editedLead.platformCallId && (
                                <span className="font-mono text-xs text-gray-500">
                                  Platform: {editedLead.platformCallId.substring(0, 8)}...
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        <div>
                          <label className="text-sm text-gray-400">Notes</label>
                          {isEditing ? (
                            <Textarea
                              value={editedLead.notes}
                              onChange={(e) =>
                                setEditedLead({ ...editedLead, notes: e.target.value })
                              }
                              className="mt-1 border-gray-600 bg-gray-700 text-white"
                              rows={3}
                            />
                          ) : (
                            <p className="mt-1 text-white">
                              {editedLead.notes || 'No notes added yet.'}
                            </p>
                          )}
                        </div>

                        {isEditing && (
                          <div className="flex gap-2 pt-4">
                            <Button
                              onClick={handleSave}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Save Changes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsEditing(false)}
                              className="border-gray-600 text-gray-300"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions & Score */}
                  <div className="space-y-6">
                    {/* Lead Score */}
                    <Card className="border-gray-700 bg-gray-800/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                          <TrendingUp className="h-5 w-5" />
                          Lead Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${getScoreColor(leadScore)}`}>
                            {leadScore}%
                          </div>
                          <Progress value={leadScore} className="mt-2" />
                          <p className="mt-2 text-sm text-gray-400">
                            {leadScore >= 80
                              ? 'Hot Lead'
                              : leadScore >= 60
                                ? 'Warm Lead'
                                : 'Cold Lead'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="border-gray-700 bg-gray-800/50">
                      <CardHeader>
                        <CardTitle className="text-white">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                          <PhoneCall className="mr-2 h-4 w-4" />
                          Call Now
                        </Button>
                        <Button variant="outline" className="w-full border-gray-600 text-gray-300">
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </Button>
                        <Button variant="outline" className="w-full border-gray-600 text-gray-300">
                          <Calendar className="mr-2 h-4 w-4" />
                          Book Meeting
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Schedule Follow-up */}
                    <Card className="border-gray-700 bg-gray-800/50">
                      <CardHeader>
                        <CardTitle className="text-white">Schedule Follow-up</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input
                          type="datetime-local"
                          value={scheduleDateTime}
                          onChange={(e) => setScheduleDateTime(e.target.value)}
                          className="border-gray-600 bg-gray-700 text-white"
                        />
                        <Button
                          onClick={handleScheduleCall}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Call
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Call History Tab */}
              <TabsContent value="calls" className="mt-0">
                <div className="space-y-4">
                  {mockCalls.map((call) => (
                    <Card key={call.id} className="border-gray-700 bg-gray-800/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <div className="h-3 w-3 rounded-full bg-green-500" />
                              <span className="font-medium text-white">{call.date}</span>
                              <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                {call.duration}
                              </Badge>
                              <Badge
                                className={
                                  call.sentiment === 'positive'
                                    ? 'bg-green-500'
                                    : call.sentiment === 'negative'
                                      ? 'bg-red-500'
                                      : 'bg-gray-500'
                                }
                              >
                                {call.sentiment}
                              </Badge>
                            </div>
                            <p className="mb-2 text-sm text-gray-300">{call.transcript}</p>
                            <p className="text-sm font-medium text-green-400">
                              Outcome: {call.outcome}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {!!call.recording && (
                              <Button size="sm" variant="outline" className="border-gray-600">
                                <PlayCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Notes Tab */}
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
                        <Button onClick={addNote} className="bg-emerald-600 hover:bg-emerald-700">
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
                              note.type === 'call' ? 'bg-emerald-500' : 'bg-gray-500'
                            }`}
                          >
                            {note.type === 'call' ? (
                              <Phone className="h-4 w-4" />
                            ) : (
                              <MessageSquare className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-white">{note.content}</p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                              <span>{note.timestamp}</span>
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
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
