import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
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
  ChevronLeft,
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
  X,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '../services/MinimalUserProvider';
import { useVapiOutboundService, VapiOutboundCampaign } from '@/services/vapi-outbound.service';
import { directSupabaseService } from '@/services/direct-supabase.service';
import { SimpleCampaignWizard } from '@/components/ai-crm/SimpleCampaignWizard';
import { CampaignEditWizard } from '@/components/ai-crm/CampaignEditWizard';
import { DynamicConcurrencyManager } from '@/components/ai-crm/DynamicConcurrencyManager';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<VapiOutboundCampaign | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [expandedCampaigns, setExpandedCampaigns] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'concurrency'>('campaigns');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<VapiOutboundCampaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();
  const { userContext } = useUserContext();
  const navigate = useNavigate();
  const authenticatedApiClient = useApiClient();
  const vapiOutboundService = useVapiOutboundService(); // Use authenticated service

  useEffect(() => {
    console.log('🔄 VapiDashboard: Component mounted or userContext changed, starting data load...');
    console.log('🏢 VapiDashboard: Current organization_id:', userContext?.organization_id);

    // Only load data if we have the organization context
    if (!userContext?.organization_id) {
      console.log('⏳ Waiting for user context with organization_id...');
      return;
    }

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
  }, [userContext?.organization_id]);

  const loadDashboardData = async (showLoader = true) => {
    console.log('📊 VapiDashboard: Starting data load, showLoader:', showLoader);

    if (showLoader) {
      setIsLoading(true);
    }

    try {
      console.log('📞 VapiDashboard: Loading real campaigns data...');
      console.log('🏢 VapiDashboard: User context organization_id:', userContext?.organization_id);

      // Always use direct Supabase since Railway API is not working
      // Pass organization_id from user context for proper multi-tenant data isolation
      console.log('🔄 Using direct Supabase service with org ID...');
      const campaignsData = await directSupabaseService.getCampaigns(userContext?.organization_id);
      console.log('✅ VapiDashboard: Campaigns loaded from Supabase:', campaignsData);

      // Set campaigns from API data
      if (campaignsData && Array.isArray(campaignsData)) {
        setCampaigns(campaignsData);
        console.log('✅ Set', campaignsData.length, 'real campaigns');
      } else {
        console.warn('Campaigns data is not an array:', campaignsData);
        setCampaigns([]);
      }

      // Use direct Supabase service for recent calls - pass org ID for proper data isolation
      const recentCallsData = await directSupabaseService.getRecentCalls(10, userContext?.organization_id);
      console.log('✅ VapiDashboard: Recent calls loaded from Supabase:', recentCallsData);
      setRecentCalls(recentCallsData || []);

      // Calculate analytics data from campaigns
      const analyticsData = campaignsData.reduce((acc, campaign) => {
        return {
          totalCalls: acc.totalCalls + (campaign.totalLeads || 0),
          totalCost: acc.totalCost + (campaign.totalCost || 0),
          successfulCalls: acc.successfulCalls + Math.floor((campaign.callsCompleted || 0) * (campaign.successRate || 0) / 100),
          totalDuration: acc.totalDuration + (campaign.callsCompleted || 0) * 120, // Assume 2 min avg
          totalCompletedCalls: acc.totalCompletedCalls + (campaign.callsCompleted || 0),
        };
      }, { totalCalls: 0, totalCost: 0, successfulCalls: 0, totalDuration: 0, totalCompletedCalls: 0 });

      // Calculate derived metrics
      analyticsData.successRate = analyticsData.totalCalls > 0 ? 
        (analyticsData.successfulCalls / analyticsData.totalCalls) * 100 : 0;
      analyticsData.averageDuration = analyticsData.totalCompletedCalls > 0 ? 
        analyticsData.totalDuration / analyticsData.totalCompletedCalls : 0;
      
      // Default sentiment breakdown (will be replaced with real data when available)
      analyticsData.sentimentBreakdown = {
        positive: Math.round(analyticsData.successfulCalls * 0.6),
        neutral: Math.round(analyticsData.successfulCalls * 0.3),
        negative: Math.round(analyticsData.successfulCalls * 0.1),
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

  const openDeleteDialog = (campaign: VapiOutboundCampaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;

    setIsDeleting(true);
    try {
      // Use direct Supabase service to delete - pass org ID for proper authorization
      await directSupabaseService.deleteCampaign(campaignToDelete.id, userContext?.organization_id);

      // Remove from local state
      setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete.id));

      toast({
        title: 'Campaign Deleted',
        description: `Campaign "${campaignToDelete.name}" has been permanently deleted.`,
      });

      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete campaign',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'paused':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'completed':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'failed':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
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
    <div className="w-full bg-black min-h-screen px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-white">Apex Campaigns</h1>
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
          {activeTab === 'campaigns' && (
            <Button
              onClick={() => setShowCampaignWizard(true)}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'campaigns'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Target className="mr-2 h-4 w-4 inline" />
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('concurrency')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'concurrency'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Gauge className="mr-2 h-4 w-4 inline" />
            Concurrency Manager
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'campaigns' && (
        <>
          {/* Campaign Stats */}
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-4">
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
                  <p className="text-sm text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-white">{campaigns.filter(c => c.status === 'active').length}</p>
                </div>
                <Play className="h-8 w-8 text-emerald-500" />
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Divider */}
        <div className="mb-8 border-b border-gray-700"></div>

        {/* Campaigns List */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader className="border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-white mb-2">Campaigns</CardTitle>
                <p className="text-sm text-gray-400">Manage and monitor your voice AI campaigns</p>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1">
                <Button
                  variant={campaignFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCampaignFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    campaignFilter === 'all'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  All
                </Button>
                <Button
                  variant={campaignFilter === 'active' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCampaignFilter('active')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    campaignFilter === 'active'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  Active
                </Button>
                <Button
                  variant={campaignFilter === 'paused' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCampaignFilter('paused')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    campaignFilter === 'paused'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredCampaigns.map((campaign, index) => (
                  <div
                    key={campaign.id}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-r from-gray-900/80 to-gray-800/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-gray-600 hover:shadow-xl hover:shadow-black/20"
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    {/* Background gradient effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-pink-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    
                    <div className="relative z-10">
                      <div className="mb-6 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{campaign.name}</h3>
                          <p className="text-sm text-gray-400 font-medium">ID: {campaign.apexId || 'apex00000'}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className={`${getStatusColor(campaign.status)} px-3 py-1 text-xs font-semibold inline-flex items-center justify-center w-20`}>
                            {getStatusIcon(campaign.status)}
                            <span className="ml-2 capitalize">{campaign.status}</span>
                          </Badge>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {campaign.status === 'draft' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCampaignAction(campaign.id, 'start');
                                }}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Start
                              </Button>
                            )}
                            {campaign.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-500/30 bg-amber-500/10 text-amber-400 transition-all duration-200 hover:border-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCampaignAction(campaign.id, 'pause');
                                }}
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                              </Button>
                            )}
                            {campaign.status === 'paused' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 transition-all duration-200 hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCampaignAction(campaign.id, 'resume');
                                }}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Resume
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCampaign(campaign);
                                setShowEditModal(true);
                              }}
                              className="text-gray-400 hover:bg-gray-700/50 hover:text-white transition-all duration-200 rounded-lg p-2"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/campaigns/${campaign.id}/calls`);
                              }}
                              className="text-gray-400 hover:bg-gray-700/50 hover:text-white transition-all duration-200 rounded-lg p-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                        </div>
                          {/* Delete button - always visible */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(campaign);
                            }}
                            className="text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 rounded-lg p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    </div>

                      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Users className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-400">Leads</p>
                            <p className="text-lg font-bold text-white">{campaign.totalLeads || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-400">Completed</p>
                            <p className="text-lg font-bold text-white">{campaign.callsCompleted || 0}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <DollarSign className="h-5 w-5 text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-400">Cost</p>
                            <p className="text-lg font-bold text-white">
                              ${campaign.totalCost?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/10 border border-pink-500/20">
                            <TrendingUp className="h-5 w-5 text-pink-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-400">Success</p>
                            <p className="text-lg font-bold text-white">
                              {campaign.successRate?.toFixed(1) || 0}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-300">Progress</span>
                          <span className="text-sm font-bold text-white">
                            {campaign.totalLeads
                              ? `${campaign.callsCompleted || 0}/${campaign.totalLeads}`
                              : '0/0'}
                          </span>
                        </div>
                        <div className="relative h-2 w-full rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-700 ease-out relative overflow-hidden"
                            style={{
                              width: `${Math.min(campaign.totalLeads ? ((campaign.callsCompleted || 0) / campaign.totalLeads) * 100 : 0, 100)}%`,
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </>
      )}

      {/* Concurrency Manager Tab */}
      {activeTab === 'concurrency' && (
        <DynamicConcurrencyManager />
      )}

      {/* Campaign Wizard Modal */}
      {showCampaignWizard && (
        <SimpleCampaignWizard
          onCampaignCreated={(campaign) => {
            setShowCampaignWizard(false);
            loadDashboardData(false);
            toast({
              title: 'Campaign Created',
              description: `Campaign "${campaign.name}" has been created successfully!`,
            });
          }}
          onCancel={() => setShowCampaignWizard(false)}
        />
      )}

      {/* Campaign Edit Wizard */}
      {showEditModal && selectedCampaign && (
        <CampaignEditWizard
          campaign={selectedCampaign}
          onCampaignUpdated={(updatedCampaign) => {
            // Update the campaign in the list
            setCampaigns(prev => prev.map(c =>
              c.id === updatedCampaign.id ? { ...c, ...updatedCampaign, updatedAt: new Date().toISOString() } : c
            ));
            setShowEditModal(false);
            setSelectedCampaign(null);
            toast({
              title: 'Campaign Updated',
              description: `Campaign "${updatedCampaign.name}" has been updated successfully!`,
            });
          }}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedCampaign(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Campaign"
        description="Are you sure you want to delete this campaign? This will permanently remove all associated leads, calls, and analytics data."
        itemName={campaignToDelete?.name}
        onConfirm={handleDeleteCampaign}
        isLoading={isDeleting}
      />
    </div>
  );
};


export default VapiDashboard;
