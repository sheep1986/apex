import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabaseService } from '@/services/supabase-service';
import { useUserContext } from '@/services/MinimalUserProvider';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Target,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Copy,
  Settings,
  Users,
  Phone,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Eye,
  Download,
  Upload,
  BarChart3,
  Zap,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  type: 'outbound' | 'inbound' | 'mixed';
  targetAudience: string;
  leadGoal: number;
  budget: number;
  spent: number;
  leads: number;
  calls: number;
  conversion: number;
  roi: number;
  startDate: string;
  endDate: string;
  assistant: string;
  phoneNumbers: string[];
  schedule: {
    timezone: string;
    hours: string;
    days: string[];
  };
  createdAt: string;
  lastModified: string;
}

export default function CampaignManagement() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Form state for creating/editing campaigns
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'outbound' as 'outbound' | 'inbound' | 'mixed',
    targetAudience: '',
    leadGoal: 100,
    budget: 1000,
    assistant: '',
    timezone: 'America/New_York',
    hours: '9:00 AM - 5:00 PM',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      // Fetch real campaigns from the API
      const response = await apiClient.get('/campaigns', {
        params: {
          limit: 100, // Get more campaigns
          sortBy: 'created_at',
          sortOrder: 'desc'
        }
      });

      if (response.data && response.data.campaigns) {
        // Transform the data to match our interface
        const transformedCampaigns = response.data.campaigns.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name || 'Untitled Campaign',
          description: campaign.description || '',
          status: campaign.status || 'draft',
          type: campaign.type || 'outbound',
          targetAudience: campaign.target_audience || '',
          leadGoal: campaign.lead_goal || 100,
          budget: campaign.budget || 0,
          spent: campaign.spent || campaign.total_cost || 0,
          leads: typeof campaign.leads_count === 'object' ? (campaign.leads_count?.count || 0) : (campaign.leads_count || 0),
          calls: typeof campaign.calls_count === 'object' ? (campaign.calls_count?.count || 0) : (campaign.calls_count || 0),
          conversion: parseFloat(campaign.conversion_rate) || 0,
          roi: campaign.roi || 0,
          startDate: campaign.start_date || new Date().toISOString(),
          endDate: campaign.end_date || '',
          assistant: campaign.assistant_id || '',
          phoneNumbers: campaign.phone_numbers || [],
          schedule: {
            timezone: campaign.timezone || 'America/New_York',
            hours: campaign.calling_hours || '9:00 AM - 5:00 PM',
            days: campaign.calling_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          },
          createdAt: campaign.created_at,
          lastModified: campaign.updated_at || campaign.created_at,
        }));

        setCampaigns(transformedCampaigns);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns. Please try again.',
        variant: 'destructive',
      });
      // Set empty array on error
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      // Create campaign via API
      const response = await apiClient.post('/campaigns', {
        name: formData.name,
        description: formData.description,
        status: 'draft',
        type: formData.type,
        target_audience: formData.targetAudience,
        lead_goal: formData.leadGoal,
        budget: formData.budget,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        assistant_id: formData.assistant,
        timezone: formData.timezone,
        calling_hours: formData.hours,
        calling_days: formData.days,
      });

      if (response.data) {
        // Reload campaigns to show the new one
        await loadCampaigns();
        setShowCreateModal(false);
        resetForm();
        
        toast({
          title: 'Campaign Created',
          description: `${formData.name} has been created successfully.`,
        });
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditCampaign = async () => {
    if (!selectedCampaign) return;

    try {
      // Update campaign via API
      const response = await apiClient.put(`/campaigns/${selectedCampaign.id}`, {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        target_audience: formData.targetAudience,
        lead_goal: formData.leadGoal,
        budget: formData.budget,
        assistant_id: formData.assistant,
        timezone: formData.timezone,
        calling_hours: formData.hours,
        calling_days: formData.days,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
      });

      if (response.data) {
        // Reload campaigns to show the updated one
        await loadCampaigns();
        setShowEditModal(false);
        setSelectedCampaign(null);
        resetForm();
        
        toast({
          title: 'Campaign Updated',
          description: `${formData.name} has been updated successfully.`,
        });
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to update campaign. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'outbound',
      targetAudience: '',
      leadGoal: 100,
      budget: 1000,
      assistant: '',
      timezone: 'America/New_York',
      hours: '9:00 AM - 5:00 PM',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    });
  };

  const handleStatusChange = async (campaignId: string, newStatus: Campaign['status']) => {
    try {
      // Update status via API
      const response = await apiClient.put(`/campaigns/${campaignId}`, {
        status: newStatus
      });

      if (response.data) {
        // Reload campaigns to show the updated status
        await loadCampaigns();
        
        const campaign = campaigns.find(c => c.id === campaignId);
        toast({
          title: 'Campaign Status Updated',
          description: `${campaign?.name} is now ${newStatus}.`,
        });
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update campaign status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      // Create a duplicate via API
      const response = await apiClient.post('/campaigns', {
        name: `${campaign.name} (Copy)`,
        description: campaign.description,
        status: 'draft',
        type: campaign.type,
        target_audience: campaign.targetAudience,
        lead_goal: campaign.leadGoal,
        budget: campaign.budget,
        start_date: new Date().toISOString().split('T')[0],
        end_date: campaign.endDate || null,
        assistant_id: campaign.assistant,
        timezone: campaign.schedule.timezone,
        calling_hours: campaign.schedule.hours,
        calling_days: campaign.schedule.days,
      });

      if (response.data) {
        // Reload campaigns to show the duplicate
        await loadCampaigns();
        
        toast({
          title: 'Campaign Duplicated',
          description: `${campaign.name} (Copy) has been created.`,
        });
      }
    } catch (error) {
      console.error('Error duplicating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate campaign. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (confirm(`Are you sure you want to delete "${campaign?.name}"?`)) {
      try {
        // Delete campaign via API
        const response = await apiClient.delete(`/campaigns/${campaignId}`);

        if (response.data) {
          // Reload campaigns to reflect the deletion
          await loadCampaigns();
          
          toast({
            title: 'Campaign Deleted',
            description: `${campaign?.name} has been deleted.`,
          });
        }
      } catch (error) {
        console.error('Error deleting campaign:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete campaign. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-emerald-600';
      case 'paused': return 'bg-yellow-600';
      case 'completed': return 'bg-blue-600';
      case 'draft': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <AlertCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesFilter = filter === 'all' || campaign.status === filter;
    const matchesSearch = campaign.name.toLowerCase().includes(search.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const openEditModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      targetAudience: campaign.targetAudience,
      leadGoal: campaign.leadGoal,
      budget: campaign.budget,
      assistant: campaign.assistant,
      timezone: campaign.schedule.timezone,
      hours: campaign.schedule.hours,
      days: campaign.schedule.days,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Campaign Management</h1>
            <p className="text-gray-400">Create, edit, and manage your calling campaigns</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{campaigns.length}</div>
              <p className="text-xs text-gray-500">
                {campaigns.filter(c => c.status === 'active').length} active
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {campaigns.reduce((sum, c) => sum + c.leads, 0)}
              </div>
              <p className="text-xs text-emerald-400">+15.3% this month</p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {campaigns.reduce((sum, c) => sum + c.calls, 0)}
              </div>
              <p className="text-xs text-emerald-400">+12.7% this month</p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Average ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {campaigns.length > 0 ? (campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length).toFixed(1) : '0.0'}%
              </div>
              <p className="text-xs text-emerald-400">+8.9% this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 border-gray-700 bg-gray-800 text-white"
            />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48 border-gray-700 bg-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800">
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="border-gray-800 bg-gray-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-white">{campaign.name}</h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusIcon(campaign.status)}
                      <span className="ml-1">{campaign.status.toUpperCase()}</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {campaign.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(campaign.id, 'paused')}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                    ) : campaign.status === 'paused' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(campaign.id, 'active')}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </Button>
                    ) : campaign.status === 'draft' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(campaign.id, 'active')}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Launch
                      </Button>
                    ) : null}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(campaign)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateCampaign(campaign)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-gray-400 mb-4">{campaign.description}</p>
                
                <div className="grid grid-cols-2 gap-6 md:grid-cols-6">
                  <div>
                    <p className="text-xs text-gray-400">Target</p>
                    <p className="text-sm font-medium text-white">{campaign.leadGoal} leads</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Progress</p>
                    <p className="text-sm font-medium text-blue-400">
                      {campaign.leads}/{campaign.leadGoal} ({campaign.leadGoal > 0 ? ((campaign.leads / campaign.leadGoal) * 100).toFixed(1) : '0.0'}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Calls Made</p>
                    <p className="text-sm font-medium text-white">{campaign.calls}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Budget</p>
                    <p className="text-sm font-medium text-white">
                      ${(campaign.spent || 0).toFixed(2)} / ${campaign.budget || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Conversion</p>
                    <p className="text-sm font-medium text-emerald-400">{(campaign.conversion || 0).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">ROI</p>
                    <p className="text-sm font-medium text-emerald-400">{campaign.roi}%</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span>Assistant: {campaign.assistant}</span>
                  <span>•</span>
                  <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Modified: {new Date(campaign.lastModified).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredCampaigns.length === 0 && (
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="py-12 text-center">
                <Target className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No campaigns found</h3>
                <p className="text-gray-500 mb-4">
                  {search || filter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Create your first campaign to get started.'}
                </p>
                {!search && filter === 'all' && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Campaign Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-4xl border-gray-800 bg-gray-900 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription className="text-gray-400">
                Set up a new calling campaign with your target audience and goals.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Basic Information</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Campaign Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="border-gray-700 bg-gray-800"
                      placeholder="e.g. Real Estate Lead Generation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Campaign Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'outbound' | 'inbound' | 'mixed') =>
                        setFormData({...formData, type: value})
                      }
                    >
                      <SelectTrigger className="border-gray-700 bg-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-gray-700 bg-gray-800">
                        <SelectItem value="outbound">Outbound Calls</SelectItem>
                        <SelectItem value="inbound">Inbound Calls</SelectItem>
                        <SelectItem value="mixed">Mixed Campaign</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                    placeholder="Describe your campaign goals and strategy..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Target & Goals */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Target & Goals</h4>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Input
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                    placeholder="e.g. Homeowners 35-65, High-value properties"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Lead Goal</Label>
                    <Input
                      type="number"
                      value={formData.leadGoal}
                      onChange={(e) => setFormData({...formData, leadGoal: parseInt(e.target.value) || 0})}
                      className="border-gray-700 bg-gray-800"
                      placeholder="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget ($)</Label>
                    <Input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: parseInt(e.target.value) || 0})}
                      className="border-gray-700 bg-gray-800"
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Schedule</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="border-gray-700 bg-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date (Optional)</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="border-gray-700 bg-gray-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => setFormData({...formData, timezone: value})}
                    >
                      <SelectTrigger className="border-gray-700 bg-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-gray-700 bg-gray-800">
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Calling Hours</Label>
                    <Input
                      value={formData.hours}
                      onChange={(e) => setFormData({...formData, hours: e.target.value})}
                      className="border-gray-700 bg-gray-800"
                      placeholder="9:00 AM - 5:00 PM"
                    />
                  </div>
                </div>
              </div>

              {/* AI Assistant */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">AI Assistant</h4>
                <div className="space-y-2">
                  <Label>Select Assistant</Label>
                  <Select
                    value={formData.assistant}
                    onValueChange={(value) => setFormData({...formData, assistant: value})}
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-800">
                      <SelectValue placeholder="Choose an AI assistant" />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
                      <SelectItem value="real-estate-pro">Real Estate Pro Assistant</SelectItem>
                      <SelectItem value="insurance-specialist">Insurance Specialist</SelectItem>
                      <SelectItem value="solar-consultant">Solar Energy Consultant</SelectItem>
                      <SelectItem value="general-sales">General Sales Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-700 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="border-gray-700"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={!formData.name || !formData.description || !formData.assistant}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:opacity-50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Campaign Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl border-gray-800 bg-gray-900 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Campaign</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update your campaign settings and configuration.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              {/* Same form structure as create modal */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Basic Information</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Campaign Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="border-gray-700 bg-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Campaign Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'outbound' | 'inbound' | 'mixed') =>
                        setFormData({...formData, type: value})
                      }
                    >
                      <SelectTrigger className="border-gray-700 bg-gray-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-gray-700 bg-gray-800">
                        <SelectItem value="outbound">Outbound Calls</SelectItem>
                        <SelectItem value="inbound">Inbound Calls</SelectItem>
                        <SelectItem value="mixed">Mixed Campaign</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                    rows={3}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-700 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCampaign(null);
                    resetForm();
                  }}
                  className="border-gray-700"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleEditCampaign}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}