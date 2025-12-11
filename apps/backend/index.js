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

    // Note: Webhook URL must be configured in VAPI dashboard at assistant or account level
    // Go to: https://dashboard.vapi.ai → Settings → Server URL
    // Set to: https://apex-backend-new.vercel.app/api/vapi/webhook

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

async function processSingleCampaign(campaign, forceRun = false, maxCallsLimit = null) {
  console.log(`\n📞 Processing campaign: ${campaign.name} (${campaign.id})`);

  const settings = campaign.settings || {};

  // Check concurrency limit
  const maxConcurrent = settings.maxConcurrentCalls || settings.concurrent_calls || 5;
  const { count: activeCalls } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id)
    .eq('status', 'in_progress');

  const currentActiveCalls = activeCalls || 0;
  console.log(`📊 Concurrency: ${currentActiveCalls}/${maxConcurrent} active calls`);

  if (currentActiveCalls >= maxConcurrent) {
    console.log(`⏸️ Campaign at max concurrency - skipping`);
    return { calls: 0, skipped: 'max_concurrency', activeCalls: currentActiveCalls, maxConcurrent };
  }

  // Calculate available slots
  const availableSlots = maxCallsLimit || (maxConcurrent - currentActiveCalls);

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

  const callsToMake = Math.min(queueItems.length, availableSlots);
  console.log(`📞 Making ${callsToMake} calls for campaign ${campaign.name} (${availableSlots} slots available)`);

  let callsMade = 0;

  // Process calls up to available concurrency slots
  for (const queueItem of queueItems.slice(0, callsToMake)) {
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
    version: '2.0.0-with-webhooks-and-ai',
    features: {
      campaignExecutor: true,
      vapiIntegration: true,
      vapiWebhook: true,
      aiAnalysis: true,
      concurrencyControl: true,
      autoLeadImport: true
    },
    cors: {
      configured: true,
      cors_origin: process.env.CORS_ORIGIN || 'not set',
      frontend_url: process.env.FRONTEND_URL || 'not set',
      netlify_allowed: true
    },
    integrations: {
      openai: !!process.env.OPENAI_API_KEY,
      openaiKeyPreview: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'not set'
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

// Debug endpoint to check all calls
app.get('/api/debug/all-calls', async (req, res) => {
  if (!supabase) {
    return res.json({ error: 'Supabase not initialized' });
  }

  try {
    const { data: calls, error, count } = await supabase
      .from('calls')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.json({ error: 'Database error', details: error });
    }

    res.json({
      success: true,
      totalCalls: count,
      calls: calls || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    // Get calls
    const { data: calls, error: callsError } = await supabase
      .from('calls')
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
      },
      calls: {
        total: calls?.length || 0,
        error: callsError?.message,
        items: calls?.slice(0, 10) // First 10 calls
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import leads from CSV data stored in campaign settings
app.post('/api/campaigns/:id/import-csv-leads', async (req, res) => {
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
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const csvData = campaign.settings?.csv_data;
    if (!csvData) {
      return res.json({ success: false, error: 'No CSV data in campaign settings' });
    }

    // Parse CSV
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return res.json({ success: false, error: 'CSV has no data rows' });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const leads = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });

      // Find phone number - check common column names
      let phone = row.phone || row.phone_number || row.number || row.mobile || row.cell || '';

      // Format phone number to E.164
      if (phone && !phone.startsWith('+')) {
        // Assume it's missing the + prefix
        phone = '+' + phone;
      }

      // Find name
      const name = row.name || row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Unknown';

      if (phone) {
        leads.push({
          organization_id: campaign.organization_id,
          campaign_id: campaign.id,
          name: name,
          phone: phone,
          email: row.email || null,
          company: row.company || null,
          source: 'manual',
          status: 'new',
          notes: Object.entries(row)
            .filter(([k, v]) => !['phone', 'phone_number', 'number', 'mobile', 'cell', 'name', 'full_name', 'first_name', 'last_name', 'email', 'company'].includes(k) && v)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n') || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    if (leads.length === 0) {
      return res.json({ success: false, error: 'No valid leads found in CSV (no phone numbers)' });
    }

    // Insert leads
    const { data: inserted, error: insertError } = await supabase
      .from('leads')
      .insert(leads)
      .select('id');

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.json({
      success: true,
      message: `Imported ${inserted?.length || 0} leads from CSV`,
      leadsImported: inserted?.length || 0,
      sampleLead: leads[0]
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

// Mark specific leads as skipped (for invalid phone numbers)
app.post('/api/campaigns/:id/skip-invalid-leads', async (req, res) => {
  if (!supabase) {
    return res.json({ error: 'Supabase not initialized' });
  }

  const { id } = req.params;

  try {
    // Get all leads for this campaign
    const { data: leads } = await supabase
      .from('leads')
      .select('id, phone, status')
      .eq('campaign_id', id)
      .eq('status', 'new');

    const invalidLeadIds = [];
    for (const lead of leads || []) {
      const phone = lead.phone || '';
      // Check if phone looks valid (11+ digits for international)
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 11 || phone.match(/^(\+1)?234567/)) {
        // Looks like a test/fake number
        invalidLeadIds.push(lead.id);
      }
    }

    if (invalidLeadIds.length > 0) {
      // Use 'contacted' which is a valid status (from existing data)
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status: 'contacted', updated_at: new Date().toISOString() })
        .in('id', invalidLeadIds);

      if (updateError) {
        console.error('Error updating leads:', updateError);
        return res.status(500).json({ error: updateError.message });
      }
    }

    res.json({
      success: true,
      message: `Marked ${invalidLeadIds.length} leads as invalid`,
      invalidLeads: invalidLeadIds.length,
      remainingNew: (leads?.length || 0) - invalidLeadIds.length
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

// ============================================
// VAPI WEBHOOK - Receives call events
// ============================================

// Analyze transcript with AI to determine lead sentiment
async function analyzeTranscript(transcript, customerName) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.log('⚠️ OpenAI API key not configured - skipping AI analysis');
    return { sentiment: 'unknown', summary: 'AI analysis not available', isPositive: false };
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI that analyzes sales call transcripts. Analyze the following transcript and determine:
1. Whether the lead is POSITIVE (interested, wants callback, scheduled meeting, asked questions showing interest) or NEGATIVE (not interested, hung up, asked to be removed, hostile)
2. A brief 1-2 sentence summary of the call outcome
3. Key takeaways (what the lead is interested in, any objections, next steps mentioned)

Respond in JSON format:
{
  "sentiment": "positive" or "negative" or "neutral",
  "isPositive": true/false,
  "summary": "Brief summary of call outcome",
  "keyTakeaways": ["takeaway 1", "takeaway 2"],
  "nextSteps": "Any next steps mentioned",
  "interestLevel": 1-10
}`
        },
        {
          role: 'user',
          content: `Customer: ${customerName}\n\nTranscript:\n${transcript}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices[0]?.message?.content;
    try {
      return JSON.parse(content);
    } catch {
      return { sentiment: 'unknown', summary: content, isPositive: false };
    }
  } catch (error) {
    console.error('❌ OpenAI analysis error:', error.message);
    return { sentiment: 'error', summary: 'Failed to analyze transcript', isPositive: false };
  }
}

// Push positive lead to CRM
async function pushToCRM(callData, analysis, campaign) {
  console.log(`📤 Pushing positive lead to CRM: ${callData.customer_name}`);

  // Update lead status in database
  if (callData.lead_id) {
    await supabase
      .from('leads')
      .update({
        status: 'qualified',
        notes: `AI Analysis: ${analysis.summary}\nInterest Level: ${analysis.interestLevel}/10\nNext Steps: ${analysis.nextSteps || 'None specified'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', callData.lead_id);
  }

  // Create CRM entry in crm_leads table if it exists
  try {
    await supabase
      .from('crm_leads')
      .insert({
        organization_id: callData.organization_id,
        campaign_id: callData.campaign_id,
        lead_id: callData.lead_id,
        name: callData.customer_name,
        phone: callData.customer_phone,
        call_id: callData.id,
        sentiment: analysis.sentiment,
        interest_level: analysis.interestLevel,
        summary: analysis.summary,
        key_takeaways: analysis.keyTakeaways,
        next_steps: analysis.nextSteps,
        transcript: callData.transcript,
        created_at: new Date().toISOString()
      });
    console.log('✅ Lead pushed to CRM');
  } catch (err) {
    // Table might not exist, log and continue
    console.log('⚠️ CRM table not available, storing in lead notes only');
  }

  return true;
}

// VAPI Webhook endpoint
app.post('/api/vapi/webhook', async (req, res) => {
  console.log('📥 VAPI webhook received:', JSON.stringify(req.body).substring(0, 500));

  try {
    const event = req.body;
    const eventType = event.message?.type || event.type;

    // Handle different VAPI event types
    switch (eventType) {
      case 'call-started':
      case 'call.started':
        console.log(`📞 Call started: ${event.call?.id || event.message?.call?.id}`);
        break;

      case 'call-ended':
      case 'call.ended':
      case 'end-of-call-report':
        const call = event.call || event.message?.call || event;
        const callId = call.id || call.call_id;

        console.log(`📞 Call ended: ${callId}`);

        if (callId && supabase) {
          // Get transcript and recording
          const transcript = call.transcript || call.messages?.map(m => `${m.role}: ${m.content}`).join('\n') || '';
          const recordingUrl = call.recordingUrl || call.recording_url || null;
          const duration = call.duration || call.endedAt ? Math.floor((new Date(call.endedAt) - new Date(call.startedAt)) / 1000) : 0;
          const endedReason = call.endedReason || call.ended_reason || 'completed';

          // Determine call outcome
          let outcome = 'completed';
          if (endedReason === 'customer-did-not-answer' || endedReason === 'no-answer') {
            outcome = 'no_answer';
          } else if (endedReason === 'voicemail') {
            outcome = 'voicemail';
          } else if (endedReason === 'customer-busy') {
            outcome = 'busy';
          } else if (endedReason === 'customer-ended-call' && duration < 30) {
            outcome = 'hung_up';
          }

          // Update call record
          const updateData = {
            status: 'completed',
            outcome: outcome,
            ended_at: call.endedAt || new Date().toISOString(),
            duration: duration,
            transcript: transcript,
            recording_url: recordingUrl,
            ended_reason: endedReason,
            updated_at: new Date().toISOString()
          };

          // First try to update the call record
          const { data: callRecords, error: updateError } = await supabase
            .from('calls')
            .update(updateData)
            .eq('vapi_call_id', callId)
            .select('*, campaign_id, lead_id, organization_id');

          const callRecord = callRecords?.[0];

          if (updateError) {
            console.error('❌ Error updating call:', updateError);
          } else if (!callRecord) {
            console.log(`⚠️ No call record found for vapi_call_id: ${callId}`);
          } else if (callRecord && transcript && transcript.length > 50) {
            // Analyze transcript with AI
            console.log(`🤖 Analyzing transcript for call ${callId}...`);
            const analysis = await analyzeTranscript(transcript, callRecord.customer_name);

            // Update call with analysis
            await supabase
              .from('calls')
              .update({
                sentiment: analysis.sentiment,
                ai_summary: analysis.summary,
                interest_level: analysis.interestLevel,
                updated_at: new Date().toISOString()
              })
              .eq('id', callRecord.id);

            // If positive, push to CRM
            if (analysis.isPositive || analysis.sentiment === 'positive' || (analysis.interestLevel && analysis.interestLevel >= 6)) {
              console.log(`✅ Positive lead detected! Pushing to CRM...`);
              await pushToCRM(callRecord, analysis, null);
            } else {
              // Update lead as contacted but not qualified
              if (callRecord.lead_id) {
                await supabase
                  .from('leads')
                  .update({
                    status: 'contacted',
                    notes: `Call completed. Outcome: ${outcome}. ${analysis.summary || ''}`,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', callRecord.lead_id);
              }
            }
          }

          // Update call queue status (wrap in try-catch to not fail webhook)
          try {
            await supabase
              .from('call_queue')
              .update({
                status: outcome === 'completed' ? 'completed' : 'failed',
                last_outcome: outcome,
                updated_at: new Date().toISOString()
              })
              .eq('last_call_id', callId);
          } catch (queueErr) {
            console.log('⚠️ Queue update failed (non-critical):', queueErr.message);
          }
        }
        break;

      case 'transcript':
      case 'transcript-update':
        // Real-time transcript update (optional to handle)
        console.log('📝 Transcript update received');
        break;

      default:
        console.log(`📥 Unhandled VAPI event: ${eventType}`);
    }

    res.json({ success: true, received: eventType });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed', details: error.message });
  }
});

// ============================================
// AUTO-IMPORT LEADS ON CAMPAIGN CREATE/UPDATE
// ============================================

// Helper to import CSV leads
async function importCsvLeadsForCampaign(campaignId) {
  if (!supabase) return { imported: 0 };

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (!campaign) return { imported: 0 };

  const csvData = campaign.settings?.csv_data;
  if (!csvData) return { imported: 0, reason: 'no_csv_data' };

  // Check if leads already exist for this campaign
  const { count: existingCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  if (existingCount > 0) {
    return { imported: 0, reason: 'leads_already_exist', existingCount };
  }

  // Parse CSV
  const lines = csvData.trim().split('\n');
  console.log(`📊 CSV has ${lines.length} lines`);
  if (lines.length < 2) return { imported: 0, reason: 'no_data_rows' };

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  console.log(`📊 CSV headers: ${headers.join(', ')}`);
  const leads = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    console.log(`📊 Row ${i}:`, JSON.stringify(row));

    // Handle multiple phone field naming conventions
    let phone = row.phone || row.phone_number || row.number || row.mobile || row.cell || row.phonenumber || '';
    if (phone && !phone.startsWith('+')) phone = '+' + phone;

    // Handle multiple name field naming conventions (camelCase and snake_case)
    const firstName = row.firstname || row.first_name || row.fname || '';
    const lastName = row.lastname || row.last_name || row.lname || '';
    const name = row.name || row.full_name || row.fullname || `${firstName} ${lastName}`.trim() || 'Unknown';

    console.log(`📊 Parsed: name="${name}", phone="${phone}"`);

    if (phone) {
      leads.push({
        organization_id: campaign.organization_id,
        campaign_id: campaign.id,
        name: name,
        phone: phone,
        email: row.email || null,
        company: row.company || null,
        source: 'manual',
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  if (leads.length === 0) return { imported: 0, reason: 'no_valid_phones' };

  // Check for existing leads with these phone numbers in this org
  const phones = leads.map(l => l.phone);
  const { data: existingLeads } = await supabase
    .from('leads')
    .select('phone')
    .eq('organization_id', campaign.organization_id)
    .in('phone', phones);

  const existingPhones = new Set((existingLeads || []).map(l => l.phone));
  const newLeads = leads.filter(l => !existingPhones.has(l.phone));
  const skippedCount = leads.length - newLeads.length;

  if (newLeads.length === 0) {
    console.log(`⚠️ All ${leads.length} leads already exist in this organization`);
    return { imported: 0, skipped: skippedCount, reason: 'all_duplicates' };
  }

  const { data: inserted, error } = await supabase
    .from('leads')
    .insert(newLeads)
    .select('id');

  if (error) {
    console.error('❌ Error importing leads:', error);
    return { imported: 0, skipped: skippedCount, error: error.message };
  }

  console.log(`✅ Auto-imported ${inserted?.length || 0} leads for campaign ${campaign.name} (skipped ${skippedCount} duplicates)`);
  return { imported: inserted?.length || 0, skipped: skippedCount };
}

// Debug endpoint for CSV import testing
app.get('/api/debug/csv-import/:id', async (req, res) => {
  if (!supabase) {
    return res.json({ error: 'Supabase not initialized' });
  }

  const { id } = req.params;

  try {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (!campaign) {
      return res.json({ error: 'Campaign not found' });
    }

    const csvData = campaign.settings?.csv_data;
    if (!csvData) {
      return res.json({ error: 'No CSV data in campaign settings', settings: campaign.settings });
    }

    // Parse CSV for debugging
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const parsedRows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

      let phone = row.phone || row.phone_number || row.number || row.mobile || row.cell || row.phonenumber || '';
      if (phone && !phone.startsWith('+')) phone = '+' + phone;

      const firstName = row.firstname || row.first_name || row.fname || '';
      const lastName = row.lastname || row.last_name || row.lname || '';
      const name = row.name || row.full_name || row.fullname || `${firstName} ${lastName}`.trim() || 'Unknown';

      parsedRows.push({
        rawRow: row,
        parsedName: name,
        parsedPhone: phone,
        hasValidPhone: !!phone
      });
    }

    // Check existing leads
    const { count: existingCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', id);

    res.json({
      campaignId: id,
      campaignName: campaign.name,
      csvLines: lines.length,
      headers: headers,
      parsedRows: parsedRows,
      existingLeadsCount: existingCount,
      wouldImport: existingCount === 0 ? parsedRows.filter(r => r.hasValidPhone).length : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook/trigger for campaign creation
app.post('/api/campaigns/:id/on-create', async (req, res) => {
  const { id } = req.params;
  const { handleDuplicates = 'skip' } = req.body || {}; // 'skip', 'call_anyway'
  console.log(`🆕 Campaign created/updated: ${id} (handleDuplicates: ${handleDuplicates})`);

  try {
    // Get campaign first
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check for duplicates first
    const csvData = campaign.settings?.csv_data;
    let duplicateInfo = { hasDuplicates: false, duplicates: [], skipped: 0 };

    if (csvData) {
      // Parse CSV to check for duplicates
      const lines = csvData.trim().split('\n');
      if (lines.length >= 2) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const phones = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const row = {};
          headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

          let phone = row.phone || row.phone_number || row.number || row.mobile || row.cell || row.phonenumber || '';
          if (phone && !phone.startsWith('+')) phone = '+' + phone;
          if (phone) phones.push(phone);
        }

        // Check for existing leads with these phones
        if (phones.length > 0) {
          const { data: existingLeads } = await supabase
            .from('leads')
            .select('id, name, phone, campaign_id, status')
            .eq('organization_id', campaign.organization_id)
            .in('phone', phones);

          if (existingLeads && existingLeads.length > 0) {
            // Get campaign names for duplicates
            const campaignIds = [...new Set(existingLeads.map(l => l.campaign_id))];
            const { data: campaigns } = await supabase
              .from('campaigns')
              .select('id, name')
              .in('id', campaignIds);

            const campaignMap = {};
            (campaigns || []).forEach(c => { campaignMap[c.id] = c.name; });

            duplicateInfo = {
              hasDuplicates: true,
              duplicateCount: existingLeads.length,
              totalContacts: phones.length,
              duplicates: existingLeads.map(l => ({
                phone: l.phone,
                name: l.name,
                existingCampaign: campaignMap[l.campaign_id] || 'Unknown',
                status: l.status
              })),
              message: `Found ${existingLeads.length} contact(s) already in your database`
            };
          }
        }
      }
    }

    // If duplicates found and user hasn't chosen to call anyway, return early with duplicate info
    if (duplicateInfo.hasDuplicates && handleDuplicates === 'ask') {
      return res.json({
        success: true,
        requiresAction: true,
        action: 'duplicate_found',
        duplicateInfo: duplicateInfo,
        message: duplicateInfo.message,
        hint: 'Call this endpoint again with handleDuplicates: "skip" or "call_anyway" in the request body'
      });
    }

    // Auto-import CSV leads (will skip duplicates by default)
    const importResult = await importCsvLeadsForCampaign(id);
    console.log(`📊 Import result:`, JSON.stringify(importResult));

    // Handle "call_anyway" for duplicates
    let duplicatesQueued = 0;
    console.log(`🔍 handleDuplicates: ${handleDuplicates}`);
    console.log(`🔍 duplicateInfo.hasDuplicates: ${duplicateInfo.hasDuplicates}`);
    console.log(`🔍 duplicateInfo.duplicates count: ${duplicateInfo.duplicates?.length || 0}`);
    if (handleDuplicates === 'call_anyway' && duplicateInfo.hasDuplicates) {
      // Reset existing leads to 'new' status so they get called
      const dupPhones = duplicateInfo.duplicates.map(d => d.phone);
      const { data: existingToReset } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', campaign.organization_id)
        .in('phone', dupPhones);

      if (existingToReset && existingToReset.length > 0) {
        await supabase
          .from('leads')
          .update({
            status: 'new',
            campaign_id: campaign.id,
            notes: `Re-queued for campaign "${campaign.name}" on ${new Date().toISOString()}`,
            updated_at: new Date().toISOString()
          })
          .in('id', existingToReset.map(l => l.id));
        duplicatesQueued = existingToReset.length;
        console.log(`✅ Re-queued ${duplicatesQueued} duplicates for calling`);
      }
    }

    // If campaign is active, check for leads to call (including existing 'new' leads)
    let callsInitiated = 0;
    let callErrors = [];

    if (campaign.status === 'active') {
      // Get VAPI credentials
      const vapiKey = await getVapiCredentialsForOrganization(campaign.organization_id);
      const settings = campaign.settings || {};
      const assistantId = settings.assistant_id || campaign.assistant_id;
      const phoneNumberId = settings.phone_number_id || campaign.phone_number_id;

      if (vapiKey && assistantId && phoneNumberId) {
        // Get leads with 'new' status for this campaign (including previously imported ones)
        console.log(`🔍 Querying leads with campaign_id=${campaign.id} and status='new'`);
        const { data: newLeads, error: leadsQueryError } = await supabase
          .from('leads')
          .select('*')
          .eq('campaign_id', campaign.id)
          .eq('status', 'new')
          .limit(5); // Limit to 5 concurrent calls

        if (leadsQueryError) {
          console.error(`❌ Error querying leads:`, leadsQueryError);
        }
        console.log(`📋 Found ${newLeads?.length || 0} new leads to call`);

        if (newLeads && newLeads.length > 0) {
          console.log(`🚀 Auto-starting campaign ${campaign.name} with ${newLeads.length} leads`);
          for (const lead of newLeads) {
            try {
              console.log(`📞 Initiating call to ${lead.name} (${lead.phone})`);

              const vapiCall = await makeVapiCall(
                vapiKey,
                assistantId,
                phoneNumberId,
                lead.phone,
                lead.name
              );

              // Update lead status (use 'contacted' as that's what the DB constraint allows)
              const { error: leadUpdateError } = await supabase
                .from('leads')
                .update({ status: 'contacted', updated_at: new Date().toISOString() })
                .eq('id', lead.id);

              if (leadUpdateError) {
                console.error(`❌ Error updating lead status:`, leadUpdateError);
                callErrors.push({ type: 'lead_update', lead: lead.phone, error: leadUpdateError.message || leadUpdateError });
              }

              // Create call record (use crypto.randomUUID for id if vapiCall.id isn't UUID format)
              const callId = vapiCall.id;
              console.log(`📝 Creating call record with VAPI ID: ${callId}`);

              // Note: Using 'completed' status because DB constraint only allows 'completed'
              // The webhook will update with final status when call ends
              const { error: callInsertError } = await supabase
                .from('calls')
                .insert({
                  campaign_id: campaign.id,
                  lead_id: lead.id,
                  organization_id: campaign.organization_id,
                  customer_name: lead.name,
                  customer_phone: lead.phone,
                  phone_number: lead.phone,
                  direction: 'outbound',
                  status: 'completed',
                  vapi_call_id: callId,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (callInsertError) {
                console.error(`❌ Error creating call record:`, callInsertError);
                callErrors.push({ type: 'call_insert', lead: lead.phone, error: callInsertError.message || callInsertError });
              } else {
                console.log(`✅ Call record created for VAPI call: ${callId}`);
              }

              callsInitiated++;
              console.log(`✅ Call initiated: ${vapiCall.id}`);
            } catch (callError) {
              console.error(`❌ Error calling ${lead.phone}:`, callError.message);
              callErrors.push({ type: 'vapi_call', lead: lead.phone, error: callError.message });
            }
          }
        }
      } else {
        console.log('⚠️ Missing VAPI credentials or assistant/phone config');
      }

      res.json({
        success: true,
        leadsImported: importResult.imported,
        duplicatesQueued: duplicatesQueued,
        callsInitiated: callsInitiated,
        message: callsInitiated > 0
          ? `${callsInitiated} call(s) initiated` + (duplicateInfo.hasDuplicates ? ` (duplicates ${handleDuplicates === 'call_anyway' ? 're-queued' : 'skipped'})` : '')
          : 'Campaign active but no new leads to call',
        importDetails: importResult,
        duplicateInfo: duplicateInfo.hasDuplicates ? duplicateInfo : undefined,
        errors: callErrors.length > 0 ? callErrors : undefined
      });
    } else {
      res.json({
        success: true,
        leadsImported: importResult.imported,
        duplicatesQueued: duplicatesQueued,
        message: importResult.reason || 'Leads imported, campaign not active',
        importDetails: importResult,
        duplicateInfo: duplicateInfo.hasDuplicates ? duplicateInfo : undefined,
        campaignStatus: campaign?.status
      });
    }
  } catch (error) {
    console.error('❌ Error in campaign on-create:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DUPLICATE DETECTION & MANAGEMENT
// ============================================

// Check for duplicates before importing - returns detailed duplicate info
app.post('/api/campaigns/:id/check-duplicates', async (req, res) => {
  if (!supabase) {
    return res.json({ error: 'Supabase not initialized' });
  }

  const { id } = req.params;

  try {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const csvData = campaign.settings?.csv_data;
    if (!csvData) {
      return res.json({
        hasDuplicates: false,
        duplicates: [],
        newContacts: [],
        message: 'No CSV data in campaign'
      });
    }

    // Parse CSV
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      return res.json({ hasDuplicates: false, duplicates: [], newContacts: [] });
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const contacts = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

      let phone = row.phone || row.phone_number || row.number || row.mobile || row.cell || row.phonenumber || '';
      if (phone && !phone.startsWith('+')) phone = '+' + phone;

      const firstName = row.firstname || row.first_name || row.fname || '';
      const lastName = row.lastname || row.last_name || row.lname || '';
      const name = row.name || row.full_name || row.fullname || `${firstName} ${lastName}`.trim() || 'Unknown';

      if (phone) {
        contacts.push({ name, phone, email: row.email || null, company: row.company || null });
      }
    }

    // Check for existing leads with these phone numbers
    const phones = contacts.map(c => c.phone);
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, name, phone, email, company, campaign_id, status, created_at')
      .eq('organization_id', campaign.organization_id)
      .in('phone', phones);

    // Get campaign names for existing leads
    const campaignIds = [...new Set((existingLeads || []).map(l => l.campaign_id))];
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name')
      .in('id', campaignIds);

    const campaignMap = {};
    (campaigns || []).forEach(c => { campaignMap[c.id] = c.name; });

    // Categorize contacts
    const existingPhones = new Set((existingLeads || []).map(l => l.phone));
    const duplicates = [];
    const newContacts = [];

    for (const contact of contacts) {
      if (existingPhones.has(contact.phone)) {
        const existing = existingLeads.find(l => l.phone === contact.phone);
        duplicates.push({
          newContact: contact,
          existingLead: {
            ...existing,
            campaignName: campaignMap[existing.campaign_id] || 'Unknown Campaign'
          }
        });
      } else {
        newContacts.push(contact);
      }
    }

    res.json({
      hasDuplicates: duplicates.length > 0,
      totalContacts: contacts.length,
      duplicateCount: duplicates.length,
      newContactCount: newContacts.length,
      duplicates: duplicates,
      newContacts: newContacts,
      message: duplicates.length > 0
        ? `Found ${duplicates.length} contact(s) already in your database. Choose how to handle them.`
        : 'All contacts are new - ready to import!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import leads with duplicate handling options
// Options: skipDuplicates (default), callDuplicates, mergeDuplicates
app.post('/api/campaigns/:id/import-with-options', async (req, res) => {
  if (!supabase) {
    return res.json({ error: 'Supabase not initialized' });
  }

  const { id } = req.params;
  const {
    duplicateAction = 'skip', // 'skip', 'call_anyway', 'add_to_campaign'
    selectedDuplicates = []   // Array of phone numbers to include despite being duplicates
  } = req.body;

  try {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const csvData = campaign.settings?.csv_data;
    if (!csvData) {
      return res.json({ success: false, error: 'No CSV data in campaign' });
    }

    // Parse CSV
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const contacts = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

      let phone = row.phone || row.phone_number || row.number || row.mobile || row.cell || row.phonenumber || '';
      if (phone && !phone.startsWith('+')) phone = '+' + phone;

      const firstName = row.firstname || row.first_name || row.fname || '';
      const lastName = row.lastname || row.last_name || row.lname || '';
      const name = row.name || row.full_name || row.fullname || `${firstName} ${lastName}`.trim() || 'Unknown';

      if (phone) {
        contacts.push({
          organization_id: campaign.organization_id,
          campaign_id: campaign.id,
          name,
          phone,
          email: row.email || null,
          company: row.company || null,
          source: 'manual',
          status: 'new',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // Check for existing leads
    const phones = contacts.map(c => c.phone);
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id, phone, campaign_id')
      .eq('organization_id', campaign.organization_id)
      .in('phone', phones);

    const existingPhones = new Set((existingLeads || []).map(l => l.phone));
    const selectedSet = new Set(selectedDuplicates);

    let leadsToImport = [];
    let skippedDuplicates = [];
    let duplicatesToCall = [];

    for (const contact of contacts) {
      const isDuplicate = existingPhones.has(contact.phone);

      if (!isDuplicate) {
        // New contact - always import
        leadsToImport.push(contact);
      } else if (duplicateAction === 'call_anyway' || selectedSet.has(contact.phone)) {
        // User wants to call this duplicate
        duplicatesToCall.push(contact);
      } else if (duplicateAction === 'add_to_campaign') {
        // Add duplicate to this campaign (creates new lead record)
        leadsToImport.push(contact);
      } else {
        // Skip duplicate
        skippedDuplicates.push(contact);
      }
    }

    // Import new leads
    let importedCount = 0;
    if (leadsToImport.length > 0) {
      const { data: inserted, error } = await supabase
        .from('leads')
        .insert(leadsToImport)
        .select('id');

      if (error) {
        console.error('❌ Error importing leads:', error);
        return res.status(500).json({ error: error.message });
      }
      importedCount = inserted?.length || 0;
    }

    // Handle duplicates that should be called
    let duplicatesQueued = 0;
    if (duplicatesToCall.length > 0) {
      // Find the existing leads and reset them to 'new' status so they get called
      const phonesToCall = duplicatesToCall.map(d => d.phone);
      const existingToCall = existingLeads.filter(l => phonesToCall.includes(l.phone));

      for (const existing of existingToCall) {
        // Reset status to 'new' and move to this campaign
        await supabase
          .from('leads')
          .update({
            status: 'new',
            campaign_id: campaign.id,
            notes: `Re-queued for campaign "${campaign.name}" on ${new Date().toISOString()}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        duplicatesQueued++;
      }
    }

    // Start campaign processing if active and has leads
    let callsInitiated = 0;
    if (campaign.status === 'active' && (importedCount > 0 || duplicatesQueued > 0)) {
      const result = await processSingleCampaign(campaign, false);
      callsInitiated = result.calls || 0;
    }

    res.json({
      success: true,
      imported: importedCount,
      duplicatesSkipped: skippedDuplicates.length,
      duplicatesQueued: duplicatesQueued,
      callsInitiated: callsInitiated,
      message: `Imported ${importedCount} new contacts` +
               (duplicatesQueued > 0 ? `, re-queued ${duplicatesQueued} existing contacts` : '') +
               (skippedDuplicates.length > 0 ? `, skipped ${skippedDuplicates.length} duplicates` : '') +
               (callsInitiated > 0 ? `. ${callsInitiated} call(s) started!` : '')
    });
  } catch (error) {
    console.error('❌ Error in import-with-options:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get duplicate history - shows all contacts that have been called before
app.get('/api/organizations/:orgId/duplicate-contacts', async (req, res) => {
  if (!supabase) {
    return res.json({ error: 'Supabase not initialized' });
  }

  const { orgId } = req.params;

  try {
    // Get all leads with their call history
    const { data: leads } = await supabase
      .from('leads')
      .select(`
        id, name, phone, email, company, status, campaign_id, created_at,
        calls (id, status, outcome, duration, created_at)
      `)
      .eq('organization_id', orgId)
      .order('phone');

    // Group by phone number to find duplicates
    const phoneGroups = {};
    for (const lead of leads || []) {
      if (!phoneGroups[lead.phone]) {
        phoneGroups[lead.phone] = [];
      }
      phoneGroups[lead.phone].push(lead);
    }

    // Find phones that appear multiple times OR have been contacted
    const duplicates = [];
    for (const [phone, entries] of Object.entries(phoneGroups)) {
      const hasBeenCalled = entries.some(e => e.calls && e.calls.length > 0);
      if (entries.length > 1 || hasBeenCalled) {
        duplicates.push({
          phone,
          occurrences: entries.length,
          hasBeenCalled,
          totalCalls: entries.reduce((sum, e) => sum + (e.calls?.length || 0), 0),
          entries: entries.map(e => ({
            id: e.id,
            name: e.name,
            campaign_id: e.campaign_id,
            status: e.status,
            callCount: e.calls?.length || 0,
            lastCall: e.calls?.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null
          }))
        });
      }
    }

    res.json({
      totalDuplicates: duplicates.length,
      duplicates: duplicates.sort((a, b) => b.totalCalls - a.totalCalls)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CONCURRENT CALL LIMITING
// ============================================

async function getActiveCalls(campaignId) {
  if (!supabase) return 0;

  const { count } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'in_progress');

  return count || 0;
}

async function getCampaignConcurrencyLimit(campaign) {
  // Get from campaign settings, default to 5
  const settings = campaign.settings || {};
  return settings.maxConcurrentCalls || settings.concurrent_calls || 5;
}

// Enhanced processSingleCampaign with concurrency check
async function processSingleCampaignWithConcurrency(campaign, forceRun = false) {
  const maxConcurrent = await getCampaignConcurrencyLimit(campaign);
  const activeCalls = await getActiveCalls(campaign.id);

  console.log(`📊 Concurrency check: ${activeCalls}/${maxConcurrent} active calls for ${campaign.name}`);

  if (activeCalls >= maxConcurrent) {
    console.log(`⏸️ Campaign ${campaign.name} at max concurrency (${activeCalls}/${maxConcurrent})`);
    return { calls: 0, skipped: 'max_concurrency_reached', activeCalls, maxConcurrent };
  }

  const availableSlots = maxConcurrent - activeCalls;
  console.log(`📞 ${availableSlots} call slots available for ${campaign.name}`);

  // Call the original processor but limit calls to available slots
  return processSingleCampaign(campaign, forceRun, availableSlots);
}

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
