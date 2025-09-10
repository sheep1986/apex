import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { vapiOutboundService } from '../services/vapi-outbound.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Target,
  Phone,
  Bot,
  Upload,
  DollarSign,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  AlertCircle,
  CreditCard,
  Calendar,
  Clock,
  FileText,
  Download,
  Sparkles,
  ArrowRight,
  Globe,
  Building,
  User,
  Info,
} from 'lucide-react';

interface CampaignData {
  // Step 1: Name & Objective
  name: string;
  objective: string;
  description: string;

  // Step 2: Phone Numbers
  phoneNumber: string;
  twilioIntegration: boolean;
  vapiPhoneId: string;

  // Step 3: Voice Agent
  voiceAgent: string;
  voiceSettings: {
    speed: number;
    pitch: number;
    temperature: number;
  };

  // Step 4: Test Voice Agent
  testCompleted: boolean;
  testNotes: string;

  // Step 5: Import Leads
  leads: Lead[];
  csvFileName: string;

  // Step 6: Budget & Credits
  budget: number;
  callCredits: number;
  autoReload: boolean;
  autoReloadThreshold: number;

  // Step 7: Team Assignment
  assignedTeam: string[];
  teamLeader: string;

  // Step 8: Review
  scheduledStart?: string;
  immediateStart: boolean;

  // New fields for Campaign Type
  campaignType: 'b2b' | 'b2c' | '';
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  company?: string;
  title?: string;
  customFields?: Record<string, any>;
}

const STEPS = [
  { id: 1, name: 'Campaign Type', icon: Target },
  { id: 2, name: 'Name & Objective', icon: Target },
  { id: 3, name: 'Phone Numbers', icon: Phone },
  { id: 4, name: 'Voice Agent', icon: Bot },
  { id: 5, name: 'Test Agent', icon: Play },
  { id: 6, name: 'Import Leads', icon: Upload },
  { id: 7, name: 'Budget & Credits', icon: DollarSign },
  { id: 8, name: 'Team Assignment', icon: Users },
  { id: 9, name: 'Final Review', icon: CheckCircle2 },
];

const OBJECTIVES = [
  { id: 'sales', name: 'Sales Outreach', description: 'Generate new sales opportunities' },
  { id: 'qualification', name: 'Lead Qualification', description: 'Qualify and score leads' },
  { id: 'followup', name: 'Follow-up', description: 'Re-engage existing leads' },
  { id: 'survey', name: 'Survey', description: 'Collect feedback and insights' },
  { id: 'appointment', name: 'Appointment Setting', description: 'Schedule meetings' },
  { id: 'custom', name: 'Custom', description: 'Define your own objective' },
];

const VOICE_AGENTS = [
  {
    id: 'emma',
    name: 'Emma - Sales Specialist',
    description: 'Friendly and persuasive, great for B2C sales',
    avatar: '👩‍💼',
    languages: ['English', 'Spanish'],
    specialties: ['Sales', 'Product Demos', 'Objection Handling'],
  },
  {
    id: 'marcus',
    name: 'Marcus - Enterprise Sales',
    description: 'Professional and consultative for B2B',
    avatar: '👨‍💼',
    languages: ['English'],
    specialties: ['Enterprise Sales', 'Technical Discussions', 'ROI Analysis'],
  },
  {
    id: 'sophia',
    name: 'Sophia - Lead Qualifier',
    description: 'Efficient at gathering information and scoring leads',
    avatar: '👩‍💻',
    languages: ['English', 'French'],
    specialties: ['Lead Qualification', 'Data Collection', 'Scheduling'],
  },
  {
    id: 'alex',
    name: 'Alex - Customer Success',
    description: 'Warm and helpful for follow-ups and support',
    avatar: '🧑‍💼',
    languages: ['English'],
    specialties: ['Follow-ups', 'Customer Support', 'Satisfaction Surveys'],
  },
];

const TEAM_MEMBERS = [
  { id: '1', name: 'Sarah Johnson', role: 'Sales Manager', avatar: 'SJ' },
  { id: '2', name: 'Mike Davis', role: 'Senior Sales Rep', avatar: 'MD' },
  { id: '3', name: 'Emily Wilson', role: 'Sales Rep', avatar: 'EW' },
  { id: '4', name: 'John Smith', role: 'Sales Rep', avatar: 'JS' },
  { id: '5', name: 'Lisa Chen', role: 'Sales Coordinator', avatar: 'LC' },
];

