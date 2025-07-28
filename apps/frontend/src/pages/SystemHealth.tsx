import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['common']);
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
            <h1 className="text-3xl font-bold text-white">{t('systemHealth.title')}</h1>
            <p className="mt-1 text-gray-400">{t('systemHealth.description')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              <Bell className="mr-2 h-4 w-4" />
              {t('systemHealth.alerts')}
            </Button>
            <Button className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700">
              <Settings className="mr-2 h-4 w-4" />
              {t('systemHealth.configure')}
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="h-5 w-5 text-emerald-400" />
              {t('systemHealth.platformStatus')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                <span className="font-medium text-emerald-400">{t('systemHealth.allSystemsOperational')}</span>
              </div>
              <div className="text-sm text-gray-400">
                {t('systemHealth.lastUpdated', { time: new Date().toLocaleString() })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-sm text-gray-400">{t('systemHealth.uptime')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">12ms</div>
                <div className="text-sm text-gray-400">{t('systemHealth.responseTime')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">0</div>
                <div className="text-sm text-gray-400">{t('systemHealth.activeIssues')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">47</div>
                <div className="text-sm text-gray-400">{t('systemHealth.services')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Status */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{t('systemHealth.apiGateway')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">99.99%</div>
              <p className="mt-1 text-xs text-gray-400">{t('systemHealth.uptime')}</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-emerald-400">{t('systemHealth.operational')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{t('systemHealth.database')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">99.95%</div>
              <p className="mt-1 text-xs text-gray-400">{t('systemHealth.uptime')}</p>
              <div className="mt-2 flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-emerald-400">{t('systemHealth.operational')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{t('systemHealth.avgResponseTime')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">45ms</div>
              <p className="mt-1 text-xs text-gray-400">{t('systemHealth.last24Hours')}</p>
              <div className="mt-2 flex items-center gap-1">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">{t('systemHealth.stable')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
