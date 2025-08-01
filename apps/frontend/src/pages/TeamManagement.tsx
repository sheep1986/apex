import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  Settings,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Building,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: {
    canAccessAllOrganizations: boolean;
    canManageClients: boolean;
    canViewClientData: boolean;
    canManageTeam: boolean;
  };
  isActive: boolean;
  verificationRequired: boolean;
  lastLogin?: string;
  createdAt: string;
}

export default function TeamManagement() {
  const { t } = useTranslation(['common']);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const { toast } = useToast();

  // Form state for adding team member
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'support_agent',
    permissions: {
      canAccessAllOrganizations: true,
      canManageClients: false,
      canViewClientData: true,
      canManageTeam: false,
    },
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/team/members`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || 'mock-dev-token'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeamMember = async () => {
    setIsAddingMember(true);
    try {
      const response = await fetch(`${API_BASE_URL}/team/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token') || 'mock-dev-token'}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: t('team.addMemberDialog.memberAdded'),
          description: t('team.addMemberDialog.invitationSent', { email: formData.email }),
        });
        setShowAddMember(false);
        fetchTeamMembers();
        // Reset form
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          role: 'support_agent',
          permissions: {
            canAccessAllOrganizations: true,
            canManageClients: false,
            canViewClientData: true,
            canManageTeam: false,
          },
        });
      } else {
        throw new Error(result.error || 'Failed to add team member');
      }
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast({
        title: t('error'),
        description: error.message || t('team.addMemberDialog.failedToAdd'),
        variant: 'destructive',
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  const updatePermissions = (permission: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value,
      },
    }));
  };

  const rolePermissionPresets = {
    support_admin: {
      canAccessAllOrganizations: true,
      canManageClients: true,
      canViewClientData: true,
      canManageTeam: true,
    },
    support_agent: {
      canAccessAllOrganizations: true,
      canManageClients: false,
      canViewClientData: true,
      canManageTeam: false,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-400">{t('team.description')}</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {t('team.totalMembers')}
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{teamMembers.length}</div>
              <p className="mt-1 text-xs text-gray-500">{t('team.activeStaff')}</p>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{t('team.supportAdmins')}</CardTitle>
              <Shield className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {teamMembers.filter((m) => m.role === 'support_admin').length}
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('team.fullAccess')}</p>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {t('team.pendingVerification')}
              </CardTitle>
              <Mail className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {teamMembers.filter((m) => m.verificationRequired).length}
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('team.awaitingSetup')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Team Member Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowAddMember(true)}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {t('team.addMember')}
          </Button>
        </div>

        {/* Team Members List */}
        <Card className="border-gray-700 bg-gray-800/50">
          <CardHeader>
            <CardTitle className="text-white">{t('team.supportTeamMembers')}</CardTitle>
            <CardDescription className="text-gray-400">
              {t('team.teamAccessDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-blue-600 font-semibold text-white">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">
                          {member.firstName} {member.lastName}
                        </h4>
                        <Badge variant={member.role === 'support_admin' ? 'default' : 'secondary'}>
                          {t(`team.roles.${member.role === 'support_admin' ? 'supportAdmin' : 'supportAgent'}`)}
                        </Badge>
                        {member.verificationRequired && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            {t('team.status.pendingVerification')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Permissions */}
                    <div className="flex gap-2">
                      {member.permissions.canAccessAllOrganizations && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Eye className="h-3 w-3" />
                          <span>{t('team.permissions.viewAll')}</span>
                        </div>
                      )}
                      {member.permissions.canManageClients && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Building className="h-3 w-3" />
                          <span>{t('team.permissions.manageClientsShort')}</span>
                        </div>
                      )}
                      {member.permissions.canManageTeam && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Settings className="h-3 w-3" />
                          <span>{t('team.permissions.admin')}</span>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="text-right">
                      {member.isActive ? (
                        <Badge className="bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {t('team.status.active')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{t('team.status.inactive')}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {teamMembers.length === 0 && !isLoading && (
                <div className="py-8 text-center text-gray-400">
                  <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>{t('team.noMembersYet')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Team Member Dialog */}
        <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
          <DialogContent className="max-w-2xl border-gray-800 bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>{t('team.addMemberDialog.title')}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {t('team.addMemberDialog.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('team.addMemberDialog.firstName')}</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="border-gray-700 bg-gray-800"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('team.addMemberDialog.lastName')}</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="border-gray-700 bg-gray-800"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('team.addMemberDialog.email')}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border-gray-700 bg-gray-800"
                  placeholder="john@example.com"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>{t('team.addMemberDialog.role')}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      role: value,
                      permissions:
                        rolePermissionPresets[value as keyof typeof rolePermissionPresets],
                    });
                  }}
                >
                  <SelectTrigger className="border-gray-700 bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem value="support_admin">{t('team.roles.supportAdmin')}</SelectItem>
                    <SelectItem value="support_agent">{t('team.roles.supportAgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <Label>{t('team.addMemberDialog.permissions')}</Label>
                <div className="space-y-3 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{t('team.permissions.accessAllOrganizations')}</span>
                    </div>
                    <Checkbox
                      checked={formData.permissions.canAccessAllOrganizations}
                      onCheckedChange={(checked) =>
                        updatePermissions('canAccessAllOrganizations', checked as boolean)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{t('team.permissions.manageClients')}</span>
                    </div>
                    <Checkbox
                      checked={formData.permissions.canManageClients}
                      onCheckedChange={(checked) =>
                        updatePermissions('canManageClients', checked as boolean)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{t('team.permissions.viewClientData')}</span>
                    </div>
                    <Checkbox
                      checked={formData.permissions.canViewClientData}
                      onCheckedChange={(checked) =>
                        updatePermissions('canViewClientData', checked as boolean)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{t('team.permissions.manageTeam')}</span>
                    </div>
                    <Checkbox
                      checked={formData.permissions.canManageTeam}
                      onCheckedChange={(checked) =>
                        updatePermissions('canManageTeam', checked as boolean)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="rounded-lg border border-blue-800 bg-blue-900/20 p-4">
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
                  <div className="text-sm text-gray-300">
                    <p className="mb-1 font-medium text-blue-400">{t('team.addMemberDialog.verificationRequired')}</p>
                    <p>
                      {t('team.addMemberDialog.verificationDescription')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddMember(false)}
                  className="border-gray-700"
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={handleAddTeamMember}
                  disabled={
                    !formData.email || !formData.firstName || !formData.lastName || isAddingMember
                  }
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:opacity-50"
                >
                  {isAddingMember ? t('team.addMemberDialog.sendingInvitation') : t('team.addMemberDialog.sendInvitation')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
