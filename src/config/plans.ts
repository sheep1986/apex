/**
 * Trinity Platform — Plan Tier Configuration
 * Single source of truth for pricing, limits, and features.
 *
 * Stripe Price IDs are loaded from environment variables at runtime
 * in Netlify Functions. Frontend uses this for display only.
 */

export interface PlanTier {
  id: 'starter' | 'growth' | 'business' | 'enterprise';
  name: string;
  monthlyPrice: number;
  includedMinutes: number;
  includedPhoneNumbers: number;
  maxAssistants: number; // -1 = unlimited
  maxConcurrentCalls: number;
  maxUsers: number; // -1 = unlimited
  overagePerMinute: number;
  features: string[];
  popular?: boolean;
  contactSales?: boolean;
}

export const PLAN_TIERS: PlanTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 199,
    includedMinutes: 1_000,
    includedPhoneNumbers: 1,
    maxAssistants: 3,
    maxConcurrentCalls: 2,
    maxUsers: 3,
    overagePerMinute: 0.15,
    features: [
      '1,000 AI call minutes',
      '1 dedicated phone number',
      '3 AI assistants',
      'Call recording & transcripts',
      'Live call monitoring',
      'Basic analytics',
      'Email support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 599,
    includedMinutes: 5_000,
    includedPhoneNumbers: 5,
    maxAssistants: 10,
    maxConcurrentCalls: 5,
    maxUsers: 10,
    overagePerMinute: 0.12,
    popular: true,
    features: [
      '5,000 AI call minutes',
      '5 dedicated phone numbers',
      '10 AI assistants',
      'Call transfer to human agents',
      'Lead distribution & CRM',
      'SMS & email sequences',
      'Campaign management',
      'Advanced analytics & reporting',
      'Priority support',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 1_499,
    includedMinutes: 15_000,
    includedPhoneNumbers: 15,
    maxAssistants: 25,
    maxConcurrentCalls: 20,
    maxUsers: 50,
    overagePerMinute: 0.10,
    features: [
      '15,000 AI call minutes',
      '15 dedicated phone numbers',
      '25 AI assistants',
      'Everything in Growth',
      'Multi-agent squads',
      'Custom tool integrations',
      'Data cleansing & enrichment',
      'Manager dashboards & daily reports',
      'Dedicated account manager',
      'SLA guarantee',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 0, // custom pricing
    includedMinutes: -1, // negotiated
    includedPhoneNumbers: -1,
    maxAssistants: -1,
    maxConcurrentCalls: -1,
    maxUsers: -1,
    overagePerMinute: 0,
    contactSales: true,
    features: [
      'Unlimited AI call minutes',
      'Unlimited phone numbers',
      'Unlimited AI assistants',
      'Everything in Business',
      'White-label branding',
      'Multi-lingual support',
      'Custom integrations & API access',
      'On-premise deployment option',
      'Dedicated infrastructure',
      '24/7 premium support',
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getPlanById(planId: string): PlanTier | undefined {
  return PLAN_TIERS.find((p) => p.id === planId);
}

export function getDefaultPlan(): PlanTier {
  return PLAN_TIERS[0]; // starter
}

export function getPlanLimits(planId: string) {
  const plan = getPlanById(planId) || getDefaultPlan();
  return {
    includedMinutes: plan.includedMinutes,
    maxPhoneNumbers: plan.includedPhoneNumbers,
    maxAssistants: plan.maxAssistants,
    maxConcurrentCalls: plan.maxConcurrentCalls,
    maxUsers: plan.maxUsers,
    overagePerMinute: plan.overagePerMinute,
  };
}

/**
 * Returns Stripe price IDs from environment variables.
 * Only usable in Netlify Functions (server-side).
 */
export function getStripePriceIds() {
  return {
    starter: process.env.STRIPE_PRICE_STARTER || '',
    growth: process.env.STRIPE_PRICE_GROWTH || '',
    business: process.env.STRIPE_PRICE_BUSINESS || '',
    // Metered prices for overage billing
    overage_starter: process.env.STRIPE_OVERAGE_STARTER || '',
    overage_growth: process.env.STRIPE_OVERAGE_GROWTH || '',
    overage_business: process.env.STRIPE_OVERAGE_BUSINESS || '',
  };
}
