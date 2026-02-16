// Platform Owner Backend Service
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

export interface BillingTransaction {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  type: 'payment' | 'refund' | 'dispute' | 'chargeback';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  stripeTransactionId: string;
  date: string;
  description: string;
}

export interface ClientHealthCheck {
  clientId: string;
  clientName: string;
  status: 'healthy' | 'warning' | 'critical';
  lastChecked: string;
  issues: {
    type: 'api-error' | 'billing-issue' | 'usage-spike' | 'integration-failure';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  metrics: {
    callsToday: number;
    errorRate: number;
    responseTime: number;
    uptime: number;
  };
}

class PlatformOwnerService {
  private static instance: PlatformOwnerService;

  static getInstance(): PlatformOwnerService {
    if (!PlatformOwnerService.instance) {
      PlatformOwnerService.instance = new PlatformOwnerService();
    }
    return PlatformOwnerService.instance;
  }

  // Mock data for demonstration
  getSupportTickets(): SupportTicket[] {
    return [
      {
        id: 'TKT-001',
        clientName: 'Artificial Media',
        clientId: 'art-media-001',
        title: 'Voice Integration Not Working',
        description: 'Cannot connect to Voice API, getting 401 errors consistently',
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
              "Hi, we're having trouble with our Voice integration. Getting consistent 401 errors.",
            timestamp: '2024-01-20T10:30:00Z',
          },
          {
            id: 'msg-2',
            author: 'Trinity AI Bot',
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
  }

  getTeamMembers(): TeamMember[] {
    return [
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

  getBillingTransactions(): BillingTransaction[] {
    return [
      {
        id: 'txn-1',
        clientId: 'art-media-001',
        clientName: 'Artificial Media',
        amount: 299.0,
        currency: 'USD',
        type: 'payment',
        status: 'completed',
        stripeTransactionId: 'pi_1234567890',
        date: '2024-01-20T00:00:00Z',
        description: 'Monthly Subscription - Professional Plan',
      },
      {
        id: 'txn-2',
        clientId: 'tech-corp-002',
        clientName: 'TechCorp Solutions',
        amount: 299.0,
        currency: 'USD',
        type: 'payment',
        status: 'completed',
        stripeTransactionId: 'pi_0987654321',
        date: '2024-01-19T00:00:00Z',
        description: 'Monthly Subscription - Professional Plan',
      },
      {
        id: 'txn-3',
        clientId: 'tech-corp-002',
        clientName: 'TechCorp Solutions',
        amount: -149.5,
        currency: 'USD',
        type: 'refund',
        status: 'completed',
        stripeTransactionId: 'pi_0987654321',
        date: '2024-01-18T00:00:00Z',
        description: 'Partial refund for overage charges',
      },
    ];
  }

  getClientHealthChecks(): ClientHealthCheck[] {
    return [
      {
        clientId: 'art-media-001',
        clientName: 'Artificial Media',
        status: 'warning',
        lastChecked: '2024-01-20T14:30:00Z',
        issues: [
          {
            type: 'api-error',
            message: 'Voice Provider API key expired or invalid',
            severity: 'high',
          },
        ],
        metrics: {
          callsToday: 247,
          errorRate: 15.2,
          responseTime: 1250,
          uptime: 98.5,
        },
      },
      {
        clientId: 'tech-corp-002',
        clientName: 'TechCorp Solutions',
        status: 'healthy',
        lastChecked: '2024-01-20T14:25:00Z',
        issues: [],
        metrics: {
          callsToday: 189,
          errorRate: 2.1,
          responseTime: 850,
          uptime: 99.9,
        },
      },
    ];
  }

  // AI Support Bot Integration
  async generateAIResponse(userMessage: string): Promise<string> {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('vapi') || lowerMessage.includes('voice') || lowerMessage.includes('api')) {
      return "I see you're having an issue with Voice integration. Let me check your API key status and run some diagnostics. This looks like it might need technical assistance.";
    }

    if (
      lowerMessage.includes('billing') ||
      lowerMessage.includes('charge') ||
      lowerMessage.includes('payment')
    ) {
      return 'I understand you have a billing question. Let me review your account and escalate this to our billing team for immediate assistance.';
    }

    return "Thank you for contacting support! I'm analyzing your request and will connect you with the best team member to help resolve this quickly.";
  }

  // Client Verification for DPA Compliance
  async verifyClientAccess(clientId: string, verificationCode: string): Promise<boolean> {
    // Mock verification - in production this would verify with the client
    return verificationCode === '123456';
  }

  // Stripe Integration Methods (Mock)
  async processRefund(transactionId: string, amount?: number): Promise<boolean> {
    return true;
  }

  async getStripeCustomer(clientId: string): Promise<any> {
    return {
      id: `cus_${clientId}`,
      email: 'client@example.com',
      subscriptions: ['sub_123456'],
      payment_methods: ['pm_123456'],
    };
  }

  // Team Management
  async inviteTeamMember(email: string, role: string, permissions: string[]): Promise<TeamMember> {
    const newMember: TeamMember = {
      id: `team-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: role as any,
      permissions,
      status: 'active',
      lastActive: new Date().toISOString(),
    };

    // Send invitation email (mock)
    return newMember;
  }

  // System Monitoring
  async runSystemHealthCheck(): Promise<{ status: string; details: any }> {
    return {
      status: 'healthy',
      details: {
        database: 'connected',
        vapi: 'connected',
        stripe: 'connected',
        monitoring: 'active',
      },
    };
  }

  // Integration Management
  getAvailableIntegrations() {
    return [
      {
        name: 'Slack',
        description: 'Team communication and notifications',
        icon: 'MessageSquare',
        status: 'available',
        setupUrl: '/integrations/slack',
      },
      {
        name: 'Stripe',
        description: 'Payment processing and invoicing',
        icon: 'CreditCard',
        status: 'connected',
        setupUrl: '/integrations/stripe',
      },
      {
        name: 'Intercom',
        description: 'Customer support chat system',
        icon: 'Headphones',
        status: 'available',
        setupUrl: '/integrations/intercom',
      },
      {
        name: 'Discord',
        description: 'Community and team chat',
        icon: 'Users',
        status: 'available',
        setupUrl: '/integrations/discord',
      },
    ];
  }
}

export const platformOwnerService = PlatformOwnerService.getInstance();
