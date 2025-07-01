import { useState } from 'react'
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
  Smartphone
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Separator } from '../components/ui/separator'

interface SettingsData {
  profile: {
    name: string
    email: string
    company: string
    timezone: string
    language: string
  }
  notifications: {
    callAlerts: boolean
    systemUpdates: boolean
    performance: boolean
    billing: boolean
    email: boolean
    push: boolean
    sms: boolean
  }
  security: {
    twoFactorEnabled: boolean
    sessionTimeout: number
    passwordExpiry: number
    ipWhitelist: string[]
  }
  integrations: {
    vapi: {
      apiKey: string
      webhookUrl: string
      enabled: boolean
    }
    crm: {
      type: string
      apiKey: string
      syncEnabled: boolean
    }
    analytics: {
      googleAnalytics: string
      mixpanel: string
      enabled: boolean
    }
  }
  appearance: {
    theme: 'dark' | 'light' | 'auto'
    accentColor: string
    compactMode: boolean
  }
  voice: {
    defaultVoice: string
    language: string
    speed: number
    pitch: number
  }
}

export function Settings() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [settings, setSettings] = useState<SettingsData>({
    profile: {
      name: 'Sarah Johnson',
      email: 'sarah@apexai.com',
      company: 'Apex AI Solutions',
      timezone: 'America/New_York',
      language: 'en-US'
    },
    notifications: {
      callAlerts: true,
      systemUpdates: true,
      performance: false,
      billing: true,
      email: true,
      push: true,
      sms: false
    },
    security: {
      twoFactorEnabled: true,
      sessionTimeout: 30,
      passwordExpiry: 90,
      ipWhitelist: ['192.168.1.1', '10.0.0.1']
    },
    integrations: {
      vapi: {
        apiKey: 'vapi_sk_1234567890abcdef',
        webhookUrl: 'https://api.apexai.com/webhooks/vapi',
        enabled: true
      },
      crm: {
        type: 'salesforce',
        apiKey: 'sf_1234567890abcdef',
        syncEnabled: true
      },
      analytics: {
        googleAnalytics: 'GA-123456789',
        mixpanel: 'mp_1234567890abcdef',
        enabled: true
      }
    },
    appearance: {
      theme: 'dark',
      accentColor: '#ec4899',
      compactMode: false
    },
    voice: {
      defaultVoice: 'shimmer',
      language: 'en-US',
      speed: 1.0,
      pitch: 1.0
    }
  })

  const handleSave = () => {
    // Save settings logic here
    console.log('Settings saved:', settings)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Configure your platform preferences and integrations</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Config
          </Button>
          <Button 
            className="bg-gradient-to-r from-brand-pink to-brand-magenta"
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-gray-900 border-gray-800">
          <TabsTrigger value="profile" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
            <Webhook className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="voice" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
            <Mic className="w-4 h-4 mr-2" />
            Voice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Profile Information</CardTitle>
              <CardDescription className="text-gray-400">
                Update your personal and company information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-white">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.profile.name}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, name: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, email: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="company" className="text-white">Company</Label>
                  <Input
                    id="company"
                    value={settings.profile.company}
                    onChange={(e) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, company: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone" className="text-white">Timezone</Label>
                  <Select 
                    value={settings.profile.timezone}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      profile: { ...settings.profile, timezone: value }
                    })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
              <CardDescription className="text-gray-400">
                Choose how and when you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-white font-medium mb-4">Call Alerts</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Call alerts and updates</span>
                    </div>
                    <Switch
                      checked={settings.notifications.callAlerts}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, callAlerts: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Performance notifications</span>
                    </div>
                    <Switch
                      checked={settings.notifications.performance}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, performance: checked }
                      })}
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div>
                <h4 className="text-white font-medium mb-4">System Updates</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Zap className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">System updates and maintenance</span>
                    </div>
                    <Switch
                      checked={settings.notifications.systemUpdates}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, systemUpdates: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Billing and payment alerts</span>
                    </div>
                    <Switch
                      checked={settings.notifications.billing}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, billing: checked }
                      })}
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div>
                <h4 className="text-white font-medium mb-4">Delivery Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Email notifications</span>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Push notifications</span>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, push: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">SMS notifications</span>
                    </div>
                    <Switch
                      checked={settings.notifications.sms}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, sms: checked }
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Security Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your account security and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white font-medium">Two-Factor Authentication</p>
                      <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      security: { ...settings.security, twoFactorEnabled: checked }
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="sessionTimeout" className="text-white">Session Timeout (minutes)</Label>
                  <Select 
                    value={settings.security.sessionTimeout.toString()}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      security: { ...settings.security, sessionTimeout: parseInt(value) }
                    })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="passwordExpiry" className="text-white">Password Expiry (days)</Label>
                  <Select 
                    value={settings.security.passwordExpiry.toString()}
                    onValueChange={(value) => setSettings({
                      ...settings,
                      security: { ...settings.security, passwordExpiry: parseInt(value) }
                    })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Vapi AI Integration</CardTitle>
              <CardDescription className="text-gray-400">
                Configure your Vapi AI connection and webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mic className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Enable Vapi AI Integration</span>
                </div>
                <Switch
                  checked={settings.integrations.vapi.enabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    integrations: { 
                      ...settings.integrations, 
                      vapi: { ...settings.integrations.vapi, enabled: checked }
                    }
                  })}
                />
              </div>

              <div>
                <Label htmlFor="vapiKey" className="text-white">API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="vapiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.integrations.vapi.apiKey}
                    onChange={(e) => setSettings({
                      ...settings,
                      integrations: { 
                        ...settings.integrations, 
                        vapi: { ...settings.integrations.vapi, apiKey: e.target.value }
                      }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(settings.integrations.vapi.apiKey)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="webhookUrl" className="text-white">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={settings.integrations.vapi.webhookUrl}
                  onChange={(e) => setSettings({
                    ...settings,
                    integrations: { 
                      ...settings.integrations, 
                      vapi: { ...settings.integrations.vapi, webhookUrl: e.target.value }
                    }
                  })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">CRM Integration</CardTitle>
              <CardDescription className="text-gray-400">
                Connect your CRM system for contact sync
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="crmType" className="text-white">CRM Type</Label>
                <Select 
                  value={settings.integrations.crm.type}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    integrations: { 
                      ...settings.integrations, 
                      crm: { ...settings.integrations.crm, type: value }
                    }
                  })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salesforce">Salesforce</SelectItem>
                    <SelectItem value="hubspot">HubSpot</SelectItem>
                    <SelectItem value="pipedrive">Pipedrive</SelectItem>
                    <SelectItem value="zoho">Zoho CRM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Database className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Enable contact sync</span>
                </div>
                <Switch
                  checked={settings.integrations.crm.syncEnabled}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    integrations: { 
                      ...settings.integrations, 
                      crm: { ...settings.integrations.crm, syncEnabled: checked }
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Appearance Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Customize the look and feel of your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme" className="text-white">Theme</Label>
                <Select 
                  value={settings.appearance.theme}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, theme: value as any }
                  })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="accentColor" className="text-white">Accent Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="accentColor"
                    value={settings.appearance.accentColor}
                    onChange={(e) => setSettings({
                      ...settings,
                      appearance: { ...settings.appearance, accentColor: e.target.value }
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="#ec4899"
                  />
                  <div 
                    className="w-10 h-10 rounded border border-gray-600"
                    style={{ backgroundColor: settings.appearance.accentColor }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Compact mode</span>
                </div>
                <Switch
                  checked={settings.appearance.compactMode}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, compactMode: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Voice Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Configure default voice preferences for AI calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultVoice" className="text-white">Default Voice</Label>
                <Select 
                  value={settings.voice.defaultVoice}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    voice: { ...settings.voice, defaultVoice: value }
                  })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shimmer">Shimmer (Female)</SelectItem>
                    <SelectItem value="joe">Joe (Male)</SelectItem>
                    <SelectItem value="emma">Emma (Female)</SelectItem>
                    <SelectItem value="mike">Mike (Male)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language" className="text-white">Language</Label>
                <Select 
                  value={settings.voice.language}
                  onValueChange={(value) => setSettings({
                    ...settings,
                    voice: { ...settings.voice, language: value }
                  })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
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
                <Label htmlFor="speed" className="text-white">Speech Speed</Label>
                <Input
                  id="speed"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.voice.speed}
                  onChange={(e) => setSettings({
                    ...settings,
                    voice: { ...settings.voice, speed: parseFloat(e.target.value) }
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Slow</span>
                  <span>{settings.voice.speed}x</span>
                  <span>Fast</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 