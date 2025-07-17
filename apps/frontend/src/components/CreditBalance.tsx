import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  TrendingUp,
  Wallet,
  Activity,
  Calendar,
  ArrowUpRight,
  DollarSign,
  Zap,
  Clock,
  Star,
  ChevronRight,
  BarChart3,
  Users,
  PhoneCall,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

interface CreditStats {
  balance: number;
  monthlySpend: number;
  callsRemaining: number;
  totalCalls: number;
  avgCallCost: number;
  lastTopUp: Date;
  nextBillingDate: Date;
  planType: 'starter' | 'professional' | 'enterprise';
}

export function CreditBalance() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<CreditStats>({
    balance: 347.85,
    monthlySpend: 523.4,
    callsRemaining: 463,
    totalCalls: 1247,
    avgCallCost: 0.89,
    lastTopUp: new Date('2024-01-15'),
    nextBillingDate: new Date('2024-02-01'),
    planType: 'professional',
  });

  const [lowBalance, setLowBalance] = useState(false);
  const [dailyUsage, setDailyUsage] = useState([
    { day: 'Mon', amount: 45.2, calls: 52 },
    { day: 'Tue', amount: 67.8, calls: 74 },
    { day: 'Wed', amount: 38.9, calls: 43 },
    { day: 'Thu', amount: 91.25, calls: 98 },
    { day: 'Fri', amount: 78.45, calls: 87 },
    { day: 'Sat', amount: 23.1, calls: 26 },
    { day: 'Sun', amount: 31.5, calls: 35 },
  ]);

  useEffect(() => {
    // Check if balance is low (less than 100)
    setLowBalance(stats.balance < 100);
  }, [stats.balance]);

  const handleTopUp = (amount: number) => {
    console.log(`Adding ${amount} credits`);
    setStats((prev) => ({ ...prev, balance: prev.balance + amount }));
    setIsOpen(false);
  };

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'starter':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'professional':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'enterprise':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getUsageProgress = () => {
    const totalBudget = 1000; // Monthly budget
    return (stats.monthlySpend / totalBudget) * 100;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group relative h-auto bg-gray-900/80 px-4 py-2.5 backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/80"
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-brand-pink to-brand-magenta">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              {lowBalance && (
                <div className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-orange-500">
                  <AlertCircle className="h-2 w-2 text-white" />
                </div>
              )}
              {!lowBalance && (
                <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-medium text-gray-400">Credits</span>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-bold text-white">{formatBalance(stats.balance)}</span>
                {lowBalance && <AlertCircle className="h-3 w-3 text-orange-400" />}
              </div>
            </div>
            <div className="flex items-center space-x-1 text-gray-400 transition-colors group-hover:text-brand-pink">
              <Plus className="h-4 w-4" />
              <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 border-gray-800/50 bg-gray-900/95 p-0 backdrop-blur-xl"
      >
        <Card className="border-none bg-transparent shadow-none">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Account Balance</h3>
                  <p className="text-sm text-gray-400">AI Calling Credits</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <p className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-3xl font-bold text-transparent">
                      {formatBalance(stats.balance)}
                    </p>
                    {!lowBalance && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    ~{stats.callsRemaining} calls remaining
                  </p>
                </div>
              </div>

              {/* Balance Status */}
              {lowBalance && (
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-400">Low Balance Warning</span>
                  </div>
                  <p className="mt-1 text-xs text-orange-300">
                    Consider topping up to avoid service interruption
                  </p>
                </div>
              )}

              {/* Usage Overview */}
              <div className="space-y-3 rounded-lg bg-gray-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Monthly Usage</span>
                  <span className="text-sm font-medium text-white">
                    {formatBalance(stats.monthlySpend)}
                  </span>
                </div>

                <Progress value={getUsageProgress()} className="h-2" />

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">{stats.totalCalls}</p>
                    <p className="text-xs text-gray-500">Total Calls</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">
                      {formatBalance(stats.avgCallCost)}
                    </p>
                    <p className="text-xs text-gray-500">Avg/Call</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-400">24%</p>
                    <p className="text-xs text-gray-500">Efficiency</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-800/30 p-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-gray-400">Next Billing</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formatDate(stats.nextBillingDate)}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-800/30 p-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-gray-400">Last Top-up</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-white">
                    {formatDate(stats.lastTopUp)}
                  </p>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-gray-800/50" />

              {/* Quick Top-up */}
              <div>
                <DropdownMenuLabel className="flex items-center space-x-2 px-0 pb-3 text-white">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>Quick Top-up</span>
                </DropdownMenuLabel>
                <div className="grid grid-cols-2 gap-2">
                  {[50, 100, 250, 500].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTopUp(amount)}
                      className="border-gray-700 text-gray-300 transition-all duration-200 hover:border-brand-pink/50 hover:bg-gradient-to-r hover:from-brand-pink/20 hover:to-brand-magenta/20 hover:text-white"
                    >
                      <Plus className="mr-1 h-3 w-3" />${amount}
                    </Button>
                  ))}
                </div>
              </div>

              <DropdownMenuSeparator className="bg-gray-800/50" />

              {/* Menu Items */}
              <div className="space-y-1">
                <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                  <CreditCard className="mr-3 h-4 w-4 text-blue-400" />
                  <span className="flex-1">Payment Methods</span>
                  <ChevronRight className="h-4 w-4" />
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                  <BarChart3 className="mr-3 h-4 w-4 text-green-400" />
                  <span className="flex-1">Usage Analytics</span>
                  <ChevronRight className="h-4 w-4" />
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg px-3 py-2 text-gray-300 hover:bg-gray-800/50 hover:text-white">
                  <Activity className="mr-3 h-4 w-4 text-emerald-400" />
                  <span className="flex-1">Billing History</span>
                  <ChevronRight className="h-4 w-4" />
                </DropdownMenuItem>
              </div>

              {/* Custom Top-up Button */}
              <Button
                className="w-full rounded-lg bg-gradient-to-r from-brand-pink to-brand-magenta py-3 font-semibold text-white transition-all duration-300 hover:from-brand-magenta hover:to-brand-pink hover:shadow-lg hover:shadow-brand-pink/25"
                onClick={() => setIsOpen(false)}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Custom Amount
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
