import { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  Users, 
  Phone, 
  Mail, 
  Building, 
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Star,
  Tag,
  Calendar,
  BarChart3,
  RefreshCw,
  Settings,
  Briefcase,
  User,
  Shield,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  status: 'new' | 'contacted' | 'interested' | 'qualified' | 'converted' | 'unqualified';
  priority: 'low' | 'medium' | 'high';
  source: string;
  campaign: string;
  tags: string[];
  lastContacted: string;
  nextFollowUp: string;
  notes: string;
  customFields: Record<string, any>;
  campaignType?: 'b2c' | 'b2b';
}

const statusColors: Record<string, string> = {
  new: "bg-gray-500 text-white",
  contacted: "bg-blue-500 text-white",
  interested: "bg-yellow-500 text-white",
  qualified: "bg-purple-500 text-white",
  converted: "bg-green-500 text-white",
  unqualified: "bg-red-500 text-white",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-400 text-white",
  medium: "bg-yellow-500 text-white",
  high: "bg-red-500 text-white",
};

// Campaign type configurations
const CAMPAIGN_CONFIGS = {
  b2c: {
    name: 'B2C (Business to Consumer)',
    description: 'Target individual consumers with personalized offers',
    icon: User,
    requiredFields: ['firstName', 'phone'],
    optionalFields: ['lastName', 'email', 'age', 'interests'],
    features: ['Consent Management', 'DNC Compliance', 'Personalization', 'Age Verification'],
    color: 'bg-blue-500'
  },
  b2b: {
    name: 'B2B (Business to Business)',
    description: 'Target business decision makers and companies',
    icon: Briefcase,
    requiredFields: ['firstName', 'lastName', 'company', 'phone'],
    optionalFields: ['email', 'title', 'industry', 'companySize', 'budget'],
    features: ['Company Enrichment', 'Decision Maker Targeting', 'Budget Qualification', 'Industry Segmentation'],
    color: 'bg-purple-500'
  }
};

