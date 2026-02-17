import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/auth';
import {
    ArrowLeft,
    ArrowRight,
    Building,
    CheckCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Info,
    Mail,
    Phone,
    Plus,
    Save,
    Sparkles,
    Trash2,
    User,
    Users,
    X
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

interface OrganizationData {
  // Step 1: Organization Details
  businessName: string;
  email: string;
  country: string;
  website?: string;
  industry?: string;

  // Step 2: Admin User
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone?: string;

  // Step 3: Team Setup
  teamSize: '0-5' | '6-9' | '10+' | '';
  addTeamMembers: boolean;
  teamMembers: TeamMember[];



  // Meta
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

const STEPS = [
  { id: 1, name: 'Organization', icon: Building },
  { id: 2, name: 'Admin User', icon: User },
  { id: 3, name: 'Team Setup', icon: Users },
  { id: 4, name: 'Review & Submit', icon: CheckCircle2 },
];

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
];

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Real Estate',
  'Marketing & Advertising',
  'Consulting',
  'E-commerce',
  'Manufacturing',
  'Education',
  'Legal',
  'Insurance',
  'Telecommunications',
  'Media & Entertainment',
  'Non-profit',
  'Other',
];

const TEAM_ROLES = [
  { id: 'admin', name: 'Admin', description: 'Full access to all features and settings' },
  { id: 'user', name: 'User', description: 'Can create and manage campaigns' },
  { id: 'viewer', name: 'Viewer', description: 'Read-only access to campaigns and reports' },
];

