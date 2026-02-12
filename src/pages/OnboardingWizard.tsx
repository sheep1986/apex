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
  CreditCard,
  Loader2,
  Phone,
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

const STEPS: WizardStep[] = [
  { id: 'welcome', title: 'Your Organisation', subtitle: 'Tell us about your business', icon: Building },
  { id: 'plan', title: 'Choose Your Plan', subtitle: 'Select the right tier', icon: CreditCard },
  { id: 'assistant', title: 'Create AI Assistant', subtitle: 'Set up your first voice agent', icon: Bot },
  { id: 'phone', title: 'Phone Number', subtitle: 'Get your dedicated number', icon: Phone },
  { id: 'checkout', title: 'Activate', subtitle: 'Start your subscription', icon: Zap },
  { id: 'launch', title: 'Ready to Launch', subtitle: "You're all set!", icon: Rocket },
];

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

  // Step 1: Organisation info
  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('');
  const [useCase, setUseCase] = useState('both');

  // Step 2: Plan selection
  const [selectedPlan, setSelectedPlan] = useState<string>('growth');

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
      setCompletedSteps((prev) => new Set([...prev, 0, 1, 2, 3, 4]));
      setCurrentStep(5); // Jump to launch step
    }
  }, [searchParams]);

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
        markStepComplete(2);
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
        markStepComplete(3);
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

    if (currentStep === 0) {
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
      markStepComplete(0);
    }

    if (currentStep === 1) {
      markStepComplete(1);
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
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('organization_id', userContext.organization_id);
      }
      markStepComplete(5);
      await new Promise((r) => setTimeout(r, 800));
      navigate('/dashboard', { replace: true });
    } catch {
      navigate('/dashboard', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipAssistant = () => {
    markStepComplete(2);
    setCurrentStep(3);
  };

  const handleSkipPhone = () => {
    markStepComplete(3);
    setCurrentStep(4);
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
        <h2 className="mb-2 text-2xl font-bold text-white">Choose Your Plan</h2>
        <p className="text-gray-400">Select the plan that fits your needs. You can upgrade anytime.</p>
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
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <span className="text-2xl font-bold text-emerald-400">${plan.monthlyPrice}<span className="text-sm font-normal text-gray-400">/mo</span></span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
                  <span>{plan.includedMinutes.toLocaleString()} minutes</span>
                  <span>{plan.includedPhoneNumbers} phone number{plan.includedPhoneNumbers !== 1 ? 's' : ''}</span>
                  <span>{plan.maxAssistants === -1 ? 'Unlimited' : plan.maxAssistants} assistant{plan.maxAssistants !== 1 ? 's' : ''}</span>
                  <span>${plan.overagePerMinute}/min overage</span>
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
            Need more? <span className="font-medium text-white">Enterprise</span> plans with custom pricing available.{' '}
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
              Your {selectedPlanData.name} plan includes {selectedPlanData.includedPhoneNumbers} number{selectedPlanData.includedPhoneNumbers !== 1 ? 's' : ''}.
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
            <span className="font-medium text-white">{selectedPlanData?.name || 'Starter'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Monthly price</span>
            <span className="font-medium text-emerald-400">${selectedPlanData?.monthlyPrice}/mo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Included minutes</span>
            <span className="text-white">{selectedPlanData?.includedMinutes.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Phone numbers</span>
            <span className="text-white">{selectedPlanData?.includedPhoneNumbers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">AI assistants</span>
            <span className="text-white">{selectedPlanData?.maxAssistants === -1 ? 'Unlimited' : selectedPlanData?.maxAssistants}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Overage rate</span>
            <span className="text-white">${selectedPlanData?.overagePerMinute}/min</span>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-white">Total</span>
            <span className="text-emerald-400">${selectedPlanData?.monthlyPrice}/month</span>
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
          <><CreditCard className="mr-2 h-5 w-5" /> Subscribe — ${selectedPlanData?.monthlyPrice}/mo</>
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
            <p className="font-medium text-white">{selectedPlanData?.name} Plan — ${selectedPlanData?.monthlyPrice}/mo</p>
            <p className="text-sm text-gray-400">{selectedPlanData?.includedMinutes.toLocaleString()} minutes included</p>
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
      case 'checkout': return renderCheckoutStep();
      case 'launch': return renderLaunchStep();
      default: return null;
    }
  };

  // Should we show nav buttons?
  const showNav = currentStep < STEPS.length - 1 && STEPS[currentStep]?.id !== 'checkout';

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
              {currentStep === 2 && !assistantCreated ? 'Skip & Continue' : (
                <>Continue <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
