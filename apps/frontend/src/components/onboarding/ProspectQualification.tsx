import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import {
  Users,
  Building,
  Phone,
  Mail,
  Globe,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  BarChart3,
} from 'lucide-react';
import { OnboardingData } from '../../pages/ClientOnboarding';
import { OnboardingService } from '../../services/onboarding-service';

interface ProspectQualificationProps {
  data: OnboardingData;
  onComplete: (data: any) => void;
  loading?: boolean;
}

const ProspectQualification: React.FC<ProspectQualificationProps> = ({
  data,
  onComplete,
  loading = false,
}) => {
  const [formData, setFormData] = useState(data.prospect);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qualification, setQualification] = useState<any>(null);

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Real Estate',
    'E-commerce',
    'Education',
    'Manufacturing',
    'Retail',
    'Professional Services',
    'Other',
  ];

  const painPoints = [
    'Manual calling is time-consuming',
    'Poor lead response times',
    'Difficulty scaling outreach',
    'Inconsistent call quality',
    'High cost per lead',
    'Need better automation',
    'Missing follow-up opportunities',
    'Low conversion rates',
  ];

  const goals = [
    'Increase call volume',
    'Improve response times',
    'Reduce costs',
    'Scale operations',
    'Better lead qualification',
    'Automate follow-ups',
    'Improve conversion rates',
    'Free up team time',
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleArrayChange = (field: 'painPoints' | 'goals', value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter((item) => item !== value),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.industry) newErrors.industry = 'Industry is required';
    if (!formData.employees) newErrors.employees = 'Company size is required';
    if (!formData.callVolume) newErrors.callVolume = 'Call volume is required';
    if (!formData.budget) newErrors.budget = 'Budget range is required';
    if (!formData.timeline) newErrors.timeline = 'Timeline is required';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.painPoints.length === 0) {
      newErrors.painPoints = 'Please select at least one pain point';
    }

    if (formData.goals.length === 0) {
      newErrors.goals = 'Please select at least one goal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleQualify = () => {
    if (validateForm()) {
      const qualificationResult = OnboardingService.qualifyProspect(formData);
      setQualification(qualificationResult);
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onComplete({
        prospect: formData,
        qualification,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Users className="mr-2 h-5 w-5" />
            Contact Information
          </CardTitle>
          <CardDescription>Basic contact details for the prospect</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="firstName" className="text-white">
              First Name *
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="border-gray-600 bg-gray-700 text-white"
              placeholder="John"
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>}
          </div>

          <div>
            <Label htmlFor="lastName" className="text-white">
              Last Name *
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="border-gray-600 bg-gray-700 text-white"
              placeholder="Smith"
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>}
          </div>

          <div>
            <Label htmlFor="email" className="text-white">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="border-gray-600 bg-gray-700 text-white"
              placeholder="john@company.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="phone" className="text-white">
              Phone *
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="border-gray-600 bg-gray-700 text-white"
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Building className="mr-2 h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>Details about the prospect's company</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="company" className="text-white">
              Company Name *
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="border-gray-600 bg-gray-700 text-white"
              placeholder="Acme Corporation"
            />
            {errors.company && <p className="mt-1 text-sm text-red-400">{errors.company}</p>}
          </div>

          <div>
            <Label htmlFor="website" className="text-white">
              Website
            </Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="border-gray-600 bg-gray-700 text-white"
              placeholder="https://company.com"
            />
          </div>

          <div>
            <Label htmlFor="industry" className="text-white">
              Industry *
            </Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => handleInputChange('industry', value)}
            >
              <SelectTrigger className="border-gray-600 bg-gray-700 text-white">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.industry && <p className="mt-1 text-sm text-red-400">{errors.industry}</p>}
          </div>

          <div>
            <Label htmlFor="employees" className="text-white">
              Company Size *
            </Label>
            <Select
              value={formData.employees}
              onValueChange={(value) => handleInputChange('employees', value)}
            >
              <SelectTrigger className="border-gray-600 bg-gray-700 text-white">
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10 employees</SelectItem>
                <SelectItem value="11-50">11-50 employees</SelectItem>
                <SelectItem value="51-200">51-200 employees</SelectItem>
                <SelectItem value="201-1000">201-1000 employees</SelectItem>
                <SelectItem value="1000+">1000+ employees</SelectItem>
              </SelectContent>
            </Select>
            {errors.employees && <p className="mt-1 text-sm text-red-400">{errors.employees}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Current Situation */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <TrendingUp className="mr-2 h-5 w-5" />
            Current Situation
          </CardTitle>
          <CardDescription>Understanding their current setup and needs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentSolution" className="text-white">
              Current Calling Solution
            </Label>
            <Textarea
              id="currentSolution"
              value={formData.currentSolution}
              onChange={(e) => handleInputChange('currentSolution', e.target.value)}
              className="border-gray-600 bg-gray-700 text-white"
              placeholder="Describe their current calling process..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="callVolume" className="text-white">
                Monthly Call Volume *
              </Label>
              <Select
                value={formData.callVolume}
                onValueChange={(value) => handleInputChange('callVolume', value)}
              >
                <SelectTrigger className="border-gray-600 bg-gray-700 text-white">
                  <SelectValue placeholder="Select volume" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-100">0-100 calls</SelectItem>
                  <SelectItem value="100-500">100-500 calls</SelectItem>
                  <SelectItem value="500-1000">500-1000 calls</SelectItem>
                  <SelectItem value="1000-5000">1000-5000 calls</SelectItem>
                  <SelectItem value="5000+">5000+ calls</SelectItem>
                </SelectContent>
              </Select>
              {errors.callVolume && (
                <p className="mt-1 text-sm text-red-400">{errors.callVolume}</p>
              )}
            </div>

            <div>
              <Label htmlFor="budget" className="text-white">
                Monthly Budget *
              </Label>
              <Select
                value={formData.budget}
                onValueChange={(value) => handleInputChange('budget', value)}
              >
                <SelectTrigger className="border-gray-600 bg-gray-700 text-white">
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$0-$500">$0-$500</SelectItem>
                  <SelectItem value="$500-$1000">$500-$1000</SelectItem>
                  <SelectItem value="$1000-$2500">$1000-$2500</SelectItem>
                  <SelectItem value="$2500-$5000">$2500-$5000</SelectItem>
                  <SelectItem value="$5000+">$5000+</SelectItem>
                </SelectContent>
              </Select>
              {errors.budget && <p className="mt-1 text-sm text-red-400">{errors.budget}</p>}
            </div>

            <div>
              <Label htmlFor="timeline" className="text-white">
                Implementation Timeline *
              </Label>
              <Select
                value={formData.timeline}
                onValueChange={(value) => handleInputChange('timeline', value)}
              >
                <SelectTrigger className="border-gray-600 bg-gray-700 text-white">
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Immediate">Immediate (ASAP)</SelectItem>
                  <SelectItem value="1 month">Within 1 month</SelectItem>
                  <SelectItem value="3 months">Within 3 months</SelectItem>
                  <SelectItem value="6 months">Within 6 months</SelectItem>
                  <SelectItem value="Exploring">Just exploring</SelectItem>
                </SelectContent>
              </Select>
              {errors.timeline && <p className="mt-1 text-sm text-red-400">{errors.timeline}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pain Points */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Target className="mr-2 h-5 w-5" />
            Pain Points & Goals
          </CardTitle>
          <CardDescription>
            What challenges are they facing and what do they want to achieve?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block text-white">Current Pain Points *</Label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {painPoints.map((point) => (
                <div key={point} className="flex items-center space-x-2">
                  <Checkbox
                    id={`pain-${point}`}
                    checked={formData.painPoints.includes(point)}
                    onCheckedChange={(checked) =>
                      handleArrayChange('painPoints', point, checked as boolean)
                    }
                  />
                  <Label htmlFor={`pain-${point}`} className="text-sm text-gray-300">
                    {point}
                  </Label>
                </div>
              ))}
            </div>
            {errors.painPoints && <p className="mt-1 text-sm text-red-400">{errors.painPoints}</p>}
          </div>

          <div>
            <Label className="mb-3 block text-white">Primary Goals *</Label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {goals.map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={`goal-${goal}`}
                    checked={formData.goals.includes(goal)}
                    onCheckedChange={(checked) =>
                      handleArrayChange('goals', goal, checked as boolean)
                    }
                  />
                  <Label htmlFor={`goal-${goal}`} className="text-sm text-gray-300">
                    {goal}
                  </Label>
                </div>
              ))}
            </div>
            {errors.goals && <p className="mt-1 text-sm text-red-400">{errors.goals}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Qualification Results */}
      {qualification && (
        <Card className="border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <BarChart3 className="mr-2 h-5 w-5" />
              Qualification Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-white">
                  Qualification Score: {qualification.score}/100
                </p>
                <p
                  className={`text-sm ${qualification.qualified ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {qualification.qualified ? '✅ Qualified Lead' : '❌ Needs Nurturing'}
                </p>
              </div>
              <Badge variant={qualification.qualified ? 'default' : 'destructive'}>
                Suggested Plan: {qualification.suggestedPlan}
              </Badge>
            </div>

            <div>
              <p className="mb-2 font-medium text-white">Recommendations:</p>
              <ul className="list-inside list-disc space-y-1">
                {qualification.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm text-gray-300">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <div>
          {!qualification && (
            <Button
              onClick={handleQualify}
              variant="outline"
              className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
            >
              Qualify Prospect
            </Button>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !qualification}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {loading ? 'Processing...' : 'Continue to Plan Selection'}
        </Button>
      </div>
    </div>
  );
};

export default ProspectQualification;
