import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useNotifications } from '../lib/notification-store';
import {
  ChevronLeft,
  ChevronDown,
  User,
  Building,
  MapPin,
  FileText,
  Phone,
  Clock,
  TrendingUp,
  Edit3,
  Save,
  X,
  Building2,
  Share2,
  CheckSquare,
  Plus,
  MessageSquare,
  AlertTriangle,
  Calendar,
  Users,
  MoreVertical,
  Trash2,
  CheckCircle,
  Circle,
  Filter,
  Search,
  Tag,
  Paperclip,
  Send,
  Star,
  Archive,
  ExternalLink,
  Copy,
  Bot,
  Bell,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CallLogDetailsModal } from '../components/CallLogDetailsModal';

export default function LeadPage() {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [isPersonalDetailsCollapsed, setIsPersonalDetailsCollapsed] = useState(false);
  const [isAddressInfoCollapsed, setIsAddressInfoCollapsed] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Central lead data - this acts as the main hub for all lead information
  const [leadData, setLeadData] = useState({
    status: 'Qualified',
    customerId: 'CID0623',
    lastActivity: {
      date: 'Mon, Jan 15, 2024 at 1:00 AM',
      type: 'Email sent',
    },
    owner: {
      name: 'John Doe',
      role: 'Sales Manager',
      initials: 'JD',
    },
    personalDetails: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      position: 'Decision Maker',
      website: 'utilitybox.com',
    },
    companyInfo: {
      company: 'Utility Box',
      industry: 'Utilities',
    },
    companyDetails: {
      foundedYear: '2018',
      employees: '50-100',
      revenue: '$5M - $10M',
      headquarters: 'San Francisco, CA',
      description:
        'Leading provider of utility management solutions for residential and commercial properties.',
      website: 'https://utilitybox.com',
      linkedIn: 'https://linkedin.com/company/utilitybox',
      type: 'Private Company',
      tags: ['Energy', 'Software', 'B2B', 'SaaS'],
    },
    socialMedia: {
      linkedin: 'https://linkedin.com/in/johndoe',
      twitter: 'https://twitter.com/johndoe',
      facebook: 'https://facebook.com/john.doe',
      instagram: 'https://instagram.com/johndoe',
      youtube: '',
      tiktok: '',
      github: '',
      website: 'https://johndoe.dev',
    },
    aiCallSummary: "Customer showed strong interest in our enterprise features. Regarding implementation, the customer prefers a phased rollout starting with their core team of 15 users, then expanding to the full organization over 3-4 months. They have dedicated project management resources and are willing to assign a technical lead to work closely with our implementation team. Training is critical as their staff has varying levels of technical expertise. The competitive landscape includes two other vendors they're actively evaluating. One is a legacy solution that's significantly cheaper but lacks modern features. The other is a newer startup with innovative features but concerns about long-term viability. Our solution was positioned as the best balance of reliability, features, and cost. Next steps include scheduling a technical deep-dive demo for next Tuesday at 2 PM EST with their IT Director, CTO, and lead developer. They also requested a detailed implementation timeline and cost breakdown including training and support options. Customer indicated they want to make a final decision by end of January.",
    notes: [
      {
        id: 'note_571135000001729018',
        content:
          "Pramod was primarily interested in social media management & ads and email marketing (want to focus on incoming traffic as they're working on automating everything).\nSean will send a breakdown of the services we can offer them based on what he said they're looking for",
        module: 'Lead',
        recordName: 'Pramod',
        recordId: '571135000001728026',
        createdAt: '2024-09-19T15:40:00Z',
        createdBy: 'Khalid Adib',
        lastUpdated: '2024-09-19T15:40:00Z',
        tag: 'meeting',
      },
      {
        id: 'note_571135000001729019',
        content:
          'Follow-up call scheduled for next week to discuss pricing and implementation timeline. Customer seems very interested in our automation solutions.',
        module: 'Lead',
        recordName: 'Pramod',
        recordId: '571135000001728026',
        createdAt: '2024-09-18T10:30:00Z',
        createdBy: 'Sean Wentz',
        lastUpdated: '2024-09-18T10:30:00Z',
        tag: 'follow-up',
      },
      {
        id: 'note_571135000001729020',
        content:
          'Initial discovery call completed. Budget confirmed at $5k-10k range. Decision maker identified. Next step is technical assessment.',
        module: 'Lead',
        recordName: 'Pramod',
        recordId: '571135000001728026',
        createdAt: '2024-09-17T14:15:00Z',
        createdBy: 'John Doe',
        lastUpdated: '2024-09-17T14:15:00Z',
        tag: 'call',
      },
    ],
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States',
    },
  });

  // Edit states
  const [isEditingPersonalDetails, setIsEditingPersonalDetails] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [isEditingCompanyDetails, setIsEditingCompanyDetails] = useState(false);
  const [isCompanyDetailsCollapsed, setIsCompanyDetailsCollapsed] = useState(false);
  const [isCallResultsCollapsed, setIsCallResultsCollapsed] = useState(false);
  const [isEditingSocialMedia, setIsEditingSocialMedia] = useState(false);
  const [isSocialMediaCollapsed, setIsSocialMediaCollapsed] = useState(false);
  const [isAICallSummaryCollapsed, setIsAICallSummaryCollapsed] = useState(false);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);
  const [notesOrder, setNotesOrder] = useState('Recent Last');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteTag, setNewNoteTag] = useState('general');
  const [noteTagFilter, setNoteTagFilter] = useState('all');
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  // Individual field edit states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldEditValues, setFieldEditValues] = useState<Record<string, any>>({});

  // Temporary edit data
  const [editLeadData, setEditLeadData] = useState(leadData.personalDetails);
  const [editCompanyData, setEditCompanyData] = useState(leadData.companyInfo);
  const [editAddressData, setEditAddressData] = useState(leadData.address);
  const [editOwnerData, setEditOwnerData] = useState(leadData.owner);
  const [editCompanyDetailsData, setEditCompanyDetailsData] = useState(leadData.companyDetails);
  const [editSocialMediaData, setEditSocialMediaData] = useState(leadData.socialMedia);

  // Team members for assignment
  const teamMembers = [
    { id: 'john_doe', name: 'John Doe', role: 'Sales Manager' },
    { id: 'jane_smith', name: 'Jane Smith', role: 'Account Executive' },
    { id: 'sarah_wilson', name: 'Sarah Wilson', role: 'Sales Rep' },
    { id: 'technical_team', name: 'Technical Team', role: 'Technical Support' },
    { id: 'support_team', name: 'Support Team', role: 'Customer Support' },
  ];

  // Dropdown options for company details
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
    'Private Company',
    'Public Company',
    'LLC',
    'Corporation',
    'Partnership',
    'Sole Proprietorship',
    'Non-profit',
    'Government',
    'Startup',
    'Other'
  ];

  // Note tag options
  const noteTagOptions = [
    { value: 'general', label: 'General', color: 'bg-gray-600', textColor: 'text-gray-300' },
    { value: 'task', label: 'Task', color: 'bg-blue-600', textColor: 'text-blue-300' },
    { value: 'meeting', label: 'Meeting', color: 'bg-green-600', textColor: 'text-green-300' },
    { value: 'call', label: 'Call', color: 'bg-purple-600', textColor: 'text-purple-300' },
    { value: 'email', label: 'Email', color: 'bg-orange-600', textColor: 'text-orange-300' },
    { value: 'follow-up', label: 'Follow-up', color: 'bg-yellow-600', textColor: 'text-yellow-300' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-600', textColor: 'text-red-300' },
    { value: 'reminder', label: 'Reminder', color: 'bg-indigo-600', textColor: 'text-indigo-300' }
  ];

  const statusOptions = [
    { value: 'New', color: 'bg-blue-500', textColor: 'text-blue-400' },
    { value: 'Contacted', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
    { value: 'Qualified', color: 'bg-green-500', textColor: 'text-green-400' },
    { value: 'Proposal', color: 'bg-purple-500', textColor: 'text-purple-400' },
    { value: 'Negotiation', color: 'bg-orange-500', textColor: 'text-orange-400' },
    { value: 'Closed Won', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    { value: 'Closed Lost', color: 'bg-red-500', textColor: 'text-red-400' },
    { value: 'On Hold', color: 'bg-gray-500', textColor: 'text-gray-400' },
  ];

  const getCurrentStatus = () =>
    statusOptions.find((status) => status.value === leadData.status) || statusOptions[2];

  const updateLeadStatus = (newStatus: string) => {
    setLeadData((prev) => ({
      ...prev,
      status: newStatus,
      lastActivity: {
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        type: `Status changed to ${newStatus}`,
      },
    }));
    setIsStatusDropdownOpen(false);
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };

    if (isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  // Individual field edit functions
  const startFieldEdit = (fieldKey: string, currentValue: any) => {
    setEditingField(fieldKey);
    setFieldEditValues({ [fieldKey]: currentValue });
  };

  const saveFieldEdit = (fieldKey: string, section: string) => {
    const newValue = fieldEditValues[fieldKey];

    setLeadData((prev) => {
      const updated = { ...prev };
      const keys = fieldKey.split('.');

      if (keys.length === 2) {
        updated[keys[0] as keyof typeof updated] = {
          ...(updated[keys[0] as keyof typeof updated] as any),
          [keys[1]]: newValue,
        };
      } else {
        updated[fieldKey as keyof typeof updated] = newValue as any;
      }

      updated.lastActivity = {
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        type: `${fieldKey} updated`,
      };

      return updated;
    });

    setEditingField(null);
    setFieldEditValues({});
  };

  const cancelFieldEdit = () => {
    setEditingField(null);
    setFieldEditValues({});
  };

  // Edit functions
  const handleEditPersonalDetails = () => {
    setEditLeadData(leadData.personalDetails);
    setIsEditingPersonalDetails(true);
  };

  const handleSavePersonalDetails = () => {
    setLeadData((prev) => ({
      ...prev,
      personalDetails: editLeadData,
      lastActivity: {
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        type: 'Personal details updated',
      },
    }));
    setIsEditingPersonalDetails(false);
  };

  const handleCancelPersonalDetails = () => {
    setEditLeadData(leadData.personalDetails);
    setIsEditingPersonalDetails(false);
  };

  const handleEditAddress = () => {
    setEditAddressData(leadData.address);
    setIsEditingAddress(true);
  };

  const handleSaveAddress = () => {
    setLeadData((prev) => ({
      ...prev,
      address: editAddressData,
      lastActivity: {
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        type: 'Address updated',
      },
    }));
    setIsEditingAddress(false);
  };

  const handleCancelAddress = () => {
    setEditAddressData(leadData.address);
    setIsEditingAddress(false);
  };

  const handleEditOwner = () => {
    setEditOwnerData(leadData.owner);
    setIsEditingOwner(true);
  };

  const handleSaveOwner = () => {
    setLeadData((prev) => ({
      ...prev,
      owner: editOwnerData,
      lastActivity: {
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        type: 'Lead owner updated',
      },
    }));
    setIsEditingOwner(false);
  };

  const handleCancelOwner = () => {
    setEditOwnerData(leadData.owner);
    setIsEditingOwner(false);
  };

  const handleEditCompanyDetails = () => {
    setEditCompanyDetailsData(leadData.companyDetails);
    setIsEditingCompanyDetails(true);
  };

  const handleSaveCompanyDetails = () => {
    setLeadData((prev) => ({
      ...prev,
      companyDetails: editCompanyDetailsData,
      lastActivity: {
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        type: 'Company details updated',
      },
    }));
    setIsEditingCompanyDetails(false);
  };

  const handleCancelCompanyDetails = () => {
    setEditCompanyDetailsData(leadData.companyDetails);
    setIsEditingCompanyDetails(false);
  };

  const handleEditSocialMedia = () => {
    setEditSocialMediaData(leadData.socialMedia);
    setIsEditingSocialMedia(true);
  };

  const handleSaveSocialMedia = () => {
    setLeadData((prev) => ({
      ...prev,
      socialMedia: editSocialMediaData,
      lastActivity: {
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        type: 'Social media updated',
      },
    }));
    setIsEditingSocialMedia(false);
  };

  const handleCancelSocialMedia = () => {
    setEditSocialMediaData(leadData.socialMedia);
    setIsEditingSocialMedia(false);
  };

  // AI Call Summary copy function
  const handleCopyAICallSummary = async () => {
    try {
      await navigator.clipboard.writeText(leadData.aiCallSummary);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy AI Call Summary:', err);
    }
  };

  // Notes helper functions
  const formatNoteDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatNoteTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const newNote = {
      id: `note_${Date.now()}`,
      content: newNoteContent,
      module: 'Lead',
      recordName: leadData.personalDetails.firstName + ' ' + leadData.personalDetails.lastName,
      recordId: 'lead_current',
      createdAt: new Date().toISOString(),
      createdBy: 'Current User',
      lastUpdated: new Date().toISOString(),
      tag: newNoteTag,
    };

    // If it's a reminder and date/time are set, schedule the reminder
    if (newNoteTag === 'reminder' && reminderDate && reminderTime) {
      const reminderDateTime = new Date(`${reminderDate}T${reminderTime}`);
      createReminder(newNoteContent, reminderDateTime);
      
      // Add reminder info to the note content
      newNote.content = `${newNoteContent}\n\n⏰ Reminder set for: ${reminderDateTime.toLocaleString()}`;
    }

    setLeadData((prev) => ({
      ...prev,
      notes: [newNote, ...prev.notes],
      lastActivity: {
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        type: 'Note added',
      },
    }));

    setNewNoteContent('');
    setNewNoteTag('general');
    setReminderDate('');
    setReminderTime('');
    setShowReminderOptions(false);
    setIsAddingNote(false);
  };

  const handleDeleteNote = (noteId: string) => {
    setLeadData((prev) => ({
      ...prev,
      notes: prev.notes.filter((note) => note.id !== noteId),
      lastActivity: {
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        type: 'Note deleted',
      },
    }));
  };

  const getSortedNotes = () => {
    let notes = [...leadData.notes];
    
    // Filter by tag if not 'all'
    if (noteTagFilter !== 'all') {
      notes = notes.filter(note => note.tag === noteTagFilter);
    }
    
    // Sort by date
    if (notesOrder === 'Recent First') {
      return notes.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      return notes.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
  };

  const getTagConfig = (tagValue: string) => {
    return noteTagOptions.find(option => option.value === tagValue) || noteTagOptions[0];
  };

  const createReminder = (content: string, reminderDateTime: Date) => {
    const leadName = `${leadData.personalDetails.firstName} ${leadData.personalDetails.lastName}`;
    const timeUntilReminder = reminderDateTime.getTime() - Date.now();
    
    if (timeUntilReminder > 0) {
      setTimeout(() => {
        notifications.info(
          'Reminder',
          `${content}`,
          {
            category: 'system',
            source: 'leads',
            priority: 'medium',
            persistent: true,
            metadata: {
              leadId: leadData.personalDetails.firstName + leadData.personalDetails.lastName,
              leadName,
              type: 'reminder',
              originalContent: content,
              scheduledFor: reminderDateTime.toISOString(),
            },
            action: {
              label: 'View Lead',
              href: `/leads/${leadData.personalDetails.firstName}`,
            },
          }
        );
      }, timeUntilReminder);
    }
  };

  // Show reminder options when reminder tag is selected
  useEffect(() => {
    setShowReminderOptions(newNoteTag === 'reminder');
  }, [newNoteTag]);

  // Mock call results data
  const callResults = [
    {
      id: 'call_001',
      date: '2024-01-15',
      time: '1:00 PM',
      duration: '7:36',
      outcome: 'Qualified',
      sentiment: 'Positive',
      cost: '$2.45',
      status: 'completed',
    },
    {
      id: 'call_002',
      date: '2024-01-12',
      time: '3:30 PM',
      duration: '4:22',
      outcome: 'Follow-up',
      sentiment: 'Neutral',
      cost: '$1.80',
      status: 'completed',
    },
    {
      id: 'call_003',
      date: '2024-01-10',
      time: '11:15 AM',
      duration: '2:15',
      outcome: 'No Answer',
      sentiment: 'N/A',
      cost: '$0.35',
      status: 'failed',
    },
  ];

  const handleCallClick = (call: any) => {
    // Transform call data to match CallLogDetailsModal expected format
    const callData = {
      id: call.id,
      duration: parseInt(call.duration.split(':')[0]) * 60 + parseInt(call.duration.split(':')[1]), // Convert "7:36" to seconds
      transcript: [
        { speaker: 'user' as const, text: 'Hello? Alright.' },
        { speaker: 'ai' as const, text: 'Hello. Is it possible to speak to Harris, please?' },
        { speaker: 'user' as const, text: 'Speaking.' },
        {
          speaker: 'ai' as const,
          text: 'Hi, Harris. This is Joanne calling from Emerald Green Energy. You spoke to 1 of our reps who was in your area about solar energy for your property. Does that sound familiar?',
        },
        { speaker: 'user' as const, text: 'Yes. That sounds familiar.' },
        {
          speaker: 'ai' as const,
          text: "Great. Thanks for confirming. I hope you've been enjoying the nice weather. So just to check, was solar something you'd considered before our rep visit? Or was it more of a new idea when they spoke to you?",
        },
      ],
      recording: '/mock-audio.wav',
      analysis: {
        sentiment: call.sentiment === 'Positive' ? 0.75 : call.sentiment === 'Neutral' ? 0.5 : 0.25,
        keywords: ['solar energy', 'property', 'rep visit'],
        summary: `Call with ${call.outcome.toLowerCase()} outcome. Duration: ${call.duration}`,
      },
      cost: parseFloat(call.cost.replace('$', '')),
      messages: [
        {
          type: 'info',
          content: `Call initiated at ${call.time}`,
          timestamp: Date.now() - 86400000,
        },
        {
          type: 'success',
          content: `Call completed with ${call.outcome} outcome`,
          timestamp: Date.now(),
        },
      ],
    };

    setSelectedCall(callData);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-30 flex-shrink-0 border-b border-gray-800 bg-gray-900/90">
        <div className="px-6 py-4">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/crm')}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to CRM
            </Button>
          </div>
        </div>
      </div>

      {/* Lead Detail Content */}
      <div className="flex-1 p-6">
        {/* Lead Overview Section */}
        <div className="mb-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Lead Overview</h3>
          </div>

          {/* Overview Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Lead Status Card */}
            <div
              className="relative rounded-xl border border-gray-700/50 bg-gray-800/50 p-4"
              ref={statusDropdownRef}
            >
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">Lead Status</h4>
                <div
                  className="-m-2 flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-700/30"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                >
                  <div className={`h-2 w-2 rounded-full ${getCurrentStatus().color}`}></div>
                  <span className="font-medium text-white">{leadData.status}</span>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Dropdown Menu */}
                {isStatusDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
                    <div className="space-y-1 p-2">
                      {statusOptions.map((status) => (
                        <div
                          key={status.value}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors ${
                            leadData.status === status.value
                              ? 'bg-gray-700/50'
                              : 'hover:bg-gray-700/30'
                          }`}
                          onClick={() => updateLeadStatus(status.value)}
                        >
                          <div className={`h-2 w-2 rounded-full ${status.color}`}></div>
                          <span className={`font-medium ${status.textColor}`}>{status.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer ID Card */}
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">Customer ID</h4>
                <span className="font-mono text-lg text-white">{leadData.customerId}</span>
              </div>
            </div>

            {/* Last Activity Card */}
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-400">Last Activity</h4>
                <div className="space-y-1">
                  <div className="font-medium text-white">{leadData.lastActivity.date}</div>
                  <div className="text-sm text-gray-400">{leadData.lastActivity.type}</div>
                </div>
              </div>
            </div>

            {/* Lead Owner Card */}
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-400">Lead Owner</h4>
                  {!isEditingOwner ? (
                    <button
                      onClick={handleEditOwner}
                      className="text-gray-500 transition-colors hover:text-gray-300"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveOwner}
                        className="text-green-500 transition-colors hover:text-green-400"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelOwner}
                        className="text-red-500 transition-colors hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {!isEditingOwner ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                      <span className="text-sm font-medium text-white">
                        {leadData.owner.initials}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{leadData.owner.name}</div>
                      <div className="text-sm text-gray-400">{leadData.owner.role}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editOwnerData.name}
                      onChange={(e) =>
                        setEditOwnerData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Owner Name"
                    />
                    <input
                      type="text"
                      value={editOwnerData.role}
                      onChange={(e) =>
                        setEditOwnerData((prev) => ({ ...prev, role: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Role"
                    />
                    <input
                      type="text"
                      value={editOwnerData.initials}
                      onChange={(e) =>
                        setEditOwnerData((prev) => ({ ...prev, initials: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Initials"
                      maxLength={3}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className={`${isPersonalDetailsCollapsed ? 'mb-3' : 'mb-6'} rounded-xl border border-gray-700/50 bg-gray-800/50`}>
          <div className={`${isPersonalDetailsCollapsed ? 'p-4' : 'p-6'}`}>
            <div className={`${isPersonalDetailsCollapsed ? 'mb-0' : 'mb-6'} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Personal Details</h3>
              </div>
              <div className="flex items-center gap-2">
                {!isPersonalDetailsCollapsed && isEditingPersonalDetails && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSavePersonalDetails}
                      className="text-green-500 transition-colors hover:text-green-400"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleCancelPersonalDetails}
                      className="text-red-500 transition-colors hover:text-red-400"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setIsPersonalDetailsCollapsed(!isPersonalDetailsCollapsed)}
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${isPersonalDetailsCollapsed ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {!isPersonalDetailsCollapsed && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* First Name */}
                  <div className="group space-y-2">
                      <label className="text-sm text-gray-400">First Name</label>
                      {editingField !== 'personalDetails.firstName' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-medium text-white">
                              {leadData.personalDetails.firstName}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'personalDetails.firstName',
                                  leadData.personalDetails.firstName
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={fieldEditValues['personalDetails.firstName'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'personalDetails.firstName': e.target.value,
                              }))
                            }
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('personalDetails.firstName', 'personalDetails')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                  {/* Last Name */}
                  <div className="group space-y-2">
                      <label className="text-sm text-gray-400">Last Name</label>
                      {editingField !== 'personalDetails.lastName' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-medium text-white">
                              {leadData.personalDetails.lastName}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'personalDetails.lastName',
                                  leadData.personalDetails.lastName
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={fieldEditValues['personalDetails.lastName'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'personalDetails.lastName': e.target.value,
                              }))
                            }
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('personalDetails.lastName', 'personalDetails')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Email */}
                    <div className="group space-y-2">
                      <label className="text-sm text-gray-400">Email</label>
                      {editingField !== 'personalDetails.email' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-white">
                              {leadData.personalDetails.email}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'personalDetails.email',
                                  leadData.personalDetails.email
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={fieldEditValues['personalDetails.email'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'personalDetails.email': e.target.value,
                              }))
                            }
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('personalDetails.email', 'personalDetails')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="group space-y-2">
                      <label className="text-sm text-gray-400">Phone</label>
                      {editingField !== 'personalDetails.phone' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-white">
                              {leadData.personalDetails.phone}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'personalDetails.phone',
                                  leadData.personalDetails.phone
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            value={fieldEditValues['personalDetails.phone'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'personalDetails.phone': e.target.value,
                              }))
                            }
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('personalDetails.phone', 'personalDetails')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Position */}
                    <div className="group space-y-2">
                      <label className="text-sm text-gray-400">Position</label>
                      {editingField !== 'personalDetails.position' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-white">
                              {leadData.personalDetails.position}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'personalDetails.position',
                                  leadData.personalDetails.position
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={fieldEditValues['personalDetails.position'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'personalDetails.position': e.target.value,
                              }))
                            }
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('personalDetails.position', 'personalDetails')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Website */}
                    <div className="group space-y-2">
                      <label className="text-sm text-gray-400">Website</label>
                      {editingField !== 'personalDetails.website' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-white">
                              {leadData.personalDetails.website}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'personalDetails.website',
                                  leadData.personalDetails.website
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={fieldEditValues['personalDetails.website'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'personalDetails.website': e.target.value,
                              }))
                            }
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('personalDetails.website', 'personalDetails')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="mt-8 border-t border-gray-700/50 pt-6">
                    <div className="mb-4 flex items-center gap-3">
                      <Building className="h-4 w-4 text-purple-500" />
                      <h4 className="font-medium text-white">Company Information</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Company */}
                      <div className="group space-y-2">
                        <label className="text-sm text-gray-400">Company</label>
                        {editingField !== 'companyInfo.company' ? (
                          <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-white">
                                {leadData.companyInfo.company}
                              </div>
                              <button
                                onClick={() =>
                                  startFieldEdit('companyInfo.company', leadData.companyInfo.company)
                                }
                                className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={fieldEditValues['companyInfo.company'] || ''}
                              onChange={(e) =>
                                setFieldEditValues((prev) => ({
                                  ...prev,
                                  'companyInfo.company': e.target.value,
                                }))
                              }
                              className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => saveFieldEdit('companyInfo.company', 'companyInfo')}
                              className="p-2 text-green-500 transition-colors hover:text-green-400"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelFieldEdit}
                              className="p-2 text-red-500 transition-colors hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Industry */}
                      <div className="group space-y-2">
                        <label className="text-sm text-gray-400">Industry</label>
                        {editingField !== 'companyInfo.industry' ? (
                          <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-white">
                                {leadData.companyInfo.industry}
                              </div>
                              <button
                                onClick={() =>
                                  startFieldEdit(
                                    'companyInfo.industry',
                                    leadData.companyInfo.industry
                                  )
                                }
                                className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={fieldEditValues['companyInfo.industry'] || ''}
                              onChange={(e) =>
                                setFieldEditValues((prev) => ({
                                  ...prev,
                                  'companyInfo.industry': e.target.value,
                                }))
                              }
                              className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => saveFieldEdit('companyInfo.industry', 'companyInfo')}
                              className="p-2 text-green-500 transition-colors hover:text-green-400"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelFieldEdit}
                              className="p-2 text-red-500 transition-colors hover:text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Address Information */}
        <div className={`${isAddressInfoCollapsed ? 'mb-3' : 'mb-6'} rounded-xl border border-gray-700/50 bg-gray-800/50`}>
          <div className={`${isAddressInfoCollapsed ? 'p-4' : 'p-6'}`}>
            <div className={`${isAddressInfoCollapsed ? 'mb-0' : 'mb-6'} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-white">Address Information</h3>
              </div>
              <div className="flex items-center gap-2">
                {!isAddressInfoCollapsed && isEditingAddress && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveAddress}
                      className="text-green-500 transition-colors hover:text-green-400"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleCancelAddress}
                      className="text-red-500 transition-colors hover:text-red-400"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setIsAddressInfoCollapsed(!isAddressInfoCollapsed)}
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${isAddressInfoCollapsed ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {!isAddressInfoCollapsed && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Street Address */}
                <div className="group space-y-2 md:col-span-2">
                  <label className="text-sm text-gray-400">Street Address</label>
                  {editingField !== 'address.street' ? (
                    <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-white">{leadData.address.street}</div>
                        <button
                          onClick={() => startFieldEdit('address.street', leadData.address.street)}
                          className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={fieldEditValues['address.street'] || ''}
                        onChange={(e) =>
                          setFieldEditValues((prev) => ({
                            ...prev,
                            'address.street': e.target.value,
                          }))
                        }
                        className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => saveFieldEdit('address.street', 'address')}
                        className="p-2 text-green-500 transition-colors hover:text-green-400"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelFieldEdit}
                        className="p-2 text-red-500 transition-colors hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* City */}
                <div className="group space-y-2">
                  <label className="text-sm text-gray-400">City</label>
                  {editingField !== 'address.city' ? (
                    <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-white">{leadData.address.city}</div>
                        <button
                          onClick={() => startFieldEdit('address.city', leadData.address.city)}
                          className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={fieldEditValues['address.city'] || ''}
                        onChange={(e) =>
                          setFieldEditValues((prev) => ({
                            ...prev,
                            'address.city': e.target.value,
                          }))
                        }
                        className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => saveFieldEdit('address.city', 'address')}
                        className="p-2 text-green-500 transition-colors hover:text-green-400"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelFieldEdit}
                        className="p-2 text-red-500 transition-colors hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* State */}
                <div className="group space-y-2">
                  <label className="text-sm text-gray-400">State</label>
                  {!isEditingAddress ? (
                    <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-white">{leadData.address.state}</div>
                        <button
                          onClick={() => {
                            setEditAddressData(leadData.address);
                            setIsEditingAddress(true);
                          }}
                          className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editAddressData.state}
                      onChange={(e) =>
                        setEditAddressData((prev) => ({ ...prev, state: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* ZIP Code */}
                <div className="group space-y-2">
                  <label className="text-sm text-gray-400">ZIP Code</label>
                  {!isEditingAddress ? (
                    <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-white">{leadData.address.zipCode}</div>
                        <button
                          onClick={() => {
                            setEditAddressData(leadData.address);
                            setIsEditingAddress(true);
                          }}
                          className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editAddressData.zipCode}
                      onChange={(e) =>
                        setEditAddressData((prev) => ({ ...prev, zipCode: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Country */}
                <div className="group space-y-2">
                  <label className="text-sm text-gray-400">Country</label>
                  {!isEditingAddress ? (
                    <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-white">{leadData.address.country}</div>
                        <button
                          onClick={() => {
                            setEditAddressData(leadData.address);
                            setIsEditingAddress(true);
                          }}
                          className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editAddressData.country}
                      onChange={(e) =>
                        setEditAddressData((prev) => ({ ...prev, country: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Company Details Section */}
        <div className={`${isCompanyDetailsCollapsed ? 'mb-3' : 'mb-6'} rounded-xl border border-gray-700/50 bg-gray-800/50`}>
          <div className={`${isCompanyDetailsCollapsed ? 'p-4' : 'p-6'}`}>
            <div className={`${isCompanyDetailsCollapsed ? 'mb-0' : 'mb-6'} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Company Details</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCompanyDetailsCollapsed(!isCompanyDetailsCollapsed)}
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${isCompanyDetailsCollapsed ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {!isCompanyDetailsCollapsed && (
              <div className="space-y-6">
                {/* Basic Company Info */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Founded Year */}
                  <div className="group space-y-2">
                    <label className="text-sm text-gray-400">Founded Year</label>
                    {editingField !== 'companyDetails.foundedYear' ? (
                      <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-white">
                            {leadData.companyDetails.foundedYear}
                          </div>
                          <button
                            onClick={() =>
                              startFieldEdit(
                                'companyDetails.foundedYear',
                                leadData.companyDetails.foundedYear
                              )
                            }
                            className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={fieldEditValues['companyDetails.foundedYear'] || ''}
                          onChange={(e) =>
                            setFieldEditValues((prev) => ({
                              ...prev,
                              'companyDetails.foundedYear': e.target.value,
                            }))
                          }
                          className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() =>
                            saveFieldEdit('companyDetails.foundedYear', 'companyDetails')
                          }
                          className="p-2 text-green-500 transition-colors hover:text-green-400"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelFieldEdit}
                          className="p-2 text-red-500 transition-colors hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Employees */}
                  <div className="group space-y-2">
                    <label className="text-sm text-gray-400">Employees</label>
                    {editingField !== 'companyDetails.employees' ? (
                      <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-white">
                            {leadData.companyDetails.employees}
                          </div>
                          <button
                            onClick={() =>
                              startFieldEdit(
                                'companyDetails.employees',
                                leadData.companyDetails.employees
                              )
                            }
                            className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          value={fieldEditValues['companyDetails.employees'] || ''}
                          onValueChange={(value) =>
                            setFieldEditValues((prev) => ({
                              ...prev,
                              'companyDetails.employees': value,
                            }))
                          }
                        >
                          <SelectTrigger className="flex-1 bg-gray-700 border-gray-600 text-white focus:border-blue-500">
                            <SelectValue placeholder="Select employee count" />
                          </SelectTrigger>
                          <SelectContent>
                            {employeeOptions.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() =>
                            saveFieldEdit('companyDetails.employees', 'companyDetails')
                          }
                          className="p-2 text-green-500 transition-colors hover:text-green-400"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelFieldEdit}
                          className="p-2 text-red-500 transition-colors hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Revenue */}
                  <div className="group space-y-2">
                    <label className="text-sm text-gray-400">Annual Revenue</label>
                    {editingField !== 'companyDetails.revenue' ? (
                      <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-white">
                            {leadData.companyDetails.revenue}
                          </div>
                          <button
                            onClick={() =>
                              startFieldEdit(
                                'companyDetails.revenue',
                                leadData.companyDetails.revenue
                              )
                            }
                            className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          value={fieldEditValues['companyDetails.revenue'] || ''}
                          onValueChange={(value) =>
                            setFieldEditValues((prev) => ({
                              ...prev,
                              'companyDetails.revenue': value,
                            }))
                          }
                        >
                          <SelectTrigger className="flex-1 bg-gray-700 border-gray-600 text-white focus:border-blue-500">
                            <SelectValue placeholder="Select revenue range" />
                          </SelectTrigger>
                          <SelectContent>
                            {revenueOptions.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() =>
                            saveFieldEdit('companyDetails.revenue', 'companyDetails')
                          }
                          className="p-2 text-green-500 transition-colors hover:text-green-400"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelFieldEdit}
                          className="p-2 text-red-500 transition-colors hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Headquarters */}
                  <div className="group space-y-2">
                    <label className="text-sm text-gray-400">Headquarters</label>
                    {editingField !== 'companyDetails.headquarters' ? (
                      <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-white">
                            {leadData.companyDetails.headquarters}
                          </div>
                          <button
                            onClick={() =>
                              startFieldEdit(
                                'companyDetails.headquarters',
                                leadData.companyDetails.headquarters
                              )
                            }
                            className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={fieldEditValues['companyDetails.headquarters'] || ''}
                          onChange={(e) =>
                            setFieldEditValues((prev) => ({
                              ...prev,
                              'companyDetails.headquarters': e.target.value,
                            }))
                          }
                          className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() =>
                            saveFieldEdit('companyDetails.headquarters', 'companyDetails')
                          }
                          className="p-2 text-green-500 transition-colors hover:text-green-400"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelFieldEdit}
                          className="p-2 text-red-500 transition-colors hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Company Type */}
                  <div className="group space-y-2">
                    <label className="text-sm text-gray-400">Company Type</label>
                    {editingField !== 'companyDetails.type' ? (
                      <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-white">{leadData.companyDetails.type}</div>
                          <button
                            onClick={() =>
                              startFieldEdit(
                                'companyDetails.type',
                                leadData.companyDetails.type
                              )
                            }
                            className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          value={fieldEditValues['companyDetails.type'] || ''}
                          onValueChange={(value) =>
                            setFieldEditValues((prev) => ({
                              ...prev,
                              'companyDetails.type': value,
                            }))
                          }
                        >
                          <SelectTrigger className="flex-1 bg-gray-700 border-gray-600 text-white focus:border-blue-500">
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
                        <button
                          onClick={() =>
                            saveFieldEdit('companyDetails.type', 'companyDetails')
                          }
                          className="p-2 text-green-500 transition-colors hover:text-green-400"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelFieldEdit}
                          className="p-2 text-red-500 transition-colors hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Website */}
                  <div className="group space-y-2">
                    <label className="text-sm text-gray-400">Company Website</label>
                    {editingField !== 'companyDetails.website' ? (
                      <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-white">
                            <a
                              href={leadData.companyDetails.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 transition-colors hover:text-blue-300"
                            >
                              {leadData.companyDetails.website}
                            </a>
                          </div>
                          <button
                            onClick={() => startFieldEdit('companyDetails.website', leadData.companyDetails.website)}
                            className="opacity-0 text-gray-400 transition-opacity group-hover:opacity-100 hover:text-white"
                          >
                            <Edit3 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={fieldEditValues['companyDetails.website'] || ''}
                          onChange={(e) =>
                            setFieldEditValues((prev) => ({
                              ...prev,
                              'companyDetails.website': e.target.value,
                            }))
                          }
                          className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={() =>
                            saveFieldEdit('companyDetails.website', 'companyDetails')
                          }
                          className="p-2 text-green-500 transition-colors hover:text-green-400"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelFieldEdit}
                          className="p-2 text-red-500 transition-colors hover:text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="group space-y-2">
                  <label className="text-sm text-gray-400">Company Description</label>
                  {editingField !== 'companyDetails.description' ? (
                    <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                      <div className="flex items-start justify-between">
                        <div className="font-medium leading-relaxed text-white pr-8">
                          {leadData.companyDetails.description}
                        </div>
                        <button
                          onClick={() =>
                            startFieldEdit(
                              'companyDetails.description',
                              leadData.companyDetails.description
                            )
                          }
                          className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100 flex-shrink-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <textarea
                        value={fieldEditValues['companyDetails.description'] || ''}
                        onChange={(e) =>
                          setFieldEditValues((prev) => ({
                            ...prev,
                            'companyDetails.description': e.target.value,
                          }))
                        }
                        rows={3}
                        className="flex-1 resize-none rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() =>
                            saveFieldEdit('companyDetails.description', 'companyDetails')
                          }
                          className="p-2 text-green-500 transition-colors hover:text-green-400"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelFieldEdit}
                          className="p-2 text-red-500 transition-colors hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>


                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Industry Tags</label>
                  {!isEditingCompanyDetails ? (
                    <div className="flex flex-wrap gap-2">
                      {leadData.companyDetails.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editCompanyDetailsData.tags.join(', ')}
                      onChange={(e) =>
                        setEditCompanyDetailsData((prev) => ({
                          ...prev,
                          tags: e.target.value.split(', ').filter((tag) => tag.trim()),
                        }))
                      }
                      placeholder="Enter tags separated by commas"
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Social Media Section */}
        <div className={`${isSocialMediaCollapsed ? 'mb-3' : 'mb-6'} rounded-xl border border-gray-700/50 bg-gray-800/50`}>
          <div className={`${isSocialMediaCollapsed ? 'p-4' : 'p-6'}`}>
            <div className={`${isSocialMediaCollapsed ? 'mb-0' : 'mb-6'} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-white">Social Media Profiles</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSocialMediaCollapsed(!isSocialMediaCollapsed)}
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${isSocialMediaCollapsed ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {!isSocialMediaCollapsed && (
              <div className="space-y-6">
                {/* Professional Networks */}
                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-400">
                    <Building className="h-4 w-4" />
                    Professional Networks
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* LinkedIn */}
                    <div className="group space-y-2">
                      <label className="text-sm text-gray-400">LinkedIn</label>
                      {editingField !== 'socialMedia.linkedin' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-white">
                              {leadData.socialMedia.linkedin ? (
                                <a
                                  href={leadData.socialMedia.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 transition-colors hover:text-blue-300"
                                >
                                  {leadData.socialMedia.linkedin}
                                </a>
                              ) : (
                                <span className="text-gray-500">Not provided</span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'socialMedia.linkedin',
                                  leadData.socialMedia.linkedin || ''
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={fieldEditValues['socialMedia.linkedin'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'socialMedia.linkedin': e.target.value,
                              }))
                            }
                            placeholder="https://linkedin.com/in/username"
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('socialMedia.linkedin', 'socialMedia')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* GitHub */}
                    <div className="group space-y-2">
                      <label className="text-sm text-gray-400">GitHub</label>
                      {editingField !== 'socialMedia.github' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-white">
                              {leadData.socialMedia.github ? (
                                <a
                                  href={leadData.socialMedia.github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 transition-colors hover:text-blue-300"
                                >
                                  {leadData.socialMedia.github}
                                </a>
                              ) : (
                                <span className="text-gray-500">Not provided</span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'socialMedia.github',
                                  leadData.socialMedia.github || ''
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={fieldEditValues['socialMedia.github'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'socialMedia.github': e.target.value,
                              }))
                            }
                            placeholder="https://github.com/username"
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('socialMedia.github', 'socialMedia')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Social Networks */}
                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-400">
                    <User className="h-4 w-4" />
                    Social Networks
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Twitter */}
                    <div className="group space-y-2">
                      <label className="text-sm text-gray-400">Twitter</label>
                      {editingField !== 'socialMedia.twitter' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-white">
                              {leadData.socialMedia.twitter ? (
                                <a
                                  href={leadData.socialMedia.twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 transition-colors hover:text-blue-300"
                                >
                                  {leadData.socialMedia.twitter}
                                </a>
                              ) : (
                                <span className="text-gray-500">Not provided</span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'socialMedia.twitter',
                                  leadData.socialMedia.twitter || ''
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={fieldEditValues['socialMedia.twitter'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'socialMedia.twitter': e.target.value,
                              }))
                            }
                            placeholder="https://twitter.com/username"
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('socialMedia.twitter', 'socialMedia')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Facebook */}
                    <div className="group space-y-2">
                      <label className="text-sm text-gray-400">Facebook</label>
                      {editingField !== 'socialMedia.facebook' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-white">
                              {leadData.socialMedia.facebook ? (
                                <a
                                  href={leadData.socialMedia.facebook}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 transition-colors hover:text-blue-300"
                                >
                                  {leadData.socialMedia.facebook}
                                </a>
                              ) : (
                                <span className="text-gray-500">Not provided</span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'socialMedia.facebook',
                                  leadData.socialMedia.facebook || ''
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={fieldEditValues['socialMedia.facebook'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'socialMedia.facebook': e.target.value,
                              }))
                            }
                            placeholder="https://facebook.com/username"
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('socialMedia.facebook', 'socialMedia')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Instagram */}
                    <div className="group space-y-2">
                      <label className="text-sm text-gray-400">Instagram</label>
                      {editingField !== 'socialMedia.instagram' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-white">
                              {leadData.socialMedia.instagram ? (
                                <a
                                  href={leadData.socialMedia.instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 transition-colors hover:text-blue-300"
                                >
                                  {leadData.socialMedia.instagram}
                                </a>
                              ) : (
                                <span className="text-gray-500">Not provided</span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'socialMedia.instagram',
                                  leadData.socialMedia.instagram || ''
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={fieldEditValues['socialMedia.instagram'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'socialMedia.instagram': e.target.value,
                              }))
                            }
                            placeholder="https://instagram.com/username"
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('socialMedia.instagram', 'socialMedia')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* TikTok */}
                    <div className="group space-y-2">
                      <label className="text-sm text-gray-400">TikTok</label>
                      {editingField !== 'socialMedia.tiktok' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-white">
                              {leadData.socialMedia.tiktok ? (
                                <a
                                  href={leadData.socialMedia.tiktok}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 transition-colors hover:text-blue-300"
                                >
                                  {leadData.socialMedia.tiktok}
                                </a>
                              ) : (
                                <span className="text-gray-500">Not provided</span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'socialMedia.tiktok',
                                  leadData.socialMedia.tiktok || ''
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={fieldEditValues['socialMedia.tiktok'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'socialMedia.tiktok': e.target.value,
                              }))
                            }
                            placeholder="https://tiktok.com/@username"
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('socialMedia.tiktok', 'socialMedia')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video Platforms */}
                <div>
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-400">
                    <FileText className="h-4 w-4" />
                    Video Platforms
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* YouTube */}
                    <div className="group space-y-2">
                      <label className="text-sm text-gray-400">YouTube</label>
                      {editingField !== 'socialMedia.youtube' ? (
                        <div className="relative rounded-lg border border-transparent bg-gray-800/50 px-3 py-2 transition-all group-hover:border-gray-600 group-hover:bg-gray-700/50">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-white">
                              {leadData.socialMedia.youtube ? (
                                <a
                                  href={leadData.socialMedia.youtube}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 transition-colors hover:text-blue-300"
                                >
                                  {leadData.socialMedia.youtube}
                                </a>
                              ) : (
                                <span className="text-gray-500">Not provided</span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                startFieldEdit(
                                  'socialMedia.youtube',
                                  leadData.socialMedia.youtube || ''
                                )
                              }
                              className="text-gray-500 opacity-0 transition-all duration-200 hover:text-gray-300 group-hover:opacity-100"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={fieldEditValues['socialMedia.youtube'] || ''}
                            onChange={(e) =>
                              setFieldEditValues((prev) => ({
                                ...prev,
                                'socialMedia.youtube': e.target.value,
                              }))
                            }
                            placeholder="https://youtube.com/channel/..."
                            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              saveFieldEdit('socialMedia.youtube', 'socialMedia')
                            }
                            className="p-2 text-green-500 transition-colors hover:text-green-400"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelFieldEdit}
                            className="p-2 text-red-500 transition-colors hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Personal Website */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400">Personal Website</label>
                      {!isEditingSocialMedia ? (
                        <div className="font-medium text-white">
                          {leadData.socialMedia.website ? (
                            <a
                              href={leadData.socialMedia.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 transition-colors hover:text-blue-300"
                            >
                              {leadData.socialMedia.website}
                            </a>
                          ) : (
                            <span className="text-gray-500">Not provided</span>
                          )}
                        </div>
                      ) : (
                        <input
                          type="url"
                          value={editSocialMediaData.website}
                          onChange={(e) =>
                            setEditSocialMediaData((prev) => ({ ...prev, website: e.target.value }))
                          }
                          placeholder="https://personal-website.com"
                          className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Call Summary Section */}
        <div className={`${isAICallSummaryCollapsed ? 'mb-3' : 'mb-6'} rounded-xl border border-gray-700/50 bg-gray-800/50`}>
          <div className="p-6">
            <div className={`${isAICallSummaryCollapsed ? 'mb-0' : 'mb-6'} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-white">AI Call Summary</h3>
              </div>
              <div className="flex items-center gap-2">
                {!isAICallSummaryCollapsed && (
                  <button
                    onClick={handleCopyAICallSummary}
                    className="flex items-center gap-2 rounded-lg bg-gray-700/50 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600/50 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </button>
                )}
                <button
                  onClick={() => setIsAICallSummaryCollapsed(!isAICallSummaryCollapsed)}
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${isAICallSummaryCollapsed ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {!isAICallSummaryCollapsed && (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 p-4">
                  <p className="leading-relaxed text-gray-300">
                    {leadData.aiCallSummary}
                  </p>
                </div>
                
                {/* Additional metadata could go here */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Generated from last call</span>
                  <span>•</span>
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div className={`${isNotesCollapsed ? 'mb-3' : 'mb-6'} rounded-xl border border-gray-700/50 bg-gray-800/50`}>
          <div className={`${isNotesCollapsed ? 'p-4' : 'p-6'}`}>
            {/* Notes Header */}
            <div className={`${isNotesCollapsed ? 'mb-0' : 'mb-6'} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <h3
                  className="cursor-pointer text-lg font-semibold text-white transition-colors hover:text-gray-300"
                  onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
                >
                  Notes
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Tag Filter Dropdown */}
                {!isNotesCollapsed && (
                  <div className="relative">
                    <select
                      value={noteTagFilter}
                      onChange={(e) => setNoteTagFilter(e.target.value)}
                      className="cursor-pointer rounded border border-gray-700/50 bg-gray-800/50 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-800 focus:border-gray-600 focus:outline-none"
                    >
                      <option value="all">All Tags</option>
                      {noteTagOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Sort Dropdown */}
                {!isNotesCollapsed && (
                  <div className="relative">
                    <select
                      value={notesOrder}
                      onChange={(e) => setNotesOrder(e.target.value)}
                      className="cursor-pointer rounded border border-gray-700/50 bg-gray-800/50 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-800 focus:border-gray-600 focus:outline-none"
                    >
                      <option value="Recent Last">Recent Last</option>
                      <option value="Recent First">Recent First</option>
                    </select>
                  </div>
                )}
                <button
                  onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${isNotesCollapsed ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {!isNotesCollapsed && (
              <div className="space-y-4">
                {/* Notes List */}
                <div className="space-y-4">
                  {getSortedNotes().map((note) => (
                    <div key={note.id} className="group flex gap-4">
                      {/* User Avatar */}
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-600 text-sm font-medium text-white">
                        {note.createdBy.charAt(0).toUpperCase()}
                      </div>

                      {/* Note Content */}
                      <div className="flex-1">
                        <div className="rounded-lg border border-gray-700/30 bg-gray-900/50 p-4 transition-all hover:border-gray-600/50">
                          {/* Note Header with Tag */}
                          <div className="mb-3 flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getTagConfig(note.tag).color} ${getTagConfig(note.tag).textColor}`}>
                              {getTagConfig(note.tag).label}
                            </span>
                          </div>
                          {/* Note Text */}
                          <div className="mb-4 whitespace-pre-wrap leading-relaxed text-gray-300">
                            {note.content}
                          </div>

                          {/* Note Footer */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-blue-400">{note.module}</span>
                              <span>-</span>
                              <a
                                href={`#/leads/${note.recordId}`}
                                className="text-blue-400 transition-colors hover:text-blue-300"
                                title={note.recordName}
                              >
                                {note.recordName}
                              </a>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className="cursor-pointer text-gray-400 transition-colors hover:text-blue-400"
                                onClick={() => setIsAddingNote(true)}
                              >
                                Add Note
                              </span>
                              <span>•</span>
                              <div
                                className="flex items-center gap-1"
                                title={`Edited on ${formatNoteTime(note.lastUpdated)}`}
                              >
                                <Clock className="h-3 w-3" />
                                <span>Edited on {formatNoteDate(note.lastUpdated)}</span>
                              </div>
                              <span>by</span>
                              <span title={note.createdBy}>{note.createdBy}</span>
                            </div>
                          </div>
                        </div>

                        {/* Edit/Delete Actions */}
                        <div className="mt-2 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            className="rounded p-1 text-gray-500 transition-colors hover:text-blue-400"
                            title="Edit"
                            onClick={() => setEditingNoteId(note.id)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded p-1 text-gray-500 transition-colors hover:text-red-400"
                            title="Delete"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Note Input */}
                <div className="mt-6">
                  {isAddingNote ? (
                    <div className="space-y-3">
                      {/* Tag Selector */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-400">Tag:</label>
                        <Select value={newNoteTag} onValueChange={setNewNoteTag}>
                          <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {noteTagOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-block h-2 w-2 rounded-full ${option.color}`}></span>
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Reminder Date/Time Inputs */}
                      {showReminderOptions && (
                        <div className="rounded-lg border border-gray-600 bg-gray-700/50 p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Bell className="h-4 w-4" />
                            <span>Set reminder for:</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500">Date</label>
                              <input
                                type="date"
                                value={reminderDate}
                                onChange={(e) => setReminderDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Time</label>
                              <input
                                type="time"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="What's this note about?"
                        className="min-h-[100px] w-full resize-none rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAddNote}
                          disabled={!newNoteContent.trim() || (newNoteTag === 'reminder' && (!reminderDate || !reminderTime))}
                          className="flex items-center gap-2 rounded border border-gray-600 bg-gray-700 px-4 py-2 text-sm text-white transition-colors hover:border-gray-500 hover:bg-gray-600 disabled:cursor-not-allowed disabled:bg-gray-800"
                        >
                          <Send className="h-4 w-4" />
                          Add Note
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingNote(false);
                            setNewNoteContent('');
                            setNewNoteTag('general');
                            setReminderDate('');
                            setReminderTime('');
                            setShowReminderOptions(false);
                          }}
                          className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingNote(true)}
                      className="w-full rounded-lg border border-gray-600/50 bg-gray-700/50 px-4 py-3 text-left text-gray-400 transition-colors hover:border-gray-600 hover:bg-gray-700"
                    >
                      Add a note
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Call Results Section */}
        <div className="rounded-xl border border-gray-700/50 bg-gray-800/50">
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">Call Results</h3>
              </div>
              <button
                onClick={() => setIsCallResultsCollapsed(!isCallResultsCollapsed)}
                className="text-gray-400 transition-colors hover:text-white"
              >
                <ChevronDown
                  className={`h-5 w-5 transition-transform ${isCallResultsCollapsed ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {!isCallResultsCollapsed && (
              <div className="space-y-3">
                {callResults.map((call) => (
                  <div
                    key={call.id}
                    onClick={() => handleCallClick(call)}
                    className="group cursor-pointer rounded-lg border border-gray-700/30 bg-gray-900/50 p-4 transition-all duration-200 hover:border-gray-600/50 hover:bg-gray-900/70"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Call Icon */}
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            call.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          <Phone className="h-5 w-5" />
                        </div>

                        {/* Call Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-white">{call.date}</span>
                            <span className="text-sm text-gray-400">{call.time}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-400">{call.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-400">{call.sentiment}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Call Outcome and Cost */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div
                            className={`text-sm font-medium ${
                              call.outcome === 'Qualified'
                                ? 'text-green-400'
                                : call.outcome === 'Follow-up'
                                  ? 'text-yellow-400'
                                  : 'text-gray-400'
                            }`}
                          >
                            {call.outcome}
                          </div>
                          <div className="text-sm text-gray-500">{call.cost}</div>
                        </div>
                        <ChevronDown className="h-5 w-5 rotate-[-90deg] text-gray-500 transition-colors group-hover:text-gray-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call Log Details Modal */}
      <CallLogDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        callData={selectedCall}
      />
    </div>
  );
}
