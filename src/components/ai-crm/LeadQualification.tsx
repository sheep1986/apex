import React, { useState, useEffect } from 'react';
import { 
  Star, 
  TrendingUp, 
  Phone, 
  Mail, 
  Building, 
  Calendar, 
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Eye,
  Filter,
  Search,
  Download,
  ArrowUpDown,
  Play,
  Pause,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';

interface LeadQualificationProps {
  campaignId: string;
  onLeadAction: (leadId: string, action: string) => void;
}

interface QualifiedLead {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  email?: string;
  phoneNumber: string;
  qualificationScore: number;
  interestLevel: number;
  aiSummary: string;
  painPoints: string[];
  buyingSignals: string[];
  objections: string[];
  nextSteps: string;
  recommendedAction: string;
  callDuration: number;
  callCost: number;
  recordingUrl?: string;
  transcript?: string;
  qualifiedAt: Date;
  lastContactAt: Date;
  status: 'new' | 'contacted' | 'nurturing' | 'ready' | 'closed';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
}

interface QualificationFilters {
  search: string;
  status: string;
  priority: string;
  minScore: number;
  maxScore: number;
  sortBy: 'score' | 'date' | 'interest' | 'name';
  sortOrder: 'asc' | 'desc';
}

export const LeadQualification: React.FC<LeadQualificationProps> = ({ 
  campaignId, 
  onLeadAction 
}) => {
  const [leads, setLeads] = useState<QualifiedLead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<QualifiedLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<QualifiedLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<QualificationFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    minScore: 0,
    maxScore: 100,
    sortBy: 'score',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [notes, setNotes] = useState('');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    fetchQualifiedLeads();
  }, [campaignId]);

  useEffect(() => {
    applyFilters();
  }, [leads, filters]);

  const fetchQualifiedLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}/qualified-leads`);
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching qualified leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.firstName.toLowerCase().includes(searchTerm) ||
        lead.lastName.toLowerCase().includes(searchTerm) ||
        lead.company?.toLowerCase().includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm) ||
        lead.phoneNumber.includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(lead => lead.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(lead => lead.priority === filters.priority);
    }

    // Score filter
    filtered = filtered.filter(lead => 
      lead.qualificationScore >= filters.minScore && 
      lead.qualificationScore <= filters.maxScore
    );

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'score':
          aValue = a.qualificationScore;
          bValue = b.qualificationScore;
          break;
        case 'date':
          aValue = a.qualifiedAt.getTime();
          bValue = b.qualifiedAt.getTime();
          break;
        case 'interest':
          aValue = a.interestLevel;
          bValue = b.interestLevel;
          break;
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
          break;
        default:
          aValue = a.qualificationScore;
          bValue = b.qualificationScore;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredLeads(filtered);
  };

  const handleLeadAction = async (leadId: string, action: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, notes }),
      });

      if (response.ok) {
        onLeadAction(leadId, action);
        fetchQualifiedLeads(); // Refresh the list
        setNotes('');
      }
    } catch (error) {
      console.error('Error performing lead action:', error);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'nurturing': return 'bg-purple-500';
      case 'ready': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const toggleAudio = (recordingUrl: string) => {
    if (playingAudio === recordingUrl) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(recordingUrl);
    }
  };

  const exportLeads = () => {
    const csv = [
      ['Name', 'Company', 'Email', 'Phone', 'Score', 'Interest', 'Status', 'Priority', 'Qualified At'].join(','),
      ...filteredLeads.map(lead => [
        `${lead.firstName} ${lead.lastName}`,
        lead.company || '',
        lead.email || '',
        lead.phoneNumber,
        lead.qualificationScore,
        lead.interestLevel,
        lead.status,
        lead.priority,
        lead.qualifiedAt.toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qualified-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Qualified Leads</h2>
          <p className="text-gray-600">
            {filteredLeads.length} of {leads.length} leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={exportLeads}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Search leads..."
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
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="nurturing">Nurturing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Score</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="interest">Interest</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {lead.firstName} {lead.lastName}
                    </h3>
                    {lead.company && (
                      <p className="text-sm text-gray-600">{lead.company}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge className={`${getPriorityColor(lead.priority)} text-white`}>
                    {lead.priority.toUpperCase()}
                  </Badge>
                  <Badge className={`${getStatusColor(lead.status)} text-white`}>
                    {lead.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{lead.phoneNumber}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>{lead.email}</span>
                  </div>
                )}
              </div>

              {/* Qualification Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Qualification Score</span>
                  <span className={`text-sm font-bold ${getScoreColor(lead.qualificationScore)}`}>
                    {lead.qualificationScore}%
                  </span>
                </div>
                <Progress value={lead.qualificationScore} className="h-2" />
              </div>

              {/* Interest Level */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Interest Level</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < lead.interestLevel ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="space-y-2">
                <span className="text-sm font-medium">AI Summary</span>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {lead.aiSummary}
                </p>
              </div>

              {/* Call Info */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Duration: {formatDuration(lead.callDuration)}</span>
                <span>Cost: {formatCurrency(lead.callCost)}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedLead?.firstName} {selectedLead?.lastName}
                      </DialogTitle>
                    </DialogHeader>
                    
                    {selectedLead && (
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="analysis">Analysis</TabsTrigger>
                          <TabsTrigger value="transcript">Transcript</TabsTrigger>
                          <TabsTrigger value="actions">Actions</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Contact Information</h4>
                              <div className="space-y-2 text-sm">
                                <p><strong>Phone:</strong> {selectedLead.phoneNumber}</p>
                                <p><strong>Email:</strong> {selectedLead.email || 'N/A'}</p>
                                <p><strong>Company:</strong> {selectedLead.company || 'N/A'}</p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Qualification Details</h4>
                              <div className="space-y-2 text-sm">
                                <p><strong>Score:</strong> {selectedLead.qualificationScore}%</p>
                                <p><strong>Interest:</strong> {selectedLead.interestLevel}/5</p>
                                <p><strong>Status:</strong> {selectedLead.status}</p>
                                <p><strong>Priority:</strong> {selectedLead.priority}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">AI Summary</h4>
                            <p className="text-sm text-gray-600">{selectedLead.aiSummary}</p>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="analysis" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-medium mb-2 text-green-600">Pain Points</h4>
                              <ul className="text-sm space-y-1">
                                {selectedLead.painPoints.map((point, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2 text-blue-600">Buying Signals</h4>
                              <ul className="text-sm space-y-1">
                                {selectedLead.buyingSignals.map((signal, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <TrendingUp className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    {signal}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2 text-red-600">Objections</h4>
                              <ul className="text-sm space-y-1">
                                {selectedLead.objections.map((objection, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                                    {objection}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Next Steps</h4>
                              <p className="text-sm text-gray-600">{selectedLead.nextSteps}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Recommended Action</h4>
                              <p className="text-sm text-gray-600">{selectedLead.recommendedAction}</p>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="transcript" className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Call Transcript</h4>
                            {selectedLead.recordingUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAudio(selectedLead.recordingUrl!)}
                              >
                                {playingAudio === selectedLead.recordingUrl ? (
                                  <Pause className="w-4 h-4 mr-1" />
                                ) : (
                                  <Play className="w-4 h-4 mr-1" />
                                )}
                                {playingAudio === selectedLead.recordingUrl ? 'Pause' : 'Play'}
                              </Button>
                            )}
                          </div>
                          
                          <ScrollArea className="h-64 border rounded-lg p-4">
                            {selectedLead.transcript ? (
                              <div className="text-sm whitespace-pre-wrap">
                                {selectedLead.transcript}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No transcript available</p>
                              </div>
                            )}
                          </ScrollArea>
                        </TabsContent>
                        
                        <TabsContent value="actions" className="space-y-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Add Notes</h4>
                              <Textarea
                                placeholder="Add notes about this lead..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                              />
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                onClick={() => handleLeadAction(selectedLead.id, 'schedule_call')}
                                className="flex items-center gap-2"
                              >
                                <Calendar className="w-4 h-4" />
                                Schedule Call
                              </Button>
                              <Button 
                                onClick={() => handleLeadAction(selectedLead.id, 'send_email')}
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                Send Email
                              </Button>
                              <Button 
                                onClick={() => handleLeadAction(selectedLead.id, 'mark_hot')}
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <Star className="w-4 h-4" />
                                Mark as Hot
                              </Button>
                              <Button 
                                onClick={() => handleLeadAction(selectedLead.id, 'add_to_nurture')}
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <TrendingUp className="w-4 h-4" />
                                Add to Nurture
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </DialogContent>
                </Dialog>
                
                <Button 
                  size="sm"
                  onClick={() => handleLeadAction(lead.id, 'contact')}
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No qualified leads found
          </h3>
          <p className="text-gray-500">
            Try adjusting your filters or import more leads to get started.
          </p>
        </div>
      )}
    </div>
  );
};