import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  CreditCard,
  Check,
  X,
  Loader2,
  AlertCircle,
  Crown,
  Zap,
  Building,
  Users,
  Phone,
  BarChart3,
  Clock,
  Download,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  limits: {
    monthly_calls: number;
    team_members: number;
    ai_assistants: number;
    phone_numbers: number;
    api_calls: number;
  };
  recommended?: boolean;
}

interface CurrentSubscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  usage: {
    calls: number;
    team_members: number;
    ai_assistants: number;
    phone_numbers: number;
    api_calls: number;
  };
  limits: {
    monthly_calls: number;
    team_members: number;
    ai_assistants: number;
    phone_numbers: number;
    api_calls: number;
  };
}

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: string;
  description: string;
  invoice_url?: string;
}

// Plans will be generated dynamically with translations
const getPlanFeatures = (t: any, planId: string, limits: any) => {
  switch (planId) {
    case 'starter':
      return [
        t('billing.plans.starter.features.calls', { count: '1,000' }),
        t('billing.plans.starter.features.teamMembers', { count: '3' }),
        t('billing.plans.starter.features.aiAssistants', { count: '2' }),
        t('billing.plans.starter.features.phoneNumbers', { count: '1' }),
        t('billing.plans.starter.features.analytics'),
        t('billing.plans.starter.features.support'),
      ];
    case 'growth':
      return [
        t('billing.plans.growth.features.calls', { count: '10,000' }),
        t('billing.plans.growth.features.teamMembers', { count: '10' }),
        t('billing.plans.growth.features.aiAssistants', { count: '10' }),
        t('billing.plans.growth.features.phoneNumbers', { count: '5' }),
        t('billing.plans.growth.features.analytics'),
        t('billing.plans.growth.features.support'),
        t('billing.plans.growth.features.integrations'),
      ];
    case 'enterprise':
      return [
        t('billing.plans.enterprise.features.calls'),
        t('billing.plans.enterprise.features.teamMembers'),
        t('billing.plans.enterprise.features.aiAssistants'),
        t('billing.plans.enterprise.features.phoneNumbers'),
        t('billing.plans.enterprise.features.analytics'),
        t('billing.plans.enterprise.features.support'),
        t('billing.plans.enterprise.features.sla'),
        t('billing.plans.enterprise.features.customFeatures'),
      ];
    default:
      return [];
  }
};

const getPlans = (t: any): SubscriptionPlan[] => [
  {
    id: 'starter',
    name: t('billing.plans.starter.name'),
    description: t('billing.plans.starter.description'),
    price: 99,
    interval: 'month',
    features: getPlanFeatures(t, 'starter', { monthly_calls: 1000, team_members: 3, ai_assistants: 2, phone_numbers: 1 }),
    limits: {
      monthly_calls: 1000,
      team_members: 3,
      ai_assistants: 2,
      phone_numbers: 1,
      api_calls: 10000,
    },
  },
  {
    id: 'growth',
    name: t('billing.plans.growth.name'),
    description: t('billing.plans.growth.description'),
    price: 299,
    interval: 'month',
    recommended: true,
    features: getPlanFeatures(t, 'growth', { monthly_calls: 10000, team_members: 10, ai_assistants: 10, phone_numbers: 5 }),
    limits: {
      monthly_calls: 10000,
      team_members: 10,
      ai_assistants: 10,
      phone_numbers: 5,
      api_calls: 100000,
    },
  },
  {
    id: 'enterprise',
    name: t('billing.plans.enterprise.name'),
    description: t('billing.plans.enterprise.description'),
    price: 999,
    interval: 'month',
    features: getPlanFeatures(t, 'enterprise', { monthly_calls: -1, team_members: -1, ai_assistants: -1, phone_numbers: -1 }),
    limits: {
      monthly_calls: -1,
      team_members: -1,
      ai_assistants: -1,
      phone_numbers: -1,
      api_calls: -1,
    },
  },
];

