export interface SupportTicket {
  id: string;
  clientName: string;
  clientId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
  category: 'technical' | 'billing' | 'account' | 'feature-request' | 'bug-report';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  author: string;
  authorType: 'client' | 'support' | 'ai-bot';
  message: string;
  timestamp: string;
  attachments?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'support' | 'billing' | 'technical';
  permissions: string[];
  status: 'active' | 'inactive';
  lastActive: string;
}

export interface AIBotResponse {
  message: string;
  confidence: number;
  suggestedActions: string[];
  escalateToHuman: boolean;
}

export class SupportService {
  private static instance: SupportService;
  private tickets: SupportTicket[] = [];
  private team: TeamMember[] = [];

  static getInstance(): SupportService {
    if (!SupportService.instance) {
      SupportService.instance = new SupportService();
    }
    return SupportService.instance;
  }

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    this.tickets = [
      {
        id: 'TKT-001',
        clientName: 'Artificial Media',
        clientId: 'art-media-001',
        title: 'Trinity Integration Not Working',
        description: 'Cannot connect to Trinity API, getting 401 errors consistently',
        priority: 'high',
        status: 'in-progress',
        category: 'technical',
        assignedTo: 'sarah@trinity-labs.ai',
        createdAt: '2024-01-20T10:30:00Z',
        updatedAt: '2024-01-20T14:15:00Z',
        messages: [
          {
            id: 'msg-1',
            author: 'Sean Wentz',
            authorType: 'client',
            message:
              "Hi, we're having trouble with our Trinity integration. Getting consistent 401 errors.",
            timestamp: '2024-01-20T10:30:00Z',
          },
          {
            id: 'msg-2',
            author: 'Trinity Support Bot',
            authorType: 'ai-bot',
            message: "I've detected this might be an API key issue. Let me run some diagnostics...",
            timestamp: '2024-01-20T10:31:00Z',
          },
          {
            id: 'msg-3',
            author: 'Sarah Johnson',
            authorType: 'support',
            message:
              "Hi Sean! I've escalated this to our technical team. We'll have this resolved within 2 hours.",
            timestamp: '2024-01-20T14:15:00Z',
          },
        ],
      },
      {
        id: 'TKT-002',
        clientName: 'TechCorp Solutions',
        clientId: 'tech-corp-002',
        title: 'Billing Inquiry - Duplicate Charge',
        description: 'We were charged twice for our monthly subscription',
        priority: 'medium',
        status: 'open',
        category: 'billing',
        createdAt: '2024-01-20T09:15:00Z',
        updatedAt: '2024-01-20T09:15:00Z',
        messages: [
          {
            id: 'msg-4',
            author: 'Mike Chen',
            authorType: 'client',
            message:
              'Hi, I notice we were charged $299 twice this month. Can you please look into this?',
            timestamp: '2024-01-20T09:15:00Z',
          },
        ],
      },
    ];

