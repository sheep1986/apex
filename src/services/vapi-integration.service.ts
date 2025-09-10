import { vapiService, VapiCall, VapiAssistant, VapiPhoneNumber } from './vapi-service';
import { notificationService } from './notification.service';

export interface VapiAccountConfig {
  id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  lastSync?: Date;
  syncStatus: 'connected' | 'disconnected' | 'syncing' | 'error';
  errorMessage?: string;
  metadata?: {
    organizationId?: string;
    userId?: string;
    environment?: 'production' | 'staging' | 'development';
  };
}

export interface VapiAccountData {
  accountId: string;
  accountName: string;
  credits: number;
  totalCalls: number;
  monthlySpend: number;
  assistants: VapiAssistant[];
  phoneNumbers: VapiPhoneNumber[];
  recentCalls: VapiCall[];
  lastSync: Date;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  errorDetails?: string;
}

export interface AggregatedVapiData {
  totalCredits: number;
  totalCalls: number;
  totalMonthlySpend: number;
  accounts: VapiAccountData[];
  lastGlobalSync: Date;
  overallStatus: 'healthy' | 'warning' | 'error';
  syncErrors: string[];
}

class VapiIntegrationService {
  private accounts: VapiAccountConfig[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private isGlobalSyncing = false;
  private listeners: ((data: AggregatedVapiData) => void)[] = [];

  constructor() {
    this.loadAccountConfigs();
    this.startAutoSync();
  }

  // ==================== ACCOUNT MANAGEMENT ====================

  addAccount(config: Omit<VapiAccountConfig, 'id' | 'syncStatus'>): string {
    const accountId = `vapi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAccount: VapiAccountConfig = {
      ...config,
      id: accountId,
      syncStatus: 'disconnected',
    };

    this.accounts.push(newAccount);
    this.saveAccountConfigs();

    // Test connection
    this.testAccountConnection(accountId).then((success) => {
      if (success) {
        notificationService.notifyVapiAccountConnected({
          name: config.name,
          credits: 0, // Will be updated on next sync
          id: accountId,
        });
        this.syncAccount(accountId);
      }
    });

    return accountId;
  }

  removeAccount(accountId: string): boolean {
    const account = this.accounts.find((acc) => acc.id === accountId);
    if (!account) return false;

    this.accounts = this.accounts.filter((acc) => acc.id !== accountId);
    this.saveAccountConfigs();

    notificationService.notifyVapiAccountDisconnected({
      name: account.name,
      reason: 'Account removed by user',
    });

    return true;
  }

  updateAccount(accountId: string, updates: Partial<VapiAccountConfig>): boolean {
    const accountIndex = this.accounts.findIndex((acc) => acc.id === accountId);
    if (accountIndex === -1) return false;

    this.accounts[accountIndex] = { ...this.accounts[accountIndex], ...updates };
    this.saveAccountConfigs();

    // Re-test connection if API key changed
    if (updates.apiKey) {
      this.testAccountConnection(accountId);
    }

    return true;
  }

  getAccounts(): VapiAccountConfig[] {
    return [...this.accounts];
  }

  // ==================== CONNECTION TESTING ====================

  async testAccountConnection(accountId: string): Promise<boolean> {
    const account = this.accounts.find((acc) => acc.id === accountId);
    if (!account) return false;

    try {
      this.updateAccountStatus(accountId, 'syncing');

      // Create a temporary Apex service instance with this account's API key
      const testService = new (vapiService.constructor as any)();
      testService.apiKey = account.apiKey;

      // Test by fetching assistants (lightweight call)
      await testService.getAssistants();

      this.updateAccountStatus(accountId, 'connected');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateAccountStatus(accountId, 'error', errorMessage);

      notificationService.notifyVapiSyncError({
        message: `Connection test failed for ${account.name}: ${errorMessage}`,
        accountId,
      });

      return false;
    }
  }

  async testAllConnections(): Promise<{ [accountId: string]: boolean }> {
    const results: { [accountId: string]: boolean } = {};

    await Promise.all(
      this.accounts.map(async (account) => {
        results[account.id] = await this.testAccountConnection(account.id);
      })
    );

    return results;
  }

  // ==================== DATA SYNCING ====================

  async syncAccount(accountId: string): Promise<VapiAccountData | null> {
    const account = this.accounts.find((acc) => acc.id === accountId);
    if (!account || !account.isActive) return null;

    try {
      this.updateAccountStatus(accountId, 'syncing');

      // Create service instance for this account
      const accountService = new (vapiService.constructor as any)();
      accountService.apiKey = account.apiKey;

      // Fetch data in parallel
      const [assistants, phoneNumbers, calls, analytics] = await Promise.all([
        accountService.getAssistants().catch(() => []),
        accountService.getPhoneNumbers().catch(() => []),
        accountService.getCalls({ limit: 50 }).catch(() => []),
        accountService.getCallAnalytics().catch(() => ({ totalCost: 0, totalCalls: 0 })),
      ]);

      // Calculate credits (mock calculation - replace with real API)
      const mockCredits = Math.floor(Math.random() * 10000) + 1000;

      const accountData: VapiAccountData = {
        accountId: account.id,
        accountName: account.name,
        credits: mockCredits,
        totalCalls: analytics.totalCalls || calls.length,
        monthlySpend: analytics.totalCost || 0,
        assistants,
        phoneNumbers,
        recentCalls: calls.slice(0, 10),
        lastSync: new Date(),
        status: 'connected',
      };

      this.updateAccountStatus(accountId, 'connected');
      account.lastSync = new Date();
      this.saveAccountConfigs();

      return accountData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      this.updateAccountStatus(accountId, 'error', errorMessage);

      notificationService.notifyVapiSyncError({
        message: `Sync failed for ${account.name}: ${errorMessage}`,
        accountId,
      });

      return null;
    }
  }

  async syncAllAccounts(): Promise<AggregatedVapiData> {
    if (this.isGlobalSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isGlobalSyncing = true;
    const syncErrors: string[] = [];

    try {
      const activeAccounts = this.accounts.filter((acc) => acc.isActive);

      if (activeAccounts.length === 0) {
        throw new Error('No active Apex accounts configured');
      }

      // Sync all accounts in parallel
      const accountDataPromises = activeAccounts.map((account) =>
        this.syncAccount(account.id).catch((error) => {
          syncErrors.push(`${account.name}: ${error.message}`);
          return null;
        })
      );

      const accountDataArray = await Promise.all(accountDataPromises);
      const validAccountData = accountDataArray.filter(
        (data): data is VapiAccountData => data !== null
      );

      // Aggregate data
      const aggregatedData: AggregatedVapiData = {
        totalCredits: validAccountData.reduce((sum, acc) => sum + acc.credits, 0),
        totalCalls: validAccountData.reduce((sum, acc) => sum + acc.totalCalls, 0),
        totalMonthlySpend: validAccountData.reduce((sum, acc) => sum + acc.monthlySpend, 0),
        accounts: validAccountData,
        lastGlobalSync: new Date(),
        overallStatus:
          syncErrors.length === 0
            ? 'healthy'
            : syncErrors.length < activeAccounts.length
              ? 'warning'
              : 'error',
        syncErrors,
      };

      // Notify listeners
      this.notifyListeners(aggregatedData);

      // Send appropriate notifications
      if (syncErrors.length === 0) {
        notificationService.notifyVapiSyncSuccess({
          accountsCount: validAccountData.length,
          creditsTotal: aggregatedData.totalCredits,
          callsTotal: aggregatedData.totalCalls,
        });
      } else {
        notificationService.notifyVapiSyncError({
          message: `${syncErrors.length} account(s) failed to sync: ${syncErrors.join('; ')}`,
        });
      }

      return aggregatedData;
    } finally {
      this.isGlobalSyncing = false;
    }
  }

  // ==================== AUTO SYNC ====================

  startAutoSync(intervalMinutes: number = 5): void {
    this.stopAutoSync();

    this.syncInterval = setInterval(
      () => {
        this.syncAllAccounts().catch((error) => {
          console.error('Auto-sync failed:', error);
          notificationService.notifyError({
            title: 'Auto-sync Failed',
            message: error.message,
            component: 'vapi-integration',
          });
        });
      },
      intervalMinutes * 60 * 1000
    );
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ==================== REAL-TIME UPDATES ====================

  onDataUpdate(callback: (data: AggregatedVapiData) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  private notifyListeners(data: AggregatedVapiData): void {
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in Apex data listener:', error);
      }
    });
  }

  // ==================== CALL MONITORING ====================

  async monitorActiveCalls(): Promise<VapiCall[]> {
    const activeCalls: VapiCall[] = [];

    for (const account of this.accounts.filter(
      (acc) => acc.isActive && acc.syncStatus === 'connected'
    )) {
      try {
        const accountService = new (vapiService.constructor as any)();
        accountService.apiKey = account.apiKey;

        const calls = await accountService.getCalls({
          limit: 20,
          createdAtGt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
        });

        const inProgressCalls = calls.filter((call) =>
          ['queued', 'ringing', 'in-progress'].includes(call.status)
        );

        activeCalls.push(...inProgressCalls);
      } catch (error) {
        console.error(`Failed to fetch active calls for ${account.name}:`, error);
      }
    }

    return activeCalls;
  }

  // ==================== WEBHOOK HANDLING ====================

  async handleWebhook(payload: any, accountId?: string): Promise<void> {
    try {
      const { type, data } = payload;

      switch (type) {
        case 'call.started':
          notificationService.notifyCallCompleted({
            contactName: data.customer?.name || data.customer?.number || 'Unknown',
            duration: 0,
            outcome: 'started',
            campaignName: data.metadata?.campaignName,
          });
          break;

        case 'call.ended':
          notificationService.notifyCallCompleted({
            contactName: data.customer?.name || data.customer?.number || 'Unknown',
            duration: data.duration || 0,
            outcome: data.endedReason || 'completed',
            campaignName: data.metadata?.campaignName,
            leadScore: data.analysis?.leadScore,
          });
          break;

        case 'call.failed':
          notificationService.notifyCallFailed({
            contactName: data.customer?.name || data.customer?.number || 'Unknown',
            phoneNumber: data.customer?.number || 'Unknown',
            error: data.error || 'Unknown error',
            campaignName: data.metadata?.campaignName,
          });
          break;

        default:
          console.log('Unknown webhook type:', type);
      }

      notificationService.notifyWebhookReceived({
        source: accountId ? `Apex (${accountId})` : 'Apex',
        event: type,
        processed: true,
      });

      // Trigger a sync to update data
      if (accountId) {
        this.syncAccount(accountId);
      } else {
        this.syncAllAccounts();
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      notificationService.notifyWebhookReceived({
        source: accountId ? `Apex (${accountId})` : 'Apex',
        event: payload.type || 'unknown',
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ==================== UTILITY METHODS ====================

  private updateAccountStatus(
    accountId: string,
    status: VapiAccountConfig['syncStatus'],
    errorMessage?: string
  ): void {
    const account = this.accounts.find((acc) => acc.id === accountId);
    if (account) {
      account.syncStatus = status;
      account.errorMessage = errorMessage;
      this.saveAccountConfigs();
    }
  }

  private loadAccountConfigs(): void {
    try {
      const stored = localStorage.getItem('vapi-accounts');
      if (stored) {
        this.accounts = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load Apex account configs:', error);
      this.accounts = [];
    }
  }

  private saveAccountConfigs(): void {
    try {
      localStorage.setItem('vapi-accounts', JSON.stringify(this.accounts));
    } catch (error) {
      console.error('Failed to save Apex account configs:', error);
    }
  }

  // ==================== HEALTH CHECKS ====================

  async performHealthCheck(): Promise<{
    overall: 'healthy' | 'warning' | 'error';
    accounts: Array<{
      id: string;
      name: string;
      status: 'healthy' | 'warning' | 'error';
      lastSync?: Date;
      error?: string;
    }>;
    recommendations: string[];
  }> {
    const accountStatuses = await Promise.all(
      this.accounts.map(async (account) => {
        const isHealthy = account.isActive && account.syncStatus === 'connected';
        const hasRecentSync =
          account.lastSync && Date.now() - account.lastSync.getTime() < 30 * 60 * 1000; // 30 minutes

        return {
          id: account.id,
          name: account.name,
          status:
            isHealthy && hasRecentSync
              ? ('healthy' as const)
              : isHealthy
                ? ('warning' as const)
                : ('error' as const),
          lastSync: account.lastSync,
          error: account.errorMessage,
        };
      })
    );

    const healthyCount = accountStatuses.filter((acc) => acc.status === 'healthy').length;
    const warningCount = accountStatuses.filter((acc) => acc.status === 'warning').length;
    const errorCount = accountStatuses.filter((acc) => acc.status === 'error').length;

    const overall = errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'healthy';

    const recommendations: string[] = [];

    if (this.accounts.length === 0) {
      recommendations.push(
        'No Apex accounts configured. Add at least one account to start syncing data.'
      );
    }

    if (errorCount > 0) {
      recommendations.push(
        `${errorCount} account(s) have connection errors. Check API keys and permissions.`
      );
    }

    if (warningCount > 0) {
      recommendations.push(
        `${warningCount} account(s) haven't synced recently. Consider manual sync or check connectivity.`
      );
    }

    return {
      overall,
      accounts: accountStatuses,
      recommendations,
    };
  }

  // ==================== DEMO DATA ====================

  addDemoAccounts(): void {
    const demoAccounts: Omit<VapiAccountConfig, 'id' | 'syncStatus'>[] = [
      {
        name: 'Main Production Account',
        apiKey: 'vapi_demo_key_1',
        isActive: true,
        metadata: {
          environment: 'production',
        },
      },
      {
        name: 'Backup Account',
        apiKey: 'vapi_demo_key_2',
        isActive: true,
        metadata: {
          environment: 'production',
        },
      },
    ];

    demoAccounts.forEach((account) => {
      this.addAccount(account);
    });
  }
}

export const vapiIntegrationService = new VapiIntegrationService();
