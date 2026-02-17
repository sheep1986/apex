import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PLAN_TIERS, type PlanTier } from '@/config/plans';
import { useUserContext } from '@/services/MinimalUserProvider';
import { supabase } from '@/services/supabase-client';
import { voiceService } from '@/services/voice-service';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building,
  Check,
  CheckCircle,
  Copy,
  CreditCard,
  Loader2,
  Phone,
  PhoneForwarded,
  Rocket,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import trinityLogoFull from '@/assets/trinity-logo-full.png';

// ─── Types ───────────────────────────────────────────────────────

interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
}

// ─── Constants ───────────────────────────────────────────────────

const BASE_STEPS: WizardStep[] = [
  { id: 'welcome', title: 'Your Organisation', subtitle: 'Tell us about your business', icon: Building },
  { id: 'plan', title: 'Choose Your Plan', subtitle: 'Select the right tier', icon: CreditCard },
  { id: 'assistant', title: 'Create AI Assistant', subtitle: 'Set up your first voice agent', icon: Bot },
  { id: 'phone', title: 'Phone Number', subtitle: 'Get your dedicated number', icon: Phone },
  { id: 'checkout', title: 'Activate', subtitle: 'Start your subscription', icon: Zap },
  { id: 'launch', title: 'Ready to Launch', subtitle: "You're all set!", icon: Rocket },
];

const FORWARDING_STEP: WizardStep = {
  id: 'forwarding',
  title: 'Call Forwarding',
  subtitle: 'Route calls to your AI',
  icon: PhoneForwarded,
};

interface CarrierInfo {
  name: string;
  code: string;
  cancelCode: string;
  note: string;
}

interface CountryCarriers {
  country: string;
  flag: string;
  carriers: CarrierInfo[];
  genericCode: string;
  genericCancel: string;
}

