import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Users,
  UserPlus,
  Mail,
  Shield,
  Crown,
  Eye,
  Settings,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  email: string;
  role: 'owner' | 'manager' | 'agent' | 'viewer';
  status: 'active' | 'pending' | 'declined';
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  joinedAt: string;
  invitedBy?: string;
  crmAccessLevel: 'all_leads' | 'campaign_leads' | 'assigned_leads' | 'no_access';
  permissions?: {
    // Campaign permissions
    canEditCampaign?: boolean;
    canViewAnalytics?: boolean;
    canManageTeam?: boolean;
    canStartStop?: boolean;
    // CRM permissions
    canViewLeads?: boolean;
    canEditLeads?: boolean;
    canDeleteLeads?: boolean;
    canExportLeads?: boolean;
    canAssignLeads?: boolean;
  };
  leadPermissions?: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    assign: boolean;
  };
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'manager' | 'agent' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitationToken: string;
  expiresAt: string;
  createdAt: string;
  crmAccessLevel: 'all_leads' | 'campaign_leads' | 'assigned_leads' | 'no_access';
  leadPermissions?: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    assign: boolean;
  };
}

interface CampaignTeamManagerProps {
  campaignId?: string;
  teamMembers: TeamMember[];
  invitations: TeamInvitation[];
  onAddMember: (email: string, role: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onUpdateRole: (memberId: string, role: string) => Promise<void>;
  onResendInvitation: (invitationId: string) => Promise<void>;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  isEditable?: boolean;
}

export const CampaignTeamManager: React.FC<CampaignTeamManagerProps> = ({
  campaignId,
  teamMembers = [],
  invitations = [],
  onAddMember,
  onRemoveMember,
  onUpdateRole,
  onResendInvitation,
  onCancelInvitation,
  isEditable = true,
}) => {
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<string>('agent');
  const [newMemberCrmAccess, setNewMemberCrmAccess] = useState<string>('campaign_leads');
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    // Check if email is already a member or invited
    const emailExists = teamMembers.some(m => m.email === newMemberEmail) ||
                        invitations.some(i => i.email === newMemberEmail && i.status === 'pending');
    
    if (emailExists) {
      toast({
        title: 'Error',
        description: 'This email is already a team member or has a pending invitation',
        variant: 'destructive',
      });
      return;
    }

    setIsInviting(true);
    try {
      await onAddMember(newMemberEmail, newMemberRole);
      setNewMemberEmail('');
      setNewMemberRole('member');
      toast({
        title: 'Invitation Sent',
        description: `Team invitation sent to ${newMemberEmail}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    try {
      await onRemoveMember(memberId);
      toast({
        title: 'Member Removed',
        description: `${memberEmail} has been removed from the campaign`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove team member',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await onUpdateRole(memberId, newRole);
      toast({
        title: 'Role Updated',
        description: 'Team member role has been updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'manager':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'agent':
        return <Users className="h-4 w-4 text-emerald-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'manager':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'agent':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'viewer':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const copyInvitationLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: 'Link Copied',
      description: 'Invitation link copied to clipboard',
    });
  };

  const getCrmAccessDescription = (accessLevel: string) => {
    switch (accessLevel) {
      case 'all_leads':
        return 'Access to all CRM leads';
      case 'campaign_leads':
        return 'Access to campaign leads only';
      case 'assigned_leads':
        return 'Access to assigned leads only';
      case 'no_access':
        return 'No CRM access';
      default:
        return 'Campaign leads only';
    }
  };

  const getCrmAccessColor = (accessLevel: string) => {
    switch (accessLevel) {
      case 'all_leads':
        return 'text-red-400';
      case 'campaign_leads':
        return 'text-blue-400';
      case 'assigned_leads':
        return 'text-emerald-400';
      case 'no_access':
        return 'text-gray-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Users className="mr-2 h-5 w-5" />
          Team Members
          <Badge variant="outline" className="ml-2 border-gray-600 text-gray-400">
            {teamMembers.length} members
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Member */}
        {isEditable && (
          <div className="space-y-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
            <h4 className="flex items-center text-sm font-medium text-white">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Team Member
            </h4>
            <div className="space-y-3">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Input
                    placeholder="Enter email address"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="border-gray-600 bg-gray-800 text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddMember();
                      }
                    }}
                  />
                </div>
                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                  <SelectTrigger className="w-28 border-gray-600 bg-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newMemberCrmAccess} onValueChange={setNewMemberCrmAccess}>
                  <SelectTrigger className="w-40 border-gray-600 bg-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem value="all_leads">All CRM Leads</SelectItem>
                    <SelectItem value="campaign_leads">Campaign Leads</SelectItem>
                    <SelectItem value="assigned_leads">Assigned Only</SelectItem>
                    <SelectItem value="no_access">No CRM Access</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddMember}
                  disabled={isInviting || !newMemberEmail.trim()}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {isInviting ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className={`text-xs ${getCrmAccessColor(newMemberCrmAccess)} ml-2`}>
                🔍 {getCrmAccessDescription(newMemberCrmAccess)}
              </div>
            </div>
            <div className="text-xs text-gray-400">
              💡 <strong>Role & CRM Permissions:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li><strong>Manager:</strong> Full campaign control + team management + CRM access</li>
                <li><strong>Agent:</strong> Campaign execution + lead management + CRM read/write</li>
                <li><strong>Viewer:</strong> Read-only campaign + limited CRM viewing</li>
              </ul>
              <p className="mt-2 text-xs text-blue-400">
                🔍 <strong>CRM Access Levels:</strong> All Leads (full CRM) | Campaign Leads (campaign-specific) | Assigned Only (individual leads) | No Access
              </p>
            </div>
          </div>
        )}

        {/* Current Team Members */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Current Members</h4>
          {teamMembers.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto mb-3 h-12 w-12 text-gray-600" />
              <p className="text-gray-400">No team members yet</p>
              <p className="text-xs text-gray-500">Invite team members to collaborate on this campaign</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/30 p-3"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatarUrl} alt={member.email} />
                      <AvatarFallback className="bg-gray-700 text-gray-300">
                        {member.firstName?.[0] || member.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-white">
                          {member.firstName && member.lastName
                            ? `${member.firstName} ${member.lastName}`
                            : member.email}
                        </p>
                        {getStatusIcon(member.status)}
                      </div>
                      <p className="text-xs text-gray-400">{member.email}</p>
                      <p className={`text-xs ${getCrmAccessColor(member.crmAccessLevel || 'campaign_leads')}`}>
                        🔍 {getCrmAccessDescription(member.crmAccessLevel || 'campaign_leads')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getRoleColor(member.role)}>
                      {getRoleIcon(member.role)}
                      <span className="ml-1 capitalize">{member.role}</span>
                    </Badge>
                    {isEditable && member.role !== 'owner' && (
                      <div className="flex items-center space-x-1">
                        <Select
                          value={member.role}
                          onValueChange={(role) => handleRoleChange(member.id, role)}
                        >
                          <SelectTrigger className="h-8 w-24 border-gray-600 bg-gray-800 text-xs text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-gray-700 bg-gray-800">
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-gray-800 bg-gray-900">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Remove Team Member</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to remove {member.email} from this campaign? They will lose access immediately.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.id, member.email)}
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">Pending Invitations</h4>
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-yellow-500/5 p-3"
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-white">{invitation.email}</p>
                      <p className="text-xs text-gray-400">
                        Invited {new Date(invitation.createdAt).toLocaleDateString()} •{' '}
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getRoleColor(invitation.role)}>
                      {getRoleIcon(invitation.role)}
                      <span className="ml-1 capitalize">{invitation.role}</span>
                    </Badge>
                    <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                      {getStatusIcon(invitation.status)}
                      <span className="ml-1 capitalize">{invitation.status}</span>
                    </Badge>
                    {isEditable && (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInvitationLink(invitation.invitationToken)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                          title="Copy invitation link"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResendInvitation(invitation.id)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-emerald-400"
                          title="Resend invitation"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                              title="Cancel invitation"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="border-gray-800 bg-gray-900">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Cancel Invitation</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to cancel the invitation for {invitation.email}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
                                Keep Invitation
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onCancelInvitation(invitation.id)}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Cancel Invitation
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Management Info */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <div className="flex items-start space-x-2">
            <Settings className="h-4 w-4 text-blue-400 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-blue-400">Team Management</h5>
              <ul className="mt-1 text-xs text-gray-300 space-y-0.5">
                <li>• Only campaign owners and managers can invite team members</li>
                <li>• Team members can collaborate on campaign execution and analytics</li>
                <li>• Invitations expire after 7 days and can be resent</li>
                {campaignId && (
                  <li>• Changes take effect immediately for this campaign</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};