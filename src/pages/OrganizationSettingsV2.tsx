import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Building,
  Users,
  CreditCard,
  Activity,
  Settings,
  Shield,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle,
  Edit,
  Save,
  X,
  Plus,
  Crown,
  Wallet,
  Database,
  Cpu,
  HardDrive,
  Bell,
  Key,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { cn } from '@/lib/utils';
import { organizationService, OrganizationUser } from '@/services/organization-service';
import { VAPIAutoSetup } from '@/components/VAPIAutoSetup';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Team Management Tab Component
const TeamManagementTab: React.FC<{ organizationId: string }> = ({ organizationId }) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('client_user');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [organizationId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await organizationService.getOrganizationUsers(organizationId);
      setUsers(fetchedUsers);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await organizationService.updateUserRole(userId, newRole);
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const handleToggleUserStatus = async (user: OrganizationUser) => {
    try {
      if (user.is_active) {
        await organizationService.deactivateUser(user.id);
      } else {
        await organizationService.activateUser(user.id);
      }
      toast({
        title: 'Success',
        description: `User ${user.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      });
    }
  };

  const handleInviteUser = async () => {
    try {
      await organizationService.inviteUser(organizationId, inviteEmail, inviteRole);
      toast({
        title: 'Success',
        description: 'Invitation sent successfully',
      });
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('client_user');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'client_admin':
        return 'border-purple-500 text-purple-400';
      case 'client_user':
        return 'border-blue-500 text-blue-400';
      default:
        return 'border-gray-500 text-gray-400';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? 'border-emerald-500 text-emerald-400'
      : 'border-red-500 text-red-400';
  };

  if (loading) {
    return (
      <Card className="border-gray-800 bg-gray-900/50">
        <CardContent className="p-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400">Loading team members...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Team Members</CardTitle>
              <CardDescription>Manage your organization's team members and their permissions</CardDescription>
            </div>
            <Button
              onClick={() => setShowInviteDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                      {user.first_name?.[0]}{user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white">
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.email}
                    </p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getRoleBadgeColor(user.role))}
                      >
                        {user.role.replace('client_', '').replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getStatusBadgeColor(user.is_active))}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {user.last_login && (
                        <span className="text-xs text-gray-500">
                          Last login: {new Date(user.last_login).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={user.role}
                    onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
                  >
                    <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="client_admin">Admin</SelectItem>
                      <SelectItem value="client_user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'border-gray-700',
                          user.is_active
                            ? 'text-red-400 hover:bg-red-600/20'
                            : 'text-emerald-400 hover:bg-emerald-600/20'
                        )}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">
                          {user.is_active ? 'Deactivate User' : 'Activate User'}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Are you sure you want to {user.is_active ? 'deactivate' : 'activate'}{' '}
                          {user.email}? {user.is_active
                            ? 'They will no longer be able to access the platform.'
                            : 'They will be able to access the platform again.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleToggleUserStatus(user)}
                          className={
                            user.is_active
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <AlertDialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Invite Team Member</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Send an invitation to a new team member
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="client_admin">Admin</SelectItem>
                  <SelectItem value="client_user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInviteUser}
              disabled={!inviteEmail}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Send Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const OrganizationSettingsV2: React.FC = () => {
  const { organization, stats, isLoading, updateOrganization } = useOrganization();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrg, setEditedOrg] = useState(organization);
  const [showVapiPrivateKey, setShowVapiPrivateKey] = useState(false);
  const [showVapiPublicKey, setShowVapiPublicKey] = useState(false);
  const [vapiPrivateKey, setVapiPrivateKey] = useState(organization?.vapi_private_key || '');
  const [vapiPublicKey, setVapiPublicKey] = useState(organization?.vapi_api_key || ''); // vapi_api_key contains the public key

  useEffect(() => {
    if (organization) {
      console.log('🔑 Loading VAPI keys from organization:', {
        vapi_api_key: organization.vapi_api_key,
        vapi_private_key: organization.vapi_private_key
      });
      // Handle current data structure where vapi_api_key contains the public key
      setVapiPrivateKey(organization.vapi_private_key || '');
      setVapiPublicKey(organization.vapi_api_key || ''); // vapi_api_key contains the public key
      setEditedOrg(organization);
    }
  }, [organization]);

  const handleSaveVapiKey = async (keyType: 'private' | 'public') => {
    try {
      const updates = keyType === 'private' 
        ? { vapi_private_key: vapiPrivateKey }
        : { vapi_api_key: vapiPublicKey }; // Save public key to vapi_api_key for now
        
      await updateOrganization(updates);
      toast({
        title: 'Success',
        description: `VAPI ${keyType} key updated successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update VAPI ${keyType} key`,
        variant: 'destructive',
      });
    }
  };

  if (isLoading || !organization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading organization settings...</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      if (editedOrg) {
        await updateOrganization(editedOrg);
        setIsEditing(false);
        toast({
          title: 'Success',
          description: 'Organization settings updated successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update organization settings',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Import supabase service
      const { supabaseService } = await import('@/services/supabase-service');
      
      // Delete organization
      await supabaseService.client
        .from('organizations')
        .delete()
        .eq('id', organization.id);
        
      toast({
        title: 'Success',
        description: 'Organization deleted successfully',
      });
      
      // Redirect to organizations list
      window.location.href = '/organizations';
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete organization',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-emerald-500 text-emerald-400';
      case 'trial':
        return 'border-yellow-500 text-yellow-400';
      case 'suspended':
        return 'border-red-500 text-red-400';
      default:
        return 'border-gray-500 text-gray-400';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return <Crown className="h-5 w-5 text-purple-400" />;
      case 'professional':
        return <Zap className="h-5 w-5 text-blue-400" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num === -1) return 'Unlimited';
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm">
              <Building className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
              <p className="text-gray-400">Organization Settings & Management</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full justify-start bg-black p-0 h-auto border-b border-gray-800">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 rounded-t-lg px-6 py-3 text-gray-500 hover:text-gray-300 data-[state=active]:bg-gray-900 data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 transition-all mr-2"
            >
              <Building className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="flex items-center gap-2 rounded-t-lg px-6 py-3 text-gray-500 hover:text-gray-300 data-[state=active]:bg-gray-900 data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 transition-all mr-2"
            >
              <Settings className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger 
              value="usage" 
              className="flex items-center gap-2 rounded-t-lg px-6 py-3 text-gray-500 hover:text-gray-300 data-[state=active]:bg-gray-900 data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 transition-all mr-2"
            >
              <Activity className="h-4 w-4" />
              Usage & Limits
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="flex items-center gap-2 rounded-t-lg px-6 py-3 text-gray-500 hover:text-gray-300 data-[state=active]:bg-gray-900 data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 transition-all mr-2"
            >
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger 
              value="team" 
              className="flex items-center gap-2 rounded-t-lg px-6 py-3 text-gray-500 hover:text-gray-300 data-[state=active]:bg-gray-900 data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 transition-all mr-2"
            >
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex items-center gap-2 rounded-t-lg px-6 py-3 text-gray-500 hover:text-gray-300 data-[state=active]:bg-gray-900 data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 transition-all"
            >
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card className="border-gray-800 bg-gray-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-400">
                    <span>Total Users</span>
                    <Users className="h-4 w-4 text-gray-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-gray-500">
                    of {formatNumber(organization.user_limit)} allowed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-400">
                    <span>Active Campaigns</span>
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats?.totalCampaigns || 0}</div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-400">
                    <span>Total Calls</span>
                    <Phone className="h-4 w-4 text-gray-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats?.totalCalls || 0}</div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-400">
                    <span>Monthly Spend</span>
                    <Wallet className="h-4 w-4 text-gray-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(stats?.monthlySpend || 0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Organization Info */}
            <Card className="border-gray-800 bg-gray-900/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Organization Information</CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(true);
                        setEditedOrg(organization);
                      }}
                      className="border-gray-700 hover:bg-gray-800"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditedOrg(organization);
                        }}
                        className="border-gray-700 hover:bg-gray-800"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-gray-400">Organization Name</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.name || ''}
                        onChange={(e) =>
                          setEditedOrg((prev) => prev ? { ...prev, name: e.target.value } : null)
                        }
                        className="bg-gray-800 border-gray-700"
                      />
                    ) : (
                      <p className="text-white">{organization.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400">Industry</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.industry || ''}
                        onChange={(e) =>
                          setEditedOrg((prev) => prev ? { ...prev, industry: e.target.value } : null)
                        }
                        className="bg-gray-800 border-gray-700"
                      />
                    ) : (
                      <p className="text-white">{organization.industry || 'Not specified'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400">Billing Email</Label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={editedOrg?.billing_email || ''}
                        onChange={(e) =>
                          setEditedOrg((prev) => prev ? { ...prev, billing_email: e.target.value } : null)
                        }
                        className="bg-gray-800 border-gray-700"
                      />
                    ) : (
                      <p className="text-white flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-600" />
                        {organization.billing_email || 'Not specified'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400">Phone</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.phone || ''}
                        onChange={(e) =>
                          setEditedOrg((prev) => prev ? { ...prev, phone: e.target.value } : null)
                        }
                        className="bg-gray-800 border-gray-700"
                      />
                    ) : (
                      <p className="text-white flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-600" />
                        {organization.phone || 'Not specified'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400">Website</Label>
                    {isEditing ? (
                      <Input
                        value={editedOrg?.website || ''}
                        onChange={(e) =>
                          setEditedOrg((prev) => prev ? { ...prev, website: e.target.value } : null)
                        }
                        className="bg-gray-800 border-gray-700"
                      />
                    ) : (
                      <p className="text-white flex items-center">
                        <Globe className="mr-2 h-4 w-4 text-gray-600" />
                        {organization.website ? (
                          <a
                            href={organization.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 flex items-center"
                          >
                            {organization.website}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        ) : (
                          'Not specified'
                        )}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-400">Created</Label>
                    <p className="text-white flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-gray-600" />
                      {new Date(organization.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {organization.address && (
                  <div className="space-y-2">
                    <Label className="text-gray-400">Address</Label>
                    <p className="text-white flex items-start">
                      <MapPin className="mr-2 h-4 w-4 text-gray-600 mt-0.5" />
                      {organization.address}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage & Limits Tab */}
          <TabsContent value="usage" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900/50">
              <CardHeader>
                <CardTitle className="text-white">Resource Usage & Limits</CardTitle>
                <CardDescription>Monitor your organization's resource consumption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Users Limit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-400">Users</Label>
                    <span className="text-sm text-gray-500">
                      {stats?.totalUsers || 0} / {formatNumber(organization.user_limit)}
                    </span>
                  </div>
                  <Progress
                    value={
                      organization.user_limit === -1
                        ? 0
                        : ((stats?.totalUsers || 0) / organization.user_limit) * 100
                    }
                    className="h-2 bg-gray-800"
                  />
                </div>

                {/* Calls Limit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-400">Monthly Calls</Label>
                    <span className="text-sm text-gray-500">
                      {stats?.totalCalls || 0} / {formatNumber(organization.call_limit)}
                    </span>
                  </div>
                  <Progress
                    value={
                      organization.call_limit === -1
                        ? 0
                        : ((stats?.totalCalls || 0) / organization.call_limit) * 100
                    }
                    className="h-2 bg-gray-800"
                  />
                </div>

                {/* Storage Limit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-400">Storage</Label>
                    <span className="text-sm text-gray-500">
                      0 GB / {formatNumber(organization.storage_limit_gb)} GB
                    </span>
                  </div>
                  <Progress
                    value={
                      organization.storage_limit_gb === -1
                        ? 0
                        : (0 / organization.storage_limit_gb) * 100
                    }
                    className="h-2 bg-gray-800"
                  />
                </div>

                {/* Credits */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-400">VAPI Credits</Label>
                    <span className="text-sm text-gray-500">
                      {stats?.creditsUsed || 0} used / {stats?.creditsRemaining || 0} remaining
                    </span>
                  </div>
                  <Progress
                    value={
                      ((stats?.creditsUsed || 0) /
                        ((stats?.creditsUsed || 0) + (stats?.creditsRemaining || 0))) *
                      100
                    }
                    className="h-2 bg-gray-800"
                  />
                </div>

                <Separator className="bg-gray-800" />

                {/* Resource Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">API Requests</p>
                          <p className="text-xl font-bold text-white">0</p>
                        </div>
                        <Cpu className="h-8 w-8 text-gray-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Database Size</p>
                          <p className="text-xl font-bold text-white">0 GB</p>
                        </div>
                        <Database className="h-8 w-8 text-gray-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Bandwidth</p>
                          <p className="text-xl font-bold text-white">0 GB</p>
                        </div>
                        <HardDrive className="h-8 w-8 text-gray-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900/50">
              <CardHeader>
                <CardTitle className="text-white">API Configuration</CardTitle>
                <CardDescription>Configure API keys and webhooks for external integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* One-Click VAPI Setup */}
                {(!organization?.vapi_webhook_configured || !vapiPrivateKey) && (
                  <div className="mb-6">
                    <VAPIAutoSetup 
                      organizationId={organization?.id || ''} 
                      onComplete={() => window.location.reload()}
                    />
                  </div>
                )}

                {/* Show manual configuration if already set up */}
                {organization?.vapi_webhook_configured && vapiPrivateKey && (
                  <Alert className="border-green-800 bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-400">
                      VAPI is configured and ready to use. Your assistants are sending calls to our webhook.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Manual Configuration */}
                <div className="space-y-2">
                  <Label className="text-gray-400">VAPI Private Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      type={showVapiPrivateKey ? "text" : "password"}
                      placeholder="Enter your VAPI Private Key"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={vapiPrivateKey}
                      onChange={(e) => setVapiPrivateKey(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      className="border-gray-700"
                      onClick={() => setShowVapiPrivateKey(!showVapiPrivateKey)}
                    >
                      {showVapiPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                      onClick={() => handleSaveVapiKey('private')}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Your VAPI Private key for making calls</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400">VAPI Public Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      type={showVapiPublicKey ? "text" : "password"}
                      placeholder="Enter your VAPI Public Key"
                      className="bg-gray-800 border-gray-700 text-white"
                      value={vapiPublicKey}
                      onChange={(e) => setVapiPublicKey(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      className="border-gray-700"
                      onClick={() => setShowVapiPublicKey(!showVapiPublicKey)}
                    >
                      {showVapiPublicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                      onClick={() => handleSaveVapiKey('public')}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Your VAPI Public key for webhooks</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-400">Webhook URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={`${window.location.origin}/api/webhooks/vapi`}
                      readOnly
                      className="bg-gray-800 border-gray-700 text-gray-400"
                    />
                    <Button variant="outline" className="border-gray-700">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Configure this URL in your VAPI dashboard</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900/50">
              <CardHeader>
                <CardTitle className="text-white">Notification Settings</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-400">Receive email updates for important events</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">SMS Notifications</p>
                    <p className="text-sm text-gray-400">Get SMS alerts for critical issues</p>
                  </div>
                  <Switch />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Weekly Reports</p>
                    <p className="text-sm text-gray-400">Receive weekly performance summaries</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Current Plan</CardTitle>
                    <CardDescription>Manage your subscription and billing</CardDescription>
                  </div>
                  <Badge className="flex items-center space-x-1 px-3 py-1">
                    {getPlanIcon(organization.plan)}
                    <span className="text-xs font-medium uppercase">{organization.plan}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-400">Monthly Cost</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(organization.monthly_cost)}</p>
                      <p className="text-xs text-gray-500">Billed monthly</p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-400">Next Payment</p>
                      <p className="text-2xl font-bold text-white">
                        {organization.last_payment_at
                          ? new Date(new Date(organization.last_payment_at).setMonth(new Date(organization.last_payment_at).getMonth() + 1)).toLocaleDateString()
                          : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">Auto-renewal</p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-700 bg-gray-800/50">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-400">Payment Method</p>
                      <p className="text-lg font-bold text-white flex items-center">
                        <CreditCard className="mr-2 h-4 w-4" />
                        •••• 4242
                      </p>
                      <p className="text-xs text-gray-500">Visa</p>
                    </CardContent>
                  </Card>
                </div>

                <Separator className="bg-gray-800" />

                <div>
                  <h4 className="text-white font-medium mb-4">Payment History</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="text-white">December 2024</p>
                        <p className="text-sm text-gray-400">Professional Plan</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{formatCurrency(299)}</p>
                        <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-400">
                          Paid
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div>
                        <p className="text-white">November 2024</p>
                        <p className="text-sm text-gray-400">Professional Plan</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{formatCurrency(299)}</p>
                        <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-400">
                          Paid
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                  <div>
                    <p className="text-white font-medium">Upgrade to Enterprise</p>
                    <p className="text-sm text-gray-400">Get unlimited resources and priority support</p>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <TeamManagementTab organizationId={organization.id} />
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-gray-800 bg-gray-900/50">
              <CardContent className="p-12 text-center">
                <Shield className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <h3 className="mb-2 text-lg font-semibold text-white">Security Settings</h3>
                <p className="text-gray-400">Configure security and compliance settings</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizationSettingsV2;