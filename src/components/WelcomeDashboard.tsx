import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Phone,
  Upload,
  Settings,
  Play,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Calendar,
  FileText,
  ExternalLink,
  Copy,
  Check,
  Star,
  TrendingUp,
  Clock,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
  completed?: boolean;
  estimatedTime: string;
}

interface PlatformMetric {
  label: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<any>;
  color: string;
}

export default function WelcomeDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === 'true';
  const [showWelcome, setShowWelcome] = useState(isWelcome);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [demoLinkCopied, setDemoLinkCopied] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'upload-contacts',
      title: 'Upload Your Contact List',
      description: 'Import leads from CSV, Excel, or connect your CRM',
      icon: Upload,
      color: 'bg-blue-500',
      estimatedTime: '2 minutes',
      action: () => navigate('/leads?action=upload'),
    },
    {
      id: 'test-assistant',
      title: 'Test Your AI Assistant',
      description: 'Make a test call to verify everything works perfectly',
      icon: Phone,
      color: 'bg-green-500',
      estimatedTime: '3 minutes',
      action: () => navigate('/campaigns?action=test'),
    },
    {
      id: 'customize-script',
      title: 'Customize Your AI Script',
      description: 'Fine-tune the conversation flow and messaging',
      icon: FileText,
      color: 'bg-emerald-500',
      estimatedTime: '5 minutes',
      action: () => navigate('/vapi-dashboard?tab=assistants'),
    },
    {
      id: 'launch-campaign',
      title: 'Launch Your First Campaign',
      description: 'Start making AI calls to your contacts',
      icon: Zap,
      color: 'bg-brand-pink',
      estimatedTime: '2 minutes',
      action: () => navigate('/campaigns?action=create'),
    },
  ];

  const platformMetrics: PlatformMetric[] = [
    {
      label: 'AI Assistant',
      value: 'Ready',
      subtext: 'Professional voice configured',
      icon: Phone,
      color: 'text-green-400',
    },
    {
      label: 'Data Storage',
      value: 'Connected',
      subtext: 'Airtable bases created',
      icon: Shield,
      color: 'text-blue-400',
    },
    {
      label: 'Automation',
      value: 'Active',
      subtext: 'Make.com workflows running',
      icon: Zap,
      color: 'text-emerald-400',
    },
    {
      label: 'Credits',
      value: '247',
      subtext: '~330 calls available',
      icon: Star,
      color: 'text-brand-pink',
    },
  ];

  const nextSteps = [
    {
      step: 1,
      title: 'Upload Contacts',
      description: 'Add your lead list to start calling',
      status: 'pending',
    },
    {
      step: 2,
      title: 'Test Your Setup',
      description: 'Make a test call to verify quality',
      status: 'pending',
    },
    {
      step: 3,
      title: 'Launch Campaign',
      description: 'Start your AI calling campaign',
      status: 'pending',
    },
    {
      step: 4,
      title: 'Monitor Results',
      description: 'Track performance and optimize',
      status: 'pending',
    },
  ];

  const demoLink = 'https://vapi.ai/demo/apex-ai-assistant-demo';

  useEffect(() => {
    // Auto-hide welcome message after 10 seconds
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  const handleActionComplete = (actionId: string) => {
    if (!completedActions.includes(actionId)) {
      setCompletedActions([...completedActions, actionId]);
    }
  };

  const copyDemoLink = () => {
    navigator.clipboard.writeText(demoLink);
    setDemoLinkCopied(true);
    setTimeout(() => setDemoLinkCopied(false), 2000);
  };

  const completionPercentage = (completedActions.length / quickActions.length) * 100;

  if (!showWelcome) {
    return null; // Don't render if welcome is dismissed
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-pink/20 to-brand-magenta/20"></div>
        <Card className="relative border-brand-pink/20 bg-gray-800/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-gradient-to-r from-brand-pink to-brand-magenta p-3">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      Welcome to <span className="text-emerald-400">Apex AI</span>! 🎉
                    </h1>
                    <p className="text-gray-400">Your AI calling platform is ready to use</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-lg text-white">
                    Congratulations! Your setup is complete and you're ready to start making
                    intelligent AI calls.
                  </p>
                  <p className="text-gray-300">
                    Follow the quick actions below to launch your first campaign in under 10
                    minutes.
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => navigate('/campaigns?action=create')}
                    className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Launch First Campaign
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowWelcome(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Explore Dashboard
                  </Button>
                </div>
              </div>

              <button
                onClick={() => setShowWelcome(false)}
                className="text-gray-400 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Status */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span>Platform Status</span>
            <Badge className="border-green-800 bg-green-900 text-green-400">
              All Systems Ready
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {platformMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="text-center">
                  <div className="mb-2 inline-block rounded-lg bg-gray-700 p-3">
                    <Icon className={`h-6 w-6 ${metric.color}`} />
                  </div>
                  <h3 className="font-semibold text-white">{metric.label}</h3>
                  <p className={`text-lg font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="text-xs text-gray-400">{metric.subtext}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Target className="h-5 w-5 text-brand-pink" />
              <span>Quick Actions</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {completedActions.length}/{quickActions.length} completed
              </span>
              <Progress value={completionPercentage} className="h-2 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const isCompleted = completedActions.includes(action.id);

              return (
                <Card
                  key={action.id}
                  className={`cursor-pointer border transition-all hover:scale-105 ${
                    isCompleted
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-600 bg-gray-700/50 hover:border-brand-pink/50'
                  }`}
                  onClick={() => {
                    handleActionComplete(action.id);
                    action.action();
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`rounded-lg p-2 ${isCompleted ? 'bg-green-500' : action.color}`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-white" />
                        ) : (
                          <Icon className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className="font-semibold text-white">{action.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            {action.estimatedTime}
                          </Badge>
                        </div>
                        <p className="mb-2 text-sm text-gray-400">{action.description}</p>
                        <div className="flex items-center text-sm text-brand-pink">
                          {isCompleted ? 'Completed' : 'Get Started'}
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Demo Link */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Phone className="h-5 w-5 text-blue-400" />
            <span>Test Your AI Assistant</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300">
              Want to hear how your AI assistant sounds? Use this demo link to test it yourself:
            </p>

            <div className="flex items-center space-x-2 rounded-lg bg-gray-700 p-3">
              <code className="flex-1 text-sm text-blue-400">{demoLink}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyDemoLink}
                className="border-gray-600"
              >
                {demoLinkCopied ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(demoLink, '_blank')}
                className="border-gray-600"
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                Open
              </Button>
            </div>

            <Alert className="border-blue-400/20 bg-blue-900/20">
              <Phone className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Pro Tip:</strong> Call this number to experience your AI assistant
                firsthand. Share it with your team to get feedback before launching campaigns.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Calendar className="h-5 w-5 text-emerald-400" />
            <span>Your Success Roadmap</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-600 text-sm font-bold text-gray-400">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{step.title}</h4>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {step.status === 'pending' ? 'Pending' : 'Complete'}
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-brand-pink/20 bg-gradient-to-r from-brand-pink/10 to-brand-magenta/10 p-4">
            <h4 className="mb-2 flex items-center font-semibold text-white">
              <TrendingUp className="mr-2 h-4 w-4" />
              Success Metrics to Track
            </h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>
                • <strong>Answer Rate:</strong> Aim for 15-25% (industry average)
              </li>
              <li>
                • <strong>Conversion Rate:</strong> Target 2-5% interested prospects
              </li>
              <li>
                • <strong>Call Duration:</strong> Optimal range is 90-180 seconds
              </li>
              <li>
                • <strong>Cost per Lead:</strong> Typically $15-30 depending on industry
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="border-gray-700 bg-gray-800">
        <CardContent className="p-6">
          <div className="space-y-4 text-center">
            <h3 className="text-xl font-bold text-white">Need Help Getting Started?</h3>
            <p className="text-gray-400">Our team is here to help you succeed with AI calling</p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/help')}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <FileText className="mr-2 h-4 w-4" />
                Documentation
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('mailto:support@apex-ai.com', '_blank')}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Users className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
              <Button
                onClick={() => window.open('https://calendly.com/apex-ai/success-call', '_blank')}
                className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Book Success Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
