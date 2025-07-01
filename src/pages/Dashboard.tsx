import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Phone, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Plus,
  ArrowRight,
  Play,
  Pause,
  Settings,
  HelpCircle,
  Target,
  BarChart3,
  FileText,
  Calendar,
  Zap,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Mock user data - in real app this would come from auth context
const mockUser = {
  name: 'Sam',
  role: 'agency_admin', // 'agency_admin', 'campaign_manager', 'analyst', 'new_user'
  organization: 'Digital Marketing Agency',
  isNewUser: true,
  onboardingCompleted: false
}

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const getRoleBasedContent = (role: string) => {
  switch (role) {
    case 'new_user':
      return {
        title: 'Welcome to Apex!',
        subtitle: 'Let\'s get you started with your first campaign',
        primaryAction: {
          text: 'Create Your First Campaign',
          href: '/campaigns/new',
          icon: Plus
        },
        secondaryActions: [
          { text: 'Upload Leads', href: '/leads', icon: FileText },
          { text: 'View Tutorial', href: '/help', icon: HelpCircle }
        ],
        metrics: [
          { label: 'Campaigns', value: '0', change: '+0', icon: Target },
          { label: 'Leads', value: '0', change: '+0', icon: Users },
          { label: 'Calls Made', value: '0', change: '+0', icon: Phone },
          { label: 'Credits Used', value: '$0', change: '+$0', icon: DollarSign }
        ]
      }
    
    case 'agency_admin':
      return {
        title: 'Agency Overview',
        subtitle: 'Manage your clients and campaigns',
        primaryAction: {
          text: 'Add New Client',
          href: '/clients/new',
          icon: Plus
        },
        secondaryActions: [
          { text: 'View All Campaigns', href: '/campaigns', icon: Target },
          { text: 'Team Management', href: '/team', icon: Users },
          { text: 'Billing & Credits', href: '/billing', icon: DollarSign }
        ],
        metrics: [
          { label: 'Active Clients', value: '8', change: '+2', icon: Users },
          { label: 'Active Campaigns', value: '24', change: '+5', icon: Target },
          { label: 'Monthly Calls', value: '12,847', change: '+2,341', icon: Phone },
          { label: 'Monthly Spend', value: '$2,847', change: '+$456', icon: DollarSign }
        ]
      }
    
    case 'campaign_manager':
      return {
        title: 'Campaign Performance',
        subtitle: 'Monitor and optimize your campaigns',
        primaryAction: {
          text: 'Create Campaign',
          href: '/campaigns/new',
          icon: Plus
        },
        secondaryActions: [
          { text: 'Upload Leads', href: '/leads', icon: FileText },
          { text: 'View Analytics', href: '/analytics', icon: BarChart3 },
          { text: 'Live Calls', href: '/live-calls', icon: Phone }
        ],
        metrics: [
          { label: 'Active Campaigns', value: '6', change: '+1', icon: Target },
          { label: 'Total Leads', value: '2,847', change: '+156', icon: Users },
          { label: 'Conversion Rate', value: '12.4%', change: '+2.1%', icon: TrendingUp },
          { label: 'Cost per Lead', value: '$8.45', change: '-$1.20', icon: DollarSign }
        ]
      }
    
    default:
      return {
        title: 'Dashboard',
        subtitle: 'Your AI calling overview',
        primaryAction: {
          text: 'Get Started',
          href: '/campaigns/new',
          icon: Plus
        },
        secondaryActions: [
          { text: 'View Campaigns', href: '/campaigns', icon: Target },
          { text: 'Upload Leads', href: '/leads', icon: FileText }
        ],
        metrics: [
          { label: 'Campaigns', value: '12', change: '+3', icon: Target },
          { label: 'Leads', value: '2,847', change: '+156', icon: Users },
          { label: 'Active Calls', value: '3', change: '+1', icon: Phone },
          { label: 'Monthly Spend', value: '$2,847', change: '+$456', icon: DollarSign }
        ]
      }
  }
}

