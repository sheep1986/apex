import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Bot,
  Phone,
  Users,
  Shield,
  Key,
  ExternalLink,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Crown,
  Wallet,
  Globe,
  Bell,
  Lock,
  Trash2,
  UserCheck,
  UserX,
  Plus,
  Edit,
  Copy,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/services/MinimalUserProvider';
import { useApiClient } from '@/lib/api-client';

interface OrganizationSettings {
  vapi_api_key?: string;
  vapi_webhook_secret?: string;
  vapi_phone_numbers?: string[];
  vapi_assistants?: Array<{
    id: string;
    name: string;
    model: string;
  }>;
  default_user_role?: string;
  billing_email?: string;
  organization_name?: string;
  max_concurrent_calls?: number;
  webhook_url?: string;
  compliance_settings?: {
    tcpa_enabled: boolean;
    do_not_call_enabled: boolean;
    recording_consent: boolean;
  };
}

interface OrganizationUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  status: 'active' | 'pending' | 'suspended';
  last_login?: string;
  created_at: string;
}

const OrganizationSettings: React.FC = () => {
  const { t } = useTranslation(['common']);
  const [activeTab, setActiveTab] = useState('vapi');
  const [settings, setSettings] = useState<OrganizationSettings>({});
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  
  const { toast } = useToast();
  const { userContext } = useUserContext();
  const apiClient = useApiClient();

  // Check if user is admin
  const isAdmin = userContext?.role === 'client_admin' || userContext?.role === 'platform_owner';

  useEffect(() => {
    if (isAdmin) {
      loadOrganizationSettings();
      loadOrganizationUsers();
    }
  }, [isAdmin]);

  const loadOrganizationSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/organization-settings');
      setSettings(response.data.settings || {});
    } catch (error) {
      console.error('Error loading organization settings:', error);
      toast({
        title: t('error'),
        description: t('organizationSettings.failedToLoadSettings'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationUsers = async () => {
    try {
      const response = await apiClient.get('/organizations/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading organization users:', error);
    }
  };

  const saveSetting = async (key: string, value: any, encrypted = false) => {
    try {
      setSaving(true);
      await apiClient.post(`/organization-settings/${key}`, {
        value,
        encrypted
      });
      
      toast({
        title: t('success'),
        description: t('organizationSettings.settingSaved'),
      });
      
      // Update local state
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: t('error'),
        description: t('organizationSettings.settingSaveFailed'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await apiClient.put(`/organizations/users/${userId}/role`, { role: newRole });
      toast({
        title: t('success'),
        description: t('organizationSettings.users.userRoleUpdated'),
      });
      loadOrganizationUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: t('error'),
        description: t('organizationSettings.users.userRoleUpdateFailed'),
        variant: 'destructive',
      });
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      await apiClient.put(`/organizations/users/${userId}/suspend`);
      toast({
        title: t('success'),
        description: t('organizationSettings.users.userSuspended'),
      });
      loadOrganizationUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: t('error'),
        description: t('organizationSettings.users.userSuspendFailed'),
        variant: 'destructive',
      });
    }
  };

  const testVapiConnection = async () => {
    if (!settings.vapi_api_key) {
      toast({
        title: t('error'),
        description: t('organizationSettings.vapi.apiKeyRequired'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.post('/vapi/test-connection');
      
      if (response.data.success) {
        toast({
          title: t('success'),
          description: t('organizationSettings.vapi.testConnectionSuccess'),
        });
      } else {
        toast({
          title: t('error'),
          description: t('organizationSettings.vapi.testConnectionFailed'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing VAPI connection:', error);
      toast({
        title: t('error'),
        description: t('organizationSettings.vapi.testConnectionError'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-12 text-center">
              <Shield className="mx-auto mb-4 h-16 w-16 text-gray-600" />
              <h2 className="mb-2 text-xl font-semibold text-white">{t('organizationSettings.accessDenied')}</h2>
              <p className="text-gray-400">
                {t('organizationSettings.accessDeniedDescription')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-gray-400">{t('organizationSettings.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-emerald-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">{t('organizationSettings.title')}</h1>
              <p className="text-gray-400">
                {t('organizationSettings.description')}
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-900">
            <TabsTrigger value="vapi" className="flex items-center space-x-2">
              <Bot className="h-4 w-4" />
              <span>{t('organizationSettings.tabs.vapi')}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{t('organizationSettings.tabs.users')}</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>{t('organizationSettings.tabs.permissions')}</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>{t('organizationSettings.tabs.billing')}</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>{t('organizationSettings.tabs.general')}</span>
            </TabsTrigger>
          </TabsList>

          {/* VAPI Integration Tab */}
          <TabsContent value="vapi" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Bot className="h-5 w-5 text-emerald-500" />
                  <span>{t('organizationSettings.vapi.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* API Key */}
                <div className="space-y-2">
                  <Label className="text-white">{t('organizationSettings.vapi.apiKey')}</Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.vapi_api_key || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, vapi_api_key: e.target.value }))}
                        placeholder={t('organizationSettings.vapi.apiKeyPlaceholder')}
                        className="pr-10 bg-gray-800 border-gray-700 text-white"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      onClick={() => saveSetting('vapi_api_key', settings.vapi_api_key, true)}
                      disabled={saving || !settings.vapi_api_key}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {t('organizationSettings.vapi.apiKeyDescription')}
                  </p>
                </div>

                {/* Webhook Secret */}
                <div className="space-y-2">
                  <Label className="text-white">{t('organizationSettings.vapi.webhookSecret')}</Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        type={showWebhookSecret ? 'text' : 'password'}
                        value={settings.vapi_webhook_secret || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, vapi_webhook_secret: e.target.value }))}
                        placeholder={t('organizationSettings.vapi.webhookSecretPlaceholder')}
                        className="pr-10 bg-gray-800 border-gray-700 text-white"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      >
                        {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      onClick={() => saveSetting('vapi_webhook_secret', settings.vapi_webhook_secret, true)}
                      disabled={saving || !settings.vapi_webhook_secret}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Connection Test */}
                <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div>
                    <p className="text-white font-medium">{t('organizationSettings.vapi.testConnection')}</p>
                    <p className="text-sm text-gray-400">{t('organizationSettings.vapi.testConnectionDescription')}</p>
                  </div>
                  <Button
                    onClick={testVapiConnection}
                    disabled={saving || !settings.vapi_api_key}
                    variant="outline"
                    className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    {t('organizationSettings.vapi.testConnection')}
                  </Button>
                </div>

                {/* Webhook URL */}
                <div className="space-y-2">
                  <Label className="text-white">{t('organizationSettings.vapi.webhookUrl')}</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={settings.webhook_url || `${window.location.origin}/api/vapi-webhook`}
                      readOnly
                      className="bg-gray-800 border-gray-700 text-gray-300"
                    />
                    <Button
                      onClick={() => navigator.clipboard.writeText(settings.webhook_url || `${window.location.origin}/api/vapi-webhook`)}
                      variant="outline"
                      className="border-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {t('organizationSettings.vapi.webhookUrlDescription')}
                  </p>
                </div>

                {/* Max Concurrent Calls */}
                <div className="space-y-2">
                  <Label className="text-white">{t('organizationSettings.vapi.maxConcurrentCalls')}</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      value={settings.max_concurrent_calls || 10}
                      onChange={(e) => setSettings(prev => ({ ...prev, max_concurrent_calls: parseInt(e.target.value) }))}
                      min="1"
                      max="100"
                      className="w-32 bg-gray-800 border-gray-700 text-white"
                    />
                    <Button
                      onClick={() => saveSetting('max_concurrent_calls', settings.max_concurrent_calls)}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {t('save')}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    {t('organizationSettings.vapi.maxConcurrentCallsDescription')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Users className="h-5 w-5 text-emerald-500" />
                    <span>{t('organizationSettings.users.title')}</span>
                  </CardTitle>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('organizationSettings.users.inviteUser')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                          </p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {t(`organizationSettings.users.roles.${user.role.replace('client_', '')}`)}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                user.status === 'active' ? 'border-emerald-500 text-emerald-400' :
                                user.status === 'pending' ? 'border-yellow-500 text-yellow-400' :
                                'border-red-500 text-red-400'
                              }`}
                            >
                              {t(`organizationSettings.users.status.${user.status}`)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                        >
                          <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="client_admin">{t('organizationSettings.users.roles.admin')}</SelectItem>
                            <SelectItem value="client_user">{t('organizationSettings.users.roles.user')}</SelectItem>
                            <SelectItem value="client_viewer">{t('organizationSettings.users.roles.viewer')}</SelectItem>
                          </SelectContent>
                        </Select>
                        {user.status === 'active' ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:bg-red-600/20">
                                <UserX className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-900 border-gray-800">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">{t('organizationSettings.users.suspendUser')}</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  {t('organizationSettings.users.suspendUserConfirm', { email: user.email })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
                                  {t('cancel')}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => suspendUser(user.id)}
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  {t('organizationSettings.users.suspend')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <Button variant="outline" size="sm" className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20">
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs would be implemented similarly */}
          <TabsContent value="permissions">
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-12 text-center">
                <Shield className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <h3 className="mb-2 text-lg font-semibold text-white">{t('organizationSettings.permissions.title')}</h3>
                <p className="text-gray-400">{t('organizationSettings.permissions.comingSoon')}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-12 text-center">
                <Wallet className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <h3 className="mb-2 text-lg font-semibold text-white">{t('organizationSettings.billing.title')}</h3>
                <p className="text-gray-400">{t('organizationSettings.billing.comingSoon')}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-12 text-center">
                <Globe className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <h3 className="mb-2 text-lg font-semibold text-white">{t('organizationSettings.general.title')}</h3>
                <p className="text-gray-400">{t('organizationSettings.general.comingSoon')}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizationSettings;