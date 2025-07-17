import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/auth';
import { useNotificationStore } from '@/lib/notification-store';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  CreditCard,
  Bell,
  Globe,
  Mic,
  Phone,
  Key,
  Database,
  Webhook,
  Save,
  Download,
  Upload,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Activity,
  Target,
  Users,
  Zap,
  Palette,
  Languages,
  Clock,
  Mail,
  Lock,
  Monitor,
  Smartphone,
  Wifi,
  Cloud,
  Server,
  Terminal,
  Code,
  HardDrive,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import simpleApiClient from '@/lib/simple-api-client';
import VAPIDebugPanel from '../components/VAPIDebugPanel';

interface SettingsData {
  profile: {
    name: string;
    email: string;
    company: string;
    timezone: string;
    language: string;
  };
  notifications: {
    callAlerts: boolean;
    systemUpdates: boolean;
    performance: boolean;
    billing: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    ipWhitelist: string[];
  };
  integrations: {
    vapi: {
      apiKey: string;
      webhookUrl: string;
      enabled: boolean;
    };
    crm: {
      type: string;
      apiKey: string;
      syncEnabled: boolean;
    };
    analytics: {
      googleAnalytics: string;
      mixpanel: string;
      enabled: boolean;
    };
  };
  appearance: {
    theme: 'dark' | 'light' | 'auto';
    accentColor: string;
    compactMode: boolean;
  };
  voice: {
    defaultVoice: string;
    language: string;
    speed: number;
    pitch: number;
  };
}

