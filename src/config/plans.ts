/**
 * Trinity Platform — Plan Tier Configuration
 * Single source of truth for pricing, limits, and features.
 *
 * Pricing model: "AI Employees" — each tier provides a number of AI employees,
 * backed by a credit-based billing engine underneath.
 *
 * Stripe Price IDs are loaded from environment variables at runtime
 * in Netlify Functions. Frontend uses this for display only.
 */

export interface PlanTier {
  id: 'employee_1' | 'employee_3' | 'employee_5' | 'enterprise';
  name: string;
  displayName: string;
  aiEmployees: number;
  monthlyPriceGBP: number;
  includedCredits: number;
  // Backward compat + display helpers
  equivalentBudgetMinutes: number;
  equivalentStandardMinutes: number;
  includedPhoneNumbers: number;
  maxAssistants: number;
  maxConcurrentCalls: number;
  maxUsers: number;
  overageCreditPrice: number; // £ per credit for overage
  features: string[];
  popular?: boolean;
  contactSales?: boolean;
}

export const PLAN_TIERS: PlanTier[] = [
  {
    id: 'employee_1',
    name: 'Starter',
    displayName: '1 AI Employee',
    aiEmployees: 1,
    monthlyPriceGBP: 2_500,
    includedCredits: 200_000,
    equivalentBudgetMinutes: 11_111,
    equivalentStandardMinutes: 6_667,
    includedPhoneNumbers: 3,
    maxAssistants: 5,
    maxConcurrentCalls: 5,
    maxUsers: 5,
    overageCreditPrice: 0.012,
    features: [
      'CRM + Pipeline',
      'Campaigns + Sequences',
      'SMS + Email Follow-up',
      'Call Recording + Transcription',
      'Analytics Dashboard',
      'Up to 500 calls/day',
      '24/7 availability',
    ],
  },
  {
    id: 'employee_3',
    name: 'Growth',
    displayName: '3 AI Employees',
    aiEmployees: 3,
    monthlyPriceGBP: 6_500,
    includedCredits: 650_000,
    equivalentBudgetMinutes: 36_111,
    equivalentStandardMinutes: 21_667,
    includedPhoneNumbers: 8,
    maxAssistants: 15,
    maxConcurrentCalls: 15,
    maxUsers: 15,
    overageCreditPrice: 0.011,
    popular: true,
    features: [
      'Everything in Starter',
      'Webhooks + API',
      'Advanced Analytics',
      'Priority Support',
      'Up to 1,500 calls/day',
    ],
  },
  {
    id: 'employee_5',
    name: 'Business',
    displayName: '5 AI Employees',
    aiEmployees: 5,
    monthlyPriceGBP: 10_000,
    includedCredits: 1_100_000,
    equivalentBudgetMinutes: 61_111,
    equivalentStandardMinutes: 36_667,
    includedPhoneNumbers: 15,
    maxAssistants: 30,
    maxConcurrentCalls: 25,
    maxUsers: 50,
    overageCreditPrice: 0.010,
    features: [
      'Everything in Growth',
      'White-label Branding',
      'Dedicated Account Manager',
      'Premium AI Training',
      'Custom Integrations',
      'Up to 2,500 calls/day',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    displayName: '10+ AI Employees',
    aiEmployees: 10,
    monthlyPriceGBP: 0,
    includedCredits: 0,
    equivalentBudgetMinutes: 0,
    equivalentStandardMinutes: 0,
    includedPhoneNumbers: 0,
    maxAssistants: -1,
    maxConcurrentCalls: -1,
    maxUsers: -1,
    overageCreditPrice: 0,
    contactSales: true,
    features: [
      'Everything in Business',
      'Bespoke AI Training',
      'Custom SLA',
      'Volume Pricing',
      'Dedicated Infrastructure',
      '24/7 Premium Support',
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getPlanById(planId: string): PlanTier | undefined {
  return PLAN_TIERS.find((p) => p.id === planId);
}

export function getDefaultPlan(): PlanTier {
  return PLAN_TIERS[0];
}

export function getPlanLimits(planId: string) {
  const plan = getPlanById(planId) || getDefaultPlan();
  return {
    includedCredits: plan.includedCredits,
    aiEmployees: plan.aiEmployees,
    maxPhoneNumbers: plan.includedPhoneNumbers,
    maxAssistants: plan.maxAssistants,
    maxConcurrentCalls: plan.maxConcurrentCalls,
    maxUsers: plan.maxUsers,
    overageCreditPrice: plan.overageCreditPrice,
    // Legacy compat
    includedMinutes: plan.equivalentStandardMinutes,
    overagePerMinute: plan.overageCreditPrice * 30, // approx for display
  };
}

/**
 * Format credit amount as a human-readable capacity percentage.
 * e.g., 150,000 of 200,000 = "75% capacity"
 */
export function formatCapacity(creditsUsed: number, creditsIncluded: number): string {
  if (creditsIncluded <= 0) return '0%';
  const pct = Math.round((creditsUsed / creditsIncluded) * 100);
  return `${Math.min(pct, 100)}%`;
}

/**
 * Convert credits to approximate minutes for a given voice tier.
 */
export function creditsToMinutes(credits: number, creditsPerMinute: number = 30): number {
  if (creditsPerMinute <= 0) return 0;
  return Math.round(credits / creditsPerMinute);
}

/**
 * Returns Stripe price IDs from environment variables.
 * Only usable in Netlify Functions (server-side).
 */
export function getStripePriceIds() {
  return {
    employee_1: process.env.STRIPE_PRICE_EMPLOYEE_1 || '',
    employee_3: process.env.STRIPE_PRICE_EMPLOYEE_3 || '',
    employee_5: process.env.STRIPE_PRICE_EMPLOYEE_5 || '',
  };
}
