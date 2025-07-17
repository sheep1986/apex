// User Management Service
// Handles both mock data (dev mode) and real API calls (production)

export interface User {
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

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  primary_color: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Mock data for development
export const mockUsers: User[] = [
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

export const mockOrganizations: Organization[] = [
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

class UserService {
  private apiBaseUrl: string;
  private isDevMode: boolean;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    this.isDevMode = import.meta.env.VITE_USE_DEV_AUTH === 'true';
  }

  // Get all users
  async getUsers(token?: string): Promise<User[]> {
    if (this.isDevMode) {
      console.log('🔧 Dev Mode: Using mock user data');
      return mockUsers;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.users || [];
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      if (this.isDevMode) {
        console.log('🔧 Dev Mode: API failed, using mock data');
        return mockUsers;
      }
      throw error;
    }
  }

  // Get all organizations
  async getOrganizations(token?: string): Promise<Organization[]> {
    if (this.isDevMode) {
      console.log('🔧 Dev Mode: Using mock organization data');
      return mockOrganizations;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/organizations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.organizations || [];
    } catch (error) {
      console.error('❌ Error fetching organizations:', error);
      if (this.isDevMode) {
        console.log('🔧 Dev Mode: API failed, using mock data');
        return mockOrganizations;
      }
      throw error;
    }
  }

  // Create a new user
  async createUser(userData: Partial<User>, token?: string): Promise<User> {
    if (this.isDevMode) {
      console.log('🔧 Dev Mode: Creating mock user');
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
      return newUser;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  // Update a user
  async updateUser(userId: string, updates: Partial<User>, token?: string): Promise<User> {
    if (this.isDevMode) {
      console.log('🔧 Dev Mode: Updating mock user');
      const existingUser = mockUsers.find((u) => u.id === userId);
      if (!existingUser) {
        throw new Error('User not found');
      }
      return { ...existingUser, ...updates };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  // Delete a user
  async deleteUser(userId: string, token?: string): Promise<void> {
    if (this.isDevMode) {
      console.log('🔧 Dev Mode: Deleting mock user');
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
export default userService;
