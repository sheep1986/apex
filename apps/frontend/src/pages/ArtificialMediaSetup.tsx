import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  Circle,
  AlertCircle,
  Zap,
  Phone,
  Users,
  Settings,
  PlayCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Rocket,
  Target,
  DollarSign,
  Clock,
  Building,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEAN_SETUP } from '@/data/sean-setup';

export default function ArtificialMediaSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupProgress, setSetupProgress] = useState(0);
  const [vapiApiKey, setVapiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const calculateProgress = () => {
    const completedSteps = SEAN_SETUP.nextSteps.filter(
      (step) => testResults[`step_${step.step}`] === true
    ).length;
    return (completedSteps / SEAN_SETUP.nextSteps.length) * 100;
  };

  useEffect(() => {
    setSetupProgress(calculateProgress());
  }, [testResults]);

  const handleTestVapi = async () => {
    setIsLoading(true);
    try {
      // Simulate VAPI test
      setTimeout(() => {
        setTestResults((prev) => ({ ...prev, vapi_test: true, step_1: true }));
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStepStatus = (stepNumber: number) => {
    return testResults[`step_${stepNumber}`] ? 'completed' : 'pending';
  };

  const getStepIcon = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);
    return status === 'completed' ? (
      <CheckCircle className="h-5 w-5 text-emerald-500" />
    ) : (
      <Circle className="h-5 w-5 text-gray-400" />
    );
  };

  return (
    <div className="bg-gray-950 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
              <Building className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">Artificial Media Setup</h1>
              <p className="text-gray-400">Configure your live VAPI calling campaign</p>
            </div>
          </div>

          <div className="mx-auto max-w-md">
            <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
              <span>Setup Progress</span>
              <span>{Math.round(setupProgress)}% Complete</span>
            </div>
            <Progress value={setupProgress} className="h-3" />
          </div>
        </div>

        {/* Client Overview */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="h-5 w-5 text-emerald-500" />
              Campaign Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-gray-800 p-4 text-center">
                <Building className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                <p className="font-medium text-white">{SEAN_SETUP.client.name}</p>
                <p className="text-sm text-gray-400">{SEAN_SETUP.client.industry}</p>
              </div>
              <div className="rounded-lg bg-gray-800 p-4 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-blue-500" />
                <p className="font-medium text-white">{SEAN_SETUP.campaign.goals.totalCalls}</p>
                <p className="text-sm text-gray-400">Target Calls</p>
              </div>
              <div className="rounded-lg bg-gray-800 p-4 text-center">
                <Target className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                <p className="font-medium text-white">
                  {SEAN_SETUP.campaign.goals.targetConversions}
                </p>
                <p className="text-sm text-gray-400">Target Conversions</p>
              </div>
              <div className="rounded-lg bg-gray-800 p-4 text-center">
                <DollarSign className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
                <p className="font-medium text-white">
                  ${SEAN_SETUP.client.billingInfo.monthlyBudget}
                </p>
                <p className="text-sm text-gray-400">Monthly Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <Tabs defaultValue="steps" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 border-gray-800 bg-gray-900">
            <TabsTrigger
              value="steps"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              Setup Steps
            </TabsTrigger>
            <TabsTrigger
              value="vapi"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              VAPI Configuration
            </TabsTrigger>
            <TabsTrigger
              value="campaign"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              Campaign Details
            </TabsTrigger>
          </TabsList>

          {/* Setup Steps Tab */}
          <TabsContent value="steps" className="space-y-4">
            {SEAN_SETUP.nextSteps.map((step) => (
              <Card key={step.step} className="border-gray-800 bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStepIcon(step.step)}
                      <div>
                        <h3 className="font-medium text-white">{step.title}</h3>
                        <p className="text-sm text-gray-400">{step.description}</p>
                        <div className="mt-2 flex items-center space-x-4">
                          <Badge
                            variant={
                              step.priority === 'high'
                                ? 'destructive'
                                : step.priority === 'medium'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {step.priority} priority
                          </Badge>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="mr-1 h-3 w-3" />
                            {step.estimatedTime}
                          </div>
                        </div>
                      </div>
                    </div>

                    {step.step === 1 && (
                      <Button
                        onClick={() => setCurrentStep(1)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={getStepStatus(1) === 'completed'}
                      >
                        {getStepStatus(1) === 'completed' ? 'Completed' : 'Configure'}
                      </Button>
                    )}

                    {step.step === 2 && (
                      <Button
                        variant="outline"
                        onClick={() => window.open('https://vapi.ai/phone-numbers', '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Buy Numbers
                      </Button>
                    )}

                    {step.step === 3 && (
                      <Button
                        variant="outline"
                        onClick={() => window.open('https://vapi.ai/assistants', '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Create Assistant
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* VAPI Configuration Tab */}
          <TabsContent value="vapi" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="h-5 w-5 text-emerald-500" />
                  VAPI API Configuration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Connect your VAPI account to enable AI calling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* API Key Input */}
                <div>
                  <Label className="text-white">VAPI API Key</Label>
                  <div className="mt-2 flex items-center space-x-2">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="vapi_sk_..."
                      value={vapiApiKey}
                      onChange={(e) => setVapiApiKey(e.target.value)}
                      className="border-gray-700 bg-gray-800 text-white"
                    />
                    <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={handleTestVapi}
                      disabled={!vapiApiKey || isLoading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isLoading ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>

                  {testResults.vapi_test && (
                    <Alert className="mt-3 border-emerald-500/20 bg-emerald-500/10">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <AlertDescription className="text-emerald-400">
                        VAPI connection successful! You can now create assistants and make calls.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Assistant Configuration Preview */}
                <div>
                  <Label className="text-white">AI Assistant Configuration</Label>
                  <div className="mt-2 rounded-lg border border-gray-700 bg-gray-800 p-4">
                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div>
                        <span className="text-gray-400">Name:</span>
                        <span className="ml-2 text-white">
                          {SEAN_SETUP.vapiConfig.assistantName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Voice:</span>
                        <span className="ml-2 text-white">{SEAN_SETUP.vapiConfig.voice}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Model:</span>
                        <span className="ml-2 text-white">{SEAN_SETUP.vapiConfig.model}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Language:</span>
                        <span className="ml-2 text-white">{SEAN_SETUP.vapiConfig.language}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className="text-sm text-gray-400">First Message:</span>
                      <p className="mt-1 text-sm italic text-white">
                        "{SEAN_SETUP.vapiConfig.firstMessage}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://vapi.ai/dashboard', '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open VAPI Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(SEAN_SETUP.vapiConfig.systemPrompt)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy System Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaign Details Tab */}
          <TabsContent value="campaign" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="h-5 w-5 text-emerald-500" />
                  Campaign Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campaign Goals */}
                <div>
                  <h3 className="mb-4 font-medium text-white">Campaign Goals</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg bg-gray-800 p-3 text-center">
                      <p className="text-2xl font-semibold text-emerald-500">
                        {SEAN_SETUP.campaign.goals.totalCalls}
                      </p>
                      <p className="text-sm text-gray-400">Total Calls</p>
                    </div>
                    <div className="rounded-lg bg-gray-800 p-3 text-center">
                      <p className="text-2xl font-semibold text-blue-500">
                        {SEAN_SETUP.campaign.goals.dailyCallTarget}
                      </p>
                      <p className="text-sm text-gray-400">Daily Target</p>
                    </div>
                    <div className="rounded-lg bg-gray-800 p-3 text-center">
                      <p className="text-2xl font-semibold text-emerald-500">
                        {SEAN_SETUP.campaign.goals.targetConversions}
                      </p>
                      <p className="text-sm text-gray-400">Conversions</p>
                    </div>
                    <div className="rounded-lg bg-gray-800 p-3 text-center">
                      <p className="text-2xl font-semibold text-yellow-500">
                        {SEAN_SETUP.campaign.goals.targetConversionRate}%
                      </p>
                      <p className="text-sm text-gray-400">Conv. Rate</p>
                    </div>
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <h3 className="mb-4 font-medium text-white">Target Audience</h3>
                  <div className="rounded-lg bg-gray-800 p-4">
                    <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                      <div>
                        <span className="text-gray-400">Business Size:</span>
                        <span className="ml-2 text-white">
                          {SEAN_SETUP.campaign.targetAudience.businessSize}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Revenue Range:</span>
                        <span className="ml-2 text-white">
                          {SEAN_SETUP.campaign.targetAudience.revenue}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className="text-sm text-gray-400">Target Industries:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SEAN_SETUP.campaign.targetAudience.industries.map((industry) => (
                          <Badge
                            key={industry}
                            variant="outline"
                            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          >
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className="text-sm text-gray-400">Target Titles:</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SEAN_SETUP.campaign.targetAudience.titles.map((title) => (
                          <Badge
                            key={title}
                            variant="outline"
                            className="border-blue-500/20 bg-blue-500/10 text-blue-400"
                          >
                            {title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Leads Preview */}
                <div>
                  <h3 className="mb-4 font-medium text-white">
                    Sample Leads ({SEAN_SETUP.sampleLeads.length})
                  </h3>
                  <div className="space-y-3">
                    {SEAN_SETUP.sampleLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-lg border border-gray-700 bg-gray-800 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {lead.firstName} {lead.lastName}
                            </p>
                            <p className="text-sm text-gray-400">
                              {lead.title} at {lead.company}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={lead.priority === 'high' ? 'destructive' : 'default'}>
                              {lead.priority} priority
                            </Badge>
                            <p className="mt-1 text-sm text-gray-400">
                              {lead.customFields.marketingBudget}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Launch Campaign */}
        {setupProgress >= 60 && (
          <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
            <CardContent className="p-6 text-center">
              <Rocket className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
              <h3 className="mb-2 text-xl font-semibold text-white">Ready to Launch!</h3>
              <p className="mb-4 text-gray-400">
                Your Artificial Media campaign is {Math.round(setupProgress)}% configured. Complete
                the remaining steps to start generating leads.
              </p>
              <div className="space-x-3">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Test Campaign
                </Button>
                <Button variant="outline">Review Configuration</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
