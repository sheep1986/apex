// Agency Service - Handles multi-tenant agency operations
export interface Client {
  id: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
  monthlyRevenue: number;
  callVolume: number;
  status: 'active' | 'trial' | 'paused' | 'churned';
  joinDate: string;
  lastActivity: string;
  logo?: string;
  industry: string;
  contactEmail: string;
  domain?: string;
  customBranding?: {
    primaryColor: string;
    logoUrl: string;
    companyName: string;
  };
}

export interface AgencyConfig {
  id: string;
  name: string;
  domain: string;
  branding: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  billing: {
    stripeAccountId: string;
    profitMargin: number; // Percentage markup on client costs
  };
  clients: Client[];
  settings: {
    allowClientSelfSignup: boolean;
    defaultPlan: 'starter' | 'professional' | 'enterprise';
    whiteLabel: boolean;
  };
}

export interface RevenueMetrics {
  totalMRR: number;
  newMRR: number;
  churnedMRR: number;
  averageRevenue: number;
  growthRate: number;
  clientLifetimeValue: number;
  profitMargin: number;
  totalProfit: number;
}

class AgencyService {
  private readonly STORAGE_KEY = 'apex-agency-config';
  private readonly API_BASE = '/api/agency';

  // Client Management
  async getClients(): Promise<Client[]> {
    try {
      const response = await fetch(`${this.API_BASE}/clients`);
      if (response.ok) {
        return await response.json();
      }
      // Return mock data if API not available
      return this.getMockClients();
    } catch (error) {
      console.error('Error fetching clients:', error);
      return this.getMockClients();
    }
  }

  async createClient(clientData: Partial<Client>): Promise<Client> {
    try {
      const response = await fetch(`${this.API_BASE}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to create client');
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async updateClient(clientId: string, updates: Partial<Client>): Promise<Client> {
    try {
      const response = await fetch(`${this.API_BASE}/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update client');
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  async deleteClient(clientId: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // Revenue Analytics
  async getRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      const response = await fetch(`${this.API_BASE}/metrics/revenue`);
      if (response.ok) {
        return await response.json();
      }
      // Return mock data if API not available
      return this.getMockRevenueMetrics();
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      return this.getMockRevenueMetrics();
    }
  }

  // White-Label Configuration
  async getAgencyConfig(): Promise<AgencyConfig | null> {
    try {
      const response = await fetch(`${this.API_BASE}/config`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching agency config:', error);
      return null;
    }
  }

  async updateAgencyConfig(config: Partial<AgencyConfig>): Promise<AgencyConfig> {
    try {
      const response = await fetch(`${this.API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update agency config');
    } catch (error) {
      console.error('Error updating agency config:', error);
      throw error;
    }
  }

  // Client Portal Generation
  async generateClientPortal(clientId: string): Promise<string> {
    try {
      const response = await fetch(`${this.API_BASE}/clients/${clientId}/portal`, {
        method: 'POST',
      });

      if (response.ok) {
        const { portalUrl } = await response.json();
        return portalUrl;
      }
      throw new Error('Failed to generate client portal');
    } catch (error) {
      console.error('Error generating client portal:', error);
      throw error;
    }
  }

  // Plan Management
  getPlanPricing() {
    return {
      starter: {
        price: 299,
        features: [
          'Up to 1,000 calls/month',
          'Basic AI Assistant',
          'Email Support',
          'Standard Voice',
        ],
        callLimit: 1000,
        agentCount: 1,
      },
      professional: {
        price: 599,
        features: [
          'Up to 5,000 calls/month',
          'Advanced AI Assistant',
          'Priority Support',
          'Custom Voices',
          'A/B Testing',
        ],
        callLimit: 5000,
        agentCount: 3,
      },
      enterprise: {
        price: 1299,
        features: [
          'Unlimited calls',
          'Enterprise AI Features',
          '24/7 Support',
          'Custom Integration',
          'Dedicated Success Manager',
        ],
        callLimit: -1, // Unlimited
        agentCount: -1, // Unlimited
      },
    };
  }

  // Domain Management
  async setupCustomDomain(domain: string, clientId?: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, clientId }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error setting up custom domain:', error);
      return false;
    }
  }

  // Mock Data (for development)
  private getMockClients(): Client[] {
    return [
      {
        id: '1',
        name: 'TechStart Solutions',
        plan: 'professional',
        monthlyRevenue: 599,
        callVolume: 2450,
        status: 'active',
        joinDate: '2024-01-15',
        lastActivity: '2024-01-18 14:30',
        industry: 'SaaS',
        contactEmail: 'sarah@techstart.com',
      },
      {
        id: '2',
        name: 'Local Home Services',
        plan: 'starter',
        monthlyRevenue: 299,
        callVolume: 890,
        status: 'active',
        joinDate: '2024-01-10',
        lastActivity: '2024-01-18 09:15',
        industry: 'Home Services',
        contactEmail: 'mike@localhome.com',
      },
      {
        id: '3',
        name: 'Enterprise Corp',
        plan: 'enterprise',
        monthlyRevenue: 1299,
        callVolume: 5200,
        status: 'active',
        joinDate: '2023-12-01',
        lastActivity: '2024-01-18 16:45',
        industry: 'Enterprise',
        contactEmail: 'jennifer@enterprise.com',
      },
      {
        id: '4',
        name: 'GrowthCo Marketing',
        plan: 'professional',
        monthlyRevenue: 599,
        callVolume: 1800,
        status: 'trial',
        joinDate: '2024-01-12',
        lastActivity: '2024-01-17 11:20',
        industry: 'Marketing',
        contactEmail: 'david@growthco.com',
      },
    ];
  }

  private getMockRevenueMetrics(): RevenueMetrics {
    const clients = this.getMockClients();
    const activeClients = clients.filter((c) => c.status === 'active');
    const totalMRR = activeClients.reduce((sum, client) => sum + client.monthlyRevenue, 0);

    return {
      totalMRR,
      newMRR: 899,
      churnedMRR: 299,
      averageRevenue: totalMRR / activeClients.length,
      growthRate: 23.5,
      clientLifetimeValue: totalMRR * 24,
      profitMargin: 65, // 65% profit margin
      totalProfit: totalMRR * 0.65,
    };
  }

  // Utility functions
  calculateProfit(revenue: number, margin: number = 65): number {
    return revenue * (margin / 100);
  }

  formatRevenue(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  getClientStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'trial':
        return 'text-yellow-400';
      case 'paused':
        return 'text-orange-400';
      case 'churned':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }

  getPlanColor(plan: string): string {
    switch (plan) {
      case 'starter':
        return 'text-blue-400';
      case 'professional':
        return 'text-purple-400';
      case 'enterprise':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  }
}

export default new AgencyService();
