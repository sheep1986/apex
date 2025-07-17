interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface BillingHistory {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'charge' | 'credit' | 'refund';
  status: 'pending' | 'completed' | 'failed';
  invoiceUrl?: string;
}

interface UsageMetrics {
  currentPeriod: {
    callsCount: number;
    minutesUsed: number;
    creditsSpent: number;
    startDate: Date;
    endDate: Date;
  };
  previousPeriod: {
    callsCount: number;
    minutesUsed: number;
    creditsSpent: number;
  };
  dailyUsage: Array<{
    date: Date;
    calls: number;
    minutes: number;
    credits: number;
  }>;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
  recommended?: boolean;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus?: number;
  popular?: boolean;
}

class BillingService {
  private readonly API_BASE = '/api/billing';

  // Get current billing information
  async getBillingInfo(): Promise<{
    currentBalance: number;
    monthlyCredits: number;
    usedCredits: number;
    nextBillingDate: Date;
    currentPlan: string;
  }> {
    try {
      // In production, this would fetch from your backend
      return {
        currentBalance: 247.5,
        monthlyCredits: 1000,
        usedCredits: 325,
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        currentPlan: 'professional',
      };
    } catch (error) {
      console.error('Error fetching billing info:', error);
      throw error;
    }
  }

  // Get available pricing plans
  async getPricingPlans(): Promise<PricingPlan[]> {
    return [
      {
        id: 'starter',
        name: 'Starter',
        description: 'Perfect for small businesses getting started',
        price: 50,
        credits: 67, // ~$0.75 per call
        features: [
          '67 AI calls per month',
          'Basic call analytics',
          'Email support',
          'Standard integrations',
          '1 AI assistant',
        ],
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Ideal for growing businesses',
        price: 200,
        credits: 267, // ~$0.75 per call
        features: [
          '267 AI calls per month',
          'Advanced analytics & reporting',
          'Priority support',
          'Custom integrations',
          'Up to 5 AI assistants',
          'Call recording & transcription',
          'CRM integrations',
        ],
        popular: true,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations with high volume',
        price: 500,
        credits: 667, // ~$0.75 per call
        features: [
          '667 AI calls per month',
          'Real-time dashboards',
          'Dedicated success manager',
          'White-label options',
          'Unlimited AI assistants',
          'Advanced automation',
          'Custom reporting',
          'SLA guarantee',
        ],
        recommended: true,
      },
    ];
  }

  // Get credit packages for top-ups
  async getCreditPackages(): Promise<CreditPackage[]> {
    return [
      {
        id: 'credits_50',
        name: '67 Credits',
        credits: 67,
        price: 50,
        popular: false,
      },
      {
        id: 'credits_100',
        name: '133 Credits',
        credits: 133,
        price: 100,
        bonus: 7, // 5% bonus
        popular: true,
      },
      {
        id: 'credits_250',
        name: '333 Credits',
        credits: 333,
        price: 250,
        bonus: 17, // 7% bonus
        popular: false,
      },
      {
        id: 'credits_500',
        name: '700 Credits',
        credits: 700,
        price: 500,
        bonus: 33, // 10% bonus
        popular: false,
      },
    ];
  }

  // Purchase credits
  async purchaseCredits(
    packageId: string,
    paymentMethodId?: string
  ): Promise<{
    success: boolean;
    transactionId?: string;
    newBalance: number;
  }> {
    try {
      console.log(`Purchasing credit package: ${packageId}`);

      // In production, this would process the payment through Stripe/etc
      const packages = await this.getCreditPackages();
      const selectedPackage = packages.find((p) => p.id === packageId);

      if (!selectedPackage) {
        throw new Error('Invalid credit package');
      }

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful transaction
      const transactionId = `txn_${Math.random().toString(36).substr(2, 9)}`;
      const creditsAdded = selectedPackage.credits + (selectedPackage.bonus || 0);

      console.log(`✅ Credits purchased successfully: +${creditsAdded} credits`);

      return {
        success: true,
        transactionId,
        newBalance: 247.5 + creditsAdded * 0.75, // Assuming $0.75 per credit
      };
    } catch (error) {
      console.error('Error purchasing credits:', error);
      return {
        success: false,
        newBalance: 247.5,
      };
    }
  }

  // Change subscription plan
  async changePlan(planId: string): Promise<{
    success: boolean;
    effectiveDate: Date;
    prorationAmount?: number;
  }> {
    try {
      console.log(`Changing plan to: ${planId}`);

      // In production, this would update the subscription
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const plans = await this.getPricingPlans();
      const newPlan = plans.find((p) => p.id === planId);

      if (!newPlan) {
        throw new Error('Invalid plan');
      }

      return {
        success: true,
        effectiveDate: new Date(),
        prorationAmount: 0, // Would calculate proration in production
      };
    } catch (error) {
      console.error('Error changing plan:', error);
      throw error;
    }
  }

