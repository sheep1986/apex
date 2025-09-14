import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  Bell,
  Mail,
  Phone,
  Smartphone,
  Clock,
  Volume2,
  VolumeX,
  Activity,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  BarChart3,
  Settings,
  Save,
  Loader2,
  TestTube,
  Send,
  MessageSquare,
  Zap,
  Monitor,
  Calendar,
  Globe,
} from 'lucide-react';
import simpleApiClient from '@/lib/simple-api-client';

interface NotificationSettings {
  // Delivery Methods
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  webhookNotifications: boolean;
  slackNotifications: boolean;
  teamsNotifications: boolean;
  
  // Categories
  callAlerts: boolean;
  campaignUpdates: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
  billingNotifications: boolean;
  performanceAlerts: boolean;
  teamActivity: boolean;
  leadNotifications: boolean;
  appointmentReminders: boolean;
  
  // Frequency & Timing
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  maxNotificationsPerHour: number;
  
  // Thresholds
  callVolumeThreshold: number;
  errorRateThreshold: number;
  responseTimeThreshold: number;
  billingThreshold: number;
  
  // Contact Information
  emailAddress: string;
  phoneNumber: string;
  slackWebhook: string;
  teamsWebhook: string;
  customWebhook: string;
  
  // Advanced Settings
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  desktopNotifications: boolean;
  browserNotifications: boolean;
  emergencyBypass: boolean;
  autoMarkAsRead: boolean;
  groupSimilarNotifications: boolean;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  enabled: boolean;
}

