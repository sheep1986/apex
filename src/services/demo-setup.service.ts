import { notificationService } from './notification.service';
import { vapiIntegrationService } from './vapi-integration.service';
import { useNotificationStore } from '@/lib/notification-store';

export class DemoSetupService {
  /**
   * Initialize demo data for the platform
   */
  static async initializeDemoData(): Promise<void> {
    console.log('🚀 Demo data initialization disabled');
    // Demo data disabled - using real data only
    return;
  }

  /**
   * Set up demo VAPI accounts
   */
  private static async setupDemoVapiAccounts(): Promise<void> {
    console.log('📞 Setting up demo VAPI accounts...');

    const demoAccounts = [
      {
        name: 'Primary Production Account',
        apiKey: 'vapi_demo_pk_1234567890abcdef',
        isActive: true,
        metadata: {
          environment: 'production' as const,
          organizationId: 'org_demo_123',
          userId: 'user_demo_456',
        },
      },
      {
        name: 'Backup Account',
        apiKey: 'vapi_demo_pk_backup_abcdef123456',
        isActive: true,
        metadata: {
          environment: 'production' as const,
          organizationId: 'org_demo_123',
          userId: 'user_demo_456',
        },
      },
      {
        name: 'Testing Account',
        apiKey: 'vapi_demo_pk_test_xyz789',
        isActive: false,
        metadata: {
          environment: 'staging' as const,
          organizationId: 'org_demo_123',
          userId: 'user_demo_456',
        },
      },
    ];

    // Add accounts to the integration service
    demoAccounts.forEach((account) => {
      vapiIntegrationService.addAccount(account);
    });

    // Simulate successful sync
    setTimeout(() => {
      notificationService.notifyVapiSyncSuccess({
        accountsCount: 2,
        creditsTotal: 12470,
        callsTotal: 1847,
      });
    }, 1000);
  }

  /**
   * Set up demo notifications
   */
  private static async setupDemoNotifications(): Promise<void> {
    console.log('🔔 Setting up demo notifications...');

    const notifications = [
      // Recent activity
      {
        delay: 500,
        notification: () =>
          notificationService.notifyCallCompleted({
            contactName: 'Sarah Johnson',
            duration: 145,
            outcome: 'interested',
            campaignName: 'Healthcare Outreach Q1',
            leadScore: 87,
          }),
      },
      {
        delay: 1500,
        notification: () =>
          notificationService.notifyLeadGenerated({
            name: 'Michael Chen',
            score: 92,
            campaignName: 'Tech Startup Leads',
            phoneNumber: '+1 (555) 123-4567',
            id: 'lead_demo_001',
          }),
      },
      {
        delay: 2500,
        notification: () =>
          notificationService.notifyCampaignStarted({
            name: 'Q1 Real Estate Campaign',
            leadsCount: 500,
            id: 'campaign_demo_001',
            estimatedDuration: '2 hours',
          }),
      },
      {
        delay: 3500,
        notification: () =>
          notificationService.notifyLowCredits({
            currentBalance: 1247,
            threshold: 1000,
            estimatedDays: 3,
          }),
      },
      {
        delay: 4500,
        notification: () =>
          notificationService.notifyUserCreated({
            name: 'Emma Rodriguez',
            email: 'emma.rodriguez@example.com',
            role: 'agent',
            organizationName: 'Artificial Media Ltd',
          }),
      },
      {
        delay: 5500,
        notification: () =>
          notificationService.notifyPerformanceAlert({
            metric: 'conversion_rate',
            value: 23.5,
            threshold: 20,
            trend: 'up',
            timeframe: 'last 24 hours',
          }),
      },
      {
        delay: 6500,
        notification: () =>
          notificationService.notifyCallFailed({
            contactName: 'David Wilson',
            phoneNumber: '+1 (555) 987-6543',
            error: 'Number not reachable',
            campaignName: 'Healthcare Outreach Q1',
            retryScheduled: true,
          }),
      },
      {
        delay: 7500,
        notification: () =>
          notificationService.notifyCreditsAdded({
            amount: 5000,
            newBalance: 6247,
            transactionId: 'txn_demo_123456',
          }),
      },
      {
        delay: 8500,
        notification: () =>
          notificationService.notifySystemAlert({
            message: 'High API usage detected - 85% of daily limit reached',
            severity: 'medium',
            component: 'VAPI Integration',
          }),
      },
      {
        delay: 9500,
        notification: () =>
          notificationService.notifyCampaignCompleted({
            name: 'Weekend Promotion Campaign',
            totalCalls: 250,
            successfulCalls: 67,
            conversionRate: 26.8,
            id: 'campaign_demo_002',
          }),
      },
      {
        delay: 10500,
        notification: () =>
          notificationService.notifyWebhookReceived({
            source: 'VAPI',
            event: 'call.completed',
            processed: true,
          }),
      },
      {
        delay: 11500,
        notification: () =>
          notificationService.notifyBatchOperation({
            operation: 'Lead Import',
            total: 1000,
            successful: 987,
            failed: 13,
            duration: 45,
          }),
      },
      {
        delay: 12500,
        notification: () =>
          notificationService.notifyInvoiceGenerated({
            amount: 247.5,
            period: 'March 2024',
            dueDate: 'April 15, 2024',
            invoiceId: 'inv_demo_202403',
          }),
      },
      {
        delay: 13500,
        notification: () =>
          notificationService.notifySecurityAlert({
            event: 'Multiple failed login attempts',
            location: 'New York, NY',
            userAgent: 'Chrome 122.0.0.0',
            ip: '192.168.1.100',
          }),
      },
      {
        delay: 14500,
        notification: () =>
          notificationService.notifyApiLimitWarning({
            service: 'VAPI',
            usage: 8500,
            limit: 10000,
            resetTime: '12:00 AM UTC',
          }),
      },
    ];

    // Schedule notifications
    notifications.forEach(({ delay, notification }) => {
      setTimeout(notification, delay);
    });
  }

