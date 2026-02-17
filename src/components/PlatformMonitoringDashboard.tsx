import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/auth';
import { usePlatformMonitoring } from '../hooks/usePlatformMonitoring';
import {
  Server,
  Database,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap,
  Users,
  Phone,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Play,
  Pause,
  AlertTriangle,
  Wifi,
  WifiOff,
  Settings,
  MonitorUp,
  Cpu,
  HardDrive,
  MemoryStick,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface PlatformMetrics {
  railway: RailwayMetrics;
  supabase: SupabaseMetrics;
  auth: AuthMetrics;
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

interface AuthMetrics {
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

export default function PlatformMonitoringDashboard() {
  const { getToken } = useAuth();
  const {
    metrics,
    alerts,
    loading,
    error,
    connected,
    lastUpdate,
    fetchMetrics,
    restartRailwayService: restartService,
    getAnalyticsReport,
    getStatusSummary
  } = usePlatformMonitoring();
  
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const API_BASE_URL = ''; // All API calls go through Netlify Functions (relative paths)

  // Restart Railway service
  const restartRailwayService = async (serviceId?: string) => {
    try {
      const result = await restartService(serviceId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('❌ Error restarting Railway service:', error);
      toast.error('Failed to restart Railway service');
    }
  };

  // Auto-refresh functionality (additional to the hook's built-in polling)
  useEffect(() => {
    if (autoRefresh && !refreshInterval) {
      const interval = setInterval(fetchMetrics, 15000); // Additional refresh every 15 seconds when auto-refresh is on
      setRefreshInterval(interval);
    } else if (!autoRefresh && refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, fetchMetrics, refreshInterval]);

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'healthy':
          return { color: 'bg-green-500', text: 'Healthy', icon: CheckCircle };
        case 'degraded':
          return { color: 'bg-yellow-500', text: 'Degraded', icon: AlertTriangle };
        case 'down':
          return { color: 'bg-red-500', text: 'Down', icon: AlertCircle };
        default:
          return { color: 'bg-gray-500', text: 'Unknown', icon: AlertCircle };
      }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white border-0`}>
        <Icon className="mr-1 h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-32 w-32 animate-spin rounded-full border-b-2 border-emerald-500"></div>
          <p className="text-xl">Loading platform monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Platform Monitoring</h1>
            <div className="mt-1 flex items-center gap-4">
              <p className="text-gray-400">Real-time monitoring of all platform services</p>
              <div className="flex items-center gap-2">
                {connected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {lastUpdate && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    Updated {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant="outline"
              size="sm"
              className={`border-gray-600 text-white hover:bg-gray-700 ${
                autoRefresh ? 'bg-emerald-600 border-emerald-500' : ''
              }`}
            >
              {autoRefresh ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
            </Button>
            <Button
              onClick={fetchMetrics}
              variant="outline"
              size="sm"
              className="border-gray-600 text-white hover:bg-gray-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* System Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <Alert key={index} className={`border-${alert.type === 'error' ? 'red' : 'yellow'}-500/20 bg-${alert.type === 'error' ? 'red' : 'yellow'}-500/10`}>
                <AlertCircle className={`h-4 w-4 text-${alert.type === 'error' ? 'red' : 'yellow'}-500`} />
                <AlertDescription className={`text-${alert.type === 'error' ? 'red' : 'yellow'}-400`}>
                  <strong>{alert.service.toUpperCase()}:</strong> {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Service Status Overview */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Railway
                </div>
                <StatusBadge status={metrics?.railway.status || 'unknown'} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Services</span>
                  <span className="text-white">{metrics?.railway.services.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Response Time</span>
                  <span className="text-white">{metrics?.railway.responseTime?.toFixed(0) || 0}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Error Rate</span>
                  <span className="text-white">{metrics?.railway.errorRate?.toFixed(1) || 0}%</span>
                </div>
              </div>
              <Button
                onClick={() => restartRailwayService()}
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Restart Service
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Supabase
                </div>
                <StatusBadge status={metrics?.supabase.status || 'unknown'} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Connections</span>
                  <span className="text-white">{metrics?.supabase.connections || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Response Time</span>
                  <span className="text-white">{metrics?.supabase.responseTime?.toFixed(0) || 0}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">DB Size</span>
                  <span className="text-white">{((metrics?.supabase.databaseSize || 0) / 1024 / 1024).toFixed(1)}MB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Auth
                </div>
                <StatusBadge status={metrics?.auth?.status || 'unknown'} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Users</span>
                  <span className="text-white">{metrics?.auth?.totalUsers || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Active 24h</span>
                  <span className="text-white">{metrics?.auth?.activeUsers24h || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sign-ins 24h</span>
                  <span className="text-white">{metrics?.auth?.signIns24h || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Server
                </div>
                <StatusBadge status={metrics?.server.status || 'down'} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-white">{Math.floor((metrics?.server.uptime || 0) / 3600)}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">CPU Usage</span>
                  <span className="text-white">{metrics?.server.cpuUsage?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Memory</span>
                  <span className="text-white">{metrics?.server.memoryUsage?.toFixed(1) || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Server Metrics */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Cpu className="h-5 w-5" />
                Server Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-gray-300">CPU Usage</span>
                    <span className="text-white">{metrics?.server.cpuUsage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={metrics?.server.cpuUsage || 0} className="h-2" />
                </div>
                
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-gray-300">Memory Usage</span>
                    <span className="text-white">{metrics?.server.memoryUsage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={metrics?.server.memoryUsage || 0} className="h-2" />
                </div>
                
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-gray-300">Disk Usage</span>
                    <span className="text-white">{metrics?.server.diskUsage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={metrics?.server.diskUsage || 0} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BarChart3 className="h-5 w-5" />
                API Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Response Time</span>
                  <span className="text-white">{metrics?.server.apiResponseTime?.toFixed(0) || 0}ms</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Active Connections</span>
                  <span className="text-white">{metrics?.server.activeConnections || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Requests/min</span>
                  <span className="text-white">{metrics?.server.requestsPerMinute || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Error Rate</span>
                  <span className="text-white">{metrics?.server.errorRate?.toFixed(2) || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Tables */}
        {metrics?.supabase.tables && metrics.supabase.tables.length > 0 && (
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="h-5 w-5" />
                Database Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {metrics.supabase.tables.map((table) => (
                  <div key={table.name} className="rounded-lg border border-gray-600 p-4">
                    <h4 className="font-medium text-white">{table.name}</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rows</span>
                        <span className="text-white">{table.rowCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Size</span>
                        <span className="text-white">{(table.sizeBytes / 1024).toFixed(1)}KB</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Deployments */}
        {metrics?.railway.deployments && metrics.railway.deployments.length > 0 && (
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MonitorUp className="h-5 w-5" />
                Recent Deployments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.railway.deployments.slice(0, 5).map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between rounded-lg border border-gray-600 p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={deployment.status.toLowerCase()} />
                        <span className="text-white">{deployment.commitMessage || 'No message'}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">
                        {new Date(deployment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {deployment.url && (
                      <Button
                        onClick={() => window.open(deployment.url, '_blank')}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-white hover:bg-gray-700"
                      >
                        View
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Timestamp */}
        <div className="text-center text-sm text-gray-400">
          Last updated: {lastUpdate ? lastUpdate.toLocaleString() : 'Never'}
        </div>
      </div>
    </div>
  );
}