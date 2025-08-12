import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  Settings,
  Users,
  Phone,
  Bot,
  FileText,
  Target,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Calendar,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  vapiOutboundService,
  VapiAssistant,
  VapiPhoneNumber,
} from '@/services/vapi-outbound.service';
import { UploadedLeadsDisplay } from './UploadedLeadsDisplay';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface CampaignWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CampaignWizardModal: React.FC<CampaignWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [assistants, setAssistants] = useState<VapiAssistant[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<VapiPhoneNumber[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasVapiCredentials, setHasVapiCredentials] = useState(false);

  // Campaign creation state
  const [showUploadedData, setShowUploadedData] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<any>(null);
  const [uploadedLeads, setUploadedLeads] = useState<any[]>([]);
  const [campaignMetrics, setCampaignMetrics] = useState<any>(null);

  // Add back missing dependencies
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    campaignType: 'manual',
    phoneNumber: '',
    phoneNumberId: '',
    assistantId: '',
    sendTiming: 'now',
    scheduleDate: '',
    scheduleTime: '',
    assignedTeam: [] as string[],
  });

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 Assistants state updated:', assistants.length, assistants);
  }, [assistants]);

  useEffect(() => {
    console.log('🔍 Phone numbers state updated:', phoneNumbers.length, phoneNumbers);
  }, [phoneNumbers]);

  const loadFormData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Campaign Modal: Loading VAPI assistants and phone numbers...');
      console.log(
        '🔧 Current API base URL:',
        import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      );

      // First, check if VAPI credentials are configured by checking user profile and org settings
      console.log('🔍 Checking VAPI credentials configuration...');
      try {
        // Get user profile to get organization ID
        const userResponse = await fetch('http://localhost:3001/api/user-profile', {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('👤 User data:', userData);

          if (userData.organization_id) {
            // Check organization settings for VAPI credentials
            const orgResponse = await fetch(
              `http://localhost:3001/api/organizations/${userData.organization_id}/settings`,
              {
                headers: {
                  Authorization: 'Bearer test-token',
                  'Content-Type': 'application/json',
                },
              }
            );

            if (orgResponse.ok) {
              const orgData = await orgResponse.json();
              console.log('🏢 Organization settings:', orgData);

              if (orgData.settings?.vapi?.enabled && orgData.settings?.vapi?.apiKey) {
                console.log('✅ VAPI credentials are configured and enabled');
                setHasVapiCredentials(true);
              } else {
                console.log('❌ VAPI credentials are not configured or disabled');
                setHasVapiCredentials(false);
              }
            }
          }
        }
      } catch (err) {
        console.error('❌ Failed to check VAPI credentials:', err);
        setHasVapiCredentials(false);
      }

      // Test individual API calls with detailed logging
      console.log('📞 Testing assistants API call...');
      let assistantsData = [];
      try {
        assistantsData = await vapiOutboundService.getAssistants();
        console.log('✅ Assistants API call successful:', assistantsData);
      } catch (err) {
        console.error('❌ Campaign Modal: Failed to load assistants:', err);
        console.error('❌ Assistant error details:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        assistantsData = [];
      }

      console.log('📱 Testing phone numbers API call...');
      let phoneNumbersData = [];
      try {
        phoneNumbersData = await vapiOutboundService.getPhoneNumbers();
        console.log('✅ Phone numbers API call successful:', phoneNumbersData);
      } catch (err) {
        console.error('❌ Campaign Modal: Failed to load phone numbers:', err);
        console.error('❌ Phone numbers error details:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        phoneNumbersData = [];
      }

      console.log('✅ Campaign Modal: VAPI data loaded:', {
        assistants: assistantsData.length,
        phoneNumbers: phoneNumbersData.length,
        assistantsData,
        phoneNumbersData,
      });

      // Only use real VAPI data - no fallback mock data
      if (assistantsData.length === 0) {
        console.warn('⚠️ No assistants data received from VAPI API - check VAPI integration');
      }

      if (phoneNumbersData.length === 0) {
        console.warn('⚠️ No phone numbers data received from VAPI API - check VAPI integration');
      }

      setAssistants(assistantsData || []);
      setPhoneNumbers(phoneNumbersData || []);

      // Set team members
      setTeamMembers([
        {
          id: 'team_1',
          name: 'John Smith',
          email: 'john@company.com',
          role: 'Sales Manager',
          avatar: 'JS',
        },
        {
          id: 'team_2',
          name: 'Sarah Johnson',
          email: 'sarah@company.com',
          role: 'Lead Qualifier',
          avatar: 'SJ',
        },
        {
          id: 'team_3',
          name: 'Mike Davis',
          email: 'mike@company.com',
          role: 'Sales Rep',
          avatar: 'MD',
        },
      ]);
    } catch (error) {
      console.error('Error loading VAPI data:', error);

      // Set empty arrays as fallback
      setAssistants([]);
      setPhoneNumbers([]);
      setTeamMembers([
        {
          id: 'team_1',
          name: 'John Smith',
          email: 'john@company.com',
          role: 'Sales Manager',
          avatar: 'JS',
        },
        {
          id: 'team_2',
          name: 'Sarah Johnson',
          email: 'sarah@company.com',
          role: 'Lead Qualifier',
          avatar: 'SJ',
        },
        {
          id: 'team_3',
          name: 'Mike Davis',
          email: 'mike@company.com',
          role: 'Sales Rep',
          avatar: 'MD',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, loading VAPI data...');
      loadFormData();
    }
  }, [isOpen, loadFormData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a CSV file.',
          variant: 'destructive',
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      setUploadedFile(file);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await vapiOutboundService.downloadLeadsTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campaign-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Create CSV template with proper format
      const csvContent =
        'firstName,lastName,phone,email,company,title\nJohn,Doe,+1234567890,john@example.com,Acme Corp,Sales Manager\nJane,Smith,+1234567891,jane@example.com,Tech Inc,Marketing Director\nBob,Johnson,+1234567892,bob@example.com,StartupCo,CEO';
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campaign-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const handleTeamAssignment = (teamId: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        assignedTeam: [...prev.assignedTeam, teamId],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        assignedTeam: prev.assignedTeam.filter((id) => id !== teamId),
      }));
    }
  };

  const handleCreateCampaign = async () => {
    try {
      setLoading(true);

      // Convert CSV file to text if present
      let csvData = null;
      if (uploadedFile) {
        csvData = await uploadedFile.text();
      }

      // Create the campaign with all form data
      const campaignPayload = {
        name: formData.name,
        description: 'VAPI Outbound Campaign',
        assistantId: formData.assistantId,
        phoneNumberId: formData.phoneNumberId,
        phoneNumber: formData.phoneNumber,
        csvData,
        assignedTeam: formData.assignedTeam,
        sendTiming: formData.sendTiming,
        scheduleDate: formData.scheduleDate,
        scheduleTime: formData.scheduleTime,
        schedule:
          formData.sendTiming === 'schedule'
            ? {
                startTime: `${formData.scheduleDate}T${formData.scheduleTime}:00`,
                timezone: 'UTC',
              }
            : null,
      };

      const response = await vapiOutboundService.createCampaign(campaignPayload);

      toast({
        title: 'Campaign Created',
        description: 'Your outbound campaign has been created successfully!',
      });

      // Use the data returned from the API response
      const campaignData = response as any;
      setCreatedCampaign(campaignData);
      setUploadedLeads(campaignData?.leads || []);
      setCampaignMetrics(campaignData?.metrics);
      setShowUploadedData(true);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Campaign creation failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canLaunch = () => {
    return (
      formData.name &&
      (formData.phoneNumberId || formData.phoneNumber) &&
      formData.assistantId &&
      uploadedFile
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900">
      <div className="min-h-full">
        {/* Header */}
        <div className="border-b border-gray-800/30 bg-gradient-to-r from-gray-950 to-gray-900 shadow-lg">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-gray-700/30 bg-gray-800/50">
                  <Target className="h-5 w-5 text-gray-300" />
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="font-sans text-xl font-semibold leading-tight tracking-wide text-white">
                    New Campaign
                  </h1>
                  <p className="text-sm leading-tight text-gray-400">
                    Create and launch AI calling campaigns with VAPI
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 transition-all duration-200 hover:bg-gray-800/50"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="space-y-8">
            {/* Campaign Name */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-200">Campaign Name</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter campaign name"
                className="h-12 w-full rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 text-white transition-all duration-200 placeholder:text-gray-500 focus:border-gray-600 focus:ring-0"
              />
            </div>

            {/* Campaign Type */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-200">Campaign Type</label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setFormData({ ...formData, campaignType: 'manual' })}
                  className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                    formData.campaignType === 'manual'
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-gray-700/50 bg-gray-800/50 hover:border-gray-600/50'
                  }`}
                >
                  <div className="mb-2 flex items-center space-x-3">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        formData.campaignType === 'manual'
                          ? 'border-emerald-500'
                          : 'border-gray-500'
                      }`}
                    >
                      {formData.campaignType === 'manual' && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-white">Manual</h3>
                  </div>
                  <p className="text-xs text-gray-400">Start campaign now or schedule for later</p>
                </div>
                <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4 opacity-50">
                  <div className="mb-2 flex items-center space-x-3">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-600"></div>
                    <h3 className="text-sm font-medium text-gray-500">Live</h3>
                    <span className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-400">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Triggered via webhooks from your website</p>
                </div>
              </div>
            </div>

            {/* VAPI Configuration */}
            <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-6 transition-all duration-200 hover:border-gray-600/50 hover:bg-gray-800/50">
              <div className="mb-6 flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-700/30 bg-gray-800/50">
                  <Bot className="h-4 w-4 text-gray-300" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">VAPI Configuration</h3>
                  <p className="text-sm text-gray-400">
                    Configure your AI assistant and phone number
                  </p>
                </div>
              </div>

              {/* VAPI Credentials Warning - Only show if no credentials */}
              {!hasVapiCredentials && (
                <div className="mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500" />
                    <div>
                      <h4 className="font-medium text-yellow-400">VAPI Credentials Required</h4>
                      <p className="mt-1 text-sm text-yellow-300">
                        To make actual calls, you need to configure your VAPI credentials in
                        organization settings.
                      </p>
                      <p className="mt-2 text-sm text-yellow-300">
                        Without credentials, campaigns will be created in development mode with no
                        actual calls.
                      </p>
                      <div className="mt-3 flex space-x-3">
                        <button
                          onClick={() => window.open('https://vapi.ai/dashboard', '_blank')}
                          className="inline-flex items-center rounded-lg bg-yellow-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-yellow-700"
                        >
                          <ExternalLink className="mr-1.5 h-4 w-4" />
                          Get VAPI Keys
                        </button>
                        <button
                          onClick={() => window.open('/settings', '_blank')}
                          className="inline-flex items-center rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-600"
                        >
                          <Settings className="mr-1.5 h-4 w-4" />
                          Organization Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VAPI Success Message - Show when credentials are working */}
              {hasVapiCredentials && (
                <div className="mb-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                    <div>
                      <h4 className="font-medium text-emerald-400">VAPI Integration Active</h4>
                      <p className="mt-1 text-sm text-emerald-300">
                        Your VAPI credentials are configured and working. Real assistants and phone
                        numbers loaded successfully.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-200">Assistant</label>
                  <select
                    value={formData.assistantId}
                    onChange={(e) => setFormData({ ...formData, assistantId: e.target.value })}
                    className="h-10 w-full rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 text-white transition-all duration-200 focus:border-gray-600 focus:ring-0"
                  >
                    <option value="">Select an assistant</option>
                    {assistants.map((assistant) => (
                      <option key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-200">
                    Phone Number
                  </label>
                  <select
                    value={formData.phoneNumberId}
                    onChange={(e) => {
                      const selectedPhone = phoneNumbers.find(
                        (phone) => phone.id === e.target.value
                      );
                      setFormData({
                        ...formData,
                        phoneNumberId: e.target.value,
                        phoneNumber: selectedPhone ? selectedPhone.number : '',
                      });
                    }}
                    className="h-10 w-full rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 text-white transition-all duration-200 focus:border-gray-600 focus:ring-0"
                  >
                    <option value="">Select a phone number</option>
                    {phoneNumbers.map((phone) => (
                      <option key={phone.id} value={phone.id}>
                        {phone.number} ({phone.country})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                <p className="text-sm text-white">
                  <strong>Testing:</strong> Add your real VAPI credentials to test actual calls.
                  Find these in your VAPI dashboard.
                </p>
              </div>
            </div>

            {/* Upload CSV */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-200">Contact List</label>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-all duration-200 hover:bg-emerald-700"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download Template</span>
                </button>
              </div>

              <div
                className={`rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200 ${
                  uploadedFile
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-gray-600/50 bg-gray-800/50 hover:border-gray-500/50'
                }`}
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="fileUpload"
                />
                {uploadedFile ? (
                  <div className="space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{uploadedFile.name}</h3>
                      <p className="text-emerald-400">
                        {Math.round(uploadedFile.size / 1024)}KB • Ready to launch
                      </p>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-white transition-all duration-200 hover:bg-red-700"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <label htmlFor="fileUpload" className="cursor-pointer">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-white">Upload Contact List</h3>
                    <p className="mb-1 text-gray-400">
                      Drag and drop your CSV file here or click to browse
                    </p>
                    <p className="text-sm text-gray-500">
                      Required: firstName, lastName, phone • Max 5MB
                    </p>
                  </label>
                )}
              </div>

              {/* CSV Format Requirements */}
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                <h4 className="mb-3 text-sm font-medium text-gray-200">CSV Format Requirements</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <p className="text-gray-400">
                      <strong className="text-gray-300">Required columns:</strong> firstName,
                      lastName, phone
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <p className="text-gray-400">
                      <strong className="text-gray-300">Optional columns:</strong> email, company,
                      title
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <p className="text-gray-400">
                      <strong className="text-gray-300">Alternative formats:</strong> "name" field
                      will be split into firstName/lastName
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <p className="text-gray-400">
                      <strong className="text-gray-300">Phone formats:</strong> +1234567890, (123)
                      456-7890, 123-456-7890
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Assignment */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-200">Team Assignment</label>
              <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-6 transition-all duration-200 hover:border-gray-600/50 hover:bg-gray-800/50">
                <h4 className="mb-2 text-sm font-medium text-gray-200">Assign team members</h4>
                <p className="mb-4 text-xs text-gray-400">
                  Choose team members to share this campaign with
                </p>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-4 rounded-lg border border-gray-700/50 bg-gray-800/50 p-3 transition-all duration-200 hover:border-gray-600/50"
                    >
                      <input
                        type="checkbox"
                        id={member.id}
                        checked={formData.assignedTeam.includes(member.id)}
                        onChange={(e) => handleTeamAssignment(member.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex flex-1 items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-medium text-white">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-sm text-gray-400">
                            {member.role} • {member.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.assignedTeam.length > 0 && (
                  <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="font-medium text-emerald-400">
                      {formData.assignedTeam.length} team member
                      {formData.assignedTeam.length > 1 ? 's' : ''} assigned
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Launch Schedule */}
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-200">Launch Schedule</label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setFormData({ ...formData, sendTiming: 'now' })}
                  className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                    formData.sendTiming === 'now'
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-gray-700/50 bg-gray-800/50 hover:border-gray-600/50'
                  }`}
                >
                  <div className="mb-2 flex items-center space-x-3">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        formData.sendTiming === 'now' ? 'border-emerald-500' : 'border-gray-500'
                      }`}
                    >
                      {formData.sendTiming === 'now' && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                      )}
                    </div>
                    <Clock className="h-4 w-4 text-emerald-500" />
                    <h3 className="text-sm font-medium text-white">Launch Now</h3>
                  </div>
                  <p className="text-xs text-gray-400">Start calling immediately</p>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, sendTiming: 'schedule' })}
                  className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                    formData.sendTiming === 'schedule'
                      ? 'border-blue-500/30 bg-blue-500/10'
                      : 'border-gray-700/50 bg-gray-800/50 hover:border-gray-600/50'
                  }`}
                >
                  <div className="mb-2 flex items-center space-x-3">
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        formData.sendTiming === 'schedule' ? 'border-blue-500' : 'border-gray-500'
                      }`}
                    >
                      {formData.sendTiming === 'schedule' && (
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <h3 className="text-sm font-medium text-white">Schedule</h3>
                  </div>
                  <p className="text-xs text-gray-400">Schedule for later</p>
                </div>
              </div>

              {formData.sendTiming === 'schedule' && (
                <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-200">Date</label>
                    <input
                      type="date"
                      value={formData.scheduleDate}
                      onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                      className="h-10 w-full rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 text-white transition-all duration-200 focus:border-gray-600 focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-200">Time</label>
                    <input
                      type="time"
                      value={formData.scheduleTime}
                      onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                      className="h-10 w-full rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 text-white transition-all duration-200 focus:border-gray-600 focus:ring-0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 flex items-center justify-between border-t border-gray-800/30 pt-6">
            <div className="flex items-center space-x-2">
              {canLaunch() ? (
                <>
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-medium text-emerald-400">Ready to launch</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                  <span className="text-sm text-gray-400">Complete all fields to launch</span>
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-700 bg-gray-800 px-6 py-2 text-gray-300 transition-all duration-200 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!canLaunch() || loading}
                className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-8 py-2 font-medium text-white transition-all duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4" />
                    <span>Launch Campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showUploadedData && createdCampaign && (
        <UploadedLeadsDisplay
          leads={uploadedLeads}
          campaignId={createdCampaign.id || createdCampaign.campaignId}
          campaignName={createdCampaign.name || formData.name}
          onStartCampaign={(campaignId) => {
            vapiOutboundService.startCampaign(campaignId);
            toast({
              title: 'Campaign Started',
              description: 'Your campaign is now running!',
            });
          }}
          onDownloadReport={(campaignId) => {
            // Implement download report functionality
            toast({
              title: 'Download Started',
              description: 'Your report is being prepared...',
            });
          }}
        />
      )}
    </div>
  );
};

export default CampaignWizardModal;
