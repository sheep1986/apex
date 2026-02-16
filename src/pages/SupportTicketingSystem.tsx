import {
    AlertTriangle,
    Bot,
    Building2,
    CreditCard,
    Hash,
    Loader2,
    Mail,
    MessageSquare,
    MoreVertical,
    Paperclip,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Send,
    Star,
    User,
    Users,
    Zap
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase-client';

interface Department {
  id: string;
  name: string;
  color: string;
  icon: any;
}

interface SupportTicket {
  id: string;
  organizationName: string;
  organizationId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
  category: 'technical' | 'billing' | 'account' | 'feature-request' | 'bug-report';
  department: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  clientEmail: string;
  clientPhone?: string;
  starred?: boolean;
}

interface TicketMessage {
  id: string;
  author: string;
  authorType: 'client' | 'support' | 'ai-bot' | 'system';
  message: string;
  timestamp: string;
  attachments?: string[];
  isInternal?: boolean;
}

export default function SupportTicketingSystem() {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const departments: Department[] = [
    { id: 'technical', name: 'Technical Support', color: 'text-blue-400', icon: Zap },
    { id: 'billing', name: 'Billing & Payments', color: 'text-green-400', icon: CreditCard },
    { id: 'onboarding', name: 'Onboarding', color: 'text-emerald-400', icon: Users },
    { id: 'feature', name: 'Feature Requests', color: 'text-yellow-400', icon: Star },
    { id: 'emergency', name: 'Emergency', color: 'text-red-400', icon: AlertTriangle },
  ];

  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const { data: ticketRows, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Fetch messages for all tickets
      const ticketIds = (ticketRows || []).map((t: any) => t.id);
      let messagesMap: Record<string, TicketMessage[]> = {};

      if (ticketIds.length > 0) {
        const { data: msgs } = await supabase
          .from('support_ticket_messages')
          .select('*')
          .in('ticket_id', ticketIds)
          .order('created_at', { ascending: true });

        (msgs || []).forEach((m: any) => {
          if (!messagesMap[m.ticket_id]) messagesMap[m.ticket_id] = [];
          messagesMap[m.ticket_id].push({
            id: m.id,
            author: m.author,
            authorType: m.author_type?.replace('_', '-') as any,
            message: m.message,
            timestamp: m.created_at,
            isInternal: m.is_internal,
          });
        });
      }

      const mapped: SupportTicket[] = (ticketRows || []).map((t: any) => ({
        id: t.ticket_number || t.id,
        organizationName: t.organization_name || 'Unknown',
        organizationId: t.organization_id || '',
        clientEmail: t.client_email || '',
        clientPhone: t.client_phone,
        title: t.title,
        description: t.description || '',
        priority: t.priority || 'medium',
        status: t.status?.replace('_', '-') || 'open',
        category: t.category?.replace('_', '-') || 'technical',
        department: t.department || 'technical',
        assignedTo: t.assigned_to,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        starred: t.starred || false,
        messages: messagesMap[t.id] || [],
        _dbId: t.id, // Keep real DB id for mutations
      }));

      setTickets(mapped);
    } catch (err: any) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in-progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    avgResponseTime: 1.2,
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setSending(true);

    const dbId = (selectedTicket as any)._dbId || selectedTicket.id;

    try {
      const { error } = await supabase.from('support_ticket_messages').insert({
        ticket_id: dbId,
        author: 'Support Agent',
        author_type: 'support',
        message: newMessage.trim(),
      });

      if (error) throw error;

      // Update ticket updated_at
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString(), status: 'in_progress' })
        .eq('id', dbId);

      // Optimistic update
      const message: TicketMessage = {
        id: `msg-${Date.now()}`,
        author: 'Support Agent',
        authorType: 'support',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      };

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === selectedTicket.id
            ? { ...ticket, messages: [...ticket.messages, message], updatedAt: new Date().toISOString(), status: 'in-progress' }
            : ticket
        )
      );

      setSelectedTicket((prev) =>
        prev ? { ...prev, messages: [...prev.messages, message], status: 'in-progress' } : prev
      );

      setNewMessage('');
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const toggleStar = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const dbId = (ticket as any)._dbId || ticket.id;
    const newStarred = !ticket.starred;

    // Optimistic
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, starred: newStarred } : t));

    await supabase.from('support_tickets').update({ starred: newStarred }).eq('id', dbId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in-progress':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'waiting':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || ticket.department === filterDepartment;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-white">Support Command Center</h1>
            <p className="text-gray-400">Manage tickets across all departments</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="border-emerald-600/30 bg-gradient-to-r from-emerald-600/20 to-blue-600/20 px-4 py-2 text-emerald-400">
              {stats.open} Open Tickets
            </Badge>
            <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Department Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {departments.map((dept) => {
            const Icon = dept.icon;
            const deptTickets = tickets.filter((t) => t.department === dept.id);
            return (
              <Card
                key={dept.id}
                className="cursor-pointer border-gray-700 bg-gray-800/50 backdrop-blur-sm transition-colors hover:bg-gray-800/70"
              >
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Icon className={`h-5 w-5 ${dept.color}`} />
                    <span className="text-2xl font-bold text-white">{deptTickets.length}</span>
                  </div>
                  <p className="text-sm text-gray-400">{dept.name}</p>
                  {deptTickets.filter((t) => t.status === 'open').length > 0 && (
                    <p className="mt-1 text-xs text-orange-400">
                      {deptTickets.filter((t) => t.status === 'open').length} open
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content - Email Style Layout */}
        <div className="grid h-[800px] grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Ticket List - Email Inbox Style */}
          <Card className="h-full overflow-hidden border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-700">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Inbox</CardTitle>
                  <Button variant="ghost" size="sm" className="text-gray-400">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-gray-600 bg-gray-700 pl-10 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="border-gray-600 bg-gray-700 text-sm text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger className="border-gray-600 bg-gray-700 text-sm text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gray-700 bg-gray-800">
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-gray-700">
                {filteredTickets.map((ticket) => {
                  const dept = departments.find((d) => d.id === ticket.department);
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`cursor-pointer p-4 transition-colors hover:bg-gray-700/50 ${
                        selectedTicket?.id === ticket.id
                          ? 'border-l-4 border-emerald-500 bg-gray-700/50'
                          : ''
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="truncate font-medium text-white">
                              {ticket.organizationName}
                            </span>
                            <Badge className="border-gray-500 bg-gray-600/50 text-xs text-gray-300">
                              <Hash className="mr-1 h-3 w-3" />
                              {ticket.id}
                            </Badge>
                          </div>
                          <p className="truncate text-sm font-medium text-white">{ticket.title}</p>
                          <p className="mt-1 truncate text-xs text-gray-400">
                            {ticket.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(ticket.id);
                          }}
                          className="text-gray-400 hover:text-yellow-400"
                        >
                          <Star
                            className={`h-4 w-4 ${ticket.starred ? 'fill-yellow-400 text-yellow-400' : ''}`}
                          />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                          {dept && (
                            <Badge className="border-gray-500 bg-gray-600/50 text-gray-300">
                              <dept.icon className={`mr-1 h-3 w-3 ${dept.color}`} />
                              {dept.name}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(ticket.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>

          {/* Ticket Details & Conversation */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <Card className="flex h-full flex-col border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                <CardHeader className="border-b border-gray-700">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white">{selectedTicket.title}</h3>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {selectedTicket.organizationName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {selectedTicket.clientEmail}
                          </span>
                          {selectedTicket.clientPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {selectedTicket.clientPhone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedTicket.status}
                          onValueChange={(value) => {
                            setTickets((prev) =>
                              prev.map((t) =>
                                t.id === selectedTicket.id ? { ...t, status: value as any } : t
                              )
                            );
                          }}
                        >
                          <SelectTrigger className="w-32 border-gray-600 bg-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-gray-700 bg-gray-800">
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="waiting">Waiting</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(selectedTicket.priority)}>
                        {selectedTicket.priority} priority
                      </Badge>
                      <Badge className="border-gray-500 bg-gray-600/50 text-gray-300">
                        {selectedTicket.category}
                      </Badge>
                      {selectedTicket.assignedTo && (
                        <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                          Assigned to {selectedTicket.assignedTo}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    {selectedTicket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.authorType === 'support' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.authorType === 'support'
                              ? 'border border-emerald-600/30 bg-gradient-to-r from-emerald-600/20 to-blue-600/20'
                              : message.authorType === 'ai-bot'
                                ? 'border border-blue-600/30 bg-blue-600/20'
                                : message.authorType === 'system'
                                  ? 'border border-gray-600 bg-gray-700/50'
                                  : 'border border-gray-600 bg-gray-700/50'
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            {message.authorType === 'ai-bot' && (
                              <Bot className="h-4 w-4 text-blue-400" />
                            )}
                            {message.authorType === 'client' && (
                              <User className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-white">{message.author}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm text-gray-200">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="border-t border-gray-700 p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your response..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="resize-none border-gray-600 bg-gray-700 text-white"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" className="border-gray-600">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="flex h-full items-center justify-center border-gray-700 bg-gray-800/50 backdrop-blur-sm">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                  <h3 className="mb-2 text-xl font-semibold text-white">Select a Ticket</h3>
                  <p className="text-gray-400">
                    Choose a support ticket from the inbox to view details
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
