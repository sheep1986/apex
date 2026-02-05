import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import {
    AlertCircle,
    BarChart3,
    Clock,
    CreditCard,
    Download,
    Loader2,
    Phone,
    Users,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

// Plans with static English features
const getPlanFeatures = (planId: string, limits: any) => {
  switch (planId) {
    case 'starter':
      return [
        '1,000 monthly calls',
        '3 team members',
        '2 AI assistants',
        '1 phone number',
        'Basic analytics',
        'Email support',
      ];
    case 'growth':
      return [
        '10,000 monthly calls',
        '10 team members',
        '10 AI assistants',
        '5 phone numbers',
        'Advanced analytics',
        'Priority support',
        'Third-party integrations',
      ];
    case 'enterprise':
      return [
        'Unlimited calls',
        'Unlimited team members',
        'Unlimited AI assistants',
        'Unlimited phone numbers',
        'Enterprise analytics',
        '24/7 premium support',
        'Custom SLA',
        'Custom features',
      ];
    default:
      return [];
  }
};

const getPlans = (): SubscriptionPlan[] => [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    price: 99,
    interval: 'month',
    features: getPlanFeatures('starter', { monthly_calls: 1000, team_members: 3, ai_assistants: 2, phone_numbers: 1 }),
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
    name: 'Growth',
    description: 'Scale your business with advanced features',
    price: 299,
    interval: 'month',
    recommended: true,
    features: getPlanFeatures('growth', { monthly_calls: 10000, team_members: 10, ai_assistants: 10, phone_numbers: 5 }),
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
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    price: 999,
    interval: 'month',
    features: getPlanFeatures('enterprise', { monthly_calls: -1, team_members: -1, ai_assistants: -1, phone_numbers: -1 }),
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
      toast.error('Failed to load billing data. Please try again.');
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
        toast.success('Subscription upgraded successfully!');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      toast.error('Failed to upgrade subscription. Please try again.');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      await apiClient.post('/api/billing/cancel');
      await fetchBillingData();
      toast.success('Subscription cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription. Please try again.');
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
      toast.error('Failed to add payment method. Please try again.');
    }
  };

  const handleRemovePaymentMethod = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/billing/payment-method/${methodId}`);
      await fetchBillingData();
      toast.success('Payment method removed successfully.');
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error('Failed to remove payment method. Please try again.');
    }
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    try {
      await apiClient.post(`/api/billing/payment-method/${methodId}/default`);
      await fetchBillingData();
      toast.success('Default payment method updated.');
    } catch (error) {
      console.error('Error updating default payment method:', error);
      toast.error('Failed to update default payment method.');
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const plans = getPlans();

  return (
    <div className="w-full space-y-6 px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <p className="text-zinc-400">
          Manage your subscription and billing settings
        </p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList className="border-zinc-800 bg-zinc-900">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          {/* Current Subscription */}
          {currentSubscription && (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Current Subscription</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Your current subscription details and usage
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
                      {currentSubscription.plan_name} Plan
                    </h3>
                    <p className="text-zinc-400">
                      Renews on {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                  {currentSubscription.cancel_at_period_end && (
                    <Alert className="border-red-500/30 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-400">
                        Your subscription will cancel at the end of the current period
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Usage Overview */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Usage This Period</h4>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-zinc-400">
                          <Phone className="h-4 w-4" />
                          AI Calls
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
                          Team Members
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
                          AI Assistants
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
                    Cancel Subscription
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Available Plans - HIDDEN for V1
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Available Plans</h3>
            ...
          </div> */}
          <Card className="border-zinc-800 bg-zinc-900">
             <CardHeader>
               <CardTitle className="text-white">Credit Balance</CardTitle>
               <CardDescription className="text-zinc-400">
                 Pay-as-you-go credit for AI calls.
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-white">$0.00</div>
               <p className="text-sm text-zinc-500 mt-2">Top-up functionality coming soon.</p>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Payment Methods</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Manage your payment methods and billing information
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddPaymentMethod}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Add Payment Method
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="py-8 text-center">
                  <CreditCard className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
                  <p className="text-zinc-400">No payment methods added yet</p>
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
                            Expires {method.exp_month}/{method.exp_year}
                          </p>
                        </div>
                        {method.is_default && (
                          <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                            Default
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
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemovePaymentMethod(method.id)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          Remove
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
              <CardTitle className="text-white">Billing History</CardTitle>
              <CardDescription className="text-zinc-400">
                View your past invoices and payment history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {billingHistory.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
                  <p className="text-zinc-400">No billing history available</p>
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
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
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
