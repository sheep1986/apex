import { useState } from 'react';
import {
  Shield,
  User,
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  Key,
  Lock,
  Unlock,
  CreditCard,
  Phone,
  Bot,
  FileText,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'warning';
  category: 'auth' | 'user' | 'campaign' | 'lead' | 'billing' | 'settings' | 'api';
}

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    user: {
      id: 'user1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'admin',
    },
    action: 'user.login',
    resource: 'Authentication',
    details: { method: 'email', mfa: true },
    ipAddress: '192.168.1.1',
    userAgent: 'Chrome/120.0.0.0',
    status: 'success',
    category: 'auth',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: {
      id: 'user2',
      name: 'Mike Davis',
      email: 'mike@example.com',
      role: 'manager',
    },
    action: 'campaign.create',
    resource: 'Campaign',
    resourceId: 'camp123',
    details: { name: 'Q4 Sales Outreach', leads: 500 },
    ipAddress: '192.168.1.2',
    userAgent: 'Firefox/121.0',
    status: 'success',
    category: 'campaign',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: {
      id: 'user1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'admin',
    },
    action: 'user.update_role',
    resource: 'User',
    resourceId: 'user3',
    details: { oldRole: 'agent', newRole: 'manager', targetUser: 'John Smith' },
    ipAddress: '192.168.1.1',
    userAgent: 'Chrome/120.0.0.0',
    status: 'success',
    category: 'user',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    user: {
      id: 'user3',
      name: 'John Smith',
      email: 'john@example.com',
      role: 'agent',
    },
    action: 'api.key_create',
    resource: 'API Key',
    details: { keyName: 'Production API', permissions: ['read', 'write'] },
    ipAddress: '192.168.1.3',
    userAgent: 'Safari/17.0',
    status: 'success',
    category: 'api',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    user: {
      id: 'user2',
      name: 'Mike Davis',
      email: 'mike@example.com',
      role: 'manager',
    },
    action: 'billing.payment_failed',
    resource: 'Payment',
    details: { amount: 599.0, reason: 'Insufficient funds' },
    ipAddress: '192.168.1.2',
    userAgent: 'Chrome/120.0.0.0',
    status: 'failed',
    category: 'billing',
  },
];

const actionIcons: Record<string, any> = {
  'user.login': Lock,
  'user.logout': Unlock,
  'user.create': UserPlus,
  'user.delete': UserMinus,
  'user.update': Edit,
  'user.update_role': Shield,
  'campaign.create': Phone,
  'campaign.update': Edit,
  'campaign.delete': Trash2,
  'campaign.launch': Bot,
  'billing.payment': CreditCard,
  'billing.payment_failed': XCircle,
  'api.key_create': Key,
  'api.key_delete': Trash2,
  'settings.update': Settings,
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7days');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;
    const matchesUser = selectedUser === 'all' || log.user.id === selectedUser;

    return matchesSearch && matchesCategory && matchesStatus && matchesUser;
  });

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Activity;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-green-900/20 text-green-400 border-green-800',
      failed: 'bg-red-900/20 text-red-400 border-red-800',
      warning: 'bg-yellow-900/20 text-yellow-400 border-yellow-800',
    };

    const icons = {
      success: <CheckCircle className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      warning: <AlertCircle className="h-3 w-3" />,
    };

    return (
      <Badge className={styles[status as keyof typeof styles]}>
        <span className="flex items-center gap-1">
          {icons[status as keyof typeof icons]}
          {status}
        </span>
      </Badge>
    );
  };

  const formatAction = (action: string) => {
    return action
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Status', 'IP Address', 'Details'].join(','),
      ...filteredLogs.map((log) =>
        [
          log.timestamp,
          `${log.user.name} (${log.user.email})`,
          formatAction(log.action),
          log.resource,
          log.status,
          log.ipAddress,
          JSON.stringify(log.details),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-emerald-500" />
            <div>
              <h1 className="text-4xl font-bold text-white">Audit Logs</h1>
              <p className="text-gray-400">Track all actions and changes in your system</p>
            </div>
          </div>
          <Button
            onClick={exportLogs}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Actions</CardTitle>
              <Activity className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{logs.length}</div>
              <p className="mt-1 text-xs text-gray-500">In selected period</p>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
              <User className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {new Set(logs.map((log) => log.user.id)).size}
              </div>
              <p className="mt-1 text-xs text-gray-500">Unique users</p>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {Math.round(
                  (logs.filter((log) => log.status === 'success').length / logs.length) * 100
                )}
                %
              </div>
              <p className="mt-1 text-xs text-gray-500">Successful actions</p>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Failed Actions</CardTitle>
              <XCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {logs.filter((log) => log.status === 'failed').length}
              </div>
              <p className="mt-1 text-xs text-gray-500">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-700 bg-gray-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <div>
                <Label className="text-gray-300">Search</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search logs..."
                    className="border-gray-700 bg-gray-900 pl-10 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="mt-2 border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-900">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="user">User Management</SelectItem>
                    <SelectItem value="campaign">Campaigns</SelectItem>
                    <SelectItem value="lead">Leads</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="settings">Settings</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="mt-2 border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-900">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="mt-2 border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-900">
                    <SelectItem value="all">All Users</SelectItem>
                    {Array.from(new Set(logs.map((log) => log.user.id))).map((userId) => {
                      const user = logs.find((log) => log.user.id === userId)?.user;
                      return (
                        <SelectItem key={userId} value={userId}>
                          {user?.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="mt-2 border-gray-700 bg-gray-900 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-700 bg-gray-900">
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="border-gray-700 bg-gray-800/50">
          <CardHeader>
            <CardTitle className="text-white">Audit Log Entries</CardTitle>
            <CardDescription className="text-gray-400">
              Showing {filteredLogs.length} of {logs.length} total entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Timestamp</TableHead>
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400">Action</TableHead>
                    <TableHead className="text-gray-400">Resource</TableHead>
                    <TableHead className="text-gray-400">Details</TableHead>
                    <TableHead className="text-gray-400">IP Address</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="border-gray-700 hover:bg-gray-900/50">
                      <TableCell className="text-gray-300">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm">
                              {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(log.timestamp), 'HH:mm:ss')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm text-gray-300">{log.user.name}</div>
                          <div className="text-xs text-gray-500">{log.user.role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-300">
                          {getActionIcon(log.action)}
                          <span className="text-sm">{formatAction(log.action)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm text-gray-300">{log.resource}</div>
                          {log.resourceId && (
                            <div className="text-xs text-gray-500">ID: {log.resourceId}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-xs text-gray-400">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-gray-500">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">{log.ipAddress}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
