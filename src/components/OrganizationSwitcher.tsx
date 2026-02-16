import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Crown, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/auth';

interface Organization {
  id: string;
  name: string;
  status: string;
  users_count?: number;
  subscription_tier?: string;
}

interface OrganizationSwitcherProps {
  currentUser: {
    role?: string;
    organizationId?: string;
    organizationName?: string;
  } | null;
  onOrganizationSwitch?: (org: Organization) => void;
}

export const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  currentUser,
  onOrganizationSwitch
}) => {
  const { getToken } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.role === 'platform_owner') {
      fetchOrganizations();
      setSelectedOrgId(currentUser?.organizationId || '');
    }
  }, [currentUser?.organizationId, currentUser?.role]);

  // Only show for Platform Owners
  if (currentUser?.role !== 'platform_owner') {
    return null;
  }

  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const response = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Organizations API error:', response.status, errorText);
        throw new Error(`Failed to fetch organizations: ${response.status}`);
      }

      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (err) {
      console.error('❌ Error fetching organizations:', err);
      setError(`Failed to load organizations: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSwitch = async (orgId: string) => {
    if (orgId === selectedOrgId) return;

    setSwitching(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`/api/organizations/switch/${orgId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to switch organization');
      }

      const data = await response.json();

      setSelectedOrgId(orgId);
      
      // Find the organization and notify parent
      const switchedOrg = organizations.find(org => org.id === orgId);
      if (switchedOrg && onOrganizationSwitch) {
        onOrganizationSwitch(switchedOrg);
      }

      // Refresh the page to update all data contexts
      window.location.reload();
      
    } catch (err) {
      console.error('Error switching organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch organization');
    } finally {
      setSwitching(false);
    }
  };

  const getOrgBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-500';
      case 'professional': return 'bg-blue-500';
      case 'starter': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const currentOrg = organizations.find(org => org.id === selectedOrgId);

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg">
      <div className="flex items-center gap-2">
        <Crown className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium text-gray-200">Platform Owner</span>
      </div>
      
      <div className="h-4 w-px bg-gray-600" />
      
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
        
        {loading ? (
          <div className="text-sm text-gray-400">Loading organizations...</div>
        ) : (
          <Select 
            value={selectedOrgId} 
            onValueChange={handleOrganizationSwitch}
            disabled={switching}
          >
            <SelectTrigger className="w-full max-w-xs border-gray-600 bg-gray-700 text-white">
              <SelectValue placeholder="Select organization..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600 z-50">
              {organizations.map((org) => (
                <SelectItem 
                  key={org.id} 
                  value={org.id}
                  className="text-white hover:bg-gray-600 focus:bg-gray-600 data-[highlighted]:bg-gray-600"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="flex-1 truncate">{org.name}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {org.subscription_tier && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs px-1 py-0 ${getOrgBadgeColor(org.subscription_tier)}`}
                        >
                          {org.subscription_tier}
                        </Badge>
                      )}
                      {org.users_count !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Users className="h-3 w-3" />
                          {org.users_count}
                        </div>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {switching && (
          <div className="text-xs text-amber-400">Switching...</div>
        )}
      </div>
      
      {currentOrg && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge 
            variant="outline" 
            className="text-xs border-gray-500 text-gray-300"
          >
            {currentOrg.users_count || 0} users
          </Badge>
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-1 text-xs text-red-400 flex-shrink-0">
          <AlertCircle className="h-3 w-3" />
          <span className="truncate">{error}</span>
        </div>
      )}
    </div>
  );
};

export default OrganizationSwitcher;