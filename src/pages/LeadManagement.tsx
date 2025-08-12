import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Users,
  Plus,
  Download,
  Upload,
  Search,
  Filter,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  Target,
  TrendingUp,
  Eye,
  Save,
  X,
  Globe,
  Building,
} from 'lucide-react';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  title?: string;
  location: string;
  source: string;
  campaign: string;
  quality: 'hot' | 'warm' | 'cold';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  score: number;
  notes: string;
  lastContact: string;
  nextFollowup?: string;
  tags: string[];
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface ImportJob {
  id: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  totalRows: number;
  processedRows: number;
  successRows: number;
  errorRows: number;
  startTime: string;
  endTime?: string;
  errors?: string[];
}

export default function LeadManagement() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);

  // Form state for creating/editing leads
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    location: '',
    source: '',
    campaign: '',
    quality: 'warm' as 'hot' | 'warm' | 'cold',
    status: 'new' as 'new' | 'contacted' | 'qualified' | 'converted' | 'lost',
    notes: '',
    tags: [] as string[],
  });

  useEffect(() => {
    loadLeads();
    loadImportJobs();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    // Simulate API call with demo data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLeads([
      {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0123',
        company: 'ABC Corp',
        title: 'Marketing Director',
        location: 'New York, NY',
        source: 'Cold Call',
        campaign: 'Real Estate Lead Generation',
        quality: 'hot',
        status: 'qualified',
        score: 85,
        notes: 'Very interested in selling property. Has 3 properties in Manhattan.',
        lastContact: '2024-01-19T14:30:00Z',
        nextFollowup: '2024-01-22T10:00:00Z',
        tags: ['high-value', 'manhattan', 'multiple-properties'],
        customFields: { 'Property Value': '$2.5M', 'Timeline': '3 months' },
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-19T14:30:00Z',
      },
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@techcorp.com',
        phone: '+1-555-0456',
        company: 'TechCorp Solutions',
        title: 'VP of Operations',
        location: 'San Francisco, CA',
        source: 'Website Form',
        campaign: 'Insurance Follow-up Campaign',
        quality: 'warm',
        status: 'contacted',
        score: 72,
        notes: 'Interested in business insurance. Currently with competitor.',
        lastContact: '2024-01-18T11:15:00Z',
        nextFollowup: '2024-01-25T14:00:00Z',
        tags: ['business-insurance', 'competitor', 'enterprise'],
        customFields: { 'Current Premium': '$15K/year', 'Employees': '200+' },
        createdAt: '2024-01-12T16:20:00Z',
        updatedAt: '2024-01-18T11:15:00Z',
      },
      {
        id: '3',
        firstName: 'Michael',
        lastName: 'Davis',
        email: 'michael.davis@email.com',
        phone: '+1-555-0789',
        company: 'Davis Consulting',
        title: 'Founder',
        location: 'Austin, TX',
        source: 'LinkedIn',
        campaign: 'Solar Panel Outreach',
        quality: 'cold',
        status: 'new',
        score: 45,
        notes: 'Initial contact made. Owns large office building.',
        lastContact: '2024-01-20T09:45:00Z',
        tags: ['solar', 'commercial', 'founder'],
        customFields: { 'Building Size': '50,000 sq ft', 'Energy Bill': '$3K/month' },
        createdAt: '2024-01-20T09:45:00Z',
        updatedAt: '2024-01-20T09:45:00Z',
      },
    ]);
    setLoading(false);
  };

  const loadImportJobs = () => {
    setImportJobs([
      {
        id: '1',
        filename: 'leads_january_2024.csv',
        status: 'completed',
        progress: 100,
        totalRows: 2500,
        processedRows: 2500,
        successRows: 2487,
        errorRows: 13,
        startTime: '2024-01-19T10:00:00Z',
        endTime: '2024-01-19T10:15:00Z',
        errors: ['Row 45: Invalid email format', 'Row 128: Missing phone number'],
      },
      {
        id: '2',
        filename: 'webinar_attendees.xlsx',
        status: 'processing',
        progress: 67,
        totalRows: 1200,
        processedRows: 804,
        successRows: 799,
        errorRows: 5,
        startTime: '2024-01-20T14:30:00Z',
      },
    ]);
  };

  // Filter and sort leads
  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch = 
        lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);
      
      const matchesQuality = filterQuality === 'all' || lead.quality === filterQuality;
      const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
      const matchesSource = filterSource === 'all' || lead.source === filterSource;
      
      return matchesSearch && matchesQuality && matchesStatus && matchesSource;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.firstName.localeCompare(b.firstName);
        case 'name_desc':
          return b.firstName.localeCompare(a.firstName);
        case 'score_desc':
          return b.score - a.score;
        case 'score_asc':
          return a.score - b.score;
        case 'created_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  const handleCreateLead = async () => {
    try {
      const newLead: Lead = {
        id: Date.now().toString(),
        ...formData,
        score: Math.floor(Math.random() * 40) + 60, // Random score 60-100
        lastContact: new Date().toISOString(),
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setLeads(prev => [newLead, ...prev]);
      setShowCreateModal(false);
      resetForm();
      
      toast({
        title: 'Lead Created',
        description: `${formData.firstName} ${formData.lastName} has been added to your leads.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditLead = async () => {
    if (!selectedLead) return;

    try {
      const updatedLead: Lead = {
        ...selectedLead,
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      setLeads(prev => prev.map(l => l.id === selectedLead.id ? updatedLead : l));
      setShowEditModal(false);
      setSelectedLead(null);
      resetForm();
      
      toast({
        title: 'Lead Updated',
        description: `${formData.firstName} ${formData.lastName} has been updated.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      title: '',
      location: '',
      source: '',
      campaign: '',
      quality: 'warm',
      status: 'new',
      notes: '',
      tags: [],
    });
  };

  const handleLeadSelection = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleBulkStatusUpdate = (newStatus: Lead['status']) => {
    setLeads(prev => prev.map(lead => 
      selectedLeads.includes(lead.id) 
        ? { ...lead, status: newStatus, updatedAt: new Date().toISOString() }
        : lead
    ));
    setSelectedLeads([]);
    
    toast({
      title: 'Bulk Update Completed',
      description: `Updated ${selectedLeads.length} lead(s) to ${newStatus}.`,
    });
  };

  const handleBulkDelete = () => {
    setLeads(prev => prev.filter(lead => !selectedLeads.includes(lead.id)));
    setSelectedLeads([]);
    
    toast({
      title: 'Leads Deleted',
      description: `Deleted ${selectedLeads.length} lead(s).`,
    });
  };

  const handleExportLeads = (format: 'csv' | 'xlsx' | 'json') => {
    const leadsToExport = selectedLeads.length > 0 
      ? leads.filter(lead => selectedLeads.includes(lead.id))
      : filteredLeads;

    toast({
      title: 'Export Started',
      description: `Exporting ${leadsToExport.length} lead(s) as ${format.toUpperCase()}...`,
    });

    // Simulate export
    setTimeout(() => {
      toast({
        title: 'Export Completed',
        description: `Successfully exported ${leadsToExport.length} lead(s).`,
      });
    }, 2000);
  };

  const openEditModal = (lead: Lead) => {
    setSelectedLead(lead);
    setFormData({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company || '',
      title: lead.title || '',
      location: lead.location,
      source: lead.source,
      campaign: lead.campaign,
      quality: lead.quality,
      status: lead.status,
      notes: lead.notes,
      tags: lead.tags,
    });
    setShowEditModal(true);
  };

  const getQualityColor = (quality: Lead['quality']) => {
    switch (quality) {
      case 'hot': return 'bg-red-600';
      case 'warm': return 'bg-yellow-600';
      case 'cold': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getQualityIcon = (quality: Lead['quality']) => {
    switch (quality) {
      case 'hot': return <Zap className="h-4 w-4" />;
      case 'warm': return <AlertCircle className="h-4 w-4" />;
      case 'cold': return <XCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-600';
      case 'contacted': return 'bg-yellow-600';
      case 'qualified': return 'bg-emerald-600';
      case 'converted': return 'bg-green-600';
      case 'lost': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: Lead['status']) => {
    switch (status) {
      case 'new': return <Clock className="h-4 w-4" />;
      case 'contacted': return <Phone className="h-4 w-4" />;
      case 'qualified': return <CheckCircle className="h-4 w-4" />;
      case 'converted': return <Target className="h-4 w-4" />;
      case 'lost': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading leads...</p>
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
            <h1 className="text-3xl font-bold text-white">Lead Management</h1>
            <p className="text-gray-400">Manage and track your sales leads</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Leads
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{leads.length}</div>
              <p className="text-xs text-gray-500">+12% this month</p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Hot Leads</CardTitle>
              <Zap className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {leads.filter(l => l.quality === 'hot').length}
              </div>
              <p className="text-xs text-emerald-400">+8% this week</p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Qualified</CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {leads.filter(l => l.status === 'qualified').length}
              </div>
              <p className="text-xs text-emerald-400">+15% this month</p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Converted</CardTitle>
              <Target className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {leads.filter(l => l.status === 'converted').length}
              </div>
              <p className="text-xs text-emerald-400">+22% this month</p>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Score</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)}
              </div>
              <p className="text-xs text-emerald-400">+5% this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="border-gray-800 bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 border-gray-700 bg-gray-800 text-white"
                />
                
                <Select value={filterQuality} onValueChange={setFilterQuality}>
                  <SelectTrigger className="w-40 border-gray-700 bg-gray-800 text-white">
                    <SelectValue placeholder="Quality" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem value="all">All Quality</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40 border-gray-700 bg-gray-800 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 border-gray-700 bg-gray-800 text-white">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem value="created_desc">Newest First</SelectItem>
                    <SelectItem value="created_asc">Oldest First</SelectItem>
                    <SelectItem value="name_asc">Name A-Z</SelectItem>
                    <SelectItem value="name_desc">Name Z-A</SelectItem>
                    <SelectItem value="score_desc">Highest Score</SelectItem>
                    <SelectItem value="score_asc">Lowest Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExportLeads('csv')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportLeads('xlsx')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedLeads.length > 0 && (
              <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3">
                <span className="text-sm text-gray-300">
                  {selectedLeads.length} lead(s) selected
                </span>
                
                <Select onValueChange={(value) => handleBulkStatusUpdate(value as Lead['status'])}>
                  <SelectTrigger className="w-48 border-gray-600 bg-gray-700 text-white">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-800">
                    <SelectItem value="contacted">Mark as Contacted</SelectItem>
                    <SelectItem value="qualified">Mark as Qualified</SelectItem>
                    <SelectItem value="converted">Mark as Converted</SelectItem>
                    <SelectItem value="lost">Mark as Lost</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportLeads('csv')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLeads([])}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leads List */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Leads ({filteredLeads.length})</CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-400">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4 transition-all hover:bg-gray-800"
                >
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={(checked) => handleLeadSelection(lead.id, checked as boolean)}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-medium text-white">
                        {lead.firstName} {lead.lastName}
                      </h4>
                      <Badge className={getQualityColor(lead.quality)}>
                        {getQualityIcon(lead.quality)}
                        <span className="ml-1">{lead.quality.toUpperCase()}</span>
                      </Badge>
                      <Badge className={getStatusColor(lead.status)}>
                        {getStatusIcon(lead.status)}
                        <span className="ml-1">{lead.status.toUpperCase()}</span>
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm text-white">{lead.score}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                      <div>
                        <p className="text-xs text-gray-400">Contact</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Mail className="h-3 w-3" />
                            <span>{lead.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Phone className="h-3 w-3" />
                            <span>{lead.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Company</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-white">
                            <Building className="h-3 w-3" />
                            <span>{lead.company || 'N/A'}</span>
                          </div>
                          <div className="text-sm text-gray-300">{lead.title || 'N/A'}</div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Location & Source</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <MapPin className="h-3 w-3" />
                            <span>{lead.location}</span>
                          </div>
                          <div className="text-sm text-gray-300">{lead.source}</div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Campaign</p>
                        <div className="text-sm text-white">{lead.campaign}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Created: {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Last Contact</p>
                        <div className="text-sm text-white">
                          {new Date(lead.lastContact).toLocaleDateString()}
                        </div>
                        {lead.nextFollowup && (
                          <div className="text-xs text-yellow-400 mt-1">
                            Next: {new Date(lead.nextFollowup).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {lead.notes && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400">Notes</p>
                        <p className="text-sm text-gray-300">{lead.notes}</p>
                      </div>
                    )}

                    {lead.tags.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {lead.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(lead)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: 'Lead Profile',
                          description: `Viewing details for ${lead.firstName} ${lead.lastName}`,
                        });
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {filteredLeads.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No leads found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterQuality !== 'all' || filterStatus !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Create your first lead to get started.'}
                  </p>
                  {!searchTerm && filterQuality === 'all' && filterStatus === 'all' && (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Lead
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Import Jobs */}
        {importJobs.length > 0 && (
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-white">Recent Import Jobs</CardTitle>
              <CardDescription className="text-gray-400">
                Track your lead import progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {importJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="font-medium text-white">{job.filename}</p>
                        <p className="text-sm text-gray-400">
                          {job.successRows} successful, {job.errorRows} errors
                        </p>
                      </div>
                    </div>

                    <div className="ml-auto flex items-center gap-6">
                      {job.status === 'processing' && (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-32 rounded-full bg-gray-700">
                            <div
                              className="h-2 rounded-full bg-blue-500 transition-all"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400">{job.progress}%</span>
                        </div>
                      )}

                      <div className="text-sm text-gray-400">
                        {job.processedRows} / {job.totalRows}
                      </div>

                      <Badge className={
                        job.status === 'completed' ? 'bg-emerald-600' :
                        job.status === 'processing' ? 'bg-blue-600' :
                        'bg-red-600'
                      }>
                        {job.status.toUpperCase()}
                      </Badge>

                      <div className="text-sm text-gray-500">
                        {new Date(job.startTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Lead Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-4xl border-gray-800 bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new lead record with contact and qualification information.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                    placeholder="john.smith@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                    placeholder="+1-555-0123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                    placeholder="ABC Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                    placeholder="Marketing Director"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                    placeholder="New York, NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lead Quality</Label>
                  <Select
                    value={formData.quality}
                    onValueChange={(value: 'hot' | 'warm' | 'cold') =>
                      setFormData({...formData, quality: value})
                    }
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="warm">Warm</SelectItem>
                      <SelectItem value="cold">Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Lead['status']) =>
                      setFormData({...formData, status: value})
                    }
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="border-gray-700 bg-gray-800"
                  placeholder="Add notes about this lead..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
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
                  onClick={handleCreateLead}
                  disabled={!formData.firstName || !formData.lastName || !formData.email}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:opacity-50"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Create Lead
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Lead Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl border-gray-800 bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>Edit Lead</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update lead information and qualification status.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Same form structure as create modal */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="border-gray-700 bg-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedLead(null);
                    resetForm();
                  }}
                  className="border-gray-700"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleEditLead}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Modal */}
        <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
          <DialogContent className="max-w-2xl border-gray-800 bg-gray-900 text-white">
            <DialogHeader>
              <DialogTitle>Import Leads</DialogTitle>
              <DialogDescription className="text-gray-400">
                Upload a CSV or Excel file to import multiple leads at once.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="rounded-lg border-2 border-dashed border-gray-700 bg-gray-800/50 p-8 text-center">
                <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-lg font-medium text-white mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  Supports CSV and Excel files up to 10MB
                </p>
                <Button variant="outline" className="border-gray-600">
                  Choose File
                </Button>
              </div>

              <div className="rounded-lg border border-blue-800 bg-blue-900/20 p-4">
                <div className="flex gap-3">
                  <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
                  <div className="text-sm text-gray-300">
                    <p className="mb-1 font-medium text-blue-400">File Format Requirements</p>
                    <p>
                      Your file should include columns: First Name, Last Name, Email, Phone, Company, Location, Source
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowImportModal(false)}
                  className="border-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  disabled
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 disabled:opacity-50"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Start Import
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}