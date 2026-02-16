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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase-client';
import {
    Building2,
    Clock,
    Globe,
    Loader2,
    Mail,
    Phone,
    Plus,
    Save,
    Settings,
    Shield,
    UserCheck,
    UserX,
    Users,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface OrgSettings {
  name: string;
  billing_email: string;
  webhook_url: string;
  max_concurrent_calls: number;
  default_user_role: string;
  timezone: string;
  compliance_settings: {
    tcpa_enabled: boolean;
    do_not_call_enabled: boolean;
    recording_consent: boolean;
  };
}

interface OrgMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

const TIMEZONES = (() => {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'Europe/London',
      'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
      'Australia/Sydney', 'Pacific/Auckland',
    ];
  }
})();

const OrganizationSettingsPage: React.FC = () => {
  const { organization, dbUser } = useSupabaseAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [settings, setSettings] = useState<OrgSettings>({
    name: '',
    billing_email: '',
    webhook_url: '',
    max_concurrent_calls: 10,
    default_user_role: 'client_user',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    compliance_settings: {
      tcpa_enabled: false,
      do_not_call_enabled: false,
      recording_consent: false,
    },
  });

  const isAdmin = dbUser?.role === 'client_admin' || dbUser?.role === 'platform_owner';

  const loadSettings = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const { data: org, error } = await supabase
        .from('organizations')
        .select('name, billing_email, webhook_url, max_concurrent_calls, default_user_role, settings, compliance_settings')
        .eq('id', organization.id)
        .single();

      if (error) throw error;
      if (org) {
        setSettings({
          name: org.name || '',
          billing_email: org.billing_email || '',
          webhook_url: org.webhook_url || '',
          max_concurrent_calls: org.max_concurrent_calls || 10,
          default_user_role: org.default_user_role || 'client_user',
          timezone: org.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          compliance_settings: org.compliance_settings || {
            tcpa_enabled: false,
            do_not_call_enabled: false,
            recording_consent: false,
          },
        });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to load organization settings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [organization?.id, toast]);

  const loadMembers = useCallback(async () => {
    if (!organization?.id) return;
    try {
      const { data: memberRows, error } = await supabase
        .from('organization_members')
        .select('id, user_id, role, created_at, profiles:user_id(email, first_name, last_name)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      const mapped: OrgMember[] = (memberRows || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        created_at: m.created_at,
        email: m.profiles?.email || 'Unknown',
        first_name: m.profiles?.first_name,
        last_name: m.profiles?.last_name,
      }));
      setMembers(mapped);
    } catch (err: any) {
      console.error('Failed to load members:', err);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
      loadMembers();
    } else {
      setLoading(false);
    }
  }, [isAdmin, loadSettings, loadMembers]);

  const saveSettings = async () => {
    if (!organization?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: settings.name.trim(),
          billing_email: settings.billing_email.trim() || null,
          webhook_url: settings.webhook_url.trim() || null,
          max_concurrent_calls: settings.max_concurrent_calls,
          default_user_role: settings.default_user_role,
          settings: { timezone: settings.timezone },
          compliance_settings: settings.compliance_settings,
        })
        .eq('id', organization.id);

      if (error) throw error;
      toast({ title: 'Saved', description: 'Organization settings updated successfully.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      toast({ title: 'Updated', description: 'Member role updated.' });
      loadMembers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update role.', variant: 'destructive' });
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      toast({ title: 'Removed', description: 'Member has been removed from the organization.' });
      loadMembers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to remove member.', variant: 'destructive' });
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
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-gray-400">Loading organization settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Settings className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Organization Settings</h1>
              <p className="text-gray-400">Manage your organization's configuration and team</p>
            </div>
          </div>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Building2 className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Team ({members.length})</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Compliance</span>
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Building2 className="h-5 w-5 text-emerald-400" />
                    Organization Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Organization Name</Label>
                    <Input
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                      className="mt-1 border-gray-700 bg-gray-800 text-white"
                      placeholder="My Organization"
                    />
                  </div>
                  <div>
                    <Label className="text-white flex items-center gap-1"><Mail className="h-3 w-3" /> Billing Email</Label>
                    <Input
                      value={settings.billing_email}
                      onChange={(e) => setSettings({ ...settings, billing_email: e.target.value })}
                      className="mt-1 border-gray-700 bg-gray-800 text-white"
                      placeholder="billing@company.com"
                      type="email"
                    />
                  </div>
                  <div>
                    <Label className="text-white flex items-center gap-1"><Globe className="h-3 w-3" /> Webhook URL</Label>
                    <Input
                      value={settings.webhook_url}
                      onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                      className="mt-1 border-gray-700 bg-gray-800 text-white"
                      placeholder="https://your-server.com/webhook"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Phone className="h-5 w-5 text-emerald-400" />
                    Call Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Max Concurrent Calls</Label>
                    <Input
                      type="number"
                      value={settings.max_concurrent_calls}
                      onChange={(e) => setSettings({ ...settings, max_concurrent_calls: parseInt(e.target.value) || 10 })}
                      className="mt-1 border-gray-700 bg-gray-800 text-white"
                      min="1"
                      max="100"
                    />
                    <p className="mt-1 text-xs text-gray-500">Maximum simultaneous calls allowed</p>
                  </div>
                  <div>
                    <Label className="text-white">Default User Role</Label>
                    <Select
                      value={settings.default_user_role}
                      onValueChange={(v) => setSettings({ ...settings, default_user_role: v })}
                    >
                      <SelectTrigger className="mt-1 border-gray-700 bg-gray-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="client_admin">Admin</SelectItem>
                        <SelectItem value="client_user">User</SelectItem>
                        <SelectItem value="client_viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-gray-500">Role assigned to new team members</p>
                  </div>
                  <div>
                    <Label className="text-white flex items-center gap-1"><Clock className="h-3 w-3" /> Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(v) => setSettings({ ...settings, timezone: v })}
                    >
                      <SelectTrigger className="mt-1 border-gray-700 bg-gray-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Users className="h-5 w-5 text-emerald-500" />
                    <span>Team Members</span>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                    <p className="text-gray-400">No team members found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => {
                      const displayName = member.first_name && member.last_name
                        ? `${member.first_name} ${member.last_name}`
                        : member.email;
                      const isSelf = member.user_id === dbUser?.id;
                      return (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-sm font-bold text-white">
                              {displayName[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {displayName}
                                {isSelf && <span className="ml-2 text-xs text-gray-500">(you)</span>}
                              </p>
                              <p className="text-sm text-gray-400">{member.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {member.role.replace('client_', '')}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Joined {new Date(member.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          {!isSelf && (
                            <div className="flex items-center space-x-2">
                              <Select
                                value={member.role}
                                onValueChange={(newRole) => updateMemberRole(member.id, newRole)}
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
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:bg-red-600/20">
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-gray-900 border-gray-800">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Remove Member</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">
                                      Are you sure you want to remove {member.email} from the organization?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => removeMember(member.id)}
                                      className="bg-red-600 text-white hover:bg-red-700"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  Compliance Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure regulatory compliance for your voice campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-4">
                  <div>
                    <span className="font-medium text-white">TCPA Compliance</span>
                    <p className="text-sm text-gray-400">Enforce Telephone Consumer Protection Act rules</p>
                  </div>
                  <Switch
                    checked={settings.compliance_settings.tcpa_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        compliance_settings: { ...settings.compliance_settings, tcpa_enabled: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-4">
                  <div>
                    <span className="font-medium text-white">Do Not Call List</span>
                    <p className="text-sm text-gray-400">Check numbers against DNC registry before dialing</p>
                  </div>
                  <Switch
                    checked={settings.compliance_settings.do_not_call_enabled}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        compliance_settings: { ...settings.compliance_settings, do_not_call_enabled: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-4">
                  <div>
                    <span className="font-medium text-white">Recording Consent</span>
                    <p className="text-sm text-gray-400">Require recording consent announcement at call start</p>
                  </div>
                  <Switch
                    checked={settings.compliance_settings.recording_consent}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        compliance_settings: { ...settings.compliance_settings, recording_consent: checked },
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
};

export default OrganizationSettingsPage;
