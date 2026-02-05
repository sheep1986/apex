import { useNotificationStore } from '@/lib/notification-store';
import { notificationService } from './notification.service';

export class DemoSetupService {
  /**
   * Initialize demo data for the platform
   */
  static async initializeDemoData(): Promise<void> {
    console.log('🚀 Initializing demo data...');
    // Demo setup - simplified for Zero-Trace
    await this.setupDemoVoiceAccounts();
    console.log('🔔 Demo data initialized');
  }

  /**
   * Set up demo Apex accounts
   */
  private static async setupDemoVoiceAccounts(): Promise<void> {
    console.log('📞 Setting up demo Trinity accounts...');

    // Mock successful sync
    setTimeout(() => {
      // Use generic voice notification
      notificationService.notifyVoiceSyncSuccess({
        accountsCount: 1,
        creditsTotal: 12470,
        callsTotal: 1847,
      });
    }, 1000);
  }

  static clearDemoData() {
    const { clearNotifications } = useNotificationStore.getState();
    clearNotifications();
    localStorage.removeItem('apex-voice-accounts');
    console.log('✅ Demo data cleared');
  }

  static getDemoStats() {
    const { notifications } = useNotificationStore.getState();
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      highPriority: notifications.filter(n => n.priority === 'high').length,
    };

    return {
      notifications: stats,
      voiceAccounts: 0, 
      timestamp: new Date().toISOString(),
    };
  }

  static isDemoDataInitialized(): boolean {
    const { notifications } = useNotificationStore.getState();
    return notifications.length > 0; 
  }

  static async autoInitialize(): Promise<void> {
     return;
  }
}

export const initializeDemoData = DemoSetupService.initializeDemoData.bind(DemoSetupService);
export const clearDemoData = DemoSetupService.clearDemoData.bind(DemoSetupService);
export const resetDemoData = () => Promise.resolve(); // Disabled
export const getDemoStats = DemoSetupService.getDemoStats.bind(DemoSetupService);
export const autoInitialize = () => Promise.resolve(); // Disabled