export default function CampaignSetupWizard() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    objective: '',
    description: '',
    phoneNumber: '',
    twilioIntegration: false,
    vapiPhoneId: '',
    voiceAgent: '',
    voiceSettings: {
      speed: 1.0,
      pitch: 1.0,
      temperature: 0.7,
    },
    testCompleted: false,
    testNotes: '',
    leads: [],
    csvFileName: '',
    budget: 100,
    callCredits: 1000,
    autoReload: false,
    autoReloadThreshold: 100,
    assignedTeam: [],
    teamLeader: '',
    immediateStart: true,
    campaignType: '' as 'b2b' | 'b2c' | '',
  });

  // Draft Management Functions
  const DRAFT_STORAGE_KEY = 'campaign-wizard-draft';

  const isDraftPresent = () => {
    return localStorage.getItem(DRAFT_STORAGE_KEY) !== null;
  };

  const hasUnsavedChanges = () => {
    const hasChanges = (
      campaignData.name.trim() !== '' ||
      campaignData.objective.trim() !== '' ||
      campaignData.description.trim() !== '' ||
      campaignData.phoneNumber.trim() !== '' ||
      campaignData.voiceAgent.trim() !== '' ||
      campaignData.leads.length > 0 ||
      campaignData.csvFileName.trim() !== '' ||
      campaignData.campaignType !== '' ||
      currentStep > 1 ||
      userHasInteracted ||
      // Add this temporary test - if user has interacted with the form at all
      Object.keys(errors).length > 0
    );
    
    console.log('🔍 Draft check:', {
      name: campaignData.name.trim(),
      objective: campaignData.objective.trim(),
      description: campaignData.description.trim(),
      phoneNumber: campaignData.phoneNumber.trim(),
      voiceAgent: campaignData.voiceAgent.trim(),
      leadsCount: campaignData.leads.length,
      csvFileName: campaignData.csvFileName.trim(),
      campaignType: campaignData.campaignType,
      currentStep,
      hasChanges
    });
    
    return hasChanges;
  };

  const saveDraft = async () => {
    if (!hasUnsavedChanges()) return;
    
    setIsDraftSaving(true);
    try {
      const draftData = {
        campaignData,
        currentStep,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      console.log('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsDraftSaving(false);
    }
  };

  const loadDraft = () => {
    try {
      const draftJson = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftJson) {
        const draft = JSON.parse(draftJson);
        setCampaignData(draft.campaignData);
        setCurrentStep(draft.currentStep);
        return true;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    return false;
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const handleExitAttempt = (path: string) => {
    console.log('🚪 Exit attempt to:', path);
    const hasChanges = hasUnsavedChanges();
    console.log('🚪 Has unsaved changes:', hasChanges);
    
    if (hasChanges) {
      console.log('🚪 Showing exit dialog');
      setPendingNavigation(path);
      setShowExitDialog(true);
    } else {
      console.log('🚪 No changes, navigating directly');
      navigate(path);
    }
  };

  const handleSaveAndExit = async () => {
    await saveDraft();
    setShowExitDialog(false);
    if (pendingNavigation) {
      // Proceed with the blocked navigation
      if (blocker.state === 'blocked') {
        blocker.proceed();
      } else {
        navigate(pendingNavigation);
      }
      setPendingNavigation(null);
    }
  };

  const handleExitWithoutSaving = () => {
    clearDraft();
    setShowExitDialog(false);
    if (pendingNavigation) {
      // Proceed with the blocked navigation
      if (blocker.state === 'blocked') {
        blocker.proceed();
      } else {
        navigate(pendingNavigation);
      }
      setPendingNavigation(null);
    }
  };

  // Apex Data State
  const [voiceAgents, setVoiceAgents] = useState<any[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [apexErrors, setApexErrors] = useState<string[]>([]);
  const [apexConnected, setApexConnected] = useState(false);

  const progressPercentage = (currentStep / STEPS.length) * 100;

  // Load Apex Data on Component Mount
  useEffect(() => {
    const loadApexData = async () => {
      try {
        setLoadingAgents(true);
        setLoadingNumbers(true);
        setApexErrors([]);

        console.log('🔄 Loading Apex data...');

        // Load assistants and phone numbers in parallel
        console.log('🔄 Campaign Wizard: Loading Apex data from backend...');
        console.log(
          '🔄 Campaign Wizard: API Base URL:',
          import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
        );

        const [assistantsResponse, numbersResponse] = await Promise.all([
          vapiOutboundService.getAssistants().catch((err) => {
            console.error('❌ Failed to load assistants:', err);
            console.error('❌ Error details:', err.response?.data || err.message);
            return { assistants: [] };
          }),
          vapiOutboundService.getPhoneNumbers().catch((err) => {
            console.error('❌ Failed to load phone numbers:', err);
            console.error('❌ Error details:', err.response?.data || err.message);
            return { phoneNumbers: [] };
          }),
        ]);

        console.log('📞 Loaded assistants:', assistantsResponse);
        console.log('📱 Loaded phone numbers:', numbersResponse);

        // Set the loaded data - handle both array and object responses
        const assistants = Array.isArray(assistantsResponse)
          ? assistantsResponse
          : assistantsResponse.assistants || [];
        const phoneNums = Array.isArray(numbersResponse)
          ? numbersResponse
          : numbersResponse.phoneNumbers || [];

        setVoiceAgents(assistants);
        setPhoneNumbers(phoneNums);
        setApexConnected(true);

        // Clear any previous errors if successful
        if (assistants.length > 0 || phoneNums.length > 0) {
          setApexErrors([]);
        }
      } catch (error) {
        console.error('❌ Error loading Apex data:', error);
        setApexErrors([
          'Failed to connect to Apex service. Please check your Apex credentials in Settings.',
        ]);
        setApexConnected(false);
      } finally {
        setLoadingAgents(false);
        setLoadingNumbers(false);
      }
    };

    loadApexData();
  }, []);

  // Load draft on component mount
  useEffect(() => {
    if (isDraftPresent()) {
      loadDraft();
    }
  }, []);

  // Auto-save draft when campaign data changes
  useEffect(() => {
    if (hasUnsavedChanges()) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [campaignData, currentStep]);

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Do you want to save your progress as a draft?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [campaignData, currentStep]);

  // Block React Router navigation when there are unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      console.log('🚧 Router blocker triggered:', { 
        currentLocation: currentLocation.pathname, 
        nextLocation: nextLocation.pathname,
        hasChanges: hasUnsavedChanges()
      });
      const shouldBlock = hasUnsavedChanges() && currentLocation.pathname !== nextLocation.pathname;
      console.log('🚧 Should block navigation:', shouldBlock);
      
      return shouldBlock;
    }
  );

  // Handle the blocked navigation
  useEffect(() => {
    if (blocker.state === 'blocked') {
      console.log('🚧 Navigation blocked, showing dialog');
      setPendingNavigation(blocker.location?.pathname || '/campaigns');
      setShowExitDialog(true);
    }
  }, [blocker.state]);

  // Add global event listeners to detect user interaction
  useEffect(() => {
    const handleInteraction = () => {
      console.log('👤 User interaction detected');
      setUserHasInteracted(true);
    };

    // Listen for any input, click, or keyboard events on the page
    document.addEventListener('input', handleInteraction);
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('input', handleInteraction);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!campaignData.name.trim()) newErrors.name = 'Campaign name is required';
        if (!campaignData.objective) newErrors.objective = 'Please select an objective';
        break;
      case 2:
        if (!campaignData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
        break;
      case 3:
        if (!campaignData.voiceAgent) newErrors.voiceAgent = 'Please select a voice agent';
        break;
      case 4:
        if (!campaignData.testCompleted)
          newErrors.test = 'Please test the voice agent before proceeding';
        break;
      case 5:
        if (campaignData.leads.length === 0) newErrors.leads = 'Please import at least one lead';
        break;
      case 6:
        if (campaignData.budget < 10) newErrors.budget = 'Minimum budget is $10';
        break;
      case 7:
        if (campaignData.assignedTeam.length === 0)
          newErrors.team = 'Please assign at least one team member';
        if (!campaignData.teamLeader) newErrors.teamLeader = 'Please select a team leader';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow going back to previous steps without validation
    if (stepId < currentStep) {
      setCurrentStep(stepId);
      setErrors({});
    } else if (stepId === currentStep + 1) {
      // Allow going to next step with validation
      handleNext();
    }
  };

  const updateCampaignData = (updates: Partial<CampaignData>) => {
    setCampaignData((prev) => ({ ...prev, ...updates }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-medium text-white">Select Campaign Type</h3>
              <p className="mb-6 text-sm text-gray-400">
                Choose whether you're targeting businesses or individual consumers
              </p>
            </div>

            <RadioGroup
              value={campaignData.campaignType}
              onValueChange={(value: 'b2b' | 'b2c') =>
                setCampaignData({ ...campaignData, campaignType: value })
              }
            >
              <div className="space-y-4">
                <div
                  className={`cursor-pointer rounded-lg border p-6 transition-all ${
                    campaignData.campaignType === 'b2b'
                      ? 'border-emerald-500 bg-emerald-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <RadioGroupItem value="b2b" id="b2b" className="sr-only" />
                  <Label htmlFor="b2b" className="cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-blue-900/30 p-3">
                        <Building className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="mb-1 font-medium text-white">B2B (Business to Business)</h4>
                        <p className="mb-3 text-sm text-gray-400">
                          Target business decision makers and companies
                        </p>
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">Required fields:</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="border-blue-800 bg-blue-900/30 text-blue-300">
                              Company Name
                            </Badge>
                            <Badge className="border-blue-800 bg-blue-900/30 text-blue-300">
                              Contact Title
                            </Badge>
                            <Badge className="border-blue-800 bg-blue-900/30 text-blue-300">
                              Industry
                            </Badge>
                            <Badge className="border-blue-800 bg-blue-900/30 text-blue-300">
                              Company Size
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>

                <div
                  className={`cursor-pointer rounded-lg border p-6 transition-all ${
                    campaignData.campaignType === 'b2c'
                      ? 'border-emerald-500 bg-emerald-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <RadioGroupItem value="b2c" id="b2c" className="sr-only" />
                  <Label htmlFor="b2c" className="cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-emerald-900/30 p-3">
                        <User className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="mb-1 font-medium text-white">B2C (Business to Consumer)</h4>
                        <p className="mb-3 text-sm text-gray-400">
                          Target individual consumers with personalized offers
                        </p>
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500">Required fields:</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="border-emerald-800 bg-emerald-900/30 text-emerald-300">
                              Age Range
                            </Badge>
                            <Badge className="border-emerald-800 bg-emerald-900/30 text-emerald-300">
                              Interests
                            </Badge>
                            <Badge className="border-emerald-800 bg-emerald-900/30 text-emerald-300">
                              Location
                            </Badge>
                            <Badge className="border-emerald-800 bg-emerald-900/30 text-emerald-300">
                              Consent Status
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {campaignData.campaignType && (
              <Alert className="border-gray-700 bg-gray-800/50">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-gray-300">
                  {campaignData.campaignType === 'b2b'
                    ? 'B2B campaigns focus on ROI, efficiency, and business value propositions. Your AI agent will be configured to speak professionally about business benefits.'
                    : 'B2C campaigns require consent management and focus on personal benefits. Your AI agent will use a more conversational tone appropriate for consumers.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-medium text-white">Campaign Details</h3>
              <p className="text-sm text-gray-400">
                Give your campaign a name and select your primary objective
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Campaign Name *</Label>
                <Input
                  value={campaignData.name}
                  onChange={(e) => updateCampaignData({ name: e.target.value })}
                  placeholder="e.g., Q4 Enterprise Sales Outreach"
                  className="border-gray-700 bg-gray-800 text-white"
                />
                {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
              </div>

              <div>
                <Label className="mb-3 block text-gray-300">Campaign Objective *</Label>
                <RadioGroup
                  value={campaignData.objective}
                  onValueChange={(value) => updateCampaignData({ objective: value })}
                >
                  <div className="grid grid-cols-2 gap-4">
                    {OBJECTIVES.map((objective) => (
                      <div
                        key={objective.id}
                        className={`relative flex cursor-pointer items-start space-x-3 rounded-lg border p-4 transition-all ${
                          campaignData.objective === objective.id
                            ? 'border-emerald-500 bg-emerald-900/20'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <RadioGroupItem value={objective.id} id={objective.id} className="mt-1" />
                        <Label htmlFor={objective.id} className="cursor-pointer">
                          <div className="font-medium text-white">{objective.name}</div>
                          <div className="text-sm text-gray-400">{objective.description}</div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
                {errors.objective && (
                  <p className="mt-1 text-sm text-red-400">{errors.objective}</p>
                )}
              </div>

              <div>
                <Label className="text-gray-300">Campaign Description (Optional)</Label>
                <Textarea
                  value={campaignData.description}
                  onChange={(e) => updateCampaignData({ description: e.target.value })}
                  placeholder="Describe your campaign goals, target audience, and any special instructions..."
                  className="border-gray-700 bg-gray-800 text-white"
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white">Configure Phone Numbers</h2>
              <p className="mb-6 text-gray-400">
                Select your calling phone number and configure integrations
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-gray-300">Phone Number Source</Label>
                <RadioGroup
                  value={campaignData.twilioIntegration ? 'twilio' : 'vapi'}
                  onValueChange={(value) =>
                    updateCampaignData({ twilioIntegration: value === 'twilio' })
                  }
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 rounded-lg border border-gray-700 p-4">
                      <RadioGroupItem value="vapi" id="vapi" />
                      <Label htmlFor="vapi" className="cursor-pointer">
                        <div className="mb-1 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium text-white">Apex Phone Numbers</span>
                          <Badge className="bg-emerald-600 text-white">Recommended</Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          Use phone numbers provisioned through Apex
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 rounded-lg border border-gray-700 p-4">
                      <RadioGroupItem value="twilio" id="twilio" />
                      <Label htmlFor="twilio" className="cursor-pointer">
                        <div className="mb-1 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-white">Twilio Integration</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Use your existing Twilio phone numbers
                        </p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {!campaignData.twilioIntegration ? (
                <div>
                  <Label className="text-gray-300">Select Apex Phone Number *</Label>

                  {loadingNumbers && (
                    <div className="mb-2 flex items-center gap-2 text-blue-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-400"></div>
                      <span>Loading phone numbers...</span>
                    </div>
                  )}

                  <Select
                    value={campaignData.phoneNumber}
                    onValueChange={(value) =>
                      updateCampaignData({ phoneNumber: value, vapiPhoneId: value })
                    }
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue
                        placeholder={
                          loadingNumbers ? 'Loading phone numbers...' : 'Choose a phone number'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
                      {phoneNumbers.length > 0 ? (
                        phoneNumbers.map((number) => (
                          <SelectItem
                            key={number.id || number.number}
                            value={number.id || number.number}
                          >
                            {number.number} - {number.country || number.region || 'Unknown'}
                          </SelectItem>
                        ))
                      ) : (
                        // Fallback to hardcoded numbers if Apex fails
                        <>
                          <SelectItem value="+1-555-0123">+1 (555) 012-3456 - US</SelectItem>
                          <SelectItem value="+1-555-0124">+1 (555) 012-3457 - US</SelectItem>
                          <SelectItem value="+44-7482-792343">+44 7482 792343 - UK</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
                  )}

                  {phoneNumbers.length === 0 && !loadingNumbers && (
                    <p className="mt-1 text-sm text-yellow-400">
                      No Apex phone numbers found. Using demo numbers. Please configure Apex in
                      Settings.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="border-yellow-500 bg-yellow-900/20">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-300">
                      Twilio integration requires API credentials. Make sure your Twilio account is
                      connected in Settings.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label className="text-gray-300">Twilio Phone Number *</Label>
                    <Input
                      value={campaignData.phoneNumber}
                      onChange={(e) => updateCampaignData({ phoneNumber: e.target.value })}
                      placeholder="+1234567890"
                      className="border-gray-700 bg-gray-800 text-white"
                    />
                    {errors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Apex Connection Status for Phone Numbers */}
              {vapiErrors.length > 0 && (
                <Alert className="border-red-500 bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-300">
                    Apex Connection Issue: {apexErrors.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg bg-gray-800/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="font-medium text-white">Phone Number Features</h4>
                  {apexConnected && (
                    <Badge className="bg-green-600 text-xs text-white">Apex Connected</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Automatic caller ID registration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Call recording and transcription</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Real-time call monitoring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white">Select Voice Agent</h2>
              <p className="mb-6 text-gray-400">
                Choose the AI voice agent that best fits your campaign objective
              </p>
            </div>

            <div className="space-y-4">
              {/* Apex Connection Status */}
              {vapiErrors.length > 0 && (
                <Alert className="border-red-500 bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-300">
                    {vapiErrors.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {loadingAgents && (
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-400"></div>
                  <span>Loading voice agents...</span>
                </div>
              )}

              {voiceAgents.length === 0 && !loadingAgents && (
                <Alert className="border-yellow-500 bg-yellow-900/20">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-300">
                    No Apex assistants found. Using demo agents. Please configure Apex credentials
                    in Settings.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Show real Apex agents if available, otherwise show hardcoded fallback */}
                {(voiceAgents.length > 0 ? voiceAgents : VOICE_AGENTS).map((agent) => (
                  <div
                    key={agent.id}
                    className={`cursor-pointer rounded-lg border p-4 transition-all ${
                      campaignData.voiceAgent === agent.id
                        ? 'border-emerald-500 bg-emerald-900/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => updateCampaignData({ voiceAgent: agent.id })}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{agent.avatar || '🤖'}</div>
                      <div className="flex-1">
                        <h3 className="mb-1 font-medium text-white">{agent.name}</h3>
                        <p className="mb-3 text-sm text-gray-400">
                          {agent.description || 'AI Assistant'}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-400">
                              {agent.languages
                                ? `Languages: ${agent.languages.join(', ')}`
                                : `Voice: ${agent.voice?.provider || 'Default'}`}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {agent.specialties ? (
                              agent.specialties.map((specialty, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-gray-800 text-xs text-gray-300"
                                >
                                  {specialty}
                                </Badge>
                              ))
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-gray-800 text-xs text-gray-300"
                              >
                                {agent.model?.provider || 'AI Model'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.voiceAgent && <p className="text-sm text-red-400">{errors.voiceAgent}</p>}

              {campaignData.voiceAgent && (
                <div className="space-y-4 rounded-lg bg-gray-800/50 p-4">
                  <h4 className="font-medium text-white">Voice Settings</h4>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-gray-300">Speaking Speed</Label>
                      <span className="text-sm text-gray-400">
                        {campaignData.voiceSettings.speed}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={campaignData.voiceSettings.speed}
                      onChange={(e) =>
                        updateCampaignData({
                          voiceSettings: {
                            ...campaignData.voiceSettings,
                            speed: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-gray-300">Voice Pitch</Label>
                      <span className="text-sm text-gray-400">
                        {campaignData.voiceSettings.pitch}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={campaignData.voiceSettings.pitch}
                      onChange={(e) =>
                        updateCampaignData({
                          voiceSettings: {
                            ...campaignData.voiceSettings,
                            pitch: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-gray-300">Response Creativity</Label>
                      <span className="text-sm text-gray-400">
                        {campaignData.voiceSettings.temperature}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={campaignData.voiceSettings.temperature}
                      onChange={(e) =>
                        updateCampaignData({
                          voiceSettings: {
                            ...campaignData.voiceSettings,
                            temperature: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Lower = More consistent, Higher = More creative
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white">Test Your Voice Agent</h2>
              <p className="mb-6 text-gray-400">
                Make a test call to ensure your voice agent is configured correctly
              </p>
            </div>

            <div className="space-y-6">
              <Card className="border-gray-700 bg-gray-800/50">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="text-4xl">
                      {(voiceAgents.length > 0 ? voiceAgents : VOICE_AGENTS).find(
                        (a) => a.id === campaignData.voiceAgent
                      )?.avatar || '🤖'}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {(voiceAgents.length > 0 ? voiceAgents : VOICE_AGENTS).find(
                          (a) => a.id === campaignData.voiceAgent
                        )?.name || 'Selected Agent'}
                      </h3>
                      <p className="text-sm text-gray-400">Ready for testing</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300">Test Phone Number</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter your phone number"
                          className="border-gray-600 bg-gray-700 text-white"
                        />
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                          <Phone className="mr-2 h-4 w-4" />
                          Start Test Call
                        </Button>
                      </div>
                    </div>

                    {campaignData.testCompleted && (
                      <Alert className="border-green-500 bg-green-900/20">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertDescription className="text-green-300">
                          Test call completed successfully!
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-lg bg-gray-800/50 p-6">
                <h4 className="mb-4 font-medium text-white">Test Call Checklist</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                        campaignData.testCompleted
                          ? 'border-green-600 bg-green-600'
                          : 'border-gray-600'
                      }`}
                    >
                      {campaignData.testCompleted && (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-300">Voice clarity and quality</p>
                      <p className="text-sm text-gray-500">
                        Ensure the voice sounds natural and clear
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                        campaignData.testCompleted
                          ? 'border-green-600 bg-green-600'
                          : 'border-gray-600'
                      }`}
                    >
                      {campaignData.testCompleted && (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-300">Script accuracy</p>
                      <p className="text-sm text-gray-500">
                        Verify the agent follows your intended script
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                        campaignData.testCompleted
                          ? 'border-green-600 bg-green-600'
                          : 'border-gray-600'
                      }`}
                    >
                      {campaignData.testCompleted && (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-300">Response handling</p>
                      <p className="text-sm text-gray-500">
                        Test different responses and objections
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="text-gray-300">Test Notes (Optional)</Label>
                  <Textarea
                    value={campaignData.testNotes}
                    onChange={(e) => updateCampaignData({ testNotes: e.target.value })}
                    placeholder="Any observations or adjustments needed..."
                    className="mt-2 border-gray-600 bg-gray-700 text-white"
                    rows={3}
                  />
                </div>

                {!campaignData.testCompleted && (
                  <Button
                    variant="outline"
                    className="mt-4 w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => updateCampaignData({ testCompleted: true })}
                  >
                    Mark Test as Completed
                  </Button>
                )}
              </div>

              {errors.test && (
                <Alert className="border-red-500 bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-300">{errors.test}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white">Import Your Leads</h2>
              <p className="mb-6 text-gray-400">Upload a CSV file with your lead data</p>
            </div>

            <div className="space-y-6">
              <div
                className="cursor-pointer rounded-lg border-2 border-dashed border-gray-700 p-8 text-center transition-colors hover:border-gray-600"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="mb-2 text-gray-300">Drag and drop your CSV file here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Mock CSV processing
                      const mockLeads: Lead[] = [
                        {
                          id: '1',
                          firstName: 'John',
                          lastName: 'Doe',
                          phone: '+1234567890',
                          email: 'john@example.com',
                        },
                        {
                          id: '2',
                          firstName: 'Jane',
                          lastName: 'Smith',
                          phone: '+1234567891',
                          email: 'jane@example.com',
                        },
                        {
                          id: '3',
                          firstName: 'Bob',
                          lastName: 'Johnson',
                          phone: '+1234567892',
                          email: 'bob@example.com',
                        },
                      ];
                      updateCampaignData({ leads: mockLeads, csvFileName: file.name });
                    }
                  }}
                  className="hidden"
                />
              </div>

              <div className="rounded-lg bg-gray-800/50 p-4">
                <h4 className="mb-2 font-medium text-white">CSV Format Requirements</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>• Required columns: firstName, lastName, phone</p>
                  <p>• Optional columns: email, company, title, custom fields</p>
                  <p>• Phone numbers should include country code</p>
                  <p>• Maximum 10,000 leads per file</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              {campaignData.leads.length > 0 && (
                <div className="rounded-lg bg-gray-800/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">{campaignData.csvFileName}</h4>
                      <p className="text-sm text-gray-400">
                        {campaignData.leads.length} leads imported
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCampaignData({ leads: [], csvFileName: '' })}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded border border-gray-700">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="p-2 text-left text-gray-300">Name</th>
                          <th className="p-2 text-left text-gray-300">Phone</th>
                          <th className="p-2 text-left text-gray-300">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaignData.leads.slice(0, 5).map((lead, index) => (
                          <tr key={lead.id} className="border-t border-gray-700">
                            <td className="p-2 text-gray-300">
                              {lead.firstName} {lead.lastName}
                            </td>
                            <td className="p-2 text-gray-400">{lead.phone}</td>
                            <td className="p-2 text-gray-400">{lead.email || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {campaignData.leads.length > 5 && (
                      <div className="bg-gray-800 p-2 text-center text-sm text-gray-500">
                        And {campaignData.leads.length - 5} more...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {errors.leads && (
                <Alert className="border-red-500 bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-300">{errors.leads}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white">
                Budget Allocation & Call Credits
              </h2>
              <p className="mb-6 text-gray-400">
                Set your campaign budget and configure credit management
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="border-gray-800 bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      Campaign Budget
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-300">Total Budget ($)</Label>
                        <Input
                          type="number"
                          value={campaignData.budget}
                          onChange={(e) =>
                            updateCampaignData({
                              budget: parseFloat(e.target.value) || 0,
                              callCredits: Math.floor((parseFloat(e.target.value) || 0) / 0.1),
                            })
                          }
                          className="border-gray-600 bg-gray-700 text-white"
                          min="10"
                          step="10"
                        />
                        {errors.budget && (
                          <p className="mt-1 text-sm text-red-400">{errors.budget}</p>
                        )}
                      </div>

                      <div className="space-y-2 rounded bg-gray-900/50 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Cost per call</span>
                          <span className="text-white">$0.10</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Estimated calls</span>
                          <span className="text-white">{campaignData.callCredits}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800 bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <CreditCard className="h-5 w-5 text-emerald-500" />
                      Call Credits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="py-4 text-center">
                        <div className="text-3xl font-bold text-white">
                          {campaignData.callCredits}
                        </div>
                        <p className="text-sm text-gray-400">Available Credits</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-gray-300">Auto-reload</Label>
                          <input
                            type="checkbox"
                            checked={campaignData.autoReload}
                            onChange={(e) => updateCampaignData({ autoReload: e.target.checked })}
                            className="rounded border-gray-600 bg-gray-700 text-emerald-600"
                          />
                        </div>

                        {campaignData.autoReload && (
                          <div>
                            <Label className="text-sm text-gray-300">Reload when below</Label>
                            <Input
                              type="number"
                              value={campaignData.autoReloadThreshold}
                              onChange={(e) =>
                                updateCampaignData({
                                  autoReloadThreshold: parseInt(e.target.value) || 0,
                                })
                              }
                              className="mt-1 border-gray-600 bg-gray-700 text-white"
                              min="10"
                              step="10"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="border-blue-500 bg-blue-900/20">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-300">
                  <strong>Billing Note:</strong> You'll only be charged for completed calls. Failed
                  or unanswered calls don't consume credits.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white">Assign Team Members</h2>
              <p className="mb-6 text-gray-400">
                Select team members who will manage this campaign
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-gray-300">Team Leader *</Label>
                <Select
                  value={campaignData.teamLeader}
                  onValueChange={(value) => updateCampaignData({ teamLeader: value })}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                    <SelectValue placeholder="Select team leader" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    {TEAM_MEMBERS.filter((m) => m.role.includes('Manager')).map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                            {member.avatar}
                          </div>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-gray-400">{member.role}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.teamLeader && (
                  <p className="mt-1 text-sm text-red-400">{errors.teamLeader}</p>
                )}
              </div>

              <div>
                <Label className="mb-3 block text-gray-300">Team Members *</Label>
                <div className="space-y-2">
                  {TEAM_MEMBERS.map((member) => (
                    <div
                      key={member.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                        campaignData.assignedTeam.includes(member.id)
                          ? 'border-emerald-500 bg-emerald-900/20'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => {
                        const isSelected = campaignData.assignedTeam.includes(member.id);
                        updateCampaignData({
                          assignedTeam: isSelected
                            ? campaignData.assignedTeam.filter((id) => id !== member.id)
                            : [...campaignData.assignedTeam, member.id],
                        });
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-sm text-white">
                          {member.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-white">{member.name}</div>
                          <div className="text-sm text-gray-400">{member.role}</div>
                        </div>
                      </div>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                          campaignData.assignedTeam.includes(member.id)
                            ? 'border-emerald-600 bg-emerald-600'
                            : 'border-gray-600'
                        }`}
                      >
                        {campaignData.assignedTeam.includes(member.id) && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.team && <p className="mt-1 text-sm text-red-400">{errors.team}</p>}
              </div>

              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <h4 className="mb-2 font-medium text-white">Team Permissions</h4>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>View campaign performance and analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Access lead details and call recordings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Update lead status and add notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Receive real-time notifications</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white">Review & Launch</h2>
              <p className="mb-6 text-gray-400">Review your campaign settings before launching</p>
            </div>

            <div className="space-y-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="p-6">
                  <h3 className="mb-4 font-medium text-white">Campaign Summary</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-700 py-2">
                      <span className="text-gray-400">Campaign Name</span>
                      <span className="font-medium text-white">{campaignData.name}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-700 py-2">
                      <span className="text-gray-400">Objective</span>
                      <span className="text-white">
                        {OBJECTIVES.find((o) => o.id === campaignData.objective)?.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-700 py-2">
                      <span className="text-gray-400">Phone Number</span>
                      <span className="text-white">{campaignData.phoneNumber}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-700 py-2">
                      <span className="text-gray-400">Voice Agent</span>
                      <span className="text-white">
                        {(voiceAgents.length > 0 ? voiceAgents : VOICE_AGENTS).find(
                          (a) => a.id === campaignData.voiceAgent
                        )?.name || 'Selected Agent'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-700 py-2">
                      <span className="text-gray-400">Total Leads</span>
                      <span className="text-white">{campaignData.leads.length}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-gray-700 py-2">
                      <span className="text-gray-400">Budget</span>
                      <span className="text-white">${campaignData.budget}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-400">Team Size</span>
                      <span className="text-white">{campaignData.assignedTeam.length} members</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label className="mb-3 block text-gray-300">Launch Timing</Label>
                <RadioGroup
                  value={campaignData.immediateStart ? 'now' : 'schedule'}
                  onValueChange={(value) => updateCampaignData({ immediateStart: value === 'now' })}
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 rounded-lg border border-gray-700 p-4">
                      <RadioGroupItem value="now" id="now" />
                      <Label htmlFor="now" className="cursor-pointer">
                        <div className="font-medium text-white">Launch Immediately</div>
                        <p className="text-sm text-gray-400">
                          Start calling as soon as you click launch
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border border-gray-700 p-4">
                      <RadioGroupItem value="schedule" id="schedule" />
                      <Label htmlFor="schedule" className="cursor-pointer">
                        <div className="font-medium text-white">Schedule for Later</div>
                        <p className="text-sm text-gray-400">
                          Set a specific date and time to start
                        </p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {!campaignData.immediateStart && (
                  <div className="mt-4">
                    <Label className="text-gray-300">Schedule Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={campaignData.scheduledStart}
                      onChange={(e) => updateCampaignData({ scheduledStart: e.target.value })}
                      className="mt-2 border-gray-700 bg-gray-800 text-white"
                    />
                  </div>
                )}
              </div>

              <Alert className="border-green-500 bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-300">
                  <strong>Ready to Launch!</strong> Your campaign is configured and ready to go.
                  Click the launch button below to start.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return campaignData.campaignType !== '';
      case 2:
        return campaignData.name && campaignData.objective;
      case 3:
        return campaignData.phoneNumber.length > 0;
      case 4:
        return campaignData.voiceAgent.length > 0;
      case 5:
        return campaignData.testCompleted;
      case 6:
        return campaignData.leads.length > 0;
      case 7:
        return campaignData.budget > 0 && campaignData.callCredits > 0;
      case 8:
        return campaignData.teamLeader.length > 0 && campaignData.assignedTeam.length > 0;
      case 9:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-emerald-500" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-gray-400">Create your AI calling campaign step by step</p>
                  {isDraftSaving && (
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                      Saving draft...
                    </div>
                  )}
                  {/* Debug: Show current state */}
                  <div className="text-xs text-gray-500">
                    Step: {currentStep} | Changes: {hasUnsavedChanges() ? 'Yes' : 'No'} | Blocker: {blocker.state}
                  </div>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => handleExitAttempt('/campaigns')}
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
          </div>

          {/* Progress Bar */}
          <Progress value={progressPercentage} className="h-2 bg-gray-800" />
        </div>

        {/* Draft Notification */}
        {isDraftPresent() && hasUnsavedChanges() && (
          <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your draft has been automatically loaded. You can continue where you left off.
            </AlertDescription>
          </Alert>
        )}

        {/* Steps Navigation */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const isClickable = step.id <= currentStep + 1;

              return (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex cursor-pointer flex-col items-center transition-all ${
                      isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                    onClick={() => isClickable && handleStepClick(step.id)}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : isCompleted
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm ${
                        isActive ? 'font-medium text-white' : 'text-gray-400'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-gray-800 bg-gray-900">
          <CardContent className="p-8">{renderStepContent()}</CardContent>

          {/* Navigation Buttons */}
          <div className="border-t border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (isStepValid()) {
                      setIsLoading(true);
                      // Simulate campaign launch
                      setTimeout(() => {
                        setIsLoading(false);
                        clearDraft(); // Clear draft on successful campaign creation
                        navigate('/campaigns');
                      }, 2000);
                    }
                  }}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      Launching Campaign...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Launch Campaign
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Exit Confirmation Dialog */}
        <Dialog 
          open={showExitDialog} 
          onOpenChange={(open) => {
            setShowExitDialog(open);
            if (!open && blocker.state === 'blocked') {
              // User cancelled the dialog, reset the blocker
              blocker.reset();
              setPendingNavigation(null);
            }
          }}
        >
          <DialogContent className="border-gray-800 bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Save Your Progress?</DialogTitle>
              <DialogDescription className="text-gray-400">
                You have unsaved changes in your campaign setup. Would you like to save your progress as a draft before leaving?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleExitWithoutSaving}
                className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                Exit Without Saving
              </Button>
              <Button
                onClick={handleSaveAndExit}
                disabled={isDraftSaving}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700"
              >
                {isDraftSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  'Save Draft & Exit'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
