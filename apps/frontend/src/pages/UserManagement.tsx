import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building,
  Crown,
  Shield,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../hooks/auth';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  organization_id?: string;
  organization_name?: string;
  last_login?: string;
  created_at: string;
  phone?: string;
  avatar_url?: string;
}

interface Organization {
  id: string;
  name: string;
  domain?: string;
  primary_color: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Mock user data for development
const mockUsers: User[] = [
  {
    id: '1',
    email: 'sean@artificialmedia.com',
    first_name: 'Sean',
    last_name: 'Wentz',
    role: 'platform_owner',
    is_active: true,
    organization_id: '1',
    organization_name: 'Artificial Media',
    last_login: '2024-01-15T10:30:00Z',
    created_at: '2024-01-01T00:00:00Z',
    phone: '+44 20 7946 0958',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sean',
  },
  {
    id: '2',
    email: 'john@techcorp.com',
    first_name: 'John',
    last_name: 'Smith',
    role: 'client_admin',
    is_active: true,
    organization_id: '2',
    organization_name: 'TechCorp Solutions',
    last_login: '2024-01-15T09:15:00Z',
    created_at: '2024-01-10T00:00:00Z',
    phone: '+1 555 123 4567',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  {
    id: '3',
    email: 'sarah@salesforce.com',
    first_name: 'Sarah',
    last_name: 'Johnson',
    role: 'client_user',
    is_active: true,
    organization_id: '2',
    organization_name: 'TechCorp Solutions',
    last_login: '2024-01-15T08:45:00Z',
    created_at: '2024-01-12T00:00:00Z',
    phone: '+1 555 234 5678',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  {
    id: '4',
    email: 'mike@agency.com',
    first_name: 'Mike',
    last_name: 'Chen',
    role: 'agency_owner',
    is_active: true,
    organization_id: '3',
    organization_name: 'Digital Marketing Pro',
    last_login: '2024-01-14T16:20:00Z',
    created_at: '2024-01-05T00:00:00Z',
    phone: '+1 555 345 6789',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
  },
  {
    id: '5',
    email: 'emma@realestate.com',
    first_name: 'Emma',
    last_name: 'Rodriguez',
    role: 'client_admin',
    is_active: false,
    organization_id: '4',
    organization_name: 'Real Estate Masters',
    last_login: '2024-01-13T12:30:00Z',
    created_at: '2024-01-08T00:00:00Z',
    phone: '+1 555 456 7890',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  },
  {
    id: '6',
    email: 'alex@startup.com',
    first_name: 'Alex',
    last_name: 'Thompson',
    role: 'agency_admin',
    is_active: true,
    organization_id: '3',
    organization_name: 'Digital Marketing Pro',
    last_login: '2024-01-15T07:30:00Z',
    created_at: '2024-01-11T00:00:00Z',
    phone: '+1 555 567 8901',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  },
];

const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'Artificial Media',
    domain: 'artificialmedia.com',
    primary_color: '#10B981',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'TechCorp Solutions',
    domain: 'techcorp.com',
    primary_color: '#3B82F6',
    status: 'active',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-15T09:15:00Z',
  },
  {
    id: '3',
    name: 'Digital Marketing Pro',
    domain: 'agency.com',
    primary_color: '#8B5CF6',
    status: 'active',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-14T16:20:00Z',
  },
  {
    id: '4',
    name: 'Real Estate Masters',
    domain: 'realestate.com',
    primary_color: '#F59E0B',
    status: 'trial',
    created_at: '2024-01-08T00:00:00Z',
    updated_at: '2024-01-13T12:30:00Z',
  },
];

const statusColors = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  suspended: 'bg-red-500',
  pending: 'bg-yellow-500',
  trial: 'bg-blue-500',
};

