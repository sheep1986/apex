import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Scheduled function — runs every 15 minutes
// Check minutes usage thresholds and credit balance levels

interface OrgUsage {
  id: string;
  name: string;
  credit_balance: number;
  included_minutes: number;
  subscription_period_start: string | null;
  billing_email: string | null;
}

async function checkMinutesThresholds(org: OrgUsage, minutesUsed: number) {
  if (!org.included_minutes || org.included_minutes <= 0) return;

  const percentUsed = (minutesUsed / org.included_minutes) * 100;
  const thresholds = [
    { percent: 50, type: 'minutes_50' },
    { percent: 75, type: 'minutes_75' },
    { percent: 90, type: 'minutes_90' },
    { percent: 100, type: 'minutes_100' },
  ];

  for (const threshold of thresholds) {
    if (percentUsed >= threshold.percent) {
      // Check if already sent for this period
      const { data: existing } = await supabase
        .from('usage_alerts_sent')
        .select('id')
        .eq('organization_id', org.id)
        .eq('alert_type', threshold.type)
        .eq('period_start', org.subscription_period_start || '')
        .maybeSingle();

      if (!existing) {
        // Insert dedup record
        await supabase.from('usage_alerts_sent').insert({
          organization_id: org.id,
          alert_type: threshold.type,
          threshold_value: threshold.percent,
          period_start: org.subscription_period_start,
        });

        // Insert notification for the real-time notification system
        await supabase.from('notifications_server').insert({
          organization_id: org.id,
          type: threshold.percent >= 100 ? 'warning' : 'info',
          title: `Minutes Usage: ${Math.round(percentUsed)}%`,
          message: `You've used ${minutesUsed.toLocaleString()} of ${org.included_minutes.toLocaleString()} included minutes (${Math.round(percentUsed)}%). ${
            threshold.percent >= 100 ? 'Additional usage will be charged at your overage rate.' : 'Consider upgrading your plan or adding credits.'
          }`,
          category: 'billing',
          priority: threshold.percent >= 90 ? 'high' : 'medium',
        }).then(() => {}).catch(() => {});
      }
    }
  }
}

async function checkBalanceLevels(org: OrgUsage) {
  const balanceLevels = [
    { amount: 50, type: 'balance_50', severity: 'low' },
    { amount: 20, type: 'balance_20', severity: 'medium' },
    { amount: 10, type: 'balance_10', severity: 'high' },
    { amount: 2, type: 'balance_critical', severity: 'critical' },
  ];

  for (const level of balanceLevels) {
    if (org.credit_balance <= level.amount) {
      const { data: existing } = await supabase
        .from('usage_alerts_sent')
        .select('id')
        .eq('organization_id', org.id)
        .eq('alert_type', level.type)
        .eq('period_start', org.subscription_period_start || '')
        .maybeSingle();

      if (!existing) {
        await supabase.from('usage_alerts_sent').insert({
          organization_id: org.id,
          alert_type: level.type,
          threshold_value: level.amount,
          period_start: org.subscription_period_start,
        });

        await supabase.from('notifications_server').insert({
          organization_id: org.id,
          type: level.severity === 'critical' ? 'error' : 'warning',
          title: `Low Credit Balance: $${org.credit_balance.toFixed(2)}`,
          message: `Your credit balance is ${org.credit_balance <= 2 ? 'critically low' : 'running low'}. ${
            org.credit_balance <= 2
              ? 'Calls may be interrupted. Top up immediately or enable auto-recharge.'
              : 'Consider topping up to avoid service interruption.'
          }`,
          category: 'billing',
          priority: level.severity === 'critical' ? 'high' : 'medium',
        }).then(() => {}).catch(() => {});
      }
      break; // Only alert for the lowest triggered threshold
    }
  }
}

export const handler: Handler = async () => {
  try {
    // Get all active organizations
    const { data: orgs, error } = await supabase
      .from('organizations')
      .select('id, name, credit_balance, included_minutes, subscription_period_start, billing_email')
      .eq('status', 'active');

    if (error || !orgs) {
      console.error('Failed to fetch organizations:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch organizations' }) };
    }

    let alertsSent = 0;

    for (const org of orgs) {
      // Get current period usage
      const { data: usage } = await supabase
        .from('subscription_usage')
        .select('minutes_used')
        .eq('organization_id', org.id)
        .order('period_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      const minutesUsed = usage?.minutes_used || 0;

      await checkMinutesThresholds(org, minutesUsed);
      await checkBalanceLevels(org);
      alertsSent++;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, orgsChecked: orgs.length }),
    };
  } catch (err) {
    console.error('Usage monitor error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
