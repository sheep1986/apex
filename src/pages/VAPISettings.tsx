import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Key,
  Webhook,
  Bot,
  Phone,
  TestTube,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  Zap,
  Globe,
  Save,
  Loader2,
  Code,
  Monitor,
  Database,
} from 'lucide-react';
import simpleApiClient from '@/lib/simple-api-client';
import VAPIDebugPanel from '../components/VAPIDebugPanel';

interface VAPISettings {
  apiKey: string;
  webhookUrl: string;
  enabled: boolean;
  assistantId: string;
  phoneNumberId: string;
  voiceId: string;
  language: string;
  maxCallDuration: number;
  recordCalls: boolean;
  transcriptionEnabled: boolean;
  analysisEnabled: boolean;
  customPrompt: string;
  fallbackMessage: string;
  retryAttempts: number;
  timeoutSeconds: number;
  webhookSecret: string;
  testMode: boolean;
}

export default function VAPISettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected');
  const [lastTested, setLastTested] = useState<string | null>(null);

  const [settings, setSettings] = useState<VAPISettings>({
    apiKey: '',
    webhookUrl: 'https://api.apexai.com/webhooks/vapi',
    enabled: false,
    assistantId: '',
    phoneNumberId: '',
    voiceId: 'shimmer',
    language: 'en-US',
    maxCallDuration: 600,
    recordCalls: true,
    transcriptionEnabled: true,
    analysisEnabled: true,
    customPrompt: '',
    fallbackMessage: 'I apologize, but I\'m having technical difficulties. Please try again later or contact support.',
    retryAttempts: 3,
    timeoutSeconds: 30,
    webhookSecret: '',
    testMode: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await simpleApiClient.get('/settings/vapi');
      if (response.data) {
        setSettings({ ...settings, ...response.data });
        setConnectionStatus(response.data.enabled ? 'connected' : 'disconnected');
        setLastTested(response.data.lastTested || null);
      }
    } catch (error) {
      console.error('Error loading VAPI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await simpleApiClient.put('/settings/vapi', settings);
      toast({
        title: 'Settings saved',
        description: 'Your VAPI integration settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving VAPI settings:', error);
      toast({
        title: 'Error saving settings',
        description: 'There was an error saving your settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      setConnectionStatus('testing');
      const response = await simpleApiClient.post('/settings/vapi/test', {
        apiKey: settings.apiKey,
      });
      
      if (response.data.success) {
        setConnectionStatus('connected');
        setLastTested(new Date().toISOString());
        toast({
          title: 'Connection successful',
          description: 'VAPI API connection is working correctly.',
        });
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: 'Connection failed',
          description: response.data.error || 'Failed to connect to VAPI API.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: 'Connection failed',
        description: 'Failed to test VAPI API connection.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'The value has been copied to your clipboard.',
    });
  };

  const generateWebhookSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setSettings({ ...settings, webhookSecret: secret });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading VAPI settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">VAPI Integration</h1>
            <p className="text-gray-400">Configure your VAPI API connection and voice assistant settings</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'testing' ? 'secondary' : 'destructive'}>
                {connectionStatus === 'connected' && <CheckCircle className="mr-1 h-3 w-3" />}
                {connectionStatus === 'testing' && <RefreshCw className="mr-1 h-3 w-3 animate-spin" />}
                {connectionStatus === 'disconnected' && <AlertCircle className="mr-1 h-3 w-3" />}
                {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'testing' ? 'Testing...' : 'Disconnected'}
              </Badge>
              {lastTested && (
                <span className="text-xs text-gray-500">
                  Last tested: {new Date(lastTested).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={testing || !settings.apiKey}
            >
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* API Configuration */}
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Key className="h-5 w-5 text-emerald-400" />
                API Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure your VAPI API credentials and basic settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">API Key</Label>
                <div className="mt-2 flex items-center space-x-2">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    className="border-gray-700 bg-gray-800 text-white"
                    placeholder="Enter your VAPI Private API Key"
                  />
                  <Button variant="outline" size="sm" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(settings.apiKey)}
                    disabled={!settings.apiKey}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-white">Webhook URL</Label>
                <div className="mt-2 flex items-center space-x-2">
                  <Input
                    value={settings.webhookUrl}
                    onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                    className="border-gray-700 bg-gray-800 text-white"
                    placeholder="https://api.apexai.com/webhooks/vapi"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(settings.webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-white">Webhook Secret</Label>
                <div className="mt-2 flex items-center space-x-2">
                  <Input
                    type={showWebhookSecret ? 'text' : 'password'}
                    value={settings.webhookSecret}
                    onChange={(e) => setSettings({ ...settings, webhookSecret: e.target.value })}
                    className="border-gray-700 bg-gray-800 text-white"
                    placeholder="Webhook secret for verification"
                  />
                  <Button variant="outline" size="sm" onClick={() => setShowWebhookSecret(!showWebhookSecret)}>
                    {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateWebhookSecret}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                <div>
                  <span className="font-medium text-white">Enable Integration</span>
                  <p className="text-sm text-gray-400">
                    Turn on VAPI integration for your organization
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                <div>
                  <span className="font-medium text-white">Test Mode</span>
                  <p className="text-sm text-gray-400">
                    Enable test mode for development and testing
                  </p>
                </div>
                <Switch
                  checked={settings.testMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, testMode: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Voice Assistant Configuration */}
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bot className="h-5 w-5 text-emerald-400" />
                Voice Assistant
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure voice settings and assistant behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Assistant ID</Label>
                <Input
                  value={settings.assistantId}
                  onChange={(e) => setSettings({ ...settings, assistantId: e.target.value })}
                  className="mt-2 border-gray-700 bg-gray-800 text-white"
                  placeholder="Your VAPI Assistant ID"
                />
              </div>

              <div>
                <Label className="text-white">Phone Number ID</Label>
                <Input
                  value={settings.phoneNumberId}
                  onChange={(e) => setSettings({ ...settings, phoneNumberId: e.target.value })}
                  className="mt-2 border-gray-700 bg-gray-800 text-white"
                  placeholder="Your VAPI Phone Number ID"
                />
              </div>

              <div>
                <Label className="text-white">Voice</Label>
                <Select
                  value={settings.voiceId}
                  onValueChange={(value) => setSettings({ ...settings, voiceId: value })}
                >
                  <SelectTrigger className="mt-2 border-gray-700 bg-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
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
                <Select
                  value={settings.language}
                  onValueChange={(value) => setSettings({ ...settings, language: value })}
                >
                  <SelectTrigger className="mt-2 border-gray-700 bg-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Max Call Duration (seconds)</Label>
                <Input
                  type="number"
                  value={settings.maxCallDuration}
                  onChange={(e) => setSettings({ ...settings, maxCallDuration: parseInt(e.target.value) || 600 })}
                  className="mt-2 border-gray-700 bg-gray-800 text-white"
                  min="30"
                  max="3600"
                />
              </div>
            </CardContent>
          </Card>

          {/* Call Features */}
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Phone className="h-5 w-5 text-emerald-400" />
                Call Features
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure call recording, transcription, and analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                <div>
                  <span className="font-medium text-white">Record Calls</span>
                  <p className="text-sm text-gray-400">
                    Automatically record all voice calls
                  </p>
                </div>
                <Switch
                  checked={settings.recordCalls}
                  onCheckedChange={(checked) => setSettings({ ...settings, recordCalls: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                <div>
                  <span className="font-medium text-white">Transcription</span>
                  <p className="text-sm text-gray-400">
                    Generate text transcriptions of calls
                  </p>
                </div>
                <Switch
                  checked={settings.transcriptionEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, transcriptionEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                <div>
                  <span className="font-medium text-white">AI Analysis</span>
                  <p className="text-sm text-gray-400">
                    Analyze calls for insights and metrics
                  </p>
                </div>
                <Switch
                  checked={settings.analysisEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, analysisEnabled: checked })}
                />
              </div>

              <div>
                <Label className="text-white">Retry Attempts</Label>
                <Input
                  type="number"
                  value={settings.retryAttempts}
                  onChange={(e) => setSettings({ ...settings, retryAttempts: parseInt(e.target.value) || 3 })}
                  className="mt-2 border-gray-700 bg-gray-800 text-white"
                  min="0"
                  max="10"
                />
              </div>

              <div>
                <Label className="text-white">Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={settings.timeoutSeconds}
                  onChange={(e) => setSettings({ ...settings, timeoutSeconds: parseInt(e.target.value) || 30 })}
                  className="mt-2 border-gray-700 bg-gray-800 text-white"
                  min="5"
                  max="120"
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Configuration */}
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Code className="h-5 w-5 text-emerald-400" />
                Custom Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Customize prompts and fallback messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Custom Prompt</Label>
                <Textarea
                  value={settings.customPrompt}
                  onChange={(e) => setSettings({ ...settings, customPrompt: e.target.value })}
                  className="mt-2 border-gray-700 bg-gray-800 text-white"
                  placeholder="Enter custom instructions for your AI assistant..."
                  rows={4}
                />
              </div>

              <div>
                <Label className="text-white">Fallback Message</Label>
                <Textarea
                  value={settings.fallbackMessage}
                  onChange={(e) => setSettings({ ...settings, fallbackMessage: e.target.value })}
                  className="mt-2 border-gray-700 bg-gray-800 text-white"
                  placeholder="Message to play when the assistant encounters an error..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Panel */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Monitor className="h-5 w-5 text-emerald-400" />
              Debug & Diagnostics
            </CardTitle>
            <CardDescription className="text-gray-400">
              Debug information and connection diagnostics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VAPIDebugPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}