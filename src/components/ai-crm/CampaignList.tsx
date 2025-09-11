import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Play, 
  Pause, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  BarChart3,
  Calendar,
  Phone,
  Users,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { CampaignWizard } from './CampaignWizard';
import { CampaignDashboard } from './CampaignDashboard';

interface CampaignListProps {
  websocketUrl: string;
  token: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  startDate: Date;
  endDate?: Date;
  totalLeads: number;
  qualifiedLeads: number;
  activeCalls: number;
  totalCalls: number;
  totalCost: number;
  connectionRate: number;
  qualificationRate: number;
  callsPerDay: number;
  dailyProgress: number;
  assistantName: string;
  phoneNumbers: number;
  complianceAlerts: number;
  nextCallTime?: Date;
}

interface CampaignFilters {
  search: string;
  status: string;
  sortBy: 'name' | 'created' | 'progress' | 'qualified';
  sortOrder: 'asc' | 'desc';
}

export const CampaignList: React.FC<CampaignListProps> = ({ websocketUrl, token }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [filters, setFilters] = useState<CampaignFilters>({
    search: '',
    status: 'all',
    sortBy: 'created',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [campaigns, filters]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.campaigns) {
        setCampaigns(data.campaigns.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name || 'Untitled',
          description: campaign.description || '',
          status: campaign.status || 'draft',
          createdAt: new Date(campaign.created_at || campaign.createdAt),
          startDate: new Date(campaign.start_date || campaign.startDate || Date.now()),
          endDate: campaign.end_date ? new Date(campaign.end_date) : undefined,
          totalLeads: campaign.leads_count?.count || 0,
          qualifiedLeads: campaign.completed_calls_count || 0,
          activeCalls: 0,
          totalCalls: campaign.calls_count?.count || 0,
          totalCost: campaign.spent || 0,
          connectionRate: parseFloat(campaign.conversion_rate) || 0,
          qualificationRate: parseFloat(campaign.conversion_rate) || 0,
          callsPerDay: campaign.calls_per_day || 10,
          dailyProgress: campaign.lead_goal > 0 ? Math.min(100, (campaign.leads_count?.count || 0) / campaign.lead_goal * 100) : 0,
          assistantName: campaign.assistant_id || 'Default Assistant',
          phoneNumbers: campaign.phone_numbers?.length || 1,
          complianceAlerts: 0,
          nextCallTime: undefined
        })));
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const campaignsArray = Array.isArray(campaigns) ? campaigns : [];
    let filtered = [...campaignsArray];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(campaign => 
        campaign.name.toLowerCase().includes(searchTerm) ||
        campaign.description.toLowerCase().includes(searchTerm) ||
        campaign.assistantName.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === filters.status);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'progress':
          aValue = a.dailyProgress;
          bValue = b.dailyProgress;
          break;
        case 'qualified':
          aValue = a.qualifiedLeads;
          bValue = b.qualifiedLeads;
          break;
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCampaigns(filtered);
  };

  const handleCampaignControl = async (campaignId: string, action: 'start' | 'pause' | 'stop') => {
    try {
      const endpoint = action === 'start' ? 'start' : 'pause';
      const response = await fetch(`http://localhost:3001/api/campaigns/${campaignId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error controlling campaign:', error);
    }
  };

  const handleDuplicateCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${campaignId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-purple-500';
      case 'draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'scheduled': return <Calendar className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'draft': return <Edit className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI CRM Campaigns</h1>
          <p className="text-gray-600">Manage your cold calling campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchCampaigns}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowWizard(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">
                  {campaigns.reduce((sum, c) => sum + c.totalLeads, 0).toLocaleString()}
                </p>
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
                <p className="text-2xl font-bold text-yellow-600">
                  {campaigns.reduce((sum, c) => sum + c.qualifiedLeads, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search campaigns..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="qualified">Qualified Leads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Select value={filters.sortOrder} onValueChange={(value) => setFilters({ ...filters, sortOrder: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(campaign.status)}
                  <Badge className={`${getStatusColor(campaign.status)} text-white`}>
                    {campaign.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {campaign.complianceAlerts > 0 && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  {campaign.activeCalls > 0 && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {campaign.activeCalls}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{campaign.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{campaign.description}</p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Campaign Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Assistant</p>
                  <p className="font-medium">{campaign.assistantName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone Numbers</p>
                  <p className="font-medium">{campaign.phoneNumbers}</p>
                </div>
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium">{formatDate(campaign.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Start Date</p>
                  <p className="font-medium">{formatDate(campaign.startDate)}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Daily Progress</span>
                  <span className="text-sm">{campaign.dailyProgress}%</span>
                </div>
                <Progress value={campaign.dailyProgress} className="h-2" />
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{campaign.totalCalls} calls made</span>
                  <span>{campaign.callsPerDay} daily target</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Leads</p>
                  <p className="text-lg font-bold">{campaign.totalLeads.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Qualified</p>
                  <p className="text-lg font-bold text-green-600">{campaign.qualifiedLeads}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Cost</p>
                  <p className="text-lg font-bold">${campaign.totalCost.toFixed(2)}</p>
                </div>
              </div>

              {/* Performance */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Connection Rate</p>
                  <p className="font-medium">{campaign.connectionRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Qualification Rate</p>
                  <p className="font-medium">{campaign.qualificationRate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Next Call Time */}
              {campaign.nextCallTime && campaign.status === 'active' && (
                <div className="text-sm">
                  <p className="text-gray-600">Next Call</p>
                  <p className="font-medium">{formatTime(campaign.nextCallTime)}</p>
                </div>
              )}

              {/* Compliance Alerts */}
              {campaign.complianceAlerts > 0 && (
                <Alert className="border-red-500">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    {campaign.complianceAlerts} compliance alerts require attention
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{campaign.name}</DialogTitle>
                    </DialogHeader>
                    {selectedCampaign && (
                      <CampaignDashboard
                        campaignId={selectedCampaign.id}
                        campaignName={selectedCampaign.name}
                        websocketUrl={websocketUrl}
                        token={token}
                      />
                    )}
                  </DialogContent>
                </Dialog>

                {campaign.status === 'active' ? (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => handleCampaignControl(campaign.id, 'pause')}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={() => handleCampaignControl(campaign.id, 'start')}
                    disabled={campaign.status === 'completed'}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </Button>
                )}

                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/campaigns/${campaign.id}/analytics`, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View Calls
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => handleDuplicateCampaign(campaign.id)}
                >
                  <Copy className="w-4 h-4" />
                </Button>

                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteCampaign(campaign.id)}
                  disabled={campaign.status === 'active'}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Campaigns */}
      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {campaigns.length === 0 ? 'No campaigns yet' : 'No campaigns match your filters'}
          </h3>
          <p className="text-gray-500 mb-4">
            {campaigns.length === 0 
              ? 'Create your first AI-powered cold calling campaign to get started.'
              : 'Try adjusting your filters to find the campaigns you\'re looking for.'
            }
          </p>
          {campaigns.length === 0 && (
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Campaign
            </Button>
          )}
        </div>
      )}

      {/* Campaign Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
          </DialogHeader>
          <CampaignWizard
            onCampaignCreated={(campaign) => {
              setShowWizard(false);
              fetchCampaigns();
            }}
            onCancel={() => setShowWizard(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};