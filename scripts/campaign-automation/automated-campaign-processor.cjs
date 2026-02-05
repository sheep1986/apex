// Automated Campaign Processor - Monitors and executes campaigns with all settings
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Track active calls and rate limiting
const activeCalls = new Map();
const campaignLastCallTime = new Map();
const campaignCallCounts = new Map();

class CampaignProcessor {
  constructor() {
    this.organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
    this.vapiApiKey = null;
    this.isRunning = true;
  }

  async initialize() {
    // Get VAPI credentials
    const { data: org } = await supabase
      .from('organizations')
      .select('vapi_private_key, vapi_public_key, vapi_api_key, settings')
      .eq('id', this.organizationId)
      .single();
      
    this.vapiApiKey = org.vapi_private_key || 
                      org.settings?.vapi?.privateKey || 
                      org.settings?.vapi?.apiKey ||
                      org.vapi_api_key;
                      
    if (!this.vapiApiKey) {
      console.error('❌ No VAPI API key found for organization');
      return false;
    }
    
    console.log('✅ VAPI credentials loaded');
    return true;
  }

  // Check if within working hours
  isWithinWorkingHours(campaign) {
    const settings = campaign.settings || {};
    
    // Check whenToSend setting
    if (settings.whenToSend === 'scheduled') {
      const scheduledTime = new Date(settings.started_at);
      if (new Date() < scheduledTime) {
        return false; // Not time yet
      }
    }
    
    // Check working hours if enabled
    if (settings.workingHoursEnabled) {
      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = dayNames[now.getDay()];
      
      const todayHours = settings.workingHours?.[today];
      if (!todayHours?.enabled) {
        return false; // Not a working day
      }
      
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      if (currentTime < todayHours.start || currentTime > todayHours.end) {
        return false; // Outside working hours
      }
    }
    
    return true;
  }

  // Check rate limiting
  canMakeCall(campaign) {
    const settings = campaign.settings || {};
    const campaignId = campaign.id;
    
    // Check concurrent calls limit
    const concurrentLimit = settings.concurrentCalls || settings.customConcurrency || 10;
    const currentActive = activeCalls.get(campaignId) || 0;
    if (currentActive >= concurrentLimit) {
      return false; // Too many concurrent calls
    }
    
    // Check calls per minute
    const callsPerMinute = settings.callsPerMinute || 5;
    const lastCallTime = campaignLastCallTime.get(campaignId) || 0;
    const timeSinceLastCall = Date.now() - lastCallTime;
    const minDelay = (60000 / callsPerMinute); // Milliseconds between calls
    
    if (timeSinceLastCall < minDelay) {
      return false; // Too soon since last call
    }
    
    // Check calls per hour
    if (settings.callsPerHour) {
      const hourKey = `${campaignId}-${new Date().getHours()}`;
      const hourlyCount = campaignCallCounts.get(hourKey) || 0;
      if (hourlyCount >= settings.callsPerHour) {
        return false; // Hourly limit reached
      }
    }
    
    return true;
  }

