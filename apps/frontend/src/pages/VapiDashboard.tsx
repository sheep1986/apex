import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone,
  PhoneCall,
  Bot,
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  Headphones,
  MessageSquare,
  AlertCircle,
  Plus,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Play,
  Pause,
  Target,
  CheckCircle,
  MoreHorizontal,
  Zap,
  Mic,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Volume2,
  Calendar,
  Filter,
  Search,
  ChevronRight,
  TrendingDown,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Eye,
  Settings,
  Star,
  Layers,
  Users2,
  PhoneOutgoing,
  PhoneIncoming,
  MicIcon,
  Wallet,
  TrendingUpIcon,
  Award,
  Flame,
  BrainCircuit,
  Gauge,
  Rocket,
  Crown,
  Gem,
  Infinity,
  Radio,
  Waves,
  ThumbsUp,
  ThumbsDown,
  Meh,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '../services/MinimalUserProvider';
import { vapiOutboundService, VapiOutboundCampaign } from '@/services/vapi-outbound.service';
import CampaignWizardModal from '@/components/CampaignWizardModal';
import { useNavigate } from 'react-router-dom';
import { apiClient, useApiClient } from '@/lib/api-client';

// Interfaces for data structures
interface CallMetrics {
  totalCalls: number;
  connectedCalls: number;
  totalDuration: number;
  totalCost: number;
  averageDuration: number;
  connectionRate: number;
  positiveRate: number;
}

interface CallAnalytics {
  totalCalls: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
  activeAssistants: number;
  conversionRate: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  callsByHour: Array<{
    hour: number;
    count: number;
  }>;
  outcomeBreakdown: {
    [key: string]: number;
  };
}

interface VapiCall {
  id: string;
  status: string;
  phoneNumber: string;
  duration: number;
  cost: number;
  createdAt: string;
  assistantId: string;
  sentiment?: string;
  leadName?: string;
  outcome?: string;
}

