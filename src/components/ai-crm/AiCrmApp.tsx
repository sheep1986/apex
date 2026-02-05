import React, { useState, useEffect } from 'react';
import { AccountSetup } from './AccountSetup';
import { CampaignList } from './CampaignList';
import { CampaignDashboard } from './CampaignDashboard';
import { Loader2, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AiCrmAppProps {
  token: string;
  userId: string;
}

interface AccountConfig {
  vapiApiKey: string;
  organizationName: string;
  contactEmail: string;
  phoneNumber: string;
  timezone: string;
  complianceSettings: {
    callingHours: {
      start: string;
      end: string;
    };
    maxAttemptsPerLead: number;
    retryDelayHours: number;
    dncCheckEnabled: boolean;
  };
}

interface AppState {
  view: 'setup' | 'campaigns' | 'campaign-detail';
  accountConfig: AccountConfig | null;
  selectedCampaignId: string | null;
  selectedCampaignName: string | null;
  loading: boolean;
  error: string | null;
}

export const AiCrmApp: React.FC<AiCrmAppProps> = ({ token, userId }) => {
  const [state, setState] = useState<AppState>({
    view: 'setup',
    accountConfig: null,
    selectedCampaignId: null,
    selectedCampaignName: null,
    loading: true,
    error: null
  });

  const websocketUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws/ai-crm';

  useEffect(() => {
    checkAccountSetup();
  }, []);

  const checkAccountSetup = async () => {
    try {
      const response = await fetch('/api/account/config', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const config = await response.json();
        setState(prev => ({
          ...prev,
          accountConfig: config,
          view: 'campaigns',
          loading: false
        }));
      } else if (response.status === 404) {
        // No account setup found, show setup wizard
        setState(prev => ({
          ...prev,
          view: 'setup',
          loading: false
        }));
      } else {
        throw new Error('Failed to check account setup');
      }
    } catch (error) {
      console.error('Error checking account setup:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load account configuration',
        loading: false
      }));
    }
  };

  const handleSetupComplete = async (config: AccountConfig) => {
    setState(prev => ({
      ...prev,
      accountConfig: config,
      view: 'campaigns',
      loading: false
    }));
  };

  const handleCampaignSelect = (campaignId: string, campaignName: string) => {
    setState(prev => ({
      ...prev,
      view: 'campaign-detail',
      selectedCampaignId: campaignId,
      selectedCampaignName: campaignName
    }));
  };

  const handleBackToCampaigns = () => {
    setState(prev => ({
      ...prev,
      view: 'campaigns',
      selectedCampaignId: null,
      selectedCampaignName: null
    }));
  };

  const handleShowSetup = () => {
    setState(prev => ({
      ...prev,
      view: 'setup'
    }));
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading AI CRM...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{state.error}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/95 backdrop-blur-xl border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {state.view === 'campaign-detail' && (
                <Button
                  variant="ghost"
                  onClick={handleBackToCampaigns}
                  className="text-white hover:text-amber-400"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Campaigns
                </Button>
              )}
              <div>
                <h1 className="text-xl font-semibold text-white">AI CRM</h1>
                {state.accountConfig && (
                  <p className="text-sm text-gray-400">
                    {state.accountConfig.organizationName}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {state.view !== 'setup' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowSetup}
                  className="border-gray-700 text-gray-300 hover:text-white hover:border-amber-400"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {state.view === 'setup' && (
          <AccountSetup
            onSetupComplete={handleSetupComplete}
            existingConfig={state.accountConfig || undefined}
          />
        )}

        {state.view === 'campaigns' && (
          <CampaignList
            websocketUrl={websocketUrl}
            token={token}
          />
        )}

        {state.view === 'campaign-detail' && state.selectedCampaignId && (
          <CampaignDashboard
            campaignId={state.selectedCampaignId}
            campaignName={state.selectedCampaignName || 'Campaign'}
            websocketUrl={websocketUrl}
            token={token}
          />
        )}
      </div>
    </div>
  );
};