import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  MoreHorizontal
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
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Mock campaign data - in real app this would come from API
const mockCampaign = {
  id: '1',
  name: 'Healthcare Providers Campaign',
  description: 'Medical Practice Outreach',
  productDescription: 'We offer comprehensive medical billing solutions that help healthcare providers increase revenue and reduce administrative burden.',
  status: 'active',
  progress: 60,
  leadsCalled: 120,
  answered: 30,
  calledBack: 10,
  opportunities: 2,
  tags: ['Healthcare'],
  phoneNumbers: ['+1-555-0123', '+1-555-0124'],
  voiceAgent: {
    name: 'Medical Sales Assistant',
    voice: 'sarah',
    language: 'en-US',
    tone: 'professional',
  },
  callingSchedule: {
    timezone: 'America/New_York',
    startTime: '09:00',
    endTime: '17:00',
    daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startDate: '2024-01-15',
    endDate: '2024-03-15',
  },
  script: {
    introduction: 'Hello, this is [Agent Name] calling from Medical Solutions Inc. I hope you\'re having a great day.',
    mainContent: 'We specialize in helping medical practices like yours streamline their billing processes and increase revenue by up to 30%. Our solution integrates seamlessly with your existing systems.',
    objections: 'I understand you may have concerns about changing your current system. Many of our clients felt the same way initially, but they\'ve seen significant improvements in their revenue cycle.',
    closing: 'Would you be interested in a brief 15-minute consultation to see how we can help your practice? I can have one of our specialists call you at your convenience.',
  },
  teamMembers: [
    { id: '1', name: 'John Smith', email: 'john@company.com', role: 'manager' as const },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'agent' as const },
    { id: '3', name: 'Mike Davis', email: 'mike@company.com', role: 'agent' as const },
  ],
  budget: {
    total: 5000,
    perCall: 0.75,
    dailyLimit: 200,
    spent: 1800,
  },
  settings: {
    maxCallsPerDay: 100,
    retryAttempts: 3,
    callDuration: 300,
    voicemailEnabled: true,
  },
  createdAt: '2024-01-10',
  lastModified: '2024-01-20',
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
  const [isEditing, setIsEditing] = useState(false);
  const [campaign, setCampaign] = useState(mockCampaign);
  const [activeTab, setActiveTab] = useState('overview');

  const updateCampaign = (field: string, value: any) => {
    setCampaign(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setCampaign(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any),
        [field]: value
      }
    }));
  };

  const addPhoneNumber = () => {
    const newNumber = prompt('Enter phone number:');
    if (newNumber && !campaign.phoneNumbers.includes(newNumber)) {
      updateCampaign('phoneNumbers', [...campaign.phoneNumbers, newNumber]);
    }
  };

  const removePhoneNumber = (index: number) => {
    updateCampaign('phoneNumbers', 
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
        { id: Date.now().toString(), name, email, role }
      ]);
    }
  };

  const removeTeamMember = (id: string) => {
    updateCampaign('teamMembers', 
      campaign.teamMembers.filter(member => member.id !== id)
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

  return (
    <div className="min-h-screen w-full bg-gray-950 px-4 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto mt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              className="flex items-center text-white hover:text-brand-pink transition-colors text-lg font-semibold"
              onClick={() => navigate('/campaigns')}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Campaigns
            </button>
            <div className="h-6 w-px bg-gray-600" />
            <h1 className="text-2xl font-bold text-white">{campaign.name}</h1>
            {getStatusBadge(campaign.status)}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={toggleCampaignStatus}
              className="text-white border-gray-600 hover:border-gray-500"
            >
              {campaign.status === 'active' ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-white border-gray-600 hover:border-gray-500">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuItem className="text-white hover:bg-gray-700">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Campaign
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-gray-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:bg-gray-700">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-400 hover:bg-gray-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {isEditing ? (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="text-white border-gray-600 hover:border-gray-500"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={saveChanges}
                  className="bg-gradient-to-r from-brand-pink to-brand-magenta text-white font-bold"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-brand-pink to-brand-magenta text-white font-bold"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Campaign
              </Button>
            )}
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Leads Called</p>
                  <p className="text-2xl font-bold text-white">{campaign.leadsCalled}</p>
                </div>
                <Phone className="h-8 w-8 text-brand-pink" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Answered</p>
                  <p className="text-2xl font-bold text-white">{campaign.answered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Callbacks</p>
                  <p className="text-2xl font-bold text-white">{campaign.calledBack}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Opportunities</p>
                  <p className="text-2xl font-bold text-white">{campaign.opportunities}</p>
                </div>
                <Target className="h-8 w-8 text-brand-magenta" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card className="bg-gray-900/50 border-gray-800 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Campaign Progress</h3>
              <span className="text-gray-400">{campaign.progress}%</span>
            </div>
            <Progress value={campaign.progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 bg-gray-800">
            <TabsTrigger value="overview" className="text-white">Overview</TabsTrigger>
            <TabsTrigger value="phone-numbers" className="text-white">Phone Numbers</TabsTrigger>
            <TabsTrigger value="voice-agent" className="text-white">Voice Agent</TabsTrigger>
            <TabsTrigger value="schedule" className="text-white">Schedule</TabsTrigger>
            <TabsTrigger value="script" className="text-white">Script</TabsTrigger>
            <TabsTrigger value="team" className="text-white">Team</TabsTrigger>
            <TabsTrigger value="budget" className="text-white">Budget</TabsTrigger>
            <TabsTrigger value="settings" className="text-white">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900/50 border-gray-800">
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
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-300 mt-2">{campaign.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-white">Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={campaign.description}
                        onChange={(e) => updateCampaign('description', e.target.value)}
                        className="mt-2"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-300 mt-2">{campaign.description}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-white">Product/Service Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={campaign.productDescription}
                        onChange={(e) => updateCampaign('productDescription', e.target.value)}
                        className="mt-2"
                        rows={4}
                      />
                    ) : (
                      <p className="text-gray-300 mt-2">{campaign.productDescription}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Budget Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Budget:</span>
                    <span className="text-white font-semibold">${campaign.budget.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Spent:</span>
                    <span className="text-white font-semibold">${campaign.budget.spent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Remaining:</span>
                    <span className="text-white font-semibold">${campaign.budget.total - campaign.budget.spent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cost per Call:</span>
                    <span className="text-white font-semibold">${campaign.budget.perCall}</span>
                  </div>
                  <Progress 
                    value={(campaign.budget.spent / campaign.budget.total) * 100} 
                    className="h-2" 
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="phone-numbers" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Phone Numbers</CardTitle>
                <CardDescription className="text-gray-400">
                  Phone numbers used for making calls in this campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign.phoneNumbers.map((number, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input value={number} readOnly className="flex-1" />
                    {isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePhoneNumber(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {isEditing && (
                  <Button onClick={addPhoneNumber} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Phone Number
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice-agent" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
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
                    <p className="text-gray-300 mt-2">{campaign.voiceAgent.name}</p>
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
                        {voiceOptions.map(voice => (
                          <SelectItem key={voice.value} value={voice.value}>
                            {voice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-300 mt-2">
                      {voiceOptions.find(v => v.value === campaign.voiceAgent.voice)?.label}
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
                        {toneOptions.map(tone => (
                          <SelectItem key={tone.value} value={tone.value}>
                            {tone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-300 mt-2 capitalize">{campaign.voiceAgent.tone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Calling Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white">Timezone</Label>
                  {isEditing ? (
                    <Select
                      value={campaign.callingSchedule.timezone}
                      onValueChange={(value) => updateNestedField('callingSchedule', 'timezone', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezoneOptions.map(tz => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-300 mt-2">
                      {timezoneOptions.find(t => t.value === campaign.callingSchedule.timezone)?.label}
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
                        onChange={(e) => updateNestedField('callingSchedule', 'startTime', e.target.value)}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-300 mt-2">{campaign.callingSchedule.startTime}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-white">End Time</Label>
                    {isEditing ? (
                      <Input
                        type="time"
                        value={campaign.callingSchedule.endTime}
                        onChange={(e) => updateNestedField('callingSchedule', 'endTime', e.target.value)}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-300 mt-2">{campaign.callingSchedule.endTime}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-white">Days of Week</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <Button
                        key={day}
                        variant={campaign.callingSchedule.daysOfWeek.includes(day) ? "default" : "outline"}
                        size="sm"
                        disabled={!isEditing}
                        onClick={() => {
                          if (isEditing) {
                            const days = campaign.callingSchedule.daysOfWeek.includes(day)
                              ? campaign.callingSchedule.daysOfWeek.filter(d => d !== day)
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
                        onChange={(e) => updateNestedField('callingSchedule', 'startDate', e.target.value)}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-300 mt-2">{campaign.callingSchedule.startDate}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-white">End Date</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={campaign.callingSchedule.endDate}
                        onChange={(e) => updateNestedField('callingSchedule', 'endDate', e.target.value)}
                        className="mt-2"
                      />
                    ) : (
                      <p className="text-gray-300 mt-2">{campaign.callingSchedule.endDate}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="script" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
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
                      className="mt-2"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-300 mt-2">{campaign.script.introduction}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-white">Main Content</Label>
                  {isEditing ? (
                    <Textarea
                      value={campaign.script.mainContent}
                      onChange={(e) => updateNestedField('script', 'mainContent', e.target.value)}
                      className="mt-2"
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-300 mt-2">{campaign.script.mainContent}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-white">Objection Handling</Label>
                  {isEditing ? (
                    <Textarea
                      value={campaign.script.objections}
                      onChange={(e) => updateNestedField('script', 'objections', e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-300 mt-2">{campaign.script.objections}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-white">Closing</Label>
                  {isEditing ? (
                    <Textarea
                      value={campaign.script.closing}
                      onChange={(e) => updateNestedField('script', 'closing', e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-300 mt-2">{campaign.script.closing}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Team Members</CardTitle>
                  {isEditing && (
                    <Button onClick={addTeamMember} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign.teamMembers.map((member) => (
                  <Card key={member.id} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
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
                  <p className="text-gray-400 text-center py-8">
                    No team members assigned to this campaign.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
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
                      onChange={(e) => updateNestedField('budget', 'total', parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  ) : (
                    <p className="text-gray-300 mt-2">${campaign.budget.total}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-white">Cost Per Call ($)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={campaign.budget.perCall}
                      onChange={(e) => updateNestedField('budget', 'perCall', parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  ) : (
                    <p className="text-gray-300 mt-2">${campaign.budget.perCall}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-white">Daily Budget Limit ($)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={campaign.budget.dailyLimit}
                      onChange={(e) => updateNestedField('budget', 'dailyLimit', parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                  ) : (
                    <p className="text-gray-300 mt-2">${campaign.budget.dailyLimit}</p>
                  )}
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Budget Usage</span>
                    <span className="text-sm text-gray-400">
                      ${campaign.budget.spent} / ${campaign.budget.total}
                    </span>
                  </div>
                  <Progress 
                    value={(campaign.budget.spent / campaign.budget.total) * 100} 
                    className="h-2" 
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Estimated calls remaining: {Math.floor((campaign.budget.total - campaign.budget.spent) / campaign.budget.perCall)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-800">
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
                      onChange={(e) => updateNestedField('settings', 'maxCallsPerDay', parseInt(e.target.value) || 0)}
                      className="mt-2"
                    />
                  ) : (
                    <p className="text-gray-300 mt-2">{campaign.settings.maxCallsPerDay}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-white">Retry Attempts</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={campaign.settings.retryAttempts}
                      onChange={(e) => updateNestedField('settings', 'retryAttempts', parseInt(e.target.value) || 0)}
                      className="mt-2"
                    />
                  ) : (
                    <p className="text-gray-300 mt-2">{campaign.settings.retryAttempts}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-white">Max Call Duration (seconds)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={campaign.settings.callDuration}
                      onChange={(e) => updateNestedField('settings', 'callDuration', parseInt(e.target.value) || 0)}
                      className="mt-2"
                    />
                  ) : (
                    <p className="text-gray-300 mt-2">{campaign.settings.callDuration}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="voicemail"
                    checked={campaign.settings.voicemailEnabled}
                    onCheckedChange={(checked) => updateNestedField('settings', 'voicemailEnabled', checked)}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="voicemail" className="text-white">Enable Voicemail</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 