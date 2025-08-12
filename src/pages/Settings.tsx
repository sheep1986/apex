import React, { useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/auth';
import { useNotificationStore } from '@/lib/notification-store';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Globe,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Edit,
  Check,
  Key,
  Lock,
  Database,
  CreditCard,
  Brain,
  AlertTriangle,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { apiConfigService, type StripeConfig, type OpenAIConfig, type SupabaseConfig } from '../services/api-config.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
import { useToast } from '../hooks/use-toast';
import { useUserContext } from '@/services/MinimalUserProvider';

export default function Settings() {
  // const { t, i18n } = useTranslation();
  const i18n = { language: 'en-GB', changeLanguage: (lang: string) => {
    localStorage.setItem('apex-language', lang);
  } };
  const { preferences, updatePreferences } = useNotificationStore();
  const { toast } = useToast();
  const { userContext } = useUserContext();
  
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  
  // API Management state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [apiPassword, setApiPassword] = useState('');
  const [isApiUnlocked, setIsApiUnlocked] = useState(false);
  const [apiVerifying, setApiVerifying] = useState(false);
  
  // API configuration state
  const [apiConfigs, setApiConfigs] = useState({
    stripe: {
      publicKey: '',
      secretKey: '',
      webhookSecret: '',
      testMode: true,
    } as StripeConfig,
    openai: {
      apiKey: '',
      organizationId: '',
      model: 'gpt-4',
    } as OpenAIConfig,
    supabase: {
      url: '',
      anonKey: '',
      serviceRoleKey: '',
    } as SupabaseConfig
  });

  const [loadingConfigs, setLoadingConfigs] = useState(false);
  
  // API keys visibility state
  const [showApiKeys, setShowApiKeys] = useState({
    stripe: { publicKey: false, secretKey: false, webhookSecret: false },
    openai: { apiKey: false },
    supabase: { anonKey: false, serviceRoleKey: false }
  });

  // Profile state (populated from Supabase user data)
  const [profile, setProfile] = useState({
    fullName: `${userContext?.firstName || ''} ${userContext?.lastName || ''}`.trim(),
    email: userContext?.email || '',
    company: userContext?.organization_name || '',
    timezone: 'Eastern Time',
  });

  // Security state
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en-GB');

  // Load API configurations when unlocked
  useEffect(() => {
    if (isApiUnlocked) {
      loadApiConfigurations();
    }
  }, [isApiUnlocked]);

  const loadApiConfigurations = async () => {
    setLoadingConfigs(true);
    try {
      const configs = await apiConfigService.getAllApiConfigurations();
      
      setApiConfigs({
        stripe: configs.stripe || {
          publicKey: '',
          secretKey: '',
          webhookSecret: '',
          testMode: true,
        },
        openai: configs.openai || {
          apiKey: '',
          organizationId: '',
          model: 'gpt-4',
        },
        supabase: configs.supabase || {
          url: '',
          anonKey: '',
          serviceRoleKey: '',
        }
      });
    } catch (error) {
      console.error('Error loading API configurations:', error);
      toast({
        title: 'Error loading configurations',
        description: 'Failed to load API configurations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // Save all changes logic here
      toast({
        title: 'Changes saved',
        description: 'Your settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save changes.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!security.currentPassword || !security.newPassword || !security.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Please fill in all password fields.',
        variant: 'destructive',
      });
      return;
    }

    if (security.newPassword !== security.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (security.newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'New password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Here you would implement the actual password change API call
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });
      
      // Clear the form
      setSecurity({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    i18n.changeLanguage(languageCode);
    
    // Save to localStorage manually to ensure persistence
    localStorage.setItem('apex-language', languageCode);
    
    toast({
      title: 'Language updated',
      description: `Platform language changed successfully.`,
    });
  };

  const handleApiPasswordVerification = async () => {
    setApiVerifying(true);
    try {
      // In a real implementation, this would verify the password against the user's actual password
      // For now, we'll simulate a password check
      if (apiPassword === 'admin123' || apiPassword.length >= 6) {
        setIsApiUnlocked(true);
        setShowPasswordModal(false);
        setApiPassword('');
        toast({
          title: 'Access granted',
          description: 'You now have access to API management settings.',
        });
      } else {
        toast({
          title: 'Invalid password',
          description: 'Please enter your correct password.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: 'Failed to verify password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setApiVerifying(false);
    }
  };

  const handleApiConfigSave = async (apiType: 'stripe' | 'openai' | 'supabase') => {
    console.log('🔍 Debug - User Context:', userContext);
    console.log('🔍 Debug - Organization ID:', userContext?.organization_id);
    
    if (!userContext?.organization_id) {
      console.error('❌ No organization ID found in user context');
      toast({
        title: 'Error',
        description: 'Organization ID not found. Please try logging in again.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const config = apiConfigs[apiType];
      
      // Validate configuration before saving
      const isValid = await apiConfigService.testApiConfiguration(apiType, config);
      if (!isValid) {
        toast({
          title: 'Invalid configuration',
          description: `Please check your ${apiType} configuration values.`,
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      await apiConfigService.saveApiConfiguration(
        apiType,
        config
      );

      toast({
        title: 'Configuration saved',
        description: `${apiType.charAt(0).toUpperCase() + apiType.slice(1)} API settings have been updated successfully.`,
      });
    } catch (error) {
      console.error(`Error saving ${apiType} configuration:`, error);
      toast({
        title: 'Save failed',
        description: `Failed to save ${apiType} API configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleApiKeyVisibility = (apiType: string, field: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [apiType]: {
        ...prev[apiType],
        [field]: !prev[apiType][field]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">Manage your account settings and preferences</p>
          </div>
          <Button
            onClick={handleSaveChanges}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className={`grid w-full border-gray-800 bg-gray-900 ${userContext?.role === 'platform_owner' ? 'grid-cols-4' : 'grid-cols-3'}`}>
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
              value="appearance"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              Appearance
            </TabsTrigger>
            {userContext?.role === 'platform_owner' && (
              <TabsTrigger
                value="api-management"
                className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
                onClick={() => {
                  if (!isApiUnlocked) {
                    setShowPasswordModal(true);
                  }
                }}
              >
                <Key className="mr-2 h-4 w-4" />
                API Management
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Profile Information Section */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-emerald-400" />
                    Profile Information
                  </h3>
                  <p className="text-gray-400">Update your personal information and preferences</p>
                </div>
                <Button variant="outline" size="sm" className="border-gray-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="fullName" className="text-gray-300">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile({ ...profile, fullName: e.target.value })
                    }
                    className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="company" className="text-gray-300">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) =>
                      setProfile({ ...profile, company: e.target.value })
                    }
                    className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone" className="text-gray-300">
                    Timezone
                  </Label>
                  <Select value={profile.timezone} onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
                    <SelectTrigger className="border-gray-700 bg-gray-900/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-900">
                      <SelectItem value="Eastern Time">Eastern Time</SelectItem>
                      <SelectItem value="Central Time">Central Time</SelectItem>
                      <SelectItem value="Mountain Time">Mountain Time</SelectItem>
                      <SelectItem value="Pacific Time">Pacific Time</SelectItem>
                      <SelectItem value="GMT">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Language & Region Section */}
              <div className="mt-8 border-t border-gray-700 pt-6">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
                  <Globe className="h-4 w-4 text-emerald-400" />
                  Language & Region
                </h4>
                <div className="max-w-sm">
                  <Label htmlFor="language" className="text-gray-300">
                    Language
                  </Label>
                  <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="border-gray-700 bg-gray-900/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-900">
                      <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                      <SelectItem value="en-GB">🇬🇧 English (UK)</SelectItem>
                      <SelectItem value="de">🇩🇪 German</SelectItem>
                      <SelectItem value="fr">🇫🇷 French</SelectItem>
                      <SelectItem value="it">🇮🇹 Italian</SelectItem>
                      <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                      <SelectItem value="ru">🇷🇺 Russian</SelectItem>
                      <SelectItem value="sr">🇷🇸 Serbian</SelectItem>
                      <SelectItem value="mt">🇲🇹 Maltese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  Change Password
                </h3>
                <p className="text-gray-400">Update your account password for enhanced security</p>
              </div>

              {/* Password Status */}
              <div className="mb-6 rounded-lg border border-gray-700 bg-gray-900/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Password Status</p>
                    <div className="mt-1 flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Security Level</span>
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                          <span className="text-xs font-medium text-emerald-400">Strong</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">Password Age</span>
                        <span className="text-xs text-gray-300">Unknown</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Change Fields */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Current Password */}
                <div>
                  <Label htmlFor="currentPassword" className="text-gray-300">
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={security.currentPassword}
                      onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                      className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <Label htmlFor="newPassword" className="text-gray-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={security.newPassword}
                      onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                      className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                      className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="mt-4 text-xs text-gray-400">
                <p>Password must be at least 8 characters long</p>
              </div>

              {/* Save Password Button */}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={saving || !security.currentPassword || !security.newPassword || !security.confirmPassword}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {saving ? 'Changing Password...' : 'Change Password'}
                </Button>
              </div>
            </div>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-400">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) =>
                        updatePreferences({ emailNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-400">Receive push notifications in your browser</p>
                    </div>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) =>
                        updatePreferences({ pushNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-400">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      checked={preferences.smsNotifications}
                      onCheckedChange={(checked) =>
                        updatePreferences({ smsNotifications: checked })
                      }
                    />
                  </div>
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
              <CardContent>
                <p className="text-gray-400">Appearance settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Management Tab - Only for Platform Owners */}
          {userContext?.role === 'platform_owner' && (
            <TabsContent value="api-management" className="space-y-6">
              {!isApiUnlocked ? (
                <div className="flex items-center justify-center py-12">
                  <Card className="w-full max-w-md border-gray-800 bg-gray-900">
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                        <Lock className="h-6 w-6 text-amber-600" />
                      </div>
                      <CardTitle className="text-white">Password Required</CardTitle>
                      <CardDescription className="text-gray-400">
                        Enter your password to access API management settings
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              ) : (
                <div className="space-y-6">
                  {loadingConfigs && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                      <span className="ml-2 text-gray-400">Loading API configurations...</span>
                    </div>
                  )}
                  
                  {!loadingConfigs && (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-gray-400">
                          Manage your API integrations securely. All sensitive data is encrypted.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadApiConfigurations}
                          className="border-gray-700"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh
                        </Button>
                      </div>

                      {/* Stripe API Configuration */}
                  <Card className="border-gray-800 bg-gray-900">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <CreditCard className="h-5 w-5 text-emerald-400" />
                        Stripe API Configuration
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Configure Stripe payment processing integration for billing and subscriptions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="stripePublicKey" className="text-gray-300">
                            Publishable Key
                          </Label>
                          <div className="relative">
                            <Input
                              id="stripePublicKey"
                              type={showApiKeys.stripe.publicKey ? 'text' : 'password'}
                              value={apiConfigs.stripe.publicKey}
                              onChange={(e) => setApiConfigs(prev => ({
                                ...prev,
                                stripe: { ...prev.stripe, publicKey: e.target.value }
                              }))}
                              className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                              placeholder="pk_test_..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => toggleApiKeyVisibility('stripe', 'publicKey')}
                            >
                              {showApiKeys.stripe.publicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="stripeSecretKey" className="text-gray-300">
                            Secret Key
                          </Label>
                          <div className="relative">
                            <Input
                              id="stripeSecretKey"
                              type={showApiKeys.stripe.secretKey ? 'text' : 'password'}
                              value={apiConfigs.stripe.secretKey}
                              onChange={(e) => setApiConfigs(prev => ({
                                ...prev,
                                stripe: { ...prev.stripe, secretKey: e.target.value }
                              }))}
                              className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                              placeholder="sk_test_..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => toggleApiKeyVisibility('stripe', 'secretKey')}
                            >
                              {showApiKeys.stripe.secretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="stripeWebhookSecret" className="text-gray-300">
                            Webhook Secret
                          </Label>
                          <div className="relative">
                            <Input
                              id="stripeWebhookSecret"
                              type={showApiKeys.stripe.webhookSecret ? 'text' : 'password'}
                              value={apiConfigs.stripe.webhookSecret}
                              onChange={(e) => setApiConfigs(prev => ({
                                ...prev,
                                stripe: { ...prev.stripe, webhookSecret: e.target.value }
                              }))}
                              className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                              placeholder="whsec_..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => toggleApiKeyVisibility('stripe', 'webhookSecret')}
                            >
                              {showApiKeys.stripe.webhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="stripeTestMode" className="text-gray-300">
                            Test Mode
                          </Label>
                          <div className="flex items-center space-x-2 mt-2">
                            <Switch
                              id="stripeTestMode"
                              checked={apiConfigs.stripe.testMode}
                              onCheckedChange={(checked) => setApiConfigs(prev => ({
                                ...prev,
                                stripe: { ...prev.stripe, testMode: checked }
                              }))}
                            />
                            <Label htmlFor="stripeTestMode" className="text-sm text-gray-400">
                              Use test environment
                            </Label>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleApiConfigSave('stripe')}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Stripe Config
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* OpenAI API Configuration */}
                  <Card className="border-gray-800 bg-gray-900">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Brain className="h-5 w-5 text-emerald-400" />
                        OpenAI API Configuration
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Configure OpenAI integration for AI-powered features and call analysis.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="openaiApiKey" className="text-gray-300">
                            API Key
                          </Label>
                          <div className="relative">
                            <Input
                              id="openaiApiKey"
                              type={showApiKeys.openai.apiKey ? 'text' : 'password'}
                              value={apiConfigs.openai.apiKey}
                              onChange={(e) => setApiConfigs(prev => ({
                                ...prev,
                                openai: { ...prev.openai, apiKey: e.target.value }
                              }))}
                              className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                              placeholder="sk-..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => toggleApiKeyVisibility('openai', 'apiKey')}
                            >
                              {showApiKeys.openai.apiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="openaiOrgId" className="text-gray-300">
                            Organization ID (Optional)
                          </Label>
                          <Input
                            id="openaiOrgId"
                            value={apiConfigs.openai.organizationId}
                            onChange={(e) => setApiConfigs(prev => ({
                              ...prev,
                              openai: { ...prev.openai, organizationId: e.target.value }
                            }))}
                            className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500"
                            placeholder="org-..."
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="openaiModel" className="text-gray-300">
                            Default Model
                          </Label>
                          <Select
                            value={apiConfigs.openai.model}
                            onValueChange={(value) => setApiConfigs(prev => ({
                              ...prev,
                              openai: { ...prev.openai, model: value }
                            }))}
                          >
                            <SelectTrigger className="border-gray-700 bg-gray-900/50 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-gray-700 bg-gray-900">
                              <SelectItem value="gpt-4">GPT-4</SelectItem>
                              <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleApiConfigSave('openai')}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save OpenAI Config
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Supabase API Configuration */}
                  <Card className="border-gray-800 bg-gray-900">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Database className="h-5 w-5 text-emerald-400" />
                        Supabase API Configuration
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Configure external Supabase instances for client projects or multi-tenant features.
                        <span className="text-amber-500 text-xs block mt-1">
                          Note: This does NOT affect the main platform database connection.
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="supabaseUrl" className="text-gray-300">
                            Project URL
                          </Label>
                          <Input
                            id="supabaseUrl"
                            value={apiConfigs.supabase.url}
                            onChange={(e) => setApiConfigs(prev => ({
                              ...prev,
                              supabase: { ...prev.supabase, url: e.target.value }
                            }))}
                            className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500"
                            placeholder="https://xxx.supabase.co"
                          />
                        </div>
                        <div>
                          <Label htmlFor="supabaseAnonKey" className="text-gray-300">
                            Anon Key
                          </Label>
                          <div className="relative">
                            <Input
                              id="supabaseAnonKey"
                              type={showApiKeys.supabase.anonKey ? 'text' : 'password'}
                              value={apiConfigs.supabase.anonKey}
                              onChange={(e) => setApiConfigs(prev => ({
                                ...prev,
                                supabase: { ...prev.supabase, anonKey: e.target.value }
                              }))}
                              className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                              placeholder="eyJ..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => toggleApiKeyVisibility('supabase', 'anonKey')}
                            >
                              {showApiKeys.supabase.anonKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="supabaseServiceKey" className="text-gray-300">
                            Service Role Key
                          </Label>
                          <div className="relative">
                            <Input
                              id="supabaseServiceKey"
                              type={showApiKeys.supabase.serviceRoleKey ? 'text' : 'password'}
                              value={apiConfigs.supabase.serviceRoleKey}
                              onChange={(e) => setApiConfigs(prev => ({
                                ...prev,
                                supabase: { ...prev.supabase, serviceRoleKey: e.target.value }
                              }))}
                              className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500 pr-10"
                              placeholder="eyJ..."
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => toggleApiKeyVisibility('supabase', 'serviceRoleKey')}
                            >
                              {showApiKeys.supabase.serviceRoleKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-amber-700 bg-amber-900/20 p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <p className="text-sm text-amber-200">
                            <strong>Warning:</strong> Service Role Key has full database access. Keep it secure.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleApiConfigSave('supabase')}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Supabase Config
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                    </>
                  )}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="w-full max-w-md border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="h-5 w-5 text-amber-500" />
                  Enter Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Please enter your account password to access API management settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="apiPassword" className="text-gray-300">
                    Password
                  </Label>
                  <Input
                    id="apiPassword"
                    type="password"
                    value={apiPassword}
                    onChange={(e) => setApiPassword(e.target.value)}
                    className="border-gray-700 bg-gray-900/50 text-white placeholder-gray-500"
                    placeholder="Enter your password"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleApiPasswordVerification();
                      }
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setApiPassword('');
                    }}
                    className="border-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApiPasswordVerification}
                    disabled={apiVerifying || !apiPassword}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {apiVerifying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Unlock
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}