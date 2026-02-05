import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

// ==================== TENANT MANAGEMENT INTERFACES ====================

export interface PlatformOwner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'platform_owner';
  permissions: string[];
  createdAt: Date;
  avatar?: string;
  phoneNumber?: string;
}

export interface ClientAccount {
  id: string;
  name: string;
  type: 'business' | 'agency' | 'enterprise';
  industry: string;
  description?: string;
  website?: string;
  status: 'active' | 'suspended' | 'trial' | 'setup_pending';

  // Contact Information
  primaryContact: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };

  // Billing & Limits
  billing: {
    plan: 'starter' | 'professional' | 'enterprise' | 'custom';
    monthlyBudget: number;
    callLimit: number;
    currentUsage: {
      calls: number;
      cost: number;
      leads: number;
    };
    billingCycle: 'monthly' | 'annual';
    nextBillingDate: Date;
  };

  // Platform Settings
  settings: {
    timezone: string;
    allowSubUsers: boolean;
    maxSubUsers: number;
    features: string[];
    customBranding: {
      enabled: boolean;
      logo?: string;
      primaryColor?: string;
      companyName?: string;
    };
  };

  // Voice Engine Integration
  vapiConfig?: {
    apiKey: string;
    assistants: string[];
    phoneNumbers: string[];
    webhookUrl: string;
  };

  // Metadata
  createdAt: Date;
  lastActive: Date;
  createdBy: string; // Platform owner ID
  tags?: string[];
}

export interface ClientUser {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'client_admin' | 'client_user' | 'client_viewer';
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface TenantContextType {
  // Platform Owner Context
  platformOwner: PlatformOwner | null;

  // Current Client Context (when managing a specific client)
  currentClient: ClientAccount | null;
  allClients: ClientAccount[];

  // Actions for Platform Owner
  createClientAccount: (clientData: Partial<ClientAccount>) => Promise<ClientAccount>;
  updateClientAccount: (clientId: string, updates: Partial<ClientAccount>) => Promise<void>;
  deleteClientAccount: (clientId: string) => Promise<void>;
  switchToClient: (clientId: string) => void;
  switchToPlatformView: () => void;

  // Client Management
  getClientStats: (clientId: string) => Promise<any>;
  suspendClient: (clientId: string, reason: string) => Promise<void>;
  reactivateClient: (clientId: string) => Promise<void>;

  // User Management within Clients
  addClientUser: (clientId: string, userData: Partial<ClientUser>) => Promise<ClientUser>;
  removeClientUser: (clientId: string, userId: string) => Promise<void>;

  // Loading States
  isLoading: boolean;
  error: string | null;
}

// ==================== CONTEXT SETUP ====================

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const MultiTenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State Management
  const [platformOwner, setPlatformOwner] = useState<PlatformOwner | null>(null);
  const [currentClient, setCurrentClient] = useState<ClientAccount | null>(null);
  const [allClients, setAllClients] = useState<ClientAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Platform Owner (Sean Wentz)
  useEffect(() => {
    initializePlatformOwner();
    loadAllClients();
  }, []);

  const initializePlatformOwner = () => {
    const owner: PlatformOwner = {
      id: 'owner_sean_wentz',
      firstName: 'Sean',
      lastName: 'Wentz',
      email: 'sean@apex-ai.com',
      role: 'platform_owner',
      permissions: ['full_access', 'create_clients', 'manage_clients'],
      createdAt: new Date(),
      avatar: 'SW',
    };
    setPlatformOwner(owner);
  };

