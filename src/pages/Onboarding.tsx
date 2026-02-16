import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    type AssistantConfig
} from '@/services/user-config.service';
import {
    ArrowLeft,
    ArrowRight,
    Bot,
    CheckCircle,
    CreditCard,
    Database,
    ExternalLink,
    Key,
    Loader2,
    Phone,
    User,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  industry: string;
  timezone: string;
  phoneNumber: string;
}

interface IntegrationKeys {
  voice_engine: {
    apiKey: string;
    encrypted: boolean;
    testStatus: string;
  };
  airtable: {
    apiKey: string;
    encrypted: boolean;
    testStatus: string;
  };
  makecom: {
    webhookUrl: string;
    encrypted: boolean;
    testStatus: string;
  };
}

// Named function for proper exports
function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    industry: '',
    timezone: 'America/New_York',
    phoneNumber: '',
  });

  const [integrationKeys, setIntegrationKeys] = useState<IntegrationKeys>({
    voice_engine: {
      apiKey: '',
      encrypted: false,
      testStatus: 'pending',
    },
    airtable: {
      apiKey: '',
      encrypted: false,
      testStatus: 'pending',
    },
    makecom: {
      webhookUrl: '',
      encrypted: false,
      testStatus: 'pending',
    },
  });

  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig>({
    id: '',
    name: 'AI Sales Assistant',
    language: 'en',
    voice: 'jennifer',
    tone: 'professional',
    systemPrompt:
      'You are a professional AI sales assistant. Your goal is to qualify leads and schedule appointments.',
    workingHours: {
      enabled: true,
      start: '09:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timezone: 'America/New_York',
    },

    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'profile',
      title: 'Profile Setup',
      description: 'Tell us about yourself and your business',
      icon: User,
      completed: false,
    },
    {
      id: 'integrations',
      title: 'Connect Integrations',
      description: 'Set up Airtable and Make.com connections',
      icon: Key,
      completed: false,
    },
    {
      id: 'assistant',
      title: 'Create AI Assistant',
      description: 'Configure your first AI calling assistant',
      icon: Bot,
      completed: false,
    },
    {
      id: 'billing',
      title: 'Setup Billing',
      description: 'Add payment method and get calling credits',
      icon: CreditCard,
      completed: false,
    },
    {
      id: 'launch',
      title: 'Launch Platform',
      description: "You're ready to start making AI calls!",
      icon: Phone,
      completed: false,
    },
  ]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' },
  ];

  const voices = [
    { id: 'jennifer', name: 'Jennifer (Professional Female)' },
    { id: 'michael', name: 'Michael (Professional Male)' },
    { id: 'sarah', name: 'Sarah (Friendly Female)' },
    { id: 'david', name: 'David (Authoritative Male)' },
    { id: 'emma', name: 'Emma (Conversational Female)' },
    { id: 'james', name: 'James (Warm Male)' },
  ];

  const tones = [
    { id: 'professional', name: 'Professional' },
    { id: 'friendly', name: 'Friendly' },
    { id: 'conversational', name: 'Conversational' },
    { id: 'authoritative', name: 'Authoritative' },
    { id: 'empathetic', name: 'Empathetic' },
    { id: 'enthusiastic', name: 'Enthusiastic' },
    { id: 'consultative', name: 'Consultative' },
    { id: 'direct', name: 'Direct' },
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Real Estate',
    'Insurance',
    'Education',
    'Retail',
    'Manufacturing',
    'Consulting',
    'Marketing',
    'Legal',
    'Non-Profit',
    'Other',
  ];

  const testConnection = async (service: string) => {
    setTestingConnection(service);
    setLoading(true);

    try {
      // Simulate API test
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would actually test the API connection
      setTestingConnection(null);
      setLoading(false);
      return true;
    } catch (error) {
      setTestingConnection(null);
      setLoading(false);
      return false;
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as completed
      const updatedSteps = [...steps];
      updatedSteps[currentStep].completed = true;
      setSteps(updatedSteps);

      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);

    try {
      // Save all configuration to backend
      const onboardingData = {
        userProfile,
        integrationKeys,
        assistantConfig,
      };

      // Here you would save to your backend
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mark final step as completed
      const updatedSteps = [...steps];
      updatedSteps[currentStep].completed = true;
      setSteps(updatedSteps);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderStepContent = () => {
    switch (steps[currentStep]?.id) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-white">Let's get to know you</h2>
              <p className="text-gray-400">This helps us personalize your AI calling experience</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-white">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={userProfile.firstName}
                  onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
                  className="border-gray-700 bg-gray-800 text-white"
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-white">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={userProfile.lastName}
                  onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
                  className="border-gray-700 bg-gray-800 text-white"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={userProfile.email}
                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                className="border-gray-700 bg-gray-800 text-white"
                placeholder="john@company.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company" className="text-white">
                  Company Name
                </Label>
                <Input
                  id="company"
                  value={userProfile.company}
                  onChange={(e) => setUserProfile({ ...userProfile, company: e.target.value })}
                  className="border-gray-700 bg-gray-800 text-white"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <Label htmlFor="industry" className="text-white">
                  Industry
                </Label>
                <Select
                  onValueChange={(value) => setUserProfile({ ...userProfile, industry: value })}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry.toLowerCase()}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-white">
                Phone Number
              </Label>
              <Input
                id="phone"
                value={userProfile.phoneNumber}
                onChange={(e) => setUserProfile({ ...userProfile, phoneNumber: e.target.value })}
                className="border-gray-700 bg-gray-800 text-white"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-white">Connect Your Tools</h2>
              <p className="text-gray-400">Link your Airtable and Make.com accounts</p>
            </div>

            {/* Voice Provider Integration (Managed by System) */}
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Phone className="h-5 w-5 text-brand-pink" />
                  <span>Voice Provider</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-xs text-emerald-400">
                    Connected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">
                  Your voice AI capabilities are fully managed and ready to use. No configuration required.
                </p>
              </CardContent>
            </Card>

            {/* Airtable Integration */}
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Database className="h-5 w-5 text-blue-400" />
                  <span>Airtable (Data Storage)</span>
                  <Badge variant="outline" className="text-xs">
                    Required
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">
                  Store call results and lead data. Get your API key from{' '}
                  <a
                    href="https://airtable.com/create/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-pink hover:underline"
                  >
                    Airtable <ExternalLink className="inline h-3 w-3" />
                  </a>
                </p>
                <div className="flex space-x-2">
                  <Input
                    id="airtableKey"
                    type="password"
                    value={integrationKeys.airtable.apiKey}
                    onChange={(e) =>
                      setIntegrationKeys({
                        ...integrationKeys,
                        airtable: { ...integrationKeys.airtable, apiKey: e.target.value },
                      })
                    }
                    className="border-gray-700 bg-gray-800 text-white"
                    placeholder="Your Airtable API key"
                  />
                  <Button
                    variant="outline"
                    onClick={() => testConnection('airtable')}
                    disabled={!integrationKeys.airtable.apiKey || testingConnection === 'airtable'}
                  >
                    {testingConnection === 'airtable' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Make.com Integration */}
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Zap className="h-5 w-5 text-emerald-400" />
                  <span>Make.com (Automation)</span>
                  <Badge variant="outline" className="text-xs">
                    Optional
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">
                  Automate follow-ups and lead routing. Get your webhook URL from{' '}
                  <a
                    href="https://make.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-pink hover:underline"
                  >
                    make.com <ExternalLink className="inline h-3 w-3" />
                  </a>
                </p>
                <div className="flex space-x-2">
                  <Input
                    id="makecomKey"
                    type="password"
                    value={integrationKeys.makecom.webhookUrl}
                    onChange={(e) =>
                      setIntegrationKeys({
                        ...integrationKeys,
                        makecom: { ...integrationKeys.makecom, webhookUrl: e.target.value },
                      })
                    }
                    className="border-gray-700 bg-gray-800 text-white"
                    placeholder="Your Make.com API key"
                  />
                  <Button
                    variant="outline"
                    onClick={() => testConnection('makecom')}
                    disabled={
                      !integrationKeys.makecom.webhookUrl || testingConnection === 'makecom'
                    }
                  >
                    {testingConnection === 'makecom' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'assistant':
        return (
          <div className="space-y-6">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-white">Create Your AI Assistant</h2>
              <p className="text-gray-400">Configure how your AI will sound and behave on calls</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assistantName" className="text-white">
                  Assistant Name
                </Label>
                <Input
                  id="assistantName"
                  value={assistantConfig.name}
                  onChange={(e) => setAssistantConfig({ ...assistantConfig, name: e.target.value })}
                  className="border-gray-700 bg-gray-800 text-white"
                  placeholder="AI Sales Assistant"
                />
              </div>
              <div>
                <Label htmlFor="language" className="text-white">
                  Language
                </Label>
                <Select
                  onValueChange={(value) =>
                    setAssistantConfig({ ...assistantConfig, language: value })
                  }
                >
                  <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voice" className="text-white">
                  Voice
                </Label>
                <Select
                  onValueChange={(value) =>
                    setAssistantConfig({ ...assistantConfig, voice: value })
                  }
                >
                  <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tone" className="text-white">
                  Conversation Tone
                </Label>
                <Select
                  onValueChange={(value) => setAssistantConfig({ ...assistantConfig, tone: value })}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((tone) => (
                      <SelectItem key={tone.id} value={tone.id}>
                        {tone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="systemPrompt" className="text-white">
                System Prompt
              </Label>
              <Textarea
                id="systemPrompt"
                value={assistantConfig.systemPrompt}
                onChange={(e) =>
                  setAssistantConfig({ ...assistantConfig, systemPrompt: e.target.value })
                }
                className="border-gray-700 bg-gray-800 text-white"
                rows={4}
                placeholder="Describe how your AI should behave..."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Working Hours</Label>
                <Switch
                  checked={assistantConfig.workingHours.enabled}
                  onCheckedChange={(checked) =>
                    setAssistantConfig({
                      ...assistantConfig,
                      workingHours: { ...assistantConfig.workingHours, enabled: checked },
                    })
                  }
                />
              </div>

              {assistantConfig.workingHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-white">
                      Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={assistantConfig.workingHours.start}
                      onChange={(e) =>
                        setAssistantConfig({
                          ...assistantConfig,
                          workingHours: { ...assistantConfig.workingHours, start: e.target.value },
                        })
                      }
                      className="border-gray-700 bg-gray-800 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-white">
                      End Time
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={assistantConfig.workingHours.end}
                      onChange={(e) =>
                        setAssistantConfig({
                          ...assistantConfig,
                          workingHours: { ...assistantConfig.workingHours, end: e.target.value },
                        })
                      }
                      className="border-gray-700 bg-gray-800 text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-white">Setup Billing</h2>
              <p className="text-gray-400">Add a payment method to start making calls</p>
            </div>

            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <div className="space-y-4 text-center">
                  <CreditCard className="mx-auto h-16 w-16 text-brand-pink" />
                  <h3 className="text-xl font-semibold text-white">Choose Your Plan</h3>

                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <Card className="cursor-pointer border-gray-600 bg-gray-900 transition-colors hover:border-brand-pink">
                      <CardContent className="p-4 text-center">
                        <h4 className="font-semibold text-white">Starter</h4>
                        <p className="text-2xl font-bold text-brand-pink">$50</p>
                        <p className="text-sm text-gray-400">~67 calls</p>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer border-brand-pink bg-gray-900">
                      <CardContent className="p-4 text-center">
                        <Badge className="mb-2 bg-brand-pink">Popular</Badge>
                        <h4 className="font-semibold text-white">Professional</h4>
                        <p className="text-2xl font-bold text-brand-pink">$200</p>
                        <p className="text-sm text-gray-400">~267 calls</p>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer border-gray-600 bg-gray-900 transition-colors hover:border-brand-pink">
                      <CardContent className="p-4 text-center">
                        <h4 className="font-semibold text-white">Enterprise</h4>
                        <p className="text-2xl font-bold text-brand-pink">$500</p>
                        <p className="text-sm text-gray-400">~667 calls</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink">
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'launch':
        return (
          <div className="space-y-6">
            <div className="mb-8 text-center">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-400" />
              <h2 className="mb-2 text-2xl font-bold text-white">You're All Set!</h2>
              <p className="text-gray-400">Your AI calling platform is ready to use</p>
            </div>

            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">What happens next:</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">Your AI assistant will be created and ready</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">
                      Airtable bases will be automatically set up
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">Make.com workflows will be configured</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-gray-300">Your dashboard will be personalized</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg border border-brand-pink/20 bg-gradient-to-r from-brand-pink/10 to-brand-magenta/10 p-4">
              <h4 className="mb-2 font-semibold text-white">🚀 Ready to make your first call?</h4>
              <p className="text-sm text-gray-300">
                Head to your dashboard to upload contacts and launch your first AI calling campaign!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Welcome to <span className="text-emerald-400">Trinity Labs AI</span>
          </h1>
          <p className="text-gray-400">Let's set up your AI calling platform</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm text-gray-400">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps Navigation */}
        <div className="mb-8 flex justify-center">
          <div className="flex space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center space-y-2 ${
                    index <= currentStep ? 'text-brand-pink' : 'text-gray-500'
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                      step.completed
                        ? 'border-brand-pink bg-brand-pink'
                        : index === currentStep
                          ? 'border-brand-pink bg-brand-pink/10'
                          : 'border-gray-600'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-6 w-6 text-white" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <span className="text-center text-xs font-medium">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-8">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={loading}
            className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : currentStep === steps.length - 1 ? (
              <>
                Launch Platform
                <Phone className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Export both default and named
export default Onboarding;
export { Onboarding };