const roleLabels = {
  agency_owner: 'Agency Owner',
  agency_admin: 'Agency Admin',
  agency_user: 'Agency User',
  platform_admin: 'Platform Admin',
  platform_owner: 'Platform Owner',
  client_admin: 'Client Admin',
  client_user: 'Client User',
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrganization, setSelectedOrganization] = useState('all');
  const { getToken } = useAuth();
  const { toast } = useToast();

  // Check if we're in dev mode
  const isDevMode = import.meta.env.VITE_USE_DEV_AUTH === 'true';

  // Fetch users from API or use mock data
  const fetchUsers = async () => {
    try {
      setLoading(true);

      if (isDevMode) {
        // Use mock data in dev mode
        console.log('🔧 Dev Mode: Using mock user data');
        setUsers(mockUsers);
        setOrganizations(mockOrganizations);
        setLoading(false);
        return;
      }

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Users fetched from API:', data);
        setUsers(Array.isArray(data) ? data : data.users || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      if (isDevMode) {
        // Fallback to mock data in dev mode
        console.log('🔧 Dev Mode: API failed, using mock data');
        setUsers(mockUsers);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load users. Please check your connection.',
          variant: 'destructive',
        });
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch organizations from API or use mock data
  const fetchOrganizations = async () => {
    try {
      if (isDevMode) {
        // Mock data already set in fetchUsers
        return;
      }

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/organizations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Organizations fetched from API:', data);
        setOrganizations(Array.isArray(data) ? data : data.organizations || []);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch organizations');
      }
    } catch (error) {
      console.error('❌ Error fetching organizations:', error);
      if (isDevMode) {
        // Mock data already set
        return;
      }
      toast({
        title: 'Error',
        description: 'Failed to load organizations. Please check your connection.',
        variant: 'destructive',
      });
      setOrganizations([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, []);

  // Create new user
  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      if (isDevMode) {
        // Mock user creation in dev mode
        const newUser: User = {
          id: String(Date.now()),
          email: userData.email || 'new@example.com',
          first_name: userData.first_name || 'New',
          last_name: userData.last_name || 'User',
          role: userData.role || 'client_user',
          is_active: true,
          organization_id: userData.organization_id,
          organization_name: userData.organization_name,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          phone: userData.phone,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.first_name || 'New'}`,
        };
        setUsers((prev) => [...prev, newUser]);
        toast({
          title: 'Success',
          description: 'User created successfully (Dev Mode)',
        });
        return newUser;
      }

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers((prev) => [...prev, newUser]);
        toast({
          title: 'Success',
          description: 'User created successfully',
        });
        return newUser;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('❌ Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Update user
  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      if (isDevMode) {
        // Mock user update in dev mode
        setUsers((prev) =>
          prev.map((user) => (user.id === userId ? { ...user, ...updates } : user))
        );
        toast({
          title: 'Success',
          description: 'User updated successfully (Dev Mode)',
        });
        return;
      }

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers((prev) => prev.map((user) => (user.id === userId ? updatedUser : user)));
        toast({
          title: 'Success',
          description: 'User updated successfully',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      if (isDevMode) {
        // Mock user deletion in dev mode
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        toast({
          title: 'Success',
          description: 'User deleted successfully (Dev Mode)',
        });
        return;
      }

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUsers((prev) => prev.filter((user) => user.id !== userId));
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.organization_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && user.is_active) ||
      (selectedStatus === 'inactive' && !user.is_active);
    const matchesOrganization =
      selectedOrganization === 'all' || user.organization_id === selectedOrganization;

    return matchesSearch && matchesRole && matchesStatus && matchesOrganization;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
        </div>
        <div className="flex h-64 items-center justify-center">
          <div className="text-zinc-400">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="mt-1 text-zinc-400">
            Manage users and their permissions across your organization
          </p>
        </div>
        <Button
          onClick={() => {
            /* Handle create user */
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">Active Users</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter((u) => u.is_active).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">Organizations</p>
                <p className="text-2xl font-bold text-white">{organizations.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-400">Admin Users</p>
                <p className="text-2xl font-bold text-white">
                  {
                    users.filter(
                      (u) => u.role && (u.role.includes('admin') || u.role.includes('owner'))
                    ).length
                  }
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-zinc-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 pl-10 text-white"
                />
              </div>
            </div>

            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-40 border-zinc-700 bg-zinc-800 text-white">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-800">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="platform_owner">Platform Owner</SelectItem>
                <SelectItem value="platform_admin">Platform Admin</SelectItem>
                <SelectItem value="agency_owner">Agency Owner</SelectItem>
                <SelectItem value="agency_admin">Agency Admin</SelectItem>
                <SelectItem value="agency_user">Agency User</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32 border-zinc-700 bg-zinc-800 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-800">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
              <SelectTrigger className="w-48 border-zinc-700 bg-zinc-800 text-white">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent className="border-zinc-700 bg-zinc-800">
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Users ({filteredUsers.length})</CardTitle>
          <CardDescription className="text-zinc-400">
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
              <p className="text-zinc-400">No users found</p>
              <p className="text-sm text-zinc-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600">
                      <span className="font-medium text-white">
                        {(user.first_name?.[0] || '').toUpperCase()}
                        {(user.last_name?.[0] || '').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-white">
                          {user.first_name || ''} {user.last_name || ''}
                        </p>
                        <Badge
                          className={`${user.is_active ? 'bg-green-500' : 'bg-gray-500'} text-white`}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                          {roleLabels[user.role] || user.role}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-zinc-400">
                        <span className="flex items-center">
                          <Mail className="mr-1 h-3 w-3" />
                          {user.email}
                        </span>
                        {user.organization_name && (
                          <span className="flex items-center">
                            <Building className="mr-1 h-3 w-3" />
                            {user.organization_name}
                          </span>
                        )}
                        {user.phone && (
                          <span className="flex items-center">
                            <Phone className="mr-1 h-3 w-3" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-zinc-700 bg-zinc-800">
                      <DropdownMenuItem
                        onClick={() => {
                          /* Handle edit */
                        }}
                        className="text-zinc-300 hover:text-white"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleUpdateUser(user.id, { is_active: !user.is_active })}
                        className="text-zinc-300 hover:text-white"
                      >
                        {user.is_active ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
