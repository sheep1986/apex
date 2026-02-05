import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    AlertCircle,
    ArrowRight,
    Award,
    BarChart3,
    CheckCircle,
    Clock,
    Phone,
    Star,
    Target,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface CustomerMilestone {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  completed: boolean;
  completedDate?: Date;
  targetDate?: Date;
  value?: string;
  nextAction?: string;
}

interface CustomerHealthMetrics {
  overallScore: number;
  usageFrequency: number;
  featureAdoption: number;
  performanceResults: number;
  supportEngagement: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface CustomerJourneyStage {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  currentStep?: boolean;
  estimatedTimeToComplete?: string;
}

const customerMilestones: CustomerMilestone[] = [
  {
    id: 'signup',
    title: 'Account Created',
    description: 'Successfully signed up for Trinity Labs AI',
    date: new Date().toISOString(),
    icon: CheckCircle,
    color: 'emerald',
    completed: true,
    completedDate: new Date('2024-01-15'),
    value: 'Welcome to Trinity!',
  },
  {
    id: 'onboarding',
    title: 'Onboarding Complete',
    description: 'Completed the initial setup process',
    icon: Target,
    completed: true,
    completedDate: new Date('2024-01-15'),
    value: '6/6 steps completed',
  },
  {
    id: 'first_campaign',
    title: 'First Campaign Created',
    description: 'Set up your first AI calling campaign',
    icon: Phone,
    completed: true,
    completedDate: new Date('2024-01-16'),
    value: 'Lead Generation Campaign',
  },
  {
    id: 'first_call',
    title: 'First AI Call Made',
    description: 'Your AI assistant made its first call',
    icon: Phone,
    completed: true,
    completedDate: new Date('2024-01-16'),
    value: '2 minutes duration',
  },
  {
    id: 'first_lead',
    title: 'First Qualified Lead',
    description: 'AI successfully qualified your first lead',
    icon: Users,
    completed: true,
    completedDate: new Date('2024-01-17'),
    value: 'High-quality prospect',
  },
  {
    id: 'ten_calls',
    title: '10 Successful Calls',
    description: 'Reached 10 successful AI calls milestone',
    icon: TrendingUp,
    completed: false,
    targetDate: new Date('2024-01-20'),
    nextAction: 'Continue running your campaign - 3 more calls to go!',
  },
  {
    id: 'first_conversion',
    title: 'First Conversion',
    description: 'Your first lead converted to a sale',
    icon: Award,
    completed: false,
    targetDate: new Date('2024-01-25'),
    nextAction: 'Follow up with qualified leads',
  },
  {
    id: 'team_expansion',
    title: 'Team Member Added',
    description: 'Invited your first team member',
    icon: Users,
    completed: false,
    nextAction: 'Invite team members to collaborate',
  },
];

const journeyStages: CustomerJourneyStage[] = [
  {
    id: 'onboarding',
    name: 'Getting Started',
    description: 'Complete setup and make first calls',
    completed: true,
  },
  {
    id: 'early_success',
    name: 'Early Success',
    description: 'Generate first leads and optimize performance',
    completed: false,
    currentStep: true,
    estimatedTimeToComplete: '1-2 weeks',
  },
  {
    id: 'optimization',
    name: 'Optimization',
    description: 'Scale campaigns and improve conversion rates',
    completed: false,
    estimatedTimeToComplete: '2-4 weeks',
  },
  {
    id: 'expansion',
    name: 'Growth',
    description: 'Add team members and expand use cases',
    completed: false,
    estimatedTimeToComplete: '1-2 months',
  },
];

export function CustomerSuccess() {
  const [healthMetrics, setHealthMetrics] = useState<CustomerHealthMetrics>({
    overallScore: 78,
    usageFrequency: 85,
    featureAdoption: 70,
    performanceResults: 80,
    supportEngagement: 75,
    riskLevel: 'low',
  });

  const [showFullMilestones, setShowFullMilestones] = useState(false);

  const completedMilestones = customerMilestones.filter((m) => m.completed);
  const nextMilestone = customerMilestones.find((m) => !m.completed);
  const totalMilestones = customerMilestones.length;
  const completionPercentage = (completedMilestones.length / totalMilestones) * 100;

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHealthScoreDescription = (score: number) => {
    if (score >= 80) return "Excellent - You're on track for success!";
    if (score >= 60) return 'Good - Some areas for improvement';
    return "At Risk - Let's get you back on track";
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-900 text-green-400 border-green-800';
      case 'medium':
        return 'bg-yellow-900 text-yellow-400 border-yellow-800';
      case 'high':
        return 'bg-red-900 text-red-400 border-red-800';
      default:
        return 'bg-gray-900 text-gray-400 border-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Customer Health Score */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-brand-pink" />
              <span>Customer Health Score</span>
            </CardTitle>
            <Badge className={getRiskLevelColor(healthMetrics.riskLevel)}>
              {healthMetrics.riskLevel.toUpperCase()} RISK
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div
                className={`text-4xl font-bold ${getHealthScoreColor(healthMetrics.overallScore)}`}
              >
                {healthMetrics.overallScore}
              </div>
              <div className="mt-1 text-gray-400">
                {getHealthScoreDescription(healthMetrics.overallScore)}
              </div>
            </div>

            {/* Health Metrics Breakdown */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Usage Frequency</span>
                  <span className="text-white">{healthMetrics.usageFrequency}%</span>
                </div>
                <Progress value={healthMetrics.usageFrequency} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Feature Adoption</span>
                  <span className="text-white">{healthMetrics.featureAdoption}%</span>
                </div>
                <Progress value={healthMetrics.featureAdoption} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Performance Results</span>
                  <span className="text-white">{healthMetrics.performanceResults}%</span>
                </div>
                <Progress value={healthMetrics.performanceResults} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Support Engagement</span>
                  <span className="text-white">{healthMetrics.supportEngagement}%</span>
                </div>
                <Progress value={healthMetrics.supportEngagement} className="h-2" />
              </div>
            </div>

            {/* Recommendations */}
            {healthMetrics.overallScore < 80 && (
              <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                  <div>
                    <h4 className="mb-2 font-medium text-yellow-400">
                      Recommendations to improve your score:
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-300">
                      {healthMetrics.featureAdoption < 70 && (
                        <li>• Explore advanced features like A/B testing and custom scripts</li>
                      )}
                      {healthMetrics.usageFrequency < 80 && (
                        <li>• Increase daily campaign activity to build momentum</li>
                      )}
                      {healthMetrics.performanceResults < 80 && (
                        <li>• Optimize your scripts and targeting for better results</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Journey Progress */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-brand-pink" />
            <span>Your Journey Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {journeyStages.map((stage, index) => (
              <div key={stage.id} className="flex items-center space-x-4">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    stage.completed
                      ? 'bg-green-500 text-white'
                      : stage.currentStep
                        ? 'bg-brand-pink text-white'
                        : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {stage.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-medium ${
                        stage.completed
                          ? 'text-green-400'
                          : stage.currentStep
                            ? 'text-white'
                            : 'text-gray-400'
                      }`}
                    >
                      {stage.name}
                    </h4>
                    {stage.currentStep && (
                      <Badge className="border-brand-pink/30 bg-brand-pink/20 text-brand-pink">
                        Current Step
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{stage.description}</p>
                  {stage.estimatedTimeToComplete && !stage.completed && (
                    <p className="mt-1 text-xs text-gray-500">
                      Estimated time: {stage.estimatedTimeToComplete}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Success Milestones */}
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-brand-pink" />
              <span>Success Milestones</span>
            </CardTitle>
            <div className="text-right">
              <div className="text-sm text-gray-400">Progress</div>
              <div className="text-lg font-bold text-white">
                {completedMilestones.length}/{totalMilestones}
              </div>
            </div>
          </div>
          <Progress value={completionPercentage} className="mt-2 h-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Next Milestone */}
            {nextMilestone && (
              <div className="rounded-lg border border-brand-pink/20 bg-gradient-to-r from-brand-pink/10 to-brand-magenta/10 p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-pink/20">
                    <nextMilestone.icon className="h-4 w-4 text-brand-pink" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-medium text-white">Next: {nextMilestone.title}</h4>
                    <p className="mb-2 text-sm text-gray-300">{nextMilestone.description}</p>
                    {nextMilestone.nextAction && (
                      <p className="text-sm font-medium text-brand-pink">
                        {nextMilestone.nextAction}
                      </p>
                    )}
                    {nextMilestone.targetDate && (
                      <p className="mt-2 text-xs text-gray-500">
                        Target: {nextMilestone.targetDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Completions */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-gray-300">Recent Achievements</h4>
              <div className="space-y-3">
                {completedMilestones.slice(-3).map((milestone) => (
                  <div key={milestone.id} className="flex items-center space-x-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{milestone.title}</span>
                        <span className="text-xs text-gray-500">
                          {milestone.completedDate?.toLocaleDateString()}
                        </span>
                      </div>
                      {milestone.value && (
                        <p className="text-xs text-gray-400">{milestone.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!showFullMilestones && completedMilestones.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullMilestones(true)}
                  className="mt-2 text-brand-pink hover:bg-brand-pink/10 hover:text-brand-pink"
                >
                  View All Achievements
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>

            {/* All Milestones (expanded view) */}
            {showFullMilestones && (
              <div className="space-y-3 border-t border-gray-800 pt-4">
                <h4 className="text-sm font-medium text-gray-300">All Milestones</h4>
                {customerMilestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center space-x-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        milestone.completed
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-700 text-gray-500'
                      }`}
                    >
                      {milestone.completed ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            milestone.completed ? 'text-white' : 'text-gray-400'
                          }`}
                        >
                          {milestone.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          {milestone.completed
                            ? milestone.completedDate?.toLocaleDateString()
                            : milestone.targetDate?.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success Tips */}
      <Card className="border-green-800/30 bg-gradient-to-r from-green-900/20 to-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-green-400" />
            <span>Success Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-green-400" />
              <div>
                <h4 className="text-sm font-medium text-white">Daily Consistency</h4>
                <p className="text-xs text-gray-400">
                  Run campaigns daily for 2-3 hours to build momentum and improve results
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-blue-400" />
              <div>
                <h4 className="text-sm font-medium text-white">Script Optimization</h4>
                <p className="text-xs text-gray-400">
                  Test different scripts and analyze which ones perform best for your audience
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-emerald-400" />
              <div>
                <h4 className="text-sm font-medium text-white">Follow-up Strategy</h4>
                <p className="text-xs text-gray-400">
                  Create systematic follow-up sequences for qualified leads to maximize conversions
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
