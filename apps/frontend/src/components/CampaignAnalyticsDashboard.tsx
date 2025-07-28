import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Phone,
  TrendingUp,
  DollarSign,
  Clock,
  Users,
  Target,
  BarChart3,
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useAuth } from '../hooks/auth';

interface CampaignAnalytics {
  campaign_id: string;
  campaign_name: string;
  total_calls: number;
  answered_calls: number;
  qualified_calls: number;
  voicemail_calls: number;
  no_answer_calls: number;
  total_qualified: number;
  answer_rate: number;
  qualification_rate: number;
  total_duration_seconds: number;
  total_cost_usd: number;
  avg_sentiment_score: number;
  avg_qualification_score: number;
}

interface HourlyData {
  hour: number;
  total: number;
  answered: number;
  qualified: number;
  answer_rate: number;
  qualification_rate: number;
}

interface OutcomeBreakdown {
  [outcome: string]: number;
}

interface CampaignAnalyticsDashboardProps {
  campaignId: string;
}

export const CampaignAnalyticsDashboard: React.FC<CampaignAnalyticsDashboardProps> = ({
  campaignId
}) => {
  const { getToken } = useAuth();
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [outcomeBreakdown, setOutcomeBreakdown] = useState<OutcomeBreakdown>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchAnalytics();
    }
  }, [campaignId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getToken();
      const response = await fetch(`/api/call-attempts/${campaignId}/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      
      // Process hourly data
      if (data.breakdown?.hourly) {
        const hourlyArray = Object.entries(data.breakdown.hourly).map(([hour, stats]: [string, any]) => ({
          hour: parseInt(hour),
          total: stats.total || 0,
          answered: stats.answered || 0,
          qualified: stats.qualified || 0,
          answer_rate: stats.total > 0 ? ((stats.answered / stats.total) * 100) : 0,
          qualification_rate: stats.total > 0 ? ((stats.qualified / stats.total) * 100) : 0
        })).sort((a, b) => a.hour - b.hour);
        setHourlyData(hourlyArray);
      }
      
      // Set outcome breakdown
      if (data.breakdown?.outcomes) {
        setOutcomeBreakdown(data.breakdown.outcomes);
      }
      
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getOutcomeColor = (outcome: string) => {
    const colorMap: { [key: string]: string } = {
      answered: 'bg-green-500',
      qualified: 'bg-emerald-500',
      voicemail: 'bg-yellow-500',
      no_answer: 'bg-gray-500',
      not_interested: 'bg-red-500',
      busy: 'bg-orange-500',
      failed: 'bg-red-600'
    };
    return colorMap[outcome] || 'bg-gray-400';
  };

  const getPerformanceIcon = (rate: number, threshold: number = 50) => {
    if (rate >= threshold) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  };

  const getBestPerformingHour = () => {
    if (hourlyData.length === 0) return null;
    return hourlyData.reduce((best, current) => 
      current.qualification_rate > best.qualification_rate ? current : best
    );
  };

  const generateReport = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/call-attempts/${campaignId}/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Handle PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${analytics?.campaign_name}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to generate report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">No analytics data available</div>
      </div>
    );
  }

  const bestHour = getBestPerformingHour();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Campaign Analytics: {analytics.campaign_name}
          </h2>
          <p className="text-gray-400">
            Comprehensive performance analysis and insights
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={generateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate PDF Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="text-sm text-gray-400">Total Calls Made</div>
                <div className="text-2xl font-bold text-white">{analytics.total_calls}</div>
                <div className="text-xs text-gray-500">
                  {formatDuration(analytics.total_duration_seconds)} total talk time
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <div className="text-sm text-gray-400">Answer Rate</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-white">{analytics.answer_rate.toFixed(1)}%</div>
                  {getPerformanceIcon(analytics.answer_rate)}
                </div>
                <div className="text-xs text-gray-500">
                  {analytics.answered_calls} out of {analytics.total_calls} calls
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-emerald-500" />
              <div className="flex-1">
                <div className="text-sm text-gray-400">Qualification Rate</div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-white">{analytics.qualification_rate.toFixed(1)}%</div>
                  {getPerformanceIcon(analytics.qualification_rate, 20)}
                </div>
                <div className="text-xs text-gray-500">
                  {analytics.total_qualified} qualified leads
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-yellow-500" />
              <div className="flex-1">
                <div className="text-sm text-gray-400">Total Cost</div>
                <div className="text-2xl font-bold text-white">${analytics.total_cost_usd.toFixed(2)}</div>
                <div className="text-xs text-gray-500">
                  ${analytics.total_qualified > 0 ? (analytics.total_cost_usd / analytics.total_qualified).toFixed(2) : '0.00'} per qualified lead
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Outcome Distribution */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Call Outcome Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(outcomeBreakdown).map(([outcome, count]) => {
              const percentage = analytics.total_calls > 0 ? (count / analytics.total_calls) * 100 : 0;
              return (
                <div key={outcome} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-300 capitalize">
                    {outcome.replace('_', ' ')}
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-3 relative overflow-hidden">
                    <div 
                      className={`h-full ${getOutcomeColor(outcome)} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-gray-300 text-right">
                    {count} ({percentage.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Hourly Performance Chart */}
      {hourlyData.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Hourly Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Simple ASCII-style chart */}
              <div className="grid grid-cols-12 gap-2">
                {Array.from({ length: 24 }, (_, hour) => {
                  const data = hourlyData.find(h => h.hour === hour);
                  const height = data ? Math.max(10, (data.qualification_rate / 100) * 60) : 0;
                  return (
                    <div key={hour} className="flex flex-col items-center">
                      <div className="text-xs text-gray-400 mb-1">
                        {hour}:00
                      </div>
                      <div 
                        className="w-full bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                        style={{ height: `${height}px`, minHeight: data?.total ? '4px' : '2px' }}
                        title={data ? `${data.total} calls, ${data.qualification_rate.toFixed(1)}% qualified` : 'No calls'}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {data?.total || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-400 text-center">
                Bars show qualification rate, numbers show total calls per hour
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">AI Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-sm text-gray-400">Average Sentiment Score</div>
                  <div className="text-lg font-bold text-white">
                    {analytics.avg_sentiment_score ? analytics.avg_sentiment_score.toFixed(2) : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {analytics.avg_sentiment_score > 0.3 ? 'Positive conversations' : 
                     analytics.avg_sentiment_score < -0.3 ? 'Needs improvement' : 'Neutral interactions'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-emerald-500" />
                <div>
                  <div className="text-sm text-gray-400">Average Qualification Score</div>
                  <div className="text-lg font-bold text-white">
                    {analytics.avg_qualification_score ? analytics.avg_qualification_score.toFixed(2) : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    AI confidence in lead qualification
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Optimization Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestHour && (
                <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="text-sm text-green-400 font-medium">Best Performance Hour</div>
                  <div className="text-white">
                    {bestHour.hour}:00 - {bestHour.hour + 1}:00
                  </div>
                  <div className="text-xs text-gray-400">
                    {bestHour.qualification_rate.toFixed(1)}% qualification rate
                  </div>
                </div>
              )}
              
              {analytics.answer_rate < 30 && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                  <div className="text-sm text-yellow-400 font-medium">Low Answer Rate</div>
                  <div className="text-xs text-gray-400">
                    Consider adjusting call times or improving caller ID reputation
                  </div>
                </div>
              )}
              
              {analytics.qualification_rate < 10 && (
                <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                  <div className="text-sm text-red-400 font-medium">Low Qualification Rate</div>
                  <div className="text-xs text-gray-400">
                    Review AI script and targeting criteria
                  </div>
                </div>
              )}
              
              {analytics.total_qualified > 0 && (analytics.total_cost_usd / analytics.total_qualified) > 50 && (
                <div className="p-3 bg-orange-900/20 border border-orange-700 rounded-lg">
                  <div className="text-sm text-orange-400 font-medium">High Cost Per Lead</div>
                  <div className="text-xs text-gray-400">
                    Optimize call duration and targeting to reduce costs
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CampaignAnalyticsDashboard;