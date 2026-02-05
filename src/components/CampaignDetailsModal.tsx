import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { OutboundCampaign, campaignOutboundService } from '@/services/campaign-outbound.service';
import {
    DollarSign,
    Download,
    Eye,
    Pause,
    Phone,
    Play,
    RefreshCw,
    Target,
    Users,
    X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface CampaignDetailsModalProps {
  campaign: OutboundCampaign;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [callResults, setCallResults] = useState<any[]>([]);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && campaign.id) {
      loadCampaignData();
      // Set up real-time updates
      const interval = setInterval(loadLiveData, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, campaign.id]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const [dashboardData, resultsData] = await Promise.all([
        campaignOutboundService.getCampaignDashboard(campaign.id),
        campaignOutboundService.getCampaignResults(campaign.id),
      ]);
      setLiveData(dashboardData);
      setCallResults(resultsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load campaign data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLiveData = async () => {
    try {
      const data = await campaignOutboundService.getLiveData(campaign.id);
      setLiveData(data);
    } catch (error) {
      // Silent fail for live updates
      console.error('Failed to load live data:', error);
    }
  };

  const handleCampaignAction = async (action: 'start' | 'pause' | 'resume') => {
    try {
      setLoading(true);
      switch (action) {
        case 'start':
          await campaignOutboundService.startCampaign(campaign.id);
          break;
        case 'pause':
          await campaignOutboundService.pauseCampaign(campaign.id);
          break;
        case 'resume':
          await campaignOutboundService.resumeCampaign(campaign.id);
          break;
      }

      toast({
        title: 'Success',
        description: `Campaign ${action}ed successfully.`,
      });

      onRefresh();
      await loadCampaignData();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} campaign.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'failed':
        return 'bg-red-500';
      case 'in-progress':
        return 'bg-yellow-500';
      case 'queued':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCallOutcomeVariant = (outcome: string) => {
    switch (outcome) {
      case 'interested':
        return 'default';
      case 'not_interested':
        return 'destructive';
      case 'voicemail':
        return 'secondary';
      case 'no_answer':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-gray-800 bg-gray-900">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">{campaign.name}</h2>
              <p className="text-gray-400">Campaign Details & Analytics</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadCampaignData}
                disabled={loading}
                className="border-gray-700 hover:border-gray-600"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Campaign Status & Actions */}
          <div className="mb-6 flex items-center justify-between rounded-lg bg-gray-800 p-4">
            <div className="flex items-center space-x-4">
              <Badge
                variant={
                  campaign.status === 'active'
                    ? 'default'
                    : campaign.status === 'paused'
                      ? 'secondary'
                      : campaign.status === 'completed'
                        ? 'outline'
                        : 'destructive'
                }
              >
                {campaign.status}
              </Badge>
              <div className="text-sm text-gray-400">
                Created: {new Date(campaign.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex space-x-2">
              {campaign.status === 'draft' && (
                <Button
                  onClick={() => handleCampaignAction('start')}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Campaign
                </Button>
              )}
              {campaign.status === 'active' && (
                <Button
                  onClick={() => handleCampaignAction('pause')}
                  disabled={loading}
                  variant="outline"
                  className="border-gray-700 hover:border-yellow-600"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              )}
              {campaign.status === 'paused' && (
                <Button
                  onClick={() => handleCampaignAction('resume')}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Leads</p>
                    <p className="text-2xl font-bold text-white">{campaign.totalLeads}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Calls Completed</p>
                    <p className="text-2xl font-bold text-white">{campaign.callsCompleted}</p>
                  </div>
                  <Phone className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Success Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {campaign.successRate.toFixed(1)}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-700 bg-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Cost</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(campaign.totalCost)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-sm text-gray-400">
              <span>Campaign Progress</span>
              <span>
                {campaign.totalLeads > 0
                  ? Math.round((campaign.callsCompleted / campaign.totalLeads) * 100)
                  : 0}
                %
              </span>
            </div>
            <Progress
              value={
                campaign.totalLeads > 0 ? (campaign.callsCompleted / campaign.totalLeads) * 100 : 0
              }
              className="h-3"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="live" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 border-gray-700 bg-gray-800">
              <TabsTrigger value="live">Live Monitoring</TabsTrigger>
              <TabsTrigger value="results">Call Results</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="space-y-4">
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Real-time Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {liveData?.activeCalls?.length > 0 ? (
                    <div className="space-y-3">
                      {liveData.activeCalls.map((call: any) => (
                        <div
                          key={call.id}
                          className="flex items-center justify-between rounded-lg bg-gray-700 p-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
                            <div>
                              <p className="font-medium text-white">
                                {call.lead.firstName} {call.lead.lastName}
                              </p>
                              <p className="text-sm text-gray-400">{call.lead.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white">{formatDuration(call.duration)}</p>
                            <p className="text-sm text-gray-400">{call.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Phone className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                      <p className="text-gray-400">No active calls at the moment</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <Card className="border-gray-700 bg-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Call Results</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 hover:border-gray-600"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-400">Lead</TableHead>
                          <TableHead className="text-gray-400">Phone</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Outcome</TableHead>
                          <TableHead className="text-gray-400">Duration</TableHead>
                          <TableHead className="text-gray-400">Cost</TableHead>
                          <TableHead className="text-gray-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {callResults.map((call: any) => (
                          <TableRow key={call.id} className="border-gray-700">
                            <TableCell className="text-white">
                              {call.lead.firstName} {call.lead.lastName}
                            </TableCell>
                            <TableCell className="text-gray-400">{call.lead.phone}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${getCallStatusColor(call.status)}`}
                                />
                                <span className="capitalize text-white">{call.status}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getCallOutcomeVariant(call.outcome)}>
                                {call.outcome?.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {call.duration ? formatDuration(call.duration) : '-'}
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {call.cost ? formatCurrency(call.cost) : '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCall(call)}
                                className="text-gray-400 hover:text-white"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="border-gray-700 bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Call Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {liveData?.outcomeBreakdown &&
                        Object.entries(liveData.outcomeBreakdown).map(
                          ([outcome, count]: [string, any]) => (
                            <div key={outcome} className="flex items-center justify-between">
                              <span className="text-sm capitalize text-gray-300">
                                {outcome.replace('_', ' ')}
                              </span>
                              <div className="flex items-center space-x-2">
                                <Progress
                                  value={
                                    campaign.callsCompleted > 0
                                      ? (count / campaign.callsCompleted) * 100
                                      : 0
                                  }
                                  className="w-20"
                                />
                                <span className="w-8 text-right text-sm text-white">{count}</span>
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-700 bg-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Average Call Duration</span>
                        <span className="font-medium text-white">
                          {liveData?.averageCallDuration
                            ? formatDuration(liveData.averageCallDuration)
                            : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Conversion Rate</span>
                        <span className="font-medium text-white">
                          {liveData?.conversionRate
                            ? `${liveData.conversionRate.toFixed(1)}%`
                            : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Cost per Call</span>
                        <span className="font-medium text-white">
                          {liveData?.costPerCall ? formatCurrency(liveData.costPerCall) : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Calls per Hour</span>
                        <span className="font-medium text-white">
                          {liveData?.callsPerHour || campaign.settings.callsPerHour}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailsModal;
