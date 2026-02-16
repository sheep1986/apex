import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Scheduled Report Generator
 *
 * Runs on a schedule (daily at 8 AM UTC via Netlify Scheduled Functions)
 * or on-demand via POST with { reportId } to generate a single report.
 *
 * Checks all active scheduled_reports, determines which are due,
 * queries data, renders HTML email, and sends via Resend.
 */

// ─── Report Due Checking ─────────────────────────────────────────────

function isReportDue(report: any): boolean {
  const now = new Date();
  const lastSent = report.last_sent_at ? new Date(report.last_sent_at) : null;

  switch (report.frequency) {
    case 'daily': {
      // Due if never sent or last sent > 23 hours ago
      if (!lastSent) return true;
      return (now.getTime() - lastSent.getTime()) > 23 * 60 * 60 * 1000;
    }
    case 'weekly': {
      // Due if today is the configured day of week AND (never sent or > 6 days ago)
      const dayOfWeek = report.day_of_week ?? 1; // default Monday
      if (now.getUTCDay() !== dayOfWeek) return false;
      if (!lastSent) return true;
      return (now.getTime() - lastSent.getTime()) > 6 * 24 * 60 * 60 * 1000;
    }
    case 'monthly': {
      // Due if today is the configured day of month AND (never sent or > 27 days ago)
      const dayOfMonth = report.day_of_month ?? 1; // default 1st
      if (now.getUTCDate() !== dayOfMonth) return false;
      if (!lastSent) return true;
      return (now.getTime() - lastSent.getTime()) > 27 * 24 * 60 * 60 * 1000;
    }
    default:
      return false;
  }
}

// ─── Report Period Calculation ────────────────────────────────────────

