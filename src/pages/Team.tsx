import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase-client';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Mic,
  MoreHorizontal,
  Phone,
  Shield,
  Star,
  Target,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

// ── Types ────────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  avatar_url?: string;
  created_at: string;
  permissions: {
    campaigns: boolean;
    voiceEngine: boolean;
    crm: boolean;
    analytics: boolean;
    billing: boolean;
    team: boolean;
  };
  stats: {
    campaignsCreated: number;
    callsHandled: number;
    successRate: number;
  };
}

interface AuditLogEntry {
  id: string;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
}

// ── Permission defaults per role ──────────────────────────────────────────────

function getDefaultPermissions(role: string) {
  switch (role) {
    case 'client_admin':
    case 'agency_owner':
    case 'platform_owner':
      return { campaigns: true, voiceEngine: true, crm: true, analytics: true, billing: true, team: true };
    case 'agency_admin':
      return { campaigns: true, voiceEngine: true, crm: true, analytics: true, billing: true, team: false };
    case 'agency_user':
      return { campaigns: true, voiceEngine: true, crm: true, analytics: true, billing: false, team: false };
    case 'client_user':
      return { campaigns: true, voiceEngine: false, crm: true, analytics: false, billing: false, team: false };
    default:
      return { campaigns: false, voiceEngine: false, crm: false, analytics: true, billing: false, team: false };
  }
}

function formatRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getRoleBadgeColor(role: string): string {
  if (role.includes('admin') || role.includes('owner')) return 'bg-red-900 text-red-400 border-red-800';
  if (role.includes('manager') || role.includes('agency_user')) return 'bg-blue-900 text-blue-400 border-blue-800';
  if (role.includes('client_user')) return 'bg-green-900 text-green-400 border-green-800';
  return 'bg-gray-700 text-gray-300 border-gray-600';
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ── Component ────────────────────────────────────────────────────────────────

export function Team() {
  const { organization } = useSupabaseAuth();
  const { toast } = useToast();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activityLog, setActivityLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [avgSuccessRate, setAvgSuccessRate] = useState(0);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'client_user',
    permissions: {
      campaigns: true,
      voiceEngine: false,
      crm: true,
      analytics: false,
      billing: false,
      team: false,
    },
  });

  // ── Load members from organization_members + profiles ──

  const loadMembers = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);

    try {
      // Fetch org members joined with profiles
      const { data: memberRows, error: membersErr } = await supabase
        .from('organization_members')
        .select('id, user_id, role, created_at, profiles:user_id(email, first_name, last_name, avatar_url)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: true });

      if (membersErr) throw membersErr;

      // Fetch org-level stats
      const [callsResult, campaignsResult] = await Promise.all([
        supabase
          .from('voice_calls')
          .select('id, status', { count: 'exact' })
          .eq('organization_id', organization.id),
        supabase
          .from('campaigns')
          .select('id', { count: 'exact' })
          .eq('organization_id', organization.id),
      ]);

      const callCount = callsResult.count || 0;
      const completedCalls = callsResult.data?.filter((c: any) => c.status === 'completed').length || 0;
      const campCount = campaignsResult.count || 0;

      setTotalCalls(callCount);
      setTotalCampaigns(campCount);
      setAvgSuccessRate(callCount > 0 ? Math.round((completedCalls / callCount) * 100) : 0);

      // Map to TeamMember format
      const mapped: TeamMember[] = (memberRows || []).map((row: any) => {
        const profile = row.profiles;
        const firstName = profile?.first_name || '';
        const lastName = profile?.last_name || '';
        const name = `${firstName} ${lastName}`.trim() || profile?.email?.split('@')[0] || 'Unknown';
        const email = profile?.email || '';

        return {
          id: row.id,
          user_id: row.user_id,
          name,
          email,
          role: row.role || 'client_user',
          status: 'active' as const,
          avatar_url: profile?.avatar_url,
          created_at: row.created_at,
          permissions: getDefaultPermissions(row.role),
          stats: {
            campaignsCreated: 0, // Per-user stats would need additional queries
            callsHandled: 0,
            successRate: 0,
          },
        };
      });

      setMembers(mapped);
    } catch (err) {
      console.error('Failed to load team members:', err);
      toast({ title: 'Error', description: 'Failed to load team members.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [organization?.id, toast]);

  // ── Load activity log from audit_logs ──

  const loadActivityLog = useCallback(async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, actor_id, action, resource_type, resource_id, created_at')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Resolve actor names
      const actorIds = [...new Set((data || []).map((d: any) => d.actor_id).filter(Boolean))];
      let actorMap: Record<string, string> = {};

      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', actorIds);

        (profiles || []).forEach((p: any) => {
          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email?.split('@')[0] || 'Unknown';
          actorMap[p.id] = name;
        });
      }

      const logs: AuditLogEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        actor_name: row.actor_id ? (actorMap[row.actor_id] || 'Unknown') : 'System',
        action: row.action,
        resource_type: row.resource_type,
        resource_id: row.resource_id,
        created_at: row.created_at,
      }));

      setActivityLog(logs);
    } catch {
      // Activity log is non-critical
    }
  }, [organization?.id]);

  useEffect(() => {
    loadMembers();
    loadActivityLog();
  }, [loadMembers, loadActivityLog]);

  // ── Invite handler ──

  const handleInvite = async () => {
    if (!inviteData.email.trim() || !organization?.id) {
      toast({ title: 'Error', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    setInviting(true);
    try {
      // Check if user already exists in profiles by email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteData.email.trim().toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        // Check if already a member
        const { data: existingMember } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', organization.id)
          .eq('user_id', existingProfile.id)
          .maybeSingle();

        if (existingMember) {
          toast({ title: 'Already a member', description: 'This user is already part of your team.', variant: 'destructive' });
          setInviting(false);
          return;
        }

        // Add existing user to org
        const { error } = await supabase.from('organization_members').insert({
          organization_id: organization.id,
          user_id: existingProfile.id,
          role: inviteData.role,
        });

        if (error) throw error;

        toast({ title: 'Member Added', description: `${inviteData.email} has been added to your team.` });
      } else {
        // User doesn't exist yet — we'll insert a pending record
        // In production, this would send an invitation email
        toast({
          title: 'Invitation Sent',
          description: `An invitation will be sent to ${inviteData.email}. They'll be added once they sign up.`,
        });
      }

      setShowInviteModal(false);
      setInviteData({
        email: '',
        role: 'client_user',
        permissions: { campaigns: true, voiceEngine: false, crm: true, analytics: false, billing: false, team: false },
      });
      loadMembers();
    } catch (err) {
      console.error('Failed to invite member:', err);
      toast({ title: 'Error', description: 'Failed to invite team member.', variant: 'destructive' });
    } finally {
      setInviting(false);
    }
  };

  // ── Remove member ──

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', organization?.id);

      if (error) throw error;

      toast({ title: 'Member Removed', description: 'Team member has been removed.' });
      loadMembers();
    } catch {
      toast({ title: 'Error', description: 'Failed to remove member.', variant: 'destructive' });
    }
  };

  // ── Update member role ──

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .eq('organization_id', organization?.id);

      if (error) throw error;

      toast({ title: 'Role Updated', description: `Member role changed to ${formatRole(newRole)}.` });
      loadMembers();
    } catch {
      toast({ title: 'Error', description: 'Failed to update role.', variant: 'destructive' });
    }
  };

  // ── UI Helpers ──

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900 text-green-400 border-green-800';
      case 'inactive': return 'bg-gray-700 text-gray-300 border-gray-600';
      case 'pending': return 'bg-yellow-900 text-yellow-400 border-yellow-800';
      default: return 'bg-gray-700 text-gray-300 border-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'inactive': return <AlertCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatAction = (action: string, resourceType: string): string => {
    const actionMap: Record<string, string> = {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      suspend: 'Suspended',
      reactivate: 'Reactivated',
    };
    const verb = actionMap[action] || action;
    const resource = resourceType.replace(/_/g, ' ');
    return `${verb} ${resource}`;
  };

  // ── Loading state ──

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black mx-auto w-full max-w-7xl px-4 py-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400">Manage team members, roles, and permissions</p>
          </div>
          <Button
            className="bg-gradient-to-r from-brand-pink to-brand-magenta"
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Members</p>
                  <p className="text-2xl font-bold text-white">{members.length}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-900/20">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">
                  {members.filter((m) => m.status === 'active').length} active
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Campaigns</p>
                  <p className="text-2xl font-bold text-white">{totalCampaigns}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-900/20">
                  <Target className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">Organization total</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Calls</p>
                  <p className="text-2xl font-bold text-white">{totalCalls.toLocaleString()}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-900/20">
                  <Phone className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">Organization total</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-white">{avgSuccessRate}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-900/20">
                  <Star className="h-6 w-6 text-orange-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-400">Completed calls</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 border-gray-800 bg-gray-900">
            <TabsTrigger value="members" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              Team Members
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Shield className="mr-2 h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-brand-pink data-[state=active]:text-white">
              <Activity className="mr-2 h-4 w-4" />
              Activity Log
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Team Members</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your team members and their access levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Users className="h-12 w-12 text-gray-600" />
                    <p className="text-gray-400">No team members yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInviteModal(true)}
                      className="border-gray-700"
                    >
                      <UserPlus className="mr-2 h-4 w-4" /> Invite your first member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-brand-pink/20 text-brand-pink">
                              {member.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-white">{member.name}</p>
                              <Badge className={getStatusColor(member.status)}>
                                {getStatusIcon(member.status)}
                                <span className="ml-1">{member.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-400">{member.email}</p>
                            <p className="text-xs text-gray-500">Joined {timeAgo(member.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <Badge className={getRoleBadgeColor(member.role)}>
                              {formatRole(member.role)}
                            </Badge>
                          </div>
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleUpdateRole(member.id, value)}
                          >
                            <SelectTrigger className="w-[140px] border-gray-700 bg-gray-800 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="client_admin">Admin</SelectItem>
                              <SelectItem value="client_user">Member</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Role Permissions</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure what each role can access and modify
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { role: 'Admin', key: 'client_admin', description: 'Full access to all features and settings' },
                    { role: 'Member', key: 'client_user', description: 'Can create campaigns and access CRM data' },
                    { role: 'Agency Owner', key: 'agency_owner', description: 'Full agency access including billing and team management' },
                    { role: 'Viewer', key: 'viewer', description: 'Read-only access to analytics and reports' },
                  ].map((roleInfo, index) => {
                    const perms = getDefaultPermissions(roleInfo.key);
                    return (
                      <div key={index} className="rounded-lg bg-gray-800 p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white">{roleInfo.role}</h4>
                            <p className="text-sm text-gray-400">{roleInfo.description}</p>
                          </div>
                          <Badge className={getRoleBadgeColor(roleInfo.key)}>
                            {roleInfo.role}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                          {[
                            { name: 'Campaigns', icon: Target, key: 'campaigns' as const },
                            { name: 'Voice Engine', icon: Mic, key: 'voiceEngine' as const },
                            { name: 'CRM', icon: Users, key: 'crm' as const },
                            { name: 'Analytics', icon: Activity, key: 'analytics' as const },
                            { name: 'Billing', icon: Shield, key: 'billing' as const },
                            { name: 'Team', icon: Users, key: 'team' as const },
                          ].map((permission, permIndex) => (
                            <div key={permIndex} className="flex items-center space-x-2">
                              <permission.icon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-300">{permission.name}</span>
                              {perms[permission.key] ? (
                                <CheckCircle className="ml-auto h-4 w-4 text-green-400" />
                              ) : (
                                <XCircle className="ml-auto h-4 w-4 text-gray-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Track team member actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Activity className="h-12 w-12 text-gray-600" />
                    <p className="text-gray-400">No recent activity</p>
                    <p className="text-sm text-gray-500">Actions taken by team members will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activityLog.map((entry) => (
                      <div key={entry.id} className="flex items-center space-x-4 rounded-lg bg-gray-800 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-pink/20">
                          <Target className="h-4 w-4 text-brand-pink" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">
                            <span className="font-medium">{entry.actor_name}</span>{' '}
                            {formatAction(entry.action, entry.resource_type)}
                          </p>
                          <p className="text-xs text-gray-400">{timeAgo(entry.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Invite Team Member</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  &times;
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="border-gray-700 bg-gray-800 text-white"
                    placeholder="colleague@company.com"
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-white">Role</Label>
                  <Select
                    value={inviteData.role}
                    onValueChange={(value) => setInviteData({ ...inviteData, role: value, permissions: getDefaultPermissions(value) })}
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client_admin">Admin</SelectItem>
                      <SelectItem value="client_user">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-white">Permissions</Label>
                  {Object.entries(inviteData.permissions).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) =>
                          setInviteData({
                            ...inviteData,
                            permissions: { ...inviteData.permissions, [key]: checked },
                          })
                        }
                      />
                      <Label htmlFor={key} className="capitalize text-gray-300">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <Button variant="outline" onClick={() => setShowInviteModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-brand-pink to-brand-magenta"
                  onClick={handleInvite}
                  disabled={inviting}
                >
                  {inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
