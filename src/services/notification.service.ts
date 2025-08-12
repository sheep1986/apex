import { useNotificationStore, createNotification } from '@/lib/notification-store';
import { vapiService } from './vapi-service';

export interface NotificationEvent {
  type:
    | 'user_created'
    | 'user_login'
    | 'vapi_sync'
    | 'call_completed'
    | 'campaign_started'
    | 'campaign_completed'
    | 'error'
    | 'system_alert'
    | 'billing_update'
    | 'lead_generated'
    | 'api_limit_warning'
    | 'security_alert'
    | 'data_sync_failed'
    | 'account_connected'
    | 'performance_alert'
    | 'webhook_received';
  data: Record<string, any>;
  userId?: string;
  organizationId?: string;
}

class NotificationService {
  private addNotification = useNotificationStore.getState().addNotification;

  // ==================== USER EVENTS ====================

  notifyUserCreated(userData: {
    name: string;
    email: string;
    role: string;
    organizationName?: string;
  }) {
    this.addNotification(
      createNotification.success(
        'New User Created',
        `${userData.name} (${userData.role}) has been added to ${userData.organizationName || 'the platform'}`,
        {
          category: 'system',
          source: 'user-management',
          metadata: userData,
          action: { label: 'View Users', href: '/team' },
        }
      )
    );
  }

  notifyUserLogin(userData: { name: string; email: string; lastLogin?: string }) {
    this.addNotification(
      createNotification.info('User Login', `${userData.name} has signed in to the platform`, {
        category: 'system',
        source: 'auth',
        metadata: userData,
        priority: 'low',
      })
    );
  }

  notifyUserError(error: { message: string; userId?: string; action?: string }) {
    this.addNotification(
      createNotification.error('User Account Error', `Error with user account: ${error.message}`, {
        category: 'system',
        source: 'user-management',
        metadata: error,
        priority: 'high',
      })
    );
  }

  // ==================== VAPI SYNC EVENTS ====================

  notifyVapiSyncSuccess(data: { accountsCount: number; creditsTotal: number; callsTotal: number }) {
    this.addNotification(
      createNotification.success(
        'VAPI Data Synced',
        `Successfully synced ${data.accountsCount} VAPI accounts. Total: ${data.creditsTotal.toLocaleString()} credits, ${data.callsTotal.toLocaleString()} calls`,
        {
          category: 'system',
          source: 'vapi-sync',
          metadata: data,
          priority: 'low',
        }
      )
    );
  }

  notifyVapiSyncError(error: { message: string; accountId?: string; retryCount?: number }) {
    this.addNotification(
      createNotification.error(
        'VAPI Sync Failed',
        `Failed to sync VAPI data: ${error.message}${error.retryCount ? ` (Retry ${error.retryCount})` : ''}`,
        {
          category: 'system',
          source: 'vapi-sync',
          metadata: error,
          priority: 'high',
          action: { label: 'Retry Sync', href: '/api-keys' },
        }
      )
    );
  }

  notifyVapiAccountConnected(accountData: { name: string; credits: number; id: string }) {
    this.addNotification(
      createNotification.success(
        'VAPI Account Connected',
        `Successfully connected VAPI account "${accountData.name}" with ${accountData.credits.toLocaleString()} credits`,
        {
          category: 'system',
          source: 'vapi-integration',
          metadata: accountData,
          action: { label: 'View API Keys', href: '/api-keys' },
        }
      )
    );
  }

  notifyVapiAccountDisconnected(accountData: { name: string; reason?: string }) {
    this.addNotification(
      createNotification.warning(
        'VAPI Account Disconnected',
        `VAPI account "${accountData.name}" has been disconnected${accountData.reason ? `: ${accountData.reason}` : ''}`,
        {
          category: 'system',
          source: 'vapi-integration',
          metadata: accountData,
          priority: 'medium',
          action: { label: 'Reconnect', href: '/api-keys' },
        }
      )
    );
  }

  // ==================== CALL EVENTS ====================

