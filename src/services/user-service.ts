// User Management Service
// Handles real API calls to backend

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

class UserService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  // Get all users
  async getUsers(token?: string): Promise<User[]> {
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
      throw error;
    }
  }

  // Get all organizations
  async getOrganizations(token?: string): Promise<Organization[]> {
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
      throw error;
    }
  }

  // Create a new user
  async createUser(userData: Partial<User>, token?: string): Promise<User> {
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