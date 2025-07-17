import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/auth';
import { DemoSetupService } from '@/services/demo-setup.service';
import { vapiIntegrationService } from '@/services/vapi-integration.service';
import { notificationService } from '@/services/notification.service';
import { useNotificationStore } from '@/lib/notification-store';

interface AppInitializationState {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  progress: {
    step: string;
    percentage: number;
  };
}

export function useAppInitialization() {
  const { user, isLoaded } = useUser();
  const [state, setState] = useState<AppInitializationState>({
    isInitialized: false,
    isInitializing: false,
    error: null,
    progress: {
      step: 'Starting...',
      percentage: 0,
    },
  });

  const updateProgress = (step: string, percentage: number) => {
    setState((prev) => ({
      ...prev,
      progress: { step, percentage },
    }));
  };

  const initialize = async () => {
    if (state.isInitializing || state.isInitialized) return;

    setState((prev) => ({ ...prev, isInitializing: true, error: null }));

    try {
      updateProgress('Checking user authentication...', 10);

      // Wait for user to be loaded
      if (!isLoaded) {
        await new Promise((resolve) => {
          const checkLoaded = () => {
            if (isLoaded) {
              resolve(true);
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }

      updateProgress('Initializing notification system...', 20);

      // Initialize notification system
      const { clearOld } = useNotificationStore.getState();
      clearOld(30); // Clear notifications older than 30 days

      updateProgress('Setting up VAPI integration...', 40);

      // Initialize VAPI integration
      const healthCheck = await vapiIntegrationService.performHealthCheck();

      if (healthCheck.overall === 'error' && healthCheck.accounts.length === 0) {
        // No accounts configured, add demo accounts
        updateProgress('Adding demo VAPI accounts...', 50);
        vapiIntegrationService.addDemoAccounts();
      }

      updateProgress('Syncing VAPI data...', 60);

      // Start VAPI sync
      try {
        await vapiIntegrationService.syncAllAccounts();
      } catch (error) {
        console.warn('Initial VAPI sync failed:', error);
        // Continue initialization even if sync fails
      }

      updateProgress('Setting up demo data...', 80);

      // Initialize demo data if needed
      if (!DemoSetupService.isDemoDataInitialized()) {
        await DemoSetupService.initializeDemoData();
      }

      updateProgress('Finalizing initialization...', 90);

      // Set up periodic tasks
      setupPeriodicTasks();

      updateProgress('Initialization complete!', 100);

      setState((prev) => ({
        ...prev,
        isInitialized: true,
        isInitializing: false,
        progress: { step: 'Ready', percentage: 100 },
      }));

      // Welcome notification for new users
      if (user && user.createdAt) {
        const userAge = Date.now() - new Date(user.createdAt).getTime();
        const isNewUser = userAge < 24 * 60 * 60 * 1000; // Less than 24 hours old

        if (isNewUser) {
          setTimeout(() => {
            notificationService.notifyUserLogin({
              name: user.fullName || 'User',
              email: user.primaryEmailAddress?.emailAddress || 'Unknown',
            });
          }, 2000);
        }
      }
    } catch (error) {
      console.error('App initialization failed:', error);
      setState((prev) => ({
        ...prev,
        isInitializing: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const setupPeriodicTasks = () => {
    // VAPI sync every 5 minutes
    setInterval(
      () => {
        vapiIntegrationService.syncAllAccounts().catch((error) => {
          console.warn('Periodic VAPI sync failed:', error);
        });
      },
      5 * 60 * 1000
    );

    // Health check every 10 minutes
    setInterval(
      () => {
        vapiIntegrationService.performHealthCheck().then((health) => {
          if (health.overall === 'error') {
            notificationService.notifySystemAlert({
              message: 'VAPI integration health check failed',
              severity: 'medium',
              component: 'VAPI Integration',
            });
          }
        });
      },
      10 * 60 * 1000
    );

    // Clean up old notifications every hour
    setInterval(
      () => {
        const { clearOld } = useNotificationStore.getState();
        clearOld(7); // Clear notifications older than 7 days
      },
      60 * 60 * 1000
    );

    // Credit balance check every 15 minutes
    setInterval(
      () => {
        checkCreditBalance();
      },
      15 * 60 * 1000
    );
  };

  const checkCreditBalance = async () => {
    try {
      const aggregatedData = await vapiIntegrationService.syncAllAccounts();
      const totalCredits = aggregatedData.totalCredits;

      // Warning thresholds
      const warningThreshold = 1000;
      const criticalThreshold = 100;

      if (totalCredits <= criticalThreshold) {
        notificationService.notifyCriticalCredits({
          currentBalance: totalCredits,
          hoursRemaining: Math.floor(totalCredits / 50), // Assume 50 credits per hour usage
        });
      } else if (totalCredits <= warningThreshold) {
        notificationService.notifyLowCredits({
          currentBalance: totalCredits,
          threshold: warningThreshold,
          estimatedDays: Math.floor(totalCredits / (50 * 24)), // Assume 50 credits per hour usage
        });
      }
    } catch (error) {
      console.warn('Credit balance check failed:', error);
    }
  };

  const reinitialize = async () => {
    setState((prev) => ({
      ...prev,
      isInitialized: false,
      error: null,
    }));
    await initialize();
  };

  const resetToDemo = async () => {
    setState((prev) => ({ ...prev, isInitializing: true }));

    try {
      updateProgress('Resetting to demo data...', 20);
      await DemoSetupService.resetDemoData();

      updateProgress('Reinitializing...', 80);
      await reinitialize();

      notificationService.notifySystemAlert({
        message: 'Platform reset to demo data successfully',
        severity: 'low',
        component: 'Demo Setup',
      });
    } catch (error) {
      console.error('Reset to demo failed:', error);
      setState((prev) => ({
        ...prev,
        isInitializing: false,
        error: error instanceof Error ? error.message : 'Reset failed',
      }));
    }
  };

  // Auto-initialize when user is loaded
  useEffect(() => {
    if (isLoaded && !state.isInitialized && !state.isInitializing) {
      initialize();
    }
  }, [isLoaded, state.isInitialized, state.isInitializing]);

  return {
    ...state,
    initialize,
    reinitialize,
    resetToDemo,
  };
}