  notifyCallCompleted(callData: {
    contactName: string;
    duration: number;
    outcome: string;
    campaignName?: string;
    leadScore?: number;
  }) {
    const isSuccess = ['connected', 'interested', 'callback'].includes(callData.outcome);

    this.addNotification(
      createNotification[isSuccess ? 'success' : 'info'](
        'Call Completed',
        `Call with ${callData.contactName} completed (${callData.duration}s) - ${callData.outcome}${callData.leadScore ? ` | Score: ${callData.leadScore}/100` : ''}`,
        {
          category: 'calls',
          source: 'call-manager',
          metadata: callData,
          priority: isSuccess ? 'medium' : 'low',
          action: { label: 'View Call Details', href: '/all-calls' },
        }
      )
    );
  }

  notifyCallFailed(callData: {
    contactName: string;
    phoneNumber: string;
    error: string;
    campaignName?: string;
    retryScheduled?: boolean;
  }) {
    this.addNotification(
      createNotification.error(
        'Call Failed',
        `Call to ${callData.contactName} (${callData.phoneNumber}) failed: ${callData.error}${callData.retryScheduled ? ' - Retry scheduled' : ''}`,
        {
          category: 'calls',
          source: 'call-manager',
          metadata: callData,
          priority: 'medium',
          action: { label: 'View Details', href: '/all-calls' },
        }
      )
    );
  }

  // ==================== CAMPAIGN EVENTS ====================

  notifyCampaignStarted(campaignData: {
    name: string;
    leadsCount: number;
    id: string;
    estimatedDuration?: string;
  }) {
    this.addNotification(
      createNotification.campaign(
        'Campaign Started',
        `Campaign "${campaignData.name}" has started with ${campaignData.leadsCount} leads${campaignData.estimatedDuration ? ` (Est. ${campaignData.estimatedDuration})` : ''}`,
        {
          source: 'campaign-manager',
          metadata: campaignData,
          action: { label: 'View Campaign', href: `/campaigns/${campaignData.id}` },
        }
      )
    );
  }

  notifyCampaignCompleted(campaignData: {
    name: string;
    totalCalls: number;
    successfulCalls: number;
    conversionRate: number;
    id: string;
  }) {
    this.addNotification(
      createNotification.success(
        'Campaign Completed',
        `Campaign "${campaignData.name}" completed: ${campaignData.successfulCalls}/${campaignData.totalCalls} successful calls (${campaignData.conversionRate.toFixed(1)}% conversion)`,
        {
          category: 'campaigns',
          source: 'campaign-manager',
          metadata: campaignData,
          action: { label: 'View Report', href: `/campaigns/${campaignData.id}` },
        }
      )
    );
  }

  notifyCampaignPaused(campaignData: { name: string; reason: string; id: string }) {
    this.addNotification(
      createNotification.warning(
        'Campaign Paused',
        `Campaign "${campaignData.name}" has been paused: ${campaignData.reason}`,
        {
          category: 'campaigns',
          source: 'campaign-manager',
          metadata: campaignData,
          action: { label: 'Resume Campaign', href: `/campaigns/${campaignData.id}` },
        }
      )
    );
  }

  // ==================== LEAD EVENTS ====================

  notifyLeadGenerated(leadData: {
    name: string;
    score: number;
    campaignName: string;
    phoneNumber: string;
    id: string;
  }) {
    const isHighQuality = leadData.score >= 80;

    this.addNotification(
      createNotification[isHighQuality ? 'success' : 'info'](
        `${isHighQuality ? 'High-Quality' : 'New'} Lead Generated`,
        `${leadData.name} from "${leadData.campaignName}" campaign (Score: ${leadData.score}/100)`,
        {
          category: 'performance',
          source: 'lead-manager',
          metadata: leadData,
          priority: isHighQuality ? 'high' : 'medium',
          action: { label: 'View Lead', href: `/leads/${leadData.id}` },
        }
      )
    );
  }

  notifyLeadUpdated(leadData: {
    name: string;
    status: string;
    previousStatus: string;
    id: string;
  }) {
    this.addNotification(
      createNotification.info(
        'Lead Status Updated',
        `${leadData.name} status changed from "${leadData.previousStatus}" to "${leadData.status}"`,
        {
          category: 'performance',
          source: 'lead-manager',
          metadata: leadData,
          priority: 'low',
          action: { label: 'View Lead', href: `/leads/${leadData.id}` },
        }
      )
    );
  }

