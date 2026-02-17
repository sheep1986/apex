import {
    AlertTriangle,
    CheckCircle,
    Clock,
    CloudRain,
    Database,
    DollarSign,
    Rocket,
    Server,
    Shield,
    Target,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface ScalingMetrics {
  clients: number;
  monthlyRevenue: number;
  annualRevenue: number;
  infrastructureCost: number;
  profitMargin: number;
  supportTickets: number;
  serverLoad: number;
  responseTime: number;
}

export default function ScaleArchitecture() {
  const [selectedScale, setSelectedScale] = useState<'current' | 'growth' | 'enterprise'>(
    'enterprise'
  );

  const scalingData = {
    current: {
      clients: 5,
      monthlyRevenue: 2995,
      annualRevenue: 35940,
      infrastructureCost: 150,
      profitMargin: 95,
      supportTickets: 25,
      serverLoad: 15,
      responseTime: 180,
    },
    growth: {
      clients: 50,
      monthlyRevenue: 29950,
      annualRevenue: 359400,
      infrastructureCost: 2500,
      profitMargin: 92,
      supportTickets: 150,
      serverLoad: 45,
      responseTime: 220,
    },
    enterprise: {
      clients: 500,
      monthlyRevenue: 324750, // Average $649.50 per client
      annualRevenue: 3897000,
      infrastructureCost: 15000,
      profitMargin: 85,
      supportTickets: 1200,
      serverLoad: 75,
      responseTime: 150,
    },
  };

  const currentMetrics = scalingData[selectedScale];

  const infrastructureComponents = [
    {
      name: 'Load Balancers',
      current: '$50/month',
      growth: '$200/month',
      enterprise: '$800/month',
      description: 'Distribute traffic across multiple servers',
    },
    {
      name: 'Database Cluster',
      current: '$100/month',
      growth: '$800/month',
      enterprise: '$4,000/month',
      description: 'Sharded PostgreSQL with read replicas',
    },
    {
      name: 'Application Servers',
      current: '$150/month',
      growth: '$800/month',
      enterprise: '$6,000/month',
      description: 'Auto-scaling Node.js containers',
    },
    {
      name: 'CDN & Storage',
      current: '$30/month',
      growth: '$200/month',
      enterprise: '$1,500/month',
      description: 'Global content delivery network',
    },
    {
      name: 'Monitoring & Logs',
      current: '$20/month',
      growth: '$150/month',
      enterprise: '$800/month',
      description: 'Real-time monitoring and alerting',
    },
    {
      name: 'Security & Compliance',
      current: '$50/month',
      growth: '$350/month',
      enterprise: '$1,900/month',
      description: 'WAF, DDoS protection, SOC 2',
    },
  ];

  const teamScaling = [
    {
      role: 'Support Team',
      current: 1,
      growth: 3,
      enterprise: 12,
      salary: 60000,
      description: '24/7 customer support coverage',
    },
    {
      role: 'DevOps Engineers',
      current: 0,
      growth: 1,
      enterprise: 3,
      salary: 140000,
      description: 'Infrastructure and deployment management',
    },
    {
      role: 'Backend Developers',
      current: 1,
      growth: 2,
      enterprise: 5,
      salary: 120000,
      description: 'Platform development and optimization',
    },
    {
      role: 'Sales Team',
      current: 0,
      growth: 2,
      enterprise: 8,
      salary: 80000,
      description: 'Client acquisition and account management',
    },
    {
      role: 'Customer Success',
      current: 0,
      growth: 1,
      enterprise: 4,
      salary: 75000,
      description: 'Client onboarding and retention',
    },
  ];

  const revenueBreakdown = [
    {
      plan: 'Starter',
      price: 299,
      clients: Math.floor(currentMetrics.clients * 0.4),
      total: Math.floor(currentMetrics.clients * 0.4) * 299,
    },
    {
      plan: 'Professional',
      price: 599,
      clients: Math.floor(currentMetrics.clients * 0.4),
      total: Math.floor(currentMetrics.clients * 0.4) * 599,
    },
    {
      plan: 'Enterprise',
      price: 1299,
      clients: Math.floor(currentMetrics.clients * 0.2),
      total: Math.floor(currentMetrics.clients * 0.2) * 1299,
    },
  ];

  return (
    <div className="min-h-screen bg-black p-4 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-semibold text-white lg:text-3xl">
              <Rocket className="h-6 w-6 text-emerald-500 lg:h-8 lg:w-8" />
              Scale Architecture: 500+ Clients
            </h1>
            <p className="mt-1 text-gray-400">Enterprise-grade infrastructure for massive scale</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            <Button
              variant={selectedScale === 'current' ? 'default' : 'outline'}
              onClick={() => setSelectedScale('current')}
              className={`text-sm ${selectedScale === 'current' ? 'bg-emerald-600' : ''}`}
              size="sm"
            >
              Current (5)
            </Button>
            <Button
              variant={selectedScale === 'growth' ? 'default' : 'outline'}
              onClick={() => setSelectedScale('growth')}
              className={`text-sm ${selectedScale === 'growth' ? 'bg-emerald-600' : ''}`}
              size="sm"
            >
              Growth (50)
            </Button>
            <Button
              variant={selectedScale === 'enterprise' ? 'default' : 'outline'}
              onClick={() => setSelectedScale('enterprise')}
              className={`text-sm ${selectedScale === 'enterprise' ? 'bg-emerald-600' : ''}`}
              size="sm"
            >
              Enterprise (500+)
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-400">Monthly Revenue</p>
                  <p className="text-xl font-semibold text-white lg:text-2xl">
                    ${currentMetrics.monthlyRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-400">
                    ${(currentMetrics.monthlyRevenue / currentMetrics.clients).toFixed(0)} per
                    client
                  </p>
                </div>
                <DollarSign className="h-6 w-6 flex-shrink-0 text-green-500 lg:h-8 lg:w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-400">Annual Revenue</p>
                  <p className="text-xl font-semibold text-white lg:text-2xl">
                    ${(currentMetrics.annualRevenue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-emerald-400">
                    {currentMetrics.profitMargin}% profit margin
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 flex-shrink-0 text-emerald-500 lg:h-8 lg:w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-400">Infrastructure Cost</p>
                  <p className="text-xl font-semibold text-white lg:text-2xl">
                    ${currentMetrics.infrastructureCost.toLocaleString()}
                  </p>
                  <p className="text-xs text-orange-400">
                    ${(currentMetrics.infrastructureCost / currentMetrics.clients).toFixed(0)} per
                    client
                  </p>
                </div>
                <Server className="h-6 w-6 flex-shrink-0 text-blue-500 lg:h-8 lg:w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-400">Monthly Profit</p>
                  <p className="text-xl font-semibold text-white lg:text-2xl">
                    $
                    {(
                      (currentMetrics.monthlyRevenue - currentMetrics.infrastructureCost) /
                      1000
                    ).toFixed(0)}
                    K
                  </p>
                  <p className="text-xs text-emerald-400">After infrastructure costs</p>
                </div>
                <Target className="h-6 w-6 flex-shrink-0 text-emerald-500 lg:h-8 lg:w-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="infrastructure" className="space-y-4 lg:space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-5">
            <TabsTrigger value="infrastructure" className="text-xs lg:text-sm">
              Infrastructure
            </TabsTrigger>
            <TabsTrigger value="revenue" className="text-xs lg:text-sm">
              Revenue Model
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs lg:text-sm">
              Team Scaling
            </TabsTrigger>
            <TabsTrigger value="automation" className="text-xs lg:text-sm">
              Automation
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="text-xs lg:text-sm">
              Roadmap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="infrastructure" className="space-y-4 lg:space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-white lg:text-xl">
                  Infrastructure Components
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="space-y-3 lg:space-y-4">
                  {infrastructureComponents.map((component, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 rounded-lg bg-gray-800 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-white lg:text-base">
                          {component.name}
                        </h4>
                        <p className="mt-1 text-xs text-gray-400 lg:text-sm">
                          {component.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-left sm:text-right">
                        <p className="text-sm font-semibold text-emerald-400 lg:text-base">
                          {selectedScale === 'current' && component.current}
                          {selectedScale === 'growth' && component.growth}
                          {selectedScale === 'enterprise' && component.enterprise}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-white lg:text-lg">
                    <Database className="h-4 w-4 text-blue-500 lg:h-5 lg:w-5" />
                    Database Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Sharding</span>
                    <Badge
                      className={`text-xs ${selectedScale === 'enterprise' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                    >
                      {selectedScale === 'enterprise' ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Read Replicas</span>
                    <Badge
                      className={`text-xs ${selectedScale !== 'current' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                    >
                      {selectedScale !== 'current' ? 'Active' : 'Not Needed'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Connection Pooling</span>
                    <Badge className="bg-green-500/20 text-xs text-green-400">Required</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-white lg:text-lg">
                    <CloudRain className="h-4 w-4 text-emerald-500 lg:h-5 lg:w-5" />
                    Auto-Scaling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Horizontal Scaling</span>
                    <Badge
                      className={`text-xs ${selectedScale === 'enterprise' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
                    >
                      {selectedScale === 'enterprise' ? 'Essential' : 'Planned'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Load Balancing</span>
                    <Badge
                      className={`text-xs ${selectedScale !== 'current' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                    >
                      {selectedScale !== 'current' ? 'Active' : 'Future'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">CDN</span>
                    <Badge className="bg-green-500/20 text-xs text-green-400">Global</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base text-white lg:text-lg">
                    <Shield className="h-4 w-4 text-red-500 lg:h-5 lg:w-5" />
                    Security & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">SOC 2 Type II</span>
                    <Badge
                      className={`text-xs ${selectedScale === 'enterprise' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
                    >
                      {selectedScale === 'enterprise' ? 'Required' : 'In Progress'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">GDPR Compliance</span>
                    <Badge className="bg-green-500/20 text-xs text-green-400">Compliant</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">WAF & DDoS</span>
                    <Badge
                      className={`text-xs ${selectedScale !== 'current' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}
                    >
                      {selectedScale !== 'current' ? 'Protected' : 'Basic'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white lg:text-xl">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <div className="space-y-3 lg:space-y-4">
                    {revenueBreakdown.map((tier, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-gray-800 p-3 lg:p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-white lg:text-base">
                            {tier.plan}
                          </h4>
                          <p className="text-xs text-gray-400 lg:text-sm">{tier.clients} clients</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-sm font-semibold text-emerald-400 lg:text-base">
                            ${tier.total.toLocaleString()}/mo
                          </p>
                          <p className="text-xs text-gray-400">${tier.price}/client</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-white lg:text-xl">
                    Growth Projections
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <div className="space-y-3 lg:space-y-4">
                    <div className="rounded-lg bg-gray-800 p-3 lg:p-4">
                      <h4 className="text-sm font-medium text-white lg:text-base">Year 1 Target</h4>
                      <p className="text-xl font-semibold text-emerald-400 lg:text-2xl">
                        500 Clients
                      </p>
                      <p className="text-sm text-gray-400">$3.9M Annual Revenue</p>
                    </div>
                    <div className="rounded-lg bg-gray-800 p-3 lg:p-4">
                      <h4 className="text-sm font-medium text-white lg:text-base">
                        Year 2 Projection
                      </h4>
                      <p className="text-xl font-semibold text-emerald-400 lg:text-2xl">
                        1,200 Clients
                      </p>
                      <p className="text-sm text-gray-400">$9.4M Annual Revenue</p>
                    </div>
                    <div className="rounded-lg bg-gray-800 p-3 lg:p-4">
                      <h4 className="text-sm font-medium text-white lg:text-base">Year 3 Vision</h4>
                      <p className="text-xl font-semibold text-emerald-400 lg:text-2xl">
                        2,500 Clients
                      </p>
                      <p className="text-sm text-gray-400">$19.5M Annual Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Team Scaling Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamScaling.map((role, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-gray-800 p-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{role.role}</h4>
                        <p className="text-sm text-gray-400">{role.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-400">
                          {selectedScale === 'current' && role.current}
                          {selectedScale === 'growth' && role.growth}
                          {selectedScale === 'enterprise' && role.enterprise}
                          {' people'}
                        </p>
                        <p className="text-sm text-gray-400">
                          ${(role.salary / 1000).toFixed(0)}K avg salary
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Client Onboarding Automation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Self-service signup flow</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Automatic Voice Engine setup</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="text-gray-300">Guided assistant creation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="text-gray-300">Automated billing setup</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Support Automation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">AI chatbot for tier 1 support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-gray-300">Automatic ticket routing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="text-gray-300">Knowledge base integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="text-gray-300">Proactive issue detection</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Q1 2024 (0-50 Clients)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-300">Core platform launch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-300">Support ticketing system</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-300">Secure billing integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-300">Basic monitoring setup</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Q2-Q3 2024 (50-200 Clients)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-300">Database sharding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-300">Load balancer deployment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-300">Auto-scaling implementation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-300">Advanced monitoring</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Q4 2024 (200-500+ Clients)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-gray-300">Microservices architecture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-gray-300">Global CDN deployment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-gray-300">SOC 2 compliance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm text-gray-300">Enterprise white-labeling</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Items */}
        <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-blue-500/10">
          <CardHeader>
            <CardTitle className="text-white">🚀 Next Steps for 500+ Client Scale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-semibold text-emerald-400">
                  Immediate Actions (This Month)
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Deploy to production (Vercel + Supabase Pro)</li>
                  <li>• Implement secure billing automation</li>
                  <li>• Set up monitoring with DataDog/New Relic</li>
                  <li>• Create client onboarding automation</li>
                  <li>• Establish support ticket workflows</li>
                </ul>
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-blue-400">
                  Scale Preparation (Next 3 Months)
                </h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Design database sharding strategy</li>
                  <li>• Implement horizontal auto-scaling</li>
                  <li>• Hire DevOps engineer</li>
                  <li>• Build enterprise white-label features</li>
                  <li>• Start SOC 2 compliance process</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
