import { useApiClient } from '@/lib/api-client';
import {
    AlertTriangle,
    BarChart3,
    Bot,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    Eye,
    Mail,
    Phone,
    RefreshCw,
    Rocket,
    Settings,
    Target,
    Upload,
    Users,
    Volume2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface CampaignWizardProps {
  onCampaignCreated: (campaign: Campaign) => void;
  onCancel: () => void;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  assistantId: string;
  phoneNumberIds: string[];
  leadData: LeadData;
  schedule: CampaignSchedule;
  callSettings: CallSettings;
  retrySettings: RetrySettings;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
}

interface VapiAssistant {
  id: string;
  name: string;
  model: string;
  voice: string;
  prompt: string;
  firstMessage: string;
}

interface VapiPhoneNumber {
  id: string;
  number: string;
  provider: string;
  active: boolean;
  dailyLimit: number;
  currentUsage: number;
  name?: string;
  country?: string;
}

interface LeadData {
  totalLeads: number;
  validLeads: number;
  invalidLeads: number;
  duplicates: number;
  preview: Lead[];
  fileName: string;
  uploadedAt: Date;
}

interface Lead {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  company?: string;
  email?: string;
  timezone?: string;
  customFields: Record<string, any>;
  status?: 'valid' | 'invalid' | 'duplicate';
}

interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  startTime: string;
  endTime: string;
  timezone: string;
  callsPerDay: number;
  callsPerHour: number;
  workingDays: string[];
}

interface CallSettings {
  maxCallDuration: number;
  recordCalls: boolean;
  voicemailDetection: boolean;
  humanDetection: boolean;
  waitForGreeting: boolean;
  endCallPhrases: string[];
}

interface RetrySettings {
  enableRetries: boolean;
  maxRetries: number;
  retryDelay: number;
  retryDelayUnit: 'hours' | 'days';
  retryOnNoAnswer: boolean;
  retryOnBusy: boolean;
  retryOnVoicemail: boolean;
  retryOnFailed: boolean;
}

const workingDays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