  // ==================== BILLING EVENTS ====================

  notifyLowCredits(data: { currentBalance: number; threshold: number; estimatedDays: number }) {
    this.addNotification(
      createNotification.warning(
        'Low Credits Warning',
        `Credit balance is low (${data.currentBalance.toLocaleString()} remaining). Estimated ${data.estimatedDays} days at current usage.`,
        {
          category: 'billing',
          source: 'billing',
          metadata: data,
          priority: 'high',
          action: { label: 'Add Credits', href: '/billing' },
        }
      )
    );
  }

  notifyCriticalCredits(data: { currentBalance: number; hoursRemaining: number }) {
    this.addNotification(
      createNotification.error(
        'Critical Credit Level',
        `Only ${data.currentBalance.toLocaleString()} credits remaining! Service may be interrupted in ${data.hoursRemaining} hours.`,
        {
          category: 'billing',
          source: 'billing',
          metadata: data,
          priority: 'urgent',
          action: { label: 'Add Credits Now', href: '/billing' },
        }
      )
    );
  }

  notifyCreditsAdded(data: { amount: number; newBalance: number; transactionId: string }) {
    this.addNotification(
      createNotification.success(
        'Credits Added',
        `${data.amount.toLocaleString()} credits added successfully. New balance: ${data.newBalance.toLocaleString()}`,
        {
          category: 'billing',
          source: 'billing',
          metadata: data,
          action: { label: 'View Billing', href: '/billing' },
        }
      )
    );
  }

  notifyInvoiceGenerated(data: {
    amount: number;
    period: string;
    dueDate: string;
    invoiceId: string;
  }) {
    this.addNotification(
      createNotification.billing(
        'New Invoice Generated',
        `Invoice for ${data.period} generated: $${data.amount.toFixed(2)} (Due: ${data.dueDate})`,
        {
          source: 'billing',
          metadata: data,
          action: { label: 'View Invoice', href: `/billing/invoices/${data.invoiceId}` },
        }
      )
    );
  }

  // ==================== SYSTEM EVENTS ====================

  notifySystemMaintenance(data: { startTime: string; endTime: string; services: string[] }) {
    this.addNotification(
      createNotification.system(
        'Scheduled Maintenance',
        `System maintenance scheduled from ${data.startTime} to ${data.endTime}. Affected: ${data.services.join(', ')}`,
        {
          source: 'system',
          metadata: data,
          priority: 'medium',
        }
      )
    );
  }

  notifySystemAlert(data: {
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    component?: string;
  }) {
    const notificationType =
      data.severity === 'critical' ? 'error' : data.severity === 'high' ? 'warning' : 'info';

    this.addNotification(
      createNotification[notificationType](
        'System Alert',
        `${data.component ? `[${data.component}] ` : ''}${data.message}`,
        {
          category: 'system',
          source: 'monitoring',
          metadata: data,
          priority: data.severity === 'critical' ? 'urgent' : data.severity,
        }
      )
    );
  }

  notifyApiLimitWarning(data: {
    service: string;
    usage: number;
    limit: number;
    resetTime: string;
  }) {
    this.addNotification(
      createNotification.warning(
        'API Limit Warning',
        `${data.service} API usage at ${Math.round((data.usage / data.limit) * 100)}% (${data.usage}/${data.limit}). Resets at ${data.resetTime}`,
        {
          category: 'system',
          source: 'api-monitor',
          metadata: data,
          priority: 'medium',
        }
      )
    );
  }

  notifySecurityAlert(data: { event: string; location?: string; userAgent?: string; ip?: string }) {
    this.addNotification(
      createNotification.error(
        'Security Alert',
        `Security event detected: ${data.event}${data.location ? ` from ${data.location}` : ''}`,
        {
          category: 'system',
          source: 'security',
          metadata: data,
          priority: 'urgent',
          action: { label: 'Review Security', href: '/settings/security' },
        }
      )
    );
  }

