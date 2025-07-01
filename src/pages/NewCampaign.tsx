import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Phone, 
  Mic, 
  Clock, 
  FileText, 
  Users, 
  DollarSign,
  Check,
  Plus,
  X,
  Calendar,
  Target,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface CampaignData {
  // Basic Info
  name: string;
  description: string;
  productDescription: string;
  
  // Phone Numbers
  phoneNumbers: string[];
  
  // Voice Agent
  voiceAgent: {
    name: string;
    voice: string;
    language: string;
    tone: string;
  };
  
  // Calling Schedule
  callingSchedule: {
    timezone: string;
    startTime: string;
    endTime: string;
    daysOfWeek: string[];
    startDate: string;
    endDate: string;
  };
  
  // Script
  script: {
    introduction: string;
    mainContent: string;
    objections: string;
    closing: string;
  };
  
  // Team
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: 'manager' | 'agent' | 'viewer';
  }>;
  
  // Budget
  budget: {
    total: number;
    perCall: number;
    dailyLimit: number;
  };
  
  // Settings
  settings: {
    maxCallsPerDay: number;
    retryAttempts: number;
    callDuration: number;
    voicemailEnabled: boolean;
  };
}

const steps = [
  { id: 1, title: 'Basic Info', icon: Target, description: 'Campaign name and description' },
  { id: 2, title: 'Phone Numbers', icon: Phone, description: 'Select calling numbers' },
  { id: 3, title: 'Voice Agent', icon: Mic, description: 'Configure AI voice agent' },
  { id: 4, title: 'Calling Schedule', icon: Clock, description: 'Set calling times and dates' },
  { id: 5, title: 'Script', icon: FileText, description: 'Create calling script' },
  { id: 6, title: 'Team', icon: Users, description: 'Add team members' },
  { id: 7, title: 'Budget', icon: DollarSign, description: 'Set budget limits' },
  { id: 8, title: 'Settings', icon: Settings, description: 'Advanced settings' },
];

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

const mockTeamMembers = [
  { id: '1', name: 'John Smith', email: 'john@company.com', role: 'manager' as const },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'agent' as const },
  { id: '3', name: 'Mike Davis', email: 'mike@company.com', role: 'agent' as const },
];

