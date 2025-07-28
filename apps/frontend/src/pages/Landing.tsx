import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/auth';
import { useUserContext } from '../services/MinimalUserProvider';
import {
  ArrowRight,
  Play,
  CheckCircle,
  Star,
  Phone,
  Zap,
  BarChart3,
  Shield,
  Clock,
  Target,
  TrendingUp,
  Users,
  Award,
  ChevronDown,
  ArrowUp,
  Brain,
  Mic,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Social proof data
const testimonials = [
  {
    name: 'Sarah Johnson',
    company: 'TechCorp Solutions',
    role: 'VP of Sales',
    quote:
      "Apex increased our lead qualification rate by 340% in the first month. The AI conversations are so natural, prospects don't even realize they're talking to a bot.",
    results: '340% increase in qualified leads',
  },
  {
    name: 'Michael Chen',
    company: 'Digital Marketing Pro',
    role: 'Agency Owner',
    quote:
      'We went from manually calling leads to having AI handle 1000+ calls per day. Our clients are seeing 5x better results than traditional cold calling.',
    results: '5x better conversion rates',
  },
  {
    name: 'Emma Rodriguez',
    company: 'Real Estate Masters',
    role: 'Team Lead',
    quote:
      'The setup took literally 3 minutes. Now our AI assistant books appointments 24/7 while we focus on closing deals.',
    results: '24/7 automated booking',
  },
];

const features = [
  {
    icon: Brain,
    title: 'AI Intelligence Center',
    description:
      'Advanced AI director that routes calls, predicts outcomes, and provides real-time coaching',
    highlight: '94% routing accuracy',
  },
  {
    icon: Mic,
    title: 'Human-Like Conversations',
    description: 'Ultra-realistic voices with natural conversation flow that converts 3x better',
    highlight: 'Indistinguishable from humans',
  },
  {
    icon: Activity,
    title: 'Real-Time Analytics',
    description:
      'Live call monitoring with buying signal detection and instant performance insights',
    highlight: '89% prediction accuracy',
  },
  {
    icon: Sparkles,
    title: 'A/B Testing Engine',
    description:
      'Automatically tests scripts, voices, and timing to optimize your conversion rates',
    highlight: '+27% average improvement',
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
                Apex AI Calling
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
                  AI That Makes
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Every Call Count
                </span>
              </h1>

              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-slate-300 md:text-2xl">
                Replace your entire cold calling team with AI that never gets tired, never has bad
                days, and converts <span className="font-semibold text-blue-400">3x better</span>{' '}
                than human callers.
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
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">See Apex AI in Action</h2>
            <p className="text-lg text-slate-300">Watch a live call happen right now</p>
          </div>

          <div className="mx-auto max-w-4xl">
            <Card className="overflow-hidden border-slate-700 bg-slate-900/50">
              <CardContent className="p-0">
                {/* Live Call Interface */}
                <div className="border-b border-slate-700 bg-gradient-to-r from-green-500/20 to-blue-500/20 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-3 w-3 animate-pulse rounded-full bg-green-400"></div>
                      <span className="font-medium text-green-400">Live Call in Progress</span>
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
                        "Hi John, I'm calling from TechCorp about your recent inquiry. Do you have 2
                        minutes to discuss how we can save you 40% on your current software costs?"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300">
                        "Yes, I'm interested. We're currently spending $5000/month and looking to
                        reduce costs..."
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

                  <div className="mt-4">
                    <Badge className="bg-green-500/20 text-green-400">Appointment Booked</Badge>
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
              Enterprise-Grade AI Intelligence
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">
              Powered by breakthrough AI technology that makes every call smarter, more effective,
              and more profitable.
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
                      <Badge className="bg-blue-500/20 text-blue-400">{feature.highlight}</Badge>
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
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Get Started in 3 Simple Steps</h2>
            <p className="text-lg text-slate-300">
              From signup to your first AI call in under 5 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Upload Your Leads',
                description:
                  'Import your lead list via CSV or connect your CRM. Our AI instantly analyzes and prioritizes them.',
                icon: Users,
              },
              {
                step: '2',
                title: 'Customize Your AI',
                description:
                  'Choose your voice, script, and goals. Our AI learns your brand and talking points in seconds.',
                icon: Brain,
              },
              {
                step: '3',
                title: 'Watch Results Pour In',
                description:
                  'Your AI starts calling immediately. Watch live as appointments get booked and deals get qualified.',
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

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Success Stories</h2>
            <p className="text-lg text-slate-300">
              See how businesses are transforming their sales with Apex AI
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

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to 3x Your Sales Results?</h2>
          <p className="mb-8 text-lg text-slate-300">
            Join 2,500+ businesses already using Apex AI to automate their sales calls and book more
            appointments.
          </p>

          <Button
            onClick={handleGetStarted}
            className="transform rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl"
          >
            Start Your Free 14-Day Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="mt-4 text-sm text-slate-400">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
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
              <span className="text-lg font-bold text-white">Apex AI Calling</span>
            </div>
            <div className="text-sm text-slate-400">
              © 2025 Apex AI Calling. All rights reserved.
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
