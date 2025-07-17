import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Brain,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
  BarChart3,
  Lightbulb,
  Eye,
  Mic,
  Volume2,
  Phone,
  Activity,
  Award,
  RefreshCw,
} from 'lucide-react';

interface RealTimeInsight {
  id: string;
  callId: string;
  type: 'opportunity' | 'warning' | 'suggestion' | 'success';
  message: string;
  confidence: number;
  timestamp: string;
  actionRequired: boolean;
  suggestedResponse?: string;
}

interface CallPrediction {
  callId: string;
  leadName: string;
  predictedOutcome: 'conversion' | 'callback' | 'not_interested' | 'needs_followup';
  confidence: number;
  keyFactors: string[];
  estimatedValue: number;
  timeToDecision: number;
}

interface ConversationPattern {
  pattern: string;
  successRate: number;
  frequency: number;
  category: 'opening' | 'objection_handling' | 'closing' | 'discovery';
  recommendation: string;
}

export default function AIIntelligence() {
  const [realTimeInsights, setRealTimeInsights] = useState<RealTimeInsight[]>([]);
  const [callPredictions, setCallPredictions] = useState<CallPrediction[]>([]);
  const [conversationPatterns, setConversationPatterns] = useState<ConversationPattern[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');

  useEffect(() => {
    // Mock real-time insights for demonstration
    const mockInsights: RealTimeInsight[] = [
      {
        id: '1',
        callId: 'call_001',
        type: 'opportunity',
        message:
          '🎯 BUYING SIGNAL DETECTED! Lead mentioned "budget approval" - high conversion probability',
        confidence: 0.89,
        timestamp: new Date().toISOString(),
        actionRequired: true,
        suggestedResponse:
          "That's great! Since you have budget approval, let me show you exactly how this fits your requirements...",
      },
      {
        id: '2',
        callId: 'call_002',
        type: 'warning',
        message:
          '⚠️ OBJECTION PATTERN: Customer showing price resistance - recommend value positioning',
        confidence: 0.76,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        actionRequired: true,
        suggestedResponse:
          "I understand budget is important. Let me break down the ROI you'll see in the first quarter...",
      },
      {
        id: '3',
        callId: 'call_003',
        type: 'success',
        message:
          '✅ PERFECT CLOSE: Customer agreed to next steps - follow-up scheduled successfully',
        confidence: 0.94,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        actionRequired: false,
      },
      {
        id: '4',
        callId: 'call_004',
        type: 'suggestion',
        message: '💡 COMPETITOR MENTIONED: "HubSpot" - opportunity to highlight unique advantages',
        confidence: 0.82,
        timestamp: new Date(Date.now() - 450000).toISOString(),
        actionRequired: true,
        suggestedResponse:
          "HubSpot is a solid choice! Here's what makes us different and why our clients switched...",
      },
    ];

    const mockPredictions: CallPrediction[] = [
      {
        callId: 'call_001',
        leadName: 'Sarah Johnson - TechCorp',
        predictedOutcome: 'conversion',
        confidence: 0.89,
        keyFactors: ['Budget discussion', 'Extended conversation', 'Positive sentiment'],
        estimatedValue: 25000,
        timeToDecision: 2,
      },
      {
        callId: 'call_002',
        leadName: 'Mike Chen - StartupXYZ',
        predictedOutcome: 'needs_followup',
        confidence: 0.73,
        keyFactors: ['Interest expressed', 'Price concerns', 'Timeline questions'],
        estimatedValue: 12000,
        timeToDecision: 7,
      },
      {
        callId: 'call_003',
        leadName: 'Lisa Rodriguez - Enterprise Inc',
        predictedOutcome: 'callback',
        confidence: 0.65,
        keyFactors: ['Decision maker not present', 'Technical questions', 'Competitive evaluation'],
        estimatedValue: 45000,
        timeToDecision: 14,
      },
    ];

    const mockPatterns: ConversationPattern[] = [
      {
        pattern: 'Opening with industry-specific pain point',
        successRate: 78,
        frequency: 145,
        category: 'opening',
        recommendation: 'Use this opening for SaaS prospects - 23% higher engagement',
      },
      {
        pattern: 'ROI demonstration with specific numbers',
        successRate: 85,
        frequency: 89,
        category: 'objection_handling',
        recommendation: 'Most effective against price objections - use concrete examples',
      },
      {
        pattern: 'Trial close with timeline confirmation',
        successRate: 72,
        frequency: 234,
        category: 'closing',
        recommendation: 'Works best mid-conversation when interest is confirmed',
      },
      {
        pattern: 'Discovery questions about current process',
        successRate: 81,
        frequency: 167,
        category: 'discovery',
        recommendation: 'Essential for qualifying leads - increases conversion by 31%',
      },
    ];

    setRealTimeInsights(mockInsights);
    setCallPredictions(mockPredictions);
    setConversationPatterns(mockPatterns);

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (isLiveMode) {
        // Add a new insight occasionally
        if (Math.random() > 0.7) {
          const newInsight: RealTimeInsight = {
            id: Date.now().toString(),
            callId: `call_${Math.floor(Math.random() * 1000)}`,
            type: ['opportunity', 'warning', 'suggestion'][Math.floor(Math.random() * 3)] as any,
            message: [
              '🚀 HIGH ENGAGEMENT: Customer asking detailed implementation questions',
              '⏰ CALL DURATION ALERT: 18 minutes - consider moving to close',
              '🔥 HOT LEAD: Multiple buying signals detected in conversation',
            ][Math.floor(Math.random() * 3)],
            confidence: Math.random() * 0.3 + 0.7,
            timestamp: new Date().toISOString(),
            actionRequired: Math.random() > 0.5,
          };

          setRealTimeInsights((prev) => [newInsight, ...prev.slice(0, 9)]);
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isLiveMode]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'suggestion':
        return <Lightbulb className="h-5 w-5 text-blue-400" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPredictionColor = (outcome: string) => {
    switch (outcome) {
      case 'conversion':
        return 'bg-green-500';
      case 'needs_followup':
        return 'bg-blue-500';
      case 'callback':
        return 'bg-yellow-500';
      case 'not_interested':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold text-white">
            <Brain className="h-8 w-8 text-brand-pink" />
            AI Intelligence Center
          </h1>
          <p className="mt-1 text-gray-400">
            Real-time conversation insights and predictive analytics
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Live Mode</span>
            <Switch
              checked={isLiveMode}
              onCheckedChange={setIsLiveMode}
              className="data-[state=checked]:bg-brand-pink"
            />
          </div>

          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-[140px] border-gray-700 bg-gray-800 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-gray-700 bg-gray-800">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="border-gray-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Intelligence Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Call Insights */}
        <Card className="border-gray-800 bg-gray-900/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-yellow-400" />
              Live Call Insights
              {isLiveMode && (
                <div className="ml-auto flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
                  <span className="text-xs text-green-400">LIVE</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 space-y-4 overflow-y-auto">
              {realTimeInsights.map((insight) => (
                <div key={insight.id} className="rounded-lg bg-gray-800/50 p-4">
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <Badge
                          className={`text-xs ${
                            insight.type === 'opportunity'
                              ? 'bg-green-500/20 text-green-400'
                              : insight.type === 'warning'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : insight.type === 'success'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {insight.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(insight.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="mb-2 text-sm text-white">{insight.message}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Confidence:</span>
                          <Progress value={insight.confidence * 100} className="h-2 w-20" />
                          <span className="text-xs text-white">
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>

                        {insight.actionRequired && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-brand-pink text-xs text-brand-pink hover:bg-brand-pink/10"
                          >
                            Take Action
                          </Button>
                        )}
                      </div>

                      {insight.suggestedResponse && (
                        <div className="mt-3 rounded bg-gray-700/50 p-3 text-xs text-gray-300">
                          <strong>Suggested Response:</strong> {insight.suggestedResponse}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call Predictions */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Eye className="h-5 w-5 text-emerald-400" />
              Call Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {callPredictions.map((prediction) => (
                <div key={prediction.callId} className="rounded-lg bg-gray-800/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">{prediction.leadName}</h4>
                    <Badge className={`text-xs ${getPredictionColor(prediction.predictedOutcome)}`}>
                      {prediction.predictedOutcome.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs text-gray-400">Confidence:</span>
                    <Progress value={prediction.confidence * 100} className="h-2 flex-1" />
                    <span className="text-xs text-white">
                      {Math.round(prediction.confidence * 100)}%
                    </span>
                  </div>

                  <div className="mb-2 text-xs text-gray-400">
                    <div>Value: ${prediction.estimatedValue.toLocaleString()}</div>
                    <div>Decision: {prediction.timeToDecision} days</div>
                  </div>

                  <div className="text-xs">
                    <span className="text-gray-400">Key Factors:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {prediction.keyFactors.map((factor, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-gray-600 text-xs text-gray-300"
                        >
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Pattern Analysis */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            High-Performance Conversation Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {conversationPatterns.map((pattern, index) => (
              <div key={index} className="rounded-lg bg-gray-800/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium text-white">{pattern.pattern}</h4>
                  <Badge
                    className={`${
                      pattern.category === 'opening'
                        ? 'bg-green-500/20 text-green-400'
                        : pattern.category === 'objection_handling'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : pattern.category === 'closing'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {pattern.category.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-400">Success Rate</div>
                    <div className="text-lg font-semibold text-white">{pattern.successRate}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Used {pattern.frequency} times</div>
                    <Progress value={pattern.successRate} className="mt-1 h-2" />
                  </div>
                </div>

                <div className="rounded bg-gray-700/50 p-2 text-xs text-gray-300">
                  <Award className="mr-1 inline h-3 w-3" />
                  {pattern.recommendation}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Intelligence Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Conversion Rate</div>
                <div className="text-lg font-semibold text-white">73.2%</div>
                <div className="text-xs text-green-400">+12% vs last week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Brain className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400">AI Insights Generated</div>
                <div className="text-lg font-semibold text-white">342</div>
                <div className="text-xs text-blue-400">Today</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/20 p-2">
                <Target className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Prediction Accuracy</div>
                <div className="text-lg font-semibold text-white">89.4%</div>
                <div className="text-xs text-emerald-400">Last 30 days</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/20 p-2">
                <Zap className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-xs text-gray-400">Actions Taken</div>
                <div className="text-lg font-semibold text-white">127</div>
                <div className="text-xs text-yellow-400">This week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
