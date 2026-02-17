import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Building,
  Users,
  Phone,
  DollarSign,
  Calendar,
  Mail,
  Star,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/services/supabase-client';

interface ClientOrg {
  id: string;
  name: string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
  status: string;
  subscription_plan?: string;
  subscription_mrr?: number;
  users_count?: number;
  campaigns_count?: number;
  total_calls?: number;
  created_at: string;
}

export function Clients() {
  const { organization } = useSupabaseAuth();
  const [clients, setClients] = useState<ClientOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (organization?.id) {
      loadClients();
    }
  }, [organization]);

  const loadClients = async () => {
    setLoading(true);
    try {
      // For agency view: fetch child organizations
      // If this is a platform owner, fetch all orgs
      // If agency, fetch orgs where parent_id = this org
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out current org (don't show self)
      const filtered = (data || []).filter(o => o.id !== organization?.id);
      setClients(filtered as ClientOrg[]);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      !searchTerm ||
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    pending: clients.filter((c) => c.status === 'pending').length,
    inactive: clients.filter((c) => c.status === 'inactive').length,
    totalSpend: clients.reduce((sum, c) => sum + (c.subscription_mrr || 0), 0),
    totalCalls: clients.reduce((sum, c) => sum + (c.total_calls || 0), 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <span className="ml-3 text-gray-400">Loading clients...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white">Clients</h1>
            <p className="mt-1 text-gray-400">Manage your agency clients and their campaigns</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Clients</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-900/20">
                  <Building className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Active Clients</p>
                  <p className="text-2xl font-bold text-white">{stats.active}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-900/20">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Calls</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalCalls.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-900/20">
                  <Phone className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    ${stats.totalSpend.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-900/20">
                  <DollarSign className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <Input
              placeholder="Search clients by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-gray-800 bg-gray-900 pl-10 text-white placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedStatus === 'all' ? 'default' : 'outline'}
              className={selectedStatus === 'all' ? 'bg-emerald-600' : 'border-gray-700 text-gray-300 hover:text-white'}
              onClick={() => setSelectedStatus('all')}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={selectedStatus === 'active' ? 'default' : 'outline'}
              className={selectedStatus === 'active' ? 'bg-emerald-600' : 'border-gray-700 text-gray-300 hover:text-white'}
              onClick={() => setSelectedStatus('active')}
            >
              Active ({stats.active})
            </Button>
            <Button
              variant={selectedStatus === 'pending' ? 'default' : 'outline'}
              className={selectedStatus === 'pending' ? 'bg-emerald-600' : 'border-gray-700 text-gray-300 hover:text-white'}
              onClick={() => setSelectedStatus('pending')}
            >
              Pending ({stats.pending})
            </Button>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="border-gray-800 bg-gray-900 transition-colors hover:border-gray-700"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gray-800 text-white">
                        {(client.name || '?')
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg text-white">{client.name}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {client.contact_name || client.contact_email || 'No contact info'}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="border-gray-800 bg-gray-900">
                      <DropdownMenuItem className="text-gray-300 hover:text-white">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-300 hover:text-white">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-2">
                  <Badge className={getStatusColor(client.status)}>
                    {(client.status || 'unknown').charAt(0).toUpperCase() + (client.status || 'unknown').slice(1)}
                  </Badge>
                  {client.subscription_plan && (
                    <Badge variant="outline" className="ml-2 text-gray-400 border-gray-700">
                      {client.subscription_plan}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{client.campaigns_count || 0}</p>
                    <p className="text-xs text-gray-400">Campaigns</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{client.users_count || 0}</p>
                    <p className="text-xs text-gray-400">Users</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{(client.total_calls || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Calls</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-800 pt-2">
                  <div>
                    <p className="text-sm font-medium text-white">
                      ${(client.subscription_mrr || 0).toLocaleString()}/mo
                    </p>
                    <p className="text-xs text-gray-400">MRR</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Joined</p>
                    <p className="text-xs text-gray-300">{new Date(client.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-12 text-center">
              <Building className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <h3 className="mb-2 text-lg font-medium text-white">No clients found</h3>
              <p className="mb-4 text-gray-400">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Clients will appear here when organizations are added to the platform.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
export default Clients;
