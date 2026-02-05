const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCRMLeadsDisplay() {
  console.log('🔍 CHECKING CRM LEADS DISPLAY ISSUE');
  console.log('===================================\n');
  
  // Get the organization ID that Manus is using
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (!campaigns || campaigns.length === 0) {
    console.log('❌ No campaigns found');
    return;
  }
  
  const orgId = campaigns[0].organization_id;
  console.log(`🏢 Checking organization: ${orgId}\n`);
  
  // Check ALL leads in the database
  console.log('📊 DATABASE LEADS ANALYSIS:');
  
  const { data: allLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
  
  console.log(`Total leads in database: ${allLeads?.length || 0}\n`);
  
  if (allLeads && allLeads.length > 0) {
    console.log('📋 ALL LEADS IN DATABASE:');
    allLeads.forEach((lead, i) => {
      console.log(`${i + 1}. ID: ${lead.id}`);
      console.log(`   Name: "${lead.name}"`);
      console.log(`   Phone: "${lead.phone}"`);
      console.log(`   Email: "${lead.email}"`);
      console.log(`   Company: "${lead.company}"`);
      console.log(`   Source: "${lead.source}"`);
      console.log(`   Status: "${lead.status}"`);
      console.log(`   Priority: "${lead.priority}"`);
      console.log(`   Campaign ID: ${lead.campaign_id || 'None'}`);
      console.log(`   Call ID: ${lead.call_id || 'None'}`);
      console.log(`   Created: ${new Date(lead.created_at).toLocaleString()}`);
      console.log(`   Updated: ${new Date(lead.updated_at).toLocaleString()}`);
      console.log('');
    });
  }
  
  // Check for potential RLS (Row Level Security) issues
  console.log('🔒 ROW LEVEL SECURITY CHECK:');
  
  // Try accessing with different filters to see if RLS is blocking
  const { data: publicLeads, error: publicError } = await supabase
    .from('leads')
    .select('*')
    .limit(5);
  
  if (publicError) {
    console.log('❌ RLS Error when accessing leads:');
    console.log(`   Error: ${publicError.message}`);
    console.log('   This could explain why CRM shows no leads!');
  } else {
    console.log(`✅ Can access ${publicLeads?.length || 0} leads via public query`);
  }
  
  // Check if there are source constraints
  console.log('\n📝 SOURCE VALUE ANALYSIS:');
  const sourceValues = [...new Set(allLeads?.map(lead => lead.source).filter(Boolean))];
  console.log(`Unique source values: ${sourceValues.join(', ')}`);
  
  // Check if there are status constraints  
  const statusValues = [...new Set(allLeads?.map(lead => lead.status).filter(Boolean))];
  console.log(`Unique status values: ${statusValues.join(', ')}`);
  
  // Check campaign assignments
  console.log('\n🎯 CAMPAIGN ASSIGNMENT ANALYSIS:');
  const leadsWithCampaigns = allLeads?.filter(lead => lead.campaign_id) || [];
  const leadsWithoutCampaigns = allLeads?.filter(lead => !lead.campaign_id) || [];
  
  console.log(`Leads WITH campaign assignment: ${leadsWithCampaigns.length}`);
  console.log(`Leads WITHOUT campaign assignment: ${leadsWithoutCampaigns.length}`);
  
  if (leadsWithCampaigns.length > 0) {
    console.log('\nLeads assigned to campaigns:');
    leadsWithCampaigns.forEach((lead, i) => {
      console.log(`   ${i + 1}. ${lead.name} → Campaign ${lead.campaign_id}`);
    });
  }
  
  // Check what the CRM frontend might be filtering by
  console.log('\n🔍 POSSIBLE CRM FILTERING ISSUES:');
  
  const issues = [];
  
  if (allLeads && allLeads.length > 0 && publicError) {
    issues.push('RLS (Row Level Security) is blocking access to leads');
  }
  
  if (allLeads && allLeads.every(lead => lead.source === 'call')) {
    issues.push('All leads have source="call" - CRM might filter these out');
  }
  
  if (allLeads && allLeads.every(lead => !lead.campaign_id)) {
    issues.push('No leads have campaign assignments - CRM might only show campaign leads');
  }
  
  if (allLeads && allLeads.every(lead => lead.call_id)) {
    issues.push('All leads are auto-converted from calls - CRM might hide these');
  }
  
  if (issues.length > 0) {
    console.log('⚠️  POTENTIAL ISSUES IDENTIFIED:');
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  } else {
    console.log('✅ No obvious filtering issues detected');
  }
  
  // Provide solutions
  console.log('\n🔧 SOLUTIONS TO TRY:');
  console.log('1. Check CRM frontend for source/status filters');
  console.log('2. Verify RLS policies allow viewing leads');
  console.log('3. Create a manual lead (source="manual") to test display');
  console.log('4. Check if CRM only shows leads with campaign_id assigned');
  console.log('5. Review CRM component query/filtering logic');
  
  console.log('\n💡 QUICK TEST: Creating a simple manual lead...');
  
  // Try to create a simple manual lead
  const { data: testLead, error: testError } = await supabase
    .from('leads')
    .insert({
      organization_id: orgId,
      name: 'CRM Test Lead',
      phone: '+1555CRMTEST',
      email: 'test@crmtest.com',
      company: 'CRM Test Company',
      source: 'manual',
      status: 'new',
      priority: 'high',
      notes: 'Test lead to verify CRM display',
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (testError) {
    console.log(`❌ Cannot create test lead: ${testError.message}`);
    
    // Try with different source values
    const allowedSources = ['call', 'web', 'manual', 'import', 'referral'];
    
    for (const source of allowedSources) {
      const { error: sourceError } = await supabase
        .from('leads')
        .insert({
          organization_id: orgId,
          name: 'CRM Test Lead',
          phone: `+1555TEST${source.toUpperCase()}`,
          company: 'Test Company',
          source: source,
          status: 'new',
          priority: 'medium',
          notes: `Test lead with source: ${source}`
        })
        .select()
        .single();
      
      if (!sourceError) {
        console.log(`✅ Successfully created test lead with source: "${source}"`);
        console.log('   Check your CRM dashboard now - this lead should appear!');
        break;
      } else {
        console.log(`❌ Failed with source "${source}": ${sourceError.message}`);
      }
    }
  } else {
    console.log('✅ Created test lead successfully!');
    console.log(`   Name: ${testLead.name}`);
    console.log(`   Phone: ${testLead.phone}`);
    console.log('   Check your CRM dashboard - this lead should appear!');
  }
}

checkCRMLeadsDisplay();