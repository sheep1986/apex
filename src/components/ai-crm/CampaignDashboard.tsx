import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Phone, 
  Users, 
  DollarSign, 
  Clock, 
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  Upload,
  Download,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Star,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { LeadImport } from './LeadImport';
import { CallMonitor } from './CallMonitor';
import { LeadQualification } from './LeadQualification';
import { CampaignExport } from './CampaignExport';

interface CampaignDashboardProps {
  campaignId: string;
  campaignName: string;
  websocketUrl: string;
  token: string;
}

interface CampaignStats {
  totalLeads: number;
  qualifiedLeads: number;
  activeCalls: number;
  totalCalls: number;
  totalCost: number;
  averageDuration: number;
  connectionRate: number;
  qualificationRate: number;
  costPerLead: number;
  costPerQualifiedLead: number;
  dailyCallsRemaining: number;
  complianceAlerts: number;
}

interface RecentActivity {
  id: string;
  type: 'lead_imported' | 'call_completed' | 'lead_qualified' | 'compliance_alert';
  message: string;
  timestamp: Date;
  severity?: 'low' | 'medium' | 'high';
}

interface CampaignStatus {
  status: 'active' | 'paused' | 'completed' | 'draft';
  isRunning: boolean;
  nextCallTime?: Date;
  phoneNumbers: number;
  assistantConfigured: boolean;
  complianceEnabled: boolean;
}

export const CampaignDashboard: React.FC<CampaignDashboardProps> = ({ 
  campaignId, 
  campaignName, 
  websocketUrl, 
  token 
}) => {
  const [stats, setStats] = useState<CampaignStats>({
    totalLeads: 0,
    qualifiedLeads: 0,
    activeCalls: 0,
    totalCalls: 0,
    totalCost: 0,
    averageDuration: 0,
    connectionRate: 0,
    qualificationRate: 0,
    costPerLead: 0,
    costPerQualifiedLead: 0,
    dailyCallsRemaining: 0,
    complianceAlerts: 0
  });
  
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>({
    status: 'draft',
    isRunning: false,
    phoneNumbers: 0,
    assistantConfigured: false,
    complianceEnabled: true
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchCampaignData();
    const interval = setInterval(fetchCampaignData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      const [statsResponse, statusResponse, activityResponse] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}/stats`),
        fetch(`/api/campaigns/${campaignId}/status`),
        fetch(`/api/campaigns/${campaignId}/activity`)
      ]);

      const statsData = await statsResponse.json();
      const statusData = await statusResponse.json();
      const activityData = await activityResponse.json();

      setStats(statsData);
      setCampaignStatus(statusData);
      setRecentActivity(activityData.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignControl = async (action: 'start' | 'pause' | 'stop') => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        fetchCampaignData();
      }
    } catch (error) {
      console.error('Error controlling campaign:', error);
    }
  };

  const handleImportComplete = (result: any) => {
    fetchCampaignData();
    setRecentActivity(prev => [{
      id: Date.now().toString(),
      type: 'lead_imported',
      message: `Imported ${result.imported} leads`,
      timestamp: new Date()
    }, ...prev]);
  };

  const handleLeadAction = (leadId: string, action: string) => {
    setRecentActivity(prev => [{
      id: Date.now().toString(),
      type: 'lead_qualified',
      message: `Lead action: ${action}`,
      timestamp: new Date()
    }, ...prev]);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead_imported': return <Upload className="w-4 h-4 text-blue-500" />;
      case 'call_completed': return <Phone className="w-4 h-4 text-green-500" />;
      case 'lead_qualified': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'compliance_alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{campaignName}</h1>
          <p className="text-gray-600">AI-powered cold calling campaign</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(campaignStatus.status)} text-white`}>
              {campaignStatus.status.toUpperCase()}
            </Badge>
            {campaignStatus.isRunning && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Running
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCampaignData()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {campaignStatus.isRunning ? (
              <Button
                onClick={() => handleCampaignControl('pause')}
                variant="outline"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                onClick={() => handleCampaignControl('start')}
                disabled={!campaignStatus.assistantConfigured}
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </Button>
            )}
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      <div className="space-y-2">
        {!campaignStatus.assistantConfigured && (
          <Alert className="border-yellow-500">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Assistant not configured. Please configure your VAPI assistant before starting the campaign.
            </AlertDescription>
          </Alert>
        )}
        
        {campaignStatus.phoneNumbers === 0 && (
          <Alert className="border-yellow-500">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              No phone numbers configured. Add phone numbers to start making calls.
            </AlertDescription>
          </Alert>
        )}
        
        {stats.complianceAlerts > 0 && (
          <Alert className="border-red-500">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              {stats.complianceAlerts} compliance alerts require attention.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Qualified</p>
                <p className="text-2xl font-bold text-green-600">{stats.qualifiedLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active Calls</p>
                <p className="text-2xl font-bold">{stats.activeCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Connection Rate</p>
                <p className="text-2xl font-bold">{stats.connectionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Qualification Rate</p>
                <p className="text-2xl font-bold">{stats.qualificationRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Qualification Rate</span>
                <span className="text-sm">{stats.qualificationRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.qualificationRate} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Rate</span>
                <span className="text-sm">{stats.connectionRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.connectionRate} className="h-2" />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Cost per Lead</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.costPerLead)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Cost per Qualified Lead</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.costPerQualifiedLead)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500">
                        {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {recentActivity.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="leads">Lead Import</TabsTrigger>
              <TabsTrigger value="calls">Call Monitor</TabsTrigger>
              <TabsTrigger value="qualified">Qualified Leads</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Campaign Overview
                </h3>
                <p className="text-gray-500">
                  Use the tabs above to manage your campaign components.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="leads" className="space-y-4">
              <LeadImport 
                campaignId={campaignId} 
                onImportComplete={handleImportComplete}
              />
            </TabsContent>
            
            <TabsContent value="calls" className="space-y-4">
              <CallMonitor 
                campaignId={campaignId}
                websocketUrl={websocketUrl}
                token={token}
              />
            </TabsContent>
            
            <TabsContent value="qualified" className="space-y-4">
              <LeadQualification 
                campaignId={campaignId}
                onLeadAction={handleLeadAction}
              />
            </TabsContent>
            
            <TabsContent value="export" className="space-y-4">
              <CampaignExport 
                campaignId={campaignId}
                campaignName={campaignName}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 py-4">
        <div>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-4">
          <span>Daily calls remaining: {stats.dailyCallsRemaining}</span>
          <span>•</span>
          <span>Average call duration: {formatDuration(stats.averageDuration)}</span>
        </div>
      </div>
    </div>
  );
};