const VapiDashboard: React.FC = () => {
  console.log('🚀 VapiDashboard component is rendering!');
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<VapiOutboundCampaign[]>([]);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showCampaignWizard, setShowCampaignWizard] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dataLoaded, setDataLoaded] = useState(false);

  const { toast } = useToast();
  const { userContext } = useUserContext();
  const navigate = useNavigate();
  const authenticatedApiClient = useApiClient();

  useEffect(() => {
    console.log('🔄 VapiDashboard: Component mounted, starting data load...');

    // Add error boundary protection
    const safeLoadData = async () => {
      try {
        await loadDashboardData();
      } catch (error) {
        console.error('🚨 VapiDashboard: Critical error during initialization:', error);
        // Set minimal safe state to prevent crashes
        setCampaigns([]);
        setRecentCalls([]);
        setAnalytics({});
        setDataLoaded(true);
        setIsLoading(false);
      }
    };

    safeLoadData();

    // Temporarily disabled real-time updates to avoid conflicts
    // const interval = setInterval(() => {
    //   if (dataLoaded) {
    //     loadDashboardData(false);
    //   }
    // }, 10000);

    // return () => clearInterval(interval);
  }, [dataLoaded]);

  const loadDashboardData = async (showLoader = true) => {
    console.log('📊 VapiDashboard: Starting data load, showLoader:', showLoader);

    if (showLoader) {
      setIsLoading(true);
    }

    try {
      console.log('📞 VapiDashboard: Using mock campaigns data...');

      // MOCK CAMPAIGNS DATA
      const mockCampaignsData = {
        campaigns: [
          {
            id: 'mock-1',
            name: 'TEst Campaign',
            description: 'Mock VAPI Outbound Campaign',
            status: 'active',
            assistantId: 'mock-assistant-1',
            assistantName: 'AI Assistant',
            phoneNumberId: 'mock-phone-1',
            createdAt: '2025-07-11T13:05:14.735+00:00',
            updatedAt: '2025-07-11T13:05:15.787858+00:00',
            totalLeads: 15,
            totalCalls: 45,
            successfulCalls: 12,
            callsCompleted: 42,
            successRate: 26.67,
            totalCost: 12.5,
            callsInProgress: 3,
            metrics: {
              totalLeads: 15,
              callsAttempted: 45,
              callsConnected: 42,
              callsCompleted: 42,
              connectionRate: 93.33,
              completionRate: 100,
              averageDuration: 180,
              totalCost: 12.5,
              positiveOutcomes: 8,
              conversionRate: 26.67,
              activeCalls: 3,
              callsToday: 15,
              leadsRemaining: 3,
            },
          },
          {
            id: 'mock-2',
            name: 'Holiday Promotion',
            description: 'Mock Holiday Campaign',
            status: 'active',
            assistantId: 'mock-assistant-2',
            assistantName: 'Sales Assistant',
            phoneNumberId: 'mock-phone-2',
            createdAt: '2025-07-10T17:40:33.384+00:00',
            updatedAt: '2025-07-10T17:40:34.39083+00:00',
            totalLeads: 25,
            totalCalls: 78,
            successfulCalls: 23,
            callsCompleted: 75,
            successRate: 29.49,
            totalCost: 25.75,
            callsInProgress: 1,
            metrics: {
              totalLeads: 25,
              callsAttempted: 78,
              callsConnected: 75,
              callsCompleted: 75,
              connectionRate: 96.15,
              completionRate: 100,
              averageDuration: 165,
              totalCost: 25.75,
              positiveOutcomes: 23,
              conversionRate: 29.49,
              activeCalls: 1,
              callsToday: 25,
              leadsRemaining: 2,
            },
          },
          {
            id: 'mock-3',
            name: 'New Product Launch',
            description: 'Mock Product Campaign',
            status: 'draft',
            assistantId: 'mock-assistant-3',
            assistantName: 'Product Specialist',
            phoneNumberId: 'mock-phone-3',
            createdAt: '2025-07-09T16:54:12.138+00:00',
            updatedAt: '2025-07-09T16:54:13.246438+00:00',
            totalLeads: 0,
            totalCalls: 0,
            successfulCalls: 0,
            callsCompleted: 0,
            successRate: 0,
            totalCost: 0,
            callsInProgress: 0,
            metrics: {
              totalLeads: 0,
              callsAttempted: 0,
              callsConnected: 0,
              callsCompleted: 0,
              connectionRate: 0,
              completionRate: 0,
              averageDuration: 0,
              totalCost: 0,
              positiveOutcomes: 0,
              conversionRate: 0,
              activeCalls: 0,
              callsToday: 0,
              leadsRemaining: 0,
            },
          },
        ],
      };

      console.log('✅ VapiDashboard: Mock campaigns loaded:', mockCampaignsData);

      // Use mock campaigns data
      const campaignsData = mockCampaignsData;

      // Set campaigns from mock data
      if (campaignsData && Array.isArray(campaignsData.campaigns)) {
        setCampaigns(campaignsData.campaigns);
        console.log('✅ Set', campaignsData.campaigns.length, 'mock campaigns');
      } else {
        console.warn('Mock campaigns data is not an array:', campaignsData);
        setCampaigns([]);
      }

      // Mock recent calls data
      const mockRecentCalls = [
        {
          id: 'call-1',
          contact: { name: 'John Doe', phone: '+1234567890' },
          campaign: { name: 'TEst Campaign' },
          startTime: '2025-07-11T14:30:00Z',
          duration: 180,
          outcome: 'interested',
          cost: 0.45,
        },
        {
          id: 'call-2',
          contact: { name: 'Jane Smith', phone: '+1234567891' },
          campaign: { name: 'Holiday Promotion' },
          startTime: '2025-07-11T14:25:00Z',
          duration: 120,
          outcome: 'callback',
          cost: 0.32,
        },
      ];
      setRecentCalls(mockRecentCalls);

      // Mock analytics data
      const analyticsData = {
        totalCalls: 123,
        totalCost: 38.25,
        successRate: 28.45,
        averageDuration: 165,
        sentimentBreakdown: {
          positive: 35,
          neutral: 45,
          negative: 20,
        },
      };

      // Add default sentiment breakdown if not present
      if (!analyticsData.sentimentBreakdown) {
        analyticsData.sentimentBreakdown = {
          positive: 0,
          neutral: 0,
          negative: 0,
        };
      }

      // Add default outcome breakdown if not present
      if (!analyticsData.outcomeBreakdown) {
        analyticsData.outcomeBreakdown = {};
      }

      // Add default properties for key metrics if not present
      if (!analyticsData.successRate) {
        analyticsData.successRate = 0;
      }

      if (!analyticsData.totalCost) {
        analyticsData.totalCost = 0;
      }

      if (!analyticsData.activeAssistants) {
        analyticsData.activeAssistants = 0;
      }

      setAnalytics(analyticsData);

      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);

      // Ensure campaigns stays as an array even on error
      setCampaigns([]);
      setRecentCalls([]);
      setAnalytics({});

      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  const handleCampaignAction = async (campaignId: string, action: 'start' | 'pause' | 'resume') => {
    try {
      let result;
      switch (action) {
        case 'start':
          result = await vapiOutboundService.startCampaign(campaignId);
          break;
        case 'pause':
          result = await vapiOutboundService.pauseCampaign(campaignId);
          break;
        case 'resume':
          result = await vapiOutboundService.resumeCampaign(campaignId);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      toast({
        title: 'Success',
        description: `Campaign ${action}ed successfully`,
      });

      loadDashboardData(false);
    } catch (error) {
      console.error(`Failed to ${action} campaign:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} campaign. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'paused':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'completed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <PlayCircle className="h-3 w-3" />;
      case 'paused':
        return <PauseCircle className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <StopCircle className="h-3 w-3" />;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Filter campaigns based on selected filter
  const filteredCampaigns = (campaigns || []).filter((campaign) => {
    if (campaignFilter === 'all') return true;
    if (campaignFilter === 'active') return campaign.status === 'active';
    if (campaignFilter === 'paused') return campaign.status === 'paused';
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-400"></div>
          <p className="text-sm text-gray-400">Loading campaigns dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black min-h-screen p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => loadDashboardData(false)}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCampaignWizard(true)}
            className="bg-gray-700 text-white hover:bg-gray-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card className="border-gray-800 bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Campaigns</p>
                <p className="text-2xl font-bold text-white">{campaigns.length}</p>
              </div>
              <Target className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-white">{campaigns.filter(c => c.status === 'active').length}</p>
                </div>
                <Play className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Paused</p>
                  <p className="text-2xl font-bold text-white">{campaigns.filter(c => c.status === 'paused').length}</p>
                </div>
                <Pause className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Draft</p>
                  <p className="text-2xl font-bold text-white">{campaigns.filter(c => c.status === 'draft').length}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Divider */}
        <div className="mb-8 border-b border-gray-700"></div>

        {/* Campaigns List */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Campaigns</CardTitle>

              {/* Filter Buttons */}
              <div className="flex items-center space-x-1">
                <Button
                  variant={campaignFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCampaignFilter('all')}
                  className={`px-3 py-1 text-xs ${
                    campaignFilter === 'all'
                      ? 'bg-gray-700 text-white'
                      : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  All
                </Button>
                <Button
                  variant={campaignFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCampaignFilter('active')}
                  className={`px-3 py-1 text-xs ${
                    campaignFilter === 'active'
                      ? 'bg-gray-700 text-white'
                      : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  Active
                </Button>
                <Button
                  variant={campaignFilter === 'paused' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCampaignFilter('paused')}
                  className={`px-3 py-1 text-xs ${
                    campaignFilter === 'paused'
                      ? 'bg-gray-700 text-white'
                      : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  Paused
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCampaigns.length === 0 ? (
              <div className="py-12 text-center">
                <Target className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <p className="mb-4 text-gray-400">No campaigns found</p>
                <Button
                  onClick={() => setShowCampaignWizard(true)}
                  className="bg-gray-700 text-white hover:bg-gray-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredCampaigns.map((campaign, index) => (
                  <div
                    key={campaign.id}
                    className="cursor-pointer border-b border-gray-700 p-4 transition-all duration-200 last:border-b-0 hover:bg-gray-800"
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{campaign.name}</h3>
                          <p className="text-sm text-gray-400">ID: {campaign.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getStatusColor(campaign.status)}>
                          {getStatusIcon(campaign.status)}
                          <span className="ml-1 capitalize">{campaign.status}</span>
                        </Badge>
                        <div className="flex space-x-1">
                          {campaign.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600/50 text-xs text-gray-400 transition-all duration-200 hover:border-gray-500 hover:bg-gray-600/20"
                              onClick={() => handleCampaignAction(campaign.id, 'start')}
                            >
                              <Play className="mr-1 h-3 w-3" />
                              Start
                            </Button>
                          )}
                          {campaign.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600/50 text-xs text-gray-400 transition-all duration-200 hover:border-gray-500 hover:bg-gray-600/20"
                              onClick={() => handleCampaignAction(campaign.id, 'pause')}
                            >
                              <Pause className="mr-1 h-3 w-3" />
                              Pause
                            </Button>
                          )}
                          {campaign.status === 'paused' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600/50 text-xs text-gray-400 transition-all duration-200 hover:border-gray-500 hover:bg-gray-600/20"
                              onClick={() => handleCampaignAction(campaign.id, 'resume')}
                            >
                              <Play className="mr-1 h-3 w-3" />
                              Resume
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/campaigns/${campaign.id}/calls`)}
                            className="text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-5">
                      <div>
                        <p className="mb-1 font-medium text-gray-400">Leads</p>
                        <p className="font-semibold text-white">{campaign.totalLeads || 0}</p>
                      </div>
                      <div>
                        <p className="mb-1 font-medium text-gray-400">Completed</p>
                        <p className="font-semibold text-white">{campaign.callsCompleted || 0}</p>
                      </div>
                      <div>
                        <p className="mb-1 font-medium text-gray-400">Cost</p>
                        <p className="font-semibold text-white">
                          ${campaign.totalCost?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 font-medium text-gray-400">Success</p>
                        <p className="font-semibold text-white">
                          {campaign.successRate?.toFixed(1) || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="mb-1 font-medium text-gray-400">Status</p>
                        <p className="font-semibold capitalize text-white">{campaign.status}</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-gray-400">Progress</span>
                        <span className="text-gray-400">
                          {campaign.totalLeads
                            ? `${campaign.callsCompleted || 0}/${campaign.totalLeads}`
                            : '0/0'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-800">
                        <div
                          className="h-1.5 rounded-full bg-amber-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(campaign.totalLeads ? ((campaign.callsCompleted || 0) / campaign.totalLeads) * 100 : 0, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Campaign Wizard Modal */}
      <CampaignWizardModal
        isOpen={showCampaignWizard}
        onClose={() => setShowCampaignWizard(false)}
        onSuccess={() => {
          setShowCampaignWizard(false);
          loadDashboardData(false);
        }}
      />
    </div>
  );
};

export default VapiDashboard;
