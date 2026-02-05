import { apiClient } from '../lib/api-client';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  status: 'new' | 'contacted' | 'interested' | 'qualified' | 'converted' | 'unqualified';
  priority: 'low' | 'medium' | 'high';
  source: string;
  campaign: string;
  notes: string;
  tags: string[];
  score?: number;
  value?: number;
  lastContactDate?: string;
  nextFollowUp?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, any>;
  callHistory?: CallRecord[];
  activities?: Activity[];
}

export interface CallRecord {
  id: string;
  leadId: string;
  date: string;
  duration: string;
  outcome: string;
  transcript: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  nextAction?: string;
  recordingUrl?: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status_change';
  description: string;
  date: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface LeadFilters {
  status?: string[];
  priority?: string[];
  campaign?: string[];
  source?: string[];
  ownerId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  tags?: string[];
}

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  byCampaign: Record<string, number>;
  bySource: Record<string, number>;
  totalValue: number;
  averageScore: number;
  conversionRate: number;
  recentActivity: Activity[];
  pipelineHealth: {
    qualified: number;
    interested: number;
    contacted: number;
    new: number;
  };
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  totalLeads: number;
  conversionRate: number;
  averageScore: number;
  totalValue: number;
  lastActivity: string;
  status: 'active' | 'paused' | 'completed';
}

export interface LeadImportResult {
  success: boolean;
  importId: string;
  totalRows: number;
  importedRows: number;
  errors: string[];
  warnings: string[];
  duplicates?: number;
}

class CRMService {
  private baseUrl = '/api/leads';

  // ==================== LEAD MANAGEMENT ====================

  /**
   * Get leads with filtering and pagination
   */
  async getLeads(
    clientId?: string,
    filters: LeadFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (clientId) {
        params.append('clientId', clientId);
      }

      if (filters.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters.search) {
        params.append('search', filters.search);
      }

      const response = await fetch(`${this.baseUrl}?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Get single lead by ID
   */
  async getLead(leadId: string, clientId?: string): Promise<Lead> {
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('clientId', clientId);
      }

      const response = await fetch(`${this.baseUrl}/${leadId}?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch lead: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching lead:', error);
      throw error;
    }
  }

