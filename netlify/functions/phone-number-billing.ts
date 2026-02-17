import { createClient } from '@supabase/supabase-js';
import type { Handler } from '@netlify/functions';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CREDITS_PER_PHONE_NUMBER = 200;

/**
 * Phone Number Billing — Scheduled function
 *
 * Deducts 200 credits per active phone number per billing period.
 * Should be triggered monthly (e.g. by subscription renewal webhook or cron).
 *
 * Can be called:
 * 1. Via cron/scheduler for all orgs
 * 2. Via POST with { organizationId } for a specific org (e.g. on subscription renewal)
 */
export const handler: Handler = async (event) => {
  try {
    let targetOrgId: string | null = null;

    // If called with a specific org (e.g. from billing-webhook on renewal)
    if (event.body) {
      const body = JSON.parse(event.body);
      targetOrgId = body.organizationId || null;
    }

    // Query active phone numbers
    let query = supabase
      .from('phone_numbers')
      .select('id, number, organization_id')
      .eq('status', 'active');

    if (targetOrgId) {
      query = query.eq('organization_id', targetOrgId);
    }

    const { data: phoneNumbers, error: fetchError } = await query;

    if (fetchError) {
      console.error('[PhoneBilling] Failed to fetch phone numbers:', fetchError);
      return { statusCode: 500, body: JSON.stringify({ error: fetchError.message }) };
    }

    if (!phoneNumbers || phoneNumbers.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No active phone numbers to bill', processed: 0 }) };
    }

    // Group by organization
    const orgNumbers: Record<string, typeof phoneNumbers> = {};
    for (const pn of phoneNumbers) {
      if (!orgNumbers[pn.organization_id]) orgNumbers[pn.organization_id] = [];
      orgNumbers[pn.organization_id].push(pn);
    }

    let totalProcessed = 0;
    let totalCredits = 0;
    const results: { orgId: string; numbers: number; credits: number; success: boolean }[] = [];

    for (const [orgId, numbers] of Object.entries(orgNumbers)) {
      const creditsToDeduct = numbers.length * CREDITS_PER_PHONE_NUMBER;

      try {
        // Deduct credits via RPC
        const { error: creditError } = await supabase.rpc('record_credit_usage', {
          p_organization_id: orgId,
          p_credits: creditsToDeduct,
          p_action_type: 'phone_number',
          p_unit_count: numbers.length,
          p_description: `Phone number rental: ${numbers.length} number${numbers.length > 1 ? 's' : ''} x ${CREDITS_PER_PHONE_NUMBER} credits`,
          p_reference_id: `phone_billing_${new Date().toISOString().slice(0, 7)}`, // e.g. phone_billing_2026-02
        });

        if (creditError) {
          console.error(`[PhoneBilling] Failed to deduct credits for org ${orgId}:`, creditError);
          results.push({ orgId, numbers: numbers.length, credits: creditsToDeduct, success: false });
          continue;
        }

        totalProcessed += numbers.length;
        totalCredits += creditsToDeduct;
        results.push({ orgId, numbers: numbers.length, credits: creditsToDeduct, success: true });

        console.log(`[PhoneBilling] Org ${orgId}: ${numbers.length} numbers, ${creditsToDeduct} credits deducted`);
      } catch (err) {
        console.error(`[PhoneBilling] Error processing org ${orgId}:`, err);
        results.push({ orgId, numbers: numbers.length, credits: creditsToDeduct, success: false });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Phone number billing complete`,
        totalNumbers: totalProcessed,
        totalCredits,
        orgResults: results,
      }),
    };
  } catch (err: any) {
    console.error('[PhoneBilling] Unexpected error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
