import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  status?: 'active' | 'inactive' | 'pending';
  subscription_plan?: 'starter' | 'growth' | 'enterprise';
  subscription_status?: 'active' | 'cancelled' | 'past_due';
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

  const { getToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch organizations from API
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      // Import supabase service
      const { supabaseService } = await import('@/services/supabase-service');
      
      console.log('🔍 Fetching organizations from Supabase...');
      
      // Fetch organizations from Supabase
      const organizations = await supabaseService.getOrganizations();
      
      console.log('📊 Organizations fetched:', organizations);
      
      if (!organizations || organizations.length === 0) {
        console.warn('⚠️ No organizations returned from Supabase');
        setOrganizations([]);
        return;
      }
      
      // Transform data to match our interface and fetch user counts
      const transformedOrgs = await Promise.all(organizations.map(async (org) => {
        // Fetch user count for this organization
        let userCount = 0;
        try {
          const users = await supabaseService.getOrganizationUsers(org.id);
          userCount = users.length;
          console.log(`👥 Organization ${org.name} has ${userCount} users`);
        } catch (error) {
          console.error(`Failed to fetch user count for ${org.name}:`, error);
        }
        
        return {
          id: org.id,
          name: org.name,
          domain: org.custom_domain || undefined,
          contact_name: undefined, // Not in current schema
          contact_email: org.billing_email,
          contact_phone: org.phone,
          address: org.address,
          status: org.status === 'active' ? 'active' as const : 'inactive' as const,
          subscription_plan: org.plan === 'professional' ? 'growth' as const : org.plan === 'starter' ? 'starter' as const : 'enterprise' as const,
          subscription_status: org.status === 'active' ? 'active' as const : 'cancelled' as const,
          subscription_mrr: org.monthly_cost,
          users_count: userCount,
          campaigns_count: 0, // TODO: Fetch campaign count
          total_calls: 0, // TODO: Fetch call count
          created_at: org.created_at,
          updated_at: org.updated_at,
        };
      }));
      
      console.log('📊 Organizations with user counts:', transformedOrgs);
      
      setOrganizations(transformedOrgs);
    } catch (error) {
      console.error('❌ Error fetching organizations:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: 'Error',
        description: `Failed to fetch organizations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  // Create new organization
  const createOrganization = async (orgData: Partial<Organization>) => {
    try {
      const token = await getToken();
      console.log('🔑 Creating organization with token:', token ? 'Token present' : 'No token');
      
      const response = await fetch('http://localhost:3001/api/organizations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Organization creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create organization');
      }

      toast({
        title: 'Success',
        description: 'Organization created successfully',
      });

      fetchOrganizations(); // Refresh list
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to create organization. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Update organization
  const updateOrganization = async (orgId: string, updates: Partial<Organization>) => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3001/api/organizations/${orgId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update organization');
      }

      toast({
        title: 'Success',
        description: 'Organization updated successfully',
      });

      fetchOrganizations(); // Refresh list
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to update organization. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Delete organization
  const deleteOrganization = async (orgId: string) => {
    if (
      !confirm('Are you sure you want to delete this organization? This action cannot be undone.')
    ) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3001/api/organizations/${orgId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }

      toast({
        title: 'Success',
        description: 'Organization deleted successfully',
      });

      fetchOrganizations(); // Refresh list
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete organization. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter organizations
  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (org.status && org.status === statusFilter);
    const matchesPlan =
      planFilter === 'all' || (org.subscription_plan && org.subscription_plan === planFilter);

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate statistics
  const calculateStats = (): OrganizationStats => {
    return {
      totalOrgs: organizations.length,
      activeOrgs: organizations.filter((o) => o.status === 'active').length,
      totalRevenue: organizations.reduce((sum, org) => sum + (org.subscription_mrr || 0), 0),
      totalCalls: organizations.reduce((sum, org) => sum + (org.total_calls || 0), 0),
    };
  };

  const totalStats = calculateStats();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-500/10 text-gray-400 border-gray-500/20';

    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'inactive':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getPlanColor = (plan: string | undefined) => {
    if (!plan) return 'bg-gray-500/10 text-gray-400 border-gray-500/20';

    switch (plan) {
      case 'enterprise':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'growth':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'starter':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-950">
        <div className="text-lg text-white">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Organizations</h1>
            <p className="mt-1 text-gray-400">
              Manage client organizations and their subscriptions
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            onClick={() => navigate('/organization-setup')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Setup Wizard
          </Button>
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
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Building className="h-6 w-6 text-emerald-500" />
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
                  <p className="text-2xl font-semibold text-white">
                    {formatCurrency(totalStats.totalRevenue)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                  <DollarSign className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Calls</p>
                  <p className="text-2xl font-semibold text-white">
                    {totalStats.totalCalls.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                  <PhoneCall className="h-6 w-6 text-emerald-500" />
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
              placeholder="Search organizations by name, contact, or email..."
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
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-md border border-gray-800 bg-gray-900/90 px-3 py-2 text-white focus:border-emerald-600"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {/* Organizations List */}
        <div className="space-y-4">
          {filteredOrganizations.length === 0 ? (
            <Card className="border-gray-800 bg-gray-900/90 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="mb-4 text-gray-400">
                  <Building className="mx-auto mb-4 h-12 w-12" />
                  <h3 className="mb-2 text-lg font-semibold text-white">No organizations found</h3>
                  <p>Create your first organization to get started.</p>
                </div>
                <Button
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  onClick={() => navigate('/organization-setup')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Setup Wizard
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
                        <p className="text-sm text-gray-400">
                          {org.contact_name || 'No contact assigned'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(org.status)}>
                        {org.status
                          ? org.status.charAt(0).toUpperCase() + org.status.slice(1)
                          : 'Unknown'}
                      </Badge>
                      <Badge className={getPlanColor(org.subscription_plan)}>
                        {org.subscription_plan
                          ? org.subscription_plan.charAt(0).toUpperCase() +
                            org.subscription_plan.slice(1)
                          : 'No Plan'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-gray-800 bg-gray-900">
                          <DropdownMenuLabel className="text-gray-300">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-gray-800" />
                          <DropdownMenuItem className="text-gray-300 hover:bg-gray-800 hover:text-white">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-gray-300 hover:bg-gray-800 hover:text-white"
                            onClick={() => {
                              const name = prompt('Enter new organization name:', org.name);
                              if (name && name !== org.name) {
                                updateOrganization(org.id, { name });
                              }
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Organization
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-gray-800 hover:text-red-300"
                            onClick={() => deleteOrganization(org.id)}
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
                        <Users className="h-3 w-3" />
                        {org.users_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Campaigns</p>
                      <p className="text-sm font-medium text-white">{org.campaigns_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Calls</p>
                      <p className="text-sm font-medium text-white">
                        {(org.total_calls || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Monthly Revenue</p>
                      <p className="text-sm font-medium text-emerald-400">
                        {formatCurrency(org.subscription_mrr || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
export default Organizations;
