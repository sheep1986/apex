import { apiClient } from '../lib/api-client';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: 'platform_owner' | 'client_admin' | 'client_user' | 'client_viewer';
  agencyName?: string;
  subscriptionPlan?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Agency {
  id: string;
  name: string;
  domain?: string;
  logo?: string;
  primaryColor: string;
  status: 'active' | 'inactive' | 'trial' | 'suspended';
  subscription: {
    plan: 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'cancelled' | 'past_due';
    mrr: number;
    nextBilling: string;
  };
  owner: {
    email: string;
    firstName: string;
    lastName: string;
  };
  metrics: {
    totalUsers: number;
    totalCalls: number;
    totalLeads: number;
    totalRevenue: number;
  };
  createdAt: string;
  lastActivity: string;
}

export interface InviteData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  agencyName: string;
  plan: string;
  message: string;
}

export interface PlatformMetrics {
  totalUsers: number;
  totalAgencies: number;
  totalMRR: number;
  totalCalls: number;
  avgConversionRate: number;
  activeUsers: number;
  pendingInvites: number;
  suspendedUsers: number;
}

class UserManagementService {
  private baseUrl = '/api/user-management';

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/users/${userId}`);
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }

  // ==================== USER ACTIONS ====================

  async activateUser(userId: string): Promise<User> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/users/${userId}/activate`);
      return response.data;
    } catch (error) {
      console.error(`Error activating user ${userId}:`, error);
      throw error;
    }
  }

  async suspendUser(userId: string, reason?: string): Promise<User> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/users/${userId}/suspend`, { reason });
      return response.data;
    } catch (error) {
      console.error(`Error suspending user ${userId}:`, error);
      throw error;
    }
  }

  async deactivateUser(userId: string): Promise<User> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/users/${userId}/deactivate`);
      return response.data;
    } catch (error) {
      console.error(`Error deactivating user ${userId}:`, error);
      throw error;
    }
  }

  // ==================== INVITE SYSTEM ====================

  async sendInvite(inviteData: InviteData): Promise<{ success: boolean; inviteId: string }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/invites/send`, inviteData);
      return response.data;
    } catch (error) {
      console.error('Error sending invite:', error);
      throw error;
    }
  }

  async resendInvite(userId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/invites/${userId}/resend`);
      return response.data;
    } catch (error) {
      console.error(`Error resending invite for user ${userId}:`, error);
      throw error;
    }
  }

  async cancelInvite(userId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/invites/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error canceling invite for user ${userId}:`, error);
      throw error;
    }
  }

  async acceptInvite(
    inviteToken: string,
    password: string
  ): Promise<{ success: boolean; user: User }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/invites/accept`, {
        inviteToken,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  }

  // ==================== PASSWORD MANAGEMENT ====================

  async sendPasswordReset(userId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/users/${userId}/password-reset`);
      return response.data;
    } catch (error) {
      console.error(`Error sending password reset for user ${userId}:`, error);
      throw error;
    }
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/password-reset/complete`, {
        resetToken,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  async forcePasswordReset(userId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/users/${userId}/force-password-reset`);
      return response.data;
    } catch (error) {
      console.error(`Error forcing password reset for user ${userId}:`, error);
      throw error;
    }
  }

  // ==================== AGENCY MANAGEMENT ====================

  async getAllAgencies(): Promise<Agency[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/agencies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching agencies:', error);
      throw error;
    }
  }

  async getAgencyById(agencyId: string): Promise<Agency> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/agencies/${agencyId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching agency ${agencyId}:`, error);
      throw error;
    }
  }

  async updateAgency(agencyId: string, agencyData: Partial<Agency>): Promise<Agency> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/agencies/${agencyId}`, agencyData);
      return response.data;
    } catch (error) {
      console.error(`Error updating agency ${agencyId}:`, error);
      throw error;
    }
  }

  async suspendAgency(agencyId: string, reason?: string): Promise<Agency> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/agencies/${agencyId}/suspend`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error(`Error suspending agency ${agencyId}:`, error);
      throw error;
    }
  }

  async activateAgency(agencyId: string): Promise<Agency> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/agencies/${agencyId}/activate`);
      return response.data;
    } catch (error) {
      console.error(`Error activating agency ${agencyId}:`, error);
      throw error;
    }
  }

  // ==================== PLATFORM METRICS ====================

  async getPlatformMetrics(): Promise<PlatformMetrics> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/metrics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching platform metrics:', error);
      throw error;
    }
  }

  // ==================== SEARCH & FILTERING ====================

  async searchUsers(
    query: string,
    filters?: {
      status?: string;
      role?: string;
      agencyId?: string;
    }
  ): Promise<User[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      if (filters?.status) params.append('status', filters.status);
      if (filters?.role) params.append('role', filters.role);
      if (filters?.agencyId) params.append('agencyId', filters.agencyId);

      const response = await apiClient.get(`${this.baseUrl}/users/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  async searchAgencies(
    query: string,
    filters?: {
      status?: string;
      plan?: string;
    }
  ): Promise<Agency[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);

      if (filters?.status) params.append('status', filters.status);
      if (filters?.plan) params.append('plan', filters.plan);

      const response = await apiClient.get(`${this.baseUrl}/agencies/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching agencies:', error);
      throw error;
    }
  }

  // ==================== AUDIT LOGS ====================

  async getUserAuditLog(userId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/${userId}/audit-log`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching audit log for user ${userId}:`, error);
      throw error;
    }
  }

  async getAgencyAuditLog(agencyId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/agencies/${agencyId}/audit-log`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching audit log for agency ${agencyId}:`, error);
      throw error;
    }
  }

  // ==================== BULK OPERATIONS ====================

  async bulkUpdateUsers(
    userIds: string[],
    updates: Partial<User>
  ): Promise<{ success: boolean; updated: number }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/users/bulk-update`, {
        userIds,
        updates,
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating users:', error);
      throw error;
    }
  }

  async bulkSendInvites(
    invites: InviteData[]
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/invites/bulk-send`, { invites });
      return response.data;
    } catch (error) {
      console.error('Error bulk sending invites:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATIONS ====================

  async sendCustomNotification(
    userIds: string[],
    notification: {
      title: string;
      message: string;
      type: 'info' | 'warning' | 'error' | 'success';
    }
  ): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/notifications/send`, {
        userIds,
        notification,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending custom notification:', error);
      throw error;
    }
  }

  // ==================== EXPORT FUNCTIONS ====================

  async exportUsers(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/export?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting users:', error);
      throw error;
    }
  }

  async exportAgencies(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/agencies/export?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting agencies:', error);
      throw error;
    }
  }
}

export const userManagementService = new UserManagementService();