const getQuickActions = (role: string) => {
  switch (role) {
    case 'new_user':
      return [
        {
          title: 'Complete Setup',
          description: 'Finish your onboarding to unlock all features',
          icon: CheckCircle,
          href: '/onboarding',
          variant: 'default' as const,
          progress: 60
        },
        {
          title: 'Watch Tutorial',
          description: 'Learn how to create your first campaign',
          icon: Play,
          href: '/help/tutorials',
          variant: 'outline' as const
        },
        {
          title: 'Upload Sample Data',
          description: 'Try with our sample lead data',
          icon: FileText,
          href: '/leads/sample',
          variant: 'outline' as const
        }
      ]
    
    case 'agency_admin':
      return [
        {
          title: 'Client Performance',
          description: 'View all client campaign metrics',
          icon: BarChart3,
          href: '/analytics/clients',
          variant: 'default' as const
        },
        {
          title: 'Team Activity',
          description: 'Monitor team member activities',
          icon: Users,
          href: '/team/activity',
          variant: 'outline' as const
        },
        {
          title: 'Credit Management',
          description: 'Manage credits across all clients',
          icon: DollarSign,
          href: '/billing/credits',
          variant: 'outline' as const
        }
      ]
    
    default:
      return [
        {
          title: 'Create Campaign',
          description: 'Set up a new calling campaign',
          icon: Plus,
          href: '/campaigns/new',
          variant: 'default' as const
        },
        {
          title: 'Upload Leads',
          description: 'Import your lead data',
          icon: FileText,
          href: '/leads',
          variant: 'outline' as const
        },
        {
          title: 'View Analytics',
          description: 'Check campaign performance',
          icon: BarChart3,
          href: '/analytics',
          variant: 'outline' as const
        }
      ]
  }
}

const getRecentActivity = (role: string) => {
  const baseActivity = [
    {
      type: 'campaign_created',
      title: 'New Campaign Created',
      description: 'Lead Generation Campaign #12',
      time: '2 hours ago',
      icon: Target,
      color: 'text-green-400'
    },
    {
      type: 'call_completed',
      title: 'Call Completed',
      description: 'John Smith - Qualified Lead',
      time: '4 hours ago',
      icon: Phone,
      color: 'text-blue-400'
    },
    {
      type: 'leads_uploaded',
      title: 'Leads Uploaded',
      description: '500 new leads imported',
      time: '6 hours ago',
      icon: FileText,
      color: 'text-purple-400'
    }
  ]

  if (role === 'agency_admin') {
    return [
      {
        type: 'client_added',
        title: 'New Client Added',
        description: 'ABC Real Estate Agency',
        time: '1 hour ago',
        icon: Users,
        color: 'text-green-400'
      },
      ...baseActivity
    ]
  }

  return baseActivity
}

function isPositiveChange(change: string): boolean {
  // Remove non-numeric, non-decimal, non-minus characters
  const numeric = parseFloat(change.replace(/[^\d.-]/g, ''));
  return numeric > 0;
}

