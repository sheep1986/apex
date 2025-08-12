#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://twigokrtbvigiqnaybfy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY_HERE';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSupabaseCampaigns() {
  try {
    console.log('🔍 Checking Supabase campaigns table...\n');

    // Get all campaigns
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching campaigns:', error);
      return;
    }

    console.log(`✅ Found ${campaigns?.length || 0} campaigns in Supabase:\n`);

    if (campaigns && campaigns.length > 0) {
      campaigns.forEach((campaign, index) => {
        console.log(`Campaign ${index + 1}:`);
        console.log(`- ID: ${campaign.id}`);
        console.log(`- Name: ${campaign.name}`);
        console.log(`- Organization ID: ${campaign.organization_id}`);
        console.log(`- Status: ${campaign.status}`);
        console.log(`- Type: ${campaign.type}`);
        console.log(`- Created: ${campaign.created_at}`);
        console.log('');
      });

      // Check for the specific campaign ID from the screenshot
      const targetId = '81d04c8a-ad5a-40b1-95e6-9c2499a2da42';
      const found = campaigns.find(c => c.id === targetId);
      
      if (found) {
        console.log(`✅ Found campaign ${targetId}!`);
        console.log('Full details:', JSON.stringify(found, null, 2));
      } else {
        console.log(`❌ Campaign ${targetId} not found in the results`);
      }
    }

    // Also check organizations to understand the mapping
    console.log('\n🔍 Checking organizations...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);

    if (!orgError && orgs) {
      console.log('\nOrganizations:');
      orgs.forEach(org => {
        console.log(`- ${org.id}: ${org.name}`);
      });
    }

    // Check campaign_contacts table
    console.log('\n🔍 Checking campaign_contacts...');
    const { data: contacts, error: contactsError } = await supabase
      .from('campaign_contacts')
      .select('campaign_id, COUNT(*)')
      .limit(10);

    if (!contactsError && contacts) {
      console.log(`Found contacts in ${contacts.length} campaigns`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkSupabaseCampaigns();