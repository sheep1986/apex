import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Flame,
  Trash2,
  LayoutGrid,
  ChevronDown,
  BarChart3,
  Filter,
  Zap,
  CreditCard,
  Users,
  ArrowUpDown,
  Phone,
  Activity,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '../hooks/auth';
import { useToast } from '@/hooks/use-toast';

interface PhoneNumber {
  id: string;
  number: string;
  status: 'connected' | 'disconnected' | 'pending';
  provider: string;
  callsMade: number;
  maxCalls: number;
  leadsGenerated: number;
  conversionRate: number;
  monthlyLimit: number;
  costPerCall: number;
  assignedCampaign?: string;
  country: string;
  areaCode: string;
  createdAt: string;
  lastUsed?: string;
}

interface PhoneNumberStats {
  totalNumbers: number;
  activeNumbers: number;
  totalCallsMade: number;
  totalLeadsGenerated: number;
  avgConversionRate: number;
  totalMonthlyCost: number;
}

export default function PhoneNumbers() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'number' | 'callsMade' | 'conversionRate' | 'createdAt'>(
    'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { getToken } = useAuth();
  const { toast } = useToast();

  // Fetch phone numbers from VAPI API
  const fetchPhoneNumbers = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await fetch('http://localhost:3001/api/phone-numbers', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPhoneNumbers(data.phoneNumbers || []);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch phone numbers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Purchase new phone number
  const purchasePhoneNumber = async (areaCode: string, country: string = 'US') => {
    try {
      const token = await getToken();
      const response = await fetch('http://localhost:3001/api/phone-numbers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          areaCode,
          country,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to purchase phone number');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: `Phone number ${data.phoneNumber.number} purchased successfully`,
      });

      fetchPhoneNumbers(); // Refresh list
    } catch (error) {
      console.error('Error purchasing phone number:', error);
      toast({
        title: 'Error',
        description: 'Failed to purchase phone number. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Release phone number
  const releasePhoneNumber = async (phoneNumberId: string) => {
    if (
      !confirm('Are you sure you want to release this phone number? This action cannot be undone.')
    ) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3001/api/phone-numbers/${phoneNumberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to release phone number');
      }

      toast({
        title: 'Success',
        description: 'Phone number released successfully',
      });

      fetchPhoneNumbers(); // Refresh list
    } catch (error) {
      console.error('Error releasing phone number:', error);
      toast({
        title: 'Error',
        description: 'Failed to release phone number. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Assign phone number to campaign
  const assignToCampaign = async (phoneNumberId: string, campaignId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `http://localhost:3001/api/phone-numbers/${phoneNumberId}/assign`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            campaignId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to assign phone number');
      }

      toast({
        title: 'Success',
        description: 'Phone number assigned successfully',
      });

      fetchPhoneNumbers(); // Refresh list
    } catch (error) {
      console.error('Error assigning phone number:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign phone number. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Calculate statistics from real data
  const calculateStats = (): PhoneNumberStats => {
    return {
      totalNumbers: phoneNumbers.length,
      activeNumbers: phoneNumbers.filter((p) => p.status === 'connected').length,
      totalCallsMade: phoneNumbers.reduce((sum, p) => sum + p.callsMade, 0),
      totalLeadsGenerated: phoneNumbers.reduce((sum, p) => sum + p.leadsGenerated, 0),
      avgConversionRate:
        phoneNumbers.length > 0
          ? phoneNumbers.reduce((sum, p) => sum + p.conversionRate, 0) / phoneNumbers.length
          : 0,
      totalMonthlyCost: phoneNumbers.reduce((sum, p) => sum + p.monthlyLimit * p.costPerCall, 0),
    };
  };

  // Filter and sort phone numbers
  const filteredPhoneNumbers = phoneNumbers
    .filter((phone) => {
      const matchesSearch =
        phone.number.includes(searchTerm) ||
        phone.assignedCampaign?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || phone.status === statusFilter;
      const matchesCountry = countryFilter === 'all' || phone.country === countryFilter;

      return matchesSearch && matchesStatus && matchesCountry;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  const stats = calculateStats();

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30';
      case 'disconnected':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'pending':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-3 w-3" />;
      case 'disconnected':
        return <AlertCircle className="h-3 w-3" />;
      case 'pending':
        return <Activity className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-lg text-white">Loading phone numbers...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex h-full flex-col">
        <div className="flex-shrink-0 p-6">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-gray-400">Manage your VAPI phone numbers and calling capacity</p>
            </div>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
              onClick={() => {
                const areaCode = prompt('Enter area code (e.g., 555):');
                if (areaCode) {
                  purchasePhoneNumber(areaCode);
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Buy Number
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Numbers</CardTitle>
                <Phone className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalNumbers}</div>
                <p className="mt-1 text-xs text-gray-500">All numbers</p>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active</CardTitle>
                <Zap className="h-4 w-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.activeNumbers}</div>
                <p className="mt-1 text-xs text-emerald-400">Connected</p>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Calls Made</CardTitle>
                <Activity className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.totalCallsMade.toLocaleString()}
                </div>
                <p className="mt-1 text-xs text-gray-500">Total volume</p>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Leads Generated</CardTitle>
                <Users className="h-4 w-4 text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalLeadsGenerated}</div>
                <p className="mt-1 text-xs text-gray-500">Successful contacts</p>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Avg Conversion</CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.avgConversionRate.toFixed(1)}%
                </div>
                <p className="mt-1 text-xs text-gray-500">Success rate</p>
              </CardContent>
            </Card>

            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Monthly Cost</CardTitle>
                <CreditCard className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(stats.totalMonthlyCost)}
                </div>
                <p className="mt-1 text-xs text-gray-500">Estimated</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Controls */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search numbers or campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-gray-700 bg-gray-800/50 pl-10 text-white placeholder-gray-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full border-gray-700 bg-gray-800/50 text-white sm:w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full border-gray-700 bg-gray-800/50 text-white sm:w-[180px]">
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent className="border-gray-700 bg-gray-800">
                <SelectItem value="all">All countries</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-700">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort
            </Button>
          </div>
        </div>

        {/* Phone Numbers List */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          {filteredPhoneNumbers.length === 0 ? (
            <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="mb-4 text-gray-400">
                  <Phone className="mx-auto mb-4 h-12 w-12" />
                  <h3 className="mb-2 text-lg font-semibold text-white">No phone numbers found</h3>
                  <p>Purchase your first phone number to start making calls.</p>
                </div>
                <Button
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  onClick={() => {
                    const areaCode = prompt('Enter area code (e.g., 555):');
                    if (areaCode) {
                      purchasePhoneNumber(areaCode);
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Buy Phone Number
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {filteredPhoneNumbers.map((phone) => (
                <Card
                  key={phone.id}
                  className="border-gray-700 bg-gray-800/50 backdrop-blur-sm transition-colors hover:bg-gray-800/70"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-400" />
                        <CardTitle className="text-lg text-white">{phone.number}</CardTitle>
                      </div>
                      <Badge className={`${getStatusColor(phone.status)} border`}>
                        {getStatusIcon(phone.status)}
                        <span className="ml-1 capitalize">{phone.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{phone.country}</span>
                      <span>•</span>
                      <span>{phone.provider}</span>
                      {phone.assignedCampaign && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">{phone.assignedCampaign}</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Usage Progress */}
                    <div>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-gray-400">Usage</span>
                        <span className="text-white">
                          {phone.callsMade} / {phone.maxCalls}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-700">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-emerald-600 to-blue-600 transition-all duration-300"
                          style={{
                            width: `${Math.min((phone.callsMade / phone.maxCalls) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Leads Generated</div>
                        <div className="font-semibold text-white">{phone.leadsGenerated}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Conversion Rate</div>
                        <div className="font-semibold text-emerald-400">
                          {phone.conversionRate.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Cost per Call</div>
                        <div className="font-semibold text-white">
                          {formatCurrency(phone.costPerCall)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Monthly Limit</div>
                        <div className="font-semibold text-white">{phone.monthlyLimit}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-gray-700 pt-2">
                      <div className="text-xs text-gray-500">
                        Added {formatDate(phone.createdAt)}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="border-gray-700 bg-gray-800">
                          <DropdownMenuItem
                            className="text-gray-300 hover:bg-gray-700"
                            onClick={() => {
                              const campaignId = prompt('Enter campaign ID to assign:');
                              if (campaignId) {
                                assignToCampaign(phone.id, campaignId);
                              }
                            }}
                          >
                            <Users className="mr-2 h-4 w-4" />
                            Assign to Campaign
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-gray-300 hover:bg-gray-700"
                            onClick={() => {
                              /* View analytics */
                            }}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-red-600/20"
                            onClick={() => releasePhoneNumber(phone.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Release Number
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
