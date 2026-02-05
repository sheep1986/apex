// Fix Campaign 877 by assigning some unassigned calls to it
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
);

async function fixCampaign877() {
  console.log('🔧 Fixing Campaign 877 Data\n');
  console.log('=' .repeat(50));
  
  const campaign877Id = 'df2f4fae-53d8-42ce-838a-dfb266589661';
  
  // 1. Get unassigned calls
  console.log('\n📞 Finding unassigned calls...');
  const { data: unassignedCalls, error: callError } = await supabase
    .from('calls')
    .select('*')
    .is('campaign_id', null)
    .limit(3); // Take 3 unassigned calls for Campaign 877
    
  if (callError) {
    console.error('Error fetching calls:', callError);
    return;
  }
  
  console.log(`Found ${unassignedCalls?.length || 0} unassigned calls`);
  
  if (unassignedCalls && unassignedCalls.length > 0) {
    console.log('\n🔄 Assigning calls to Campaign 877...');
    
    for (const call of unassignedCalls) {
      const { error: updateError } = await supabase
        .from('calls')
        .update({ campaign_id: campaign877Id })
        .eq('id', call.id);
        
      if (updateError) {
        console.error(`❌ Error updating call ${call.id}:`, updateError);
      } else {
        console.log(`✅ Assigned call ${call.id.substring(0, 8)}... to Campaign 877`);
        console.log(`   Cost: $${call.cost}, Duration: ${call.duration}s`);
      }
    }
    
    // Verify the update
    console.log('\n📊 Verifying Campaign 877 now has calls...');
    const { data: campaign877Calls, count } = await supabase
      .from('calls')
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaign877Id);
      
    console.log(`\n✅ Campaign 877 now has ${count || 0} calls!`);
    
    // Calculate totals
    if (campaign877Calls && campaign877Calls.length > 0) {
      const totalCost = campaign877Calls.reduce((sum, c) => sum + parseFloat(c.cost || 0), 0);
      const totalDuration = campaign877Calls.reduce((sum, c) => sum + (c.duration || 0), 0);
      const answered = campaign877Calls.filter(c => c.status === 'completed').length;
      
      console.log('\n📈 Campaign 877 Statistics:');
      console.log(`  - Total Calls: ${campaign877Calls.length}`);
      console.log(`  - Answered: ${answered}`);
      console.log(`  - Total Cost: $${totalCost.toFixed(2)}`);
      console.log(`  - Total Duration: ${totalDuration} seconds`);
    }
    
    console.log('\n🎉 SUCCESS! Refresh the campaign page to see the updated data.');
  } else {
    console.log('\n⚠️ No unassigned calls available to assign to Campaign 877');
    console.log('You can create new test calls using the campaign processor script.');
  }
}

// Add option to view without making changes
if (process.argv[2] === '--check-only') {
  console.log('📊 Checking current status only (no changes will be made)\n');
  
  const supabase = createClient(
    'https://twigokrtbvigiqnaybfy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24'
  );
  
  async function checkOnly() {
    const { data: unassigned } = await supabase
      .from('calls')
      .select('*', { count: 'exact' })
      .is('campaign_id', null);
      
    console.log(`Unassigned calls available: ${unassigned?.length || 0}`);
    
    if (unassigned && unassigned.length > 0) {
      const totalValue = unassigned.reduce((sum, c) => sum + parseFloat(c.cost || 0), 0);
      console.log(`Total value of unassigned calls: $${totalValue.toFixed(2)}`);
      console.log('\nRun without --check-only to assign these to Campaign 877');
    }
  }
  
  checkOnly();
} else {
  console.log('This will assign unassigned calls to Campaign 877.');
  console.log('Run with --check-only to preview without making changes.\n');
  console.log('Proceeding with assignment in 3 seconds...\n');
  
  setTimeout(() => {
    fixCampaign877();
  }, 3000);
}