const CARRIER_DATABASE: CountryCarriers[] = [
  {
    country: 'United Kingdom',
    flag: '🇬🇧',
    carriers: [
      { name: 'O2', code: '*21*{number}#', cancelCode: '##21#', note: 'Forwards all calls. Dial ##21# to cancel.' },
      { name: 'EE', code: '*21*{number}#', cancelCode: '##21#', note: 'Immediate unconditional forwarding.' },
      { name: 'Vodafone', code: '*21*{number}#', cancelCode: '#21#', note: 'Diverts all incoming calls. Dial #21# to cancel.' },
      { name: 'Three', code: '*21*{number}#', cancelCode: '##21#', note: 'Works on all Three pay monthly and PAYG plans.' },
      { name: 'BT (Landline)', code: '*21*{number}#', cancelCode: '#21#', note: 'BT landline call divert. Charges may apply.' },
    ],
    genericCode: '*21*{number}#',
    genericCancel: '##21#',
  },
  {
    country: 'United States',
    flag: '🇺🇸',
    carriers: [
      { name: 'AT&T', code: '*21*{number}#', cancelCode: '#21#', note: 'Immediate call forwarding for all calls.' },
      { name: 'T-Mobile', code: '**21*{number}#', cancelCode: '##21#', note: 'Unconditional call forwarding.' },
      { name: 'Verizon', code: '*72{number}', cancelCode: '*73', note: 'Dial *72 then the number. Dial *73 to cancel.' },
      { name: 'Xfinity Mobile', code: '*72{number}', cancelCode: '*73', note: 'Same as Verizon network forwarding.' },
    ],
    genericCode: '*72{number}',
    genericCancel: '*73',
  },
  {
    country: 'Canada',
    flag: '🇨🇦',
    carriers: [
      { name: 'Bell', code: '*72{number}', cancelCode: '*73', note: 'Standard call forwarding. Dial *73 to cancel.' },
      { name: 'Rogers', code: '*72{number}', cancelCode: '*73', note: 'Standard call forwarding activation.' },
      { name: 'Telus', code: '*72{number}', cancelCode: '*73', note: 'Works on postpaid and prepaid plans.' },
    ],
    genericCode: '*72{number}',
    genericCancel: '*73',
  },
  {
    country: 'Australia',
    flag: '🇦🇺',
    carriers: [
      { name: 'Telstra', code: '*21*{number}#', cancelCode: '#21#', note: 'Immediate diversion for all calls.' },
      { name: 'Optus', code: '*21*{number}#', cancelCode: '#21#', note: 'Unconditional call diversion.' },
      { name: 'Vodafone AU', code: '*21*{number}#', cancelCode: '#21#', note: 'Diverts all incoming calls.' },
    ],
    genericCode: '*21*{number}#',
    genericCancel: '#21#',
  },
  {
    country: 'Germany',
    flag: '🇩🇪',
    carriers: [
      { name: 'Telekom', code: '*21*{number}#', cancelCode: '##21#', note: 'Rufumleitung sofort.' },
      { name: 'Vodafone DE', code: '*21*{number}#', cancelCode: '##21#', note: 'Sofortige Rufumleitung.' },
      { name: 'O2 DE', code: '*21*{number}#', cancelCode: '##21#', note: 'Alle Anrufe umleiten.' },
    ],
    genericCode: '*21*{number}#',
    genericCancel: '##21#',
  },
  {
    country: 'France',
    flag: '🇫🇷',
    carriers: [
      { name: 'Orange', code: '*21*{number}#', cancelCode: '#21#', note: 'Renvoi immédiat de tous les appels.' },
      { name: 'SFR', code: '*21*{number}#', cancelCode: '#21#', note: 'Transfert inconditionnel.' },
      { name: 'Bouygues', code: '*21*{number}#', cancelCode: '#21#', note: 'Renvoi d\'appel immédiat.' },
    ],
    genericCode: '*21*{number}#',
    genericCancel: '#21#',
  },
  {
    country: 'India',
    flag: '🇮🇳',
    carriers: [
      { name: 'Jio', code: '*401*{number}#', cancelCode: '*402#', note: 'Unconditional call forwarding.' },
      { name: 'Airtel', code: '*21*{number}#', cancelCode: '##21#', note: 'All call divert activation.' },
      { name: 'Vi (Vodafone Idea)', code: '*21*{number}#', cancelCode: '##21#', note: 'Unconditional divert.' },
    ],
    genericCode: '*21*{number}#',
    genericCancel: '##21#',
  },
  {
    country: 'UAE',
    flag: '🇦🇪',
    carriers: [
      { name: 'Etisalat', code: '*21*{number}#', cancelCode: '##21#', note: 'Unconditional call diversion.' },
      { name: 'du', code: '*21*{number}#', cancelCode: '##21#', note: 'All call forwarding.' },
    ],
    genericCode: '*21*{number}#',
    genericCancel: '##21#',
  },
  {
    country: 'Other (GSM Standard)',
    flag: '🌍',
    carriers: [],
    genericCode: '*21*{number}#',
    genericCancel: '##21#',
  },
];

function buildSteps(useCase: string): WizardStep[] {
  const steps = [...BASE_STEPS];
  if (useCase === 'inbound' || useCase === 'both') {
    // Insert forwarding step right after 'phone' (index 3), before 'checkout'
    const phoneIndex = steps.findIndex((s) => s.id === 'phone');
    steps.splice(phoneIndex + 1, 0, FORWARDING_STEP);
  }
  return steps;
}

const INDUSTRIES = [
  'Telesales / Lead Generation',
  'Estate Agents / Property',
  'Legal (RTA / Claims)',
  'Energy / Utilities',
  'Healthcare / NHS',
  'Insurance',
  'Financial Services',
  'Technology / SaaS',
  'Recruitment',
  'Education',
  'Retail / E-commerce',
  'Other',
];

