const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

const systemPrompt = `Identity & Purpose
You are Joanne, an AI voice agent for Emerald Green Energy.
Your mission is to call warm leads—UK homeowners who've already spoken with our field reps—remind them of that visit, let them know we've prepared a free, no-obligation solar consultation for them, and confirm their appointment (we've tentatively booked Wednesday at 3 PM). If that time doesn't suit, offer alternatives.

Voice & Persona
Warm & Friendly: Sound like a helpful neighbour—relaxed, confident, never pushy.
Natural: Use contractions ("we've," "you'd," "it's") and light fillers ("Great," "No worries," "Alright").
Local Tone: Simple, conversational phrasing as if you're from their area.
Measured Pace: Speak clearly, pause after questions to let the homeowner respond.`;

async function alignCampaignData() {
  const campaignId = '919c627d-31f3-4850-bba2-77d81021df94';
  
  console.log('🔄 Aligning Emerald Green Energy Demo campaign with database...\n');
  
  // Get current data
  const { data: current } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
  
  if (!current) {
    console.log('❌ Campaign not found!');
    return;
  }
  
  console.log('Current state:');
  console.log('  Name:', current.name);
  console.log('  Status:', current.status);
  console.log('  Organization:', current.organization_id);
  console.log('');
  
  // Prepare complete update
  const updates = {
    name: 'Emerald Green Energy Demo',
    description: 'Solar panel lead qualification campaign for UK homeowners',
    status: 'active',
    type: 'outbound',
    
    // VAPI configuration
    assistant_id: 'ca37eeb5-9b6f-4038-b6d8-5bc487f7b60f',
    vapi_assistant_id: 'ca37eeb5-9b6f-4038-b6d8-5bc487f7b60f',
    vapi_assistant_name: 'Emerald Green Energy Assistant',
    phone_number_id: 'b3026828-0f45-4b48-807f-c88e823c95df',
    
    // Call settings
    max_call_duration: 300, // 5 minutes
    retry_attempts: 3,
    retry_delay: 300, // 5 minutes in seconds
    calls_per_day: 2000,
    calls_per_hour: 100,
    max_concurrent_calls: 10,
    max_retry_attempts: 3,
    retry_delay_hours: 1,
    
    // Working hours
    calling_hours_start: '09:00',
    calling_hours_end: '20:00',
    calling_days: [1, 2, 3, 4, 5, 6], // Monday-Saturday
    working_days: [1, 2, 3, 4, 5, 6], // Monday-Saturday as integers
    working_hours: {
      start: '09:00',
      end: '20:00'
    },
    timezone: 'Europe/London',
    time_zone: 'Europe/London',
    
    // Costs
    cost_per_call: 2.05,
    
    // Enhanced settings JSON
    settings: {
      ...current.settings,
      voice_agent: 'Emerald Green Energy Demo',
      system_prompt: systemPrompt,
      assistant_id: 'ca37eeb5-9b6f-4038-b6d8-5bc487f7b60f',
      vapi_phone_number_id: 'b3026828-0f45-4b48-807f-c88e823c95df',
      max_calls_per_day: 2000,
      call_window_start: 9,
      call_window_end: 20,
      calls_per_minute: 10,
      phone_rotation_enabled: true,
      phone_numbers_required: 12,
      ai_lead_qualification: true,
      webhook_url: 'https://apex-backend.railway.app/api/vapi-webhook',
      cost_per_call: 2.05,
      monthly_budget: 4100,
      client_price_monthly: 10000,
      expected_profit_monthly: 5428,
      campaign_goals: {
        daily_calls: 2000,
        appointment_rate: 30,
        qualification_rate: 40,
        success_metric: 'appointments_booked'
      }
    },
    
    // Reset stats for fresh start
    total_leads: 0,
    calls_made: 0,
    calls_answered: 0,
    calls_completed: 0,
    conversion_rate: 0,
    avg_call_duration: 0,
    total_calls: 0,
    successful_calls: 0,
    total_duration: 0,
    total_cost: 0,
    
    // Sync status
    vapi_sync_status: 'synced',
    vapi_script_version: 1,
    vapi_last_synced: new Date().toISOString(),
    
    updated_at: new Date().toISOString()
  };
  
  // Apply update
  const { error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', campaignId);
  
  if (error) {
    console.log('❌ Error updating campaign:', error);
    return;
  }
  
  console.log('✅ Campaign data aligned successfully!\n');
  
  // Verify the update
  const { data: updated } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
  
  console.log('='.repeat(60));
  console.log('VERIFIED CAMPAIGN DATA');
  console.log('='.repeat(60));
  console.log('\n📋 Basic Information:');
  console.log('  Name:', updated.name);
  console.log('  Status:', updated.status);
  console.log('  Type:', updated.type);
  console.log('  Description:', updated.description);
  
  console.log('\n🔧 VAPI Configuration:');
  console.log('  Assistant ID:', updated.assistant_id);
  console.log('  Phone Number ID:', updated.phone_number_id);
  console.log('  Phone Number:', updated.phone_number);
  console.log('  Sync Status:', updated.vapi_sync_status);
  
  console.log('\n📞 Call Settings:');
  console.log('  Calls per day:', updated.calls_per_day);
  console.log('  Calls per hour:', updated.calls_per_hour);
  console.log('  Max concurrent:', updated.max_concurrent_calls);
  console.log('  Call hours:', updated.calling_hours_start, '-', updated.calling_hours_end);
  console.log('  Working days:', updated.calling_days?.join(', '));
  console.log('  Timezone:', updated.timezone);
  
  console.log('\n💰 Financial Configuration:');
  console.log('  Cost per call: £' + updated.cost_per_call);
  console.log('  Daily cost: £' + (updated.cost_per_call * 2000).toFixed(2));
  console.log('  Monthly cost: £' + updated.settings.monthly_budget);
  console.log('  Client price: £' + updated.settings.client_price_monthly);
  console.log('  Infrastructure: £472');
  console.log('  Monthly profit: £' + updated.settings.expected_profit_monthly);
  console.log('  Profit margin: ' + ((updated.settings.expected_profit_monthly / updated.settings.client_price_monthly) * 100).toFixed(1) + '%');
  
  console.log('\n📊 Campaign Goals:');
  console.log('  Daily calls target:', updated.settings.campaign_goals?.daily_calls);
  console.log('  Appointment rate:', updated.settings.campaign_goals?.appointment_rate + '%');
  console.log('  Qualification rate:', updated.settings.campaign_goals?.qualification_rate + '%');
  
  console.log('\n✅ Campaign is fully aligned and ready for production!');
  console.log('='.repeat(60));
  
  // Check for leads
  const { data: leads } = await supabase
    .from('leads')
    .select('id')
    .eq('campaign_id', campaignId);
  
  if (!leads || leads.length === 0) {
    console.log('\n⚠️  Note: No leads loaded yet.');
    console.log('   Import leads via CSV or API to start calling.');
  } else {
    console.log('\n📊 Leads ready:', leads.length);
  }
}

alignCampaignData().catch(console.error);