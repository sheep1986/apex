import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  company?: string;
  role: 'platform_owner' | 'client_admin' | 'client_user' | 'client_viewer';
  agencyName?: string;
  subscriptionPlan?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Assistant {
  id: string;
  name: string;
  language: string;
  tone: string;
  workingHours: {
    timezone: string;
    days: string[];
    startTime: string;
    endTime: string;
  };
  keyInformation: string[];
  script: string;
  voiceId: string;
  status: 'active' | 'inactive' | 'paused';
  createdAt: string;
  updatedAt: string;
  demoLink?: string;
  costPerMinute: number;
  totalCalls: number;
  totalMinutes: number;
  totalCost: number;
}

export interface Campaign {
  id: string;
  name: string;
  assistantId: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  leads: {
    total: number;
    called: number;
    converted: number;
  };
  outcomes: {
    interested: number;
    callback: number;
    notInterested: number;
    voicemail: number;
    busy: number;
    wrongNumber: number;
    scheduled: number;
    followUp: number;
    qualified: number;
    hot: number;
  };
  createdAt: string;
  updatedAt: string;
  airtableBaseId?: string;
  makeScenarioIds: string[];
}

export interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  id: string;
  duration?: number;
}

// Auth Store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearError: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Mock user for demo
          const mockUser: User = {
            id: 'user_123',
            firstName: 'Sean',
            lastName: 'Wentz',
            email,
            phoneNumber: '+44 20 7946 0958',
            company: 'Artificial Media Ltd',
            role: 'platform_owner',
            agencyName: 'Artificial Media',
            subscriptionPlan: 'enterprise',
            status: 'active',
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          };

          const token = 'mock-dev-token';

          // Store token in localStorage so API client can access it
          localStorage.setItem('auth_token', token);

          set({
            user: mockUser,
            token: token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user: User) => set({ user, isAuthenticated: true }),
      setToken: (token: string) => {
        localStorage.setItem('auth_token', token);
        set({ token });
      },
      clearError: () => set({ error: null }),

      updateProfile: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
          const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
          set({ user: updatedUser, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Update failed',
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// UI Store
interface UIState {
  sidebarOpen: boolean;
  notifications: NotificationState[];
  theme: 'light' | 'dark';
  loading: Record<string, boolean>;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Omit<NotificationState, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (key: string, loading: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      notifications: [],
      theme: 'dark',
      loading: {},

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      addNotification: (notification) => {
        const id = Date.now().toString();
        const newNotification: NotificationState = { ...notification, id };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-remove after duration
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration || 5000);
        }
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      setTheme: (theme) => set({ theme }),

      setLoading: (key, loading) =>
        set((state) => ({
          loading: { ...state.loading, [key]: loading },
        })),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
);
