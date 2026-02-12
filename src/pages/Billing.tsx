import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PLAN_TIERS, getPlanById, type PlanTier } from '@/config/plans';
import { useAuth } from '@/hooks/auth';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/services/MinimalUserProvider';
import { supabase } from '@/services/supabase-client';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Crown,
  ExternalLink,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────

interface LedgerEntry {
  id: string;
  organization_id: string;
  amount: number;
  type: string;
  description: string;
  reference_id: string;
  metadata: any;
  created_at: string;
}

interface OrgSubscription {
  plan: string;
  subscription_status: string;
  credit_balance: number;
  included_minutes: number;
  max_phone_numbers: number;
  max_assistants: number;
  max_concurrent_calls: number;
  max_users: number;
  overage_rate_per_minute: number;
  subscription_period_start: string | null;
  subscription_period_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
}

interface UsagePeriod {
  minutes_used: number;
  overage_minutes: number;
  calls_count: number;
  period_start: string;
  period_end: string;
}

interface TopUpOption {
  amount: number;
  label: string;
  description: string;
  popular?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────

const TOP_UP_OPTIONS: TopUpOption[] = [
  { amount: 10, label: '$10', description: 'Overage credit buffer' },
  { amount: 25, label: '$25', description: 'For moderate overage', popular: true },
  { amount: 50, label: '$50', description: 'For heavy calling periods' },
  { amount: 100, label: '$100', description: 'Maximum overage buffer' },
];

// ─── Component ───────────────────────────────────────────────────

const Billing: React.FC = () => {
  const { userContext } = useUserContext();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [orgSub, setOrgSub] = useState<OrgSubscription | null>(null);
  const [usage, setUsage] = useState<UsagePeriod | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [processingTopUp, setProcessingTopUp] = useState<number | null>(null);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [cancellingPlan, setCancellingPlan] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  const currentPlan = orgSub ? getPlanById(orgSub.plan) : null;

  // ─── Data fetching ───────────────────────────────────────────

  useEffect(() => {
    if (userContext?.organization_id) {
      fetchBillingData();
    }
  }, [userContext?.organization_id]);

  const fetchBillingData = async () => {
    if (!userContext?.organization_id) return;
    setLoading(true);

    try {
      const [orgResult, usageResult, ledgerResult] = await Promise.all([
        supabase
          .from('organizations')
          .select(
            'plan, subscription_status, credit_balance, included_minutes, max_phone_numbers, max_assistants, max_concurrent_calls, max_users, overage_rate_per_minute, subscription_period_start, subscription_period_end, stripe_subscription_id, stripe_customer_id'
          )
          .eq('id', userContext.organization_id)
          .single(),
        supabase
          .from('subscription_usage')
          .select('minutes_used, overage_minutes, calls_count, period_start, period_end')
          .eq('organization_id', userContext.organization_id)
          .order('period_start', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('credits_ledger')
          .select('*')
          .eq('organization_id', userContext.organization_id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (orgResult.data) {
        setOrgSub(orgResult.data as OrgSubscription);
      }
      if (usageResult.data) {
        setUsage(usageResult.data as UsagePeriod);
      }
      if (ledgerResult.data) {
        setLedgerEntries(ledgerResult.data);
      }
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
      toast({ title: 'Error', description: 'Failed to load billing data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ─── URL param handling (Stripe return) ─────────────────────

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({ title: 'Payment Successful', description: 'Your account has been updated.' });
      window.history.replaceState({}, '', '/billing');
      setTimeout(() => fetchBillingData(), 2000);
    }
    if (params.get('cancelled') === 'true') {
      toast({ title: 'Payment Cancelled', description: 'No charges were made.' });
      window.history.replaceState({}, '', '/billing');
    }
  }, []);

  // ─── Handlers ──────────────────────────────────────────────

  const handleTopUp = async (amount: number) => {
    if (!userContext?.organization_id) return;
    setProcessingTopUp(amount);

    try {
      const token = await getToken();
      const response = await fetch('/.netlify/functions/billing-create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount,
          organizationId: userContext.organization_id,
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/billing?cancelled=true`,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast({ title: 'Error', description: 'Failed to start checkout.', variant: 'destructive' });
    } finally {
      setProcessingTopUp(null);
    }
  };

  const handleChangePlan = async (newPlanId: string) => {
    if (!userContext?.organization_id) return;

    // If no subscription yet, redirect to checkout
    if (!orgSub?.stripe_subscription_id) {
      setChangingPlan(newPlanId);
      try {
        const token = await getToken();
        const response = await fetch('/.netlify/functions/billing-create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            mode: 'subscription',
            planId: newPlanId,
            organizationId: userContext.organization_id,
            successUrl: `${window.location.origin}/billing?success=true`,
            cancelUrl: `${window.location.origin}/billing?cancelled=true`,
          }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL');
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Failed to start subscription checkout.', variant: 'destructive' });
      } finally {
        setChangingPlan(null);
      }
      return;
    }

    // Existing subscription — upgrade/downgrade
    setChangingPlan(newPlanId);
    try {
      const token = await getToken();
      const response = await fetch('/.netlify/functions/billing-manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'change_plan', newPlanId }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Plan Updated', description: `Switched to ${newPlanId} plan. Changes take effect immediately.` });
        setTimeout(() => fetchBillingData(), 1500);
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to change plan.', variant: 'destructive' });
    } finally {
      setChangingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userContext?.organization_id) return;
    setCancellingPlan(true);
    try {
      const token = await getToken();
      const response = await fetch('/.netlify/functions/billing-manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Subscription Cancelled', description: 'Your plan will remain active until the end of the billing period.' });
        setTimeout(() => fetchBillingData(), 1500);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to cancel.', variant: 'destructive' });
    } finally {
      setCancellingPlan(false);
    }
  };

  const handleReactivate = async () => {
    if (!userContext?.organization_id) return;
    try {
      const token = await getToken();
      const response = await fetch('/.netlify/functions/billing-manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'reactivate' }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: 'Subscription Reactivated', description: 'Your plan is active again.' });
        setTimeout(() => fetchBillingData(), 1500);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to reactivate.', variant: 'destructive' });
    }
  };

  const handleOpenPortal = async () => {
    setOpeningPortal(true);
    try {
      const token = await getToken();
      const response = await fetch('/.netlify/functions/billing-manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'portal' }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to open billing portal.', variant: 'destructive' });
    } finally {
      setOpeningPortal(false);
    }
  };

  // ─── Computed ────────────────────────────────────────────────

  const minutesUsed = usage?.minutes_used || 0;
  const includedMinutes = orgSub?.included_minutes || 0;
  const usagePercent = includedMinutes > 0 ? Math.min(100, (minutesUsed / includedMinutes) * 100) : 0;
  const overageMinutes = usage?.overage_minutes || 0;
  const overageRate = orgSub?.overage_rate_per_minute || 0;
  const overageCost = overageMinutes * overageRate;
  const creditBalance = orgSub?.credit_balance || 0;
  const daysLeft = orgSub?.subscription_period_end
    ? Math.max(0, Math.ceil((new Date(orgSub.subscription_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const statusColor =
    orgSub?.subscription_status === 'active'
      ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      : orgSub?.subscription_status === 'past_due'
        ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
        : orgSub?.subscription_status === 'canceled'
          ? 'text-red-400 border-red-500/30 bg-red-500/10'
          : 'text-gray-400 border-gray-500/30 bg-gray-500/10';

  // ─── Loading ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="w-full space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-gray-400">Manage your subscription and billing</p>
          <div className="flex gap-2">
            {orgSub?.stripe_customer_id && (
              <Button
                onClick={handleOpenPortal}
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={openingPortal}
              >
                {openingPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                Billing Portal
              </Button>
            )}
            <Button
              onClick={fetchBillingData}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Current Plan Card */}
        <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-emerald-600/5">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-emerald-400" />
                  <h2 className="text-2xl font-bold text-white">{currentPlan?.name || 'Free'} Plan</h2>
                  <Badge className={statusColor}>
                    {orgSub?.subscription_status || 'inactive'}
                  </Badge>
                </div>
                <p className="text-gray-400">
                  {currentPlan
                    ? `$${currentPlan.monthlyPrice}/month · ${currentPlan.includedMinutes.toLocaleString()} minutes included`
                    : 'No active subscription'}
                </p>
                {orgSub?.subscription_period_end && orgSub.subscription_status !== 'canceled' && (
                  <p className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Renews {new Date(orgSub.subscription_period_end).toLocaleDateString()} ({daysLeft} days)
                  </p>
                )}
                {orgSub?.subscription_status === 'canceled' && orgSub.subscription_period_end && (
                  <p className="flex items-center gap-1 text-sm text-red-400">
                    <Calendar className="h-3.5 w-3.5" />
                    Access until {new Date(orgSub.subscription_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {orgSub?.subscription_status === 'canceled' ? (
                  <Button onClick={handleReactivate} className="bg-emerald-600 hover:bg-emerald-700">
                    Reactivate Plan
                  </Button>
                ) : orgSub?.stripe_subscription_id ? (
                  <Button
                    onClick={handleCancelSubscription}
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    disabled={cancellingPlan}
                  >
                    {cancellingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Cancel Plan
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Usage */}
          <Card className="border-gray-800 bg-gray-900 md:col-span-2">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Minutes Used</p>
                  <p className="text-sm font-medium text-white">
                    {minutesUsed.toLocaleString()} / {includedMinutes > 0 ? includedMinutes.toLocaleString() : '—'}
                  </p>
                </div>
                <Progress value={usagePercent} className="h-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{Math.round(usagePercent)}% used</span>
                  {overageMinutes > 0 && (
                    <span className="text-amber-400">
                      +{overageMinutes.toLocaleString()} overage min (${overageCost.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Balance */}
          <Card className={`border-gray-800 bg-gray-900 ${creditBalance < 2 ? 'border-red-500/30' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Overage Credits</p>
                  <p className="text-xl font-bold text-white">${creditBalance.toFixed(2)}</p>
                </div>
                <div className={`rounded-lg p-2 ${creditBalance < 2 ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                  <Wallet className={`h-5 w-5 ${creditBalance < 2 ? 'text-red-400' : 'text-emerald-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calls This Period */}
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Calls This Period</p>
                  <p className="text-xl font-bold text-white">{(usage?.calls_count || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2">
                  <TrendingUp className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resource Limits */}
        {currentPlan && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
              <Phone className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
              <p className="text-lg font-bold text-white">{orgSub?.max_phone_numbers || 0}</p>
              <p className="text-xs text-gray-500">Phone Numbers</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
              <Sparkles className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
              <p className="text-lg font-bold text-white">
                {(orgSub?.max_assistants || 0) === -1 ? '∞' : orgSub?.max_assistants || 0}
              </p>
              <p className="text-xs text-gray-500">Assistants</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
              <Zap className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
              <p className="text-lg font-bold text-white">{orgSub?.max_concurrent_calls || 0}</p>
              <p className="text-xs text-gray-500">Concurrent Calls</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-center">
              <Users className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
              <p className="text-lg font-bold text-white">
                {(orgSub?.max_users || 0) === -1 ? '∞' : orgSub?.max_users || 0}
              </p>
              <p className="text-xs text-gray-500">Team Members</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="border-gray-800 bg-gray-900">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="topup">Top Up Credits</TabsTrigger>
            <TabsTrigger value="history">Transactions</TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PLAN_TIERS.filter((p) => !p.contactSales).map((plan) => {
                const isCurrent = orgSub?.plan === plan.id;
                const isUpgrade =
                  currentPlan && plan.monthlyPrice > currentPlan.monthlyPrice;
                const isDowngrade =
                  currentPlan && plan.monthlyPrice < currentPlan.monthlyPrice;

                return (
                  <Card
                    key={plan.id}
                    className={`relative border transition-all ${
                      isCurrent
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : plan.popular
                          ? 'border-emerald-500/30 bg-gray-900 hover:border-emerald-500/50'
                          : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                    }`}
                  >
                    {plan.popular && !isCurrent && (
                      <Badge className="absolute -top-2.5 right-4 border-emerald-500/30 bg-emerald-600 text-white">
                        Most Popular
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge className="absolute -top-2.5 right-4 border-emerald-500/30 bg-emerald-600 text-white">
                        Current Plan
                      </Badge>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white">${plan.monthlyPrice}</span>
                        <span className="text-gray-400">/month</span>
                      </div>
                      <CardDescription className="text-gray-400">
                        {plan.includedMinutes.toLocaleString()} minutes · {plan.includedPhoneNumbers} number{plan.includedPhoneNumbers > 1 ? 's' : ''} · ${plan.overagePerMinute}/min overage
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={`w-full ${
                          isCurrent
                            ? 'cursor-default bg-gray-700 text-gray-400'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                        disabled={isCurrent || changingPlan !== null}
                        onClick={() => handleChangePlan(plan.id)}
                      >
                        {changingPlan === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrent ? (
                          'Current Plan'
                        ) : isUpgrade ? (
                          'Upgrade'
                        ) : isDowngrade ? (
                          'Downgrade'
                        ) : (
                          'Subscribe'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Enterprise CTA */}
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Enterprise</h3>
                  <p className="text-sm text-gray-400">
                    Need unlimited minutes, custom integrations, or white-label branding? Let's talk.
                  </p>
                </div>
                <Button variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Up Tab */}
          <TabsContent value="topup" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Top Up Overage Credits</CardTitle>
                <CardDescription className="text-gray-400">
                  Credits are used when you exceed your plan's included minutes. Current balance:{' '}
                  <span className="font-medium text-white">${creditBalance.toFixed(2)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {TOP_UP_OPTIONS.map((option) => (
                    <div
                      key={option.amount}
                      className={`relative cursor-pointer rounded-lg border p-4 transition-all hover:border-emerald-500/50 ${
                        option.popular
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-gray-700 bg-gray-800'
                      }`}
                      onClick={() => handleTopUp(option.amount)}
                    >
                      {option.popular && (
                        <Badge className="absolute -top-2 right-3 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                          Popular
                        </Badge>
                      )}
                      <div className="text-center">
                        <p className="text-3xl font-bold text-white">{option.label}</p>
                        <p className="mt-1 text-xs text-gray-400">{option.description}</p>
                        <Button
                          className="mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                          disabled={processingTopUp !== null}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTopUp(option.amount);
                          }}
                        >
                          {processingTopUp === option.amount ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Top Up
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  How Overage Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                  <p className="text-sm text-gray-400">
                    <strong className="text-white">Included minutes first:</strong> Your plan's included
                    minutes are used before any overage is charged.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                  <p className="text-sm text-gray-400">
                    <strong className="text-white">Overage rate:</strong>{' '}
                    {overageRate > 0
                      ? `$${overageRate.toFixed(2)}/minute beyond your included minutes.`
                      : 'Depends on your plan tier.'}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Wallet className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                  <p className="text-sm text-gray-400">
                    <strong className="text-white">Credit buffer:</strong> Top up credits to ensure
                    uninterrupted service when you exceed your plan.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Transaction History</CardTitle>
                <CardDescription className="text-gray-400">
                  All credit additions, usage charges, and subscription events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ledgerEntries.length === 0 ? (
                  <div className="py-12 text-center">
                    <Clock className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                    <p className="text-lg font-medium text-white">No transactions yet</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Your billing transactions will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ledgerEntries.map((entry) => {
                      const isCredit = Number(entry.amount) > 0;
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-lg p-2 ${
                                isCredit ? 'bg-emerald-500/10' : 'bg-pink-500/10'
                              }`}
                            >
                              {isCredit ? (
                                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-pink-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {entry.description || entry.type}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(entry.created_at).toLocaleDateString()} at{' '}
                                {new Date(entry.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={`font-mono font-medium ${
                                isCredit ? 'text-emerald-400' : 'text-pink-400'
                              }`}
                            >
                              {isCredit ? '+' : ''}${Number(entry.amount).toFixed(2)}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                entry.type === 'subscription'
                                  ? 'border-blue-500/30 text-blue-400'
                                  : entry.type === 'overage'
                                    ? 'border-amber-500/30 text-amber-400'
                                    : entry.type === 'credit'
                                      ? 'border-emerald-500/30 text-emerald-400'
                                      : entry.type === 'trial'
                                        ? 'border-purple-500/30 text-purple-400'
                                        : 'border-gray-600 text-gray-400'
                              }`}
                            >
                              {entry.type}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Billing;
