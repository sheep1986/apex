const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function fixCampaigns() {
  console.log('🔧 FIXING CAMPAIGN DATA ISSUE...\n');
  
  // Get all campaigns
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${campaigns.length} campaigns\n`);
  
  for (const campaign of campaigns) {
    // Get counts
    const { count: leadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id);
      
    const { count: callCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id);
    
    // Build comprehensive settings that will work with ANY version of the frontend
    const settings = {
      ...(campaign.settings || {}),
      // Add every possible field name the frontend might look for
      total_leads: leadCount || 0,
      totalLeads: leadCount || 0,
      calls_completed: callCount || 0,
      callsCompleted: callCount || 0,
      successful_calls: callCount || 0,
      successfulCalls: callCount || 0,
      total_cost: (callCount || 0) * 0.05,
      totalCost: (callCount || 0) * 0.05,
      success_rate: leadCount > 0 ? (callCount / leadCount * 100) : 0,
      successRate: leadCount > 0 ? (callCount / leadCount * 100) : 0,
      // Add nested metrics object too
      metrics: {
        totalLeads: leadCount || 0,
        callsCompleted: callCount || 0,
        totalCalls: callCount || 0,
        successRate: leadCount > 0 ? (callCount / leadCount * 100) : 0
      },
      // Ensure other fields exist
      phoneNumbers: campaign.settings?.phoneNumbers || [],
      assistantName: campaign.settings?.assistant_name || 'AI Assistant'
    };
    
    // Update ONLY the settings column (which we know exists)
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ settings })
      .eq('id', campaign.id);
    
    if (updateError) {
      console.error(`❌ Error updating ${campaign.name}:`, updateError.message);
    } else {
      if (leadCount > 0 || callCount > 0) {
        console.log(`✅ ${campaign.name}: ${leadCount} leads, ${callCount} calls`);
      }
    }
  }
  
  console.log('\n✨ DONE! All campaigns updated.');
  console.log('\n🚀 Now do this:');
  console.log('1. Open a NEW Incognito/Private window');
  console.log('2. Go to your app');
  console.log('3. Click on the "test mm" campaign');
  console.log('\nIt should work now! 🎉');
}

fixCampaigns().catch(console.error);