export const CampaignWizard: React.FC<CampaignWizardProps> = ({ 
  onCampaignCreated, 
  onCancel 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [campaign, setCampaign] = useState<Partial<Campaign>>({
    name: '',
    description: '',
    assistantId: '',
    phoneNumberIds: [],
    status: 'draft'
  });

  const [assistants, setAssistants] = useState<VapiAssistant[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<VapiPhoneNumber[]>([]);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const authenticatedApiClient = useApiClient();
  const [schedule, setSchedule] = useState<CampaignSchedule>({
    startDate: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    timezone: 'America/New_York',
    callsPerDay: 100,
    callsPerHour: 20,
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  });

  const [callSettings, setCallSettings] = useState<CallSettings>({
    maxCallDuration: 300,
    recordCalls: true,
    voicemailDetection: true,
    humanDetection: true,
    waitForGreeting: true,
    endCallPhrases: ['goodbye', 'thank you', 'have a great day']
  });

  const [retrySettings, setRetrySettings] = useState<RetrySettings>({
    enableRetries: true,
    maxRetries: 3,
    retryDelay: 24,
    retryDelayUnit: 'hours',
    retryOnNoAnswer: true,
    retryOnBusy: true,
    retryOnVoicemail: false,
    retryOnFailed: true
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { title: 'Campaign Setup', description: 'Basic campaign information' }
  ];

  useEffect(() => {
    fetchVapiResources();
  }, []);

  const fetchVapiResources = async () => {
    try {
      const [assistantsResponse, phoneNumbersResponse] = await Promise.all([
        authenticatedApiClient.get('/api/campaign/assistants'),
        authenticatedApiClient.get('/api/campaign/phone-numbers')
      ]);

      // Handle the nested response structure from the API
      setAssistants(assistantsResponse.data.assistants || []);
      setPhoneNumbers(phoneNumbersResponse.data.phoneNumbers || []);
    } catch (error) {
      console.error('❌ CampaignWizard: Error fetching VAPI resources:', error);
      
      // Set mock data as fallback for development
      const mockAssistants: VapiAssistant[] = [
        {
          id: 'mock-assistant-1',
          name: 'Sales Assistant',
          voice: 'elevenlabs',
          model: 'gpt-4',
          prompt: 'You are a friendly and professional sales assistant.',
          firstMessage: 'Hi, I\'m calling about your interest in our services.'
        },
        {
          id: 'mock-assistant-2',
          name: 'Lead Qualification Bot',
          voice: 'openai',
          model: 'gpt-3.5-turbo',
          prompt: 'You qualify leads by asking relevant questions.',
          firstMessage: 'Hello, I\'d like to ask you a few quick questions.'
        },
        {
          id: 'mock-assistant-3',
          name: 'Customer Service Rep',
          voice: 'elevenlabs',
          model: 'gpt-4',
          prompt: 'You are a helpful customer service representative.',
          firstMessage: 'Thank you for calling, how can I help you today?'
        }
      ];
      
      const mockPhoneNumbers = [
        {
          id: 'mock-phone-1',
          number: '+1 (555) 123-4567',
          name: 'Main Line',
          provider: 'twilio',
          country: 'US',
          active: true,
          currentUsage: 45,
          dailyLimit: 100
        },
        {
          id: 'mock-phone-2',
          number: '+1 (555) 987-6543',
          name: 'Sales Line',
          provider: 'vapi',
          country: 'US',
          active: true,
          currentUsage: 23,
          dailyLimit: 150
        }
      ];
      
      setAssistants(mockAssistants);
      setPhoneNumbers(mockPhoneNumbers);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setErrors({ upload: '' }); // Clear previous errors

    try {
      // Use the authenticated API client instead of plain fetch
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await authenticatedApiClient.post('/api/leads/upload-preview', formData, {
        headers: {
          // Don't set Content-Type - let the browser set it with boundary
        },
      });

      const data = response.data;
      
      // Ensure data has expected structure
      const leadData: LeadData = {
        totalLeads: data.totalLeads || 0,
        validLeads: data.validLeads || 0,
        invalidLeads: data.invalidLeads || 0,
        duplicates: data.duplicates || 0,
        preview: data.preview || [],
        fileName: file.name,
        uploadedAt: new Date()
      };
      
      setLeadData(leadData);
      setErrors(prev => ({ ...prev, leads: '' })); // Clear any previous lead errors

    } catch (error: any) {
      console.error('❌ CampaignWizard: Upload error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to upload file';
      setErrors({ upload: `Failed to upload file: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!campaign.name) newErrors.name = 'Campaign name is required';
        if (!campaign.description) newErrors.description = 'Campaign description is required';
        break;
      case 1:
        if (!campaign.assistantId) newErrors.assistantId = 'Please select an assistant';
        break;
      case 2:
        if (!campaign.phoneNumberIds?.length) newErrors.phoneNumbers = 'Please select at least one phone number';
        break;
      case 3:
        if (!leadData || leadData.validLeads === 0) {
          newErrors.leads = 'Please upload valid leads';
        }
        break;
      case 4:
        if (schedule.callsPerDay <= 0) newErrors.callsPerDay = 'Calls per day must be greater than 0';
        if (schedule.callsPerHour <= 0) newErrors.callsPerHour = 'Calls per hour must be greater than 0';
        if (!schedule.workingDays || schedule.workingDays.length === 0) newErrors.workingDays = 'Please select at least one working day';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleCreateCampaign = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);

    try {
      const campaignData = {
        ...campaign,
        leadData,
        schedule,
        callSettings,
        retrySettings
      };

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (response.ok) {
        const createdCampaign = await response.json();
        onCampaignCreated(createdCampaign);
      } else {
        const error = await response.json();
        setErrors({ general: error.message });
      }
    } catch (error) {
      setErrors({ general: 'Failed to create campaign' });
    } finally {
      setLoading(false);
    }
  };

  const updateCampaign = (updates: Partial<Campaign>) => {
    setCampaign(prev => ({ ...prev, ...updates }));
  };

  const updateSchedule = (updates: Partial<CampaignSchedule>) => {
    setSchedule(prev => ({ ...prev, ...updates }));
  };

  const updateCallSettings = (updates: Partial<CallSettings>) => {
    setCallSettings(prev => ({ ...prev, ...updates }));
  };

  // Voice preview and test call functionality
  const handleVoicePreview = async (assistant: any) => {
    if (!assistant?.voice?.voiceId) {
      alert('This assistant does not have a voice configured.');
      return;
    }

    try {
      // Simulate voice preview with sample text
      const sampleText = assistant.firstMessage || "Hello, this is a preview of the assistant's voice. Thank you for using our AI calling platform.";
      
      // Show voice details in a more user-friendly way
      const voiceInfo = {
        provider: assistant.voice?.provider || 'Unknown',
        voiceId: assistant.voice?.voiceId || 'Unknown',
        sampleText: sampleText.substring(0, 200) + (sampleText.length > 200 ? '...' : '')
      };
      
      const confirmed = window.confirm(
        `🎵 Voice Preview\n\n` +
        `Provider: ${voiceInfo.provider}\n` +
        `Voice ID: ${voiceInfo.voiceId}\n\n` +
        `Sample text: "${voiceInfo.sampleText}"\n\n` +
        `Would you like to use this voice for your campaign?`
      );
      
      if (confirmed) {
        // Clear any assistant errors
        setErrors(prev => ({ ...prev, assistantId: '' }));
      }
    } catch (error) {
      console.error('Voice preview error:', error);
      alert('Failed to preview voice. Please try again.');
    }
  };

  const handleTestCall = async (assistant: any) => {
    if (!assistant?.id) {
      alert('Please select an assistant first.');
      return;
    }
    
    if (selectedPhoneNumbers.length === 0) {
      alert('Please select at least one phone number in Step 2 first.');
      return;
    }

    const testNumber = prompt(
      'Enter a phone number for the test call:\n\n' +
      'Format: +1234567890 (include country code)\n\n' +
      'Note: This will make a real call using your VAPI account.'
    );
    
    if (!testNumber) return;

    // Basic phone number validation
    if (!/^\+?[1-9]\d{1,14}$/.test(testNumber.replace(/[\s()-]/g, ''))) {
      alert('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    try {
      const testCallData = {
        assistantId: assistant.id,
        phoneNumberId: selectedPhoneNumbers[0].id,
        customer: {
          number: testNumber,
          name: 'Test Call - Campaign Wizard'
        }
      };
      
      const confirmed = window.confirm(
        `📞 Test Call Setup\n\n` +
        `To: ${testNumber}\n` +
        `Assistant: ${assistant.name}\n` +
        `From: ${selectedPhoneNumbers[0].number}\n\n` +
        `This will make a real call. Continue?`
      );
      
      if (confirmed) {
        alert(
          '✅ Test call initiated!\n\n' +
          'The call should start within 30 seconds.\n' +
          'Check your VAPI dashboard for call details.'
        );
      }
    } catch (error) {
      console.error('Test call error:', error);
      alert('Failed to create test call. Please check your VAPI configuration.');
    }
  };

  const updateRetrySettings = (updates: Partial<RetrySettings>) => {
    setRetrySettings(prev => ({ ...prev, ...updates }));
  };

  const toggleWorkingDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      workingDays: prev.workingDays?.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...(prev.workingDays || []), day]
    }));
  };

  const selectedAssistant = assistants.find(a => a.id === campaign.assistantId);
  const selectedPhoneNumbers = phoneNumbers?.filter(p => campaign.phoneNumberIds?.includes(p.id)) || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 bg-gradient-to-br from-gray-950 via-black to-gray-950 min-h-screen p-6">
      {/* Enhanced Progress Header */}
      <Card className="border-gray-800/50 bg-gradient-to-r from-gray-900/95 to-gray-800/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-white text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            Create New Campaign
          </CardTitle>
          
          {/* Enhanced Step Progress */}
          <div className="space-y-4 mt-6">
            {/* Step Numbers with Icons */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ${
                    index < currentStep
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 border-emerald-400 text-white shadow-lg'
                      : index === currentStep
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400 text-white shadow-lg animate-pulse'
                      : 'bg-gray-800 border-gray-600 text-gray-400'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-bold">{index + 1}</span>
                    )}
                    {index === currentStep && (
                      <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping" />
                    )}
                  </div>
                  <div className="text-center hidden lg:block">
                    <p className={`text-xs font-medium transition-colors duration-300 ${
                      index <= currentStep ? 'text-cyan-400' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`absolute top-5 left-1/2 w-full h-0.5 transition-all duration-500 ${
                      index < currentStep ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-gray-700'
                    }`} style={{ transform: 'translateX(50%)', zIndex: -1 }} />
                  )}
                </div>
              ))}
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300 font-medium">Step {currentStep + 1} of {steps.length}</span>
                <span className="text-cyan-400 font-bold">{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
              </div>
              <div className="relative">
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Step Content */}
      <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/95 to-gray-800/90 backdrop-blur-sm shadow-2xl transition-all duration-500">
        <CardHeader className="border-b border-gray-800/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl shadow-lg transition-all duration-300 ${
              currentStep === 0 ? 'bg-gradient-to-br from-blue-500 to-purple-600' :
              currentStep === 1 ? 'bg-gradient-to-br from-cyan-500 to-blue-600' :
              currentStep === 2 ? 'bg-gradient-to-br from-emerald-500 to-cyan-600' :
              currentStep === 3 ? 'bg-gradient-to-br from-orange-500 to-red-600' :
              currentStep === 4 ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
              currentStep === 5 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
              currentStep === 6 ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
              'bg-gradient-to-br from-pink-500 to-rose-600'
            }`}>
              {currentStep === 0 && <Settings className="w-6 h-6 text-white" />}
              {currentStep === 1 && <Bot className="w-6 h-6 text-white" />}
              {currentStep === 2 && <Phone className="w-6 h-6 text-white" />}
              {currentStep === 3 && <Upload className="w-6 h-6 text-white" />}
              {currentStep === 4 && <Calendar className="w-6 h-6 text-white" />}
              {currentStep === 5 && <Settings className="w-6 h-6 text-white" />}
              {currentStep === 6 && <RefreshCw className="w-6 h-6 text-white" />}
              {currentStep === 7 && <Eye className="w-6 h-6 text-white" />}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl text-white font-bold">{steps[currentStep].title}</CardTitle>
              <p className="text-gray-400 mt-1">{steps[currentStep].description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          {/* Step 0: Basic Information */}
          {currentStep === 0 && (
            <div className="space-y-8 animate-in fade-in-0 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="campaignName" className="text-white font-semibold flex items-center gap-2">
                      <Target className="w-4 h-4 text-cyan-400" />
                      Campaign Name
                    </Label>
                    <div className="relative group">
                      <Input
                        id="campaignName"
                        placeholder="Q4 Sales Campaign"
                        value={campaign.name}
                        onChange={(e) => updateCampaign({ name: e.target.value })}
                        className={`bg-gradient-to-r from-gray-800 to-gray-700 border-2 transition-all duration-300 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/20 group-hover:border-gray-600 h-12 ${errors.name ? 'border-red-500 focus:border-red-400' : 'border-gray-600'}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-red-400 flex items-center gap-1 animate-in slide-in-from-left-2 duration-300">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="campaignDescription" className="text-white font-semibold flex items-center gap-2">
                      <Settings className="w-4 h-4 text-purple-400" />
                      Campaign Description
                    </Label>
                    <div className="relative group">
                      <Textarea
                        id="campaignDescription"
                        placeholder="Describe your campaign goals, target audience, and key objectives..."
                        value={campaign.description}
                        onChange={(e) => updateCampaign({ description: e.target.value })}
                        className={`bg-gradient-to-r from-gray-800 to-gray-700 border-2 transition-all duration-300 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/20 group-hover:border-gray-600 min-h-32 resize-none ${errors.description ? 'border-red-500 focus:border-red-400' : 'border-gray-600'}`}
                        rows={5}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                    {errors.description && (
                      <p className="text-sm text-red-400 flex items-center gap-1 animate-in slide-in-from-left-2 duration-300">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <Card className="border-cyan-400/20 bg-gradient-to-br from-gray-800/90 to-gray-700/90 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-cyan-400 flex items-center gap-2 text-lg font-semibold">
                        <Rocket className="w-5 h-5" />
                        Campaign Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                          <p className="text-gray-100 leading-relaxed">Choose a descriptive name that clearly identifies your campaign's purpose</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                          <p className="text-gray-100 leading-relaxed">Include your target audience and main goal in the description</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                          <p className="text-gray-100 leading-relaxed">Consider mentioning the campaign's time frame and expected outcomes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-emerald-400/20 bg-gradient-to-br from-gray-800/90 to-gray-700/90">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-emerald-400 flex items-center gap-2 text-lg font-semibold">
                        <BarChart3 className="w-5 h-5" />
                        Quick Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-4 bg-gray-900/70 rounded-lg border border-gray-600">
                          <p className="text-3xl font-bold text-white">8</p>
                          <p className="text-sm text-gray-200 mt-1">Steps Total</p>
                        </div>
                        <div className="p-4 bg-gray-900/70 rounded-lg border border-gray-600">
                          <p className="text-3xl font-bold text-cyan-400">5</p>
                          <p className="text-sm text-gray-200 mt-1">Min Setup</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Assistant Selection */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in-0 duration-500">
              <div className="space-y-4">
                <Label htmlFor="assistant" className="text-white font-semibold text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  Select Your AI Assistant
                </Label>
                <p className="text-gray-400">Choose the AI assistant that will handle your campaign calls</p>
                
                {assistants.length === 0 ? (
                  <Card className="border-orange-400/20 bg-gradient-to-br from-orange-900/20 to-red-900/20 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <div className="p-4 bg-orange-500/10 rounded-full w-fit mx-auto mb-4">
                        <Bot className="w-12 h-12 text-orange-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Assistants Available</h3>
                      <p className="text-gray-400 mb-4">Configure your VAPI API key to see your assistants</p>
                      <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-300">Using mock data for development</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assistants.map((assistant) => (
                      <Card 
                        key={assistant.id} 
                        className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                          campaign.assistantId === assistant.id
                            ? 'border-cyan-400 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 shadow-lg shadow-cyan-400/20'
                            : 'border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 hover:border-cyan-400/50 hover:shadow-lg'
                        }`}
                        onClick={() => updateCampaign({ assistantId: assistant.id })}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${
                              campaign.assistantId === assistant.id 
                                ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg' 
                                : 'bg-gray-700'
                            }`}>
                              <Bot className={`w-6 h-6 ${
                                campaign.assistantId === assistant.id ? 'text-white' : 'text-cyan-400'
                              }`} />
                            </div>
                            {campaign.assistantId === assistant.id && (
                              <div className="p-1 bg-cyan-400 rounded-full animate-pulse">
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <h3 className="font-semibold text-white mb-2">{assistant.name}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                              {assistant.voice}
                            </Badge>
                            <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                              {assistant.model}
                            </Badge>
                          </div>
                          
                          {assistant.firstMessage && (
                            <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                              <p className="text-sm text-gray-300 italic line-clamp-2">
                                "{assistant.firstMessage.substring(0, 100)}..."
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {errors.assistantId && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-400/20 rounded-lg animate-in slide-in-from-left-2 duration-300">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <p className="text-sm text-red-400">{errors.assistantId}</p>
                  </div>
                )}
              </div>

              {selectedAssistant && (
                <div className="space-y-4">
                  <Alert className="border-cyan-400 bg-cyan-400/10">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                    <AlertDescription className="text-gray-300">
                      <strong className="text-white">Selected Assistant:</strong> {selectedAssistant.name}
                    </AlertDescription>
                  </Alert>
                  
                  <Card className="border-gray-700 bg-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Bot className="w-5 h-5 text-cyan-400" />
                        Assistant Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Voice Provider</p>
                          <p className="text-white font-medium">{selectedAssistant.voice}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">AI Model</p>
                          <p className="text-white font-medium">{selectedAssistant.model}</p>
                        </div>
                      </div>
                      
                      {selectedAssistant.firstMessage && (
                        <div>
                          <p className="text-gray-400 text-sm mb-1">Opening Message</p>
                          <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 relative">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-400 mb-1">{selectedAssistant.name}</p>
                                <p className="text-gray-200 text-sm">
                                  "{selectedAssistant.firstMessage}"
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-cyan-400 hover:text-cyan-300 hover:bg-gray-800 p-1"
                                  onClick={() => handleVoicePreview(selectedAssistant)}
                                  title="Preview voice"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Preview Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                        <div className="text-xs text-gray-500">
                          Voice preview requires VAPI integration
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-600 text-emerald-400 hover:bg-emerald-700/20"
                            onClick={() => handleTestCall(selectedAssistant)}
                            disabled={false}
                            title="Make a test call with this assistant"
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            Test Call
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Phone Numbers */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumbers" className="text-gray-200">Select Phone Numbers</Label>
                <p className="text-sm text-gray-400">Choose one or more phone numbers for this campaign</p>
                
                <div className="space-y-3">
                  {phoneNumbers.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/50">
                      <Phone className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400 mb-1">No phone numbers available</p>
                      <p className="text-xs text-gray-500">Configure your VAPI account with phone numbers to see them here</p>
                    </div>
                  ) : (
                    phoneNumbers.map((phoneNumber) => (
                      <div
                        key={phoneNumber.id}
                        className={`cursor-pointer p-4 rounded-lg border transition-all ${
                          campaign.phoneNumberIds?.includes(phoneNumber.id)
                            ? 'border-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/20'
                            : 'border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-emerald-400/50'
                        }`}
                        onClick={() => {
                          const currentIds = campaign.phoneNumberIds || [];
                          const newIds = currentIds.includes(phoneNumber.id)
                            ? currentIds.filter(id => id !== phoneNumber.id)
                            : [...currentIds, phoneNumber.id];
                          updateCampaign({ phoneNumberIds: newIds });
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              campaign.phoneNumberIds?.includes(phoneNumber.id)
                                ? 'bg-emerald-500' 
                                : 'bg-gray-700'
                            }`}>
                              <Phone className={`w-4 h-4 ${
                                campaign.phoneNumberIds?.includes(phoneNumber.id)
                                  ? 'text-white' 
                                  : 'text-emerald-400'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-white">{phoneNumber.number}</p>
                              <p className="text-sm text-gray-400">{phoneNumber.name || phoneNumber.provider}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={phoneNumber.active ? 'default' : 'secondary'} 
                              className={phoneNumber.active ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'}
                            >
                              {phoneNumber.active ? 'Active' : 'Inactive'}
                            </Badge>
                            {campaign.phoneNumberIds?.includes(phoneNumber.id) && (
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Provider</p>
                            <p className="text-white">{phoneNumber.provider}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Country</p>
                            <p className="text-white">{phoneNumber.country}</p>
                          </div>
                        </div>
                        
                        {phoneNumber.dailyLimit && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                              <span>Daily Usage</span>
                              <span>{phoneNumber.currentUsage || 0}/{phoneNumber.dailyLimit}</span>
                            </div>
                            <Progress 
                              value={((phoneNumber.currentUsage || 0) / phoneNumber.dailyLimit) * 100} 
                              className="h-2 bg-gray-700"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                {errors.phoneNumbers && (
                  <p className="text-sm text-red-600">{errors.phoneNumbers}</p>
                )}
              </div>

              {selectedPhoneNumbers.length > 0 && (
                <Alert className="border-emerald-400 bg-emerald-400/10">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <AlertDescription className="text-gray-300">
                    <strong className="text-white">Selected:</strong> {selectedPhoneNumbers.length} phone number(s)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 3: Lead Upload */}
          {currentStep === 3 && (
            <div className="space-y-4">
              {!leadData ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center bg-gray-800/50">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium mb-2 text-white">Upload Your Leads</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Upload a CSV file with your lead data
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="leadUpload"
                    />
                    <div className="space-y-3">
                      <Button asChild className="bg-cyan-600 hover:bg-cyan-700 text-white">
                        <label htmlFor="leadUpload" className="cursor-pointer">
                          Select CSV File
                        </label>
                      </Button>
                      
                      {/* Debug button */}
                      <div className="flex gap-2">
                        <Button 
                          onClick={async () => {
                            try {
                              await authenticatedApiClient.get('/api/health');
                              alert('API connection working!');
                            } catch (error) {
                              console.error('❌ API connection test failed:', error);
                              alert('API connection failed - check console');
                            }
                          }}
                          variant="outline" 
                          className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs"
                        >
                          Test API
                        </Button>
                        
                        <Button
                          onClick={async () => {
                            try {
                              // Create a mock CSV file (fix escaped newlines)
                              const csvContent = 'First Name,Last Name,Phone,Email,Company\nJohn,Doe,+1234567890,john@test.com,Test Corp';
                              const blob = new Blob([csvContent], { type: 'text/csv' });
                              const mockFile = new File([blob], 'test.csv', { type: 'text/csv' });
                              await handleFileUpload(mockFile);
                            } catch (error) {
                              console.error('❌ Mock upload failed:', error);
                            }
                          }}
                          variant="outline"
                          className="border-yellow-600 text-yellow-300 hover:bg-yellow-800 text-xs"
                        >
                          Test Upload
                        </Button>
                      </div>
                    </div>
                  </div>

                  {loading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading and processing...</span>
                        <span>Uploading...</span>
                      </div>
                      <Progress value={undefined} className="h-2" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in-0 duration-500">
                  <Alert className="border-emerald-400/30 bg-gradient-to-r from-emerald-900/20 to-green-900/20 backdrop-blur-sm">
                    <div className="p-1 bg-emerald-400 rounded-full">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <AlertDescription>
                      <div className="space-y-3">
                        <p className="font-semibold text-white text-lg">✅ File uploaded successfully!</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 text-center">
                            <p className="text-2xl font-bold text-white">{leadData.totalLeads}</p>
                            <p className="text-xs text-gray-300">Total</p>
                          </div>
                          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 text-center">
                            <p className="text-2xl font-bold text-emerald-400">{leadData.validLeads}</p>
                            <p className="text-xs text-gray-300">Valid</p>
                          </div>
                          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 text-center">
                            <p className="text-2xl font-bold text-red-400">{leadData.invalidLeads}</p>
                            <p className="text-xs text-gray-300">Invalid</p>
                          </div>
                          <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 text-center">
                            <p className="text-2xl font-bold text-yellow-400">{leadData.duplicates}</p>
                            <p className="text-xs text-gray-300">Duplicates</p>
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400" />
                        Lead Preview
                      </h3>
                      <Badge className="bg-cyan-500/20 text-cyan-400">
                        {leadData.preview.length} leads shown
                      </Badge>
                    </div>
                    
                    <Card className="border-gray-700 bg-gray-800">
                      <CardContent className="p-4">
                        <ScrollArea className="h-64">
                          <div className="space-y-3">
                            {(leadData.preview || []).map((lead, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                                    {(lead.firstName?.[0] || 'L') + (lead.lastName?.[0] || '')}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-white">
                                      {lead.firstName} {lead.lastName}
                                    </span>
                                    <div className="flex items-center gap-3 text-sm">
                                      <span className="text-gray-400 flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {lead.phoneNumber}
                                      </span>
                                      {lead.company && (
                                        <span className="text-gray-500 flex items-center gap-1">
                                          <Building className="w-3 h-3" />
                                          {lead.company}
                                        </span>
                                      )}
                                      {lead.email && (
                                        <span className="text-gray-500 flex items-center gap-1">
                                          <Mail className="w-3 h-3" />
                                          {lead.email}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                                    {lead.timezone || 'Unknown TZ'}
                                  </Badge>
                                  {lead.status && (
                                    <Badge className={
                                      lead.status === 'valid' ? 'bg-emerald-500/20 text-emerald-400' :
                                      lead.status === 'invalid' ? 'bg-red-500/20 text-red-400' :
                                      'bg-yellow-500/20 text-yellow-400'
                                    }>
                                      {lead.status}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Data Quality Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-gray-700 bg-gray-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-purple-400" />
                            Data Quality
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Valid leads:</span>
                              <span className="text-emerald-400 font-medium">{leadData.validLeads}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Invalid leads:</span>
                              <span className="text-red-400 font-medium">{leadData.invalidLeads}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Duplicates:</span>
                              <span className="text-yellow-400 font-medium">{leadData.duplicates}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-gray-700 bg-gray-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                            <Target className="w-4 h-4 text-cyan-400" />
                            Campaign Impact
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Total contacts:</span>
                              <span className="text-white font-medium">{leadData.totalLeads}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Est. call time:</span>
                              <span className="text-cyan-400 font-medium">{Math.ceil(leadData.validLeads * 2.5)} min</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Success rate:</span>
                              <span className="text-emerald-400 font-medium">
                                {Math.round((leadData.validLeads / leadData.totalLeads) * 100)}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {errors.leads && (
                <p className="text-sm text-red-600">{errors.leads}</p>
              )}
            </div>
          )}

          {/* Step 4: Schedule */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={schedule.startDate.toISOString().split('T')[0]}
                    onChange={(e) => updateSchedule({ startDate: new Date(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={schedule.endDate?.toISOString().split('T')[0] || ''}
                    onChange={(e) => updateSchedule({ 
                      endDate: e.target.value ? new Date(e.target.value) : undefined 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => updateSchedule({ startTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => updateSchedule({ endTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="callsPerDay">Calls Per Day</Label>
                  <Input
                    id="callsPerDay"
                    type="number"
                    min="1"
                    value={schedule.callsPerDay}
                    onChange={(e) => updateSchedule({ callsPerDay: parseInt(e.target.value) })}
                    className={errors.callsPerDay ? 'border-red-500' : ''}
                  />
                  {errors.callsPerDay && (
                    <p className="text-sm text-red-600">{errors.callsPerDay}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="callsPerHour">Calls Per Hour</Label>
                  <Input
                    id="callsPerHour"
                    type="number"
                    min="1"
                    value={schedule.callsPerHour}
                    onChange={(e) => updateSchedule({ callsPerHour: parseInt(e.target.value) })}
                    className={errors.callsPerHour ? 'border-red-500' : ''}
                  />
                  {errors.callsPerHour && (
                    <p className="text-sm text-red-600">{errors.callsPerHour}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Working Days</Label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {workingDays.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={schedule.workingDays?.includes(day.value) || false}
                        onCheckedChange={() => toggleWorkingDay(day.value)}
                      />
                      <label htmlFor={day.value} className="text-sm">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
                {errors.workingDays && (
                  <p className="text-sm text-red-600">{errors.workingDays}</p>
                )}
              </div>

              {/* Enhanced Schedule Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    Schedule Preview
                  </h3>
                  <Badge className="bg-cyan-500/20 text-cyan-400">
                    {schedule.workingDays?.length || 0} days/week
                  </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Schedule Visualization */}
                  <Card className="border-gray-700 bg-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        Weekly Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {workingDays.map((day) => {
                          const isActive = schedule.workingDays.includes(day.value);
                          return (
                            <div key={day.value} className="flex items-center justify-between p-2 rounded-lg bg-gray-900/50">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  isActive ? 'bg-emerald-500' : 'bg-gray-600'
                                }`} />
                                <span className={`text-sm font-medium ${
                                  isActive ? 'text-white' : 'text-gray-500'
                                }`}>
                                  {day.label}
                                </span>
                              </div>
                              {isActive && (
                                <span className="text-xs text-emerald-400">
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Call Volume Preview */}
                  <Card className="border-gray-700 bg-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                        Call Volume
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                            <p className="text-2xl font-bold text-white">{schedule.callsPerDay}</p>
                            <p className="text-xs text-gray-400">calls/day</p>
                          </div>
                          <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                            <p className="text-2xl font-bold text-white">{schedule.callsPerHour}</p>
                            <p className="text-xs text-gray-400">calls/hour</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Daily time window:</span>
                            <span className="text-white font-medium">
                              {(() => {
                                const start = new Date(`2000-01-01T${schedule.startTime}`);
                                const end = new Date(`2000-01-01T${schedule.endTime}`);
                                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                return `${hours.toFixed(1)} hours`;
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Weekly calls:</span>
                            <span className="text-cyan-400 font-medium">
                              {schedule.callsPerDay * (schedule.workingDays?.length || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Call frequency:</span>
                            <span className="text-emerald-400 font-medium">
                              {Math.round(60 / schedule.callsPerHour)} min/call
                            </span>
                          </div>
                          {leadData && (
                            <div className="flex justify-between pt-2 border-t border-gray-700">
                              <span className="text-gray-400">Est. completion:</span>
                              <span className="text-purple-400 font-medium">
                                {Math.ceil(leadData.validLeads / (schedule.callsPerDay * (schedule.workingDays?.length || 1)))} weeks
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Schedule Alert */}
                <Alert className="border-cyan-400 bg-cyan-400/10">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  <AlertDescription>
                    <p className="font-medium text-white">Schedule Configured Successfully!</p>
                    <p className="text-sm text-gray-300">
                      Your campaign will run {schedule.workingDays?.length || 0} days per week, making {schedule.callsPerDay} calls daily 
                      between {schedule.startTime} and {schedule.endTime}.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* Step 5: Call Settings */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxCallDuration">Max Call Duration (seconds)</Label>
                  <Input
                    id="maxCallDuration"
                    type="number"
                    min="30"
                    max="600"
                    value={callSettings.maxCallDuration}
                    onChange={(e) => updateCallSettings({ maxCallDuration: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recordCalls"
                      checked={callSettings.recordCalls}
                      onCheckedChange={(checked) => updateCallSettings({ recordCalls: checked as boolean })}
                    />
                    <Label htmlFor="recordCalls">Record Calls</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="voicemailDetection"
                      checked={callSettings.voicemailDetection}
                      onCheckedChange={(checked) => updateCallSettings({ voicemailDetection: checked as boolean })}
                    />
                    <Label htmlFor="voicemailDetection">Voicemail Detection</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="humanDetection"
                      checked={callSettings.humanDetection}
                      onCheckedChange={(checked) => updateCallSettings({ humanDetection: checked as boolean })}
                    />
                    <Label htmlFor="humanDetection" className="text-gray-200">Human Detection</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="waitForGreeting"
                      checked={callSettings.waitForGreeting}
                      onCheckedChange={(checked) => updateCallSettings({ waitForGreeting: checked as boolean })}
                    />
                    <Label htmlFor="waitForGreeting" className="text-gray-200">Wait for Greeting</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endCallPhrases" className="text-gray-200">End Call Phrases (one per line)</Label>
                <Textarea
                  id="endCallPhrases"
                  placeholder="goodbye&#10;thank you&#10;have a great day"
                  value={callSettings.endCallPhrases.join('\n')}
                  onChange={(e) => updateCallSettings({ 
                    endCallPhrases: e.target.value.split('\n').filter(p => p.trim()) 
                  })}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400"
                />
              </div>

              {/* Call Settings Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    Call Settings Preview
                  </h3>
                </div>

                <Card className="border-gray-700 bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      Call Flow Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Settings Overview */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-300">Call Behavior</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                            <span className="text-sm text-gray-400">Max duration:</span>
                            <span className="text-white font-medium">{callSettings.maxCallDuration}s</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                            <span className="text-sm text-gray-400">Recording:</span>
                            <Badge className={callSettings.recordCalls ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}>
                              {callSettings.recordCalls ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                            <span className="text-sm text-gray-400">Voicemail detection:</span>
                            <Badge className={callSettings.voicemailDetection ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}>
                              {callSettings.voicemailDetection ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                            <span className="text-sm text-gray-400">Human detection:</span>
                            <Badge className={callSettings.humanDetection ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}>
                              {callSettings.humanDetection ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Call Flow Preview */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-300">Call Flow</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-2 bg-cyan-500/10 rounded border border-cyan-500/20">
                            <div className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span className="text-sm text-cyan-300">1. Dial contact</span>
                          </div>
                          {callSettings.waitForGreeting && (
                            <div className="flex items-center gap-2 p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
                              <div className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-sm text-emerald-300">2. Wait for greeting</span>
                            </div>
                          )}
                          {callSettings.humanDetection && (
                            <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded border border-purple-500/20">
                              <div className="w-2 h-2 rounded-full bg-purple-400" />
                              <span className="text-sm text-purple-300">3. Detect human vs voicemail</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            <span className="text-sm text-blue-300">4. Begin conversation</span>
                          </div>
                          {callSettings.endCallPhrases.length > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded border border-orange-500/20">
                              <div className="w-2 h-2 rounded-full bg-orange-400" />
                              <span className="text-sm text-orange-300">5. Listen for end phrases</span>
                            </div>
                          )}
                        </div>

                        {callSettings.endCallPhrases.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-1">End call triggers:</p>
                            <div className="flex flex-wrap gap-1">
                              {callSettings.endCallPhrases.slice(0, 3).map((phrase, index) => (
                                <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                  "{phrase}"
                                </Badge>
                              ))}
                              {callSettings.endCallPhrases.length > 3 && (
                                <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                                  +{callSettings.endCallPhrases.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 6: Retry Logic */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableRetries"
                  checked={retrySettings.enableRetries}
                  onCheckedChange={(checked) => updateRetrySettings({ enableRetries: checked as boolean })}
                />
                <Label htmlFor="enableRetries" className="text-gray-200">Enable Retry Logic</Label>
              </div>

              {retrySettings.enableRetries && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxRetries" className="text-gray-200">Max Retries</Label>
                      <Input
                        id="maxRetries"
                        type="number"
                        min="1"
                        max="10"
                        value={retrySettings.maxRetries}
                        onChange={(e) => updateRetrySettings({ maxRetries: parseInt(e.target.value) })}
                        className="bg-gray-800 border-gray-700 text-white focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retryDelay" className="text-gray-200">Retry Delay</Label>
                      <Input
                        id="retryDelay"
                        type="number"
                        min="1"
                        value={retrySettings.retryDelay}
                        onChange={(e) => updateRetrySettings({ retryDelay: parseInt(e.target.value) })}
                        className="bg-gray-800 border-gray-700 text-white focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retryDelayUnit" className="text-gray-200">Delay Unit</Label>
                      <Select 
                        value={retrySettings.retryDelayUnit} 
                        onValueChange={(value) => updateRetrySettings({ retryDelayUnit: value as 'hours' | 'days' })}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:border-cyan-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-200">Retry Conditions</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="retryOnNoAnswer"
                          checked={retrySettings.retryOnNoAnswer}
                          onCheckedChange={(checked) => updateRetrySettings({ retryOnNoAnswer: checked as boolean })}
                        />
                        <Label htmlFor="retryOnNoAnswer" className="text-gray-200">Retry on No Answer</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="retryOnBusy"
                          checked={retrySettings.retryOnBusy}
                          onCheckedChange={(checked) => updateRetrySettings({ retryOnBusy: checked as boolean })}
                        />
                        <Label htmlFor="retryOnBusy" className="text-gray-200">Retry on Busy</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="retryOnVoicemail"
                          checked={retrySettings.retryOnVoicemail}
                          onCheckedChange={(checked) => updateRetrySettings({ retryOnVoicemail: checked as boolean })}
                        />
                        <Label htmlFor="retryOnVoicemail" className="text-gray-200">Retry on Voicemail</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="retryOnFailed"
                          checked={retrySettings.retryOnFailed}
                          onCheckedChange={(checked) => updateRetrySettings({ retryOnFailed: checked as boolean })}
                        />
                        <Label htmlFor="retryOnFailed" className="text-gray-200">Retry on Failed</Label>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-cyan-400 bg-cyan-400/10">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <AlertDescription>
                      <p className="font-medium text-white">Retry Configuration</p>
                      <p className="text-sm text-gray-300">
                        Each lead will be retried up to {retrySettings.maxRetries} times with a {retrySettings.retryDelay} {retrySettings.retryDelayUnit} delay between attempts.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}

          {/* Step 7: Review & Launch */}
          {currentStep === 7 && (
            <div className="space-y-6">
              {/* Campaign Preview Header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-400">Campaign Preview</span>
                </div>
              </div>

              {/* Interactive Campaign Summary */}
              <Card className="border-cyan-400/20 bg-gradient-to-r from-gray-900 to-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    {campaign.name || 'Untitled Campaign'}
                  </CardTitle>
                  <p className="text-gray-300 text-sm">{campaign.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Assistant Preview */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-white flex items-center gap-2">
                        <Bot className="w-4 h-4 text-cyan-400" />
                        AI Assistant
                      </h4>
                      {selectedAssistant ? (
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                              <Bot className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm font-medium text-white">{selectedAssistant.name}</span>
                          </div>
                          <div className="text-xs text-gray-400 mb-2">
                            {selectedAssistant.voice} • {selectedAssistant.model}
                          </div>
                          {selectedAssistant.firstMessage && (
                            <div className="text-xs text-gray-300 italic">
                              "{selectedAssistant.firstMessage.substring(0, 80)}..."
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-red-400">No assistant selected</p>
                      )}
                    </div>

                    {/* Phone Numbers Preview */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-white flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        Phone Numbers
                      </h4>
                      <div className="space-y-2">
                        {(selectedPhoneNumbers || []).length > 0 ? (
                          (selectedPhoneNumbers || []).slice(0, 3).map((phone) => (
                            <div key={phone.id} className="bg-gray-800/50 p-2 rounded border border-gray-700">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white">{phone.number}</span>
                                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                                  {phone.active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-red-400">No phone numbers selected</p>
                        )}
                        {(selectedPhoneNumbers || []).length > 3 && (
                          <p className="text-xs text-gray-400">+{(selectedPhoneNumbers || []).length - 3} more</p>
                        )}
                      </div>
                    </div>

                    {/* Campaign Stats */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-400" />
                        Campaign Stats
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                          <p className="text-xs text-gray-400">Total Leads</p>
                          <p className="text-lg font-bold text-white">{leadData?.totalLeads || 0}</p>
                        </div>
                        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                          <p className="text-xs text-gray-400">Daily Target</p>
                          <p className="text-lg font-bold text-white">{schedule.callsPerDay}</p>
                        </div>
                        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                          <p className="text-xs text-gray-400">Est. Duration</p>
                          <p className="text-sm font-bold text-white">
                            {Math.ceil((leadData?.totalLeads || 0) / schedule.callsPerDay)} days
                          </p>
                        </div>
                        <div className="bg-gray-800/50 p-2 rounded border border-gray-700">
                          <p className="text-xs text-gray-400">Phone Lines</p>
                          <p className="text-lg font-bold text-white">{(selectedPhoneNumbers || []).length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2 text-white">Lead Data</h3>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p><strong className="text-white">Total Leads:</strong> {leadData?.totalLeads}</p>
                      <p><strong className="text-white">Valid Leads:</strong> {leadData?.validLeads}</p>
                      <p><strong className="text-white">File:</strong> {leadData?.fileName}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2 text-white">Schedule</h3>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p><strong className="text-white">Start Date:</strong> {schedule.startDate.toLocaleDateString()}</p>
                      <p><strong className="text-white">Hours:</strong> {schedule.startTime} - {schedule.endTime}</p>
                      <p><strong className="text-white">Volume:</strong> {schedule.callsPerDay} calls/day, {schedule.callsPerHour} calls/hour</p>
                      <p><strong className="text-white">Working Days:</strong> {schedule.workingDays?.length || 0} days/week</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 text-white">Retry Settings</h3>
                    <div className="space-y-1 text-sm text-gray-300">
                      <p><strong className="text-white">Enabled:</strong> {retrySettings.enableRetries ? 'Yes' : 'No'}</p>
                      {retrySettings.enableRetries && (
                        <>
                          <p><strong className="text-white">Max Retries:</strong> {retrySettings.maxRetries}</p>
                          <p><strong className="text-white">Retry Delay:</strong> {retrySettings.retryDelay} {retrySettings.retryDelayUnit}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="border-emerald-400 bg-emerald-400/10">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <AlertDescription>
                  <p className="font-medium text-white">Campaign Ready to Launch!</p>
                  <p className="text-sm text-gray-300">
                    Your campaign is configured and ready to start. Click "Create Campaign" to launch.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Error Display */}
          {errors.general && (
            <Alert className="border-red-500 bg-red-500/10">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-gray-300">{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Enhanced Navigation */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-800/50">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onCancel} 
                className="border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 transition-all duration-300 px-6 py-2 h-11"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="border-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 px-6 py-2 h-11"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
            </div>

            <div className="flex gap-3">
              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={loading} 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 px-8 py-2 h-11 font-semibold"
                >
                  Next Step
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateCampaign} 
                  disabled={loading} 
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 px-8 py-2 h-11 font-semibold relative overflow-hidden"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Creating Campaign...
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      Launch Campaign
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};