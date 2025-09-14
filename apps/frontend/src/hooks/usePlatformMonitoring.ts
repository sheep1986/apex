import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth';

interface PlatformMetrics {
  railway: RailwayMetrics;
  supabase: SupabaseMetrics;
  clerk: ClerkMetrics;
  server: ServerMetrics;
  timestamp: string;
}

interface RailwayMetrics {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  deployments: Array<{
    id: string;
    status: string;
    createdAt: string;
    url?: string;
    commitMessage?: string;
  }>;
  services: Array<{
    id: string;
    name: string;
    status: string;
    cpu: number;
    memory: number;
    disk: number;
    restarts: number;
  }>;
  lastUpdate: string;
  errorRate?: number;
  responseTime?: number;
}

interface SupabaseMetrics {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  connections: number;
  activeUsers: number;
  storageUsed: number;
  apiCalls24h: number;
  databaseSize: number;
  responseTime: number;
  errorRate: number;
  tables: Array<{
    name: string;
    rowCount: number;
    sizeBytes: number;
    lastUpdated: string;
  }>;
}

interface ClerkMetrics {
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  totalUsers: number;
  activeUsers24h: number;
  signIns24h: number;
  signUps24h: number;
  organizations: number;
  sessionCount: number;
  apiCalls24h: number;
  errorRate: number;
}

interface ServerMetrics {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  apiResponseTime: number;
  errorRate: number;
  activeConnections: number;
  requestsPerMinute: number;
}

interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
  service: string;
}

export function usePlatformMonitoring() {
  const { getToken } = useAuth();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  // Fetch metrics via REST API
  const fetchMetrics = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/platform-monitoring/metrics`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
        setError(null);
        setLastUpdate(new Date());
        checkForAlerts(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch metrics');
      }
    } catch (error) {
      console.error('❌ Error fetching platform metrics:', error);
      setError(error instanceof Error ? error.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [getToken, API_BASE_URL]);

  // Check for alerts based on metrics
  const checkForAlerts = useCallback((metricsData: PlatformMetrics) => {
    const newAlerts: Alert[] = [];

    // Check Railway status
    if (metricsData.railway.status === 'down') {
      newAlerts.push({
        type: 'error',
        message: 'Railway services are down',
        service: 'railway'
      });
    } else if (metricsData.railway.status === 'degraded') {
      newAlerts.push({
        type: 'warning',
        message: 'Railway services are degraded',
        service: 'railway'
      });
    }

    // Check Supabase status
    if (metricsData.supabase.status === 'down') {
      newAlerts.push({
        type: 'error',
        message: 'Supabase database is down',
        service: 'supabase'
      });
    } else if (metricsData.supabase.responseTime > 2000) {
      newAlerts.push({
        type: 'warning',
        message: 'Supabase response time is high',
        service: 'supabase'
      });
    }

    // Check Clerk status
    if (metricsData.clerk.status === 'down') {
      newAlerts.push({
        type: 'error',
        message: 'Clerk authentication is down',
        service: 'clerk'
      });
    }

    // Check server metrics
    if (metricsData.server.status === 'down') {
      newAlerts.push({
        type: 'error',
        message: 'API server is down',
        service: 'server'
      });
    } else {
      if (metricsData.server.cpuUsage > 80) {
        newAlerts.push({
          type: 'warning',
          message: 'High CPU usage detected',
          service: 'server'
        });
      }
      
      if (metricsData.server.memoryUsage > 85) {
        newAlerts.push({
          type: 'warning',
          message: 'High memory usage detected',
          service: 'server'
        });
      }
      
      if (metricsData.server.apiResponseTime > 1000) {
        newAlerts.push({
          type: 'warning',
          message: 'Slow API response times',
          service: 'server'
        });
      }
    }

    setAlerts(newAlerts);
  }, []);

  // Restart Railway service
  const restartRailwayService = useCallback(async (serviceId?: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/platform-monitoring/railway/restart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceId }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh metrics after a delay
        setTimeout(fetchMetrics, 5000);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error || 'Failed to restart Railway service' };
      }
    } catch (error) {
      console.error('❌ Error restarting Railway service:', error);
      return { success: false, message: 'Failed to restart Railway service' };
    }
  }, [getToken, API_BASE_URL, fetchMetrics]);

  // Get analytics report
  const getAnalyticsReport = useCallback(async (period: '24h' | '7d' | '30d' = '24h') => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/platform-monitoring/analytics/${period}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to generate analytics report');
      }
    } catch (error) {
      console.error('❌ Error getting analytics report:', error);
      throw error;
    }
  }, [getToken, API_BASE_URL]);

  // Get platform status summary
  const getStatusSummary = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/platform-monitoring/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get status summary');
      }
    } catch (error) {
      console.error('❌ Error getting status summary:', error);
      throw error;
    }
  }, [getToken, API_BASE_URL]);

  // Setup polling for real-time updates (since we don't have socket.io client)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Initial fetch
    fetchMetrics();
    
    // Set up polling every 30 seconds
    interval = setInterval(fetchMetrics, 30000);
    
    // Simulate connection status
    setConnected(true);
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      setConnected(false);
    };
  }, [fetchMetrics]);

  return {
    // Data
    metrics,
    alerts,
    loading,
    error,
    connected,
    lastUpdate,
    
    // Actions
    fetchMetrics,
    restartRailwayService,
    getAnalyticsReport,
    getStatusSummary,
  };
}