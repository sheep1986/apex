import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type NotificationType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'system'
  | 'campaign'
  | 'billing';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationCategory =
  | 'system'
  | 'calls'
  | 'campaigns'
  | 'performance'
  | 'billing'
  | 'security';

export interface NotificationAction {
  label: string;
  href?: string;
  callback?: () => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: NotificationPriority;
  category: NotificationCategory;
  source: string;
  metadata?: Record<string, any>;
  action?: NotificationAction;
  autoHide?: boolean;
  hideAfter?: number; // milliseconds
  persistent?: boolean;
}

export interface NotificationFilters {
  categories: NotificationCategory[];
  types: NotificationType[];
  priorities: NotificationPriority[];
  sources: string[];
  unreadOnly: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  recentActivity: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

export interface NotificationPreferences {
  categories: {
    calls: boolean;
    performance: boolean;
    system: boolean;
    billing: boolean;
    campaigns: boolean;
    security: boolean;
  };
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface NotificationStore {
  notifications: Notification[];
  filters: NotificationFilters;
  maxNotifications: number;
  preferences: NotificationPreferences;

  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearByCategory: (category: NotificationCategory) => void;
  clearByType: (type: NotificationType) => void;
  clearOld: (olderThanDays: number) => void;

  // Filters
  setFilters: (filters: Partial<NotificationFilters>) => void;
  resetFilters: () => void;

  // Getters
  getFilteredNotifications: () => Notification[];
  getStats: () => NotificationStats;
  getUnreadCount: () => number;
  getNotificationsByCategory: (category: NotificationCategory) => Notification[];
  getNotificationsByType: (type: NotificationType) => Notification[];
  getNotificationsByPriority: (priority: NotificationPriority) => Notification[];
  getRecentNotifications: (count: number) => Notification[];

  // Settings
  setMaxNotifications: (max: number) => void;

  // Preferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
}

const defaultFilters: NotificationFilters = {
  categories: [],
  types: [],
  priorities: [],
  sources: [],
  unreadOnly: false,
};

const defaultPreferences: NotificationPreferences = {
  categories: {
    calls: true,
    performance: true,
    system: true,
    billing: true,
    campaigns: true,
    security: true,
  },
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [], // Start with empty notifications
      filters: defaultFilters,
      maxNotifications: 25,
      preferences: defaultPreferences,

      addNotification: (notification) => {
        const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: new Date(),
          read: false,
          priority: notification.priority || 'medium',
          category: notification.category || 'system',
          source: notification.source || 'unknown',
        };

        set((state) => {
          const notifications = [newNotification, ...state.notifications];

          // Limit notifications to maxNotifications
          if (notifications.length > state.maxNotifications) {
            notifications.splice(state.maxNotifications);
          }

          return { notifications };
        });

        // Auto-hide notification if specified
        if (notification.autoHide && notification.hideAfter) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.hideAfter);
        }