  // ==================== PERFORMANCE EVENTS ====================

  notifyPerformanceAlert(data: {
    metric: string;
    value: number;
    threshold: number;
    trend: 'up' | 'down';
    timeframe: string;
  }) {
    const isGood =
      data.metric.includes('conversion') || data.metric.includes('success')
        ? data.trend === 'up'
        : data.trend === 'down';

    this.addNotification(
      createNotification[isGood ? 'success' : 'warning'](
        'Performance Alert',
        `${data.metric} is ${data.trend} to ${data.value}${data.metric.includes('rate') ? '%' : ''} over ${data.timeframe}`,
        {
          category: 'performance',
          source: 'analytics',
          metadata: data,
          priority: 'medium',
          action: { label: 'View Analytics', href: '/analytics' },
        }
      )
    );
  }

  // ==================== ERROR HANDLING ====================

  notifyError(error: {
    title: string;
    message: string;
    component?: string;
    userId?: string;
    action?: { label: string; href?: string; callback?: () => void };
  }) {
    this.addNotification(
      createNotification.error(
        error.title,
        `${error.component ? `[${error.component}] ` : ''}${error.message}`,
        {
          category: 'system',
          source: error.component || 'unknown',
          metadata: error,
          priority: 'high',
          action: error.action,
        }
      )
    );
  }

  // ==================== WEBHOOK EVENTS ====================

  notifyWebhookReceived(data: {
    source: string;
    event: string;
    processed: boolean;
    error?: string;
  }) {
    if (!data.processed && data.error) {
      this.addNotification(
        createNotification.error(
          'Webhook Processing Failed',
          `Failed to process ${data.event} webhook from ${data.source}: ${data.error}`,
          {
            category: 'system',
            source: 'webhook-handler',
            metadata: data,
            priority: 'medium',
          }
        )
      );
    } else if (data.processed) {
      this.addNotification(
        createNotification.success(
          'Webhook Processed',
          `Successfully processed ${data.event} webhook from ${data.source}`,
          {
            category: 'system',
            source: 'webhook-handler',
            metadata: data,
            priority: 'low',
          }
        )
      );
    }
  }

  // ==================== BATCH OPERATIONS ====================

  notifyBatchOperation(data: {
    operation: string;
    total: number;
    successful: number;
    failed: number;
    duration: number;
  }) {
    const hasFailures = data.failed > 0;

    this.addNotification(
      createNotification[hasFailures ? 'warning' : 'success'](
        'Batch Operation Complete',
        `${data.operation}: ${data.successful}/${data.total} successful${hasFailures ? `, ${data.failed} failed` : ''} (${data.duration}s)`,
        {
          category: 'system',
          source: 'batch-processor',
          metadata: data,
          priority: hasFailures ? 'medium' : 'low',
        }
      )
    );
  }

  // ==================== DEMO NOTIFICATIONS ====================

  addDemoNotifications() {
    // Add some realistic demo notifications for testing
    setTimeout(
      () => this.notifyVapiSyncSuccess({ accountsCount: 2, creditsTotal: 12470, callsTotal: 1830 }),
      1000
    );
    setTimeout(
      () =>
        this.notifyLeadGenerated({
          name: 'Sarah Johnson',
          score: 87,
          campaignName: 'Healthcare Outreach Q1',
          phoneNumber: '+1 (555) 123-4567',
          id: 'lead_123',
        }),
      2000
    );
    setTimeout(
      () =>
        this.notifyCallCompleted({
          contactName: 'Mike Chen',
          duration: 145,
          outcome: 'interested',
          campaignName: 'Tech Startup Leads',
          leadScore: 92,
        }),
      3000
    );
    setTimeout(
      () => this.notifyLowCredits({ currentBalance: 1247, threshold: 1000, estimatedDays: 3 }),
      4000
    );
    setTimeout(
      () =>
        this.notifyCampaignStarted({
          name: 'Q1 Real Estate Leads',
          leadsCount: 500,
          id: 'campaign_456',
          estimatedDuration: '2 hours',
        }),
      5000
    );
  }
}

export const notificationService = new NotificationService();
