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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useApiClient } from '@/lib/api-client';
import { useUserContext } from '@/services/MinimalUserProvider';
import { supabaseService } from '@/services/supabase-service';
import {
    Globe,
    Plus,
    RefreshCw,
    Settings,
    Shield,
    UserCheck,
    UserX,
    Users,
    Wallet
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface OrganizationSettings {
  voice_engine_api_key?: string;  // Public key
  voice_engine_private_key?: string;  // Private key
  voice_engine_webhook_secret?: string;
  voice_engine_phone_numbers?: string[];
  voice_engine_assistants?: Array<{
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
  const [activeTab, setActiveTab] = useState('users');
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
      console.error('Error loading organization settings from API, trying Supabase:', error);
      
      // Fallback to direct Supabase query
      try {
        if (!userContext?.organization_id) {
          throw new Error('No organization ID available');
        }
        
        // Fetch organization data directly from Supabase
        const orgData = await supabaseService.getOrganization(userContext.organization_id);
        
        if (!orgData) throw new Error('Organization not found');
        
        // Transform Supabase data to match expected format
        const transformedSettings: OrganizationSettings = {
          voice_engine_api_key: orgData.vapi_api_key || '',
          voice_engine_private_key: orgData.vapi_private_key || '',
          voice_engine_webhook_secret: orgData.vapi_webhook_secret || '',
          organization_name: orgData.name || '',
          webhook_url: orgData.webhook_url || `https://api.trinity-labs.ai/voice/webhook`,
          billing_email: orgData.billing_email || '',
          max_concurrent_calls: orgData.max_concurrent_calls || 10,
          default_user_role: orgData.default_user_role || 'client_user',
          compliance_settings: orgData.compliance_settings || {
            tcpa_enabled: false,
            do_not_call_enabled: false,
            recording_consent: false
          }
        };
        
        // Fetch phone numbers
        const phoneNumbers = await supabaseService.getPhoneNumbers(userContext.organization_id);
        
        if (phoneNumbers && phoneNumbers.length > 0) {
          transformedSettings.voice_engine_phone_numbers = phoneNumbers.map(p => p.number);
        }
        
        // Fetch Voice Engine assistants (if stored in database)
        // This would typically come from a separate table or the VAPI API
        // For now, we'll leave it empty or mock it if needed
        const { data: assistants } = await supabaseService.client
          .from('communications_metadata')
          .select('id, name')
          .eq('type', 'voice_assistant') // Assuming we might store them this way
          .eq('organization_id', orgData.id);

        if (assistants && assistants.length > 0) {
          transformedSettings.voice_engine_assistants = assistants.map(a => ({
            id: a.id,
            name: a.name,
            model: a.model || 'gpt-4'
          }));
        }
        
        setSettings(transformedSettings);
        console.log('✅ Loaded organization settings from Supabase fallback');
      } catch (supabaseError) {
        console.error('Error loading from Supabase:', supabaseError);
        toast({
          title: 'Error',
          description: 'Failed to load organization settings. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationUsers = async () => {
    try {
      const response = await apiClient.get('/organizations/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading organization users from API, trying Supabase:', error);
      
      // Fallback to direct Supabase query
      try {
        if (!userContext?.organization_id) {
          throw new Error('No organization ID available');
        }
        
        const users = await supabaseService.getOrganizationUsers(userContext.organization_id);
        
        // Transform to match expected format
        const transformedUsers: OrganizationUser[] = (users || []).map(user => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          status: user.status || 'active',
          last_login: user.last_login,
          created_at: user.created_at
        }));
        
        setUsers(transformedUsers);
        console.log('✅ Loaded organization users from Supabase fallback');
      } catch (supabaseError) {
        console.error('Error loading users from Supabase:', supabaseError);
      }
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
        title: 'Success',
        description: 'Settings saved successfully!',
      });
      
      // Update local state
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
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
        title: 'Success',
        description: 'User role updated successfully.',
      });
      loadOrganizationUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const suspendUser = async (userId: string) => {
    try {
      await apiClient.put(`/organizations/users/${userId}/suspend`);
      toast({
        title: 'Success',
        description: 'User has been suspended successfully.',
      });
      loadOrganizationUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: 'Error',
        description: 'Failed to suspend user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const testVoiceEngineConnection = async () => {
    if (!settings.voice_engine_private_key) {
      toast({
        title: 'Voice Engine Connection',
        description: 'Provide your private key to test the voice engine connection.',
      });
      return;
    }

    setSaving(true);
    toast({
      title: 'Testing Connection',
      description: 'Verifying voice engine credentials...',
    });

    try {
      const response = await apiClient.post('/voice-engine/test-connection');
      
      if (response.data.success) {
        toast({
          title: 'Connection Successful',
          description: 'Voice Engine connection verified!',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: 'Voice Engine connection test failed. Please check your API key.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing Voice Engine connection:', error);
      toast({
        title: 'Connection Error',
        description: 'Error testing Voice Engine connection. Please try again.',
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
              <h2 className="mb-2 text-xl font-semibold text-white">Access Denied</h2>
              <p className="text-gray-400">
                You don't have permission to access organization settings. Contact your administrator.
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
          <p className="text-sm text-gray-400">Loading organization settings...</p>
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
              <h1 className="text-3xl font-bold text-white">Organization Settings</h1>
              <p className="text-gray-400">
                Manage your organization's configuration and team members
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Team Members</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Permissions</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>Billing</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Users className="h-5 w-5 text-emerald-500" />
                    <span>Team Members</span>
                  </CardTitle>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Invite User
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
                              {user.role.replace('client_', '').charAt(0).toUpperCase() + user.role.replace('client_', '').slice(1)}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                user.status === 'active' ? 'border-emerald-500 text-emerald-400' :
                                user.status === 'pending' ? 'border-yellow-500 text-yellow-400' :
                                'border-red-500 text-red-400'
                              }`}
                            >
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
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
                            <SelectItem value="client_admin">Admin</SelectItem>
                            <SelectItem value="client_user">User</SelectItem>
                            <SelectItem value="client_viewer">Viewer</SelectItem>
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
                                <AlertDialogTitle className="text-white">Suspend User</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  Are you sure you want to suspend {user.email}? They will lose access to the organization.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => suspendUser(user.id)}
                                  className="bg-red-600 text-white hover:bg-red-700"
                                >
                                  Suspend User
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
                <h3 className="mb-2 text-lg font-semibold text-white">Permissions</h3>
                <p className="text-gray-400">Permissions management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-12 text-center">
                <Wallet className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <h3 className="mb-2 text-lg font-semibold text-white">Billing Settings</h3>
                <p className="text-gray-400">Billing configuration coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-12 text-center">
                <Globe className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <h3 className="mb-2 text-lg font-semibold text-white">General Settings</h3>
                <p className="text-gray-400">General settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizationSettings;