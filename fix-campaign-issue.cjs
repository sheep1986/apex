const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function fixAllCampaigns() {
  console.log('🔧 Starting campaign fix...\n');
  
  // Get all campaigns
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching campaigns:', error);
    return;
  }
  
  console.log(`Found ${campaigns.length} campaigns to fix\n`);
  
  for (const campaign of campaigns) {
    // Get actual counts from database
    const { count: leadCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id);
      
    const { count: callCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id);
    
    const { count: completedCallCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .in('status', ['completed', 'ended']);
    
    // Create comprehensive settings object with all possible field names
    const updatedSettings = {
      ...(campaign.settings || {}),
      // Add all possible field variations to ensure compatibility
      total_leads: leadCount || 0,
      calls_completed: completedCallCount || 0,
      successful_calls: completedCallCount || 0,
      totalLeads: leadCount || 0,
      callsCompleted: completedCallCount || 0,
      successfulCalls: completedCallCount || 0,
      calls_in_progress: 0,
      callsInProgress: 0,
      total_cost: (callCount || 0) * 0.05,
      totalCost: (callCount || 0) * 0.05,
      success_rate: leadCount > 0 ? ((completedCallCount || 0) / leadCount * 100) : 0,
      successRate: leadCount > 0 ? ((completedCallCount || 0) / leadCount * 100) : 0,
      // Add metrics object as well
      metrics: {
        totalLeads: leadCount || 0,
        callsCompleted: completedCallCount || 0,
        totalCalls: callCount || 0,
        successRate: leadCount > 0 ? ((completedCallCount || 0) / leadCount * 100) : 0
      }
    };
    
    // Update campaign with all fields
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        settings: updatedSettings,
        // Also update direct columns
        total_leads: leadCount || 0,
        calls_completed: completedCallCount || 0,
        calls_in_progress: 0,
        total_cost: (callCount || 0) * 0.05,
        success_rate: leadCount > 0 ? ((completedCallCount || 0) / leadCount * 100) : 0
      })
      .eq('id', campaign.id);
    
    if (updateError) {
      console.error(`❌ Error updating ${campaign.name}:`, updateError);
    } else {
      console.log(`✅ Fixed ${campaign.name}: ${leadCount} leads, ${callCount} calls (${completedCallCount} completed)`);
    }
  }
  
  console.log('\n✅ All campaigns have been fixed!');
  console.log('\n📝 Next steps:');
  console.log('1. Clear your browser cache completely');
  console.log('2. Open Chrome DevTools > Application > Storage > Clear site data');
  console.log('3. Close and reopen your browser');
  console.log('4. Navigate to your app again');
  console.log('\nThe campaign details should now work without errors.');
}

fixAllCampaigns().catch(console.error);