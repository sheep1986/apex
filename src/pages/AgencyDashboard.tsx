import {
    AlertCircle,
    ArrowUpRight,
    BarChart3,
    CheckCircle,
    Clock,
    Crown,
    DollarSign,
    Globe,
    Palette,
    Plus,
    Search,
    Settings,
    TrendingUp,
    UserPlus,
    Users,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useUserContext } from '../services/MinimalUserProvider';

interface Client {
  id: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
  monthlyRevenue: number;
  callVolume: number;
  status: 'active' | 'trial' | 'paused' | 'churned';
  joinDate: string;
  lastActivity: string;
  logo?: string;
  industry: string;
  contactEmail: string;
}

interface RevenueMetrics {
  totalMRR: number;
  newMRR: number;
  churnedMRR: number;
  averageRevenue: number;
  growthRate: number;
  clientLifetimeValue: number;
}

const AgencyDashboard: React.FC = () => {
  const { userContext } = useUserContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics>({
    totalMRR: 0,
    newMRR: 0,
    churnedMRR: 0,
    averageRevenue: 0,
    growthRate: 0,
    clientLifetimeValue: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Mock data - In production, this would come from your backend
  useEffect(() => {
    const mockClients: Client[] = [
      {
        id: '1',
        name: 'TechStart Solutions',
        plan: 'professional',
        monthlyRevenue: 599,
        callVolume: 2450,
        status: 'active',
        joinDate: '2024-01-15',
        lastActivity: '2024-01-18 14:30',
        industry: 'SaaS',
        contactEmail: 'sarah@techstart.com',
      },
      {
        id: '2',
        name: 'Local Home Services',
        plan: 'starter',
        monthlyRevenue: 299,
        callVolume: 890,
        status: 'active',
        joinDate: '2024-01-10',
        lastActivity: '2024-01-18 09:15',
        industry: 'Home Services',
        contactEmail: 'mike@localhome.com',
      },
      {
        id: '3',
        name: 'Enterprise Corp',
        plan: 'enterprise',
        monthlyRevenue: 1299,
        callVolume: 5200,
        status: 'active',
        joinDate: '2023-12-01',
        lastActivity: '2024-01-18 16:45',
        industry: 'Enterprise',
        contactEmail: 'jennifer@enterprise.com',
      },
      {
        id: '4',
        name: 'GrowthCo Marketing',
        plan: 'professional',
        monthlyRevenue: 599,
        callVolume: 1800,
        status: 'trial',
        joinDate: '2024-01-12',
        lastActivity: '2024-01-17 11:20',
        industry: 'Marketing',
        contactEmail: 'david@growthco.com',
      },
      {
        id: '5',
        name: 'RetailMax Store',
        plan: 'starter',
        monthlyRevenue: 299,
        callVolume: 650,
        status: 'paused',
        joinDate: '2023-11-20',
        lastActivity: '2024-01-10 08:30',
        industry: 'Retail',
        contactEmail: 'lisa@retailmax.com',
      },
    ];

    setClients(mockClients);

    // Calculate revenue metrics
    const activeClients = mockClients.filter((c) => c.status === 'active');
    const totalMRR = activeClients.reduce((sum, client) => sum + client.monthlyRevenue, 0);
    const newMRR = mockClients
      .filter((c) => c.status === 'active' && new Date(c.joinDate) > new Date('2024-01-01'))
      .reduce((sum, client) => sum + client.monthlyRevenue, 0);

    setRevenueMetrics({
      totalMRR,
      newMRR,
      churnedMRR: 299, // Mock churned MRR
      averageRevenue: totalMRR / activeClients.length,
      growthRate: 23.5, // Mock growth rate
      clientLifetimeValue: totalMRR * 24, // Mock LTV calculation
    });
  }, []);

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter':
        return 'bg-blue-100 text-blue-800';
      case 'professional':
        return 'bg-purple-100 text-emerald-800';
      case 'enterprise':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      case 'churned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'trial':
        return <Clock className="h-4 w-4" />;
      case 'paused':
        return <AlertCircle className="h-4 w-4" />;
      case 'churned':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlan === 'all' || client.plan === selectedPlan;
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="w-full space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Agency Command Center</h1>
            <p className="mt-2 text-gray-400">
              Welcome back, {userContext?.firstName || 'Agency Admin'}! Manage your client portfolio
              and track revenue performance.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => (window.location.href = '/client-onboarding')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Start Onboarding
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add New Client
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-gray-400">
                <DollarSign className="mr-2 h-4 w-4" />
                Total MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${revenueMetrics.totalMRR.toLocaleString()}
              </div>
              <div className="mt-1 flex items-center text-sm text-green-400">
                <TrendingUp className="mr-1 h-3 w-3" />+{revenueMetrics.growthRate}% from last month
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-gray-400">
                <Users className="mr-2 h-4 w-4" />
                Active Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {clients.filter((c) => c.status === 'active').length}
              </div>
              <div className="mt-1 flex items-center text-sm text-blue-400">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                {clients.filter((c) => c.status === 'trial').length} in trial
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-gray-400">
                <BarChart3 className="mr-2 h-4 w-4" />
                Avg Revenue/Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${Math.round(revenueMetrics.averageRevenue).toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-gray-400">Per month</div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm font-medium text-gray-400">
                <Zap className="mr-2 h-4 w-4" />
                Total Call Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {clients.reduce((sum, client) => sum + client.callVolume, 0).toLocaleString()}
              </div>
              <div className="mt-1 text-sm text-gray-400">This month</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="border-gray-800 bg-gray-900">
            <TabsTrigger value="clients" className="text-gray-300 data-[state=active]:text-white">
              Client Management
            </TabsTrigger>
            <TabsTrigger value="revenue" className="text-gray-300 data-[state=active]:text-white">
              Revenue Analytics
            </TabsTrigger>
            <TabsTrigger value="branding" className="text-gray-300 data-[state=active]:text-white">
              White-Label Controls
            </TabsTrigger>
          </TabsList>

          {/* Client Management Tab */}
          <TabsContent value="clients" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-gray-700 bg-gray-900 pl-10 text-white"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                >
                  <option value="all">All Plans</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="paused">Paused</option>
                  <option value="churned">Churned</option>
                </select>
              </div>
            </div>

            {/* Client List */}
            <div className="grid gap-4">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="border-gray-800 bg-gray-900 transition-colors hover:border-gray-700"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={client.logo} />
                          <AvatarFallback className="bg-gray-800 text-white">
                            {client.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-white">{client.name}</h3>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="secondary" className={getPlanColor(client.plan)}>
                              {client.plan === 'starter' && <Zap className="mr-1 h-3 w-3" />}
                              {client.plan === 'professional' && <Crown className="mr-1 h-3 w-3" />}
                              {client.plan === 'enterprise' && <Globe className="mr-1 h-3 w-3" />}
                              {client.plan.charAt(0).toUpperCase() + client.plan.slice(1)}
                            </Badge>
                            <Badge variant="secondary" className={getStatusColor(client.status)}>
                              {getStatusIcon(client.status)}
                              <span className="ml-1">
                                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                        <div>
                          <div className="text-gray-400">Monthly Revenue</div>
                          <div className="font-semibold text-white">${client.monthlyRevenue}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Call Volume</div>
                          <div className="font-semibold text-white">
                            {client.callVolume.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Industry</div>
                          <div className="font-semibold text-white">{client.industry}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Join Date</div>
                          <div className="font-semibold text-white">
                            {new Date(client.joinDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          View Details
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Revenue Analytics Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Breakdown</CardTitle>
                  <CardDescription className="text-gray-400">
                    Monthly recurring revenue by plan type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Enterprise Plans</span>
                      <span className="font-semibold text-white">$1,299</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Professional Plans</span>
                      <span className="font-semibold text-white">$1,198</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Starter Plans</span>
                      <span className="font-semibold text-white">$598</span>
                    </div>
                    <Progress value={30} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Growth Metrics</CardTitle>
                  <CardDescription className="text-gray-400">
                    Key performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-green-400">+$899</div>
                      <div className="text-sm text-gray-400">New MRR</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-400">-$299</div>
                      <div className="text-sm text-gray-400">Churned MRR</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">
                        ${Math.round(revenueMetrics.clientLifetimeValue).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">Avg Client LTV</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-400">23.5%</div>
                      <div className="text-sm text-gray-400">Growth Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* White-Label Controls Tab */}
          <TabsContent value="branding" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Palette className="mr-2 h-5 w-5" />
                    Brand Customization
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Customize the platform appearance for your clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Agency Logo
                    </label>
                    <div className="rounded-lg border-2 border-dashed border-gray-700 p-6 text-center">
                      <div className="mb-2 text-gray-400">
                        <Palette className="mx-auto mb-2 h-8 w-8" />
                        Upload your logo
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                        Choose File
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Primary Color
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        defaultValue="#3B82F6"
                        className="h-10 w-16 border-gray-700 bg-gray-800"
                      />
                      <Input
                        defaultValue="#3B82F6"
                        className="border-gray-700 bg-gray-800 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Globe className="mr-2 h-5 w-5" />
                    Domain Settings
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure custom domains for client portals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Agency Domain
                    </label>
                    <Input
                      placeholder="yourcompany.trinity-labs.ai"
                      className="border-gray-700 bg-gray-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Client Portal Template
                    </label>
                    <select className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white">
                      <option>Professional Template</option>
                      <option>Modern Template</option>
                      <option>Minimalist Template</option>
                    </select>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Save Configuration
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgencyDashboard;