export function Dashboard() {
  const [user] = useState(mockUser)
  const content = getRoleBasedContent(user.role)
  const quickActions = getQuickActions(user.role)
  const recentActivity = getRecentActivity(user.role)

  return (
    <div className="max-w-7xl mx-auto w-full px-4">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {getGreeting()}, {user.name}!
            </h1>
            <p className="text-gray-400 mt-1">
              {content.subtitle}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {user.isNewUser && (
              <Badge className="bg-yellow-900 text-yellow-400 border-yellow-800">
                <Star className="w-3 h-3 mr-1" />
                New User
              </Badge>
            )}
            <Button asChild className="bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-magenta hover:to-brand-pink">
              <Link to={content.primaryAction.href}>
                <content.primaryAction.icon className="w-4 h-4 mr-2" />
                {content.primaryAction.text}
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Actions - Original color theme */}
        <div>
          <div className="text-lg font-semibold text-white mb-2">Quick Actions</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              // Assign a color class based on index or action
              const colorClasses = [
                'bg-pink-500', // Start a New Campaign
                'bg-emerald-600', // Manage Billing
                'bg-purple-600', // Invite Team
                'bg-blue-600', // fallback/extra
                'bg-yellow-500', // fallback/extra
              ];
              const cardColor = colorClasses[index % colorClasses.length];
              return (
                <div
                  key={index}
                  className={`rounded-xl shadow-lg p-6 flex flex-col items-center justify-center text-center text-white transition-transform duration-200 hover:scale-[1.03] ${cardColor}`}
                >
                  <action.icon className="w-8 h-8 mb-2" />
                  <div className="text-xl font-bold mb-1">{action.title}</div>
                  <div className="text-white/80 text-sm mb-4">{action.description}</div>
                  <Button asChild variant="outline" className="bg-white/10 border-white/20 text-white font-semibold w-full mt-auto hover:bg-white/20">
                    <Link to={action.href}>
                      {action.title}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* New User Onboarding Banner */}
        {user.isNewUser && !user.onboardingCompleted && (
          <Card className="relative overflow-hidden rounded-2xl border border-gray-700/60 shadow-2xl backdrop-blur-xl bg-gray-900/90">
            <CardContent className="relative z-10 flex items-center justify-between p-10 gap-8">
              <div className="flex items-center gap-8">
                <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gray-800/80 shadow-xl backdrop-blur-lg border border-gray-700/60">
                  <Zap className="w-10 h-10 text-pink-500 drop-shadow-glow animate-pulse" />
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-white drop-shadow-lg mb-2 tracking-tight">Complete Your Setup</h3>
                  <p className="text-lg text-white/80 font-medium">Finish onboarding to unlock all features and start making calls</p>
                </div>
              </div>
              <Button asChild variant="gradient" className="px-10 py-4 text-lg font-bold rounded-xl shadow-2xl border border-white/30 bg-white/20 hover:bg-white/30 hover:backdrop-blur-lg transition-all duration-200">
                <Link to="/onboarding">
                  Continue Setup <ArrowRight className="ml-2 w-6 h-6" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {content.metrics.map((metric, index) => (
            <Card key={index} className="rounded-2xl bg-gray-900/60 border border-gray-700/40 shadow-lg p-6 flex flex-col gap-4 backdrop-blur-md">
              <CardContent className="p-0 flex flex-col gap-4 h-full justify-between">
                <div className="flex items-center justify-between">
                  <div className="text-gray-400 font-medium">{metric.label}</div>
                  <div className="rounded-lg p-3 bg-pink-500/20 shadow-md flex items-center justify-center">
                    <metric.icon className="w-7 h-7 text-pink-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{metric.value}</div>
                <div className={`text-sm font-medium ${isPositiveChange(metric.change) ? 'text-green-400' : 'text-red-400'} flex items-center gap-1`}>
                  <TrendingUp className="w-4 h-4" />
                  {metric.change}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity & Secondary Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Latest updates from your campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg bg-gray-700`}>
                        <activity.icon className={`w-4 h-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{activity.title}</p>
                        <p className="text-gray-400 text-sm">{activity.description}</p>
                      </div>
                      <span className="text-gray-500 text-sm">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Actions */}
          <div className="space-y-6">
            {content.secondaryActions.map((action, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to={action.href}>
                      <action.icon className="w-4 h-4 mr-2" />
                      {action.text}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {/* Help & Support */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="text-center space-y-3">
                  <HelpCircle className="w-8 h-8 text-brand-pink mx-auto" />
                  <h3 className="text-white font-semibold">Need Help?</h3>
                  <p className="text-gray-400 text-sm">
                    Get support or watch tutorials
                  </p>
                  <div className="space-y-2">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to="/help">
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Help Center
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to="/help/tutorials">
                        <Play className="w-4 h-4 mr-2" />
                        Tutorials
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