function getReportPeriod(frequency: string): { start: Date; end: Date; label: string } {
  const end = new Date();
  const start = new Date();

  switch (frequency) {
    case 'daily':
      start.setDate(start.getDate() - 1);
      return { start, end, label: start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) };
    case 'weekly':
      start.setDate(start.getDate() - 7);
      return {
        start, end,
        label: `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      };
    case 'monthly':
      start.setMonth(start.getMonth() - 1);
      return {
        start, end,
        label: start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      };
    default:
      start.setDate(start.getDate() - 7);
      return { start, end, label: 'Past 7 days' };
  }
}

// ─── Data Queries ─────────────────────────────────────────────────────

interface ReportData {
  title: string;
  rows: { label: string; value: string }[];
}

async function queryUsageReport(orgId: string, start: Date, end: Date): Promise<ReportData> {
  const { data: org } = await supabase
    .from('organizations')
    .select('included_credits, credits_used_this_period, credit_balance, plan_tier_id, ai_employees')
    .eq('id', orgId)
    .single();

  const included = org?.included_credits || 0;
  const used = org?.credits_used_this_period || 0;
  const balance = org?.credit_balance || 0;
  const pct = included > 0 ? Math.round((used / included) * 100) : 0;

  return {
    title: 'Usage Report',
    rows: [
      { label: 'Plan', value: org?.plan_tier_id || 'N/A' },
      { label: 'AI Employees', value: String(org?.ai_employees || 0) },
      { label: 'Credits Used', value: `${used.toLocaleString()} / ${included.toLocaleString()}` },
      { label: 'Capacity Used', value: `${pct}%` },
      { label: 'Credit Balance (overage)', value: `£${balance.toFixed(2)}` },
    ],
  };
}

async function queryCallsReport(orgId: string, start: Date, end: Date): Promise<ReportData> {
  const { data: calls } = await supabase
    .from('voice_calls')
    .select('id, status, duration_seconds')
    .eq('organization_id', orgId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const total = calls?.length || 0;
  const completed = calls?.filter(c => c.status === 'ended').length || 0;
  const totalDuration = calls?.reduce((sum, c) => sum + (c.duration_seconds || 0), 0) || 0;
  const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    title: 'Call Activity Report',
    rows: [
      { label: 'Total Calls', value: String(total) },
      { label: 'Completed', value: String(completed) },
      { label: 'Completion Rate', value: `${completionRate}%` },
      { label: 'Total Duration', value: `${Math.round(totalDuration / 60)} minutes` },
      { label: 'Average Duration', value: `${avgDuration} seconds` },
    ],
  };
}

async function queryCampaignsReport(orgId: string, start: Date, end: Date): Promise<ReportData> {
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, status')
    .eq('organization_id', orgId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const total = campaigns?.length || 0;
  const active = campaigns?.filter(c => c.status === 'running').length || 0;
  const completed = campaigns?.filter(c => c.status === 'completed').length || 0;

  // Get campaign item counts
  const campaignIds = campaigns?.map(c => c.id) || [];
  let contactsReached = 0;
  if (campaignIds.length > 0) {
    const { count } = await supabase
      .from('campaign_items')
      .select('id', { count: 'exact', head: true })
      .in('campaign_id', campaignIds)
      .eq('status', 'completed');
    contactsReached = count || 0;
  }

  return {
    title: 'Campaign Performance Report',
    rows: [
      { label: 'Total Campaigns', value: String(total) },
      { label: 'Active', value: String(active) },
      { label: 'Completed', value: String(completed) },
      { label: 'Contacts Reached', value: String(contactsReached) },
    ],
  };
}

async function queryBillingReport(orgId: string, start: Date, end: Date): Promise<ReportData> {
  const { data: org } = await supabase
    .from('organizations')
    .select('credit_balance, plan_tier_id, included_credits, credits_used_this_period, overage_credit_price')
    .eq('id', orgId)
    .single();

  const { data: ledger } = await supabase
    .from('credits_ledger')
    .select('credits, entry_type')
    .eq('organization_id', orgId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  const totalCreditsUsed = ledger?.filter(e => e.entry_type === 'usage').reduce((s, e) => s + (e.credits || 0), 0) || 0;
  const totalTopUps = ledger?.filter(e => e.entry_type === 'top_up' || e.entry_type === 'subscription').reduce((s, e) => s + (e.credits || 0), 0) || 0;

  return {
    title: 'Billing Summary Report',
    rows: [
      { label: 'Plan', value: org?.plan_tier_id || 'N/A' },
      { label: 'Credits Used (period)', value: totalCreditsUsed.toLocaleString() },
      { label: 'Credits Added (period)', value: totalTopUps.toLocaleString() },
      { label: 'Current Balance', value: `£${(org?.credit_balance || 0).toFixed(2)}` },
      { label: 'Overage Rate', value: `£${(org?.overage_credit_price || 0.012).toFixed(3)}/credit` },
    ],
  };
}

async function queryTeamReport(orgId: string, start: Date, end: Date): Promise<ReportData> {
  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id, role, profiles(full_name, email)')
    .eq('organization_id', orgId);

  const totalMembers = members?.length || 0;
  const admins = members?.filter(m => m.role === 'admin' || m.role === 'owner').length || 0;

  // Get total calls by team in period
  const { count: teamCalls } = await supabase
    .from('voice_calls')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  return {
    title: 'Team Activity Report',
    rows: [
      { label: 'Total Members', value: String(totalMembers) },
      { label: 'Admins/Owners', value: String(admins) },
      { label: 'Team Calls (period)', value: String(teamCalls || 0) },
    ],
  };
}

async function queryDealsReport(orgId: string, start: Date, end: Date): Promise<ReportData> {
  const { data: deals } = await supabase
    .from('crm_deals')
    .select('id, stage, value')
    .eq('organization_id', orgId);

  const total = deals?.length || 0;
  const won = deals?.filter(d => d.stage === 'won') || [];
  const lost = deals?.filter(d => d.stage === 'lost').length || 0;
  const pipeline = deals?.filter(d => d.stage !== 'won' && d.stage !== 'lost') || [];
  const wonRevenue = won.reduce((s, d) => s + (d.value || 0), 0);
  const pipelineValue = pipeline.reduce((s, d) => s + (d.value || 0), 0);

  return {
    title: 'Deal Pipeline Report',
    rows: [
      { label: 'Total Deals', value: String(total) },
      { label: 'Won', value: String(won.length) },
      { label: 'Lost', value: String(lost) },
      { label: 'In Pipeline', value: String(pipeline.length) },
      { label: 'Won Revenue', value: `£${wonRevenue.toLocaleString()}` },
      { label: 'Pipeline Value', value: `£${pipelineValue.toLocaleString()}` },
    ],
  };
}

const REPORT_QUERIES: Record<string, (orgId: string, start: Date, end: Date) => Promise<ReportData>> = {
  usage: queryUsageReport,
  calls: queryCallsReport,
  campaigns: queryCampaignsReport,
  billing: queryBillingReport,
  team: queryTeamReport,
  deals: queryDealsReport,
};

// ─── HTML Email Rendering ─────────────────────────────────────────────

function renderReportEmail(report: any, orgName: string, data: ReportData, periodLabel: string): string {
  const rows = data.rows
    .map(r => `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #334155; color: #94a3b8;">${r.label}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #334155; color: #f1f5f9; font-weight: 600; text-align: right;">${r.value}</td>
      </tr>
    `)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #10b981; margin: 0; font-size: 24px;">Trinity Labs AI</h1>
      <p style="color: #64748b; margin: 8px 0 0;">Scheduled Report</p>
    </div>

    <div style="background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
      <div style="padding: 20px 24px; border-bottom: 1px solid #334155;">
        <h2 style="color: #f1f5f9; margin: 0; font-size: 18px;">${data.title}</h2>
        <p style="color: #64748b; margin: 6px 0 0; font-size: 14px;">${orgName} &mdash; ${periodLabel}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        ${rows}
      </table>
    </div>

    <div style="text-align: center; margin-top: 32px; padding: 20px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">
        This report was generated automatically by Trinity Labs AI.<br>
        Manage your report schedules in Settings &rarr; Scheduled Reports.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email Sending ────────────────────────────────────────────────────

async function sendReportEmail(recipients: string[], subject: string, html: string): Promise<boolean> {
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not set — skipping email send');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Trinity Labs AI <reports@trinitylabs.ai>',
        to: recipients,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Resend error:', err);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('Email send failed:', err.message);
    return false;
  }
}

// ─── Report Processing ────────────────────────────────────────────────

async function processReport(report: any): Promise<boolean> {
  try {
    // Get organization name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', report.organization_id)
      .single();

    const orgName = org?.name || 'Your Organization';

    // Determine period
    const period = getReportPeriod(report.frequency);

    // Query report data
    const queryFn = REPORT_QUERIES[report.report_type];
    if (!queryFn) {
      console.error(`Unknown report type: ${report.report_type}`);
      return false;
    }

    const reportData = await queryFn(report.organization_id, period.start, period.end);

    // Render email
    const subject = `${reportData.title} — ${period.label}`;
    const html = renderReportEmail(report, orgName, reportData, period.label);

    // Send to all recipients
    const recipients = report.recipients || [];
    if (recipients.length === 0) {
      console.warn(`Report ${report.id} has no recipients — skipping`);
      return false;
    }

    const sent = await sendReportEmail(recipients, subject, html);

    if (sent) {
      // Update last_sent_at
      await supabase
        .from('scheduled_reports')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', report.id);
    }

    return sent;
  } catch (err: any) {
    console.error(`Failed to process report ${report.id}:`, err.message);
    return false;
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Check for on-demand mode (single report by ID)
    const body = event.body ? JSON.parse(event.body) : {};
    const { reportId } = body;

    if (reportId) {
      // On-demand: generate a specific report immediately
      const { data: report, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error || !report) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Report not found' }) };
      }

      const sent = await processReport(report);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: sent, reportId }),
      };
    }

    // Scheduled mode: check all active reports and process due ones
    const { data: reports } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('is_active', true);

    if (!reports || reports.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, processed: 0 }) };
    }

    // Filter for due reports
    const dueReports = reports.filter(isReportDue);
    console.log(`Report generator: ${dueReports.length} of ${reports.length} reports are due`);

    let processed = 0;
    let failed = 0;

    // Process reports sequentially to avoid overwhelming Resend rate limits
    for (const report of dueReports) {
      const sent = await processReport(report);
      if (sent) processed++;
      else failed++;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, processed, failed, total: dueReports.length }),
    };
  } catch (error: any) {
    console.error('Report generator error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Report generation failed' }),
    };
  }
};
