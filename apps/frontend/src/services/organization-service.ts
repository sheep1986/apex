import { supabaseService } from './supabase-service';

export interface OrganizationUser {
  id: string;
  clerk_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login?: string;
}

export interface OrganizationCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  created_at: string;
  total_calls: number;
  successful_calls: number;
  conversion_rate: number;
}

export interface OrganizationLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  source: string;
  created_at: string;
  last_contacted?: string;
  assigned_to?: string;
}

class OrganizationService {
  async getOrganizationUsers(organizationId: string): Promise<OrganizationUser[]> {
    try {
      // For now, return mock data since DB connection is having issues
      const mockUsers: OrganizationUser[] = [
        {
          id: '1',
          clerk_id: 'clerk_user_1',
          email: 'john.doe@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'client_admin',
          organization_id: organizationId,
          created_at: '2024-07-01T00:00:00Z',
          updated_at: '2024-07-01T00:00:00Z',
          is_active: true,
          last_login: '2024-07-29T10:00:00Z',
        },
        {
          id: '2',
          clerk_id: 'clerk_user_2',
          email: 'jane.smith@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          role: 'client_user',
          organization_id: organizationId,
          created_at: '2024-07-15T00:00:00Z',
          updated_at: '2024-07-15T00:00:00Z',
          is_active: true,
          last_login: '2024-07-28T14:30:00Z',
        },
        {
          id: '3',
          clerk_id: 'clerk_user_3',
          email: 'bob.wilson@example.com',
          first_name: 'Bob',
          last_name: 'Wilson',
          role: 'client_user',
          organization_id: organizationId,
          created_at: '2024-07-20T00:00:00Z',
          updated_at: '2024-07-20T00:00:00Z',
          is_active: false,
          last_login: '2024-07-25T09:15:00Z',
        },
      ];

      return mockUsers;
    } catch (error) {
      console.error('Error fetching organization users:', error);
      throw error;
    }
  }

  async getOrganizationCampaigns(organizationId: string): Promise<OrganizationCampaign[]> {
    try {
      // For now, return mock data
      const mockCampaigns: OrganizationCampaign[] = [
        {
          id: '1',
          name: 'Summer Sales Outreach',
          status: 'active',
          created_at: '2024-07-01T00:00:00Z',
          total_calls: 1250,
          successful_calls: 375,
          conversion_rate: 30,
        },
        {
          id: '2',
          name: 'Q4 Lead Generation',
          status: 'paused',
          created_at: '2024-07-15T00:00:00Z',
          total_calls: 800,
          successful_calls: 200,
          conversion_rate: 25,
        },
        {
          id: '3',
          name: 'Product Launch Campaign',
          status: 'completed',
          created_at: '2024-06-01T00:00:00Z',
          total_calls: 2000,
          successful_calls: 600,
          conversion_rate: 30,
        },
        {
          id: '4',
          name: 'Holiday Special Offers',
          status: 'draft',
          created_at: '2024-07-28T00:00:00Z',
          total_calls: 0,
          successful_calls: 0,
          conversion_rate: 0,
        },
      ];

      return mockCampaigns;
    } catch (error) {
      console.error('Error fetching organization campaigns:', error);
      throw error;
    }
  }

  async getOrganizationLeads(organizationId: string, limit: number = 10): Promise<OrganizationLead[]> {
    try {
      // For now, return mock data
      const mockLeads: OrganizationLead[] = [
        {
          id: '1',
          name: 'Alice Johnson',
          email: 'alice@company.com',
          phone: '+1 555-0123',
          status: 'qualified',
          source: 'Summer Sales Outreach',
          created_at: '2024-07-28T10:00:00Z',
          last_contacted: '2024-07-28T10:30:00Z',
          assigned_to: 'John Doe',
        },
        {
          id: '2',
          name: 'Bob Martinez',
          email: 'bob@enterprise.com',
          phone: '+1 555-0124',
          status: 'contacted',
          source: 'Q4 Lead Generation',
          created_at: '2024-07-27T14:00:00Z',
          last_contacted: '2024-07-27T14:15:00Z',
          assigned_to: 'Jane Smith',
        },
        {
          id: '3',
          name: 'Carol Davis',
          email: 'carol@startup.com',
          phone: '+1 555-0125',
          status: 'new',
          source: 'Website Form',
          created_at: '2024-07-29T08:00:00Z',
          assigned_to: 'John Doe',
        },
        {
          id: '4',
          name: 'David Lee',
          phone: '+1 555-0126',
          status: 'interested',
          source: 'Summer Sales Outreach',
          created_at: '2024-07-26T11:00:00Z',
          last_contacted: '2024-07-28T09:00:00Z',
          assigned_to: 'Jane Smith',
        },
        {
          id: '5',
          name: 'Eva Wilson',
          email: 'eva@tech.com',
          phone: '+1 555-0127',
          status: 'qualified',
          source: 'Product Launch Campaign',
          created_at: '2024-07-25T16:00:00Z',
          last_contacted: '2024-07-29T10:00:00Z',
          assigned_to: 'Bob Wilson',
        },
      ];

      return mockLeads.slice(0, limit);
    } catch (error) {
      console.error('Error fetching organization leads:', error);
      throw error;
    }
  }

  async updateOrganization(organizationId: string, updates: any): Promise<void> {
    try {
      // TODO: Implement actual update when DB connection is fixed
      console.log('Updating organization:', organizationId, updates);
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, newRole: string): Promise<void> {
    try {
      // TODO: Implement actual update when DB connection is fixed
      console.log('Updating user role:', userId, newRole);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async deactivateUser(userId: string): Promise<void> {
    try {
      // TODO: Implement actual deactivation when DB connection is fixed
      console.log('Deactivating user:', userId);
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  async activateUser(userId: string): Promise<void> {
    try {
      // TODO: Implement actual activation when DB connection is fixed
      console.log('Activating user:', userId);
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  }

  async inviteUser(organizationId: string, email: string, role: string): Promise<void> {
    try {
      // TODO: Implement actual invitation when DB connection is fixed
      console.log('Inviting user:', email, 'to organization:', organizationId, 'with role:', role);
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }
}

export const organizationService = new OrganizationService();