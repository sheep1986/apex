// Mock data service for dev mode
export const mockDataService = {
  // Dashboard metrics
  getDashboardMetrics: async () => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    return {
      totalCalls: 12543,
      activeCampaigns: 24,
      conversionRate: 32.8,
      totalRevenue: 45231,
      callVolume: [
        { day: 'Mon', calls: 450 },
        { day: 'Tue', calls: 380 },
        { day: 'Wed', calls: 520 },
        { day: 'Thu', calls: 490 },
        { day: 'Fri', calls: 380 },
        { day: 'Sat', calls: 220 },
        { day: 'Sun', calls: 180 },
      ],
      campaignPerformance: [
        { name: 'Summer Sale', success: 75 },
        { name: 'Product Launch', success: 68 },
        { name: 'Holiday Promo', success: 82 },
        { name: 'Lead Nurture', success: 71 },
      ]
    };
  },

  // All Calls data
  getAllCalls: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      calls: [
        {
          id: '1',
          type: 'outbound',
          contact: { name: 'John Smith', phone: '+1 555-0123', company: 'Tech Corp' },
          agent: { name: 'AI Assistant Sarah', type: 'ai' },
          campaign: { name: 'Summer Sale', id: 'camp_1' },
          startTime: '2025-07-20T14:30:00Z',
          duration: 180,
          outcome: 'interested',
          sentiment: 'positive',
          cost: 2.45,
          recording: 'rec_001.mp3',
          transcript: 'Call transcript here...',
          status: 'completed'
        },
        {
          id: '2',
          type: 'inbound',
          contact: { name: 'Sarah Johnson', phone: '+1 555-0124', company: 'Design Studio' },
          agent: { name: 'AI Assistant Alex', type: 'ai' },
          startTime: '2025-07-20T13:15:00Z',
          duration: 240,
          outcome: 'connected',
          sentiment: 'neutral',
          cost: 3.20,
          status: 'completed'
        },
        {
          id: '3',
          type: 'outbound',
          contact: { name: 'Mike Wilson', phone: '+1 555-0125' },
          agent: { name: 'Human Agent Lisa', type: 'human' },
          campaign: { name: 'Product Launch', id: 'camp_2' },
          startTime: '2025-07-20T12:45:00Z',
          duration: 95,
          outcome: 'voicemail',
          sentiment: 'neutral',
          cost: 1.85,
          status: 'completed'
        }
      ],
      metrics: {
        totalCalls: 342,
        connectedCalls: 218,
        totalDuration: 15420,
        totalCost: 156.80,
        averageDuration: 185,
        connectionRate: 63.7,
        positiveRate: 42.1
      }
    };
  },

  // Analytics data
  getAnalytics: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      overview: {
        totalCalls: 12543,
        successfulCalls: 8234,
        totalRevenue: 45231,
        conversionRate: 32.8
      },
      charts: {
        callVolume: [
          { date: '2025-07-14', calls: 145, successful: 92 },
          { date: '2025-07-15', calls: 167, successful: 108 },
          { date: '2025-07-16', calls: 189, successful: 123 },
          { date: '2025-07-17', calls: 201, successful: 134 },
          { date: '2025-07-18', calls: 176, successful: 117 },
          { date: '2025-07-19', calls: 198, successful: 129 },
          { date: '2025-07-20', calls: 223, successful: 145 }
        ],
        conversionFunnel: [
          { stage: 'Calls Made', value: 1000 },
          { stage: 'Connected', value: 650 },
          { stage: 'Interested', value: 420 },
          { stage: 'Qualified', value: 280 },
          { stage: 'Converted', value: 95 }
        ]
      }
    };
  },

  // CRM data
  getCRMData: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      contacts: [
        {
          id: '1',
          name: 'John Smith',
          email: 'john@techcorp.com',
          phone: '+1 555-0123',
          company: 'Tech Corp',
          status: 'qualified',
          lastContact: '2025-07-20T14:30:00Z',
          value: 15000,
          tags: ['enterprise', 'hot-lead']
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah@designstudio.com',
          phone: '+1 555-0124',
          company: 'Design Studio',
          status: 'contacted',
          lastContact: '2025-07-19T13:15:00Z',
          value: 8500,
          tags: ['smb', 'interested']
        }
      ],
      stats: {
        totalContacts: 1247,
        qualifiedLeads: 318,
        totalValue: 2450000,
        conversionRate: 25.5
      }
    };
  },

  // Team Management data
  getTeamData: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      members: [
        {
          id: '1',
          email: 'john.doe@artificialmedia.co.uk',
          firstName: 'John',
          lastName: 'Doe',
          role: 'Agency Admin',
          permissions: {
            canAccessAllOrganizations: true,
            canManageClients: true,
            canViewClientData: true,
            canManageTeam: true,
          },
          isActive: true,
          verificationRequired: false,
          lastLogin: '2025-07-20T10:30:00Z',
          createdAt: '2025-07-01T09:00:00Z',
        },
        {
          id: '2',
          email: 'sarah.smith@artificialmedia.co.uk',
          firstName: 'Sarah',
          lastName: 'Smith',
          role: 'Support Agent',
          permissions: {
            canAccessAllOrganizations: false,
            canManageClients: false,
            canViewClientData: true,
            canManageTeam: false,
          },
          isActive: true,
          verificationRequired: true,
          lastLogin: '2025-07-19T14:15:00Z',
          createdAt: '2025-07-10T11:30:00Z',
        }
      ]
    };
  }
};