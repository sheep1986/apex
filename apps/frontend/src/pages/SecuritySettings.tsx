import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserX,
  Activity,
  Save,
  Loader2,
  Copy,
  RefreshCw,
  Settings,
  Monitor,
  Database,
  Network,
  Wifi,
} from 'lucide-react';
import simpleApiClient from '@/lib/simple-api-client';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireUppercase: boolean;
  ipWhitelist: string[];
  maxLoginAttempts: number;
  lockoutDuration: number;
  ssoEnabled: boolean;
  ssoProvider: string;
  auditLogging: boolean;
  emailAlerts: boolean;
  suspiciousActivityDetection: boolean;
  deviceTracking: boolean;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  backupEncryption: boolean;
  dataRetentionDays: number;
  gdprCompliance: boolean;
  cookieConsent: boolean;
  anonymizeData: boolean;
}

interface LoginSession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  current: boolean;
}

interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  ipAddress: string;
  success: boolean;
  details: string;
}

export default function SecuritySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewWhitelistIP, setShowNewWhitelistIP] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'sessions' | 'audit' | 'privacy'>('general');

  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true,
    ipWhitelist: [],
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    ssoEnabled: false,
    ssoProvider: 'none',
    auditLogging: true,
    emailAlerts: true,
    suspiciousActivityDetection: true,
    deviceTracking: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
    backupEncryption: true,
    dataRetentionDays: 365,
    gdprCompliance: true,
    cookieConsent: true,
    anonymizeData: false,
  });

  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([
    {
      id: '1',
      device: 'Chrome on MacOS',
      location: 'San Francisco, CA',
      ipAddress: '192.168.1.100',
      lastActive: '2024-01-15T10:30:00Z',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'San Francisco, CA',
      ipAddress: '192.168.1.101',
      lastActive: '2024-01-14T15:20:00Z',
      current: false,
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: '1',
      action: 'Login',
      user: 'john.doe@example.com',
      timestamp: '2024-01-15T10:30:00Z',
      ipAddress: '192.168.1.100',
      success: true,
      details: 'Successful login from Chrome',
    },
    {
      id: '2',
      action: 'Settings Changed',
      user: 'john.doe@example.com',
      timestamp: '2024-01-15T10:25:00Z',
      ipAddress: '192.168.1.100',
      success: true,
      details: 'Updated security settings',
    },
    {
      id: '3',
      action: 'Failed Login',
      user: 'attacker@example.com',
      timestamp: '2024-01-15T09:15:00Z',
      ipAddress: '192.168.1.200',
      success: false,
      details: 'Invalid credentials',
    },
  ]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await simpleApiClient.get('/settings/security');
      if (response.data) {
        setSettings({ ...settings, ...response.data });
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await simpleApiClient.put('/settings/security', settings);
      toast({
        title: 'Settings saved',
        description: 'Your security settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast({
        title: 'Error saving settings',
        description: 'There was an error saving your settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addIPToWhitelist = () => {
    if (showNewWhitelistIP && !settings.ipWhitelist.includes(showNewWhitelistIP)) {
      setSettings({
        ...settings,
        ipWhitelist: [...settings.ipWhitelist, showNewWhitelistIP],
      });
      setShowNewWhitelistIP('');
    }
  };

  const removeIPFromWhitelist = (ip: string) => {
    setSettings({
      ...settings,
      ipWhitelist: settings.ipWhitelist.filter(item => item !== ip),
    });
  };

  const revokeSession = (sessionId: string) => {
    setLoginSessions(sessions => sessions.filter(s => s.id !== sessionId));
    toast({
      title: 'Session revoked',
      description: 'The selected session has been terminated.',
    });
  };

  const enable2FA = async () => {
    // This would typically open a modal with QR code
    toast({
      title: '2FA Setup',
      description: 'Two-factor authentication setup would be initiated here.',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading security settings...</p>
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
            <h1 className="text-3xl font-bold text-white">Security Settings</h1>
            <p className="text-gray-400">Manage your account security and access controls</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={settings.twoFactorEnabled ? 'default' : 'secondary'}>
                {settings.twoFactorEnabled ? (
                  <CheckCircle className="mr-1 h-3 w-3" />
                ) : (
                  <AlertTriangle className="mr-1 h-3 w-3" />
                )}
                2FA {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Badge variant={settings.auditLogging ? 'default' : 'secondary'}>
                <Activity className="mr-1 h-3 w-3" />
                Audit Logging {settings.auditLogging ? 'On' : 'Off'}
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
            { id: 'general', label: 'General Security', icon: Shield },
            { id: 'sessions', label: 'Active Sessions', icon: Monitor },
            { id: 'audit', label: 'Audit Logs', icon: Activity },
            { id: 'privacy', label: 'Privacy & Data', icon: Database },
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

        {/* General Security Tab */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Authentication */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Key className="h-5 w-5 text-emerald-400" />
                  Authentication
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure authentication methods and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Two-Factor Authentication</span>
                    <p className="text-sm text-gray-400">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.twoFactorEnabled}
                      onCheckedChange={(checked) => {
                        if (checked && !settings.twoFactorEnabled) {
                          enable2FA();
                        } else {
                          setSettings({ ...settings, twoFactorEnabled: checked });
                        }
                      }}
                    />
                    {!settings.twoFactorEnabled && (
                      <Button variant="outline" size="sm" onClick={enable2FA}>
                        Setup
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-white">Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    min="5"
                    max="480"
                  />
                </div>

                <div>
                  <Label className="text-white">Max Login Attempts</Label>
                  <Input
                    type="number"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    min="1"
                    max="10"
                  />
                </div>

                <div>
                  <Label className="text-white">Lockout Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.lockoutDuration}
                    onChange={(e) => setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) || 15 })}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    min="1"
                    max="1440"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Policy */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Lock className="h-5 w-5 text-emerald-400" />
                  Password Policy
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Set password requirements and expiration rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Minimum Length</Label>
                  <Input
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) || 8 })}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    min="6"
                    max="32"
                  />
                </div>

                <div>
                  <Label className="text-white">Password Expiry (days)</Label>
                  <Input
                    type="number"
                    value={settings.passwordExpiry}
                    onChange={(e) => setSettings({ ...settings, passwordExpiry: parseInt(e.target.value) || 90 })}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    min="0"
                    max="365"
                  />
                  <p className="mt-1 text-xs text-gray-500">Set to 0 to disable expiration</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                    <span className="text-white">Require Special Characters</span>
                    <Switch
                      checked={settings.passwordRequireSpecialChars}
                      onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireSpecialChars: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                    <span className="text-white">Require Numbers</span>
                    <Switch
                      checked={settings.passwordRequireNumbers}
                      onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireNumbers: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                    <span className="text-white">Require Uppercase Letters</span>
                    <Switch
                      checked={settings.passwordRequireUppercase}
                      onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireUppercase: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* IP Whitelist */}
            <Card className="border-gray-800 bg-gray-900 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Globe className="h-5 w-5 text-emerald-400" />
                  IP Whitelist
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Restrict access to specific IP addresses or ranges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Enter IP address (e.g., 192.168.1.100)"
                    value={showNewWhitelistIP}
                    onChange={(e) => setShowNewWhitelistIP(e.target.value)}
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                  <Button onClick={addIPToWhitelist} disabled={!showNewWhitelistIP}>
                    Add IP
                  </Button>
                </div>

                <div className="space-y-2">
                  {settings.ipWhitelist.length === 0 ? (
                    <p className="text-gray-400">No IP restrictions configured. All IPs are allowed.</p>
                  ) : (
                    settings.ipWhitelist.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                        <span className="font-mono text-white">{ip}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeIPFromWhitelist(ip)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monitoring & Alerts */}
            <Card className="border-gray-800 bg-gray-900 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="h-5 w-5 text-emerald-400" />
                  Monitoring & Alerts
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure security monitoring and alert preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Audit Logging</span>
                    <p className="text-sm text-gray-400">Log all security events</p>
                  </div>
                  <Switch
                    checked={settings.auditLogging}
                    onCheckedChange={(checked) => setSettings({ ...settings, auditLogging: checked })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Email Alerts</span>
                    <p className="text-sm text-gray-400">Send security alerts via email</p>
                  </div>
                  <Switch
                    checked={settings.emailAlerts}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Suspicious Activity Detection</span>
                    <p className="text-sm text-gray-400">AI-powered threat detection</p>
                  </div>
                  <Switch
                    checked={settings.suspiciousActivityDetection}
                    onCheckedChange={(checked) => setSettings({ ...settings, suspiciousActivityDetection: checked })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Device Tracking</span>
                    <p className="text-sm text-gray-400">Track login devices and locations</p>
                  </div>
                  <Switch
                    checked={settings.deviceTracking}
                    onCheckedChange={(checked) => setSettings({ ...settings, deviceTracking: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Sessions Tab */}
        {activeTab === 'sessions' && (
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Monitor className="h-5 w-5 text-emerald-400" />
                Active Sessions
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage your active login sessions across devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loginSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600">
                      <Monitor className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{session.device}</span>
                        {session.current && (
                          <Badge variant="outline" className="text-xs text-emerald-400">
                            Current Session
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {session.location} • {session.ipAddress}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last active: {new Date(session.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-emerald-400" />
                Audit Logs
              </CardTitle>
              <CardDescription className="text-gray-400">
                Review security events and system activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      log.success ? 'bg-emerald-600' : 'bg-red-600'
                    }`}>
                      {log.success ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{log.action}</span>
                        <Badge variant={log.success ? 'default' : 'destructive'}>
                          {log.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">
                        {log.user} • {log.ipAddress}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()} • {log.details}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Privacy & Data Tab */}
        {activeTab === 'privacy' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Data Protection */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Database className="h-5 w-5 text-emerald-400" />
                  Data Protection
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure data encryption and retention policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Encryption at Rest</span>
                    <p className="text-sm text-gray-400">Encrypt stored data</p>
                  </div>
                  <Switch
                    checked={settings.encryptionAtRest}
                    onCheckedChange={(checked) => setSettings({ ...settings, encryptionAtRest: checked })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Encryption in Transit</span>
                    <p className="text-sm text-gray-400">Encrypt data transmission</p>
                  </div>
                  <Switch
                    checked={settings.encryptionInTransit}
                    onCheckedChange={(checked) => setSettings({ ...settings, encryptionInTransit: checked })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Backup Encryption</span>
                    <p className="text-sm text-gray-400">Encrypt backup files</p>
                  </div>
                  <Switch
                    checked={settings.backupEncryption}
                    onCheckedChange={(checked) => setSettings({ ...settings, backupEncryption: checked })}
                  />
                </div>

                <div>
                  <Label className="text-white">Data Retention (days)</Label>
                  <Input
                    type="number"
                    value={settings.dataRetentionDays}
                    onChange={(e) => setSettings({ ...settings, dataRetentionDays: parseInt(e.target.value) || 365 })}
                    className="mt-2 border-gray-700 bg-gray-800 text-white"
                    min="30"
                    max="2555"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  Compliance
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Privacy regulations and compliance settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">GDPR Compliance</span>
                    <p className="text-sm text-gray-400">Enable GDPR features</p>
                  </div>
                  <Switch
                    checked={settings.gdprCompliance}
                    onCheckedChange={(checked) => setSettings({ ...settings, gdprCompliance: checked })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Cookie Consent</span>
                    <p className="text-sm text-gray-400">Require cookie consent</p>
                  </div>
                  <Switch
                    checked={settings.cookieConsent}
                    onCheckedChange={(checked) => setSettings({ ...settings, cookieConsent: checked })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
                  <div>
                    <span className="font-medium text-white">Anonymize Data</span>
                    <p className="text-sm text-gray-400">Remove personal identifiers</p>
                  </div>
                  <Switch
                    checked={settings.anonymizeData}
                    onCheckedChange={(checked) => setSettings({ ...settings, anonymizeData: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}