    this.team = [
      {
        id: 'team-1',
        name: 'Sarah Johnson',
        email: 'sarah@trinity-labs.ai',
        role: 'support',
        permissions: ['view-tickets', 'respond-tickets', 'view-clients'],
        status: 'active',
        lastActive: '2024-01-20T14:30:00Z',
      },
      {
        id: 'team-2',
        name: 'Mike Torres',
        email: 'mike@trinity-labs.ai',
        role: 'technical',
        permissions: [
          'view-tickets',
          'respond-tickets',
          'view-clients',
          'access-backend',
          'view-logs',
        ],
        status: 'active',
        lastActive: '2024-01-20T13:45:00Z',
      },
      {
        id: 'team-3',
        name: 'Lisa Rodriguez',
        email: 'lisa@trinity-labs.ai',
        role: 'billing',
        permissions: ['view-billing', 'process-refunds', 'view-clients'],
        status: 'active',
        lastActive: '2024-01-20T11:20:00Z',
      },
    ];
  }

  // Ticket Management
  async getTickets(filters?: {
    status?: string;
    priority?: string;
    clientId?: string;
  }): Promise<SupportTicket[]> {
    let filtered = [...this.tickets];

    if (filters?.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }
    if (filters?.priority) {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }
    if (filters?.clientId) {
      filtered = filtered.filter((t) => t.clientId === filters.clientId);
    }

    return filtered;
  }

  async createTicket(ticketData: Partial<SupportTicket>): Promise<SupportTicket> {
    const newTicket: SupportTicket = {
      id: `TKT-${(this.tickets.length + 1).toString().padStart(3, '0')}`,
      clientName: ticketData.clientName || '',
      clientId: ticketData.clientId || '',
      title: ticketData.title || 'New Support Request',
      description: ticketData.description || '',
      priority: ticketData.priority || 'medium',
      status: 'open',
      category: ticketData.category || 'technical',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    this.tickets.push(newTicket);

    // Auto-respond with AI bot
    await this.addAIResponse(newTicket.id, ticketData.description || '');

    return newTicket;
  }

  async addMessage(
    ticketId: string,
    message: Omit<TicketMessage, 'id' | 'timestamp'>
  ): Promise<void> {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    const newMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      ...message,
      timestamp: new Date().toISOString(),
    };

    ticket.messages.push(newMessage);
    ticket.updatedAt = new Date().toISOString();
  }

  private async addAIResponse(ticketId: string, userMessage: string): Promise<void> {
    const response = await this.generateAIResponse(userMessage);

    await this.addMessage(ticketId, {
      author: 'Trinity AI Bot',
      authorType: 'ai-bot',
      message: response.message,
    });

    if (response.escalateToHuman) {
      // Auto-assign to appropriate team member
      await this.assignTicket(ticketId, this.getAvailableAgent(userMessage));
    }
  }

  private async generateAIResponse(message: string): Promise<AIBotResponse> {
    // Mock AI response - in production, this would call OpenAI/Claude
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('voice') || lowerMessage.includes('api')) {
      return {
        message:
          "I see you're having an issue with Trinity integration. Let me check your API key status and run some diagnostics. This looks like it might need technical assistance.",
        confidence: 0.85,
        suggestedActions: ['Check API key', 'Verify webhooks', 'Test connection'],
        escalateToHuman: true,
      };
    }

    if (
      lowerMessage.includes('billing') ||
      lowerMessage.includes('charge') ||
      lowerMessage.includes('payment')
    ) {
      return {
        message:
          'I understand you have a billing question. Let me review your account and escalate this to our billing team for immediate assistance.',
        confidence: 0.9,
        suggestedActions: ['Review account', 'Check transactions', 'Process refund'],
        escalateToHuman: true,
      };
    }

    return {
      message:
        "Thank you for contacting support! I'm analyzing your request and will connect you with the best team member to help resolve this quickly.",
      confidence: 0.7,
      suggestedActions: ['Gather more details', 'Assign to support'],
      escalateToHuman: true,
    };
  }

  private getAvailableAgent(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('billing') || lowerMessage.includes('payment')) {
      return 'lisa@trinity-labs.ai';
    }
    if (
      lowerMessage.includes('technical') ||
      lowerMessage.includes('api') ||
      lowerMessage.includes('integration')
    ) {
      return 'mike@trinity-labs.ai';
    }

      return 'sarah@trinity-labs.ai'; // Default to general support
  }

  async assignTicket(ticketId: string, agentEmail: string): Promise<void> {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');

    ticket.assignedTo = agentEmail;
    ticket.status = 'in-progress';
    ticket.updatedAt = new Date().toISOString();
  }

  // Team Management
  async getTeamMembers(): Promise<TeamMember[]> {
    return [...this.team];
  }

  async addTeamMember(memberData: Omit<TeamMember, 'id' | 'lastActive'>): Promise<TeamMember> {
    const newMember: TeamMember = {
      id: `team-${this.team.length + 1}`,
      ...memberData,
      lastActive: new Date().toISOString(),
    };

    this.team.push(newMember);
    return newMember;
  }

  async updateTeamMember(memberId: string, updates: Partial<TeamMember>): Promise<void> {
    const memberIndex = this.team.findIndex((m) => m.id === memberId);
    if (memberIndex === -1) throw new Error('Team member not found');

    this.team[memberIndex] = { ...this.team[memberIndex], ...updates };
  }

  // Analytics
  async getTicketStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    avgResponseTime: number;
  }> {
    return {
      total: this.tickets.length,
      open: this.tickets.filter((t) => t.status === 'open').length,
      inProgress: this.tickets.filter((t) => t.status === 'in-progress').length,
      resolved: this.tickets.filter((t) => t.status === 'resolved').length,
      avgResponseTime: 1.2, // hours
    };
  }
}

export const supportService = SupportService.getInstance();
