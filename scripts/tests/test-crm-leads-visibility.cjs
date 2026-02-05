const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCRMLeadsVisibility() {
  console.log('🔍 TESTING CRM LEADS VISIBILITY');
  console.log('==============================\n');
  
  const orgId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
  
  // Test the exact query the CRM will now use
  console.log('📊 Testing CRM query (simplified):');
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Query error:', error);
    return;
  }
  
  console.log(`✅ Query successful: ${data?.length || 0} leads found\n`);
  
  // Transform the data exactly like the CRM will
  console.log('🔄 Testing data transformation:');
  
  const transformedContacts = (data || []).map((lead, index) => {
    // Extract first and last name from the name field
    const nameParts = (lead.name || '').split(' ');
    const firstName = nameParts[0] || undefined;
    const lastName = nameParts.slice(1).join(' ') || undefined;
    
    const transformed = {
      id: lead.id,
      firstName: firstName,
      lastName: lastName,
      email: lead.email || undefined,
      phone: lead.phone || undefined,
      company: lead.company || 'Unknown Company',
      status: lead.status || 'new',
      priority: lead.priority || 'medium',
      source: lead.source || 'call',
      campaign: lead.campaign_id ? `Campaign ${lead.campaign_id.substring(0, 8)}` : 'No Campaign',
      notes: lead.notes || undefined,
      date: lead.created_at,
      lastActivity: lead.updated_at || lead.created_at,
      activities: lead.call_id ? 1 : 0
    };
    
    console.log(`${index + 1}. Contact: ${transformed.firstName || 'Unknown'} ${transformed.lastName || ''}`);
    console.log(`   Phone: ${transformed.phone}`);
    console.log(`   Company: ${transformed.company}`);
    console.log(`   Status: ${transformed.status}`);
    console.log(`   Priority: ${transformed.priority}`);
    console.log(`   Source: ${transformed.source}`);
    console.log(`   Campaign: ${transformed.campaign}`);
    console.log(`   Date: ${new Date(transformed.date).toLocaleDateString()}`);
    console.log(`   Activities: ${transformed.activities}`);
    console.log('');
    
    return transformed;
  });
  
  console.log('🎯 SUMMARY:');
  console.log(`Total contacts that will appear in CRM: ${transformedContacts.length}`);
  
  const sourceBreakdown = {};
  const statusBreakdown = {};
  const campaignBreakdown = {};
  
  transformedContacts.forEach(contact => {
    sourceBreakdown[contact.source] = (sourceBreakdown[contact.source] || 0) + 1;
    statusBreakdown[contact.status] = (statusBreakdown[contact.status] || 0) + 1;
    campaignBreakdown[contact.campaign] = (campaignBreakdown[contact.campaign] || 0) + 1;
  });
  
  console.log('\n📊 Breakdown by Source:');
  Object.entries(sourceBreakdown).forEach(([source, count]) => {
    console.log(`   ${source}: ${count}`);
  });
  
  console.log('\n📊 Breakdown by Status:');
  Object.entries(statusBreakdown).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
  
  console.log('\n📊 Breakdown by Campaign:');
  Object.entries(campaignBreakdown).forEach(([campaign, count]) => {
    console.log(`   ${campaign}: ${count}`);
  });
  
  // Check if the test lead we created shows up
  const testLead = transformedContacts.find(c => c.phone === '+1555CRMTEST');
  if (testLead) {
    console.log('\n✅ Test lead found! This confirms the fix works.');
    console.log(`   Test Lead: ${testLead.firstName} - ${testLead.phone}`);
  } else {
    console.log('\n⚠️  Test lead not found in results');
  }
  
  console.log('\n🚀 EXPECTED RESULT:');
  console.log('After reloading your CRM dashboard, you should see:');
  console.log(`- ${transformedContacts.length} leads displayed`);
  console.log('- Names properly split from the name field');
  console.log('- All auto-converted leads visible');
  console.log('- Campaign assignments shown');
  console.log('- Source field correctly mapped');
  
  console.log('\n💡 TO APPLY THE FIX:');
  console.log('1. The ContactsContext.tsx has been updated');
  console.log('2. Restart your frontend development server');
  console.log('3. Refresh the CRM page');
  console.log('4. All leads should now be visible!');
}

testCRMLeadsVisibility();