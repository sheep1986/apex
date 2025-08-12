import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Play,
  Pause,
  Users,
  Phone,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar,
  Settings,
  Target,
  Zap,
} from 'lucide-react';
import { vapiService } from '@/services/vapi-service';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  status: string;
  priority: string;
  campaign: string;
}

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  assistantId: string;
  phoneNumberId: string;
  leads: Lead[];
  results: {
    totalCalls: number;
    completedCalls: number;
    inProgress: number;
    successRate: number;
    totalCost: number;
    avgDuration: string;
  };
}

export default function CampaignLauncher() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedLeads] = useState<Lead[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);

  // Campaign Configuration
  const [campaignConfig, setCampaignConfig] = useState({
    name: '',
    assistantId: '',
    phoneNumberId: '',
    batchSize: 50,
  });

  const [realTimeStats, setRealTimeStats] = useState({
    callsInProgress: 0,
    completedToday: 0,
    successRate: 0,
    costToday: 0,
  });

  // **MASSIVE IMPROVEMENT**: Batch Campaign Launch using VAPI API
  const launchBatchCampaign = async () => {
    if (!selectedLeads.length || !campaignConfig.assistantId || !campaignConfig.phoneNumberId) {
      alert('Please select leads, assistant, and phone number');
      return;
    }

    setIsLaunching(true);

    try {
      // **Use VAPI's batch calling feature**
      const response = await vapiService.launchCampaign({
        name: campaignConfig.name,
        assistantId: campaignConfig.assistantId,
        phoneNumberId: campaignConfig.phoneNumberId,
        leads: selectedLeads.map((lead) => ({
          number: lead.phone,
          name: `${lead.firstName} ${lead.lastName}`,
        })),
      });

      // **Real-time monitoring of campaign**
      if (response.success) {
        // Start monitoring the campaign
        monitorCampaignProgress(response.campaignId);
      }

      alert(`✅ Campaign launched! ${selectedLeads.length} calls started`);
    } catch (error) {
      console.error('Campaign launch failed:', error);
      alert('❌ Campaign launch failed. Check configuration.');
    } finally {
      setIsLaunching(false);
    }
  };

  // **Real-time campaign monitoring**
  const monitorCampaignProgress = async (campaignId: string) => {
    try {
      // Get analytics for the campaign
      const analytics = await vapiService.getCallAnalytics({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });

      // Update real-time stats
      setRealTimeStats((prev) => ({
        callsInProgress: analytics.totalCalls - analytics.successfulCalls,
        completedToday: analytics.successfulCalls,
        successRate: analytics.conversionRate,
        costToday: analytics.totalCost,
      }));
    } catch (error) {
      console.error('Campaign monitoring failed:', error);
    }
  };

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      {/* Campaign Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Campaign Manager</h1>
          <p className="text-gray-400">Launch and monitor AI calling campaigns with VAPI</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-gray-700 text-gray-300">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
          <Button
            onClick={launchBatchCampaign}
            disabled={isLaunching || !selectedLeads.length}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLaunching ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Launch Campaign
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Real-time Stats Dashboard */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Calls in Progress</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {realTimeStats.callsInProgress}
                </p>
              </div>
              <Phone className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completed Today</p>
                <p className="text-2xl font-bold text-green-400">{realTimeStats.completedToday}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-yellow-400">{realTimeStats.successRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Cost Today</p>
                <p className="text-2xl font-bold text-blue-400">
                  ${realTimeStats.costToday.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Configuration */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="h-5 w-5" />
            Campaign Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-gray-400">Campaign Name</label>
              <Input
                value={campaignConfig.name}
                onChange={(e) => setCampaignConfig({ ...campaignConfig, name: e.target.value })}
                placeholder="Q4 Outreach Campaign"
                className="border-gray-700 bg-gray-800 text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">Batch Size</label>
              <Select
                value={campaignConfig.batchSize.toString()}
                onValueChange={(value) =>
                  setCampaignConfig({ ...campaignConfig, batchSize: parseInt(value) })
                }
              >
                <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800">
                  <SelectItem value="10">10 calls</SelectItem>
                  <SelectItem value="25">25 calls</SelectItem>
                  <SelectItem value="50">50 calls (recommended)</SelectItem>
                  <SelectItem value="100">100 calls</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* VAPI Configuration */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-gray-400">Assistant</label>
              <Select
                value={campaignConfig.assistantId}
                onValueChange={(value) =>
                  setCampaignConfig({ ...campaignConfig, assistantId: value })
                }
              >
                <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Select assistant" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800">
                  <SelectItem value="assistant_1">Sales Assistant Pro</SelectItem>
                  <SelectItem value="assistant_2">Lead Qualifier</SelectItem>
                  <SelectItem value="assistant_3">Follow-up Specialist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-400">Phone Number</label>
              <Select
                value={campaignConfig.phoneNumberId}
                onValueChange={(value) =>
                  setCampaignConfig({ ...campaignConfig, phoneNumberId: value })
                }
              >
                <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Select number" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800">
                  <SelectItem value="phone_1">+1 (555) 123-4567</SelectItem>
                  <SelectItem value="phone_2">+1 (555) 987-6543</SelectItem>
                  <SelectItem value="phone_3">+1 (555) 456-7890</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Campaigns */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-white">Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <Target className="mx-auto mb-4 h-16 w-16 text-gray-600" />
              <p>No active campaigns</p>
              <p className="mt-2 text-sm">Launch your first campaign to see real-time progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-lg bg-gray-800/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-white">{campaign.name}</h3>
                    <Badge
                      className={
                        campaign.status === 'running'
                          ? 'bg-green-500'
                          : campaign.status === 'scheduled'
                            ? 'bg-blue-500'
                            : campaign.status === 'paused'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  <Progress
                    value={(campaign.results.completedCalls / campaign.results.totalCalls) * 100}
                    className="mb-2 w-full"
                  />
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Progress</p>
                      <p className="text-white">
                        {campaign.results.completedCalls}/{campaign.results.totalCalls}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Success Rate</p>
                      <p className="text-green-400">{campaign.results.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Cost</p>
                      <p className="text-emerald-400">${campaign.results.totalCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Duration</p>
                      <p className="text-blue-400">{campaign.results.avgDuration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
