import { useUser } from '@/hooks/auth';
import { supabaseService } from '@/services/supabase-service';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'platform' | 'agency' | 'enterprise';
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  plan: 'starter' | 'professional' | 'enterprise' | 'custom';
  monthly_cost: number;
  billing_email?: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  custom_domain?: string;
  call_limit: number;
  user_limit: number;
  storage_limit_gb: number;
  created_at: string;
  updated_at: string;
  trial_ends_at?: string;
  last_payment_at?: string;
  // Voice Engine Configuration (Internal)
  voice_enabled?: boolean;
  voice_provider?: string;
}

interface OrganizationStats {
  totalUsers: number;
  totalCampaigns: number;
  totalCalls: number;
  totalLeads: number;
  monthlySpend: number;
  creditsUsed: number;
  creditsRemaining: number;
}

interface OrganizationContextType {
  organization: Organization | null;
  stats: OrganizationStats | null;
  isLoading: boolean;
  error: string | null;
  refreshOrganization: () => Promise<void>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);

  // Get organization ID from user data
  const getOrganizationId = () => {
    // First check if user has organization_id
    if (user?.organization_id) {
      return user.organization_id;
    }
    
    // Fallback for specific users if needed
    if (user?.email === 'sean@artificialmedia.co.uk') {
      return '00000000-0000-0000-0000-000000000000'; // Platform organization
    } else if (user?.email === 'seanwentz99@gmail.com') {
      return '2566d8c5-2245-4a3c-b539-4cea21a07d9b'; // Emerald Green Energy Ltd
    }
    
    console.warn('⚠️ No organization ID found for user:', user?.email);
    return null;
  };

  const fetchOrganization = async () => {
    // Prevent excessive retries
    if (retryCount >= 3) {
      console.warn('⚠️ Max retry attempts reached for fetching organization');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const orgId = getOrganizationId();
      
      if (!orgId) {
        console.error('❌ No organization ID found for user:', user?.email);
        throw new Error('No organization ID found');
      }

      // Fetch organization from Supabase
      const orgData = await supabaseService.getOrganization(orgId);
      
      if (!orgData) {
        throw new Error('Organization not found');
      }

      // Set organization data - include ALL fields from database
      // Use the data as-is from Supabase, it should have all fields
      setOrganization(orgData);

      // Fetch organization stats - wrapped in try/catch to prevent errors from breaking the org data
      try {
        const stats = await supabaseService.getOrganizationStats(orgId);
        
        setStats({
          totalUsers: stats.totalUsers,
          totalCampaigns: stats.totalCampaigns,
          totalCalls: stats.totalCalls,
          totalLeads: stats.totalLeads,
          monthlySpend: orgData.monthly_cost || 0,
          creditsUsed: stats.completedCalls * 10, // Rough estimate: 10 credits per call
          creditsRemaining: Math.max(0, (orgData.call_limit || 5000) - stats.completedCalls),
        });
      } catch (statsError) {
        console.warn('⚠️ Could not fetch organization stats:', statsError);
        // Set default stats if fetch fails
        setStats({
          totalUsers: 0,
          totalCampaigns: 0,
          totalCalls: 0,
          totalLeads: 0,
          monthlySpend: orgData.monthly_cost || 0,
          creditsUsed: 0,
          creditsRemaining: orgData.call_limit || 5000,
        });
      }
      
      // Reset retry count on success
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch organization');
      
      // Set empty data on error to avoid showing stale data
      setOrganization(null);
      setStats(null);
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    try {
      if (!organization) return;

      // Update local state immediately for optimistic UI
      setOrganization({ ...organization, ...updates });

      // Update in Supabase
      const updatedOrg = await supabaseService.updateOrganization(organization.id, updates);
      
      // Use the updated data as-is from Supabase
      setOrganization(updatedOrg);
    } catch (err) {
      console.error('Error updating organization:', err);
      // Revert the optimistic update
      await fetchOrganization();
      throw err;
    }
  };

  useEffect(() => {
    // Fetch if we have a user and haven't fetched yet OR if we have no organization data
    if (user && !isLoading && (!hasFetched || !organization)) {
      setHasFetched(true);
      fetchOrganization();
    }
  }, [user, hasFetched, organization, isLoading]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        stats,
        isLoading,
        error,
        refreshOrganization: fetchOrganization,
        updateOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}