const Billing: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['common']);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const [subscription, methods, history] = await Promise.all([
        apiClient.get('/api/billing/subscription'),
        apiClient.get('/api/billing/payment-methods'),
        apiClient.get('/api/billing/history'),
      ]);

      setCurrentSubscription(subscription.data);
      setPaymentMethods(methods.data);
      setBillingHistory(history.data);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast.error(t('billing.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setProcessingPlanId(planId);
      const response = await apiClient.post('/api/billing/upgrade', { plan_id: planId });

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        await fetchBillingData();
        toast.success(t('billing.subscription.upgradeSuccess'));
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error(t('billing.subscription.upgradeFailed'));
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm(t('billing.subscription.cancelConfirm'))) {
      return;
    }

    try {
      await apiClient.post('/api/billing/cancel');
      await fetchBillingData();
      toast.success(t('billing.subscription.cancelSuccess'));
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error(t('billing.subscription.cancelFailed'));
    }
  };

  const handleAddPaymentMethod = async () => {
    try {
      const response = await apiClient.post('/api/billing/payment-method/setup');
      if (response.data.setup_url) {
        window.location.href = response.data.setup_url;
      }
    } catch (error) {
      console.error('Error setting up payment method:', error);
      toast.error(t('billing.payment.addFailed'));
    }
  };

  const handleRemovePaymentMethod = async (methodId: string) => {
    if (!confirm(t('billing.payment.removeConfirm'))) {
      return;
    }

    try {
      await apiClient.delete(`/api/billing/payment-method/${methodId}`);
      await fetchBillingData();
      toast.success(t('billing.payment.removeSuccess'));
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error(t('billing.payment.removeFailed'));
    }
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    try {
      await apiClient.post(`/api/billing/payment-method/${methodId}/default`);
      await fetchBillingData();
      toast.success(t('billing.payment.defaultSuccess'));
    } catch (error) {
      console.error('Error updating default payment method:', error);
      toast.error(t('billing.payment.defaultFailed'));
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? t('billing.subscription.unlimited') : limit.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const plans = getPlans(t);

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <p className="text-zinc-400">
          {t('billing.description')}
        </p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList className="border-zinc-800 bg-zinc-900">
          <TabsTrigger value="subscription">{t('billing.subscription.title')}</TabsTrigger>
          <TabsTrigger value="payment">{t('billing.payment.title')}</TabsTrigger>
          <TabsTrigger value="history">{t('billing.history.title')}</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          {/* Current Subscription */}
          {currentSubscription && (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{t('billing.subscription.current')}</CardTitle>
                    <CardDescription className="text-zinc-400">
                      {t('billing.subscription.currentDescription')}
                    </CardDescription>
                  </div>
                  <Badge
                    className={`${
                      currentSubscription.status === 'active'
                        ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                        : 'border-red-500/30 bg-red-500/20 text-red-400'
                    }`}
                  >
                    {currentSubscription.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg bg-zinc-800 p-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {t('billing.subscription.plan', { plan: currentSubscription.plan_name })}
                    </h3>
                    <p className="text-zinc-400">
                      {t('billing.subscription.renewsOn', { 
                        date: new Date(currentSubscription.current_period_end).toLocaleDateString() 
                      })}
                    </p>
                  </div>
                  {currentSubscription.cancel_at_period_end && (
                    <Alert className="border-red-500/30 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-400">
                        {t('billing.subscription.willCancelAtPeriodEnd')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Usage Overview */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">{t('billing.subscription.usageThisPeriod')}</h4>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-zinc-400">
                          <Phone className="h-4 w-4" />
                          {t('billing.subscription.aiCalls')}
                        </span>
                        <span className="text-white">
                          {currentSubscription.usage.calls.toLocaleString()} /{' '}
                          {formatLimit(currentSubscription.limits.monthly_calls)}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          currentSubscription.usage.calls,
                          currentSubscription.limits.monthly_calls
                        )}
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-zinc-400">
                          <Users className="h-4 w-4" />
                          {t('billing.subscription.teamMembers')}
                        </span>
                        <span className="text-white">
                          {currentSubscription.usage.team_members} /{' '}
                          {formatLimit(currentSubscription.limits.team_members)}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          currentSubscription.usage.team_members,
                          currentSubscription.limits.team_members
                        )}
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-zinc-400">
                          <Zap className="h-4 w-4" />
                          {t('billing.subscription.aiAssistants')}
                        </span>
                        <span className="text-white">
                          {currentSubscription.usage.ai_assistants} /{' '}
                          {formatLimit(currentSubscription.limits.ai_assistants)}
                        </span>
                      </div>
                      <Progress
                        value={getUsagePercentage(
                          currentSubscription.usage.ai_assistants,
                          currentSubscription.limits.ai_assistants
                        )}
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>

                {!currentSubscription.cancel_at_period_end && (
                  <Button
                    variant="outline"
                    className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={handleCancelSubscription}
                  >
                    {t('billing.subscription.cancel')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Available Plans */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">{t('billing.subscription.availablePlans')}</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {plans.map((plan) => {
                const isCurrentPlan = currentSubscription?.plan_id === plan.id;
                const isUpgrade =
                  currentSubscription &&
                  plans.findIndex((p) => p.id === currentSubscription.plan_id) <
                    plans.findIndex((p) => p.id === plan.id);

                return (
                  <Card
                    key={plan.id}
                    className={`relative border-zinc-800 bg-zinc-900 ${
                      plan.recommended ? 'ring-2 ring-emerald-500' : ''
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                        <Badge className="bg-emerald-500 text-white">{t('billing.subscription.recommended')}</Badge>
                      </div>
                    )}

                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        {plan.name}
                        {plan.id === 'enterprise' && <Building className="h-5 w-5" />}
                        {plan.id === 'growth' && <Crown className="h-5 w-5 text-emerald-400" />}
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        {plan.description}
                      </CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-white">${plan.price}</span>
                        <span className="text-zinc-400">/{t(`billing.subscription.${plan.interval}`)}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                            <span className="text-zinc-300">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {isCurrentPlan ? (
                        <Button className="w-full bg-zinc-800 text-zinc-400" disabled>
                          {t('billing.subscription.currentPlan')}
                        </Button>
                      ) : (
                        <Button
                          className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={processingPlanId === plan.id}
                        >
                          {processingPlanId === plan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              {isUpgrade ? t('billing.subscription.upgradeTo', { plan: plan.name }) : t('billing.subscription.switchTo', { plan: plan.name })}
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">{t('billing.payment.title')}</CardTitle>
                  <CardDescription className="text-zinc-400">
                    {t('billing.payment.description')}
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddPaymentMethod}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {t('billing.payment.addMethod')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="py-8 text-center">
                  <CreditCard className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
                  <p className="text-zinc-400">{t('billing.payment.noMethods')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-800 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-8 w-8 text-zinc-400" />
                        <div>
                          <p className="font-medium text-white">
                            {method.brand} •••• {method.last4}
                          </p>
                          <p className="text-sm text-zinc-400">
                            {t('billing.payment.expires', { month: method.exp_month, year: method.exp_year })}
                          </p>
                        </div>
                        {method.is_default && (
                          <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                            {t('billing.payment.default')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          >
                            {t('billing.payment.setDefault')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemovePaymentMethod(method.id)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          {t('billing.payment.remove')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">{t('billing.history.title')}</CardTitle>
              <CardDescription className="text-zinc-400">
                {t('billing.history.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billingHistory.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
                  <p className="text-zinc-400">{t('billing.history.noHistory')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-800 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`rounded-lg p-2 ${
                            item.status === 'paid' ? 'bg-emerald-500/20' : 'bg-yellow-500/20'
                          }`}
                        >
                          <BarChart3
                            className={`h-5 w-5 ${
                              item.status === 'paid' ? 'text-emerald-400' : 'text-yellow-400'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-white">{item.description}</p>
                          <p className="text-sm text-zinc-400">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-white">${item.amount.toFixed(2)}</p>
                          <Badge
                            className={`${
                              item.status === 'paid'
                                ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                                : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {t(`billing.history.status.${item.status}`)}
                          </Badge>
                        </div>
                        {item.invoice_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(item.invoice_url, '_blank')}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;