const USE_CASES = [
  { id: 'outbound', label: 'Outbound Calling', desc: 'AI calls your leads automatically' },
  { id: 'inbound', label: 'Inbound Reception', desc: 'AI answers and routes incoming calls' },
  { id: 'both', label: 'Both', desc: 'Full inbound + outbound capabilities' },
];

// ─── Component ───────────────────────────────────────────────────

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userContext } = useUserContext();

  // Step tracking
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forwarding step state
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [forwardingTested, setForwardingTested] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Step 1: Organisation info
  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('');
  const [useCase, setUseCase] = useState('both');

  // Step 2: Plan selection
  const [selectedPlan, setSelectedPlan] = useState<string>('employee_3');

  // Step 3: Assistant creation
  const [assistantName, setAssistantName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a professional AI assistant for our company. Be helpful, concise, and friendly. If the caller needs to speak with a human, offer to transfer them.'
  );
  const [voiceId, setVoiceId] = useState('');
  const [assistantCreated, setAssistantCreated] = useState(false);
  const [createdAssistantId, setCreatedAssistantId] = useState<string | null>(null);

  // Step 4: Phone number
  const [areaCode, setAreaCode] = useState('');
  const [provisionedNumber, setProvisionedNumber] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Step 5: Checkout
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  // Voice service readiness
  const [voiceReady, setVoiceReady] = useState(false);

  // Dynamic steps based on use case
  const STEPS = React.useMemo(() => buildSteps(useCase), [useCase]);

  // Helper to find step index by id
  const stepIndexOf = (id: string) => STEPS.findIndex((s) => s.id === id);

  // ─── Effects ─────────────────────────────────────────────────────

  // Pre-fill org name
  useEffect(() => {
    if (userContext?.organizationName && !orgName) {
      setOrgName(userContext.organizationName);
    }
  }, [userContext?.organizationName]);

  // Pre-fill assistant name
  useEffect(() => {
    if (orgName && !assistantName) {
      setAssistantName(`${orgName} AI Assistant`);
    }
  }, [orgName]);

  // Poll voice service
  useEffect(() => {
    const interval = setInterval(() => {
      if (voiceService.isInitialized()) {
        setVoiceReady(true);
        clearInterval(interval);
      }
    }, 500);
    if (voiceService.isInitialized()) setVoiceReady(true);
    return () => clearInterval(interval);
  }, []);

  // Handle return from Stripe checkout
  useEffect(() => {
    if (searchParams.get('subscription_success') === 'true') {
      setCheckoutComplete(true);
      // Mark all steps before launch as complete
      const launchIdx = stepIndexOf('launch');
      const allBefore = Array.from({ length: launchIdx }, (_, i) => i);
      setCompletedSteps((prev) => new Set([...prev, ...allBefore]));
      setCurrentStep(launchIdx);
    }
  }, [searchParams, STEPS]);

  // ─── Handlers ────────────────────────────────────────────────────

  const markStepComplete = (step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  };

  const handleCreateAssistant = async () => {
    if (!voiceReady) {
      setError('Voice service is still initializing. Please wait a moment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await voiceService.createAssistant({
        name: assistantName || `${orgName} AI Assistant`,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: systemPrompt }],
        },
        voice: {
          provider: '11labs',
          voiceId: voiceId || 'sarah',
        },
        firstMessage: `Hello! Thank you for calling ${orgName || 'us'}. How can I help you today?`,
        endCallMessage: 'Thank you for calling. Have a great day!',
      });

      if (result?.id) {
        setAssistantCreated(true);
        setCreatedAssistantId(result.id);
        markStepComplete(stepIndexOf('assistant'));
      } else {
        throw new Error('Failed to create assistant');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create assistant. You can set this up later.');
    } finally {
      setLoading(false);
    }
  };

  const handleProvisionNumber = async () => {
    if (!areaCode || areaCode.length < 3) {
      setError('Please enter a 3-digit area code.');
      return;
    }

    setIsProvisioning(true);
    setError(null);

    try {
      const result = await voiceService.autoProvisionNumber(
        areaCode,
        `${orgName} Line`,
        createdAssistantId || undefined
      );

      if (result?.success && result?.number) {
        setProvisionedNumber(result.number.number || result.number.id);
        markStepComplete(stepIndexOf('phone'));
      } else {
        throw new Error('Failed to provision number');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to provision number. You can add one later from Telephony.');
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: 'subscription',
          planId: selectedPlan,
          organizationId: userContext?.organization_id,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setError(null);
    const currentId = STEPS[currentStep]?.id;

    if (currentId === 'welcome') {
      if (!orgName.trim()) {
        setError('Please enter your organisation name.');
        return;
      }
      if (userContext?.organization_id && orgName !== userContext.organizationName) {
        try {
          await supabase.from('organizations').update({ name: orgName }).eq('id', userContext.organization_id);
        } catch (err) {
          console.warn('Could not update org name:', err);
        }
      }
      markStepComplete(currentStep);
    }

    if (currentId === 'plan') {
      markStepComplete(currentStep);
    }

    if (currentId === 'forwarding') {
      markStepComplete(currentStep);
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setError(null);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleLaunch = async () => {
    setLoading(true);
    try {
      if (userContext?.organization_id) {
        // Mark profile as onboarding completed
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('organization_id', userContext.organization_id);

        // Set org onboarded_at timestamp + initial activation checklist
        await supabase
          .from('organizations')
          .update({
            onboarded_at: new Date().toISOString(),
            activation_checklist: {
              create_org: true,
              choose_plan: true,
              create_assistant: completedSteps.has(stepIndexOf('assistant')),
              assign_phone: completedSteps.has(stepIndexOf('phone')),
              first_test_call: false,
              first_campaign: false,
              first_deal: false,
            },
          })
          .eq('id', userContext.organization_id)
          .catch(() => {}); // non-critical
      }
      markStepComplete(stepIndexOf('launch'));
      await new Promise((r) => setTimeout(r, 800));
      navigate('/dashboard', { replace: true });
    } catch {
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAssistant = () => {
    const idx = stepIndexOf('assistant');
    markStepComplete(idx);
    setCurrentStep(idx + 1);
  };

  const handleSkipPhone = () => {
    const idx = stepIndexOf('phone');
    markStepComplete(idx);
    setCurrentStep(idx + 1);
  };

  const handleSkipForwarding = () => {
    const idx = stepIndexOf('forwarding');
    markStepComplete(idx);
    setCurrentStep(idx + 1);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  // ─── Progress ────────────────────────────────────────────────────

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const selectedPlanData = PLAN_TIERS.find((p) => p.id === selectedPlan);

  // ─── Step Renderers ──────────────────────────────────────────────

  const renderWelcomeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Welcome to Trinity Labs AI</h2>
        <p className="text-gray-400">Let's get your AI calling platform set up in just a few minutes.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="orgName" className="text-gray-300">Organisation Name</Label>
          <Input
            id="orgName"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Your Company Ltd"
            className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
          />
        </div>

        <div>
          <Label htmlFor="industry" className="text-gray-300">Industry</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="mt-1 border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind.toLowerCase()}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-3 block text-gray-300">Primary Use Case</Label>
          <div className="grid gap-3">
            {USE_CASES.map((uc) => (
              <div
                key={uc.id}
                onClick={() => setUseCase(uc.id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  useCase === uc.id
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{uc.label}</p>
                    <p className="text-sm text-gray-400">{uc.desc}</p>
                  </div>
                  {useCase === uc.id && <CheckCircle className="h-5 w-5 text-emerald-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPlanStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Choose Your AI Workforce</h2>
        <p className="text-gray-400">Each AI Employee works 24/7, costs less than minimum wage. Upgrade anytime.</p>
      </div>

      <div className="grid gap-4">
        {PLAN_TIERS.filter((p) => !p.contactSales).map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all ${
              selectedPlan === plan.id
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-2.5 right-4 bg-emerald-600 text-white border-0">
                <Star className="mr-1 h-3 w-3" /> Most Popular
              </Badge>
            )}

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">{plan.displayName}</h3>
                  <span className="text-2xl font-bold text-emerald-400">£{plan.monthlyPriceGBP.toLocaleString()}<span className="text-sm font-normal text-gray-400">/mo</span></span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
                  <span>{plan.includedCredits.toLocaleString()} credits</span>
                  <span>≈ {plan.equivalentStandardMinutes.toLocaleString()} min</span>
                  <span>{plan.includedPhoneNumbers} number{plan.includedPhoneNumbers !== 1 ? 's' : ''}</span>
                  <span>{plan.maxAssistants === -1 ? 'Unlimited' : plan.maxAssistants} assistant{plan.maxAssistants !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                selectedPlan === plan.id
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-gray-600'
              }`}>
                {selectedPlan === plan.id && <Check className="h-4 w-4 text-white" />}
              </div>
            </div>

            {selectedPlan === plan.id && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {plan.features.slice(0, 6).map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                    {feat}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Enterprise callout */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-sm text-gray-400">
            Need 10+ AI Employees? <span className="font-medium text-white">Enterprise</span> with custom pricing.{' '}
            <button className="text-emerald-400 underline hover:text-emerald-300">Contact Sales</button>
          </p>
        </div>
      </div>
    </div>
  );

  const renderAssistantStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Create Your First AI Assistant</h2>
        <p className="text-gray-400">This is the voice your callers will hear. You can create more later.</p>
      </div>

      {assistantCreated ? (
        <div className="flex flex-col items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-8">
          <CheckCircle className="mb-3 h-12 w-12 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Assistant Created!</h3>
          <p className="mt-1 text-sm text-gray-400">
            <span className="font-medium text-emerald-400">{assistantName}</span> is ready to take calls.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="assistantName" className="text-gray-300">Assistant Name</Label>
            <Input
              id="assistantName"
              value={assistantName}
              onChange={(e) => setAssistantName(e.target.value)}
              placeholder="My AI Receptionist"
              className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
            />
          </div>

          <div>
            <Label className="text-gray-300">Voice</Label>
            <Select value={voiceId || 'sarah'} onValueChange={setVoiceId}>
              <SelectTrigger className="mt-1 border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sarah">Sarah (Professional Female)</SelectItem>
                <SelectItem value="mark">Mark (Professional Male)</SelectItem>
                <SelectItem value="emily">Emily (Friendly Female)</SelectItem>
                <SelectItem value="josh">Josh (Warm Male)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">System Prompt</Label>
            <p className="mb-2 text-xs text-gray-500">This tells the AI how to behave. You can refine this later.</p>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4}
              className="border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
            />
          </div>

          {!voiceReady && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Voice service is initializing...
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleCreateAssistant}
              disabled={loading || !voiceReady || !assistantName.trim()}
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Create Assistant</>
              )}
            </Button>
            <Button variant="ghost" onClick={handleSkipAssistant} className="text-gray-400 hover:text-white">
              Skip for now
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPhoneStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Get Your Phone Number</h2>
        <p className="text-gray-400">
          We'll provision a dedicated phone number for your AI assistant.
          {selectedPlanData && (
            <span className="block mt-1 text-emerald-400">
              Your {selectedPlanData.displayName} plan includes {selectedPlanData.includedPhoneNumbers} number{selectedPlanData.includedPhoneNumbers !== 1 ? 's' : ''}.
            </span>
          )}
        </p>
      </div>

      {provisionedNumber ? (
        <div className="flex flex-col items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-8">
          <CheckCircle className="mb-3 h-12 w-12 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Number Provisioned!</h3>
          <p className="mt-1 font-mono text-lg text-emerald-400">{provisionedNumber}</p>
          {createdAssistantId && (
            <p className="mt-2 text-sm text-gray-400">Assigned to {assistantName}</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label className="text-gray-300">Area Code (US)</Label>
            <div className="flex gap-3 mt-1">
              <Input
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="e.g. 415, 212, 310"
                maxLength={3}
                className="border-white/10 bg-white/5 text-white font-mono placeholder:text-gray-500 focus:border-emerald-500/50"
              />
              <Button
                onClick={handleProvisionNumber}
                disabled={isProvisioning || areaCode.length < 3}
                className="bg-emerald-600 text-white hover:bg-emerald-700 min-w-[160px]"
              >
                {isProvisioning ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Provisioning...</>
                ) : (
                  <><Phone className="mr-2 h-4 w-4" /> Get Number</>
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Enter a US area code and we'll provision a number instantly.
            </p>
          </div>

          <Button variant="ghost" onClick={handleSkipPhone} className="text-gray-400 hover:text-white">
            Skip — I'll add a number later
          </Button>
        </div>
      )}
    </div>
  );

  const renderForwardingStep = () => {
    const trinityNumber = provisionedNumber || '(your Trinity number)';
    const activeCountry = CARRIER_DATABASE.find((c) => c.country === selectedCountry);
    const activeCarrier = activeCountry?.carriers.find((c) => c.name === selectedCarrier);

    // Use carrier-specific code, or fall back to country's generic GSM code
    const rawCode = activeCarrier?.code || activeCountry?.genericCode || null;
    const dialCode = rawCode ? rawCode.replace('{number}', trinityNumber) : null;
    const cancelCode = activeCarrier?.cancelCode || activeCountry?.genericCancel || null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">Forward Calls to Your AI</h2>
          <p className="text-gray-400">
            Forward your existing number to your Trinity number so incoming calls are answered by your AI assistant.
          </p>
        </div>

        {/* Instruction banner */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-3">
            <PhoneForwarded className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="font-medium text-white">Forward your existing number to your Trinity number</p>
              <p className="mt-1 text-sm text-gray-400">
                Select your country and carrier below, then dial the forwarding code from your phone. All incoming calls
                will be routed to your AI assistant automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Trinity number display */}
        {provisionedNumber && (
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">Your Trinity Number</p>
            <p className="font-mono text-lg text-emerald-400">{provisionedNumber}</p>
          </div>
        )}

        {/* Country selection */}
        <div>
          <Label className="mb-3 block text-gray-300">Select Your Country</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CARRIER_DATABASE.map((country) => (
              <div
                key={country.country}
                onClick={() => {
                  setSelectedCountry(country.country);
                  setSelectedCarrier(null);
                }}
                className={`cursor-pointer rounded-lg border p-3 text-center transition-all ${
                  selectedCountry === country.country
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <span className="text-lg">{country.flag}</span>
                <p className="mt-1 text-xs font-medium text-white">{country.country}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Carrier selection (shown after country is selected) */}
        {activeCountry && activeCountry.carriers.length > 0 && (
          <div>
            <Label className="mb-3 block text-gray-300">Select Your Carrier</Label>
            <div className="grid gap-2">
              {activeCountry.carriers.map((carrier) => (
                <div
                  key={carrier.name}
                  onClick={() => setSelectedCarrier(carrier.name)}
                  className={`cursor-pointer rounded-lg border p-4 transition-all ${
                    selectedCarrier === carrier.name
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{carrier.name}</p>
                      <p className="text-sm text-gray-400">{carrier.note}</p>
                    </div>
                    {selectedCarrier === carrier.name && (
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dialer code display (shown when country is selected — uses generic code if no carrier chosen) */}
        {activeCountry && dialCode && (
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Dial This Code From Your Phone
              </p>
              <div className="flex items-center justify-between gap-3">
                <code className="text-lg font-bold text-emerald-400">{dialCode}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyCode(dialCode)}
                  className="text-gray-400 hover:text-white"
                >
                  {copiedCode ? (
                    <><Check className="mr-1.5 h-4 w-4 text-emerald-400" /> Copied</>
                  ) : (
                    <><Copy className="mr-1.5 h-4 w-4" /> Copy</>
                  )}
                </Button>
              </div>
              {cancelCode && (
                <p className="mt-3 text-xs text-gray-500">
                  To cancel forwarding later, dial: <code className="text-gray-300">{cancelCode}</code>
                </p>
              )}
              {!activeCarrier && activeCountry.carriers.length > 0 && (
                <p className="mt-2 text-xs text-amber-400/80">
                  This is the standard GSM code. Select your carrier above for carrier-specific instructions.
                </p>
              )}
            </div>

            {/* Steps to forward */}
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
              <p className="mb-3 text-sm font-medium text-white">How to set up</p>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    1
                  </span>
                  Open the Phone / Dialer app on your mobile
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    2
                  </span>
                  <span>
                    Type <code className="rounded bg-gray-700 px-1 py-0.5 text-emerald-400">{dialCode}</code> and press Call
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    3
                  </span>
                  You should hear a confirmation tone or see a success message
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    4
                  </span>
                  All incoming calls will now be answered by your AI assistant
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Test forwarding section */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <p className="mb-2 text-sm font-medium text-white">Test Your Forwarding</p>
          <p className="mb-3 text-sm text-gray-400">
            After setting up forwarding, call your own number from a different phone. If your AI assistant answers,
            forwarding is working correctly.
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForwardingTested(true)}
              className={`border-gray-600 text-gray-300 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-white ${
                forwardingTested ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : ''
              }`}
            >
              {forwardingTested ? (
                <><CheckCircle className="mr-2 h-4 w-4 text-emerald-400" /> Verified Working</>
              ) : (
                <><Phone className="mr-2 h-4 w-4" /> I've Tested It</>
              )}
            </Button>
            {forwardingTested && (
              <span className="text-sm text-emerald-400">Forwarding confirmed</span>
            )}
          </div>
        </div>

        {/* Skip option */}
        <Button
          variant="ghost"
          onClick={handleSkipForwarding}
          className="w-full text-gray-400 hover:text-white"
        >
          Skip — I'll set up forwarding later
        </Button>
      </div>
    );
  };

  const renderCheckoutStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-white">Activate Your Plan</h2>
        <p className="text-gray-400">Review your setup and start your subscription.</p>
      </div>

      {/* Order summary */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h3 className="font-semibold text-white">Order Summary</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Plan</span>
            <span className="font-medium text-white">{selectedPlanData?.displayName || '1 AI Employee'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Monthly price</span>
            <span className="font-medium text-emerald-400">£{selectedPlanData?.monthlyPriceGBP.toLocaleString()}/mo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Included credits</span>
            <span className="text-white">{selectedPlanData?.includedCredits.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">≈ Standard minutes</span>
            <span className="text-white">{selectedPlanData?.equivalentStandardMinutes.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Phone numbers</span>
            <span className="text-white">{selectedPlanData?.includedPhoneNumbers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">AI assistants</span>
            <span className="text-white">{selectedPlanData?.maxAssistants === -1 ? 'Unlimited' : selectedPlanData?.maxAssistants}</span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-white">Total</span>
            <span className="text-emerald-400">£{selectedPlanData?.monthlyPriceGBP.toLocaleString()}/month</span>
          </div>
        </div>
      </div>

      {/* What you've set up */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-gray-300">Organisation: <strong className="text-white">{orgName}</strong></span>
        </div>
        {assistantCreated && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-gray-300">AI Assistant: <strong className="text-white">{assistantName}</strong></span>
          </div>
        )}
        {provisionedNumber && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-gray-300">Phone: <strong className="text-white font-mono">{provisionedNumber}</strong></span>
          </div>
        )}
      </div>

      <Button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-emerald-600 py-6 text-lg font-semibold text-white hover:bg-emerald-700"
      >
        {loading ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Redirecting to checkout...</>
        ) : (
          <><CreditCard className="mr-2 h-5 w-5" /> Subscribe — £{selectedPlanData?.monthlyPriceGBP.toLocaleString()}/mo</>
        )}
      </Button>

      <p className="text-center text-xs text-gray-500">
        Secure checkout powered by Stripe. Cancel anytime.
      </p>
    </div>
  );

  const renderLaunchStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <Rocket className="h-10 w-10 text-emerald-400" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-white">You're All Set!</h2>
        <p className="text-gray-400">Your AI calling platform is live and ready to go.</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          <div>
            <p className="font-medium text-white">Organisation: {orgName}</p>
            {industry && <p className="text-sm text-gray-400">{INDUSTRIES.find((i) => i.toLowerCase() === industry) || industry}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          <div>
            <p className="font-medium text-white">{selectedPlanData?.displayName} — £{selectedPlanData?.monthlyPriceGBP.toLocaleString()}/mo</p>
            <p className="text-sm text-gray-400">{selectedPlanData?.includedCredits.toLocaleString()} credits (≈ {selectedPlanData?.equivalentStandardMinutes.toLocaleString()} min)</p>
          </div>
        </div>

        {assistantCreated && (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="font-medium text-white">Assistant: {assistantName}</p>
              <p className="text-sm text-gray-400">Ready to handle calls</p>
            </div>
          </div>
        )}

        {provisionedNumber && (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
            <div>
              <p className="font-medium text-white font-mono">{provisionedNumber}</p>
              <p className="text-sm text-gray-400">Your dedicated phone number</p>
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={handleLaunch}
        disabled={loading}
        className="w-full bg-emerald-600 py-6 text-lg font-semibold text-white hover:bg-emerald-700"
      >
        {loading ? (
          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Launching...</>
        ) : (
          <><Rocket className="mr-2 h-5 w-5" /> Launch Dashboard</>
        )}
      </Button>
    </div>
  );

  const renderStepContent = () => {
    switch (STEPS[currentStep]?.id) {
      case 'welcome': return renderWelcomeStep();
      case 'plan': return renderPlanStep();
      case 'assistant': return renderAssistantStep();
      case 'phone': return renderPhoneStep();
      case 'forwarding': return renderForwardingStep();
      case 'checkout': return renderCheckoutStep();
      case 'launch': return renderLaunchStep();
      default: return null;
    }
  };

  // Should we show nav buttons?
  const currentId = STEPS[currentStep]?.id;
  const showNav = currentStep < STEPS.length - 1 && currentId !== 'checkout' && currentId !== 'forwarding';

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-950 via-black to-gray-950">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 flex items-center justify-center border-b border-white/5 px-6 py-4">
        <img src={trinityLogoFull} alt="Trinity Labs AI" className="h-8 w-auto object-contain" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-400">Step {currentStep + 1} of {STEPS.length}</span>
            <span className="text-gray-400">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isComplete = completedSteps.has(index);
            const isCurrent = index === currentStep;
            return (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    isComplete ? 'border-emerald-500 bg-emerald-500'
                      : isCurrent ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-white/10 bg-white/5'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <Icon className={`h-5 w-5 ${isCurrent ? 'text-emerald-400' : 'text-gray-500'}`} />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 w-6 ${isComplete ? 'bg-emerald-500' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="border-white/10 bg-black/50 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-6 sm:p-8">
            {renderStepContent()}

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {showNav && (
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={handlePrevious} disabled={currentStep === 0} className="text-gray-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <Button onClick={handleNext} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {currentId === 'assistant' && !assistantCreated ? 'Skip & Continue' : (
                <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
