import React, { useState } from 'react';
import { useAuth, useUser } from '../hooks/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus, Check, AlertCircle, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Use the API base URL from environment or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  organizationName: string;
  role: string;
  sendInvitation: boolean;
  password?: string;
}

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();

  // Check if we're in development mode
  // Mock data completely disabled - live data only
  const isDevelopment = false;
  const enableMockData = false;

  const [formData, setFormData] = useState<CreateUserData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    organizationName: '',
    role: 'platform_owner', // Only supported role currently
    sendInvitation: true,
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (field: keyof CreateUserData, value: string | boolean) => {
    if (field === 'sendInvitation') {
      setFormData((prev) => ({ ...prev, [field]: value === 'true' || value === true }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value as string }));
    }
  };

  const validateForm = (): boolean => {
    const required = ['firstName', 'lastName', 'email', 'organizationName'];
    const missing = required.filter((field) => !formData[field as keyof CreateUserData]);

    if (missing.length > 0) {
      toast({
        title: 'Validation Error',
        description: `Please fill in: ${missing.join(', ')}`,
        variant: 'destructive',
      });
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Get Clerk authentication token or use mock token in development
      let token: string | null = null;

      token = await getToken();

      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Submitting user data:', {
        ...formData,
        apiUrl: `${API_BASE_URL}/users`,
        hasToken: !!token,
      });

      // Submit to backend API with new structure
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber || null,
          role: formData.role,
          organizationName: formData.organizationName,
          createdBy: user?.id || 'dev-user',
          sendInvitation: formData.sendInvitation,
          password: !formData.sendInvitation ? formData.password : undefined,
        }),
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (!response.ok) {
        throw new Error(result.error || `Failed to create user (${response.status})`);
      }

      setSubmitStatus('success');
      toast({
        title: 'User Created Successfully!',
        description: formData.sendInvitation
          ? `${formData.firstName} ${formData.lastName} has been added and will receive an invitation email`
          : `${formData.firstName} ${formData.lastName} has been added with the provided password`,
        variant: 'default',
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        organizationName: '',
        role: 'platform_owner',
        sendInvitation: true,
        password: '',
      });

      // Show success for 2 seconds, then redirect
      setTimeout(() => {
        navigate('/user-management');
      }, 2000);
    } catch (error) {
      console.error('Error creating user:', error);
      setSubmitStatus('error');
      toast({
        title: 'Error Creating User',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/user-management')}
            className="text-green-400 hover:bg-green-400/10 hover:text-green-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User Management
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
            <UserPlus className="h-8 w-8 text-green-400" />
            Add New User
          </h1>
          <p className="mt-2 text-gray-400">Create a new user account for the platform</p>
        </div>

        {/* Success/Error Status */}
        {submitStatus === 'success' && (
          <Card className="mb-6 border-green-400/30 bg-green-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-green-400">
                <Check className="h-5 w-5" />
                <span className="font-medium">User created successfully! Redirecting...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {submitStatus === 'error' && (
          <Card className="mb-6 border-red-400/30 bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Failed to create user. Please try again.</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card className="border-gray-700 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <UserPlus className="h-5 w-5 text-green-400" />
              User Information
            </CardTitle>
            <CardDescription className="text-gray-400">
              Fill in the details below to create a new user account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="border-gray-600 bg-gray-800 text-white"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="border-gray-600 bg-gray-800 text-white"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="border-gray-600 bg-gray-800 text-white"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-white">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="border-gray-600 bg-gray-800 text-white"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName" className="text-white">
                  Organization Name *
                </Label>
                <Input
                  id="organizationName"
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange('organizationName', e.target.value)}
                  className="border-gray-600 bg-gray-800 text-white"
                  placeholder="Organization name"
                  required
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-white">
                  Role *
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger className="border-gray-600 bg-gray-800 text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-600 bg-gray-800">
                    <SelectItem value="platform_owner">Platform Owner</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-gray-400">
                  Note: Currently only Platform Owner role is supported. Additional roles can be
                  configured in the database.
                </p>
              </div>

              {/* Invitation Options */}
              <div className="space-y-4 border-t border-gray-700 pt-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Mail className="h-5 w-5 text-green-400" />
                  Invitation Options
                </h3>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendInvitation"
                    checked={formData.sendInvitation}
                    onCheckedChange={(checked) =>
                      handleInputChange('sendInvitation', checked.toString())
                    }
                    className="border-gray-600 data-[state=checked]:bg-green-600"
                  />
                  <Label
                    htmlFor="sendInvitation"
                    className="text-sm font-medium leading-none text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Send invitation email to set up password
                  </Label>
                </div>

                {!formData.sendInvitation && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center gap-2 text-white">
                      <Lock className="h-4 w-4" />
                      Initial Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password || ''}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="border-gray-600 bg-gray-800 text-white"
                      placeholder="Enter initial password"
                      required={!formData.sendInvitation}
                    />
                    <p className="text-xs text-gray-400">
                      If you don't send an invitation, you must set an initial password for the
                      user.
                    </p>
                  </div>
                )}

                {formData.sendInvitation && (
                  <p className="text-sm text-gray-400">
                    The user will receive an email with instructions to set up their password and
                    complete their account setup.
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[150px] bg-green-600 px-8 py-2 text-white hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Create User
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddUser;