export default function OrganizationSetupWizard() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showProviderKeys, setShowProviderKeys] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupResult, setSetupResult] = useState<{
    success: boolean;
    organizationId?: string;
    organizationName?: string;
    adminEmail?: string;
    teamMembersCreated?: number;
    providerStatus?: any;
    nextSteps?: any;
    message?: string;
    error?: string;
    details?: string;
  } | null>(null);

  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    businessName: '',
    email: '',
    country: '',
    website: '',
    industry: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPhone: '',
    teamSize: '',
    addTeamMembers: false,
    teamMembers: [],
    isDraft: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const progressPercentage = (currentStep / STEPS.length) * 100;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!organizationData.businessName.trim())
          newErrors.businessName = 'Business name is required';
        if (!organizationData.email.trim()) newErrors.email = 'Email is required';
        if (!organizationData.email.includes('@'))
          newErrors.email = 'Please enter a valid email address';
        if (!organizationData.country) newErrors.country = 'Please select a country';
        break;
      case 2:
        if (!organizationData.adminFirstName.trim())
          newErrors.adminFirstName = 'First name is required';
        if (!organizationData.adminLastName.trim())
          newErrors.adminLastName = 'Last name is required';
        if (!organizationData.adminEmail.trim()) newErrors.adminEmail = 'Admin email is required';
        if (!organizationData.adminEmail.includes('@'))
          newErrors.adminEmail = 'Please enter a valid email address';
        break;
      case 3:
        if (!organizationData.teamSize) newErrors.teamSize = 'Please select team size';
        if (organizationData.addTeamMembers && organizationData.teamMembers.length === 0) {
          newErrors.teamMembers =
            'Please add at least one team member or disable team member addition';
        }
        // Validate team members
        organizationData.teamMembers.forEach((member, index) => {
          if (!member.firstName.trim())
            newErrors[`teamMember${index}FirstName`] = 'First name is required';
          if (!member.lastName.trim())
            newErrors[`teamMember${index}LastName`] = 'Last name is required';
          if (!member.email.trim()) newErrors[`teamMember${index}Email`] = 'Email is required';
          if (!member.email.includes('@'))
            newErrors[`teamMember${index}Email`] = 'Please enter a valid email';
          if (!member.role) newErrors[`teamMember${index}Role`] = 'Please select a role';
        });
        break;
      case 4:
        // Review step - all previous validations should pass
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
        setOrganizationData((prev) => ({ ...prev, updatedAt: new Date().toISOString() }));
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
    if (stepId < currentStep) {
      setCurrentStep(stepId);
      setErrors({});
    } else if (stepId === currentStep + 1) {
      handleNext();
    }
  };

  const updateOrganizationData = (updates: Partial<OrganizationData>) => {
    setOrganizationData((prev) => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: `member_${Date.now()}`,
      firstName: '',
      lastName: '',
      email: '',
      role: 'user',
    };
    updateOrganizationData({
      teamMembers: [...organizationData.teamMembers, newMember],
    });
  };

  const updateTeamMember = (index: number, updates: Partial<TeamMember>) => {
    const updatedMembers = [...organizationData.teamMembers];
    updatedMembers[index] = { ...updatedMembers[index], ...updates };
    updateOrganizationData({ teamMembers: updatedMembers });
  };

  const removeTeamMember = (index: number) => {
    const updatedMembers = organizationData.teamMembers.filter((_, i) => i !== index);
    updateOrganizationData({ teamMembers: updatedMembers });
  };

  const saveAsDraft = async () => {
    setIsLoading(true);
    try {
      const draftData = { ...organizationData, isDraft: true };
      localStorage.setItem('organizationDraft', JSON.stringify(draftData));
      alert('✅ Organization setup saved as draft!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('❌ Failed to save draft. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsLoading(true);

    try {
      // Get authentication token
      const token = await getToken();

      if (!token) {
        console.error('No authentication token received');
        throw new Error('Authentication required. Please sign in.');
      }

      // Prepare the data for submission
      const setupData = {
        // Step 1: Organization Details
        businessName: organizationData.businessName,
        email: organizationData.email,
        country: organizationData.country,
        website: organizationData.website,
        industry: organizationData.industry,

        // Step 2: Admin User
        adminFirstName: organizationData.adminFirstName,
        adminLastName: organizationData.adminLastName,
        adminEmail: organizationData.adminEmail,
        adminPhone: organizationData.adminPhone,
        useBusinessEmail: organizationData.adminEmail === organizationData.email,

        // Step 3: Team Setup
        teamSize: organizationData.teamSize,
        addTeamMembers: organizationData.addTeamMembers,
        teamMembers: organizationData.teamMembers,

      };

      // Submit to the backend API with proper authentication
      // All API calls go through Netlify Functions (relative paths)
      const apiUrl = '/api/organization-setup/setup';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(setupData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      // Store result for display
      setSetupResult(result);
      setSetupComplete(true); // Enable success screen

      // Clear sensitive data from state
      updateOrganizationData({
      });
    } catch (error) {
      console.error('Error completing setup:', error);

      setSetupResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete setup',
        details: 'If the problem persists, please contact support.',
      });
      setSetupComplete(true); // Enable error screen
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-medium text-white">Organization Details</h3>
              <p className="mb-6 text-sm text-gray-400">
                Tell us about your business to get started with the Trinity Labs AI Calling Platform
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Business Name *</Label>
                <Input
                  value={organizationData.businessName}
                  onChange={(e) => updateOrganizationData({ businessName: e.target.value })}
                  placeholder="e.g., Acme Marketing Agency"
                  className="border-gray-700 bg-gray-800 text-white"
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-400">{errors.businessName}</p>
                )}
              </div>

              <div>
                <Label className="text-gray-300">Business Email *</Label>
                <Input
                  type="email"
                  value={organizationData.email}
                  onChange={(e) => updateOrganizationData({ email: e.target.value })}
                  placeholder="contact@acmemarketing.com"
                  className="border-gray-700 bg-gray-800 text-white"
                />
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
              </div>

              <div>
                <Label className="text-gray-300">Country of Residence *</Label>
                <Select
                  value={organizationData.country}
                  onValueChange={(value) => updateOrganizationData({ country: value })}
                >
                  <SelectTrigger className="hover:bg-gray-750 border-gray-700 bg-gray-800 text-white transition-colors">
                    <SelectValue placeholder="Select your country">
                      {organizationData.country ? (
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {COUNTRIES.find((c) => c.code === organizationData.country)?.flag}
                          </span>
                          <span className="text-white">
                            {COUNTRIES.find((c) => c.code === organizationData.country)?.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Select your country</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto border-gray-700 bg-gray-800">
                    {COUNTRIES.map((country) => (
                      <SelectItem
                        key={country.code}
                        value={country.code}
                        className="cursor-pointer text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        <div className="flex items-center gap-3 py-1">
                          <span className="min-w-[24px] text-lg">{country.flag}</span>
                          <span className="text-white">{country.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && <p className="mt-1 text-sm text-red-400">{errors.country}</p>}
              </div>

              <div>
                <Label className="text-gray-300">Website (Optional)</Label>
                <Input
                  type="url"
                  value={organizationData.website}
                  onChange={(e) => updateOrganizationData({ website: e.target.value })}
                  placeholder="https://www.acmemarketing.com"
                  className="border-gray-700 bg-gray-800 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Industry (Optional)</Label>
                <Select
                  value={organizationData.industry}
                  onValueChange={(value) => updateOrganizationData({ industry: value })}
                >
                  <SelectTrigger className="hover:bg-gray-750 border-gray-700 bg-gray-800 text-white transition-colors">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto border-gray-700 bg-gray-800">
                    {INDUSTRIES.map((industry) => (
                      <SelectItem
                        key={industry}
                        value={industry}
                        className="cursor-pointer text-white hover:bg-gray-700 focus:bg-gray-700"
                      >
                        <span className="text-white">{industry}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Alert className="border-gray-700 bg-gray-800/50">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-gray-300">
                This information helps us customize your experience and ensure compliance with local
                regulations.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-medium text-white">Admin User Setup</h3>
              <p className="mb-6 text-sm text-gray-400">
                Create the primary administrator account for your organization
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-gray-300">First Name *</Label>
                  <Input
                    value={organizationData.adminFirstName}
                    onChange={(e) => updateOrganizationData({ adminFirstName: e.target.value })}
                    placeholder="John"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                  {errors.adminFirstName && (
                    <p className="mt-1 text-sm text-red-400">{errors.adminFirstName}</p>
                  )}
                </div>

                <div>
                  <Label className="text-gray-300">Last Name *</Label>
                  <Input
                    value={organizationData.adminLastName}
                    onChange={(e) => updateOrganizationData({ adminLastName: e.target.value })}
                    placeholder="Smith"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                  {errors.adminLastName && (
                    <p className="mt-1 text-sm text-red-400">{errors.adminLastName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Email Address *</Label>
                <Input
                  type="email"
                  value={organizationData.adminEmail}
                  onChange={(e) => updateOrganizationData({ adminEmail: e.target.value })}
                  placeholder="john.smith@acmemarketing.com"
                  className="border-gray-700 bg-gray-800 text-white"
                />
                {errors.adminEmail && (
                  <p className="mt-1 text-sm text-red-400">{errors.adminEmail}</p>
                )}
              </div>

              <div>
                <Label className="text-gray-300">Telephone Number (Optional)</Label>
                <Input
                  type="tel"
                  value={organizationData.adminPhone}
                  onChange={(e) => updateOrganizationData({ adminPhone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="border-gray-700 bg-gray-800 text-white"
                />
              </div>
            </div>

            <Alert className="border-gray-700 bg-gray-800/50">
              <User className="h-4 w-4 text-emerald-400" />
              <AlertDescription className="text-gray-300">
                The admin user will have full access to all platform features and will be able to
                manage other team members.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-medium text-white">Team Setup</h3>
              <p className="mb-6 text-sm text-gray-400">
                Configure your team size and add team members to your organization
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="mb-3 block text-gray-300">Team Size *</Label>
                <RadioGroup
                  value={organizationData.teamSize}
                  onValueChange={(value: '0-5' | '6-9' | '10+') =>
                    updateOrganizationData({ teamSize: value })
                  }
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 rounded-lg border border-gray-700 p-4">
                      <RadioGroupItem value="0-5" id="small" />
                      <Label htmlFor="small" className="flex-1 cursor-pointer">
                        <div className="font-medium text-white">0 - 5 members</div>
                        <p className="text-sm text-gray-400">Small team or startup</p>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border border-gray-700 p-4">
                      <RadioGroupItem value="6-9" id="medium" />
                      <Label htmlFor="medium" className="flex-1 cursor-pointer">
                        <div className="font-medium text-white">6 - 9 members</div>
                        <p className="text-sm text-gray-400">Growing team</p>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border border-gray-700 p-4">
                      <RadioGroupItem value="10+" id="large" />
                      <Label htmlFor="large" className="flex-1 cursor-pointer">
                        <div className="font-medium text-white">10+ members</div>
                        <p className="text-sm text-gray-400">Large team or enterprise</p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
                {errors.teamSize && <p className="mt-1 text-sm text-red-400">{errors.teamSize}</p>}
              </div>

              <Separator className="bg-gray-700" />

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <Label className="text-gray-300">Add Team Members (Optional)</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="addTeamMembers"
                      checked={organizationData.addTeamMembers}
                      onChange={(e) => updateOrganizationData({ addTeamMembers: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                    <Label htmlFor="addTeamMembers" className="cursor-pointer text-gray-300">
                      Enable team member setup
                    </Label>
                  </div>
                </div>

                {organizationData.addTeamMembers && (
                  <div className="space-y-4">
                    {organizationData.teamMembers.map((member, index) => (
                      <Card key={member.id} className="border-gray-700 bg-gray-800/50">
                        <CardContent className="p-4">
                          <div className="mb-4 flex items-center justify-between">
                            <h4 className="font-medium text-white">Team Member {index + 1}</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeTeamMember(index)}
                              className="border-red-600 text-red-400 hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <Label className="text-gray-300">First Name *</Label>
                              <Input
                                value={member.firstName}
                                onChange={(e) =>
                                  updateTeamMember(index, { firstName: e.target.value })
                                }
                                placeholder="Jane"
                                className="border-gray-600 bg-gray-700 text-white"
                              />
                              {errors[`teamMember${index}FirstName`] && (
                                <p className="mt-1 text-sm text-red-400">
                                  {errors[`teamMember${index}FirstName`]}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-300">Last Name *</Label>
                              <Input
                                value={member.lastName}
                                onChange={(e) =>
                                  updateTeamMember(index, { lastName: e.target.value })
                                }
                                placeholder="Doe"
                                className="border-gray-600 bg-gray-700 text-white"
                              />
                              {errors[`teamMember${index}LastName`] && (
                                <p className="mt-1 text-sm text-red-400">
                                  {errors[`teamMember${index}LastName`]}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-300">Email *</Label>
                              <Input
                                type="email"
                                value={member.email}
                                onChange={(e) => updateTeamMember(index, { email: e.target.value })}
                                placeholder="jane.doe@acmemarketing.com"
                                className="border-gray-600 bg-gray-700 text-white"
                              />
                              {errors[`teamMember${index}Email`] && (
                                <p className="mt-1 text-sm text-red-400">
                                  {errors[`teamMember${index}Email`]}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label className="text-gray-300">Role *</Label>
                              <Select
                                value={member.role}
                                onValueChange={(value: 'admin' | 'user' | 'viewer') =>
                                  updateTeamMember(index, { role: value })
                                }
                              >
                                <SelectTrigger className="hover:bg-gray-650 border-gray-600 bg-gray-700 text-white transition-colors">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="border-gray-600 bg-gray-700">
                                  {TEAM_ROLES.map((role) => (
                                    <SelectItem
                                      key={role.id}
                                      value={role.id}
                                      className="cursor-pointer text-white hover:bg-gray-600 focus:bg-gray-600"
                                    >
                                      <div className="py-1">
                                        <div className="font-medium text-white">{role.name}</div>
                                        <div className="text-xs text-gray-300">
                                          {role.description}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {errors[`teamMember${index}Role`] && (
                                <p className="mt-1 text-sm text-red-400">
                                  {errors[`teamMember${index}Role`]}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Button
                      variant="outline"
                      onClick={addTeamMember}
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Team Member
                    </Button>

                    {errors.teamMembers && (
                      <p className="text-sm text-red-400">{errors.teamMembers}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );


      
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-medium text-white">Review & Submit</h3>
              <p className="mb-6 text-sm text-gray-400">
                Please review all information before submitting. Once submitted, your organization
                and user accounts will be created.
              </p>
            </div>

            {/* Organization Summary */}
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Building className="h-5 w-5 text-emerald-500" />
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm text-gray-400">Business Name</Label>
                    <p className="font-medium text-white">{organizationData.businessName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Email</Label>
                    <p className="flex items-center gap-2 font-medium text-white">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {organizationData.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Country</Label>
                    <p className="flex items-center gap-2 font-medium text-white">
                      <span className="text-lg">
                        {COUNTRIES.find((c) => c.code === organizationData.country)?.flag}
                      </span>
                      {COUNTRIES.find((c) => c.code === organizationData.country)?.name ||
                        organizationData.country}
                    </p>
                  </div>
                  {organizationData.website && (
                    <div>
                      <Label className="text-sm text-gray-400">Website</Label>
                      <p className="font-medium text-white">{organizationData.website}</p>
                    </div>
                  )}
                  {organizationData.industry && (
                    <div>
                      <Label className="text-sm text-gray-400">Industry</Label>
                      <p className="font-medium text-white">{organizationData.industry}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Admin User Summary */}
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="h-5 w-5 text-blue-500" />
                  Administrator Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm text-gray-400">Full Name</Label>
                    <p className="font-medium text-white">
                      {organizationData.adminFirstName} {organizationData.adminLastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Email</Label>
                    <p className="flex items-center gap-2 font-medium text-white">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {organizationData.adminEmail}
                    </p>
                  </div>
                  {organizationData.adminPhone && (
                    <div>
                      <Label className="text-sm text-gray-400">Phone</Label>
                      <p className="flex items-center gap-2 font-medium text-white">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {organizationData.adminPhone}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-gray-400">Role</Label>
                    <Badge variant="secondary" className="bg-blue-900 text-blue-300">
                      Organization Administrator
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Summary */}
            <Card className="border-gray-700 bg-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="h-5 w-5 text-purple-500" />
                  Team Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm text-gray-400">Team Size</Label>
                    <p className="font-medium text-white">{organizationData.teamSize} members</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-400">Additional Team Members</Label>
                    <p className="font-medium text-white">
                      {organizationData.addTeamMembers
                        ? `${organizationData.teamMembers.length} added`
                        : 'None'}
                    </p>
                  </div>
                </div>

                {organizationData.addTeamMembers && organizationData.teamMembers.length > 0 && (
                  <div className="mt-4">
                    <Label className="mb-2 block text-sm text-gray-400">Team Members</Label>
                    <div className="space-y-2">
                      {organizationData.teamMembers.map((member, index) => (
                        <div key={member.id} className="rounded-lg bg-gray-700 p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-white">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-sm text-gray-400">{member.email}</p>
                            </div>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              {TEAM_ROLES.find((r) => r.id === member.role)?.name || member.role}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>



            {/* Summary Stats */}
            <Card className="border-emerald-700 bg-gradient-to-r from-emerald-900/20 to-blue-900/20">
              <CardContent className="p-6">
                <h4 className="mb-4 font-medium text-white">Setup Summary</h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">1</div>
                    <div className="text-sm text-gray-400">Organization</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {1 +
                        (organizationData.addTeamMembers ? organizationData.teamMembers.length : 0)}
                    </div>
                    <div className="text-sm text-gray-400">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {organizationData.teamSize}
                    </div>
                    <div className="text-sm text-gray-400">Team Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">✓</div>
                    <div className="text-sm text-gray-400">System Ready</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert className="border-blue-700 bg-blue-900/20">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <div className="space-y-2">
                  <p className="font-medium">What happens when you submit:</p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    <li>Your organization "{organizationData.businessName}" will be created</li>
                    <li>
                      Admin account for {organizationData.adminFirstName}{' '}
                      {organizationData.adminLastName} will be set up
                    </li>
                    {organizationData.addTeamMembers && organizationData.teamMembers.length > 0 && (
                      <li>
                        {organizationData.teamMembers.length} team member account(s) will be created
                      </li>
                    )}
                    <li>Voice integration will be activated for AI calling</li>
                    <li>You'll receive login credentials via email</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  // Validation helper

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return organizationData.businessName && organizationData.email && organizationData.country;
      case 2:
        return (
          organizationData.adminFirstName &&
          organizationData.adminLastName &&
          organizationData.adminEmail
        );
      case 3:
        return (
          organizationData.teamSize &&
          (!organizationData.addTeamMembers || organizationData.teamMembers.length > 0)
        );
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Success/Completion Screen
  if (setupComplete && setupResult) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
              {setupResult.success ? (
                <CheckCircle className="h-8 w-8 text-white" />
              ) : (
                <X className="h-8 w-8 text-white" />
              )}
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">
              {setupResult.success ? 'Setup Complete!' : 'Setup Failed'}
            </h1>
            <p className="text-gray-400">
              {setupResult.success
                ? 'Your organization has been created successfully'
                : 'There was an issue creating your organization'}
            </p>
          </div>

          {setupResult.success ? (
            <div className="space-y-6">
              {/* Success Message */}
              <Alert className="border-emerald-600 bg-emerald-900">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <AlertDescription className="text-emerald-100">
                  {setupResult.message}
                </AlertDescription>
              </Alert>

              {/* Organization Details */}
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Building className="h-5 w-5 text-emerald-500" />
                    Organization Created
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Organization Name</Label>
                      <p className="font-medium text-white">{setupResult.organizationName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Organization ID</Label>
                      <p className="font-mono text-sm text-white">{setupResult.organizationId}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Admin Email</Label>
                      <p className="text-white">{setupResult.adminEmail}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Team Members</Label>
                      <p className="text-white">{setupResult.teamMembersCreated || 0} created</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                        <span className="text-sm font-bold text-white">1</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Check Your Email</p>
                        <p className="text-sm text-gray-400">
                          {setupResult.nextSteps?.emailVerification}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                        <span className="text-sm font-bold text-white">2</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Team Setup</p>
                        <p className="text-sm text-gray-400">
                          {setupResult.nextSteps?.accountSetup}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500">
                        <span className="text-sm font-bold text-white">3</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Start Calling</p>
                        <p className="text-sm text-gray-400">
                          Voice Provider Status:{' '}
                          {setupResult.providerStatus?.connected
                            ? '✅ Ready'
                            : '⚠️ Needs Configuration'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => navigate('/organizations')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Building className="mr-2 h-4 w-4" />
                  View Organizations
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Error Message */}
              <Alert className="border-red-600 bg-red-900">
                <X className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-100">{setupResult.error}</AlertDescription>
              </Alert>

              {/* Error Details */}
              {setupResult.details && (
                <Card className="border-gray-700 bg-gray-800">
                  <CardContent className="pt-6">
                    <p className="text-gray-400">{setupResult.details}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => {
                    setSetupComplete(false);
                    setSetupResult(null);
                    setCurrentStep(1);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/organizations')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <Building className="mr-2 h-4 w-4" />
                  Back to Organizations
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-emerald-500" />
              <div>
                <h1 className="text-3xl font-bold text-white">Organization Setup</h1>
                <p className="text-gray-400">
                  Set up your organization on the Trinity Labs AI Calling Platform
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={saveAsDraft}
                disabled={isLoading}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/organizations')}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={progressPercentage} className="h-2 bg-gray-800" />
        </div>

        {/* Steps Navigation */}
        <div className="mb-8">
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
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-8">{renderStepContent()}</CardContent>

          {/* Navigation Buttons */}
          <div className="border-t border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button onClick={handleNext} className="bg-emerald-600 hover:bg-emerald-700">
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={completeSetup}
                  disabled={isLoading || !isStepValid()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                      Setting up Organization...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
