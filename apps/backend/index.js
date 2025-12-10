const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase with null checks
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️ Supabase not configured - SUPABASE_URL or SUPABASE_SERVICE_KEY missing');
}

// Trust proxy for Vercel
app.set('trust proxy', true);

// CORS configuration
const allowedOrigins = [
  'https://cheery-hamster-593ff7.netlify.app',
  'https://tourmaline-hummingbird-cdcef0.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://localhost:5522',
  'http://localhost:3000',
  'http://localhost:8080'
];

if (process.env.CORS_ORIGIN) allowedOrigins.push(process.env.CORS_ORIGIN);
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  console.log(`🔍 CORS: ${req.method} ${req.path} from origin: ${origin || 'no-origin'}`);

  if (origin) {
    if (allowedOrigins.includes(origin) || origin.endsWith('.netlify.app') || origin.endsWith('.vercel.app')) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      console.log('✅ CORS allowed for:', origin);
    } else {
      console.log('❌ CORS blocked for:', origin);
    }
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Requested-With,Accept,Origin,Access-Control-Request-Method,Access-Control-Request-Headers,X-Org-Id,X-User-Id,X-Request-Id');
  res.header('Access-Control-Expose-Headers', 'Content-Length,Content-Range,X-Content-Range');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight OPTIONS request handled');
    return res.status(204).end();
  }

  next();
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// VAPI SERVICE FUNCTIONS
// ============================================

async function getVapiCredentialsForOrganization(organizationId) {
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    return null;
  }
  try {
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('settings, vapi_api_key, vapi_settings')
      .eq('id', organizationId)
      .single();

    if (error || !organization) {
      console.log(`⚠️ No organization found: ${organizationId}`);
      return null;
    }

    // Check multiple locations for VAPI credentials
    if (organization.settings?.vapi?.apiKey) {
      return organization.settings.vapi.apiKey;
    } else if (organization.vapi_settings) {
      try {
        const parsed = JSON.parse(organization.vapi_settings);
        return parsed.apiKey;
      } catch (e) {}
    } else if (organization.vapi_api_key) {
      return organization.vapi_api_key;
    }

    // Check organization_settings table
    const { data: settings } = await supabase
      .from('organization_settings')
      .select('value')
      .eq('organization_id', organizationId)
      .eq('key', 'vapi_credentials')
      .single();

    if (settings?.value?.apiKey) {
      return settings.value.apiKey;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting VAPI credentials:', error);
    return null;
  }
}