        return id;
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      markAsUnread: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: false } : n)),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      clearByCategory: (category) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.category !== category),
        }));
      },

      clearByType: (type) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.type !== type),
        }));
      },

      clearOld: (olderThanDays) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        set((state) => ({
          notifications: state.notifications.filter((n) => {
            const timestamp = n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp);
            return timestamp > cutoffDate || n.persistent;
          }),
        }));
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      resetFilters: () => {
        set({ filters: defaultFilters });
      },

      getFilteredNotifications: () => {
        const { notifications, filters } = get();

        return notifications.filter((notification) => {
          // Category filter
          if (
            filters.categories.length > 0 &&
            !filters.categories.includes(notification.category)
          ) {
            return false;
          }

          // Type filter
          if (filters.types.length > 0 && !filters.types.includes(notification.type)) {
            return false;
          }

          // Priority filter
          if (
            filters.priorities.length > 0 &&
            !filters.priorities.includes(notification.priority)
          ) {
            return false;
          }

          // Source filter
          if (filters.sources.length > 0 && !filters.sources.includes(notification.source)) {
            return false;
          }

          // Unread only filter
          if (filters.unreadOnly && notification.read) {
            return false;
          }

          // Date range filter
          if (filters.dateRange) {
            const notifDate = notification.timestamp;
            if (notifDate < filters.dateRange.start || notifDate > filters.dateRange.end) {
              return false;
            }
          }

          return true;
        });
      },

      getStats: () => {
        const { notifications } = get();
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const stats: NotificationStats = {
          total: notifications.length,
          unread: notifications.filter((n) => !n.read).length,
          byCategory: {
            system: 0,
            calls: 0,
            campaigns: 0,
            performance: 0,
            billing: 0,
            security: 0,
          },
          byType: {
            success: 0,
            error: 0,
            warning: 0,
            info: 0,
            system: 0,
            campaign: 0,
            billing: 0,
          },
          byPriority: {
            low: 0,
            medium: 0,
            high: 0,
            urgent: 0,
          },
          recentActivity: {
            today: notifications.filter((n) => {
              const timestamp = n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp);
              return timestamp >= todayStart;
            }).length,
            thisWeek: notifications.filter((n) => {
              const timestamp = n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp);
              return timestamp >= weekStart;
            }).length,
            thisMonth: notifications.filter((n) => {
              const timestamp = n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp);
              return timestamp >= monthStart;
            }).length,
          },
        };

        // Count by category
        notifications.forEach((notification) => {
          stats.byCategory[notification.category]++;
          stats.byType[notification.type]++;
          stats.byPriority[notification.priority]++;
        });

        return stats;
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },

      getNotificationsByCategory: (category) => {
        return get().notifications.filter((n) => n.category === category);
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter((n) => n.type === type);
      },

      getNotificationsByPriority: (priority) => {
        return get().notifications.filter((n) => n.priority === priority);
      },

      getRecentNotifications: (count) => {
        return get().notifications.slice(0, count);
      },

      setMaxNotifications: (max) => {
        set((state) => {
          const notifications = state.notifications.slice(0, max);
          return { maxNotifications: max, notifications };
        });
      },

      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        }));
      },
    }),
    {
      name: 'apex-notifications',
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          // Convert timestamp strings back to Date objects
          if (key === 'timestamp' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        },
        replacer: (key, value) => {
          // Keep Date objects as they are for JSON serialization
          return value;
        },
      }),
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 25), // Only persist last 25 notifications
        maxNotifications: state.maxNotifications,
      }),
    }
  )
);

// Helper functions for creating notifications
export const createNotification = {
  success: (title: string, message: string, options?: Partial<Notification>) => ({
    type: 'success' as const,
    title,
    message,
    priority: 'medium' as const,
    category: 'system' as const,
    source: 'app',
    autoHide: true,
    hideAfter: 5000,
    ...options,
  }),

  error: (title: string, message: string, options?: Partial<Notification>) => ({
    type: 'error' as const,
    title,
    message,
    priority: 'high' as const,
    category: 'system' as const,
    source: 'app',
    persistent: true,
    ...options,
  }),

  warning: (title: string, message: string, options?: Partial<Notification>) => ({
    type: 'warning' as const,
    title,
    message,
    priority: 'medium' as const,
    category: 'system' as const,
    source: 'app',
    autoHide: true,
    hideAfter: 8000,
    ...options,
  }),

  info: (title: string, message: string, options?: Partial<Notification>) => ({
    type: 'info' as const,
    title,
    message,
    priority: 'low' as const,
    category: 'system' as const,
    source: 'app',
    autoHide: true,
    hideAfter: 4000,
    ...options,
  }),

  system: (title: string, message: string, options?: Partial<Notification>) => ({
    type: 'system' as const,
    title,
    message,
    priority: 'medium' as const,
    category: 'system' as const,
    source: 'system',
    ...options,
  }),

  campaign: (title: string, message: string, options?: Partial<Notification>) => ({
    type: 'campaign' as const,
    title,
    message,
    priority: 'medium' as const,
    category: 'campaigns' as const,
    source: 'campaign-manager',
    ...options,
  }),

  billing: (title: string, message: string, options?: Partial<Notification>) => ({
    type: 'billing' as const,
    title,
    message,
    priority: 'medium' as const,
    category: 'billing' as const,
    source: 'billing',
    ...options,
  }),
};

// Hook for easy notification creation
export const useNotifications = () => {
  const addNotification = useNotificationStore((state) => state.addNotification);

  return {
    success: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification(createNotification.success(title, message, options)),

    error: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification(createNotification.error(title, message, options)),

    warning: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification(createNotification.warning(title, message, options)),

    info: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification(createNotification.info(title, message, options)),

    system: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification(createNotification.system(title, message, options)),

    campaign: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification(createNotification.campaign(title, message, options)),

    billing: (title: string, message: string, options?: Partial<Notification>) =>
      addNotification(createNotification.billing(title, message, options)),
  };
};
