import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Activity,
    ArrowRight,
    BarChart3,
    Bot,
    Building,
    Calendar,
    CheckCircle,
    CheckSquare,
    Clock,
    Database,
    DollarSign,
    Globe,
    Phone,
    Play,
    RefreshCw,
    Settings,
    Shield,
    Sparkles,
    Star,
    Target,
    TrendingUp,
    UserCheck,
    Users,
    Webhook,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/auth';
import { useUserContext } from '../services/MinimalUserProvider';

// Social proof data
const testimonials = [
  {
    name: 'Sarah Johnson',
    company: 'TechCorp Solutions',
    role: 'VP of Sales',
    quote:
      "The campaign automation engine is a game-changer. We set up campaigns that respect time zones, retry failed calls intelligently, and qualify leads automatically. Our sales team now focuses only on hot leads.",
    results: '340% increase in qualified leads',
  },
  {
    name: 'Michael Chen',
    company: 'Digital Marketing Pro',
    role: 'Agency Owner',
    quote:
      'The 22 preset qualification fields saved us hours of setup time. Our AI asks the right questions every time, and the automatic lead scoring means we never miss a hot prospect.',
    results: '5x better conversion rates',
  },
  {
    name: 'Emma Rodriguez',
    company: 'Real Estate Masters',
    role: 'Team Lead',
    quote:
      'Working hours enforcement and holiday respect features are brilliant. Our campaigns run 24/7 but only call when appropriate. The multi-phone number support handles our volume perfectly.',
    results: '89% contact rate improvement',
  },
];

const features = [
  {
    icon: Bot,
    title: 'Campaign Automation Engine',
    description:
      'Fully automated campaign execution with minute-by-minute scheduling, intelligent retry logic, and multi-phone support',
    highlight: 'Runs every 60 seconds',
    details: [
      'Respects working hours & time zones',
      'Smart retry based on call outcomes',
      'Round-robin phone distribution',
      'Real-time webhook processing'
    ]
  },
  {
    icon: Target,
    title: 'AI Lead Qualification',
    description: '22 preset fields across 9 categories with custom field support and automatic scoring',
    highlight: '0-100 scoring system',
    details: [
      'Appointment readiness detection',
      'Budget & timeline extraction',
      'Authority identification',
      'Automatic CRM actions'
    ]
  },
  {
    icon: Activity,
    title: 'Real-Time Analytics',
    description:
      'Comprehensive campaign monitoring with call outcomes, lead insights, and team performance metrics',
    highlight: 'Live dashboard updates',
    details: [
      'Campaign performance tracking',
      'Cost analytics per campaign',
      'Lead qualification insights',
      'Team collaboration metrics'
    ]
  },
  {
    icon: Webhook,
    title: 'Enterprise Integrations',
    description:
      'Seamless integration with Supabase, webhooks, and your existing tech stack',
    highlight: 'API-first architecture',
    details: [
      'Advanced voice platform',
      'Webhook event processing',
      'CSV import/export',
      'Authentication'
    ]
  },
];

const stats = [
  { number: '340%', label: 'More Qualified Leads', icon: TrendingUp },
  { number: '5 Min', label: 'Setup Time', icon: Clock },
  { number: '24/7', label: 'Never Stops', icon: Shield },
  { number: '2,500+', label: 'Happy Businesses', icon: Users },
];

