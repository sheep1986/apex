import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  ExternalLink,
  Users,
  Phone,
  Gauge,
  Activity,
  BarChart3,
  RefreshCw,
  Bell,
  Maximize2,
  ArrowUp,
  ArrowDown,
  Clock,
  Target,
  Info
} from 'lucide-react';

interface ConcurrencyMetrics {
  current: number;
  limit: number;
  queued: number;
  available: number;
  peak24h: number;
  averageUtilization: number;
  totalCallsToday: number;
  estimatedCost: number;
}

interface CampaignConcurrency {
  id: string;
  name: string;
  activeCalls: number;
  queuedCalls: number;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'paused' | 'queued';
  budget: number;
  spent: number;
}

interface AutoScalingConfig {
  enabled: boolean;
  minLimit: number;
  maxLimit: number;
  scaleUpThreshold: number; // percentage
  scaleDownThreshold: number; // percentage
  budgetLimit: number;
  peakHoursEnabled: boolean;
  peakHours: { start: string; end: string };
}

export const DynamicConcurrencyManager: React.FC = () => {
  const [metrics, setMetrics] = useState<ConcurrencyMetrics>({
    current: 25,
    limit: 50,
    queued: 12,
    available: 25,
    peak24h: 47,
    averageUtilization: 68,
    totalCallsToday: 1247,
    estimatedCost: 324.50
  });

  const [campaigns, setCampaigns] = useState<CampaignConcurrency[]>([
    {
      id: '1',
      name: 'Real Estate Outreach',
      activeCalls: 15,
      queuedCalls: 8,
      priority: 'high',
      status: 'active',
      budget: 2000,
      spent: 845.30
    },
    {
      id: '2',
      name: 'Insurance Follow-up',
      activeCalls: 10,
      queuedCalls: 4,
      priority: 'medium',
      status: 'active',
      budget: 1500,
      spent: 623.20
    },
    {
      id: '3',
      name: 'Solar Panel Campaign',
      activeCalls: 0,
      queuedCalls: 0,
      priority: 'low',
      status: 'paused',
      budget: 1000,
      spent: 267.80
    }
  ]);

  const [autoScaling, setAutoScaling] = useState<AutoScalingConfig>({
    enabled: true,
    minLimit: 10,
    maxLimit: 100,
    scaleUpThreshold: 80,
    scaleDownThreshold: 30,
    budgetLimit: 1000,
    peakHoursEnabled: true,
    peakHours: { start: '09:00', end: '17:00' }
  });

  const [manualLimit, setManualLimit] = useState(50);
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        current: Math.max(0, prev.current + Math.floor(Math.random() * 6) - 3),
        queued: Math.max(0, prev.queued + Math.floor(Math.random() * 4) - 2),
        available: prev.limit - prev.current
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if nearing limits
    const utilizationPercentage = (metrics.current / metrics.limit) * 100;
    if (utilizationPercentage > 85) {
      setShowUpgradeAlert(true);
    }
  }, [metrics]);

  const handleAutoScale = () => {
    const utilizationPercentage = (metrics.current / metrics.limit) * 100;
    
    if (utilizationPercentage > autoScaling.scaleUpThreshold && metrics.limit < autoScaling.maxLimit) {
      const newLimit = Math.min(autoScaling.maxLimit, metrics.limit + 10);
      setMetrics(prev => ({ ...prev, limit: newLimit, available: newLimit - prev.current }));
      setManualLimit(newLimit);
    } else if (utilizationPercentage < autoScaling.scaleDownThreshold && metrics.limit > autoScaling.minLimit) {
      const newLimit = Math.max(autoScaling.minLimit, metrics.limit - 5);
      setMetrics(prev => ({ ...prev, limit: newLimit, available: newLimit - prev.current }));
      setManualLimit(newLimit);
    }
  };

  const handleManualLimitChange = (value: number[]) => {
    const newLimit = value[0];
    setManualLimit(newLimit);
    setMetrics(prev => ({ ...prev, limit: newLimit, available: newLimit - prev.current }));
  };

  const handleCampaignAction = (campaignId: string, action: 'pause' | 'resume') => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, status: action === 'pause' ? 'paused' : 'active' }
        : campaign
    ));
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage < 50) return 'text-emerald-400';
    if (percentage < 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const utilizationPercentage = (metrics.current / metrics.limit) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dynamic Concurrency Manager</h2>
          <p className="text-gray-400">Monitor and optimize Vapi org-level concurrency in real-time</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="border-gray-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-gray-700"
            onClick={() => window.open('https://dashboard.vapi.ai', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Vapi Dashboard
          </Button>
        </div>
      </div>

      {/* Upgrade Alert */}
      {showUpgradeAlert && (
        <Alert className="border-orange-500 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Nearing concurrency limit ({utilizationPercentage.toFixed(1)}% utilized). Consider upgrading your Vapi plan.</span>
            <Button 
              size="sm" 
              onClick={() => window.open('https://dashboard.vapi.ai/billing', '_blank')}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Upgrade Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-emerald-500" />
              Active Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.current}</div>
            <p className="text-xs text-gray-500">of {metrics.limit} limit</p>
            <Progress 
              value={utilizationPercentage} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Users className="h-4 w-4 mr-2 text-yellow-500" />
              Queued Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.queued}</div>
            <p className="text-xs text-gray-500">waiting for slots</p>
            {metrics.queued > 0 && (
              <Badge variant="outline" className="mt-2 text-xs text-yellow-400 border-yellow-400">
                Auto-retry active
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Gauge className="h-4 w-4 mr-2 text-blue-500" />
              Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getUtilizationColor(utilizationPercentage)}`}>
              {utilizationPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">24h avg: {metrics.averageUtilization}%</p>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-purple-500" />
              Today's Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.totalCallsToday.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Est. cost: ${metrics.estimatedCost}</p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manual Controls */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Manual Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">Concurrency Limit</label>
                <span className="text-emerald-400 font-medium">{manualLimit} sessions</span>
              </div>
              <Slider
                value={[manualLimit]}
                onValueChange={handleManualLimitChange}
                max={200}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 min</span>
                <span>Current: {manualLimit}</span>
                <span>200 max</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={handleAutoScale}
                className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
              >
                <Zap className="h-4 w-4 mr-2" />
                Auto Scale
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-700"
                onClick={() => setShowUpgradeAlert(false)}
              >
                <Bell className="h-4 w-4 mr-2" />
                Clear Alerts
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Auto-scaling Configuration */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Maximize2 className="h-5 w-5 mr-2" />
              Auto-scaling Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Enable Auto-scaling</label>
              <Switch
                checked={autoScaling.enabled}
                onCheckedChange={(checked) => 
                  setAutoScaling(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {autoScaling.enabled && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Scale Up at</label>
                    <div className="text-sm text-white">{autoScaling.scaleUpThreshold}% utilization</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Scale Down at</label>
                    <div className="text-sm text-white">{autoScaling.scaleDownThreshold}% utilization</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Min Limit</label>
                    <div className="text-sm text-white">{autoScaling.minLimit} sessions</div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Max Limit</label>
                    <div className="text-sm text-white">{autoScaling.maxLimit} sessions</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Peak Hours Boost</label>
                  <Switch
                    checked={autoScaling.peakHoursEnabled}
                    onCheckedChange={(checked) => 
                      setAutoScaling(prev => ({ ...prev, peakHoursEnabled: checked }))
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Queue Management */}
      <Card className="border-gray-800 bg-gray-900">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Campaign Queue Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(campaign.priority)}`} />
                  <div>
                    <h4 className="font-medium text-white">{campaign.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {campaign.activeCalls} active
                      </span>
                      {campaign.queuedCalls > 0 && (
                        <span className="flex items-center text-yellow-400">
                          <Target className="h-3 w-3 mr-1" />
                          {campaign.queuedCalls} queued
                        </span>
                      )}
                      <span>Priority: {campaign.priority}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-white">
                      ${campaign.spent.toFixed(2)} / ${campaign.budget}
                    </div>
                    <div className="text-xs text-gray-400">
                      {((campaign.spent / campaign.budget) * 100).toFixed(1)}% used
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {campaign.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCampaignAction(campaign.id, 'pause')}
                        className="border-amber-600 text-amber-400 hover:bg-amber-600/20"
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCampaignAction(campaign.id, 'resume')}
                        className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Resume
                      </Button>
                    )}

                    <Badge 
                      variant="outline" 
                      className={
                        campaign.status === 'active' 
                          ? 'border-emerald-600 text-emerald-400'
                          : campaign.status === 'paused'
                          ? 'border-amber-600 text-amber-400'
                          : 'border-gray-600 text-gray-400'
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-blue-400 mb-1">Queue Management Tips</h5>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• High priority campaigns get queue preference</li>
                  <li>• Vapi automatically retries queued calls for up to 1 hour</li>
                  <li>• Pause low-priority campaigns during peak hours to prevent bottlenecks</li>
                  <li>• Monitor budget utilization to prevent overspending</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DynamicConcurrencyManager;