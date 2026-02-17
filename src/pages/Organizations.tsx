import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building,
  Users,
  Calendar,
  Search,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  DollarSign,
  PhoneCall,
  Loader2,
  Pause,
  Play,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/auth';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  domain?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'pending' | 'suspended' | 'deleted';
  subscription_plan?: string;
  subscription_status?: string;
  subscription_mrr?: number;
  users_count?: number;
  campaigns_count?: number;
  total_calls?: number;
  monthly_spend?: number;
  created_at: string;
  updated_at: string;
}

interface OrganizationStats {
  totalOrgs: number;
  activeOrgs: number;
  totalRevenue: number;
  totalCalls: number;
}

export function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrgData, setNewOrgData] = useState({ name: '', plan: 'starter', ownerEmail: '' });

  const { getToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch organizations from Supabase
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const { supabaseService } = await import('@/services/supabase-service');
      const orgs = await supabaseService.getOrganizations();

      if (!orgs || orgs.length === 0) {
        setOrganizations([]);
        return;
      }

      // Fetch stats for each org via the Netlify function
      const token = await getToken();
      const transformedOrgs = await Promise.all(
        orgs.map(async (org: any) => {
          let stats = { users_count: 0, campaigns_count: 0, total_calls: 0 };
          try {
            const res = await fetch('/.netlify/functions/organization-admin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ action: 'stats', organizationId: org.id }),
            });
            if (res.ok) stats = await res.json();
          } catch {
            // Stats are non-critical
          }

          return {
            id: org.id,
            name: org.name,
            domain: org.custom_domain || undefined,
            contact_email: org.billing_email,
            contact_phone: org.phone,
            address: org.address,
            status: org.status as any || 'active',
            subscription_plan: org.plan || 'starter',
            subscription_status: org.subscription_status || 'active',
            subscription_mrr: org.monthly_cost || 0,
            users_count: stats.users_count,
            campaigns_count: stats.campaigns_count,
            total_calls: stats.total_calls,
            created_at: org.created_at,
            updated_at: org.updated_at,
          };
        })
      );

      // Filter out deleted orgs
      setOrganizations(transformedOrgs.filter((o) => o.status !== 'deleted'));
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast({ title: 'Error', description: 'Failed to fetch organizations.', variant: 'destructive' });
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  // Create new organization via Netlify function
  const handleCreateOrganization = async () => {
    if (!newOrgData.name.trim()) {
      toast({ title: 'Error', description: 'Organization name is required.', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const token = await getToken();
      const response = await fetch('/.netlify/functions/organization-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'create',
          name: newOrgData.name,
          plan: newOrgData.plan,
          ownerEmail: newOrgData.ownerEmail || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create organization');
      }

      toast({ title: 'Organization Created', description: `${newOrgData.name} has been set up.` });
      setShowCreateModal(false);
      setNewOrgData({ name: '', plan: 'starter', ownerEmail: '' });
      fetchOrganizations();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create organization.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // Suspend organization
  const handleSuspend = async (orgId: string) => {
    try {
      const token = await getToken();
      const response = await fetch('/.netlify/functions/organization-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'suspend', organizationId: orgId }),
      });
      if (!response.ok) throw new Error('Failed');
      toast({ title: 'Organization Suspended', description: 'All API access and calls have been paused.' });
      fetchOrganizations();
    } catch {
      toast({ title: 'Error', description: 'Failed to suspend organization.', variant: 'destructive' });
    }
  };

  // Reactivate organization
  const handleReactivate = async (orgId: string) => {
    try {
      const token = await getToken();
      const response = await fetch('/.netlify/functions/organization-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'reactivate', organizationId: orgId }),
      });
      if (!response.ok) throw new Error('Failed');
      toast({ title: 'Organization Reactivated', description: 'Organization is now active again.' });
      fetchOrganizations();
    } catch {
      toast({ title: 'Error', description: 'Failed to reactivate organization.', variant: 'destructive' });
    }
  };

  // Soft delete organization
  const handleDelete = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to delete "${orgName}"? This will suspend all access.`)) return;

    try {
      const token = await getToken();
      const response = await fetch('/.netlify/functions/organization-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete', organizationId: orgId }),
      });
      if (!response.ok) throw new Error('Failed');
      toast({ title: 'Organization Deleted', description: `${orgName} has been removed.` });
      fetchOrganizations();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete organization.', variant: 'destructive' });
    }
  };

  // Filter organizations
  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    const matchesPlan = planFilter === 'all' || org.subscription_plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate statistics
  const totalStats: OrganizationStats = {
    totalOrgs: organizations.length,
    activeOrgs: organizations.filter((o) => o.status === 'active').length,
    totalRevenue: organizations.reduce((sum, org) => sum + (org.subscription_mrr || 0), 0),
    totalCalls: organizations.reduce((sum, org) => sum + (org.total_calls || 0), 0),
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'suspended': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'inactive': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPlanColor = (plan: string | undefined) => {
    switch (plan) {
      case 'enterprise': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'professional':
      case 'growth': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'starter': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-lg text-gray-400">Loading organizations...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Building className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-white">Organizations</h1>
              <p className="mt-1 text-gray-400">Manage client organizations and their subscriptions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Organizations</p>
                  <p className="text-2xl font-semibold text-white">{totalStats.totalOrgs}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                  <Building className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Clients</p>
                  <p className="text-2xl font-semibold text-white">{totalStats.activeOrgs}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Monthly Revenue</p>
                  <p className="text-2xl font-semibold text-white">{formatCurrency(totalStats.totalRevenue)}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-500/10">
                  <DollarSign className="h-6 w-6 text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Calls</p>
                  <p className="text-2xl font-semibold text-white">{totalStats.totalCalls.toLocaleString()}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                  <PhoneCall className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <Input
              type="text"
              placeholder="Search organizations by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-gray-800 bg-gray-900/90 pl-10 text-white placeholder-gray-500 focus:border-emerald-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-800 bg-gray-900/90 px-3 py-2 text-white focus:border-emerald-600"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-md border border-gray-800 bg-gray-900/90 px-3 py-2 text-white focus:border-emerald-600"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {/* Organizations List */}
        <div className="space-y-4">
          {filteredOrganizations.length === 0 ? (
            <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Building className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-white">No organizations found</h3>
                <p className="text-gray-400 mb-4">Create your first organization to get started.</p>
                <Button
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredOrganizations.map((org) => (
              <Card
                key={org.id}
                className="border-gray-800 bg-gray-900/90 backdrop-blur-sm transition-all duration-200 hover:bg-gray-900"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Building className="h-6 w-6 text-emerald-500" />
                      </div>
                      <div>
                        <h3
                          className="text-lg font-semibold text-white hover:text-emerald-400 cursor-pointer transition-colors"
                          onClick={() => navigate(`/organizations/${org.id}`)}
                        >
                          {org.name}
                        </h3>
                        <p className="text-sm text-gray-400">{org.contact_email || 'No email set'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(org.status)}>
                        {org.status ? org.status.charAt(0).toUpperCase() + org.status.slice(1) : 'Unknown'}
                      </Badge>
                      <Badge className={getPlanColor(org.subscription_plan)}>
                        {org.subscription_plan
                          ? org.subscription_plan.charAt(0).toUpperCase() + org.subscription_plan.slice(1)
                          : 'No Plan'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-gray-800 bg-gray-900">
                          <DropdownMenuLabel className="text-gray-300">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-gray-800" />
                          <DropdownMenuItem
                            className="text-gray-300 hover:bg-gray-800 hover:text-white"
                            onClick={() => navigate(`/organizations/${org.id}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {org.status === 'active' ? (
                            <DropdownMenuItem
                              className="text-orange-400 hover:bg-gray-800 hover:text-orange-300"
                              onClick={() => handleSuspend(org.id)}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          ) : org.status === 'suspended' ? (
                            <DropdownMenuItem
                              className="text-emerald-400 hover:bg-gray-800 hover:text-emerald-300"
                              onClick={() => handleReactivate(org.id)}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-gray-800 hover:text-red-300"
                            onClick={() => handleDelete(org.id, org.name)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{org.contact_email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{org.contact_phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{org.address || 'No address'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">Since {formatDate(org.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-800 pt-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-gray-400">Users</p>
                      <p className="flex items-center gap-1 text-sm font-medium text-white">
                        <Users className="h-3 w-3" /> {org.users_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Campaigns</p>
                      <p className="text-sm font-medium text-white">{org.campaigns_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Calls</p>
                      <p className="text-sm font-medium text-white">{(org.total_calls || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Monthly Revenue</p>
                      <p className="text-sm font-medium text-emerald-400">{formatCurrency(org.subscription_mrr || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Create Organization</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-white">Organization Name</Label>
                <Input
                  value={newOrgData.name}
                  onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                  className="border-gray-700 bg-gray-800 text-white"
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <Label className="text-white">Plan</Label>
                <Select value={newOrgData.plan} onValueChange={(v) => setNewOrgData({ ...newOrgData, plan: v })}>
                  <SelectTrigger className="border-gray-700 bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Owner Email (optional)</Label>
                <Input
                  value={newOrgData.ownerEmail}
                  onChange={(e) => setNewOrgData({ ...newOrgData, ownerEmail: e.target.value })}
                  className="border-gray-700 bg-gray-800 text-white"
                  placeholder="owner@company.com"
                />
                <p className="mt-1 text-xs text-gray-500">If the user exists, they'll be added as admin.</p>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700"
                onClick={handleCreateOrganization}
                disabled={creating}
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Organizations;