  /**
   * Start demo activity simulation
   */
  private static startDemoActivity(): void {
    console.log('🎭 Starting demo activity simulation...');

    // Simulate periodic activity
    const activities = [
      {
        interval: 30000, // 30 seconds
        activity: () => {
          const contacts = [
            'Alice Thompson',
            'Bob Martinez',
            'Carol Davis',
            'Daniel Kim',
            'Eva Anderson',
            'Frank Wilson',
            'Grace Lee',
            'Henry Brown',
            'Iris Chen',
            'Jack Taylor',
            'Kate Johnson',
            'Leo Garcia',
          ];

          const outcomes = [
            { outcome: 'interested', score: 85 },
            { outcome: 'not_interested', score: 25 },
            { outcome: 'callback', score: 70 },
            { outcome: 'voicemail', score: 45 },
            { outcome: 'busy', score: 30 },
            { outcome: 'connected', score: 90 },
          ];

          const campaigns = [
            'Healthcare Outreach Q1',
            'Tech Startup Leads',
            'Real Estate Campaign',
            'Insurance Follow-up',
            'Solar Panel Leads',
          ];

          const contact = contacts[Math.floor(Math.random() * contacts.length)];
          const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
          const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
          const duration = Math.floor(Math.random() * 300) + 30; // 30-330 seconds

          notificationService.notifyCallCompleted({
            contactName: contact,
            duration,
            outcome: outcome.outcome,
            campaignName: campaign,
            leadScore: outcome.score,
          });
        },
      },
      {
        interval: 60000, // 1 minute
        activity: () => {
          const names = [
            'Alex Johnson',
            'Maria Santos',
            'James Wilson',
            'Lisa Wang',
            'Robert Brown',
            'Jennifer Davis',
            'Michael Miller',
            'Sarah Garcia',
          ];

          const campaigns = [
            'Q2 Lead Generation',
            'Customer Retention',
            'Product Launch',
            'Market Research',
            'Follow-up Campaign',
          ];

          const name = names[Math.floor(Math.random() * names.length)];
          const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
          const score = Math.floor(Math.random() * 40) + 60; // 60-100

          notificationService.notifyLeadGenerated({
            name,
            score,
            campaignName: campaign,
            phoneNumber: `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            id: `lead_demo_${Date.now()}`,
          });
        },
      },
      {
        interval: 120000, // 2 minutes
        activity: () => {
          const events = [
            {
              type: 'sync' as const,
              action: () =>
                notificationService.notifyVapiSyncSuccess({
                  accountsCount: 2,
                  creditsTotal: Math.floor(Math.random() * 5000) + 10000,
                  callsTotal: Math.floor(Math.random() * 500) + 1500,
                }),
            },
            {
              type: 'performance' as const,
              action: () => {
                const metrics = [
                  { metric: 'conversion_rate', threshold: 20, trend: 'up' as const },
                  { metric: 'call_duration', threshold: 120, trend: 'down' as const },
                  { metric: 'answer_rate', threshold: 60, trend: 'up' as const },
                  { metric: 'cost_per_call', threshold: 2.5, trend: 'down' as const },
                ];

                const metric = metrics[Math.floor(Math.random() * metrics.length)];
                const value = metric.threshold + (Math.random() * 10 - 5);

                notificationService.notifyPerformanceAlert({
                  metric: metric.metric,
                  value: parseFloat(value.toFixed(2)),
                  threshold: metric.threshold,
                  trend: metric.trend,
                  timeframe: 'last hour',
                });
              },
            },
            {
              type: 'system' as const,
              action: () => {
                const alerts = [
                  { message: 'System performance is optimal', severity: 'low' as const },
                  { message: 'API response time increased by 15%', severity: 'medium' as const },
                  { message: 'Database query optimization completed', severity: 'low' as const },
                  { message: 'Cache hit rate improved to 94%', severity: 'low' as const },
                ];

                const alert = alerts[Math.floor(Math.random() * alerts.length)];

                notificationService.notifySystemAlert({
                  message: alert.message,
                  severity: alert.severity,
                  component: 'System Monitor',
                });
              },
            },
          ];

          const event = events[Math.floor(Math.random() * events.length)];
          event.action();
        },
      },
    ];

    // Start activity intervals
    activities.forEach(({ interval, activity }) => {
      setInterval(activity, interval);
    });
  }

  /**
   * Clear all demo data
   */
  static clearDemoData(): void {
    console.log('🧹 Clearing demo data...');

    // Clear notifications
    const { clearAll } = useNotificationStore.getState();
    clearAll();

    // Clear VAPI accounts (in a real app, this would be more sophisticated)
    localStorage.removeItem('vapi-accounts');

    console.log('✅ Demo data cleared');
  }

  /**
   * Reset demo data
   */
  static async resetDemoData(): Promise<void> {
    console.log('🔄 Resetting demo data...');

    this.clearDemoData();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait a bit
    await this.initializeDemoData();

    console.log('✅ Demo data reset complete');
  }

  /**
   * Get demo statistics
   */
  static getDemoStats() {
    const { getStats } = useNotificationStore.getState();
    const stats = getStats();

    return {
      notifications: stats,
      vapiAccounts: vapiIntegrationService.getAccounts().length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if demo data is already initialized
   */
  static isDemoDataInitialized(): boolean {
    const { notifications } = useNotificationStore.getState();
    const vapiAccounts = vapiIntegrationService.getAccounts();

    return notifications.length > 0 || vapiAccounts.length > 0;
  }

  /**
   * Auto-initialize demo data if needed
   */
  static async autoInitialize(): Promise<void> {
    // Auto-initialization disabled - using real data only
    console.log('✅ Using real data only');
    return;
  }
}

// Export convenience functions
export const initializeDemoData = () => Promise.resolve(); // Disabled
export const clearDemoData = DemoSetupService.clearDemoData.bind(DemoSetupService);
export const resetDemoData = () => Promise.resolve(); // Disabled
export const getDemoStats = DemoSetupService.getDemoStats.bind(DemoSetupService);
export const autoInitialize = () => Promise.resolve(); // Disabled