export default function NewCampaign() {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    description: '',
    productDescription: '',
    phoneNumbers: [],
    voiceAgent: {
      name: '',
      voice: 'sarah',
      language: 'en-US',
      tone: 'professional',
    },
    callingSchedule: {
      timezone: 'America/New_York',
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startDate: '',
      endDate: '',
    },
    script: {
      introduction: '',
      mainContent: '',
      objections: '',
      closing: '',
    },
    teamMembers: [],
    budget: {
      total: 1000,
      perCall: 0.50,
      dailyLimit: 100,
    },
    settings: {
      maxCallsPerDay: 100,
      retryAttempts: 3,
      callDuration: 300,
      voicemailEnabled: true,
    },
  });
  
  const navigate = useNavigate();

  const updateCampaignData = (field: string, value: any) => {
    setCampaignData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateNestedField = (parent: keyof CampaignData, field: string, value: any) => {
    setCampaignData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value
      }
    }));
  };

  const addPhoneNumber = () => {
    const newNumber = prompt('Enter phone number:');
    if (newNumber && !campaignData.phoneNumbers.includes(newNumber)) {
      updateCampaignData('phoneNumbers', [...campaignData.phoneNumbers, newNumber]);
    }
  };

  const removePhoneNumber = (index: number) => {
    updateCampaignData('phoneNumbers', 
      campaignData.phoneNumbers.filter((_, i) => i !== index)
    );
  };

  const addTeamMember = () => {
    const name = prompt('Enter team member name:');
    const email = prompt('Enter email:');
    const role = prompt('Enter role (manager/agent/viewer):') as 'manager' | 'agent' | 'viewer';
    
    if (name && email && role) {
      updateCampaignData('teamMembers', [
        ...campaignData.teamMembers,
        { id: Date.now().toString(), name, email, role }
      ]);
    }
  };

  const removeTeamMember = (id: string) => {
    updateCampaignData('teamMembers', 
      campaignData.teamMembers.filter(member => member.id !== id)
    );
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createCampaign = () => {
    // Here you would typically save to backend
    console.log('Creating campaign:', campaignData);
    navigate('/campaigns');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-white">Campaign Name *</Label>
              <Input
                id="name"
                value={campaignData.name}
                onChange={(e) => updateCampaignData('name', e.target.value)}
                placeholder="Enter campaign name"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-white">Campaign Description</Label>
              <Textarea
                id="description"
                value={campaignData.description}
                onChange={(e) => updateCampaignData('description', e.target.value)}
                placeholder="Brief description of the campaign"
                className="mt-2"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="productDescription" className="text-white">Product/Service Description</Label>
              <Textarea
                id="productDescription"
                value={campaignData.productDescription}
                onChange={(e) => updateCampaignData('productDescription', e.target.value)}
                placeholder="Describe what you're offering"
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-white">Phone Numbers *</Label>
              <p className="text-gray-400 text-sm mt-1">Add at least one phone number for calling</p>
            </div>
            
            <div className="space-y-3">
              {campaignData.phoneNumbers.map((number, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input value={number} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removePhoneNumber(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button onClick={addPhoneNumber} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Phone Number
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="voiceName" className="text-white">Voice Agent Name</Label>
              <Input
                id="voiceName"
                value={campaignData.voiceAgent.name}
                onChange={(e) => updateNestedField('voiceAgent', 'name', e.target.value)}
                placeholder="e.g., Sales Assistant"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="voice" className="text-white">Voice Selection</Label>
              <Select
                value={campaignData.voiceAgent.voice}
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
            </div>
            
            <div>
              <Label htmlFor="tone" className="text-white">Tone</Label>
              <Select
                value={campaignData.voiceAgent.tone}
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
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="timezone" className="text-white">Timezone</Label>
              <Select
                value={campaignData.callingSchedule.timezone}
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="text-white">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={campaignData.callingSchedule.startTime}
                  onChange={(e) => updateNestedField('callingSchedule', 'startTime', e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="endTime" className="text-white">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={campaignData.callingSchedule.endTime}
                  onChange={(e) => updateNestedField('callingSchedule', 'endTime', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-white">Days of Week</Label>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <Button
                    key={day}
                    variant={campaignData.callingSchedule.daysOfWeek.includes(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const days = campaignData.callingSchedule.daysOfWeek.includes(day)
                        ? campaignData.callingSchedule.daysOfWeek.filter(d => d !== day)
                        : [...campaignData.callingSchedule.daysOfWeek, day];
                      updateNestedField('callingSchedule', 'daysOfWeek', days);
                    }}
                  >
                    {day.slice(0, 3).toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-white">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={campaignData.callingSchedule.startDate}
                  onChange={(e) => updateNestedField('callingSchedule', 'startDate', e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-white">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={campaignData.callingSchedule.endDate}
                  onChange={(e) => updateNestedField('callingSchedule', 'endDate', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="introduction" className="text-white">Introduction</Label>
              <Textarea
                id="introduction"
                value={campaignData.script.introduction}
                onChange={(e) => updateNestedField('script', 'introduction', e.target.value)}
                placeholder="How the agent should introduce themselves"
                className="mt-2"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="mainContent" className="text-white">Main Content</Label>
              <Textarea
                id="mainContent"
                value={campaignData.script.mainContent}
                onChange={(e) => updateNestedField('script', 'mainContent', e.target.value)}
                placeholder="Main message about your product/service"
                className="mt-2"
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="objections" className="text-white">Objection Handling</Label>
              <Textarea
                id="objections"
                value={campaignData.script.objections}
                onChange={(e) => updateNestedField('script', 'objections', e.target.value)}
                placeholder="How to handle common objections"
                className="mt-2"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="closing" className="text-white">Closing</Label>
              <Textarea
                id="closing"
                value={campaignData.script.closing}
                onChange={(e) => updateNestedField('script', 'closing', e.target.value)}
                placeholder="How to close the call"
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Label className="text-white">Team Members</Label>
              <Button onClick={addTeamMember} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
            
            <div className="space-y-3">
              {campaignData.teamMembers.map((member) => (
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {campaignData.teamMembers.length === 0 && (
              <p className="text-gray-400 text-center py-8">
                No team members added yet. Click "Add Member" to get started.
              </p>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="totalBudget" className="text-white">Total Budget ($)</Label>
              <Input
                id="totalBudget"
                type="number"
                value={campaignData.budget.total}
                onChange={(e) => updateNestedField('budget', 'total', parseFloat(e.target.value) || 0)}
                placeholder="1000"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="perCall" className="text-white">Cost Per Call ($)</Label>
              <Input
                id="perCall"
                type="number"
                step="0.01"
                value={campaignData.budget.perCall}
                onChange={(e) => updateNestedField('budget', 'perCall', parseFloat(e.target.value) || 0)}
                placeholder="0.50"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="dailyLimit" className="text-white">Daily Budget Limit ($)</Label>
              <Input
                id="dailyLimit"
                type="number"
                value={campaignData.budget.dailyLimit}
                onChange={(e) => updateNestedField('budget', 'dailyLimit', parseFloat(e.target.value) || 0)}
                placeholder="100"
                className="mt-2"
              />
            </div>
            
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <p className="text-sm text-gray-400">Estimated calls with current budget:</p>
              <p className="text-2xl font-bold text-white">
                {Math.floor(campaignData.budget.total / campaignData.budget.perCall)}
              </p>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="maxCallsPerDay" className="text-white">Max Calls Per Day</Label>
              <Input
                id="maxCallsPerDay"
                type="number"
                value={campaignData.settings.maxCallsPerDay}
                onChange={(e) => updateNestedField('settings', 'maxCallsPerDay', parseInt(e.target.value) || 0)}
                placeholder="100"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="retryAttempts" className="text-white">Retry Attempts</Label>
              <Input
                id="retryAttempts"
                type="number"
                value={campaignData.settings.retryAttempts}
                onChange={(e) => updateNestedField('settings', 'retryAttempts', parseInt(e.target.value) || 0)}
                placeholder="3"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="callDuration" className="text-white">Max Call Duration (seconds)</Label>
              <Input
                id="callDuration"
                type="number"
                value={campaignData.settings.callDuration}
                onChange={(e) => updateNestedField('settings', 'callDuration', parseInt(e.target.value) || 0)}
                placeholder="300"
                className="mt-2"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="voicemail"
                checked={campaignData.settings.voicemailEnabled}
                onCheckedChange={(checked) => updateNestedField('settings', 'voicemailEnabled', checked)}
              />
              <Label htmlFor="voicemail" className="text-white">Enable Voicemail</Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return campaignData.name.trim() !== '';
      case 2:
        return campaignData.phoneNumbers.length > 0;
      case 3:
        return campaignData.voiceAgent.name.trim() !== '';
      case 4:
        return campaignData.callingSchedule.startDate && campaignData.callingSchedule.endDate;
      case 5:
        return campaignData.script.introduction.trim() !== '' && campaignData.script.mainContent.trim() !== '';
      case 6:
        return true; // Team members are optional
      case 7:
        return campaignData.budget.total > 0;
      case 8:
        return true; // Settings are optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-950 px-4 overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto mt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            className="flex items-center text-white hover:text-brand-pink transition-colors text-lg font-semibold"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Campaigns
          </button>
          <h1 className="text-2xl font-bold text-white">Create New Campaign</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-brand-pink border-brand-pink text-white' 
                    : 'border-gray-600 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-brand-pink' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-white font-medium">{steps[currentStep - 1].title}</p>
            <p className="text-gray-400 text-sm">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Content */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="text-white border-gray-600 hover:border-gray-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="text-white border-gray-600 hover:border-gray-500"
            >
              Cancel
            </Button>
            
            {currentStep === steps.length ? (
              <Button
                onClick={createCampaign}
                disabled={!isStepValid()}
                className="bg-gradient-to-r from-brand-pink to-brand-magenta text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:from-brand-magenta hover:to-brand-pink transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Create Campaign
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!isStepValid()}
                className="bg-gradient-to-r from-brand-pink to-brand-magenta text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:from-brand-magenta hover:to-brand-pink transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 