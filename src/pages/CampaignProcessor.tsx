import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Phone, 
  Clock, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  TrendingUp
} from 'lucide-react';
import { campaignProcessor } from '@/services/campaign-processor.service';
import { supabase } from '@/services/supabase-client';
import { format } from 'date-fns';

export default function CampaignProcessor() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  useEffect(() => {
    loadCampaigns();
    loadStatus();
    
    // Refresh status every 10 seconds
    const interval = setInterval(() => {
      loadStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadCampaigns = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setCampaigns(data);
      if (data.length > 0 && !selectedCampaign) {
        setSelectedCampaign(data[0].id);
      }
    }
  };

  const loadStatus = async () => {
    const status = await campaignProcessor.getQueueStatus();
    setQueueStatus(status);
    
    const stats = await campaignProcessor.getDailyStats();
    setDailyStats(stats);
  };

  const startCampaign = async () => {
    if (!selectedCampaign) return;
    
    setLoading(true);
    try {
      const result = await campaignProcessor.processCampaign(selectedCampaign);
      console.log('Campaign started:', result);
      await loadStatus();
    } catch (error) {
      console.error('Failed to start campaign:', error);
    }
    setLoading(false);
  };

  const pauseCampaign = async () => {
    if (!selectedCampaign) return;
    
    setLoading(true);
    try {
      await campaignProcessor.pauseCampaign(selectedCampaign);
      await loadStatus();
    } catch (error) {
      console.error('Failed to pause campaign:', error);
    }
    setLoading(false);
  };

  const resumeCampaign = async () => {
    if (!selectedCampaign) return;
    
    setLoading(true);
    try {
      await campaignProcessor.resumeCampaign(selectedCampaign);
      await loadStatus();
    } catch (error) {
      console.error('Failed to resume campaign:', error);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaign Processor</h1>
          <p className="text-gray-500">Manage automated calling campaigns</p>
        </div>
        <Badge variant={queueStatus?.isWithinCallWindow ? "success" : "secondary"}>
          {queueStatus?.isWithinCallWindow ? 'Call Window Open' : 'Call Window Closed'}
        </Badge>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats?.totalCalls || 0}</div>
            <Progress value={(dailyStats?.totalCalls || 0) / 20} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {dailyStats?.callsRemaining || 2000} remaining today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats?.successRate || '0%'}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="success" className="text-xs">
                {dailyStats?.completedCalls || 0} completed
              </Badge>
              <Badge variant="destructive" className="text-xs">
                {dailyStats?.failedCalls || 0} failed
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyStats?.totalCost || '£0.00'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Est. total: {dailyStats?.estimatedCostToday || '£0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="default">{queueStatus?.active || 0} active</Badge>
              <Badge variant="secondary">{queueStatus?.waiting || 0} waiting</Badge>
              <Badge variant="outline">{queueStatus?.delayed || 0} delayed</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Control */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Control</CardTitle>
          <CardDescription>Start, pause, or resume calling campaigns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <select 
              className="flex-1 p-2 border rounded"
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
            >
              <option value="">Select a campaign</option>
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.is_active ? 'Active' : 'Inactive'})
                </option>
              ))}
            </select>
            
            <Button 
              onClick={startCampaign} 
              disabled={loading || !selectedCampaign}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Start
            </Button>
            
            <Button 
              onClick={pauseCampaign} 
              disabled={loading || !selectedCampaign}
              variant="secondary"
              className="gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
            
            <Button 
              onClick={resumeCampaign} 
              disabled={loading || !selectedCampaign}
              variant="secondary"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Resume
            </Button>
          </div>

          {!queueStatus?.isWithinCallWindow && queueStatus?.nextCallWindow && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Call window is closed. Calls will resume at {format(new Date(queueStatus.nextCallWindow), 'HH:mm')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Phone Numbers Status */}
      <Card>
        <CardHeader>
          <CardTitle>Phone Numbers</CardTitle>
          <CardDescription>Status and usage of configured phone numbers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queueStatus?.phoneNumbers?.map((phone: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{phone.number}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Used: </span>
                    <span className="font-semibold">{phone.dailyCallsUsed}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Remaining: </span>
                    <span className="font-semibold">{phone.dailyCallsRemaining}</span>
                  </div>
                  <Progress 
                    value={(phone.dailyCallsUsed / 166) * 100} 
                    className="w-24"
                  />
                </div>
              </div>
            ))}
            
            {(!queueStatus?.phoneNumbers || queueStatus.phoneNumbers.length === 0) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No phone numbers configured. Using default number.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest call attempts and results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Activity log will appear here when calls are processed
          </div>
        </CardContent>
      </Card>
    </div>
  );
}