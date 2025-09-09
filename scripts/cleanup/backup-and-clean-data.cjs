const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

// Create backup directory
const backupDir = path.join(__dirname, `../../backups/backup_${new Date().toISOString().split('T')[0]}`);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function backupData() {
  console.log('📦 Starting backup process...\n');
  
  // Backup campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*');
  fs.writeFileSync(
    path.join(backupDir, 'campaigns_backup.json'),
    JSON.stringify(campaigns, null, 2)
  );
  console.log(`✅ Backed up ${campaigns.length} campaigns`);
  
  // Backup leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*');
  fs.writeFileSync(
    path.join(backupDir, 'leads_backup.json'),
    JSON.stringify(leads, null, 2)
  );
  console.log(`✅ Backed up ${leads.length} leads`);
  
  // Backup calls
  const { data: calls } = await supabase
    .from('calls')
    .select('*');
  fs.writeFileSync(
    path.join(backupDir, 'calls_backup.json'),
    JSON.stringify(calls, null, 2)
  );
  console.log(`✅ Backed up ${calls.length} calls`);
  
  console.log(`\n📁 Backup saved to: ${backupDir}\n`);
  return { campaigns, leads, calls };
}

async function identifyTestData(campaigns) {
  const testPatterns = [
    /test/i,
    /demo campaign/i,
    /^11-/,
    /^12-/,
    /TST\d+/,
    /Sample Campaign/i,
    /Test Corp/i,
    /ACME/i
  ];
  
  const realCampaigns = [];
  const testCampaigns = [];
  
  for (const campaign of campaigns) {
    const isTest = testPatterns.some(pattern => 
      pattern.test(campaign.name) || 
      pattern.test(campaign.organization_id || '')
    );
    
    // Explicitly keep Emerald Green Energy Demo
    if (campaign.name === 'Emerald Green Energy Demo' || 
        campaign.id === '919c627d-31f3-4850-bba2-77d81021df94') {
      realCampaigns.push(campaign);
    } else if (isTest) {
      testCampaigns.push(campaign);
    } else {
      // Campaigns that might be real but need review
      console.log(`⚠️  Review needed: "${campaign.name}" (ID: ${campaign.id})`);
      testCampaigns.push(campaign); // Default to test for safety
    }
  }
  
  return { realCampaigns, testCampaigns };
}

async function cleanTestData(dryRun = true) {
  console.log(`🧹 Starting cleanup (${dryRun ? 'DRY RUN' : 'LIVE'})...\n`);
  
  // Get all data
  const { campaigns, leads, calls } = await backupData();
  
  // Identify test vs real campaigns
  const { realCampaigns, testCampaigns } = await identifyTestData(campaigns);
  
  console.log('\n📊 Data Analysis:');
  console.log(`   Real campaigns: ${realCampaigns.length}`);
  console.log(`   Test campaigns: ${testCampaigns.length}`);
  
  // Show what will be kept
  console.log('\n✅ Will KEEP:');
  realCampaigns.forEach(c => {
    console.log(`   - ${c.name} (ID: ${c.id})`);
  });
  
  // Show what will be deleted
  console.log('\n❌ Will DELETE:');
  testCampaigns.forEach(c => {
    console.log(`   - ${c.name} (ID: ${c.id})`);
  });
  
  const testCampaignIds = testCampaigns.map(c => c.id);
  
  // Count related data that will be deleted
  const testLeads = leads.filter(l => testCampaignIds.includes(l.campaign_id));
  const testCalls = calls.filter(c => testCampaignIds.includes(c.campaign_id));
  
  console.log(`\n📈 Impact Summary:`);
  console.log(`   Campaigns to delete: ${testCampaigns.length}`);
  console.log(`   Leads to delete: ${testLeads.length}`);
  console.log(`   Calls to delete: ${testCalls.length}`);
  
  if (!dryRun) {
    console.log('\n🗑️  Performing deletion...');
    
    // Delete calls first (foreign key constraint)
    if (testCalls.length > 0) {
      const { error: callError } = await supabase
        .from('calls')
        .delete()
        .in('campaign_id', testCampaignIds);
      
      if (callError) {
        console.error('❌ Error deleting calls:', callError);
        return;
      }
      console.log(`✅ Deleted ${testCalls.length} test calls`);
    }
    
    // Delete leads
    if (testLeads.length > 0) {
      const { error: leadError } = await supabase
        .from('leads')
        .delete()
        .in('campaign_id', testCampaignIds);
      
      if (leadError) {
        console.error('❌ Error deleting leads:', leadError);
        return;
      }
      console.log(`✅ Deleted ${testLeads.length} test leads`);
    }
    
    // Delete campaigns
    if (testCampaigns.length > 0) {
      const { error: campaignError } = await supabase
        .from('campaigns')
        .delete()
        .in('id', testCampaignIds);
      
      if (campaignError) {
        console.error('❌ Error deleting campaigns:', campaignError);
        return;
      }
      console.log(`✅ Deleted ${testCampaigns.length} test campaigns`);
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    
    // Verify final state
    const { data: remainingCampaigns } = await supabase
      .from('campaigns')
      .select('*');
    
    console.log(`\n📊 Final State:`);
    console.log(`   Remaining campaigns: ${remainingCampaigns.length}`);
    remainingCampaigns.forEach(c => {
      console.log(`   - ${c.name}`);
    });
  } else {
    console.log('\n⚠️  This was a DRY RUN. No data was deleted.');
    console.log('   Run with --live flag to perform actual deletion.');
  }
}

// Check for command line arguments
const isLive = process.argv.includes('--live');

// Run the cleanup
cleanTestData(!isLive).catch(console.error);