  // Process a single lead
  async processLead(campaign, lead) {
    try {
      const settings = campaign.settings || {};
      
      // Format phone number for E.164
      let phoneNumber = lead.phone;
      if (!phoneNumber.startsWith('+')) {
        if (phoneNumber.startsWith('44')) {
          phoneNumber = '+' + phoneNumber;
        } else {
          phoneNumber = '+44' + phoneNumber.replace(/^0/, '');
        }
      }
      
      const vapiCallData = {
        assistantId: settings.assistant_id || campaign.assistant_id,
        phoneNumberId: settings.phone_number_id || campaign.phone_number_id,
        customer: {
          number: phoneNumber,
          name: `${lead.first_name} ${lead.last_name || ''}`.trim(),
          externalId: lead.id
        }
      };
      
      console.log(`  📞 Calling ${lead.first_name} at ${phoneNumber}`);
      
      // Make VAPI call
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.vapiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vapiCallData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(`VAPI error: ${response.status} - ${JSON.stringify(responseData)}`);
      }
      
      console.log(`     ✅ Call initiated: ${responseData.id}`);
      
      // Create call record
      await supabase
        .from('calls')
        .insert({
          organization_id: this.organizationId,
          campaign_id: campaign.id,
          lead_id: lead.id,
          vapi_call_id: responseData.id,
          phone_number: lead.phone,
          direction: 'outbound',
          status: 'initiated',
          started_at: new Date().toISOString()
        });
      
      // Update lead status
      await supabase
        .from('leads')
        .update({
          call_status: 'calling',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);
      
      // Update tracking
      const campaignId = campaign.id;
      activeCalls.set(campaignId, (activeCalls.get(campaignId) || 0) + 1);
      campaignLastCallTime.set(campaignId, Date.now());
      
      const hourKey = `${campaignId}-${new Date().getHours()}`;
      campaignCallCounts.set(hourKey, (campaignCallCounts.get(hourKey) || 0) + 1);
      
      // Simulate call completion (webhook will handle real completion)
      setTimeout(() => {
        activeCalls.set(campaignId, Math.max(0, (activeCalls.get(campaignId) || 0) - 1));
      }, 60000); // Assume 1 minute average call
      
      return true;
      
    } catch (error) {
      console.error(`     ❌ Error: ${error.message}`);
      
      // Update lead status to failed
      await supabase
        .from('leads')
        .update({
          call_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);
        
      return false;
    }
  }

  // Process campaigns
  async processCampaigns() {
    try {
      // Get active campaigns
      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('status', 'active');
        
      if (error || !campaigns || campaigns.length === 0) {
        return;
      }
      
      for (const campaign of campaigns) {
        // Check if campaign should run now
        if (!this.isWithinWorkingHours(campaign)) {
          continue;
        }
        
        // Check rate limiting
        if (!this.canMakeCall(campaign)) {
          continue;
        }
        
        // Get pending leads
        const { data: leads } = await supabase
          .from('leads')
          .select('*')
          .eq('campaign_id', campaign.id)
          .eq('call_status', 'pending')
          .limit(1); // Process one at a time for rate limiting
          
        if (leads && leads.length > 0) {
          console.log(`\n📊 Campaign "${campaign.name}"`);
          await this.processLead(campaign, leads[0]);
        }
        
        // Check for retry attempts
        const settings = campaign.settings || {};
        if (settings.maxRetryAttempts > 0) {
          const retryConditions = settings.retryConditions || ['no_answer', 'busy', 'failed'];
          
          // Get failed calls that need retry
          const { data: failedCalls } = await supabase
            .from('calls')
            .select('*, leads!inner(*)')
            .eq('campaign_id', campaign.id)
            .in('outcome', retryConditions)
            .lt('retry_count', settings.maxRetryAttempts || 2)
            .order('ended_at', { ascending: true })
            .limit(1);
            
          if (failedCalls && failedCalls.length > 0) {
            const call = failedCalls[0];
            const timeSinceEnd = Date.now() - new Date(call.ended_at).getTime();
            const retryDelay = (settings.retryInterval || 60) * 60000; // Convert minutes to ms
            
            if (timeSinceEnd >= retryDelay) {
              console.log(`  🔄 Retrying call for ${call.leads.first_name}`);
              
              // Reset lead status for retry
              await supabase
                .from('leads')
                .update({
                  call_status: 'pending',
                  updated_at: new Date().toISOString()
                })
                .eq('id', call.lead_id);
                
              // Update retry count
              await supabase
                .from('calls')
                .update({
                  retry_count: (call.retry_count || 0) + 1
                })
                .eq('id', call.id);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Error processing campaigns:', error);
    }
  }

  // Main loop
  async run() {
    console.log('🚀 Automated Campaign Processor Started');
    console.log('📊 Monitoring campaigns for immediate execution...\n');
    
    if (!await this.initialize()) {
      console.error('Failed to initialize. Exiting.');
      return;
    }
    
    // Process campaigns every 5 seconds
    while (this.isRunning) {
      await this.processCampaigns();
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
  }
  
  stop() {
    console.log('\n🛑 Stopping campaign processor...');
    this.isRunning = false;
  }
}

// Handle graceful shutdown
const processor = new CampaignProcessor();

process.on('SIGINT', () => {
  processor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  processor.stop();
  process.exit(0);
});

// Start the processor
processor.run().catch(console.error);