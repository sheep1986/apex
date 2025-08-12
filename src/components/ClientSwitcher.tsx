import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Building2,
  Users,
  Crown,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Activity,
  Globe,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface ClientAccount {
  id: string;
  name: string;
  domain: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  monthlyRevenue: number;
  lastLogin: string;
  users: number;
  campaigns: number;
  calls: number;
  industry: string;
  setupDate: string;
}

export default function ClientSwitcher() {
  const [selectedClient, setSelectedClient] = useState<string>('artificial-media');

  // Mock client data - in production this comes from your database
  const clients: ClientAccount[] = [
    {
      id: 'artificial-media',
      name: 'Artificial Media',
      domain: 'artificial-media.com',
      plan: 'professional',
      status: 'active',
      monthlyRevenue: 599,
      lastLogin: '2024-01-20',
      users: 3,
      campaigns: 5,
      calls: 1247,
      industry: 'Marketing Agency',
      setupDate: '2024-01-15',
    },
    {
      id: 'techcorp-solutions',
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      plan: 'enterprise',
      status: 'active',
      monthlyRevenue: 1299,
      lastLogin: '2024-01-19',
      users: 8,
      campaigns: 12,
      calls: 3456,
      industry: 'Technology',
      setupDate: '2024-01-10',
    },
    {
      id: 'growth-marketing',
      name: 'Growth Marketing Co',
      domain: 'growthmarketing.co',
      plan: 'starter',
      status: 'trial',
      monthlyRevenue: 0,
      lastLogin: '2024-01-18',
      users: 2,
      campaigns: 2,
      calls: 234,
      industry: 'Marketing',
      setupDate: '2024-01-18',
    },
    {
      id: 'local-fitness',
      name: 'Local Fitness Centers',
      domain: 'localfitness.com',
      plan: 'professional',
      status: 'active',
      monthlyRevenue: 599,
      lastLogin: '2024-01-17',
      users: 4,
      campaigns: 7,
      calls: 892,
      industry: 'Fitness',
      setupDate: '2024-01-05',
    },
  ];

  const currentClient = clients.find((c) => c.id === selectedClient);
  const totalRevenue = clients
    .filter((c) => c.status === 'active')
    .reduce((sum, c) => sum + c.monthlyRevenue, 0);

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'starter':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'professional':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'enterprise':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'trial':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'suspended':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const switchToClient = (clientId: string) => {
    setSelectedClient(clientId);
    // In production, this would:
    // 1. Update the user's session
    // 2. Redirect to client dashboard
    // 3. Load client-specific data
    console.log(`Switching to client: ${clientId}`);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-semibold text-white">
              <Crown className="h-8 w-8 text-emerald-500" />
              Multi-Tenant Platform Demo
            </h1>
            <p className="mt-1 text-gray-400">One platform serving multiple clients</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
              {clients.length} Active Clients
            </Badge>
            <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
              ${totalRevenue.toLocaleString()}/month Revenue
            </Badge>
          </div>
        </div>

        {/* Platform Owner Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Clients</p>
                  <p className="text-2xl font-semibold text-white">{clients.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Monthly Revenue</p>
                  <p className="text-2xl font-semibold text-white">
                    ${totalRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Users</p>
                  <p className="text-2xl font-semibold text-white">
                    {clients.reduce((sum, c) => sum + c.users, 0)}
                  </p>
                </div>
                <Users className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Calls</p>
                  <p className="text-2xl font-semibold text-white">
                    {clients.reduce((sum, c) => sum + c.calls, 0).toLocaleString()}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Client List */}
          <div className="lg:col-span-1">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Client Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => switchToClient(client.id)}
                    className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                      selectedClient === client.id
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white">{client.name}</h4>
                        <p className="text-xs text-gray-400">{client.domain}</p>
                        <p className="text-xs text-gray-500">{client.industry}</p>
                      </div>
                      <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={getPlanColor(client.plan)}>{client.plan}</Badge>
                      <span className="text-sm font-medium text-emerald-400">
                        ${client.monthlyRevenue}/mo
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Selected Client Details */}
          <div className="lg:col-span-2">
            {currentClient ? (
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-white">
                      <Building2 className="h-6 w-6 text-emerald-500" />
                      {currentClient.name}
                    </CardTitle>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Access Dashboard
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Client Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Domain</p>
                      <p className="flex items-center gap-2 text-white">
                        <Globe className="h-4 w-4" />
                        {currentClient.domain}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Industry</p>
                      <p className="text-white">{currentClient.industry}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Setup Date</p>
                      <p className="text-white">
                        {new Date(currentClient.setupDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Last Login</p>
                      <p className="text-white">
                        {new Date(currentClient.lastLogin).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Usage Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-gray-800 p-4">
                      <p className="text-2xl font-semibold text-white">{currentClient.users}</p>
                      <p className="text-sm text-gray-400">Users</p>
                    </div>
                    <div className="rounded-lg bg-gray-800 p-4">
                      <p className="text-2xl font-semibold text-white">{currentClient.campaigns}</p>
                      <p className="text-sm text-gray-400">Campaigns</p>
                    </div>
                    <div className="rounded-lg bg-gray-800 p-4">
                      <p className="text-2xl font-semibold text-white">
                        {currentClient.calls.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">Total Calls</p>
                    </div>
                  </div>

                  {/* Data Isolation Demo */}
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                    <h4 className="mb-2 flex items-center gap-2 font-medium text-blue-400">
                      <Lock className="h-4 w-4" />
                      Data Isolation
                    </h4>
                    <p className="text-sm text-gray-300">
                      This client can only see their own data:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-400">
                      <li>• Database queries filtered by client_id: '{currentClient.id}'</li>
                      <li>• API endpoints scoped to this organization</li>
                      <li>• No access to other clients' campaigns or calls</li>
                      <li>• Isolated billing and user management</li>
                    </ul>
                  </div>

                  {/* Revenue Info */}
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <h4 className="mb-2 flex items-center gap-2 font-medium text-emerald-400">
                      <DollarSign className="h-4 w-4" />
                      Revenue Impact
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Monthly Revenue</p>
                        <p className="font-semibold text-white">${currentClient.monthlyRevenue}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Annual Value</p>
                        <p className="font-semibold text-white">
                          ${(currentClient.monthlyRevenue * 12).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex h-96 items-center justify-center border-gray-800 bg-gray-900">
                <div className="text-center">
                  <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                  <h3 className="mb-2 text-xl font-semibold text-white">Select a Client</h3>
                  <p className="text-gray-400">Choose a client account to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Architecture Explanation */}
        <Card className="border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="text-white">How Multi-Tenant Architecture Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Globe className="h-8 w-8 text-emerald-500" />
                </div>
                <h4 className="mb-2 font-semibold text-white">Single Platform</h4>
                <p className="text-sm text-gray-400">
                  One Apex instance serves all clients from the same codebase and infrastructure
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-500/20">
                  <Lock className="h-8 w-8 text-emerald-500" />
                </div>
                <h4 className="mb-2 font-semibold text-white">Data Isolation</h4>
                <p className="text-sm text-gray-400">
                  Each client's data is completely isolated and secure from other clients
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-blue-500/20">
                  <Crown className="h-8 w-8 text-blue-500" />
                </div>
                <h4 className="mb-2 font-semibold text-white">Centralized Control</h4>
                <p className="text-sm text-gray-400">
                  You manage all clients from one dashboard with full administrative access
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
