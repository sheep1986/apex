import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  FlaskConical,
  Target,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  StopCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  MessageSquare,
  Mic,
  Volume2,
  Settings,
  Award,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ABTest {
  id: string;
  name: string;
  type: 'script' | 'voice' | 'timing' | 'opener' | 'closer';
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  variants: {
    id: string;
    name: string;
    content: string;
    trafficSplit: number;
    metrics: {
      calls: number;
      conversions: number;
      conversionRate: number;
      avgDuration: number;
      cost: number;
    };
  }[];
  winner?: string;
  confidence: number;
  totalCalls: number;
  objective: 'conversion_rate' | 'call_duration' | 'cost_efficiency' | 'lead_quality';
}

interface OptimizationRecommendation {
  id: string;
  category: 'script' | 'voice' | 'timing' | 'targeting';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  potentialImprovement: string;
  effort: 'low' | 'medium' | 'high';
  dataPoints: number;
}

export default function ABTesting() {
  const [activeTests, setActiveTests] = useState<ABTest[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [newTestType, setNewTestType] = useState<string>('script');
  const [newTestName, setNewTestName] = useState<string>('');
  const [newTestDescription, setNewTestDescription] = useState<string>('');
  const [newTestScript, setNewTestScript] = useState<string>('');
  const [newTestVariant, setNewTestVariant] = useState<string>('');
  const [newTestMetric, setNewTestMetric] = useState<string>('conversion_rate');
  const [newTestTrafficSplit, setNewTestTrafficSplit] = useState<number>(50);
  const [newTestDuration, setNewTestDuration] = useState<number>(7);
  const [newTestSignificance, setNewTestSignificance] = useState<number>(95);
  const [newTestMinSample, setNewTestMinSample] = useState<number>(1000);
  const [newTestAutoPause, setNewTestAutoPause] = useState<boolean>(false);
  const [newTestNotifications, setNewTestNotifications] = useState<boolean>(true);
  const [newTestSchedule, setNewTestSchedule] = useState<string>('immediate');
  const [newTestScheduleDate, setNewTestScheduleDate] = useState<string>('');
  const [newTestScheduleTime, setNewTestScheduleTime] = useState<string>('');
  const [newTestTags, setNewTestTags] = useState<string>('');
  const [newTestHypothesis, setNewTestHypothesis] = useState<string>('');
  const [newTestExpectedOutcome, setNewTestExpectedOutcome] = useState<string>('');
  const [newTestPriority, setNewTestPriority] = useState<string>('medium');
  const [newTestBudget, setNewTestBudget] = useState<number>(0);
  const [newTestGeography, setNewTestGeography] = useState<string>('all');
  const [newTestDevice, setNewTestDevice] = useState<string>('all');
  const [newTestAudience, setNewTestAudience] = useState<string>('all');
  const [newTestAdvancedRules, setNewTestAdvancedRules] = useState<string>('');
  const [newTestSegmentation, setNewTestSegmentation] = useState<string>('');
  const [newTestPersonalization, setNewTestPersonalization] = useState<boolean>(false);
  const [newTestMultivariate, setNewTestMultivariate] = useState<boolean>(false);
  const [newTestSampleSize, setNewTestSampleSize] = useState<number>(0);
  const [newTestPowerAnalysis, setNewTestPowerAnalysis] = useState<boolean>(false);
  const [newTestBayesian, setNewTestBayesian] = useState<boolean>(false);
  const [newTestSequential, setNewTestSequential] = useState<boolean>(false);

  const { toast } = useToast();

  useEffect(() => {
    // Mock A/B tests data
    const mockTests: ABTest[] = [
      {
        id: '1',
        name: 'Opening Script Optimization',
        type: 'script',
        status: 'running',
        startDate: '2024-01-15',
        variants: [
          {
            id: 'a',
            name: 'Current Script',
            content: "Hi, this is Sarah from Apex AI. I'm calling because...",
            trafficSplit: 50,
            metrics: {
              calls: 245,
              conversions: 67,
              conversionRate: 27.3,
              avgDuration: 8.2,
              cost: 123.45,
            },
          },
          {
            id: 'b',
            name: 'Pain-Point Script',
            content:
              'Hi, this is Sarah from Apex AI. I noticed your company might be struggling with...',
            trafficSplit: 50,
            metrics: {
              calls: 238,
              conversions: 89,
              conversionRate: 37.4,
              avgDuration: 9.1,
              cost: 119.2,
            },
          },
        ],
        winner: 'b',
        confidence: 94.2,
        totalCalls: 483,
        objective: 'conversion_rate',
      },
      {
        id: '2',
        name: 'Voice Comparison Test',
        type: 'voice',
        status: 'running',
        startDate: '2024-01-20',
        variants: [
          {
            id: 'a',
            name: 'Professional Voice',
            content: 'Sarah (Professional)',
            trafficSplit: 33,
            metrics: {
              calls: 156,
              conversions: 42,
              conversionRate: 26.9,
              avgDuration: 7.8,
              cost: 78.45,
            },
          },
          {
            id: 'b',
            name: 'Friendly Voice',
            content: 'Emma (Friendly)',
            trafficSplit: 33,
            metrics: {
              calls: 162,
              conversions: 51,
              conversionRate: 31.5,
              avgDuration: 8.4,
              cost: 81.2,
            },
          },
          {
            id: 'c',
            name: 'Authoritative Voice',
            content: 'Michael (Authoritative)',
            trafficSplit: 34,
            metrics: {
              calls: 158,
              conversions: 38,
              conversionRate: 24.1,
              avgDuration: 7.2,
              cost: 76.3,
            },
          },
        ],
        confidence: 78.5,
        totalCalls: 476,
        objective: 'conversion_rate',
      },
      {
        id: '3',
        name: 'Call Timing Optimization',
        type: 'timing',
        status: 'completed',
        startDate: '2024-01-10',
        endDate: '2024-01-25',
        variants: [
          {
            id: 'a',
            name: 'Morning Calls (9-11 AM)',
            content: 'Morning time slot',
            trafficSplit: 33,
            metrics: {
              calls: 201,
              conversions: 78,
              conversionRate: 38.8,
              avgDuration: 9.2,
              cost: 98.5,
            },
          },
          {
            id: 'b',
            name: 'Afternoon Calls (2-4 PM)',
            content: 'Afternoon time slot',
            trafficSplit: 33,
            metrics: {
              calls: 195,
              conversions: 52,
              conversionRate: 26.7,
              avgDuration: 7.8,
              cost: 95.25,
            },
          },
          {
            id: 'c',
            name: 'Evening Calls (5-7 PM)',
            content: 'Evening time slot',
            trafficSplit: 34,
            metrics: {
              calls: 198,
              conversions: 48,
              conversionRate: 24.2,
              avgDuration: 6.9,
              cost: 97.8,
            },
          },
        ],
        winner: 'a',
        confidence: 96.8,
        totalCalls: 594,
        objective: 'conversion_rate',
      },
    ];

    const mockRecommendations: OptimizationRecommendation[] = [
      {
        id: '1',
        category: 'script',
        priority: 'high',
        title: 'Test industry-specific openers',
        description:
          'Your conversion rates vary significantly by industry. Test customized opening scripts for your top 3 industries.',
        potentialImprovement: '+15-20% conversion rate',
        effort: 'medium',
        dataPoints: 1240,
      },
      {
        id: '2',
        category: 'timing',
        priority: 'high',
        title: 'Optimize call scheduling by timezone',
        description:
          'Analysis shows 34% better results when calling prospects in their local business hours.',
        potentialImprovement: '+12% conversion rate',
        effort: 'low',
        dataPoints: 856,
      },
      {
        id: '3',
        category: 'voice',
        priority: 'medium',
        title: 'Test younger voice for tech prospects',
        description: 'Tech industry prospects respond 28% better to younger-sounding voices.',
        potentialImprovement: '+8% conversion rate',
        effort: 'low',
        dataPoints: 342,
      },
      {
        id: '4',
        category: 'script',
        priority: 'medium',
        title: 'A/B test objection handling responses',
        description:
          'Your most common objections could be handled more effectively based on successful patterns.',
        potentialImprovement: '+10% conversion rate',
        effort: 'high',
        dataPoints: 567,
      },
    ];

    setActiveTests(mockTests);
    setRecommendations(mockRecommendations);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'draft':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'script':
        return <MessageSquare className="h-4 w-4" />;
      case 'voice':
        return <Mic className="h-4 w-4" />;
      case 'timing':
        return <Clock className="h-4 w-4" />;
      case 'opener':
        return <Play className="h-4 w-4" />;
      case 'closer':
        return <StopCircle className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 border-red-400 bg-red-500/10';
      case 'medium':
        return 'text-yellow-400 border-yellow-400 bg-yellow-500/10';
      case 'low':
        return 'text-green-400 border-green-400 bg-green-500/10';
      default:
        return 'text-gray-400 border-gray-400 bg-gray-500/10';
    }
  };

  const handleCreateTest = () => {
    if (!newTestName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a test name',
        variant: 'destructive',
      });
      return;
    }

    // Mock test creation - in production this would call your API
    const newTest = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTestName,
      type: newTestType,
      status: 'draft',
      variant: newTestVariant,
      script: newTestScript,
      description: newTestDescription,
      hypothesis: newTestHypothesis,
      expectedOutcome: newTestExpectedOutcome,
      metric: newTestMetric,
      trafficSplit: newTestTrafficSplit,
      duration: newTestDuration,
      significance: newTestSignificance,
      minSample: newTestMinSample,
      autoPause: newTestAutoPause,
      notifications: newTestNotifications,
      schedule: newTestSchedule,
      scheduleDate: newTestScheduleDate,
      scheduleTime: newTestScheduleTime,
      tags: newTestTags,
      priority: newTestPriority,
      budget: newTestBudget,
      geography: newTestGeography,
      device: newTestDevice,
      audience: newTestAudience,
      advancedRules: newTestAdvancedRules,
      segmentation: newTestSegmentation,
      personalization: newTestPersonalization,
      multivariate: newTestMultivariate,
      sampleSize: newTestSampleSize,
      powerAnalysis: newTestPowerAnalysis,
      bayesian: newTestBayesian,
      sequential: newTestSequential,
      startDate: new Date().toISOString(),
      endDate: null,
      results: {
        control: { calls: 0, conversions: 0, rate: 0 },
        variant: { calls: 0, conversions: 0, rate: 0 },
        confidence: 0,
        significance: 0,
        winner: null,
      },
    };

    // Add to active tests (in production, this would be handled by your state management)
    activeTests.push(newTest);

    // Reset form
    setNewTestName('');
    setNewTestDescription('');
    setNewTestScript('');
    setNewTestVariant('');
    setNewTestHypothesis('');
    setNewTestExpectedOutcome('');
    setNewTestTags('');
    setNewTestAdvancedRules('');
    setNewTestSegmentation('');
    setShowCreateModal(false);

    toast({
      title: 'Test Created',
      description: 'Your A/B test has been successfully created and is ready to launch.',
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400">Optimize your campaigns with data-driven testing</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/20 p-2">
                  <FlaskConical className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Active Tests</div>
                  <div className="text-lg font-semibold text-white">6</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/20 p-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Tests Completed</div>
                  <div className="text-lg font-semibold text-white">12</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-yellow-500/20 p-2">
                  <Award className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Success Rate</div>
                  <div className="text-lg font-semibold text-white">89%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Tests */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FlaskConical className="h-5 w-5" />
              Active A/B Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTests
                .filter((test) => test.status === 'running')
                .map((test) => (
                  <div key={test.id} className="rounded-lg bg-gray-800/50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(test.type)}
                        <div>
                          <h3 className="font-medium text-white">{test.name}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge className={`text-xs ${getStatusColor(test.status)}`}>
                              {test.status.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              Started {new Date(test.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                        >
                          <Pause className="mr-1 h-3 w-3" />
                          Pause
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
                        >
                          <Settings className="mr-1 h-3 w-3" />
                          Settings
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {test.variants.map((variant) => (
                        <div key={variant.id} className="rounded-md bg-gray-700/50 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-white">{variant.name}</span>
                            <span className="text-xs text-gray-400">
                              {variant.trafficSplit}% traffic
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Calls:</span>
                              <span className="text-white">{variant.metrics.calls}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Conversions:</span>
                              <span className="text-white">{variant.metrics.conversions}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Rate:</span>
                              <span
                                className={`font-medium ${
                                  test.winner === variant.id ? 'text-green-400' : 'text-white'
                                }`}
                              >
                                {variant.metrics.conversionRate}%
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Avg Duration:</span>
                              <span className="text-white">{variant.metrics.avgDuration}m</span>
                            </div>
                          </div>

                          {test.winner === variant.id && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                              <Award className="h-3 w-3" />
                              <span>Leading ({test.confidence}% confidence)</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Optimization Recommendations */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5" />
              AI-Powered Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`rounded-lg border bg-gray-800/50 p-4 ${getPriorityColor(rec.priority)}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Badge className={`text-xs ${getPriorityColor(rec.priority)}`}>
                      {rec.priority.toUpperCase()} PRIORITY
                    </Badge>
                    <span className="text-xs text-gray-400">{rec.dataPoints} data points</span>
                  </div>

                  <h4 className="mb-2 font-medium text-white">{rec.title}</h4>
                  <p className="mb-3 text-sm text-gray-400">{rec.description}</p>

                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs">
                      <span className="text-gray-400">Potential:</span>
                      <span className="ml-1 font-medium text-green-400">
                        {rec.potentialImprovement}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-400">Effort:</span>
                      <span
                        className={`ml-1 font-medium ${
                          rec.effort === 'low'
                            ? 'text-green-400'
                            : rec.effort === 'medium'
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }`}
                      >
                        {rec.effort.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700"
                  >
                    Create Test
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Completed Tests Results */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <CheckCircle className="h-5 w-5" />
              Completed Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTests
                .filter((test) => test.status === 'completed')
                .map((test) => (
                  <div key={test.id} className="rounded-lg bg-gray-800/50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(test.type)}
                        <div>
                          <h3 className="font-medium text-white">{test.name}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge className="bg-blue-500 text-xs">COMPLETED</Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(test.startDate).toLocaleDateString()} -{' '}
                              {test.endDate && new Date(test.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          Winner: {test.variants.find((v) => v.id === test.winner)?.name}
                        </div>
                        <div className="text-xs text-green-400">{test.confidence}% confidence</div>
                      </div>
                    </div>

                    <div className="rounded-md border border-green-500/20 bg-green-500/10 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">Test Results</span>
                      </div>
                      <p className="text-sm text-white">
                        The winning variant achieved{' '}
                        {test.variants.find((v) => v.id === test.winner)?.metrics.conversionRate}%
                        conversion rate, outperforming alternatives by an average of{' '}
                        {Math.round(
                          (test.variants.find((v) => v.id === test.winner)?.metrics
                            .conversionRate || 0) -
                            test.variants
                              .filter((v) => v.id !== test.winner)
                              .reduce((acc, v) => acc + v.metrics.conversionRate, 0) /
                              test.variants.filter((v) => v.id !== test.winner).length
                        )}
                        %.
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <Card className="w-full max-w-md border-gray-800 bg-gray-900">
            <CardHeader className="text-white">
              <CardTitle className="text-white">Create New A/B Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="testName" className="text-sm text-white">
                    Test Name
                  </label>
                  <Input
                    id="testName"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    placeholder="e.g., Call Script Optimization"
                  />
                </div>
                <div>
                  <label htmlFor="testType" className="text-sm text-white">
                    Test Type
                  </label>
                  <Select onValueChange={(value) => setNewTestType(value)} defaultValue="script">
                    <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue placeholder="Select a test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="script">Script</SelectItem>
                      <SelectItem value="voice">Voice</SelectItem>
                      <SelectItem value="timing">Call Timing</SelectItem>
                      <SelectItem value="opener">Opening Script</SelectItem>
                      <SelectItem value="closer">Closing Script</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="testDescription" className="text-sm text-white">
                    Description
                  </label>
                  <Textarea
                    id="testDescription"
                    value={newTestDescription}
                    onChange={(e) => setNewTestDescription(e.target.value)}
                    placeholder="Briefly describe the purpose of this test"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testScript" className="text-sm text-white">
                    Script/Voice Content
                  </label>
                  <Textarea
                    id="testScript"
                    value={newTestScript}
                    onChange={(e) => setNewTestScript(e.target.value)}
                    placeholder="Enter the script or voice content for the test variants"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testVariant" className="text-sm text-white">
                    Variant Name
                  </label>
                  <Input
                    id="testVariant"
                    value={newTestVariant}
                    onChange={(e) => setNewTestVariant(e.target.value)}
                    placeholder="e.g., Variant A, Variant B"
                  />
                </div>
                <div>
                  <label htmlFor="testMetric" className="text-sm text-white">
                    Objective Metric
                  </label>
                  <Select
                    onValueChange={(value) => setNewTestMetric(value)}
                    defaultValue="conversion_rate"
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue placeholder="Select a metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                      <SelectItem value="call_duration">Call Duration</SelectItem>
                      <SelectItem value="cost_efficiency">Cost Efficiency</SelectItem>
                      <SelectItem value="lead_quality">Lead Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="testTrafficSplit" className="text-sm text-white">
                    Traffic Split
                  </label>
                  <Input
                    id="testTrafficSplit"
                    type="number"
                    value={newTestTrafficSplit}
                    onChange={(e) => setNewTestTrafficSplit(Number(e.target.value))}
                    placeholder="e.g., 50"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testDuration" className="text-sm text-white">
                    Test Duration (Days)
                  </label>
                  <Input
                    id="testDuration"
                    type="number"
                    value={newTestDuration}
                    onChange={(e) => setNewTestDuration(Number(e.target.value))}
                    placeholder="e.g., 7"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testSignificance" className="text-sm text-white">
                    Confidence Level (95%)
                  </label>
                  <Input
                    id="testSignificance"
                    type="number"
                    value={newTestSignificance}
                    onChange={(e) => setNewTestSignificance(Number(e.target.value))}
                    placeholder="e.g., 95"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testMinSample" className="text-sm text-white">
                    Minimum Sample Size
                  </label>
                  <Input
                    id="testMinSample"
                    type="number"
                    value={newTestMinSample}
                    onChange={(e) => setNewTestMinSample(Number(e.target.value))}
                    placeholder="e.g., 1000"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testAutoPause" className="text-sm text-white">
                    Auto-Pause
                  </label>
                  <Switch
                    id="testAutoPause"
                    checked={newTestAutoPause}
                    onCheckedChange={(checked) => setNewTestAutoPause(checked)}
                  />
                </div>
                <div>
                  <label htmlFor="testNotifications" className="text-sm text-white">
                    Notifications
                  </label>
                  <Switch
                    id="testNotifications"
                    checked={newTestNotifications}
                    onCheckedChange={(checked) => setNewTestNotifications(checked)}
                  />
                </div>
                <div>
                  <label htmlFor="testSchedule" className="text-sm text-white">
                    Schedule
                  </label>
                  <Select
                    onValueChange={(value) => setNewTestSchedule(value)}
                    defaultValue="immediate"
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue placeholder="Select a schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newTestSchedule === 'scheduled' && (
                  <>
                    <div>
                      <label htmlFor="testScheduleDate" className="text-sm text-white">
                        Schedule Date
                      </label>
                      <Input
                        id="testScheduleDate"
                        type="date"
                        value={newTestScheduleDate}
                        onChange={(e) => setNewTestScheduleDate(e.target.value)}
                        className="border-gray-700 bg-gray-800 text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="testScheduleTime" className="text-sm text-white">
                        Schedule Time
                      </label>
                      <Input
                        id="testScheduleTime"
                        type="time"
                        value={newTestScheduleTime}
                        onChange={(e) => setNewTestScheduleTime(e.target.value)}
                        className="border-gray-700 bg-gray-800 text-white"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label htmlFor="testTags" className="text-sm text-white">
                    Tags (comma-separated)
                  </label>
                  <Input
                    id="testTags"
                    value={newTestTags}
                    onChange={(e) => setNewTestTags(e.target.value)}
                    placeholder="e.g., optimization, call-center"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testHypothesis" className="text-sm text-white">
                    Hypothesis
                  </label>
                  <Input
                    id="testHypothesis"
                    value={newTestHypothesis}
                    onChange={(e) => setNewTestHypothesis(e.target.value)}
                    placeholder="e.g., Increasing conversion rate by 15% through script optimization."
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testExpectedOutcome" className="text-sm text-white">
                    Expected Outcome
                  </label>
                  <Input
                    id="testExpectedOutcome"
                    value={newTestExpectedOutcome}
                    onChange={(e) => setNewTestExpectedOutcome(e.target.value)}
                    placeholder="e.g., Achieving a 15% increase in conversion rate."
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testPriority" className="text-sm text-white">
                    Priority
                  </label>
                  <Select
                    onValueChange={(value) => setNewTestPriority(value)}
                    defaultValue="medium"
                  >
                    <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue placeholder="Select a priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="testBudget" className="text-sm text-white">
                    Budget (optional)
                  </label>
                  <Input
                    id="testBudget"
                    type="number"
                    value={newTestBudget}
                    onChange={(e) => setNewTestBudget(Number(e.target.value))}
                    placeholder="e.g., 1000"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testGeography" className="text-sm text-white">
                    Geography
                  </label>
                  <Select onValueChange={(value) => setNewTestGeography(value)} defaultValue="all">
                    <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue placeholder="Select geography" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="us">US</SelectItem>
                      <SelectItem value="eu">EU</SelectItem>
                      <SelectItem value="asia">Asia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="testDevice" className="text-sm text-white">
                    Device
                  </label>
                  <Select onValueChange={(value) => setNewTestDevice(value)} defaultValue="all">
                    <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="testAudience" className="text-sm text-white">
                    Audience
                  </label>
                  <Select onValueChange={(value) => setNewTestAudience(value)} defaultValue="all">
                    <SelectTrigger className="border-gray-700 bg-gray-800 text-white">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="new_leads">New Leads</SelectItem>
                      <SelectItem value="existing_customers">Existing Customers</SelectItem>
                      <SelectItem value="high_value">High-Value Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="testAdvancedRules" className="text-sm text-white">
                    Advanced Rules (JSON)
                  </label>
                  <Textarea
                    id="testAdvancedRules"
                    value={newTestAdvancedRules}
                    onChange={(e) => setNewTestAdvancedRules(e.target.value)}
                    placeholder="e.g., { 'call_duration': { 'max': 10 } }"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testSegmentation" className="text-sm text-white">
                    Segmentation (JSON)
                  </label>
                  <Textarea
                    id="testSegmentation"
                    value={newTestSegmentation}
                    onChange={(e) => setNewTestSegmentation(e.target.value)}
                    placeholder="e.g., { 'industry': 'tech', 'company_size': 'large' }"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testPersonalization" className="text-sm text-white">
                    Personalization
                  </label>
                  <Switch
                    id="testPersonalization"
                    checked={newTestPersonalization}
                    onCheckedChange={(checked) => setNewTestPersonalization(checked)}
                  />
                </div>
                <div>
                  <label htmlFor="testMultivariate" className="text-sm text-white">
                    Multivariate Test
                  </label>
                  <Switch
                    id="testMultivariate"
                    checked={newTestMultivariate}
                    onCheckedChange={(checked) => setNewTestMultivariate(checked)}
                  />
                </div>
                <div>
                  <label htmlFor="testSampleSize" className="text-sm text-white">
                    Sample Size (for Bayesian)
                  </label>
                  <Input
                    id="testSampleSize"
                    type="number"
                    value={newTestSampleSize}
                    onChange={(e) => setNewTestSampleSize(Number(e.target.value))}
                    placeholder="e.g., 1000"
                    className="border-gray-700 bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <label htmlFor="testPowerAnalysis" className="text-sm text-white">
                    Power Analysis
                  </label>
                  <Switch
                    id="testPowerAnalysis"
                    checked={newTestPowerAnalysis}
                    onCheckedChange={(checked) => setNewTestPowerAnalysis(checked)}
                  />
                </div>
                <div>
                  <label htmlFor="testBayesian" className="text-sm text-white">
                    Bayesian Analysis
                  </label>
                  <Switch
                    id="testBayesian"
                    checked={newTestBayesian}
                    onCheckedChange={(checked) => setNewTestBayesian(checked)}
                  />
                </div>
                <div>
                  <label htmlFor="testSequential" className="text-sm text-white">
                    Sequential Testing
                  </label>
                  <Switch
                    id="testSequential"
                    checked={newTestSequential}
                    onCheckedChange={(checked) => setNewTestSequential(checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTest}
                className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white hover:from-emerald-700 hover:to-blue-700"
              >
                Create Test
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