  /**
   * Create new lead
   */
  async createLead(lead: Partial<Lead>, clientId?: string): Promise<Lead> {
    try {
      const payload = {
        ...lead,
        clientId,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create lead: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Update existing lead
   */
  async updateLead(leadId: string, updates: Partial<Lead>, clientId?: string): Promise<Lead> {
    try {
      const payload = {
        ...updates,
        clientId,
      };

      const response = await fetch(`${this.baseUrl}/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update lead: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  /**
   * Delete lead
   */
  async deleteLead(leadId: string, clientId?: string): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('clientId', clientId);
      }

      const response = await fetch(`${this.baseUrl}/${leadId}?${params}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete lead: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  /**
   * Bulk update leads
   */
  async bulkUpdateLeads(
    leadIds: string[],
    updates: Partial<Lead>,
    clientId?: string
  ): Promise<{ updated: number; errors: string[] }> {
    try {
      const payload = {
        leadIds,
        updates,
        clientId,
      };

      const response = await fetch(`${this.baseUrl}/bulk-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to bulk update leads: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error bulk updating leads:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS & STATS ====================

  /**
   * Get lead statistics and analytics
   */
  async getLeadStats(clientId?: string): Promise<LeadStats> {
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('clientId', clientId);
      }

      const response = await fetch(`${this.baseUrl}/stats?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch lead stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching lead stats:', error);
      throw error;
    }
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignPerformance(clientId?: string): Promise<CampaignPerformance[]> {
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('clientId', clientId);
      }

      const response = await fetch(`${this.baseUrl}/campaigns/performance?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch campaign performance: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching campaign performance:', error);
      throw error;
    }
  }

  // ==================== LEAD IMPORT/EXPORT ====================

  /**
   * Import leads from CSV
   */
  async importLeads(
    file: File,
    campaignId?: string,
    clientId?: string,
    options: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
      campaignType?: 'b2c' | 'b2b';
    } = {}
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (campaignId) {
        formData.append('campaignId', campaignId);
      }
      if (clientId) {
        formData.append('clientId', clientId);
      }
      if (options.skipDuplicates) {
        formData.append('skipDuplicates', 'true');
      }
      if (options.updateExisting) {
        formData.append('updateExisting', 'true');
      }
      if (options.campaignType) {
        formData.append('campaignType', options.campaignType);
      }

      const response = await fetch(`${this.baseUrl}/import`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to import leads: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error importing leads:', error);
      throw error;
    }
  }

  /**
   * Export leads to CSV
   */
  async exportLeads(clientId?: string, filters: LeadFilters = {}): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('clientId', clientId);
      }

      // Add filter params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else if (typeof value === 'object' && 'start' in value) {
            params.append('startDate', value.start);
            params.append('endDate', value.end);
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`${this.baseUrl}/export?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to export leads: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error exporting leads:', error);
      throw error;
    }
  }

  /**
   * Download CSV template
   */
  async downloadTemplate(): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/template`);
      if (!response.ok) {
        throw new Error(`Failed to download template: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading template:', error);
      throw error;
    }
  }

  // ==================== CALL HISTORY & ACTIVITIES ====================

  /**
   * Get call history for a lead
   */
  async getCallHistory(leadId: string, clientId?: string): Promise<CallRecord[]> {
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('clientId', clientId);
      }

      const response = await fetch(`${this.baseUrl}/${leadId}/calls?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch call history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching call history:', error);
      throw error;
    }
  }

  /**
   * Add call record
   */
  async addCallRecord(callRecord: Partial<CallRecord>, clientId?: string): Promise<CallRecord> {
    try {
      const payload = {
        ...callRecord,
        clientId,
      };

      const response = await fetch(`${this.baseUrl}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to add call record: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding call record:', error);
      throw error;
    }
  }

  /**
   * Get activities for a lead
   */
  async getActivities(leadId: string, clientId?: string): Promise<Activity[]> {
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('clientId', clientId);
      }

      const response = await fetch(`${this.baseUrl}/${leadId}/activities?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  /**
   * Add activity
   */
  async addActivity(activity: Partial<Activity>, clientId?: string): Promise<Activity> {
    try {
      const payload = {
        ...activity,
        clientId,
      };

      const response = await fetch(`${this.baseUrl}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to add activity: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  }

  // ==================== LEAD SCORING & AI FEATURES ====================

  /**
   * Calculate lead score using AI
   */
  async calculateLeadScore(
    leadId: string,
    clientId?: string
  ): Promise<{ score: number; factors: Record<string, number> }> {
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('clientId', clientId);
      }

      const response = await fetch(`${this.baseUrl}/${leadId}/score?${params}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to calculate lead score: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating lead score:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered lead insights
   */
  async getLeadInsights(
    leadId: string,
    clientId?: string
  ): Promise<{
    nextBestAction: string;
    callRecommendation: string;
    urgencyLevel: 'low' | 'medium' | 'high';
    conversionProbability: number;
    keyInsights: string[];
  }> {
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('clientId', clientId);
      }

      const response = await fetch(`${this.baseUrl}/${leadId}/insights?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch lead insights: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching lead insights:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Search leads with intelligent matching
   */
  async searchLeads(query: string, clientId?: string, limit: number = 20): Promise<Lead[]> {
    try {
      const params = new URLSearchParams({
        search: query,
        limit: limit.toString(),
      });

      if (clientId) {
        params.append('clientId', clientId);
      }

      const response = await fetch(`${this.baseUrl}/search?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to search leads: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching leads:', error);
      throw error;
    }
  }

  /**
   * Get available campaigns for filtering
   */
  async getCampaigns(clientId?: string): Promise<{ id: string; name: string; active: boolean }[]> {
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('clientId', clientId);
      }

      const response = await fetch(`${this.baseUrl}/campaigns?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  /**
   * Get available sources for filtering
   */
  async getSources(clientId?: string): Promise<string[]> {
    try {
      const params = new URLSearchParams();
      if (clientId) {
        params.append('clientId', clientId);
      }

      const response = await fetch(`${this.baseUrl}/sources?${params}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sources: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching sources:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const crmService = new CRMService();
export default crmService;
