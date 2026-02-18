import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/services/supabase-client';
import { campaignOutboundService } from '@/services/campaign-outbound.service';
import CampaignCapacityPlanner, { type ScheduleConfig } from '@/components/CampaignCapacityPlanner';
import { classifyAssistantTier } from '@/config/credit-rates';
import { getPlanById } from '@/config/plans';
import Papa from 'papaparse';
import {
    AlertCircle,
    Bot,
    Building,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Download,
    Globe,
    Info,
    Loader2,
    Phone,
    Play,
    Sparkles,
    Target,
    Upload,
    User,
    Users
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CampaignData {
  // Step 1: Name & Objective
  name: string;
  objective: string;
  description: string;

  // Step 2: Phone Numbers
  phoneNumber: string;
  twilioIntegration: boolean;
  providerPhoneId: string;

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
  { id: 7, name: 'Capacity & Credits', icon: CreditCard },
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

// No hardcoded mock data — voice agents and team members are loaded from Supabase.
// If no data loads, the UI shows an empty state with a prompt to create assistants/invite members.
const VOICE_AGENTS: { id: string; name: string; description: string; avatar: string; languages: string[]; specialties: string[] }[] = [];
const TEAM_MEMBERS: { id: string; name: string; role: string; avatar: string }[] = [];

export default function CampaignSetupWizard() {
  const navigate = useNavigate();
  const { user, dbUser: profile, organization } = useSupabaseAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  // CSV parsing state
  const [csvParseErrors, setCsvParseErrors] = useState<string[]>([]);
  const [csvValidCount, setCsvValidCount] = useState(0);
  const [csvInvalidCount, setCsvInvalidCount] = useState(0);
  // Capacity planner state
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | null>(null);
  const [avgCallDuration, setAvgCallDuration] = useState(2);
  // Org data for capacity planner
  const [orgPlanId, setOrgPlanId] = useState('employee_1');
  const [orgCreditBalance, setOrgCreditBalance] = useState(0);
  const [orgCreditsUsed, setOrgCreditsUsed] = useState(0);
  const [orgAutoRechargeEnabled, setOrgAutoRechargeEnabled] = useState(false);
  // Team members from Supabase
  const [teamMembersData, setTeamMembersData] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    objective: '',
    description: '',
    phoneNumber: '',
    twilioIntegration: false,
    providerPhoneId: '',
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
      // Draft saved successfully
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
    const hasChanges = hasUnsavedChanges();

    if (hasChanges) {
      setPendingNavigation(path);
      setShowExitDialog(true);
    } else {
      navigate(path);
    }
  };

  const handleSaveAndExit = async () => {
    await saveDraft();
    setShowExitDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleExitWithoutSaving = () => {
    clearDraft();
    setShowExitDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  // Trinity Data State
  const [voiceAgents, setVoiceAgents] = useState<any[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [apexErrors, setApexErrors] = useState<string[]>([]);
  const [apexConnected, setApexConnected] = useState(false);

  const progressPercentage = (currentStep / STEPS.length) * 100;

  // Load Trinity Data on Component Mount
  useEffect(() => {
    const loadTrinityData = async () => {
      try {
        setLoadingAgents(true);
        setLoadingNumbers(true);
        setApexErrors([]);

        const [assistantsResponse, numbersResponse] = await Promise.all([
          campaignOutboundService.getAssistants().catch((err) => {
            console.error('❌ Failed to load assistants:', err);
            console.error('❌ Error details:', err.response?.data || err.message);
            return { assistants: [] };
          }),
          campaignOutboundService.getPhoneNumbers().catch((err) => {
            console.error('❌ Failed to load phone numbers:', err);
            console.error('❌ Error details:', err.response?.data || err.message);
            return { phoneNumbers: [] };
          }),
        ]);

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
        console.error('❌ Error loading Trinity data:', error);
        setApexErrors([
          'Failed to connect to Trinity service. Please check your Trinity credentials in Settings.',
        ]);
        setApexConnected(false);
      } finally {
        setLoadingAgents(false);
        setLoadingNumbers(false);
      }
    };

    loadTrinityData();
  }, []);

  // Load org billing data + team members
  useEffect(() => {
    const loadOrgData = async () => {
      if (!profile?.organization_id) return;
      const orgId = profile.organization_id;

      try {
        // Load org billing info
        const { data: org } = await supabase
          .from('organizations')
          .select('credit_balance, plan_tier_id, settings')
          .eq('id', orgId)
          .single();

        if (org) {
          setOrgCreditBalance(org.credit_balance || 0);
          setOrgPlanId(org.plan_tier_id || 'employee_1');
        }

        // Credits used this period
        try {
          const { data: usage } = await supabase.rpc('get_credits_used_this_period', {
            p_organization_id: orgId,
          });
          setOrgCreditsUsed(usage || 0);
        } catch {
          // RPC may not exist yet — default to 0
          setOrgCreditsUsed(0);
        }

        // Auto-recharge status
        try {
          const { data: arConfig } = await supabase
            .from('auto_recharge_config')
            .select('enabled')
            .eq('organization_id', orgId)
            .single();
          setOrgAutoRechargeEnabled(arConfig?.enabled || false);
        } catch {
          // Table may not exist — default to false
          setOrgAutoRechargeEnabled(false);
        }

        // Team members
        setLoadingTeam(true);
        try {
          const { data: members } = await supabase
            .from('organization_members')
            .select('user_id, role, profiles(id, full_name, email, avatar_url)')
            .eq('organization_id', orgId);

          if (members) {
            setTeamMembersData(members.map((m: any) => ({
              id: m.user_id,
              name: m.profiles?.full_name || m.profiles?.email || 'Team Member',
              email: m.profiles?.email || '',
              role: m.role || 'member',
              avatar: (m.profiles?.full_name || 'TM').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
            })));
          }
        } catch {
          // Org members query failed — proceed with empty team
        }
        setLoadingTeam(false);
      } catch (error) {
        console.error('⚠️ loadOrgData error:', error);
        setLoadingTeam(false);
      }
    };

    loadOrgData();
  }, [profile?.organization_id]);

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

  // Note: useBlocker requires Data Router (createBrowserRouter) which we don't use.
  // Navigation blocking is handled via the beforeunload event + custom exit dialog instead.

  // Add global event listeners to detect user interaction
  useEffect(() => {
    const handleInteraction = () => {
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
      case 1: // Campaign Type
        if (!campaignData.campaignType) newErrors.campaignType = 'Please select a campaign type';
        break;
      case 2: // Name & Objective
        if (!campaignData.name.trim()) newErrors.name = 'Campaign name is required';
        if (!campaignData.objective) newErrors.objective = 'Please select an objective';
        break;
      case 3: // Phone Numbers
        if (!campaignData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
        break;
      case 4: // Voice Agent
        if (!campaignData.voiceAgent) newErrors.voiceAgent = 'Please select a voice agent';
        break;
      case 5: // Test Agent
        if (!campaignData.testCompleted)
          newErrors.test = 'Please test the voice agent before proceeding';
        break;
      case 6: // Import Leads
        if (campaignData.leads.length === 0) newErrors.leads = 'Please import at least one lead';
        break;
      case 7: // Capacity & Credits
        // No hard validation — capacity planner is informational
        break;
      case 8: // Team Assignment
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
                <Label
                  htmlFor="b2b"
                  className={`block cursor-pointer rounded-lg border p-6 transition-all ${
                    campaignData.campaignType === 'b2b'
                      ? 'border-emerald-500 bg-emerald-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <RadioGroupItem value="b2b" id="b2b" className="sr-only" />
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

                <Label
                  htmlFor="b2c"
                  className={`block cursor-pointer rounded-lg border p-6 transition-all ${
                    campaignData.campaignType === 'b2c'
                      ? 'border-emerald-500 bg-emerald-900/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <RadioGroupItem value="b2c" id="b2c" className="sr-only" />
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
                      <Label
                        htmlFor={objective.id}
                        key={objective.id}
                        className={`relative flex cursor-pointer items-start space-x-3 rounded-lg border p-4 transition-all ${
                          campaignData.objective === objective.id
                            ? 'border-emerald-500 bg-emerald-900/20'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <RadioGroupItem value={objective.id} id={objective.id} className="mt-1" />
                        <span>
                          <div className="font-medium text-white">{objective.name}</div>
                          <div className="text-sm text-gray-400">{objective.description}</div>
                        </span>
                      </Label>
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
                  value={campaignData.twilioIntegration ? 'twilio' : 'voice-engine'}
                  onValueChange={(value) =>
                    updateCampaignData({ twilioIntegration: value === 'twilio' })
                  }
                >
                  <div className="space-y-3">
                    <Label htmlFor="voice-engine" className="flex cursor-pointer items-start space-x-3 rounded-lg border border-gray-700 p-4">
                      <RadioGroupItem value="voice-engine" id="voice-engine" />
                      <span>
                        <div className="mb-1 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-emerald-500" />
                          <span className="font-medium text-white">Trinity Phone Numbers</span>
                          <Badge className="bg-emerald-600 text-white">Recommended</Badge>
                        </div>
                        <p className="text-sm text-gray-400">
                          Use phone numbers provisioned through Trinity
                        </p>
                      </span>
                    </Label>

                    <Label htmlFor="twilio" className="flex cursor-pointer items-start space-x-3 rounded-lg border border-gray-700 p-4">
                      <RadioGroupItem value="twilio" id="twilio" />
                      <span>
                        <div className="mb-1 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-white">Twilio Integration</span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Use your existing Twilio phone numbers
                        </p>
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {!campaignData.twilioIntegration ? (
                <div>
                  <Label className="text-gray-300">Select Trinity Phone Number *</Label>

                  {loadingNumbers && (
                    <div className="mb-2 flex items-center gap-2 text-emerald-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-emerald-400"></div>
                      <span>Loading phone numbers...</span>
                    </div>
                  )}

                  <Select
                    value={campaignData.phoneNumber}
                    onValueChange={(value) =>
                      updateCampaignData({ phoneNumber: value, providerPhoneId: value })
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
                        // Fallback to hardcoded numbers if Voice Engine fails
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
                      No Voice Engine phone numbers found. Using demo numbers. Please configure Voice Engine in
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
              {apexErrors.length > 0 && (
                <Alert className="border-red-500 bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-300">
                    Voice Engine Connection Issue: {apexErrors.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-lg bg-gray-800/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="font-medium text-white">Phone Number Features</h4>
                  {apexConnected && (
                    <Badge className="bg-green-600 text-xs text-white">Trinity Connected</Badge>
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
              {apexErrors.length > 0 && (
                <Alert className="border-red-500 bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-300">
                    {apexErrors.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              {loadingAgents && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-emerald-400"></div>
                  <span>Loading voice agents...</span>
                </div>
              )}

              {voiceAgents.length === 0 && !loadingAgents && (
                <Alert className="border-yellow-500 bg-yellow-900/20">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-300">
                    No Trinity assistants found. Using demo agents. Please configure Trinity credentials
                    in Settings.
                  </AlertDescription>
                </Alert>
              )}

              {voiceAgents.length === 0 && VOICE_AGENTS.length === 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                  <Bot className="mx-auto mb-3 h-10 w-10 text-amber-400" />
                  <p className="font-medium text-white">No AI Assistants Found</p>
                  <p className="mt-1 text-sm text-gray-400">
                    Create an AI assistant first from the AI Assistants page, then come back to set up your campaign.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      setCsvParseErrors([]);
                      setCsvValidCount(0);
                      setCsvInvalidCount(0);
                      Papa.parse(file, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                          const parseErrors: string[] = [];
                          const validLeads: Lead[] = [];
                          let invalidCount = 0;

                          for (let i = 0; i < results.data.length; i++) {
                            const row = results.data[i] as Record<string, string>;
                            const phone = row.phone || row.Phone || row.phone_number || row.PhoneNumber || '';
                            const firstName = row.firstName || row.first_name || row.FirstName || row.name || row.Name || '';
                            const lastName = row.lastName || row.last_name || row.LastName || '';

                            // Validate phone
                            const cleaned = phone.replace(/[^\d+]/g, '');
                            if (!cleaned || cleaned.replace(/\D/g, '').length < 10) {
                              invalidCount++;
                              if (invalidCount <= 5) {
                                parseErrors.push(`Row ${i + 1}: Invalid phone "${phone}"`);
                              }
                              continue;
                            }

                            validLeads.push({
                              id: String(i + 1),
                              firstName: firstName || 'Unknown',
                              lastName,
                              phone: cleaned.startsWith('+') ? cleaned : (cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`),
                              email: row.email || row.Email || '',
                              company: row.company || row.Company || '',
                              title: row.title || row.Title || row.job_title || '',
                              customFields: Object.fromEntries(
                                Object.entries(row).filter(([k]) =>
                                  !['phone', 'Phone', 'phone_number', 'PhoneNumber', 'firstName', 'first_name', 'FirstName',
                                    'lastName', 'last_name', 'LastName', 'name', 'Name', 'email', 'Email',
                                    'company', 'Company', 'title', 'Title', 'job_title'].includes(k)
                                )
                              ),
                            });
                          }

                          if (invalidCount > 5) {
                            parseErrors.push(`...and ${invalidCount - 5} more invalid rows`);
                          }

                          setCsvParseErrors(parseErrors);
                          setCsvValidCount(validLeads.length);
                          setCsvInvalidCount(invalidCount);
                          updateCampaignData({ leads: validLeads, csvFileName: file.name });
                        },
                        error: (err) => {
                          setCsvParseErrors([`Failed to parse CSV: ${err.message}`]);
                        },
                      });
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

              {/* CSV Parse Results */}
              {(csvValidCount > 0 || csvInvalidCount > 0) && (
                <div className="flex items-center gap-3 text-sm">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    {csvValidCount.toLocaleString()} valid
                  </Badge>
                  {csvInvalidCount > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      {csvInvalidCount.toLocaleString()} errors
                    </Badge>
                  )}
                </div>
              )}

              {csvParseErrors.length > 0 && (
                <Alert className="border-amber-500 bg-amber-900/20">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-300">
                    <p className="font-medium mb-1">Some rows were skipped:</p>
                    {csvParseErrors.map((err, i) => (
                      <p key={i} className="text-xs">{err}</p>
                    ))}
                  </AlertDescription>
                </Alert>
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

      case 7: {
        // Determine assistant tier for capacity planner
        const selectedAgent = (voiceAgents.length > 0 ? voiceAgents : VOICE_AGENTS).find(
          (a: any) => a.id === campaignData.voiceAgent
        );
        const assistantTier = selectedAgent?.model?.provider && selectedAgent?.voice?.provider
          ? classifyAssistantTier(selectedAgent.model.provider, selectedAgent.voice.provider)
          : 'standard' as const;

        return (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-white">
                Capacity Planning & Credits
              </h2>
              <p className="mb-6 text-gray-400">
                Estimate completion time, credit usage, and set your campaign schedule
              </p>
            </div>

            <CampaignCapacityPlanner
              leadCount={campaignData.leads.length}
              assistantTier={assistantTier}
              planId={orgPlanId}
              creditsUsedThisPeriod={orgCreditsUsed}
              creditBalance={orgCreditBalance}
              autoRechargeEnabled={orgAutoRechargeEnabled}
              onDurationChange={(mins) => setAvgCallDuration(mins)}
              onScheduleChange={(config) => setScheduleConfig(config)}
            />

            <Alert className="border-blue-500 bg-blue-900/20">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-300">
                <strong>Billing Note:</strong> Credits are consumed for connected call minutes only.
                Failed or unanswered calls do not consume credits.
              </AlertDescription>
            </Alert>
          </div>
        );
      }

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
                {loadingTeam ? (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading team members...</span>
                  </div>
                ) : (
                <Select
                  value={campaignData.teamLeader}
                  onValueChange={(value) => updateCampaignData({ teamLeader: value })}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                    <SelectValue placeholder="Select team leader" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    {(teamMembersData.length > 0 ? teamMembersData : TEAM_MEMBERS).filter((m: any) => ['owner', 'admin', 'Manager', 'Sales Manager'].some(r => (m.role || '').includes(r))).map((member: any) => (
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
                )}
                {errors.teamLeader && (
                  <p className="mt-1 text-sm text-red-400">{errors.teamLeader}</p>
                )}
              </div>

              <div>
                <Label className="mb-3 block text-gray-300">Team Members *</Label>
                <div className="space-y-2">
                  {(teamMembersData.length > 0 ? teamMembersData : TEAM_MEMBERS).map((member: any) => (
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
                            ? campaignData.assignedTeam.filter((id: string) => id !== member.id)
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
                    <Label htmlFor="now" className="flex cursor-pointer items-center space-x-3 rounded-lg border border-gray-700 p-4">
                      <RadioGroupItem value="now" id="now" />
                      <span>
                        <div className="font-medium text-white">Launch Immediately</div>
                        <p className="text-sm text-gray-400">
                          Start calling as soon as you click launch
                        </p>
                      </span>
                    </Label>

                    <Label htmlFor="schedule" className="flex cursor-pointer items-center space-x-3 rounded-lg border border-gray-700 p-4">
                      <RadioGroupItem value="schedule" id="schedule" />
                      <span>
                        <div className="font-medium text-white">Schedule for Later</div>
                        <p className="text-sm text-gray-400">
                          Set a specific date and time to start
                        </p>
                      </span>
                    </Label>
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
        return campaignData.leads.length > 0; // Capacity step valid if leads exist
      case 8:
        return campaignData.teamLeader.length > 0 && campaignData.assignedTeam.length > 0;
      case 9:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-black w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
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
                  {/* Step indicator */}
                  <div className="text-xs text-gray-500">
                    Step {currentStep} of {STEPS.length}
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
                <div className="space-y-2">
                  {launchError && (
                    <p className="text-sm text-red-400 text-right">{launchError}</p>
                  )}
                <Button
                  onClick={async () => {
                    if (!isStepValid()) return;
                    setIsLoading(true);
                    setLaunchError(null);

                    try {
                      const orgId = profile?.organization_id;
                      if (!orgId) throw new Error('No organization found');

                      // Get plan limits for concurrency
                      const plan = getPlanById(orgPlanId);
                      const concurrencyLimit = plan?.maxConcurrentCalls || 5;

                      // Pre-campaign credit check
                      const estimatedMinutes = campaignData.leads.length * avgCallDuration;
                      const assistantTier = classifyAssistantTier('gpt-4o', '11labs');
                      const creditsPerMin = assistantTier === 'budget' ? 18 : assistantTier === 'standard' ? 30 : assistantTier === 'premium' ? 35 : 40;
                      const estimatedCredits = estimatedMinutes * creditsPerMin;

                      const { data: orgData } = await supabase
                        .from('organizations')
                        .select('included_credits, credits_used_this_period, credit_balance')
                        .eq('id', orgId)
                        .single();

                      if (orgData) {
                        const remainingIncluded = Math.max(0, (orgData.included_credits || 0) - (orgData.credits_used_this_period || 0));
                        const totalAvailable = remainingIncluded + ((orgData.credit_balance || 0) * 100); // credit_balance is in dollars, rough conversion

                        if (estimatedCredits > totalAvailable && !orgAutoRechargeEnabled) {
                          const deficit = estimatedCredits - totalAvailable;
                          throw new Error(
                            `Insufficient credits. This campaign needs ~${estimatedCredits.toLocaleString()} credits but you have ~${totalAvailable.toLocaleString()} available. ` +
                            `Please enable auto-recharge or top up before launching.`
                          );
                        }
                      }

                      // Build schedule config for working hours
                      const scheduleConfigData = scheduleConfig ? {
                        working_hours: {
                          enabled: scheduleConfig.workingHoursEnabled,
                          start: scheduleConfig.workingHoursStart,
                          end: scheduleConfig.workingHoursEnd,
                          days: scheduleConfig.workingDays,
                          timezone: scheduleConfig.timezone,
                        },
                        timeframe: scheduleConfig.timeframe,
                        start_date: scheduleConfig.startDate || null,
                        end_date: scheduleConfig.endDate || null,
                      } : null;

                      // Determine campaign status
                      const campaignStatus = campaignData.immediateStart ? 'running' : 'scheduled';

                      // 1. Insert campaign into Supabase
                      const { data: campaign, error: campaignError } = await supabase
                        .from('campaigns')
                        .insert({
                          name: campaignData.name,
                          organization_id: orgId,
                          created_by: user?.id || null,
                          status: campaignStatus,
                          type: campaignData.campaignType || 'outbound',
                          description: campaignData.description || `${campaignData.objective} campaign with ${campaignData.leads.length} leads`,
                          concurrency_limit: concurrencyLimit,
                          phone_number_id: campaignData.providerPhoneId || campaignData.phoneNumber,
                          script_config: {
                            assistantId: campaignData.voiceAgent,
                            phoneNumberId: campaignData.providerPhoneId || campaignData.phoneNumber,
                            voiceSettings: campaignData.voiceSettings,
                          },
                          schedule_config: scheduleConfigData,
                          settings: {
                            objective: campaignData.objective,
                            campaign_type: campaignData.campaignType,
                            assigned_team: campaignData.assignedTeam,
                            team_leader: campaignData.teamLeader,
                            avg_call_duration: avgCallDuration,
                            test_completed: campaignData.testCompleted,
                            test_notes: campaignData.testNotes,
                            scheduled_start: campaignData.scheduledStart || null,
                            immediate_start: campaignData.immediateStart,
                          },
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        })
                        .select()
                        .single();

                      if (campaignError || !campaign) {
                        throw new Error(campaignError?.message || 'Failed to create campaign');
                      }

                      // 2. Import leads via the campaign-import function
                      const contacts = campaignData.leads.map((lead) => ({
                        phone: lead.phone,
                        name: `${lead.firstName} ${lead.lastName}`.trim(),
                        email: lead.email || undefined,
                        company: lead.company || undefined,
                        metadata: {
                          ...(lead.title ? { title: lead.title } : {}),
                          ...(lead.customFields || {}),
                        },
                      }));

                      // Send in batches of 500 to the import function
                      const BATCH_SIZE = 500;
                      let totalImported = 0;
                      let totalSkipped = 0;

                      const { data: sessionData } = await supabase.auth.getSession();
                      const accessToken = sessionData?.session?.access_token;

                      for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
                        const batch = contacts.slice(i, i + BATCH_SIZE);
                        const response = await fetch('/.netlify/functions/campaign-import', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                          },
                          body: JSON.stringify({
                            campaignId: campaign.id,
                            contacts: batch,
                          }),
                        });

                        if (!response.ok) {
                          const errBody = await response.text();
                          console.error(`Import batch ${i / BATCH_SIZE + 1} failed:`, errBody);
                        } else {
                          const result = await response.json();
                          totalImported += result.created || 0;
                          totalSkipped += result.skipped || 0;
                        }
                      }

                      console.log(`Campaign ${campaign.id} created. Imported: ${totalImported}, Skipped: ${totalSkipped}`);

                      // 3. Clear draft and navigate
                      clearDraft();
                      navigate('/campaigns');
                    } catch (err: any) {
                      console.error('Campaign launch failed:', err);
                      setLaunchError(err.message || 'Failed to create campaign. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Launching Campaign...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Launch Campaign
                    </>
                  )}
                </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Exit Confirmation Dialog */}
        <Dialog 
          open={showExitDialog} 
          onOpenChange={(open) => {
            setShowExitDialog(open);
            if (!open) {
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