  // Get payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return [
      {
        id: 'pm_1234567890',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true,
      },
      {
        id: 'pm_0987654321',
        type: 'card',
        last4: '1234',
        brand: 'mastercard',
        expiryMonth: 8,
        expiryYear: 2026,
        isDefault: false,
      },
    ];
  }

  // Add payment method
  async addPaymentMethod(paymentData: {
    type: 'card';
    cardNumber: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
    name: string;
  }): Promise<PaymentMethod> {
    try {
      console.log('Adding new payment method...');

      // In production, this would tokenize the card with Stripe
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newPaymentMethod: PaymentMethod = {
        id: `pm_${Math.random().toString(36).substr(2, 9)}`,
        type: paymentData.type,
        last4: paymentData.cardNumber.slice(-4),
        brand: 'visa', // Would be detected by payment processor
        expiryMonth: paymentData.expiryMonth,
        expiryYear: paymentData.expiryYear,
        isDefault: false,
      };

      console.log('✅ Payment method added successfully');
      return newPaymentMethod;
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      console.log(`Setting default payment method: ${paymentMethodId}`);

      // In production, this would update in your backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('✅ Default payment method updated');
    } catch (error) {
      console.error('Error setting default payment method:', error);
      throw error;
    }
  }

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      console.log(`Removing payment method: ${paymentMethodId}`);

      // In production, this would remove from Stripe and your backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('✅ Payment method removed');
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw error;
    }
  }

  // Get billing history
  async getBillingHistory(): Promise<BillingHistory[]> {
    const now = new Date();
    return [
      {
        id: 'inv_001',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        description: 'Credit Top-up - 133 Credits',
        amount: 100,
        type: 'charge',
        status: 'completed',
        invoiceUrl: '/invoices/inv_001.pdf',
      },
      {
        id: 'inv_002',
        date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        description: 'Professional Plan - Monthly',
        amount: 200,
        type: 'charge',
        status: 'completed',
        invoiceUrl: '/invoices/inv_002.pdf',
      },
      {
        id: 'inv_003',
        date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        description: 'Credit Bonus',
        amount: 15,
        type: 'credit',
        status: 'completed',
      },
      {
        id: 'inv_004',
        date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        description: 'Starter Plan - Monthly',
        amount: 50,
        type: 'charge',
        status: 'completed',
        invoiceUrl: '/invoices/inv_004.pdf',
      },
    ];
  }

  // Get usage metrics
  async getUsageMetrics(): Promise<UsageMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Generate daily usage data for the current month
    const dailyUsage = [];
    for (let i = 1; i <= now.getDate(); i++) {
      const date = new Date(now.getFullYear(), now.getMonth(), i);
      dailyUsage.push({
        date,
        calls: Math.floor(Math.random() * 15) + 5, // Random calls between 5-20
        minutes: Math.floor(Math.random() * 150) + 50, // Random minutes
        credits: Math.floor(Math.random() * 15) + 5, // Random credits
      });
    }

    return {
      currentPeriod: {
        callsCount: 325,
        minutesUsed: 2847,
        creditsSpent: 325,
        startDate: startOfMonth,
        endDate: endOfMonth,
      },
      previousPeriod: {
        callsCount: 289,
        minutesUsed: 2456,
        creditsSpent: 289,
      },
      dailyUsage,
    };
  }

  // Calculate cost estimate
  calculateCallCost(duration: number, callType: 'outbound' | 'inbound' = 'outbound'): number {
    // Base cost per minute
    const baseRate = 0.75; // $0.75 per call regardless of duration
    const perMinuteRate = 0.05; // Additional $0.05 per minute after first minute

    if (duration <= 1) {
      return baseRate;
    }

    return baseRate + (duration - 1) * perMinuteRate;
  }

  // Setup auto-recharge
  async setupAutoRecharge(config: {
    enabled: boolean;
    threshold: number; // Credits remaining to trigger recharge
    amount: number; // Amount to recharge in dollars
    paymentMethodId: string;
  }): Promise<void> {
    try {
      console.log('Setting up auto-recharge:', config);

      // In production, this would save to your backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log('✅ Auto-recharge configured');
    } catch (error) {
      console.error('Error setting up auto-recharge:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(reason?: string): Promise<{
    success: boolean;
    effectiveDate: Date;
  }> {
    try {
      console.log('Canceling subscription:', reason);

      // In production, this would cancel in Stripe and your backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return {
        success: true,
        effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Generate invoice
  async downloadInvoice(invoiceId: string): Promise<Blob> {
    try {
      // In production, this would fetch the actual invoice PDF
      const response = await fetch(`/api/invoices/${invoiceId}`);
      return await response.blob();
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  // Format credits
  formatCredits(credits: number): string {
    return `${credits.toLocaleString()} credits`;
  }
}

export const billingService = new BillingService();
export type { PaymentMethod, BillingHistory, UsageMetrics, PricingPlan, CreditPackage };