export default function NotificationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'delivery' | 'templates' | 'history'>('preferences');

  const [settings, setSettings] = useState<NotificationSettings>({
    // Delivery Methods
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    webhookNotifications: false,
    slackNotifications: false,
    teamsNotifications: false,
    
    // Categories
    callAlerts: true,
    campaignUpdates: true,
    systemUpdates: true,
    securityAlerts: true,
    billingNotifications: true,
    performanceAlerts: false,
    teamActivity: true,
    leadNotifications: true,
    appointmentReminders: true,
    
    // Frequency & Timing
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    timezone: 'America/New_York',
    digestFrequency: 'immediate',
    maxNotificationsPerHour: 10,
    
    // Thresholds
    callVolumeThreshold: 100,
    errorRateThreshold: 5,
    responseTimeThreshold: 2000,
    billingThreshold: 1000,
    
    // Contact Information
    emailAddress: '',
    phoneNumber: '',
    slackWebhook: '',
    teamsWebhook: '',
    customWebhook: '',
    
    // Advanced Settings
    soundEnabled: true,
    vibrationEnabled: true,
    desktopNotifications: true,
    browserNotifications: true,
    emergencyBypass: true,
    autoMarkAsRead: false,
    groupSimilarNotifications: true,
  });

  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: '1',
      name: 'Call Alert',
      subject: 'New Call Alert - {{campaign_name}}',
      content: 'A new call has been received for campaign {{campaign_name}}. Call ID: {{call_id}}',
      variables: ['campaign_name', 'call_id', 'caller_id'],
      enabled: true,
    },
    {
      id: '2',
      name: 'Campaign Complete',
      subject: 'Campaign {{campaign_name}} Complete',
      content: 'Your campaign {{campaign_name}} has completed with {{total_calls}} calls made.',
      variables: ['campaign_name', 'total_calls', 'success_rate'],
      enabled: true,
    },
  ]);

  const [notificationHistory] = useState([
    {
      id: '1',
      type: 'Call Alert',
      subject: 'New Call Alert - Lead Generation',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'delivered',
      channel: 'email',
    },
    {
      id: '2',
      type: 'System Update',
      subject: 'System Maintenance Scheduled',
      timestamp: '2024-01-15T09:00:00Z',
      status: 'delivered',
      channel: 'push',
    },
    {
      id: '3',
      type: 'Billing Alert',
      subject: 'Monthly Usage Report',
      timestamp: '2024-01-14T15:00:00Z',
      status: 'failed',
      channel: 'sms',
    },
  ]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await simpleApiClient.get('/settings/notifications');
      if (response.data) {
        setSettings({ ...settings, ...response.data });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await simpleApiClient.put('/settings/notifications', settings);
      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: 'Error saving settings',
        description: 'There was an error saving your settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async (channel: string) => {
    try {
      setTesting(true);
      await simpleApiClient.post('/settings/notifications/test', { channel });
      toast({
        title: 'Test notification sent',
        description: `A test notification has been sent via ${channel}.`,
      });
    } catch (error) {
      toast({
        title: 'Test failed',
        description: `Failed to send test notification via ${channel}.`,
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading notification settings...</p>
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
            <h1 className="text-3xl font-bold text-white">Notification Settings</h1>
            <p className="text-gray-400">Configure how and when you receive notifications</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={settings.emailNotifications ? 'default' : 'secondary'}>
                <Mail className="mr-1 h-3 w-3" />
                Email {settings.emailNotifications ? 'On' : 'Off'}
              </Badge>
              <Badge variant={settings.pushNotifications ? 'default' : 'secondary'}>
                <Smartphone className="mr-1 h-3 w-3" />
                Push {settings.pushNotifications ? 'On' : 'Off'}
              </Badge>
              <Badge variant={settings.quietHoursEnabled ? 'default' : 'secondary'}>
                <Clock className="mr-1 h-3 w-3" />
                Quiet Hours {settings.quietHoursEnabled ? 'On' : 'Off'}
              </Badge>
            </div>
          </div>
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

        {/* Tab Navigation */}
        <div className="flex space-x-1 rounded-lg bg-gray-900 p-1">
          {[
            { id: 'preferences', label: 'Preferences', icon: Bell },
            { id: 'delivery', label: 'Delivery Methods', icon: Send },
            { id: 'templates', label: 'Templates', icon: MessageSquare },
            { id: 'history', label: 'History', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Notification Categories */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5 text-emerald-400" />
                  Notification Categories
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Choose which types of notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'callAlerts', label: 'Call Alerts', description: 'New calls and call status updates', icon: Phone },
                  { key: 'campaignUpdates', label: 'Campaign Updates', description: 'Campaign progress and completion', icon: Target },
                  { key: 'systemUpdates', label: 'System Updates', description: 'Platform updates and maintenance', icon: Zap },
                  { key: 'securityAlerts', label: 'Security Alerts', description: 'Login attempts and security events', icon: AlertTriangle },
                  { key: 'billingNotifications', label: 'Billing Notifications', description: 'Invoices and payment alerts', icon: CreditCard },
                  { key: 'performanceAlerts', label: 'Performance Alerts', description: 'System performance and metrics', icon: BarChart3 },
                  { key: 'teamActivity', label: 'Team Activity', description: 'Team member actions and updates', icon: Users },
                  { key: 'leadNotifications', label: 'Lead Notifications', description: 'New leads and lead updates', icon: Users },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <div>
                          <span className="font-medium text-white">{item.label}</span>
                          <p className="text-sm text-gray-400">{item.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings[item.key as keyof NotificationSettings] as boolean}
                        onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Timing & Frequency */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5 text-emerald-400" />
                  Timing & Frequency
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Control when and how often you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Quiet Hours</span>
                    <p className="text-sm text-gray-400">Pause non-critical notifications</p>
                  </div>
                  <Switch
                    checked={settings.quietHoursEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, quietHoursEnabled: checked })}
                  />
                </div>

                {settings.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-800/50 p-4">
                    <div>
                      <Label className="text-gray-300">Start Time</Label>
                      <Input
                        type="time"
                        value={settings.quietHoursStart}
                        onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
                        className="mt-1 border-gray-700 bg-gray-900/50 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">End Time</Label>
                      <Input
                        type="time"
                        value={settings.quietHoursEnd}
                        onChange={(e) => setSettings({ ...settings, quietHoursEnd: e.target.value })}
                        className="mt-1 border-gray-700 bg-gray-900/50 text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-white">Digest Frequency</Label>
                  <Select
                    value={settings.digestFrequency}
                    onValueChange={(value: any) => setSettings({ ...settings, digestFrequency: value })}
                  >
                    <SelectTrigger className="mt-2 border-gray-700 bg-gray-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Max Notifications Per Hour</Label>
                  <Input
                    type="number"
                    value={settings.maxNotificationsPerHour}
                    onChange={(e) => setSettings({ ...settings, maxNotificationsPerHour: parseInt(e.target.value) || 10 })}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    min="1"
                    max="100"
                  />
                </div>

                <div>
                  <Label className="text-white">Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                  >
                    <SelectTrigger className="mt-2 border-gray-700 bg-gray-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
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
              </CardContent>
            </Card>

            {/* Alert Thresholds */}
            <Card className="border-gray-800 bg-gray-900 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                  Alert Thresholds
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure when automatic alerts should be triggered
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <Label className="text-white">Call Volume Threshold</Label>
                  <Input
                    type="number"
                    value={settings.callVolumeThreshold}
                    onChange={(e) => setSettings({ ...settings, callVolumeThreshold: parseInt(e.target.value) || 100 })}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    placeholder="calls per hour"
                  />
                </div>

                <div>
                  <Label className="text-white">Error Rate Threshold (%)</Label>
                  <Input
                    type="number"
                    value={settings.errorRateThreshold}
                    onChange={(e) => setSettings({ ...settings, errorRateThreshold: parseInt(e.target.value) || 5 })}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    placeholder="error percentage"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <Label className="text-white">Response Time Threshold (ms)</Label>
                  <Input
                    type="number"
                    value={settings.responseTimeThreshold}
                    onChange={(e) => setSettings({ ...settings, responseTimeThreshold: parseInt(e.target.value) || 2000 })}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    placeholder="milliseconds"
                  />
                </div>

                <div>
                  <Label className="text-white">Billing Threshold ($)</Label>
                  <Input
                    type="number"
                    value={settings.billingThreshold}
                    onChange={(e) => setSettings({ ...settings, billingThreshold: parseInt(e.target.value) || 1000 })}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    placeholder="dollar amount"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="border-gray-800 bg-gray-900 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5 text-emerald-400" />
                  Advanced Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Additional notification behavior settings
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { key: 'soundEnabled', label: 'Sound Notifications', description: 'Play sound for notifications' },
                  { key: 'vibrationEnabled', label: 'Vibration', description: 'Vibrate mobile device for notifications' },
                  { key: 'desktopNotifications', label: 'Desktop Notifications', description: 'Show desktop popup notifications' },
                  { key: 'browserNotifications', label: 'Browser Notifications', description: 'Show browser notifications' },
                  { key: 'emergencyBypass', label: 'Emergency Bypass', description: 'Allow critical alerts during quiet hours' },
                  { key: 'autoMarkAsRead', label: 'Auto Mark as Read', description: 'Automatically mark notifications as read' },
                  { key: 'groupSimilarNotifications', label: 'Group Similar', description: 'Group similar notifications together' },
                ].map((item, index) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                    <div>
                      <span className="font-medium text-white">{item.label}</span>
                      <p className="text-sm text-gray-400">{item.description}</p>
                    </div>
                    <Switch
                      checked={settings[item.key as keyof NotificationSettings] as boolean}
                      onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delivery Methods Tab */}
        {activeTab === 'delivery' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Email Settings */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="h-5 w-5 text-emerald-400" />
                  Email Notifications
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure email notification settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Enable Email Notifications</span>
                    <p className="text-sm text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>

                {settings.emailNotifications && (
                  <>
                    <div>
                      <Label className="text-white">Email Address</Label>
                      <Input
                        type="email"
                        value={settings.emailAddress}
                        onChange={(e) => setSettings({ ...settings, emailAddress: e.target.value })}
                        className="mt-2 border-gray-700 bg-gray-800 text-white"
                        placeholder="your@email.com"
                      />
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => testNotification('email')}
                      disabled={testing || !settings.emailAddress}
                      className="w-full"
                    >
                      {testing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="mr-2 h-4 w-4" />
                      )}
                      Send Test Email
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Smartphone className="h-5 w-5 text-emerald-400" />
                  Push Notifications
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure mobile and browser push notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Enable Push Notifications</span>
                    <p className="text-sm text-gray-400">Receive push notifications</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                  />
                </div>

                {settings.pushNotifications && (
                  <Button
                    variant="outline"
                    onClick={() => testNotification('push')}
                    disabled={testing}
                    className="w-full"
                  >
                    {testing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="mr-2 h-4 w-4" />
                    )}
                    Send Test Push Notification
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* SMS Settings */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Phone className="h-5 w-5 text-emerald-400" />
                  SMS Notifications
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure SMS text message notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Enable SMS Notifications</span>
                    <p className="text-sm text-gray-400">Receive critical alerts via SMS</p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                  />
                </div>

                {settings.smsNotifications && (
                  <>
                    <div>
                      <Label className="text-white">Phone Number</Label>
                      <Input
                        type="tel"
                        value={settings.phoneNumber}
                        onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                        className="mt-2 border-gray-700 bg-gray-800 text-white"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => testNotification('sms')}
                      disabled={testing || !settings.phoneNumber}
                      className="w-full"
                    >
                      {testing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="mr-2 h-4 w-4" />
                      )}
                      Send Test SMS
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Webhook Settings */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Globe className="h-5 w-5 text-emerald-400" />
                  Webhook Notifications
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Send notifications to custom webhooks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Enable Webhook Notifications</span>
                    <p className="text-sm text-gray-400">Send notifications to custom endpoints</p>
                  </div>
                  <Switch
                    checked={settings.webhookNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, webhookNotifications: checked })}
                  />
                </div>

                {settings.webhookNotifications && (
                  <>
                    <div>
                      <Label className="text-white">Webhook URL</Label>
                      <Input
                        type="url"
                        value={settings.customWebhook}
                        onChange={(e) => setSettings({ ...settings, customWebhook: e.target.value })}
                        className="mt-2 border-gray-700 bg-gray-800 text-white"
                        placeholder="https://your-webhook-url.com/notifications"
                      />
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => testNotification('webhook')}
                      disabled={testing || !settings.customWebhook}
                      className="w-full"
                    >
                      {testing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="mr-2 h-4 w-4" />
                      )}
                      Test Webhook
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
                Notification Templates
              </CardTitle>
              <CardDescription className="text-gray-400">
                Customize notification message templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.map((template) => (
                <div key={template.id} className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{template.name}</span>
                      <Badge variant={template.enabled ? 'default' : 'secondary'}>
                        {template.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <Switch
                      checked={template.enabled}
                      onCheckedChange={(checked) => {
                        setTemplates(templates.map(t => 
                          t.id === template.id ? { ...t, enabled: checked } : t
                        ));
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm text-gray-300">Subject</Label>
                      <p className="text-sm text-white bg-gray-900 p-2 rounded">{template.subject}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-300">Content</Label>
                      <p className="text-sm text-white bg-gray-900 p-2 rounded">{template.content}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-300">Available Variables</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-emerald-400" />
                Notification History
              </CardTitle>
              <CardDescription className="text-gray-400">
                Review recent notification delivery history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notificationHistory.map((notification) => (
                <div key={notification.id} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      notification.status === 'delivered' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}>
                      {notification.status === 'delivered' ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{notification.subject}</span>
                        <Badge variant={notification.status === 'delivered' ? 'default' : 'destructive'}>
                          {notification.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">
                        {notification.type} • {notification.channel}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}