// Mock data for leads
const mockLeads: Lead[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@techcorp.com',
    phone: '+1 (555) 123-4567',
    company: 'TechCorp Solutions',
    title: 'CTO',
    status: 'interested',
    priority: 'high',
    source: 'LinkedIn',
    campaign: 'Q4 Enterprise Outreach',
    tags: ['Enterprise', 'Tech', 'Decision Maker'],
    lastContacted: '2025-06-28 14:30',
    nextFollowUp: '2025-07-02 10:00',
    notes: 'Interested in AI automation. Wants to see ROI projections.',
    customFields: { industry: 'Technology', employeeCount: '500-1000', budget: '$100k+' },
    campaignType: 'b2b'
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@healthcare.com',
    phone: '+1 (555) 987-6543',
    company: 'Healthcare Plus',
    title: 'Operations Director',
    status: 'qualified',
    priority: 'medium',
    source: 'Website Form',
    campaign: 'Healthcare Outreach',
    tags: ['Healthcare', 'Operations'],
    lastContacted: '2025-06-27 16:45',
    nextFollowUp: '2025-07-01 14:00',
    notes: 'Looking to automate patient scheduling. Budget approved.',
    customFields: { industry: 'Healthcare', employeeCount: '200-500', budget: '$50k-$100k' },
    campaignType: 'b2b'
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Davis',
    email: 'mike.davis@email.com',
    phone: '+1 (555) 456-7890',
    company: '',
    title: '',
    status: 'new',
    priority: 'medium',
    source: 'Website Signup',
    campaign: 'Consumer App Launch',
    tags: ['Consumer', 'App User'],
    lastContacted: '',
    nextFollowUp: '2025-06-30 09:00',
    notes: 'Signed up for free trial. Interested in premium features.',
    customFields: { age: '28', interests: 'Technology,Gaming', consent: 'yes' },
    campaignType: 'b2c'
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Wilson',
    email: 'emily.w@email.com',
    phone: '+1 (555) 789-0123',
    company: '',
    title: '',
    status: 'contacted',
    priority: 'low',
    source: 'Social Media',
    campaign: 'Holiday Promotion',
    tags: ['Consumer', 'Social Media'],
    lastContacted: '2025-06-26 11:20',
    nextFollowUp: '2025-07-03 15:30',
    notes: 'Interested in holiday deals. Follow up with personalized offers.',
    customFields: { age: '35', interests: 'Shopping,Travel', consent: 'yes' },
    campaignType: 'b2c'
  },
  {
    id: '5',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.b@manufacturing.com',
    phone: '+1 (555) 321-6540',
    company: 'Precision Manufacturing',
    title: 'Plant Manager',
    status: 'converted',
    priority: 'low',
    source: 'Referral',
    campaign: 'Manufacturing Efficiency',
    tags: ['Manufacturing', 'Converted'],
    lastContacted: '2025-06-25 13:15',
    nextFollowUp: '2025-07-15 10:00',
    notes: 'Successfully converted! Implementation scheduled for Q3.',
    customFields: { industry: 'Manufacturing', employeeCount: '500-1000', budget: '$75k' },
    campaignType: 'b2b'
  }
];

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [campaignTypeFilter, setCampaignTypeFilter] = useState<'all' | 'b2c' | 'b2b'>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedCampaignType, setSelectedCampaignType] = useState<'b2c' | 'b2b'>('b2b');
  const [showCampaignTypeSelector, setShowCampaignTypeSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    const matchesCampaign = campaignFilter === 'all' || lead.campaign === campaignFilter;
    const matchesCampaignType = campaignTypeFilter === 'all' || lead.campaignType === campaignTypeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCampaign && matchesCampaignType;
  });

  const stats = {
    total: leads.length,
    b2c: leads.filter(l => l.campaignType === 'b2c').length,
    b2b: leads.filter(l => l.campaignType === 'b2b').length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    interested: leads.filter(l => l.status === 'interested').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    unqualified: leads.filter(l => l.status === 'unqualified').length,
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadStatus('uploading');
    setUploadMessage(`Processing ${selectedCampaignType.toUpperCase()} CSV file...`);

    try {
      // Simulate file processing with campaign type
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically:
      // 1. Parse the CSV file
      // 2. Validate the data based on campaign type
      // 3. Upload to your backend with campaign type
      // 4. Store in database
      
      setUploadStatus('success');
      setUploadMessage(`Successfully imported ${Math.floor(Math.random() * 100) + 50} ${selectedCampaignType.toUpperCase()} leads from ${file.name}`);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Error processing file. Please check the format and try again.');
    }
  };

  const downloadTemplate = () => {
    const config = CAMPAIGN_CONFIGS[selectedCampaignType];
    const headers = [...config.requiredFields, ...config.optionalFields];
    
    const sampleData = {
      b2c: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1 (555) 123-4567',
        email: 'john.doe@example.com',
        age: '35',
        interests: 'Technology,Sports',
        consent: 'yes'
      },
      b2b: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        company: 'TechCorp Solutions',
        title: 'VP of Sales',
        phone: '+1 (555) 987-6543',
        email: 'sarah.johnson@techcorp.com',
        industry: 'Technology',
        companySize: '500-1000',
        budget: '$50k-$100k'
      }
    };

    const sample = sampleData[selectedCampaignType];
    const csvContent = [headers.join(','), headers.map(h => sample[h as keyof typeof sample] || '').join(',')].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCampaignType}_leads_template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const selectAllLeads = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Lead Management</h1>
              <p className="text-gray-400 mt-1">Manage and import leads for your campaigns</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-800 bg-gray-900/30">
          {/* Campaign Type Selector */}
          <div className="p-6 border-b border-gray-800">
            <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-3 h-3" />
              Campaign Type
            </div>
            
            <RadioGroup value={selectedCampaignType} onValueChange={(value: 'b2c' | 'b2b') => setSelectedCampaignType(value)}>
              {Object.entries(CAMPAIGN_CONFIGS).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value={type} id={type} className="text-purple-600" />
                    <Label htmlFor={type} className="flex items-center gap-2 cursor-pointer">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className="text-sm font-medium">{config.name}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>

            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="text-xs text-gray-400 mb-2">Required Fields:</div>
              <div className="flex flex-wrap gap-1">
                {CAMPAIGN_CONFIGS[selectedCampaignType].requiredFields.map(field => (
                  <Badge key={field} variant="secondary" className="text-xs bg-red-900/30 text-red-300">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Import Section */}
          <div className="p-6 border-b border-gray-800">
            <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-3 h-3" />
              Import Leads
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={uploadStatus === 'uploading'}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadStatus === 'uploading' ? 'Uploading...' : `Upload ${selectedCampaignType.toUpperCase()} CSV`}
              </Button>
              
              <Button 
                onClick={downloadTemplate}
                variant="outline" 
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {uploadStatus !== 'idle' && (
              <Alert className={`mt-3 ${uploadStatus === 'error' ? 'border-red-500 bg-red-900/20' : 'border-green-500 bg-green-900/20'}`}>
                <AlertCircle className={`h-4 w-4 ${uploadStatus === 'error' ? 'text-red-400' : 'text-green-400'}`} />
                <AlertDescription className={uploadStatus === 'error' ? 'text-red-300' : 'text-green-300'}>
                  {uploadMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Filters */}
          <div className="p-6">
            <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-3 h-3" />
              Filters
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-gray-400 mb-2 block">Campaign Type</Label>
                <Select value={campaignTypeFilter} onValueChange={(value: 'all' | 'b2c' | 'b2b') => setCampaignTypeFilter(value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="b2c">B2C Only</SelectItem>
                    <SelectItem value="b2b">B2B Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-400 mb-2 block">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="unqualified">Unqualified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-400 mb-2 block">Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Stats Cards */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Leads</p>
                    <p className="text-2xl font-bold text-white">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">B2B Leads</p>
                    <p className="text-2xl font-bold text-blue-400">{stats.b2b}</p>
                  </div>
                  <Briefcase className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">B2C Leads</p>
                    <p className="text-2xl font-bold text-green-400">{stats.b2c}</p>
                  </div>
                  <User className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Converted</p>
                    <p className="text-2xl font-bold text-green-400">{stats.converted}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="px-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-gray-800/50">
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                          onChange={selectAllLeads}
                          className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                        />
                      </TableHead>
                      <TableHead className="text-gray-400">Lead</TableHead>
                      <TableHead className="text-gray-400">Company</TableHead>
                      <TableHead className="text-gray-400">Type</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Priority</TableHead>
                      <TableHead className="text-gray-400">Campaign</TableHead>
                      <TableHead className="text-gray-400">Last Contacted</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => {
                      const Icon = lead.campaignType === 'b2b' ? Briefcase : User;
                      const config = CAMPAIGN_CONFIGS[lead.campaignType || 'b2b'];
                      
                      return (
                        <TableRow key={lead.id} className="border-gray-800 hover:bg-gray-800/50">
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => toggleLeadSelection(lead.id)}
                              className="rounded border-gray-600 bg-gray-800 text-purple-600 focus:ring-purple-500"
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-white">
                                {lead.firstName} {lead.lastName}
                              </div>
                              <div className="text-sm text-gray-400">{lead.email}</div>
                              <div className="text-sm text-gray-400">{lead.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.company ? (
                              <div>
                                <div className="font-medium text-white">{lead.company}</div>
                                <div className="text-sm text-gray-400">{lead.title}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${config.color} text-white`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {lead.campaignType?.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[lead.status]}>
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={priorityColors[lead.priority]}>
                              {lead.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-300">{lead.campaign}</div>
                            <div className="text-xs text-gray-500">{lead.source}</div>
                          </TableCell>
                          <TableCell>
                            {lead.lastContacted ? (
                              <div className="text-sm text-gray-300">{lead.lastContacted}</div>
                            ) : (
                              <span className="text-gray-500">Never</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Lead
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-700" />
                                <DropdownMenuItem className="text-red-400 hover:bg-gray-700">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 