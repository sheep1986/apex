import { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Bell,
  Shield,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: number;
  responseTime: number;
  lastChecked: string;
  details?: string;
}

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  threshold: number;
}

export default function SystemHealth() {
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  useEffect(() => {
    const loadSystemHealth = async () => {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 500));
    };

    loadSystemHealth();

    if (isAutoRefresh) {
      const interval = setInterval(loadSystemHealth, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, isAutoRefresh]);

  return (
    <div className="min-h-screen bg-black">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">System Health</h1>
            <p className="mt-1 text-gray-400">Monitor system status and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              <Bell className="mr-2 h-4 w-4" />
              Alerts
            </Button>
            <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700">
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-emerald-400" />
              Platform Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                <span className="font-medium text-emerald-400">All Systems Operational</span>
              </div>
              <div className="text-sm text-gray-400">
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">12ms</div>
                <div className="text-sm text-gray-400">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">Active Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">47</div>
                <div className="text-sm text-gray-400">Services</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">API Gateway</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">99.99%</div>
              <p className="mt-1 text-xs text-gray-400">Uptime</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-emerald-400">Operational</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">99.95%</div>
              <p className="mt-1 text-xs text-gray-400">Uptime</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-emerald-400">Operational</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">45ms</div>
              <p className="mt-1 text-xs text-gray-400">Last 24 hours</p>
              <div className="mt-2 flex items-center gap-1">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">Stable</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