  const loadAllClients = async () => {
    const artificialMedia: ClientAccount = {
      id: 'client_artificial_media',
      name: 'Artificial Media',
      type: 'agency',
      industry: 'Digital Marketing',
      status: 'setup_pending',
      primaryContact: {
        name: 'Sean Wentz',
        title: 'Founder & CEO',
        email: 'sean@artificial-media.com',
        phone: '+1 (555) 123-4567',
      },
      billing: {
        plan: 'enterprise',
        monthlyBudget: 5000,
        callLimit: 10000,
        currentUsage: { calls: 0, cost: 0, leads: 0 },
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      settings: {
        timezone: 'America/New_York',
        allowSubUsers: true,
        maxSubUsers: 10,
        features: ['ai_calling', 'lead_management', 'analytics'],
        customBranding: { enabled: true, companyName: 'Artificial Media' },
      },
      createdAt: new Date(),
      lastActive: new Date(),
      createdBy: 'owner_sean_wentz',
    };
    setAllClients([artificialMedia]);
  };

  // ==================== CLIENT MANAGEMENT FUNCTIONS ====================

  const createClientAccount = async (
    clientData: Partial<ClientAccount>
  ): Promise<ClientAccount> => {
    const newClient: ClientAccount = {
      id: `client_${Date.now()}`,
      name: clientData.name || 'New Client',
      type: clientData.type || 'business',
      industry: clientData.industry || '',
      status: 'setup_pending',
      primaryContact: clientData.primaryContact || {
        name: '',
        title: '',
        email: '',
        phone: '',
      },
      billing: {
        plan: 'starter',
        monthlyBudget: 1000,
        callLimit: 1000,
        currentUsage: { calls: 0, cost: 0, leads: 0 },
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      settings: {
        timezone: 'America/New_York',
        allowSubUsers: false,
        maxSubUsers: 1,
        features: ['ai_calling'],
        customBranding: { enabled: false },
      },
      createdAt: new Date(),
      lastActive: new Date(),
      createdBy: platformOwner?.id || '',
    };

    setAllClients([...allClients, newClient]);
    return newClient;
  };

  const updateClientAccount = async (clientId: string, updates: Partial<ClientAccount>) => {
    setAllClients(
      allClients.map((client) => (client.id === clientId ? { ...client, ...updates } : client))
    );
  };

  const deleteClientAccount = async (clientId: string) => {
    setAllClients(allClients.filter((client) => client.id !== clientId));
  };

  const switchToClient = (clientId: string) => {
    const client = allClients.find((c) => c.id === clientId);
    if (client) setCurrentClient(client);
  };

  const switchToPlatformView = () => {
    setCurrentClient(null);
  };

  const getClientStats = async (clientId: string) => {
    // In production, this would fetch real analytics from your backend
    const client = allClients.find((c) => c.id === clientId);
    if (!client) return null;

    return {
      totalCalls: client.billing.currentUsage.calls,
      totalCost: client.billing.currentUsage.cost,
      totalLeads: client.billing.currentUsage.leads,
      conversionRate: 4.2,
      avgCallDuration: 180,
      topPerformingCampaign: 'Lead Generation Q4',
    };
  };

  const suspendClient = async (clientId: string, reason: string) => {
    await updateClientAccount(clientId, {
      status: 'suspended',
      // In production, you'd also log the suspension reason
    });
  };

  const reactivateClient = async (clientId: string) => {
    await updateClientAccount(clientId, { status: 'active' });
  };

  const addClientUser = async (
    clientId: string,
    userData: Partial<ClientUser>
  ): Promise<ClientUser> => {
    // Implementation for adding users to client accounts
    const newUser: ClientUser = {
      id: `user_${Date.now()}`,
      clientId,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      role: userData.role || 'client_user',
      permissions: [],
      isActive: true,
      createdAt: new Date(),
      ...userData,
    };

    // In production, save to backend
    return newUser;
  };

  const removeClientUser = async (clientId: string, userId: string) => {
    // Implementation for removing users from client accounts
    // In production, this would make an API call
  };

  // ==================== CONTEXT VALUE ====================

  const contextValue: TenantContextType = {
    platformOwner,
    currentClient,
    allClients,
    createClientAccount,
    updateClientAccount,
    deleteClientAccount,
    switchToClient,
    switchToPlatformView,
    getClientStats,
    suspendClient,
    reactivateClient,
    addClientUser,
    removeClientUser,
    isLoading,
    error,
  };

  return <TenantContext.Provider value={contextValue}>{children}</TenantContext.Provider>;
};

// ==================== HOOKS ====================

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a MultiTenantProvider');
  }
  return context;
};

// Helper hook for checking permissions
export const usePermissions = () => {
  const { platformOwner, currentClient } = useTenant();

  const hasPermission = (permission: string): boolean => {
    if (platformOwner?.permissions.includes('full_access')) return true;
    return platformOwner?.permissions.includes(permission) || false;
  };

  const canManageClient = (clientId?: string): boolean => {
    return hasPermission('manage_clients');
  };

  const canCreateClients = (): boolean => {
    return hasPermission('create_clients');
  };

  const canViewAnalytics = (): boolean => {
    return hasPermission('view_all_analytics');
  };

  return {
    hasPermission,
    canManageClient,
    canCreateClients,
    canViewAnalytics,
    isPlatformOwner: platformOwner?.role === 'platform_owner',
  };
};

export default MultiTenantProvider;