async function makeVapiCall(apiKey, assistantId, phoneNumberId, customerPhone, customerName) {
  try {
    // Validate phone number format
    if (!customerPhone || !customerPhone.startsWith('+')) {
      throw new Error(`Invalid phone number format: ${customerPhone}. Must be E.164 format (e.g., +14155551234)`);
    }

    // Ensure phone is at least 10 digits (including country code)
    const digitsOnly = customerPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      throw new Error(`Phone number too short: ${customerPhone}. Must have at least 10 digits including country code.`);
    }

    const payload = {
      assistantId,
      phoneNumberId,
      customer: {
        number: customerPhone,
        name: customerName || 'Unknown'
      }
    };

    console.log(`📞 Making VAPI call:`, JSON.stringify(payload));

    const response = await axios.post('https://api.vapi.ai/call', payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log(`✅ VAPI call created: ${response.data.id}`);
    return response.data;
  } catch (error) {
    console.error('❌ VAPI call error:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// CAMPAIGN EXECUTOR FUNCTIONS
// ============================================

function isWithinWorkingHours(campaign) {
  const now = new Date();
  const settings = campaign.settings || {};

  // If workingHoursEnabled is explicitly false, always allow calls
  if (settings.workingHoursEnabled === false) {
    console.log(`⏰ Working hours disabled for campaign ${campaign.name} - allowing calls`);
    return true;
  }

  // Check day of week
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];

  // Handle new format: workingHours is an object with day names as keys
  // e.g., { monday: { start: '09:00', end: '17:00', enabled: true }, ... }
  const workingHours = settings.workingHours || {};

  // Check if workingHours has day-based structure (new format)
  if (workingHours[currentDay]) {
    const dayConfig = workingHours[currentDay];

    // Check if day is enabled
    if (dayConfig.enabled === false) {
      console.log(`⏰ Day ${currentDay} not enabled for campaign ${campaign.name}`);
      return false;
    }

    // Get current time in UTC and convert to server comparison
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTimeUTC = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // The times in DB are Eastern Time, convert UTC to Eastern (UTC-5 in winter, UTC-4 in summer)
    // For simplicity, assume UTC-5 (Eastern Standard Time)
    let easternHour = currentHour - 5;
    if (easternHour < 0) easternHour += 24;
    const currentTimeET = `${String(easternHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    const startTime = dayConfig.start || '09:00';
    const endTime = dayConfig.end || '17:00';

    console.log(`⏰ Time check: UTC=${currentTimeUTC}, ET=${currentTimeET}, range=${startTime}-${endTime}`);

    if (currentTimeET < startTime || currentTimeET > endTime) {
      console.log(`⏰ Outside working hours for ${campaign.name} (${currentTimeET} not in ${startTime}-${endTime} ET)`);
      return false;
    }

    return true;
  }

  // Legacy format: workingHours = { start, end, timezone } and separate workingDays object
  const workingDays = settings.workingDays || {
    monday: true, tuesday: true, wednesday: true, thursday: true, friday: true,
    saturday: false, sunday: false
  };

  if (!workingDays[currentDay]) {
    console.log(`⏰ Outside working days (${currentDay})`);
    return false;
  }

  // Check time (simplified - uses server timezone)
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

  const startTime = workingHours.start || '09:00';
  const endTime = workingHours.end || '17:00';

  if (currentTime < startTime || currentTime > endTime) {
    console.log(`⏰ Outside working hours (${currentTime} not in ${startTime}-${endTime})`);
    return false;
  }

  return true;
}

async function processCampaigns(forceRun = false) {
  console.log(`\n🔄 Processing campaigns at ${new Date().toISOString()} (force=${forceRun})`);

  if (!supabase) {
    console.error('❌ Supabase not initialized - cannot process campaigns');
    return { processed: 0, calls: 0, errors: [{ error: 'Supabase not initialized' }] };
  }

  try {
    // Get all active campaigns
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .in('status', ['active', 'scheduled'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching campaigns:', error);
      return { processed: 0, calls: 0, errors: [] };
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('📭 No active campaigns to process');
      return { processed: 0, calls: 0, errors: [] };
    }

    console.log(`📋 Found ${campaigns.length} active/scheduled campaigns`);

    let totalCalls = 0;
    const errors = [];

    for (const campaign of campaigns) {
      try {
        const result = await processSingleCampaign(campaign, forceRun);
        totalCalls += result.calls;
        if (result.error) errors.push(result.error);
      } catch (err) {
        console.error(`❌ Error processing campaign ${campaign.id}:`, err);
        errors.push({ campaignId: campaign.id, error: err.message });
      }
    }

    return { processed: campaigns.length, calls: totalCalls, errors };
  } catch (error) {
    console.error('❌ Error in processCampaigns:', error);
    return { processed: 0, calls: 0, errors: [{ error: error.message }] };
  }
}

async function processSingleCampaign(campaign, forceRun = false) {
  console.log(`\n📞 Processing campaign: ${campaign.name} (${campaign.id})`);

  const settings = campaign.settings || {};

  // Check if within working hours (skip if force mode)
  if (!forceRun && !isWithinWorkingHours(campaign)) {
    return { calls: 0, skipped: 'outside_working_hours' };
  }

  if (forceRun) {
    console.log(`⚠️ Force mode enabled - bypassing working hours check`);
  }

  // Get VAPI credentials for this organization
  const vapiApiKey = await getVapiCredentialsForOrganization(campaign.organization_id);
  if (!vapiApiKey) {
    console.log(`⚠️ No VAPI credentials for org ${campaign.organization_id}`);
    return { calls: 0, error: 'no_vapi_credentials' };
  }

  // Get assistant and phone number from settings
  const assistantId = settings.assistant_id || campaign.assistant_id;
  const phoneNumberId = settings.phone_number_id || campaign.phone_number_id;

  if (!assistantId || !phoneNumberId) {
    console.log(`⚠️ Campaign ${campaign.id} missing assistant or phone number`);
    return { calls: 0, error: 'missing_assistant_or_phone' };
  }

  // Check if call queue exists, if not create it from leads/contacts
  let { data: queueItems, error: queueError } = await supabase
    .from('call_queue')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10);

  if (queueError) {
    console.error('❌ Error fetching call queue:', queueError);
  }

  // If no queue items, try to initialize from leads
  if (!queueItems || queueItems.length === 0) {
    console.log(`📝 No pending queue items, checking for leads...`);

    // Check for leads in the leads table for this campaign
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('status', 'new')
      .limit(50);

    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError);
    }

    console.log(`📋 Found ${leads?.length || 0} new leads for campaign ${campaign.id}`);
    if (leads && leads.length > 0) {
      console.log(`📋 Lead details:`, JSON.stringify(leads.map(l => ({ id: l.id, name: l.name, phone: l.phone, status: l.status }))));

      const queueEntries = leads.map(lead => ({
        campaign_id: campaign.id,
        contact_id: lead.id,
        phone_number: lead.phone || lead.phone_number || lead.number,
        contact_name: lead.name || 'Unknown',
        status: 'pending',
        attempt: 0,
        scheduled_for: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })).filter(q => q.phone_number);

      console.log(`📝 Creating ${queueEntries.length} queue entries:`, JSON.stringify(queueEntries));

      if (queueEntries.length > 0) {
        const { data: insertedData, error: insertError } = await supabase
          .from('call_queue')
          .insert(queueEntries)
          .select();

        if (insertError) {
          console.error('❌ Error creating queue:', JSON.stringify(insertError));
        } else {
          // Update leads status
          await supabase
            .from('leads')
            .update({ status: 'queued', updated_at: new Date().toISOString() })
            .in('id', leads.map(l => l.id));

          // Fetch the newly created queue items
          const { data: newQueue } = await supabase
            .from('call_queue')
            .select('*')
            .eq('campaign_id', campaign.id)
            .eq('status', 'pending')
            .limit(10);

          queueItems = newQueue || [];
        }
      }
    }
  }

  if (!queueItems || queueItems.length === 0) {
    console.log(`📭 No calls to make for campaign ${campaign.name}`);

    // Check if campaign should be marked complete
    const { count } = await supabase
      .from('call_queue')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .in('status', ['pending', 'retry_scheduled']);

    if (count === 0) {
      // Check if any leads exist
      const { count: leadCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id);

      if (leadCount === 0) {
        console.log(`📭 Campaign ${campaign.name} has no leads`);
      }
    }

    return { calls: 0 };
  }

  console.log(`📞 Making ${Math.min(queueItems.length, 5)} calls for campaign ${campaign.name}`);

  let callsMade = 0;

  // Process up to 5 calls per execution (to avoid timeouts)
  for (const queueItem of queueItems.slice(0, 5)) {
    try {
      // Mark as calling
      await supabase
        .from('call_queue')
        .update({ status: 'calling', updated_at: new Date().toISOString() })
        .eq('id', queueItem.id);

      // Make the VAPI call
      const vapiCall = await makeVapiCall(
        vapiApiKey,
        assistantId,
        phoneNumberId,
        queueItem.phone_number,
        queueItem.contact_name
      );

      // Update queue with call ID
      await supabase
        .from('call_queue')
        .update({
          last_call_id: vapiCall.id,
          last_attempt_at: new Date().toISOString(),
          attempt: (queueItem.attempt || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);

      // Create call record
      await supabase
        .from('calls')
        .insert({
          id: vapiCall.id,
          campaign_id: campaign.id,
          lead_id: queueItem.contact_id,
          organization_id: campaign.organization_id,
          customer_name: queueItem.contact_name,
          customer_phone: queueItem.phone_number,
          status: 'in_progress',
          vapi_call_id: vapiCall.id,
          started_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      console.log(`✅ Call initiated: ${queueItem.contact_name} (${queueItem.phone_number})`);
      callsMade++;

      // Small delay between calls
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ Error making call to ${queueItem.phone_number}:`, error.message);

      // Mark as failed
      await supabase
        .from('call_queue')
        .update({
          status: 'failed',
          last_outcome: 'system_error',
          updated_at: new Date().toISOString()
        })
        .eq('id', queueItem.id);
    }
  }

  return { calls: callsMade };
}