export default function Settings() {
  const { preferences, updatePreferences } = useNotificationStore();
  const { toast } = useToast();
  const { getToken } = useAuth();

  const [showApiKey, setShowApiKey] = useState(false);
  const [showCrmKey, setShowCrmKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<SettingsData>({
    profile: {
      name: '',
      email: '',
      company: '',
      timezone: 'America/New_York',
      language: 'en-US',
    },
    notifications: {
      callAlerts: true,
      systemUpdates: true,
      performance: false,
      billing: true,
      email: true,
      push: false,
      sms: false,
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      ipWhitelist: [],
    },
    integrations: {
      vapi: {
        apiKey: '',
        webhookUrl: 'https://api.apexai.com/webhooks/vapi',
        enabled: false,
      },
      crm: {
        type: 'none',
        apiKey: '',
        syncEnabled: false,
      },
      analytics: {
        googleAnalytics: '',
        mixpanel: '',
        enabled: false,
      },
    },
    appearance: {
      theme: 'dark',
      accentColor: '#10b981',
      compactMode: false,
    },
    voice: {
      defaultVoice: 'shimmer',
      language: 'en-US',
      speed: 1.0,
      pitch: 1.0,
    },
  });

  // Load user profile and organization settings on mount
  useEffect(() => {
    console.log('🎯 Settings component mounted, loading data...');
    document.title = 'Settings - Loading...'; // Visual indicator

    // Try to get organization ID immediately from localStorage or make API call
    const loadData = async () => {
      try {
        // First try to load user profile to get organization ID
        console.log('1️⃣ Loading user profile...');
        const userProfile = await loadUserProfile();

        // Get the organization ID from the user profile
        const orgId = userProfile?.organization_id;

        if (orgId) {
          // Then load organization settings with the org ID
          console.log('2️⃣ Loading organization settings with org ID:', orgId);
          await loadOrganizationSettings(orgId);
        } else {
          console.log('⚠️ No organization ID found in user profile');
        }

        console.log('✅ All data loaded successfully');
      } catch (error) {
        console.error('❌ Error loading Settings data:', error);

        // If API calls fail, try to recover by making a direct call
        try {
          console.log('🔄 Attempting direct API call to recover organization ID...');
          const response = await simpleApiClient.get('/user-profile');
          const userProfile = response.data;

          if (userProfile.organization_id) {
            console.log('✅ Recovered organization ID:', userProfile.organization_id);
            setOrganizationId(userProfile.organization_id);

            // Try to load settings again with recovered org ID
            console.log('🔄 Attempting to load settings with recovered org ID...');
            await loadOrganizationSettings(userProfile.organization_id);
          } else {
            console.error('❌ No organization ID in user profile:', userProfile);
          }
        } catch (recoveryError) {
          console.error('❌ Recovery failed:', recoveryError);

          // Last resort: use the known organization ID from backend logs
          console.log('🆘 Using fallback organization ID...');
          const fallbackOrgId = '0f88ab8a-b760-4c2a-b289-79b54d7201cf';
          setOrganizationId(fallbackOrgId);
          await loadOrganizationSettings(fallbackOrgId);
        }
      }
    };

    loadData();
  }, []);

  const loadUserProfile = async () => {
    try {
      console.log('🔍 Loading user profile...');
      console.log('🔍 Making request to /user-profile');

      const response = await simpleApiClient.get('/user-profile');
      console.log('🔍 Raw response:', response);

      const userProfile = response.data;

      console.log('✅ User profile loaded:', userProfile);
      console.log('🏢 Organization ID from profile:', userProfile.organization_id);

      if (userProfile.organization_id) {
        setOrganizationId(userProfile.organization_id);
        console.log('✅ Organization ID set to:', userProfile.organization_id);
      } else {
        console.error('❌ No organization_id in user profile:', userProfile);
      }

      // Update profile settings with user data
      setSettings((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: `${userProfile.first_name} ${userProfile.last_name}`,
          email: userProfile.email,
          company: userProfile.organization_name || '',
        },
      }));

      return userProfile;
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      });

      // Set fallback organization ID if API fails
      console.log('🆘 Setting fallback organization ID...');
      setOrganizationId('0f88ab8a-b760-4c2a-b289-79b54d7201cf');
      return null;
    }
  };

  const loadOrganizationSettings = async (orgId?: string) => {
    try {
      setLoading(true);
      console.log('🔍 Loading organization settings...');

      // Use provided orgId or get from state or API
      let organizationIdToUse = orgId || organizationId;

      if (!organizationIdToUse) {
        console.log('🔄 No organization ID provided, fetching from user profile...');
        const profileResponse = await simpleApiClient.get('/user-profile');
        organizationIdToUse = profileResponse.data.organization_id;
      }

      console.log('🏢 Organization ID for settings:', organizationIdToUse);

      if (organizationIdToUse) {
        console.log('📡 Making API call to:', `/organizations/${organizationIdToUse}/settings`);
        const response = await simpleApiClient.get(
          `/organizations/${organizationIdToUse}/settings`
        );
        console.log('✅ Organization settings response:', response.data);

        const orgSettings = response.data.settings;
        console.log('⚙️ Parsed settings:', orgSettings);

        if (orgSettings?.vapi) {
          console.log('🔧 Setting VAPI settings:', orgSettings.vapi);
          setSettings((prev) => ({
            ...prev,
            integrations: {
              ...prev.integrations,
              vapi: {
                apiKey: orgSettings.vapi.apiKey || '',
                webhookUrl: orgSettings.vapi.webhookUrl || 'https://api.apexai.com/webhooks/vapi',
                enabled: orgSettings.vapi.enabled || false,
              },
            },
          }));
        } else {
          console.log('⚠️ No VAPI settings found in response');
        }
      } else {
        console.log('❌ No organization ID found');
      }
    } catch (error) {
      console.error('❌ Error loading organization settings:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      // Don't show error toast as this might be expected for new organizations
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    console.log('💾 Attempting to save settings...');
    console.log('🏢 Current organizationId:', organizationId);
    console.log('🏢 organizationId type:', typeof organizationId);
    console.log('🏢 organizationId length:', organizationId?.length);

    if (!organizationId) {
      console.error('❌ Organization ID is null/undefined');

      // Try to reload the user profile to get the organization ID
      try {
        console.log('🔄 Attempting to reload user profile...');
        const response = await simpleApiClient.get('/user-profile');
        const userProfile = response.data;

        if (userProfile.organization_id) {
          setOrganizationId(userProfile.organization_id);
          console.log('✅ Organization ID recovered:', userProfile.organization_id);

          // Continue with the save using the recovered organization ID
          await saveSettings(userProfile.organization_id);
          return;
        }
      } catch (error) {
        console.error('❌ Failed to recover organization ID:', error);
      }

      toast({
        title: 'Error',
        description: 'Organization ID not found. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    await saveSettings(organizationId);
  };

  const saveSettings = async (orgId: string) => {
    try {
      setSaving(true);

      console.log('📡 Saving organization settings for org:', orgId);
      console.log('🔧 Current settings being saved:', {
        vapiApiKey: settings.integrations.vapi.apiKey
          ? '***' + settings.integrations.vapi.apiKey.slice(-4)
          : 'empty',
        vapiWebhookUrl: settings.integrations.vapi.webhookUrl,
        vapiEnabled: settings.integrations.vapi.enabled,
      });

      // Validate required fields
      if (!settings.integrations.vapi.apiKey?.trim()) {
        toast({
          title: 'Validation Error',
          description: 'VAPI API Key is required',
          variant: 'destructive',
        });
        return;
      }

      const payload = {
        vapiApiKey: settings.integrations.vapi.apiKey,
        vapiPrivateKey: settings.integrations.vapi.apiKey, // Using same key for both
        vapiWebhookUrl: settings.integrations.vapi.webhookUrl,
        vapiEnabled: settings.integrations.vapi.enabled,
      };

      console.log('📤 Sending payload:', { ...payload, vapiApiKey: '***', vapiPrivateKey: '***' });
      console.log('🌐 Making PUT request to:', `/organizations/${orgId}/settings`);
      console.log(
        '🌐 Full URL will be:',
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/organizations/${orgId}/settings`
      );

      // Save organization settings
      const response = await simpleApiClient.put(`/organizations/${orgId}/settings`, payload);

      console.log('✅ Save response:', response.data);

      toast({
        title: 'Settings saved',
        description: 'Your VAPI integration settings have been updated successfully.',
      });
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });

      toast({
        title: 'Error saving settings',
        description:
          error.response?.data?.message ||
          error.message ||
          'There was an error saving your settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The value has been copied to your clipboard.',
    });
  };

  // Debug function to manually test settings loading
  const testSettingsLoad = async () => {
    try {
      console.log('🧪 Manual test: Loading settings...');

      // Test the API base URL
      console.log('🧪 API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

      // First check if we have a valid Clerk token
      const token = await getToken();
      console.log('🧪 Clerk token available:', token ? 'Yes' : 'No');
      console.log('🧪 Token preview:', token ? token.substring(0, 20) + '...' : 'None');

      // Test direct fetch first
      console.log('🧪 Testing direct fetch...');
      const directResponse = await fetch('http://localhost:3001/api/user-profile', {
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });
      console.log('🧪 Direct fetch status:', directResponse.status);

      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('🧪 Direct fetch data:', directData);
      }

      // Then test with API client
      console.log('🧪 Testing with API client...');
      const profileResponse = await simpleApiClient.get('/user-profile');
      console.log('🧪 User profile response:', profileResponse.data);

      // Then test organization settings
      const orgId = '0f88ab8a-b760-4c2a-b289-79b54d7201cf';
      console.log('🧪 Testing organization settings with org ID:', orgId);
      const settingsResponse = await simpleApiClient.get(`/organizations/${orgId}/settings`);
      console.log('🧪 Settings response:', settingsResponse.data);

      const apiKey = settingsResponse.data.settings?.vapi?.apiKey;

      toast({
        title: 'Test successful!',
        description: `API Key found: ${apiKey ? apiKey.substring(0, 8) + '...' : 'Not found'}`,
      });
    } catch (error) {
      console.error('🧪 Test failed:', error);
      console.error('🧪 Error details:', error.response?.data || error.message);
      console.error('🧪 Error status:', error.response?.status);
      console.error('🧪 Error config:', error.config);
      toast({
        title: 'Test failed',
        description: `Error: ${error.message} (Status: ${error.response?.status || 'Unknown'})`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-gray-400">Configure your platform preferences and integrations</p>
            {/* Debug info - remove in production */}
            <div className="mt-1 text-xs text-gray-500">
              Org ID: {organizationId || 'Loading...'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Config
            </Button>
            <Button
              variant="outline"
              className="border-yellow-600 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-800/20"
              onClick={testSettingsLoad}
            >
              <Terminal className="mr-2 h-4 w-4" />
              Test Load
            </Button>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700"
              onClick={handleSave}
              disabled={saving || !organizationId}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? (
                <Loader2 className="animate-spin" />
              ) : organizationId ? (
                'Save Changes'
              ) : (
                'Loading...'
              )}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 border-gray-800 bg-gray-900">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Webhook className="mr-2 h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Palette className="mr-2 h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger
              value="voice"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Mic className="mr-2 h-4 w-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger
              value="debug"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Terminal className="mr-2 h-4 w-4" />
              Debug
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Update your personal and company information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={settings.profile.name}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: { ...settings.profile, name: e.target.value },
                        })
                      }
                      className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: { ...settings.profile, email: e.target.value },
                        })
                      }
                      className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company" className="text-gray-300">
                      Company
                    </Label>
                    <Input
                      id="company"
                      value={settings.profile.company}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: { ...settings.profile, company: e.target.value },
                        })
                      }
                      className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone" className="text-gray-300">
                      Timezone
                    </Label>
                    <Select
                      value={settings.profile.timezone}
                      onValueChange={(value) =>
                        setSettings({
                          ...settings,
                          profile: { ...settings.profile, timezone: value },
                        })
                      }
                    >
                      <SelectTrigger className="border-gray-700 bg-gray-900/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-gray-700 bg-gray-900">
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div>
                  <h4 className="mb-4 flex items-center gap-2 font-medium text-white">
                    <Globe className="h-4 w-4 text-emerald-400" />
                    Language & Region
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="language" className="text-gray-300">
                        Language
                      </Label>
                      <Select
                        value={settings.profile.language}
                        onValueChange={(value) =>
                          setSettings({
                            ...settings,
                            profile: { ...settings.profile, language: value },
                          })
                        }
                      >
                        <SelectTrigger className="border-gray-700 bg-gray-900/50 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-gray-700 bg-gray-900">
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="en-GB">English (UK)</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="ja">Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="mb-4 flex items-center gap-2 font-medium text-white">
                    <Phone className="h-4 w-4 text-emerald-400" />
                    Call Alerts
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-gray-900/50 p-3">
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-300">Call alerts and updates</span>
                          <p className="text-xs text-gray-500">
                            Get notified about call status changes
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.categories.calls}
                        onCheckedChange={(checked) =>
                          updatePreferences({
                            categories: { ...preferences.categories, calls: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-900/50 p-3">
                      <div className="flex items-center space-x-3">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-300">Performance notifications</span>
                          <p className="text-xs text-gray-500">Alerts about system performance</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.categories.performance}
                        onCheckedChange={(checked) =>
                          updatePreferences({
                            categories: { ...preferences.categories, performance: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div>
                  <h4 className="mb-4 flex items-center gap-2 font-medium text-white">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    System Updates
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-gray-900/50 p-3">
                      <div className="flex items-center space-x-3">
                        <Zap className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-300">System updates and maintenance</span>
                          <p className="text-xs text-gray-500">Important system notifications</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.categories.system}
                        onCheckedChange={(checked) =>
                          updatePreferences({
                            categories: { ...preferences.categories, system: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-900/50 p-3">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-300">Billing and payment alerts</span>
                          <p className="text-xs text-gray-500">Payment reminders and invoices</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.categories.billing}
                        onCheckedChange={(checked) =>
                          updatePreferences({
                            categories: { ...preferences.categories, billing: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div>
                  <h4 className="mb-4 flex items-center gap-2 font-medium text-white">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    Delivery Methods
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-gray-900/50 p-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-300">Email notifications</span>
                          <p className="text-xs text-gray-500">Receive notifications via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked) =>
                          updatePreferences({
                            emailNotifications: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-900/50 p-3">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-300">Push notifications</span>
                          <p className="text-xs text-gray-500">Mobile and browser notifications</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.pushNotifications}
                        onCheckedChange={(checked) =>
                          updatePreferences({
                            pushNotifications: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-900/50 p-3">
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-300">SMS notifications</span>
                          <p className="text-xs text-gray-500">Critical alerts via text message</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.smsNotifications}
                        onCheckedChange={(checked) =>
                          updatePreferences({
                            smsNotifications: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div>
                  <h4 className="mb-4 flex items-center gap-2 font-medium text-white">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    Quiet Hours
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-gray-900/50 p-3">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="text-gray-300">Enable quiet hours</span>
                          <p className="text-xs text-gray-500">Pause non-critical notifications</p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.quietHours.enabled}
                        onCheckedChange={(checked) =>
                          updatePreferences({
                            quietHours: { ...preferences.quietHours, enabled: checked },
                          })
                        }
                      />
                    </div>
                    {preferences.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-900/50 p-4">
                        <div>
                          <Label className="text-gray-300">Start Time</Label>
                          <Input
                            type="time"
                            value={preferences.quietHours.start}
                            onChange={(e) =>
                              updatePreferences({
                                quietHours: { ...preferences.quietHours, start: e.target.value },
                              })
                            }
                            className="border-gray-700 bg-gray-900/50 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300">End Time</Label>
                          <Input
                            type="time"
                            value={preferences.quietHours.end}
                            onChange={(e) =>
                              updatePreferences({
                                quietHours: { ...preferences.quietHours, end: e.target.value },
                              })
                            }
                            className="border-gray-700 bg-gray-900/50 text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Security Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your account security and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <div>
                      <span className="font-medium text-white">Two-Factor Authentication</span>
                      <p className="text-sm text-gray-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  <Switch checked={settings.security.twoFactorEnabled} />
                </div>

                <Separator className="bg-gray-700" />

                <div>
                  <Label className="text-white">Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.security.sessionTimeout}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                  />
                </div>

                <Separator className="bg-gray-700" />

                <div>
                  <Label className="text-white">Password Expiry (days)</Label>
                  <Input
                    type="number"
                    value={settings.security.passwordExpiry}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">VAPI Integration</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure your VAPI API connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">API Key</Label>
                  <div className="mt-2 flex items-center space-x-2">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.integrations.vapi.apiKey}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          integrations: {
                            ...settings.integrations,
                            vapi: { ...settings.integrations.vapi, apiKey: e.target.value },
                          },
                        })
                      }
                      className="border-gray-700 bg-gray-800 text-white"
                      placeholder="Enter your VAPI Private API Key"
                    />
                    <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(settings.integrations.vapi.apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-white">Webhook URL</Label>
                  <Input
                    value={settings.integrations.vapi.webhookUrl}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        integrations: {
                          ...settings.integrations,
                          vapi: { ...settings.integrations.vapi, webhookUrl: e.target.value },
                        },
                      })
                    }
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    placeholder="https://api.apexai.com/webhooks/vapi"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Enable Integration</span>
                  <Switch
                    checked={settings.integrations.vapi.enabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        integrations: {
                          ...settings.integrations,
                          vapi: { ...settings.integrations.vapi, enabled: checked },
                        },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Appearance Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Customize how the platform looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white">Theme</Label>
                  <Select value={settings.appearance.theme}>
                    <SelectTrigger className="mt-2 border-gray-700 bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Accent Color</Label>
                  <div className="mt-2 flex items-center space-x-3">
                    <div
                      className="h-10 w-10 rounded-lg border border-gray-700"
                      style={{ backgroundColor: settings.appearance.accentColor }}
                    />
                    <Input
                      type="color"
                      value={settings.appearance.accentColor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearance: { ...settings.appearance, accentColor: e.target.value },
                        })
                      }
                      className="h-10 w-20 border-gray-700 bg-gray-800"
                    />
                    <span className="text-gray-400">{settings.appearance.accentColor}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-white">Compact Mode</span>
                    <p className="text-sm text-gray-400">Reduce spacing for more content density</p>
                  </div>
                  <Switch checked={settings.appearance.compactMode} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Tab */}
          <TabsContent value="voice" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Voice Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure default voice parameters for your AI assistants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white">Default Voice</Label>
                  <Select value={settings.voice.defaultVoice}>
                    <SelectTrigger className="mt-2 border-gray-700 bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="fable">Fable</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="nova">Nova</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Language</Label>
                  <Select value={settings.voice.language}>
                    <SelectTrigger className="mt-2 border-gray-700 bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="en-GB">English (UK)</SelectItem>
                      <SelectItem value="es-ES">Spanish</SelectItem>
                      <SelectItem value="fr-FR">French</SelectItem>
                      <SelectItem value="de-DE">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Speech Speed</Label>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={settings.voice.speed}
                      className="w-full accent-emerald-600"
                    />
                    <div className="mt-1 flex justify-between text-sm text-gray-400">
                      <span>0.5x</span>
                      <span>{settings.voice.speed}x</span>
                      <span>2.0x</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-white">Voice Pitch</Label>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={settings.voice.pitch}
                      className="w-full accent-emerald-600"
                    />
                    <div className="mt-1 flex justify-between text-sm text-gray-400">
                      <span>Low</span>
                      <span>{settings.voice.pitch}x</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Debug Tab */}
          <TabsContent value="debug" className="space-y-6">
            <VAPIDebugPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
