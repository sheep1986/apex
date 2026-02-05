import { CallMonitor } from '@/components/CallMonitor';
import { CampaignExport } from '@/components/CampaignExport';
import { ComplianceDashboard } from '@/components/ComplianceDashboard';
import { LeadImport } from '@/components/LeadImport';
import { LeadQualification } from '@/components/LeadQualification';
import { SimpleCampaignWizard } from '@/components/ai-crm/SimpleCampaignWizard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { OutboundCampaign, campaignOutboundService } from '@/services/campaign-outbound.service';
import { DollarSign, Phone, Plus, RefreshCw, Target, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../services/MinimalUserProvider';

interface EnhancedVoiceDashboardProps {
  campaignId?: string;
}

export const EnhancedVoiceDashboard: React.FC<EnhancedVoiceDashboardProps> = ({ campaignId }) => {
  const [campaigns, setCampaigns] = useState<OutboundCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<OutboundCampaign | null>(null);
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const { userContext } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const campaignsData = await campaignOutboundService.getCampaigns();
      setCampaigns(campaignsData || []);
      
      // If campaignId is provided, select that campaign
      if (campaignId) {
        const campaign = campaignsData.find(c => c.id === campaignId);
        setSelectedCampaign(campaign || null);
      } else if (campaignsData.length > 0) {
        setSelectedCampaign(campaignsData[0]);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportComplete = (result: any) => {
    toast({
      title: 'Import Complete',
      description: `Successfully imported ${result.imported} leads`,
    });
    // Refresh campaign data
    loadCampaigns();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-400"></div>
          <p className="text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black min-h-screen p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI CRM Dashboard</h1>
          <p className="text-sm text-gray-400">Manage your campaigns, leads, and compliance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={loadCampaigns}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCampaignWizard(true)}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Campaign Selector */}
      <div className="mb-6">
        <Card className="border-gray-800 bg-gray-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">Selected Campaign</h3>
                <p className="text-sm text-gray-400">
                  {selectedCampaign ? selectedCampaign.name : 'No campaign selected'}
                </p>
              </div>
              <select
                value={selectedCampaign?.id || ''}
                onChange={(e) => {
                  const campaign = campaigns.find(c => c.id === e.target.value);
                  setSelectedCampaign(campaign || null);
                }}
                className="bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2"
              >
                <option value="">Select a campaign</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gray-900 border-gray-800">
          <TabsTrigger value="overview" className="text-gray-300 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="leads" className="text-gray-300 data-[state=active]:text-white">
            Lead Import
          </TabsTrigger>
          <TabsTrigger value="monitor" className="text-gray-300 data-[state=active]:text-white">
            Live Monitor
          </TabsTrigger>
          <TabsTrigger value="qualified" className="text-gray-300 data-[state=active]:text-white">
            Qualified Leads
          </TabsTrigger>
          <TabsTrigger value="export" className="text-gray-300 data-[state=active]:text-white">
            Export
          </TabsTrigger>
          <TabsTrigger value="compliance" className="text-gray-300 data-[state=active]:text-white">
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Campaigns</p>
                    <p className="text-2xl font-bold text-white">{campaigns.length}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Campaigns</p>
                    <p className="text-2xl font-bold text-white">
                      {campaigns.filter(c => c.status === 'active').length}
                    </p>
                  </div>
                  <Phone className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Leads</p>
                    <p className="text-2xl font-bold text-white">
                      {campaigns.reduce((sum, c) => sum + (c.totalLeads || 0), 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Cost</p>
                    <p className="text-2xl font-bold text-white">
                      ${campaigns.reduce((sum, c) => sum + (c.totalCost || 0), 0).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign List */}
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-white">Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No campaigns found</p>
                  <Button
                    onClick={() => setShowCampaignWizard(true)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Create Your First Campaign
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map(campaign => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 border border-gray-700 rounded-lg hover:bg-gray-800 cursor-pointer"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      <div>
                        <h4 className="text-white font-medium">{campaign.name}</h4>
                        <p className="text-sm text-gray-400">Status: {campaign.status}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-400">
                          {campaign.totalLeads || 0} leads
                        </span>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          {selectedCampaign ? (
            <LeadImport
              campaignId={selectedCampaign.id}
              onImportComplete={handleImportComplete}
            />
          ) : (
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400">Please select a campaign to import leads</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="monitor">
          {selectedCampaign ? (
            <CallMonitor campaignId={selectedCampaign.id} />
          ) : (
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400">Please select a campaign to monitor calls</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="qualified">
          {selectedCampaign ? (
            <LeadQualification campaignId={selectedCampaign.id} />
          ) : (
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400">Please select a campaign to view qualified leads</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export">
          {selectedCampaign ? (
            <CampaignExport campaignId={selectedCampaign.id} />
          ) : (
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400">Please select a campaign to export data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="compliance">
          {selectedCampaign ? (
            <ComplianceDashboard campaignId={selectedCampaign.id} />
          ) : (
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400">Please select a campaign to view compliance data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Campaign Wizard Modal */}
      {showCampaignWizard && (
        <SimpleCampaignWizard
          onCampaignCreated={(campaign) => {
            setShowCampaignWizard(false);
            loadCampaigns();
            toast({
              title: 'Campaign Created',
              description: `Campaign "${campaign.name}" has been created successfully!`,
            });
          }}
          onCancel={() => setShowCampaignWizard(false)}
        />
      )}
    </div>
  );
};
