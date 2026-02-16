/**
 * Trinity Platform — Credit Rate Configuration
 *
 * Defines the credit-per-unit rates for all billable actions.
 * The authoritative source lives in the `credit_rates` DB table;
 * this file provides frontend display data + tier classification logic.
 *
 * Credits are the internal billing engine. Customers see "AI Employee capacity."
 */

// ── Voice Tier Definitions ───────────────────────────────────────────────────

export type VoiceTier = 'budget' | 'standard' | 'premium' | 'ultra';

export interface VoiceTierConfig {
  tier: VoiceTier;
  label: string;
  creditsPerMinute: number;
  cogsPerMinute: number;  // £ COGS
  description: string;
}

export const VOICE_TIERS: Record<VoiceTier, VoiceTierConfig> = {
  budget: {
    tier: 'budget',
    label: 'Budget',
    creditsPerMinute: 18,
    cogsPerMinute: 0.07,
    description: 'Gemini Flash — Fast, cost-effective',
  },
  standard: {
    tier: 'standard',
    label: 'Standard',
    creditsPerMinute: 30,
    cogsPerMinute: 0.12,
    description: 'GPT-4o — Balanced quality & speed',
  },
  premium: {
    tier: 'premium',
    label: 'Premium',
    creditsPerMinute: 35,
    cogsPerMinute: 0.14,
    description: 'GPT-4o + ElevenLabs — Superior voice quality',
  },
  ultra: {
    tier: 'ultra',
    label: 'Ultra',
    creditsPerMinute: 40,
    cogsPerMinute: 0.16,
    description: 'Claude Sonnet + ElevenLabs — Maximum intelligence',
  },
};

// ── Action Rates ─────────────────────────────────────────────────────────────

export interface ActionRate {
  actionType: string;
  credits: number;
  unit: string;
  label: string;
}

export const ACTION_RATES: ActionRate[] = [
  { actionType: 'sms', credits: 3, unit: 'message', label: 'SMS' },
  { actionType: 'email', credits: 1, unit: 'message', label: 'Email' },
  { actionType: 'phone_number', credits: 200, unit: 'month', label: 'Phone Number' },
];

// ── Model → Tier Classification ──────────────────────────────────────────────

const MODEL_TIER_MAP: Record<string, VoiceTier> = {
  // Budget
  'gemini-1.5-flash': 'budget',
  'gemini-2.0-flash': 'budget',
  'gemini-2.5-flash': 'budget',
  'gpt-3.5-turbo': 'budget',
  'llama-3.1-8b-instant': 'budget',
  'mixtral-8x7b-32768': 'budget',

  // Standard
  'gpt-4o': 'standard',
  'gpt-4o-mini': 'standard',
  'gpt-4-turbo': 'standard',
  'gemini-1.5-pro': 'standard',
  'gemini-2.5-pro': 'standard',
  'llama-3.1-70b-versatile': 'standard',

  // Premium
  'claude-3-5-sonnet-20241022': 'premium',
  'claude-3-haiku-20240307': 'premium',
  'claude-3-5-haiku-20241022': 'premium',

  // Ultra
  'claude-3-opus-20240229': 'ultra',
  'claude-3-5-sonnet-latest': 'ultra',
  'claude-sonnet-4-20250514': 'ultra',
};

const VOICE_PROVIDER_TIER_MAP: Record<string, VoiceTier> = {
  // Budget
  'deepgram': 'budget',
  'rime-ai': 'budget',
  'playht': 'budget',

  // Standard
  'openai': 'standard',
  'azure': 'standard',
  'cartesia': 'standard',

  // Premium
  '11labs': 'premium',
  'elevenlabs': 'premium',
};

// ── Classification Functions ─────────────────────────────────────────────────

const TIER_RANK: Record<VoiceTier, number> = {
  budget: 0,
  standard: 1,
  premium: 2,
  ultra: 3,
};

/**
 * Classify an assistant's voice tier based on its model and voice provider.
 * The tier is the MAX of (model tier, voice provider tier).
 * e.g., GPT-4o (standard) + ElevenLabs (premium) = premium.
 */
export function classifyAssistantTier(
  model?: string,
  voiceProvider?: string,
): VoiceTier {
  const modelTier = model ? (MODEL_TIER_MAP[model] || 'standard') : 'standard';
  const voiceTier = voiceProvider ? (VOICE_PROVIDER_TIER_MAP[voiceProvider.toLowerCase()] || 'budget') : 'budget';

  return TIER_RANK[modelTier] >= TIER_RANK[voiceTier] ? modelTier : voiceTier;
}

/**
 * Get credits per minute for a voice tier.
 */
export function getCreditsPerMinute(tier: VoiceTier): number {
  return VOICE_TIERS[tier].creditsPerMinute;
}

/**
 * Calculate credits for a call given duration and tier.
 */
export function calculateCallCredits(durationSeconds: number, tier: VoiceTier): number {
  const minutes = durationSeconds / 60;
  return Math.ceil(minutes * VOICE_TIERS[tier].creditsPerMinute);
}

/**
 * Get a friendly description of the credit cost.
 * e.g., "30 credits/min (Standard)"
 */
export function formatCreditRate(tier: VoiceTier): string {
  const config = VOICE_TIERS[tier];
  return `${config.creditsPerMinute} credits/min (${config.label})`;
}

/**
 * Convert credits to approximate minutes for display.
 */
export function creditsToMinutes(credits: number, tier: VoiceTier = 'standard'): number {
  const cpm = VOICE_TIERS[tier].creditsPerMinute;
  if (cpm <= 0) return 0;
  return Math.floor(credits / cpm);
}

/**
 * Get the action type string for the credit_rates table lookup.
 */
export function getVoiceActionType(tier: VoiceTier): string {
  return `voice_${tier}`;
}