export function Landing() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { isSignedIn } = useAuth();
  const { userContext } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // If user is signed in, redirect to appropriate dashboard
  useEffect(() => {
    if (isSignedIn) {
      // Check if user is platform owner
      if (userContext?.role === 'Platform Owner' || userContext?.role === 'platform_owner') {
        navigate('/platform');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isSignedIn, userContext, navigate]);

  const handleGetStarted = () => {
    if (isSignedIn) {
      // Check if user is platform owner
      if (userContext?.role === 'Platform Owner' || userContext?.role === 'platform_owner') {
        navigate('/platform');
      } else {
        navigate('/dashboard');
      }
    } else {
      // Redirect to signup page for new users
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-white to-blue-400 bg-clip-text text-xl font-bold text-transparent">
                Artificial Media
              </span>
            </div>

            <div className="hidden items-center space-x-8 md:flex">
              <a href="#features" className="text-slate-300 transition-colors hover:text-blue-400">
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-slate-300 transition-colors hover:text-blue-400"
              >
                How It Works
              </a>
              <a
                href="#testimonials"
                className="text-slate-300 transition-colors hover:text-blue-400"
              >
                Success Stories
              </a>

              {!isSignedIn ? (
                <>
                  <button
                    className="text-slate-300 transition-colors hover:text-blue-400"
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                  >
                    Start Free Trial
                  </button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    // Check if user is platform owner
                    if (
                      userContext?.role === 'Platform Owner' ||
                      userContext?.role === 'platform_owner'
                    ) {
                      navigate('/platform');
                    } else {
                      navigate('/dashboard');
                    }
                  }}
                  className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
                >
                  Go to Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pb-20 pt-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-slate-900/20" />
          <div
            className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl"
            style={{ transform: `translateY(${scrollY * -0.2}px)` }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 text-center">
            {/* Trust Indicator */}
            <div className="mb-8 flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-current text-yellow-400" />
                ))}
              </div>
              <span className="text-slate-300">Trusted by 2,500+ businesses</span>
              <Badge className="border-green-500/30 bg-green-500/20 text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />
                340% ROI Average
              </Badge>
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl font-bold leading-tight md:text-7xl">
                <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  Transform Your Sales with
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  AI Voice Automation
                </span>
              </h1>

              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-slate-300 md:text-2xl">
                Complete campaign automation, intelligent lead qualification, and 24/7 AI calling - 
                all managed from one powerful platform. <span className="font-semibold text-blue-400">340% more qualified leads</span>{' '}
                with enterprise-grade automation.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                onClick={handleGetStarted}
                className="transform rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl"
              >
                Start Free 14-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsVideoModalOpen(true)}
                className="rounded-xl border-slate-600 px-8 py-4 text-lg font-semibold text-slate-300 transition-all duration-200 hover:bg-slate-800"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch 2-Min Demo
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="mt-12 border-t border-slate-700/50 pt-8">
              <p className="mb-6 text-sm text-slate-400">
                No credit card required • Setup in 5 minutes • Cancel anytime
              </p>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="mb-2 flex items-center justify-center">
                      <stat.icon className="mr-2 h-6 w-6 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white md:text-3xl">{stat.number}</div>
                    <div className="text-sm text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Call Demo */}
      <section className="bg-slate-800/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">See Trinity AI in Action</h2>
            <p className="text-lg text-slate-300">Watch how our AI qualifies leads in real-time</p>
          </div>

          <div className="mx-auto max-w-4xl">
            <Card className="overflow-hidden border-slate-700 bg-slate-900/50">
              <CardContent className="p-0">
                {/* Live Call Interface */}
                <div className="border-b border-slate-700 bg-gradient-to-r from-green-500/20 to-blue-500/20 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-3 w-3 animate-pulse rounded-full bg-green-400"></div>
                      <span className="font-medium text-green-400">AI Qualification in Progress</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                      <span className="text-sm font-medium text-white">AI</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white">
                        "Hi John, I noticed you downloaded our guide on sales automation. I'm calling to see
                        if you're still looking to improve your outbound calling results?"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300">
                        "Yes, we're actually struggling with our cold calling team. We make about 500 calls
                        per day but our conversion rate is only 2%..."
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-slate-800/50 p-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">2:34</div>
                      <div className="text-sm text-slate-400">Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">Positive</div>
                      <div className="text-sm text-slate-400">Sentiment</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">85/100</div>
                      <div className="text-sm text-slate-400">Lead Score</div>
                    </div>
                  </div>

                  <div className="mt-4 space-x-2">
                    <Badge className="bg-green-500/20 text-green-400">Budget: Qualified</Badge>
                    <Badge className="bg-blue-500/20 text-blue-400">Authority: Decision Maker</Badge>
                    <Badge className="bg-purple-500/20 text-purple-400">Timeline: This Quarter</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Enterprise-Grade AI Sales Automation
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">
              Complete campaign automation with intelligent lead qualification, powered by
              cutting-edge AI technology and enterprise integrations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group border-slate-700 bg-slate-800/50 transition-all duration-200 hover:bg-slate-800/70"
              >
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 transition-transform duration-200 group-hover:scale-110">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                      <p className="mb-3 text-slate-300">{feature.description}</p>
                      <Badge className="mb-3 bg-blue-500/20 text-blue-400">{feature.highlight}</Badge>
                      {feature.details && (
                        <ul className="space-y-1 text-sm text-slate-400">
                          {feature.details.map((detail, idx) => (
                            <li key={idx} className="flex items-center">
                              <CheckCircle className="mr-2 h-3 w-3 text-green-400" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-slate-800/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">How Our AI Automation Works</h2>
            <p className="text-lg text-slate-300">
              From campaign creation to qualified leads in your CRM
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              {
                step: '1',
                title: 'Create Campaign',
                description:
                  'Set up your campaign with working hours, phone numbers, and retry logic. Upload contacts via CSV.',
                icon: Settings,
              },
              {
                step: '2',
                title: 'AI Starts Calling',
                description:
                  'Our automation engine runs every minute, respecting time zones and business hours automatically.',
                icon: Phone,
              },
              {
                step: '3',
                title: 'Qualify Leads',
                description:
                  'AI extracts 22+ qualification fields, scores leads 0-100, and triggers CRM actions instantly.',
                icon: Target,
              },
              {
                step: '4',
                title: 'Review & Close',
                description:
                  'Hot leads appear in your dashboard. Focus on closing while AI handles the qualifying.',
                icon: TrendingUp,
              },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <div className="mb-2 text-2xl font-bold text-blue-400">Step {step.step}</div>
                <h3 className="mb-3 text-xl font-semibold text-white">{step.title}</h3>
                <p className="text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Qualification Fields Showcase */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">AI That Knows What to Ask</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">
              22 preset qualification fields across 9 categories, plus unlimited custom fields.
              Our AI extracts the data that matters for your sales process.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                category: 'Appointment Readiness',
                icon: Calendar,
                fields: ['Meeting Interest', 'Preferred Time', 'Calendar Availability'],
                color: 'from-green-500 to-emerald-600'
              },
              {
                category: 'Budget & Authority',
                icon: DollarSign,
                fields: ['Budget Range', 'Decision Maker', 'Approval Process'],
                color: 'from-blue-500 to-cyan-600'
              },
              {
                category: 'Timeline & Urgency',
                icon: Clock,
                fields: ['Purchase Timeline', 'Current Solution', 'Pain Points'],
                color: 'from-purple-500 to-pink-600'
              },
              {
                category: 'Company Details',
                icon: Building,
                fields: ['Company Size', 'Industry', 'Department'],
                color: 'from-orange-500 to-red-600'
              },
              {
                category: 'Contact Information',
                icon: UserCheck,
                fields: ['Email Confirmation', 'Best Contact Time', 'Preferred Channel'],
                color: 'from-teal-500 to-blue-600'
              },
              {
                category: 'Interest Level',
                icon: Target,
                fields: ['Product Interest', 'Feature Requirements', 'Use Case'],
                color: 'from-indigo-500 to-purple-600'
              },
            ].map((category, index) => (
              <Card key={index} className="border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r ${category.color}`}>
                      <category.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg text-white">{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.fields.map((field, idx) => (
                      <li key={idx} className="flex items-center text-sm text-slate-300">
                        <CheckSquare className="mr-2 h-4 w-4 text-green-400" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="mb-4 text-slate-300">Plus custom fields specific to your business needs</p>
            <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400">
              <Sparkles className="mr-1 h-4 w-4" />
              AI automatically detects and extracts all fields during conversations
            </Badge>
          </div>
        </div>
      </section>

      {/* Platform Views Section */}
      <section className="bg-slate-800/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Powerful Platform Views</h2>
            <p className="text-lg text-slate-300">
              Everything you need to manage campaigns, track performance, and close deals
            </p>
          </div>

          <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800">
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-slate-700">Campaign Dashboard</TabsTrigger>
              <TabsTrigger value="qualification" className="data-[state=active]:bg-slate-700">Lead Qualification</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">Analytics</TabsTrigger>
              <TabsTrigger value="team" className="data-[state=active]:bg-slate-700">Team Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="campaigns" className="mt-6">
              <Card className="border-slate-700 bg-slate-900/50">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Active Campaigns</h3>
                    <Badge className="bg-green-500/20 text-green-400">Live</Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-slate-800/50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium text-white">Trinity AI Credits</span>
                        <span className="text-sm text-slate-400">150 available</span>
                      </div>
                      <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-700">
                        <div className="h-full w-[49%] bg-gradient-to-r from-blue-500 to-purple-600" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">342 Qualified Leads</span>
                        <span className="text-slate-400">Running 9am-5pm EST</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="qualification" className="mt-6">
              <Card className="border-slate-700 bg-slate-900/50">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-xl font-semibold text-white">Lead Review Queue</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'John Smith', score: 92, company: 'TechCorp', status: 'Hot Lead' },
                      { name: 'Sarah Johnson', score: 85, company: 'StartupXYZ', status: 'Qualified' },
                      { name: 'Mike Chen', score: 78, company: 'Digital Pro', status: 'Interested' },
                    ].map((lead, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                        <div>
                          <p className="font-medium text-white">{lead.name}</p>
                          <p className="text-sm text-slate-400">{lead.company}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={`${
                            lead.score >= 90 ? 'bg-green-500/20 text-green-400' : 
                            lead.score >= 80 ? 'bg-blue-500/20 text-blue-400' : 
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            Score: {lead.score}/100
                          </Badge>
                          <Badge variant="outline">{lead.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-6">
              <Card className="border-slate-700 bg-slate-900/50">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-xl font-semibold text-white">Campaign Performance</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                      <BarChart3 className="mx-auto mb-2 h-8 w-8 text-blue-400" />
                      <p className="text-2xl font-bold text-white">12,543</p>
                      <p className="text-sm text-slate-400">Total Calls</p>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                      <Target className="mx-auto mb-2 h-8 w-8 text-green-400" />
                      <p className="text-2xl font-bold text-white">1,247</p>
                      <p className="text-sm text-slate-400">Qualified Leads</p>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                      <TrendingUp className="mx-auto mb-2 h-8 w-8 text-purple-400" />
                      <p className="text-2xl font-bold text-white">9.9%</p>
                      <p className="text-sm text-slate-400">Conversion Rate</p>
                    </div>
                    <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                      <DollarSign className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
                      <p className="text-2xl font-bold text-white">$0.42</p>
                      <p className="text-sm text-slate-400">Cost per Lead</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="team" className="mt-6">
              <Card className="border-slate-700 bg-slate-900/50">
                <CardContent className="p-6">
                  <h3 className="mb-4 text-xl font-semibold text-white">Team Performance</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Sales Team A', campaigns: 3, leads: 423, performance: '+12%' },
                      { name: 'Sales Team B', campaigns: 2, leads: 312, performance: '+8%' },
                      { name: 'Sales Team C', campaigns: 4, leads: 567, performance: '+15%' },
                    ].map((team, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                        <div>
                          <p className="font-medium text-white">{team.name}</p>
                          <p className="text-sm text-slate-400">{team.campaigns} active campaigns</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-white">{team.leads}</p>
                            <p className="text-sm text-slate-400">Leads Generated</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">
                            {team.performance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Success Stories</h2>
            <p className="text-lg text-slate-300">
              See how businesses are transforming their sales with Trinity AI
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-slate-700 bg-slate-800/50">
                <CardContent className="p-8">
                  <div className="mb-4 flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-6 italic text-slate-300">"{testimonial.quote}"</p>
                  <div className="border-t border-slate-700 pt-4">
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                    <div className="text-sm text-slate-400">{testimonial.company}</div>
                    <Badge className="mt-2 bg-green-500/20 text-green-400">
                      {testimonial.results}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Enterprise-Ready Features</h2>
            <p className="text-lg text-slate-300">
              Built for scale, security, and compliance from day one
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Globe,
                title: 'Time Zone Intelligence',
                description: 'Automatically respects contact time zones and business hours across the globe',
                features: ['DST aware', 'Holiday detection', 'Working hours enforcement']
              },
              {
                icon: RefreshCw,
                title: 'Smart Retry Logic',
                description: 'Intelligent retry strategies based on call outcomes and lead behavior',
                features: ['No answer retry', 'Busy signal handling', 'Custom retry intervals']
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                description: 'Bank-level security with complete data isolation and encryption',
                features: ['SOC 2 compliant', 'GDPR ready', 'Role-based access']
              },
              {
                icon: Webhook,
                title: 'Real-time Webhooks',
                description: 'Instant notifications for every call event and lead update',
                features: ['Call started/ended', 'Lead qualified', 'Custom events']
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Built for teams with role management and performance tracking',
                features: ['Multi-tenant', 'Team analytics', 'Permission controls']
              },
              {
                icon: Database,
                title: 'Data Management',
                description: 'Powerful data handling with import, export, and backup capabilities',
                features: ['CSV import/export', 'API access', 'Automated backups']
              },
            ].map((feature, index) => (
              <Card key={index} className="border-slate-700 bg-slate-800/50">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-600">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mb-4 text-sm text-slate-300">{feature.description}</p>
                  <ul className="space-y-1">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-slate-400">
                        <CheckCircle className="mr-2 h-3 w-3 text-green-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to Transform Your Sales?</h2>
          <p className="mb-8 text-lg text-slate-300">
            Join 2,500+ businesses using Artificial Media to automate their sales calls,
            qualify leads intelligently, and close more deals.
          </p>

          <Button
            onClick={handleGetStarted}
            className="transform rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl"
          >
            Start Your Free 14-Day Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="mt-4 text-sm text-slate-400">
            No credit card required • 5-minute setup • 14-day free trial • Cancel anytime
          </p>
          
          <div className="mt-8 flex items-center justify-center space-x-8">
            <div className="flex items-center text-slate-300">
              <Shield className="mr-2 h-5 w-5 text-green-400" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center text-slate-300">
              <Clock className="mr-2 h-5 w-5 text-blue-400" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center text-slate-300">
              <Globe className="mr-2 h-5 w-5 text-purple-400" />
              <span>Global Coverage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Artificial Media</span>
            </div>
            <div className="text-sm text-slate-400">
              © 2025 Artificial Media. All rights reserved. | <a href="https://artificialmedia.co.uk" className="text-blue-400 hover:text-blue-300">artificialmedia.co.uk</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="relative aspect-video w-full max-w-4xl rounded-xl bg-slate-900">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute right-4 top-4 z-10 text-white hover:text-slate-300"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-white">Demo video would be embedded here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
