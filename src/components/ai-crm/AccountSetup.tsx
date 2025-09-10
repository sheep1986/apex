import React, { useState } from 'react';
import { 
  Key, 
  User, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface AccountSetupProps {
  onSetupComplete: (config: AccountConfig) => void;
  existingConfig?: Partial<AccountConfig>;
}

interface AccountConfig {
  vapiApiKey: string;
  organizationName: string;
}

interface VapiValidationResult {
  isValid: boolean;
  assistants: Array<{
    id: string;
    name: string;
    model: string;
    voice: string;
  }>;
  phoneNumbers: Array<{
    id: string;
    number: string;
    provider: string;
    active: boolean;
  }>;
  error?: string;
}

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (AZ)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AK)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HI)' }
];

export const AccountSetup: React.FC<AccountSetupProps> = ({ 
  onSetupComplete, 
  existingConfig 
}) => {
  const [config, setConfig] = useState<AccountConfig>({
    vapiApiKey: existingConfig?.vapiApiKey || '',
    organizationName: existingConfig?.organizationName || '',
    contactEmail: existingConfig?.contactEmail || '',
    phoneNumber: existingConfig?.phoneNumber || '',
    timezone: existingConfig?.timezone || 'America/New_York',
    complianceSettings: {
      callingHours: {
        start: existingConfig?.complianceSettings?.callingHours?.start || '09:00',
        end: existingConfig?.complianceSettings?.callingHours?.end || '17:00'
      },
      maxAttemptsPerLead: existingConfig?.complianceSettings?.maxAttemptsPerLead || 3,
      retryDelayHours: existingConfig?.complianceSettings?.retryDelayHours || 24,
      dncCheckEnabled: existingConfig?.complianceSettings?.dncCheckEnabled ?? true
    }
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<VapiValidationResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { title: 'Apex Configuration', description: 'Connect your Apex account' },
    { title: 'Organization Details', description: 'Basic information about your organization' },
    { title: 'Compliance Settings', description: 'Configure calling compliance rules' },
    { title: 'Verification', description: 'Verify your setup' }
  ];

  const validateVapiKey = async () => {
    if (!config.vapiApiKey) {
      setErrors({ vapiApiKey: 'Apex API key is required' });
      return;
    }

    setValidating(true);
    setErrors({});

    try {
      // For demo purposes, simulate validation success after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful validation response
      const mockResult = {
        isValid: true,
        assistants: [
          { id: '1', name: 'Sales Assistant' },
          { id: '2', name: 'Support Assistant' },
          { id: '3', name: 'Customer Service Assistant' }
        ],
        phoneNumbers: [
          { id: '1', number: '+1 (555) 123-4567' },
          { id: '2', number: '+1 (555) 987-6543' },
          { id: '3', number: '+1 (555) 456-7890' }
        ]
      };
      
      setValidationResult(mockResult);
      setCurrentStep(1);
    } catch (error) {
      setErrors({ vapiApiKey: 'Failed to validate API key' });
    } finally {
      setValidating(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!config.vapiApiKey) newErrors.vapiApiKey = 'Apex API key is required';
        break;
      case 1:
        if (!config.organizationName) newErrors.organizationName = 'Organization name is required';
        if (!config.contactEmail) newErrors.contactEmail = 'Contact email is required';
        if (!config.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
        break;
      case 2:
        if (!config.complianceSettings.callingHours.start) newErrors.startTime = 'Start time is required';
        if (!config.complianceSettings.callingHours.end) newErrors.endTime = 'End time is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 0) {
        validateVapiKey();
      } else {
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    if (validateStep(currentStep)) {
      try {
        const response = await fetch('/api/account/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });

        if (response.ok) {
          onSetupComplete(config);
        } else {
          const error = await response.json();
          setErrors({ general: error.message });
        }
      } catch (error) {
        setErrors({ general: 'Failed to save configuration' });
      }
    }
  };

  const updateConfig = (updates: Partial<AccountConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateComplianceSettings = (updates: Partial<AccountConfig['complianceSettings']>) => {
    setConfig(prev => ({
      ...prev,
      complianceSettings: { ...prev.complianceSettings, ...updates }
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card className="bg-gray-950/50 border-gray-800/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="w-5 h-5 text-amber-400" />
            Account Setup
          </CardTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
            </div>
            <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2 bg-gray-800" />
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <Card className="bg-gray-950/50 border-gray-800/50 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">{steps[currentStep].title}</CardTitle>
          <p className="text-sm text-gray-400">{steps[currentStep].description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Apex Configuration */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="bg-gray-900/50 border border-gray-800/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2 text-white">Get Your Apex API Key</h3>
                <p className="text-sm text-gray-400 mb-3">
                  You'll need an Apex API key to connect your voice AI capabilities.
                </p>
                <Button variant="outline" size="sm" asChild className="border-gray-700 text-gray-300 hover:text-white hover:border-amber-400">
                  <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Get Apex API Key
                  </a>
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vapiApiKey" className="text-gray-300">Apex API Key</Label>
                <div className="relative">
                  <Input
                    id="vapiApiKey"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Enter your Apex API key"
                    value={config.vapiApiKey}
                    onChange={(e) => updateConfig({ vapiApiKey: e.target.value })}
                    className={`bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 ${errors.vapiApiKey ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {errors.vapiApiKey && (
                  <p className="text-sm text-red-400">{errors.vapiApiKey}</p>
                )}
              </div>

              {validationResult && (
                <Alert className="border-green-500 bg-green-900/20 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Apex connection successful!</p>
                      <p className="text-sm">
                        Found {validationResult.assistants.length} assistants and {validationResult.phoneNumbers.length} phone numbers
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 1: Organization Details */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                  id="organizationName"
                  placeholder="Your Company Name"
                  value={config.organizationName}
                  onChange={(e) => updateConfig({ organizationName: e.target.value })}
                  className={errors.organizationName ? 'border-red-500' : ''}
                />
                {errors.organizationName && (
                  <p className="text-sm text-red-600">{errors.organizationName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@yourcompany.com"
                  value={config.contactEmail}
                  onChange={(e) => updateConfig({ contactEmail: e.target.value })}
                  className={errors.contactEmail ? 'border-red-500' : ''}
                />
                {errors.contactEmail && (
                  <p className="text-sm text-red-600">{errors.contactEmail}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+1 (555) 123-4567"
                  value={config.phoneNumber}
                  onChange={(e) => updateConfig({ phoneNumber: e.target.value })}
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={config.timezone}
                  onChange={(e) => updateConfig({ timezone: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Compliance Settings */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">TCPA Compliance</h3>
                <p className="text-sm text-gray-600">
                  Configure your calling compliance settings to ensure TCPA compliance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Calling Hours Start</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={config.complianceSettings.callingHours.start}
                    onChange={(e) => updateComplianceSettings({
                      callingHours: { ...config.complianceSettings.callingHours, start: e.target.value }
                    })}
                    className={errors.startTime ? 'border-red-500' : ''}
                  />
                  {errors.startTime && (
                    <p className="text-sm text-red-600">{errors.startTime}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">Calling Hours End</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={config.complianceSettings.callingHours.end}
                    onChange={(e) => updateComplianceSettings({
                      callingHours: { ...config.complianceSettings.callingHours, end: e.target.value }
                    })}
                    className={errors.endTime ? 'border-red-500' : ''}
                  />
                  {errors.endTime && (
                    <p className="text-sm text-red-600">{errors.endTime}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Attempts Per Lead</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    min="1"
                    max="10"
                    value={config.complianceSettings.maxAttemptsPerLead}
                    onChange={(e) => updateComplianceSettings({
                      maxAttemptsPerLead: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retryDelay">Retry Delay (Hours)</Label>
                  <Input
                    id="retryDelay"
                    type="number"
                    min="1"
                    max="168"
                    value={config.complianceSettings.retryDelayHours}
                    onChange={(e) => updateComplianceSettings({
                      retryDelayHours: parseInt(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dncCheck"
                    checked={config.complianceSettings.dncCheckEnabled}
                    onChange={(e) => updateComplianceSettings({
                      dncCheckEnabled: e.target.checked
                    })}
                  />
                  <Label htmlFor="dncCheck">Enable Do Not Call (DNC) Registry Check</Label>
                </div>
                <p className="text-sm text-gray-600">
                  Automatically check numbers against the DNC registry before calling.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Setup Complete!</h3>
                <p className="text-sm text-gray-600">
                  Review your configuration below and click "Complete Setup" to finish.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Organization</h4>
                  <p className="text-sm">{config.organizationName}</p>
                  <p className="text-sm text-gray-600">{config.contactEmail}</p>
                  <p className="text-sm text-gray-600">{config.phoneNumber}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Compliance</h4>
                  <p className="text-sm">
                    Calling Hours: {config.complianceSettings.callingHours.start} - {config.complianceSettings.callingHours.end}
                  </p>
                  <p className="text-sm">
                    Max Attempts: {config.complianceSettings.maxAttemptsPerLead}
                  </p>
                  <p className="text-sm">
                    Retry Delay: {config.complianceSettings.retryDelayHours} hours
                  </p>
                  <p className="text-sm">
                    DNC Check: {config.complianceSettings.dncCheckEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>

              {validationResult && (
                <div className="space-y-2">
                  <h4 className="font-medium">Apex Resources</h4>
                  <p className="text-sm">
                    {validationResult.assistants.length} assistants, {validationResult.phoneNumbers.length} phone numbers available
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {errors.general && (
            <Alert className="border-red-500">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="border-gray-700 text-gray-300 hover:text-white hover:border-amber-400"
            >
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={validating} className="bg-amber-600 hover:bg-amber-700 text-black">
                  {validating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Next'
                  )}
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-amber-600 hover:bg-amber-700 text-black">
                  Complete Setup
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};