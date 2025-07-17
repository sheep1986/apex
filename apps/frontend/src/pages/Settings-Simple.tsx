import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Eye, EyeOff, Copy, Save, Terminal } from 'lucide-react';

export default function SettingsSimple() {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [vapiSettings, setVapiSettings] = useState({
    apiKey: '',
    webhookUrl: 'https://api.apexai.com/webhooks/vapi',
    enabled: false,
  });

  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    company: '',
  });

  // Load data on mount
  useEffect(() => {
    console.log('🎯 Simple Settings component mounted');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('📡 Loading data with direct fetch...');

      // Load user profile
      const userResponse = await fetch('http://localhost:3001/api/user-profile', {
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });

      console.log('👤 User profile status:', userResponse.status);

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('👤 User profile data:', userData);

        setUserProfile({
          name: `${userData.first_name} ${userData.last_name}`,
          email: userData.email,
          company: userData.organization_name || '',
        });

        setOrganizationId(userData.organization_id);

        // Load organization settings
        if (userData.organization_id) {
          const settingsResponse = await fetch(
            `http://localhost:3001/api/organizations/${userData.organization_id}/settings`,
            {
              headers: {
                Authorization: 'Bearer test-token',
                'Content-Type': 'application/json',
              },
            }
          );

          console.log('🏢 Organization settings status:', settingsResponse.status);

          if (settingsResponse.ok) {
            const settingsData = await settingsResponse.json();
            console.log('🏢 Organization settings data:', settingsData);

            if (settingsData.settings?.vapi) {
              setVapiSettings({
                apiKey: settingsData.settings.vapi.apiKey || '',
                webhookUrl:
                  settingsData.settings.vapi.webhookUrl || 'https://api.apexai.com/webhooks/vapi',
                enabled: settingsData.settings.vapi.enabled || false,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast({
        title: 'Error loading data',
        description: 'Failed to load settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Organization ID not found. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Saving settings...');

      const response = await fetch(
        `http://localhost:3001/api/organizations/${organizationId}/settings`,
        {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vapiApiKey: vapiSettings.apiKey,
            vapiPrivateKey: vapiSettings.apiKey,
            vapiWebhookUrl: vapiSettings.webhookUrl,
            vapiEnabled: vapiSettings.enabled,
          }),
        }
      );

      console.log('💾 Save response status:', response.status);

      if (response.ok) {
        toast({
          title: 'Settings saved',
          description: 'Your VAPI integration settings have been updated successfully.',
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Save error:', errorText);
        throw new Error(`Save failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      toast({
        title: 'Error saving settings',
        description: 'There was an error saving your settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const testLoad = async () => {
    console.log('🧪 Testing load...');
    await loadData();
    toast({
      title: 'Test completed',
      description: 'Check the console for detailed results.',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The value has been copied to your clipboard.',
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-white">Settings (Simple)</h1>
            <p className="text-gray-400">Simplified settings page for testing</p>
            <div className="mt-1 text-xs text-gray-500">
              Org ID: {organizationId || 'Loading...'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-yellow-600 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-800/20"
              onClick={testLoad}
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
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 border-gray-800 bg-gray-900">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Your profile information
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
                      value={userProfile.name}
                      readOnly
                      className="border-gray-700 bg-gray-900/50 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={userProfile.email}
                      readOnly
                      className="border-gray-700 bg-gray-900/50 text-white"
                    />
                  </div>
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
                      value={vapiSettings.apiKey}
                      onChange={(e) =>
                        setVapiSettings({
                          ...vapiSettings,
                          apiKey: e.target.value,
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
                      onClick={() => copyToClipboard(vapiSettings.apiKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-white">Webhook URL</Label>
                  <Input
                    value={vapiSettings.webhookUrl}
                    onChange={(e) =>
                      setVapiSettings({
                        ...vapiSettings,
                        webhookUrl: e.target.value,
                      })
                    }
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    placeholder="https://api.apexai.com/webhooks/vapi"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                  <div>
                    <span className="font-medium text-white">Enable Integration</span>
                    <p className="text-sm text-gray-400">
                      Enable VAPI integration for your organization
                    </p>
                  </div>
                  <Switch
                    checked={vapiSettings.enabled}
                    onCheckedChange={(checked) =>
                      setVapiSettings({
                        ...vapiSettings,
                        enabled: checked,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
