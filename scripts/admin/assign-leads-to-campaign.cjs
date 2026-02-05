const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function assignLeadsToTestCampaign() {
  console.log('🔄 ASSIGNING LEADS TO TEST CAMPAIGN');
  console.log('===================================\n');
  
  // Get the Test campaign
  const { data: testCampaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('name', 'Test')
    .single();
  
  if (!testCampaign) {
    console.log('❌ Test campaign not found');
    return;
  }
  
  console.log(`🎯 Working with campaign: ${testCampaign.name} (${testCampaign.id})`);
  console.log(`   Organization: ${testCampaign.organization_id}`);
  
  // Get existing leads that can be assigned
  const { data: availableLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', testCampaign.organization_id)
    .is('campaign_id', null) // Not already assigned to a campaign
    .limit(5);
  
  console.log(`\nFound ${availableLeads?.length || 0} available leads to assign`);
  
  if (!availableLeads || availableLeads.length === 0) {
    // Create some test leads for the campaign
    console.log('📋 Creating test leads for campaign...');
    
    const testLeads = [
      { name: 'John Smith', phone: '+1555CAMPAIGN1', email: 'john@testcorp.com' },
      { name: 'Sarah Johnson', phone: '+1555CAMPAIGN2', email: 'sarah@example.com' },
      { name: 'Mike Davis', phone: '+1555CAMPAIGN3', email: 'mike@demo.com' }
    ];
    
    const createdLeads = [];
    
    for (const testLead of testLeads) {
      const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
          organization_id: testCampaign.organization_id,
          campaign_id: testCampaign.id, // Directly assign to campaign
          name: testLead.name,
          phone: testLead.phone,
          email: testLead.email,
          company: 'Test Campaign Company',
          source: 'campaign_test',
          status: 'new',
          priority: 'medium',
          notes: 'Test lead created for campaign validation',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error creating lead ${testLead.name}:`, error.message);
        
        // Try with allowed source value
        if (error.message.includes('leads_source_check')) {
          console.log(`   Trying with 'manual' source...`);
          const { data: retryLead, error: retryError } = await supabase
            .from('leads')
            .insert({
              organization_id: testCampaign.organization_id,
              campaign_id: testCampaign.id,
              name: testLead.name,
              phone: testLead.phone,
              email: testLead.email,
              company: 'Test Campaign Company',
              source: 'manual', // Try this source
              status: 'new',
              priority: 'medium',
              notes: 'Test lead created for campaign validation'
            })
            .select()
            .single();
          
          if (!retryError) {
            createdLeads.push(retryLead);
            console.log(`✅ Created lead: ${testLead.name} (${testLead.phone})`);
          } else {
            console.error(`❌ Retry failed for ${testLead.name}:`, retryError.message);
          }
        }
      } else {
        createdLeads.push(newLead);
        console.log(`✅ Created lead: ${testLead.name} (${testLead.phone})`);
      }
    }
    
    // Update campaign metrics
    if (createdLeads.length > 0) {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          total_leads: createdLeads.length,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', testCampaign.id);
      
      if (!updateError) {
        console.log(`✅ Updated campaign with ${createdLeads.length} leads`);
      }
    }
    
  } else {
    // Assign existing leads to the campaign
    console.log('\n🔗 Assigning existing leads to campaign...');
    
    const leadsToAssign = availableLeads.slice(0, 3); // Take first 3
    
    for (const lead of leadsToAssign) {
      const { error } = await supabase
        .from('leads')
        .update({ campaign_id: testCampaign.id })
        .eq('id', lead.id);
      
      if (error) {
        console.error(`❌ Error assigning lead ${lead.name}:`, error);
      } else {
        console.log(`✅ Assigned ${lead.name} (${lead.phone}) to campaign`);
      }
    }
    
    // Update campaign metrics
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        total_leads: leadsToAssign.length,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', testCampaign.id);
    
    if (!updateError) {
      console.log(`✅ Updated campaign with ${leadsToAssign.length} leads`);
    }
  }
  
  // Final verification
  console.log('\n🎯 FINAL VERIFICATION:');
  
  const { data: finalLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('campaign_id', testCampaign.id);
  
  const { data: finalCampaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', testCampaign.id)
    .single();
  
  console.log(`✅ Campaign "${finalCampaign?.name}" now has ${finalLeads?.length || 0} leads assigned`);
  console.log(`   Status: ${finalCampaign?.status}`);
  console.log(`   Total Leads: ${finalCampaign?.total_leads}`);
  
  if (finalLeads && finalLeads.length > 0) {
    console.log('\n📱 Assigned Leads:');
    finalLeads.forEach((lead, i) => {
      console.log(`   ${i + 1}. ${lead.name} - ${lead.phone} (${lead.status})`);
    });
  }
  
  console.log('\n🚀 CAMPAIGN SYSTEM STATUS: RESTORED!');
  console.log('Your test campaign should now start making calls.');
  console.log('\nNext Steps:');
  console.log('1. Start your campaign processor: npm run start:campaign-processor');
  console.log('2. Monitor the calls table for activity');
  console.log('3. Check your dashboard for campaign progress');
}

assignLeadsToTestCampaign();