// ============================================
// API ENDPOINTS
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.4.0-simple-with-executor',
    features: {
      campaignExecutor: true,
      vapiIntegration: true
    },
    cors: {
      configured: true,
      cors_origin: process.env.CORS_ORIGIN || 'not set',
      frontend_url: process.env.FRONTEND_URL || 'not set',
      netlify_allowed: true
    }
  });
});

// Diagnostic endpoint
app.get('/__meta', (req, res) => {
  res.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    node: process.version,
    now: new Date().toISOString(),
    supabase: {
      configured: !!supabaseUrl && !!supabaseKey,
      url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'not set'
    }
  });
});

// Campaign executor endpoint (triggered by Vercel Cron or manually)
// Add ?force=true to bypass working hours check for testing
app.get('/api/trigger-campaign-executor', async (req, res) => {
  const forceRun = req.query.force === 'true';
  console.log(`🎯 Campaign executor triggered (force=${forceRun})`);

  try {
    const result = await processCampaigns(forceRun);

    res.json({
      success: true,
      message: 'Campaign processing completed',
      forceMode: forceRun,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Campaign executor error:', error);
    res.status(500).json({
      success: false,
      error: 'Campaign processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint to diagnose campaign issues
app.get('/api/debug/campaigns', async (req, res) => {
  if (!supabase) {
    return res.json({ error: 'Supabase not initialized' });
  }

  try {
    // Get active campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, status, organization_id, settings, assistant_id, phone_number_id')
      .in('status', ['active', 'scheduled']);

    const diagnostics = [];

    for (const campaign of campaigns || []) {
      const diag = {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        organization_id: campaign.organization_id,
        assistant_id: campaign.settings?.assistant_id || campaign.assistant_id || null,
        phone_number_id: campaign.settings?.phone_number_id || campaign.phone_number_id || null,
        workingHours: campaign.settings?.workingHours || 'default (09:00-17:00 ET)',
        isWithinWorkingHours: isWithinWorkingHours(campaign)
      };

      // Check VAPI credentials
      const vapiKey = await getVapiCredentialsForOrganization(campaign.organization_id);
      diag.hasVapiCredentials = !!vapiKey;
      diag.vapiKeyPreview = vapiKey ? vapiKey.substring(0, 10) + '...' : null;

      // Check leads by status
      const { data: leadsByStatus } = await supabase
        .from('leads')
        .select('status')
        .eq('campaign_id', campaign.id);

      const statusCounts = {};
      (leadsByStatus || []).forEach(lead => {
        statusCounts[lead.status || 'unknown'] = (statusCounts[lead.status || 'unknown'] || 0) + 1;
      });

      diag.totalLeads = leadsByStatus?.length || 0;
      diag.leadsByStatus = statusCounts;

      // Check queue
      const { data: queueByStatus } = await supabase
        .from('call_queue')
        .select('status')
        .eq('campaign_id', campaign.id);

      const queueStatusCounts = {};
      (queueByStatus || []).forEach(item => {
        queueStatusCounts[item.status || 'unknown'] = (queueStatusCounts[item.status || 'unknown'] || 0) + 1;
      });

      diag.queueByStatus = queueStatusCounts;

      diagnostics.push(diag);
    }

    // Check current time info
    const now = new Date();
    const timeInfo = {
      serverTime: now.toISOString(),
      serverHour: now.getHours(),
      serverDay: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()]
    };

    res.json({
      success: true,
      timeInfo,
      campaignCount: diagnostics.length,
      campaigns: diagnostics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug a specific campaign's leads and settings
app.get('/api/debug/campaigns/:id', async (req, res) => {
  if (!supabase) {
    return res.json({ error: 'Supabase not initialized' });
  }

  const { id } = req.params;

  try {
    // Get campaign
    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found', details: campError });
    }

    // Get leads (only select columns that exist)
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', id);

    // Get queue
    const { data: queue, error: queueError } = await supabase
      .from('call_queue')
      .select('*')
      .eq('campaign_id', id);

    // Get VAPI credentials
    const vapiKey = await getVapiCredentialsForOrganization(campaign.organization_id);

    // Check working hours
    const withinHours = isWithinWorkingHours(campaign);

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        organization_id: campaign.organization_id,
        settings: campaign.settings,
        assistant_id: campaign.assistant_id,
        phone_number_id: campaign.phone_number_id
      },
      vapi: {
        hasCredentials: !!vapiKey,
        keyPreview: vapiKey ? vapiKey.substring(0, 15) + '...' : null,
        assistantId: campaign.settings?.assistant_id || campaign.assistant_id,
        phoneNumberId: campaign.settings?.phone_number_id || campaign.phone_number_id
      },
      workingHours: {
        isWithin: withinHours,
        config: campaign.settings?.workingHours,
        serverTime: new Date().toISOString()
      },
      leads: {
        total: leads?.length || 0,
        error: leadsError?.message,
        items: leads?.slice(0, 10) // First 10 leads
      },
      queue: {
        total: queue?.length || 0,
        error: queueError?.message,
        items: queue?.slice(0, 10) // First 10 queue items
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset leads for a campaign to 'new' status so they can be called again
app.post('/api/campaigns/:id/reset-leads', async (req, res) => {
  if (!supabase) {
    return res.json({ error: 'Supabase not initialized' });
  }

  const { id } = req.params;

  try {
    // Reset leads to 'new' status
    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .update({ status: 'new', updated_at: new Date().toISOString() })
      .eq('campaign_id', id)
      .select('id');

    if (leadError) {
      return res.status(500).json({ error: leadError.message });
    }

    // Clear call queue for this campaign
    const { error: queueError } = await supabase
      .from('call_queue')
      .delete()
      .eq('campaign_id', id);

    if (queueError) {
      console.error('Error clearing queue:', queueError);
    }

    res.json({
      success: true,
      message: `Reset ${leads?.length || 0} leads to 'new' status`,
      leadsReset: leads?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute single campaign with detailed output
app.get('/api/campaigns/:id/execute', async (req, res) => {
  if (!supabase) {
    return res.json({ error: 'Supabase not initialized' });
  }

  const { id } = req.params;
  const forceRun = req.query.force === 'true';
  const logs = [];

  const log = (msg) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    log(`🎯 Executing single campaign: ${id}`);

    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found', details: campError });
    }

    log(`📋 Campaign: ${campaign.name} (status: ${campaign.status})`);

    // Check working hours
    const withinHours = isWithinWorkingHours(campaign);
    log(`⏰ Within working hours: ${withinHours}`);

    if (!forceRun && !withinHours) {
      return res.json({
        success: false,
        error: 'Outside working hours',
        logs,
        hint: 'Add ?force=true to bypass'
      });
    }

    // Get VAPI credentials
    const vapiKey = await getVapiCredentialsForOrganization(campaign.organization_id);
    log(`🔑 VAPI credentials: ${vapiKey ? 'Found' : 'NOT FOUND'}`);

    if (!vapiKey) {
      return res.json({
        success: false,
        error: 'No VAPI credentials',
        logs
      });
    }

    // Get assistant and phone
    const settings = campaign.settings || {};
    const assistantId = settings.assistant_id || campaign.assistant_id;
    const phoneNumberId = settings.phone_number_id || campaign.phone_number_id;
    log(`🤖 Assistant ID: ${assistantId || 'NOT SET'}`);
    log(`📞 Phone Number ID: ${phoneNumberId || 'NOT SET'}`);

    if (!assistantId || !phoneNumberId) {
      return res.json({
        success: false,
        error: 'Missing assistant_id or phone_number_id',
        logs
      });
    }

    // Get leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', id)
      .eq('status', 'new')
      .limit(5);

    if (leadsError) {
      log(`❌ Error fetching leads: ${leadsError.message}`);
      return res.json({ success: false, error: leadsError.message, logs });
    }

    log(`📋 Found ${leads?.length || 0} leads with status 'new'`);

    if (!leads || leads.length === 0) {
      return res.json({
        success: true,
        message: 'No leads to process',
        logs
      });
    }

    // Try to make a call
    const lead = leads[0];
    log(`📞 Attempting call to: ${lead.name} (${lead.phone})`);

    try {
      const vapiCall = await makeVapiCall(
        vapiKey,
        assistantId,
        phoneNumberId,
        lead.phone,
        lead.name
      );

      log(`✅ VAPI call created: ${vapiCall.id}`);

      // Update lead status
      await supabase
        .from('leads')
        .update({ status: 'calling', updated_at: new Date().toISOString() })
        .eq('id', lead.id);

      res.json({
        success: true,
        message: 'Call initiated',
        callId: vapiCall.id,
        logs
      });
    } catch (callError) {
      log(`❌ VAPI call error: ${callError.response?.data?.message || callError.message}`);
      res.json({
        success: false,
        error: callError.response?.data || callError.message,
        logs
      });
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`);
    res.status(500).json({ error: error.message, logs });
  }
});

// Manual campaign trigger endpoint (POST)
app.post('/api/campaigns/:id/execute', async (req, res) => {
  const { id } = req.params;

  console.log(`🎯 Manual execution triggered for campaign ${id}`);

  try {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const result = await processSingleCampaign(campaign);

    res.json({
      success: true,
      message: 'Campaign execution triggered',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Campaign execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Campaign execution failed',
      message: error.message
    });
  }
});

// Basic VAPI data endpoint
app.get('/api/vapi-data', (req, res) => {
  res.json({
    message: 'VAPI data endpoint is working',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

// Quick status endpoint
app.get('/api/status', async (req, res) => {
  if (!supabase) {
    return res.json({
      status: 'error',
      message: 'Supabase not configured',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Count active campaigns with leads
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, organization_id, settings')
      .in('status', ['active', 'scheduled']);

    const stats = {
      activeCampaigns: campaigns?.length || 0,
      campaignsWithLeads: 0,
      campaignsReady: 0,
      issues: []
    };

    for (const campaign of campaigns || []) {
      const { count: leadCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'new');

      if (leadCount > 0) {
        stats.campaignsWithLeads++;

        // Check if campaign is ready
        const vapiKey = await getVapiCredentialsForOrganization(campaign.organization_id);
        const settings = campaign.settings || {};
        const assistantId = settings.assistant_id || campaign.assistant_id;
        const phoneNumberId = settings.phone_number_id || campaign.phone_number_id;

        if (vapiKey && assistantId && phoneNumberId) {
          stats.campaignsReady++;
        } else {
          stats.issues.push({
            campaign: campaign.name,
            missing: [
              !vapiKey && 'vapi_credentials',
              !assistantId && 'assistant_id',
              !phoneNumberId && 'phone_number_id'
            ].filter(Boolean)
          });
        }
      }
    }

    res.json({
      status: 'ok',
      version: '1.5.0',
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export for Vercel
module.exports = app;

// Start server if not in Vercel
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Apex AI Calling Platform API Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 Meta endpoint: http://localhost:${PORT}/__meta`);
    console.log(`🎯 Campaign executor: http://localhost:${PORT}/api/trigger-campaign-executor`);
    console.log(`\n✅ Campaign executor is ENABLED - calls will be made when triggered`);
  });
}
