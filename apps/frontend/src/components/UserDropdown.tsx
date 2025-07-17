import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '../hooks/auth';
import {
  User,
  Settings,
  CreditCard,
  Shield,
  Key,
  LogOut,
  ChevronDown,
  DollarSign,
  Activity,
  Phone,
  TrendingUp,
  Building,
  Crown,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUserContext } from '../services/MinimalUserProvider';
import { vapiService } from '@/services/vapi-service';
import { useNotificationStore } from '@/lib/notification-store';
import { cn } from '@/lib/utils';

interface VapiAccountData {
  credits: number;
  totalCalls: number;
  monthlySpend: number;
  lastSync: Date;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  accounts: Array<{
    id: string;
    name: string;
    credits: number;
    calls: number;
  }>;
}

export function UserDropdown() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { userContext } = useUserContext();
  const { addNotification } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [vapiData, setVapiData] = useState<VapiAccountData>({
    credits: 0,
    totalCalls: 0,
    monthlySpend: 0,
    lastSync: new Date(),
    status: 'disconnected',
    accounts: [],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync VAPI account data
  const syncVapiData = async () => {
    setIsRefreshing(true);
    try {
      // In production, this would fetch from multiple VAPI accounts
      const calls = await vapiService.getCalls({ limit: 100 });
      const analytics = await vapiService.getCallAnalytics();

      // Mock multiple account data - replace with real API calls
      const mockAccounts = [
        { id: 'vapi_1', name: 'Main Account', credits: 8470, calls: 1250 },
        { id: 'vapi_2', name: 'Backup Account', credits: 4000, calls: 680 },
      ];

      const totalCredits = mockAccounts.reduce((sum, acc) => sum + acc.credits, 0);
      const totalCalls = mockAccounts.reduce((sum, acc) => sum + acc.calls, 0);

      setVapiData({
        credits: totalCredits,
        totalCalls: totalCalls,
        monthlySpend: analytics.totalCost || 2847.5,
        lastSync: new Date(),
        status: 'connected',
        accounts: mockAccounts,
      });

      // Removed mock notification generation
    } catch (error) {
      console.error('Failed to sync VAPI data:', error);
      setVapiData((prev) => ({ ...prev, status: 'error' }));

      // Removed error notification generation
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-sync on mount and every 5 minutes
  useEffect(() => {
    syncVapiData();
    const interval = setInterval(syncVapiData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect will be handled by the ProtectedRoute component
      // which will redirect to landing page when user is no longer signed in
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getStatusIcon = () => {
    switch (vapiData.status) {
      case 'connected':
        return <CheckCircle className="h-3 w-3 text-gray-400" />;
      case 'syncing':
        return <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = userContext?.firstName || user?.firstName || 'User';

    if (hour < 12) return `Good morning, ${firstName}!`;
    if (hour < 17) return `Good afternoon, ${firstName}!`;
    return `Good evening, ${firstName}!`;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'relative h-10 rounded-lg px-3 transition-all duration-200',
            'hover:bg-gray-800 focus:bg-gray-800 focus:ring-2 focus:ring-gray-500/20',
            isOpen && 'bg-gray-800'
          )}
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 ring-2 ring-gray-700 transition-all hover:ring-gray-500/50">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
              <AvatarFallback className="bg-gray-600 font-medium text-white">
                {user?.firstName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start md:flex">
              <span className="text-sm font-medium text-white">{user?.firstName || 'User'}</span>
              <span className="text-xs text-gray-400">{userContext?.role || 'User'}</span>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-400 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 border-gray-700 bg-gray-900/95 p-0 shadow-xl"
        align="end"
      >
        {/* User Info Header */}
        <div className="border-b border-gray-700 bg-gradient-to-r from-gray-600/10 to-gray-700/10 p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 ring-2 ring-gray-500/30">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
              <AvatarFallback className="bg-gray-600 text-lg font-bold text-white">
                {user?.firstName?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-base font-medium text-white">{getGreeting()}</p>
              <p className="text-sm text-gray-300">{user?.fullName}</p>
              <p className="text-xs text-gray-400">{user?.primaryEmailAddress?.emailAddress}</p>
              <div className="mt-1 flex items-center space-x-2">
                <Badge variant="outline" className="border-gray-500/30 text-xs text-gray-400">
                  {userContext?.role || 'User'}
                </Badge>
                {userContext?.organizationName && (
                  <Badge variant="outline" className="border-blue-500/30 text-xs text-blue-400">
                    <Building className="mr-1 h-3 w-3" />
                    {userContext.organizationName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="border-b border-gray-700 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Account Overview</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-gray-400 hover:text-white"
              onClick={syncVapiData}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Sync
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Credits */}
            <Card className="border-gray-700 bg-gray-800/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Total Credits</p>
                    <p className="text-lg font-bold text-gray-400">
                      {vapiData.credits > 0 ? vapiData.credits.toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Calls */}
            <Card className="border-gray-700 bg-gray-800/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Total Calls</p>
                    <p className="text-lg font-bold text-blue-400">
                      {vapiData.totalCalls > 0 ? vapiData.totalCalls.toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <Phone className="h-5 w-5 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* VAPI Status */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-gray-400">
                VAPI Status:{' '}
                {vapiData.status === 'connected'
                  ? 'Connected'
                  : vapiData.status === 'syncing'
                    ? 'Syncing...'
                    : vapiData.status === 'error'
                      ? 'Connection Error'
                      : 'Disconnected'}
              </span>
            </div>
            <span className="text-gray-500">
              Last sync: {vapiData.lastSync.toLocaleTimeString()}
            </span>
          </div>

          {/* Connected Accounts */}
          {vapiData.accounts.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs text-gray-400">Connected VAPI Accounts</p>
              <div className="space-y-1">
                {vapiData.accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">{account.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400">{account.credits.toLocaleString()}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-blue-400">{account.calls}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="p-2">
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer hover:bg-gray-800/100 focus:bg-gray-800/100"
              onClick={() => {
                navigate('/profile-settings');
                setIsOpen(false);
              }}
            >
              <User className="mr-3 h-4 w-4 text-gray-400" />
              <span className="text-gray-200">Profile Settings</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer hover:bg-gray-800/100 focus:bg-gray-800/100"
              onClick={() => {
                navigate('/api-keys');
                setIsOpen(false);
              }}
            >
              <Key className="mr-3 h-4 w-4 text-gray-400" />
              <span className="text-gray-200">API Keys</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer hover:bg-gray-800/100 focus:bg-gray-800/100"
              onClick={() => {
                navigate('/billing');
                setIsOpen(false);
              }}
            >
              <CreditCard className="mr-3 h-4 w-4 text-gray-400" />
              <span className="text-gray-200">Billing & Credits</span>
            </DropdownMenuItem>

            {userContext?.role === 'platform_owner' && (
              <>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                  onClick={() => {
                    navigate('/platform');
                    setIsOpen(false);
                  }}
                >
                  <Crown className="mr-3 h-4 w-4 text-yellow-400" />
                  <span className="text-gray-200">Platform Admin</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
                  onClick={() => {
                    navigate('/system-health');
                    setIsOpen(false);
                  }}
                >
                  <Shield className="mr-3 h-4 w-4 text-gray-400" />
                  <span className="text-gray-200">Security & Health</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuItem
              className="cursor-pointer hover:bg-gray-800/100 focus:bg-gray-800/100"
              onClick={() => {
                navigate('/settings');
                setIsOpen(false);
              }}
            >
              <Settings className="mr-3 h-4 w-4 text-gray-400" />
              <span className="text-gray-200">Settings</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-2 bg-gray-700" />

          <DropdownMenuItem
            className="cursor-pointer text-red-400 hover:bg-red-900/20 focus:bg-red-900/20"
            onClick={handleSignOut}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 bg-gray-800/50 p-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Apex AI Platform</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:text-white"
              onClick={() => window.open('https://docs.apex.ai', '_blank')}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Docs
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
