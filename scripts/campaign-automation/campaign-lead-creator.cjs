// Campaign Lead Creator - Automatically creates leads from CSV when campaign is created
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

class CampaignLeadCreator {
  constructor() {
    this.organizationId = '2566d8c5-2245-4a3c-b539-4cea21a07d9b';
    this.processedCampaigns = new Set();
  }

  parseCSV(csvData) {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const leads = [];
    
    // Find column indices
    const phoneIndex = headers.findIndex(h => 
      h.includes('phone') || h.includes('number') || h.includes('mobile')
    );
    const firstNameIndex = headers.findIndex(h => 
      h === 'firstname' || h === 'first_name' || h === 'name' || h === 'first'
    );
    const lastNameIndex = headers.findIndex(h => 
      h === 'lastname' || h === 'last_name' || h === 'surname' || h === 'last'
    );
    const emailIndex = headers.findIndex(h => 
      h.includes('email')
    );
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (phoneIndex >= 0 && values[phoneIndex]) {
        const firstName = firstNameIndex >= 0 ? values[firstNameIndex] : `Contact${i}`;
        const lastName = lastNameIndex >= 0 ? values[lastNameIndex] : '';
        const email = emailIndex >= 0 ? values[emailIndex] : '';
        
        // Store additional fields as custom data
        const customData = {};
        headers.forEach((header, idx) => {
          if (idx !== phoneIndex && idx !== firstNameIndex && 
              idx !== lastNameIndex && idx !== emailIndex) {
            customData[header] = values[idx] || '';
          }
        });
        
        leads.push({
          phone: values[phoneIndex],
          first_name: firstName || 'Contact',
          last_name: lastName || '',
          email: email || '',
          custom_data: customData
        });
      }
    }
    
    return leads;
  }

  async processCampaign(campaign) {
    try {
      console.log(`\n📊 Processing campaign: ${campaign.name}`);
      
      // Check if CSV data exists
      const csvData = campaign.settings?.csv_data;
      if (!csvData) {
        console.log('  No CSV data found');
        return;
      }
      
      // Check if duplicates are allowed
      const allowDuplicates = campaign.settings?.allowDuplicates || false;
      if (allowDuplicates) {
        console.log('  ⚠️ Duplicate bypass enabled for this campaign');
      }
      
      // Parse CSV
      const parsedLeads = this.parseCSV(csvData);
      if (parsedLeads.length === 0) {
        console.log('  No valid leads found in CSV');
        return;
      }
      
      console.log(`  Found ${parsedLeads.length} leads in CSV`);
      
      // Check existing leads for this campaign
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('phone')
        .eq('campaign_id', campaign.id);
        
      const existingPhones = new Set(existingLeads?.map(l => l.phone) || []);
      
      // Create new leads
      let created = 0;
      let skipped = 0;
      let moved = 0;
      
      for (const leadData of parsedLeads) {
        if (existingPhones.has(leadData.phone)) {
          skipped++;
          continue;
        }
        
        // Check if lead exists in organization (different campaign)
        const { data: existingOrgLead } = await supabase
          .from('leads')
          .select('*')
          .eq('organization_id', this.organizationId)
          .eq('phone', leadData.phone)
          .single();
          
        if (existingOrgLead) {
          if (allowDuplicates) {
            // Create duplicate lead with bypass flag
            const { error } = await supabase
              .from('leads')
              .insert({
                organization_id: this.organizationId,
                campaign_id: campaign.id,
                first_name: leadData.first_name,
                last_name: leadData.last_name,
                phone: leadData.phone,
                email: leadData.email,
                custom_fields: {
                  ...leadData.custom_data,
                  is_duplicate: true,
                  original_lead_id: existingOrgLead.id
                },
                status: 'pending',
                call_status: 'pending',
                created_at: new Date().toISOString()
              });
              
            if (!error) {
              created++;
              console.log(`    Created duplicate lead (bypass): ${leadData.phone}`);
            }
          } else {
            // Move existing lead to this campaign
            const { error: moveError } = await supabase
              .from('leads')
              .update({
                campaign_id: campaign.id,
                call_status: 'pending',
                status: 'pending',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingOrgLead.id);
              
            if (!moveError) {
              moved++;
              console.log(`    Moved existing lead: ${leadData.phone}`);
            }
          }
        } else {
          // Create new lead
          const { error } = await supabase
            .from('leads')
            .insert({
              organization_id: this.organizationId,
              campaign_id: campaign.id,
              first_name: leadData.first_name,
              last_name: leadData.last_name,
              phone: leadData.phone,
              email: leadData.email,
              custom_fields: leadData.custom_data,
              status: 'pending',
              call_status: 'pending',
              created_at: new Date().toISOString()
            });
            
          if (!error) {
            created++;
          }
        }
      }
      
      console.log(`  ✅ Created ${created} new leads, moved ${moved} existing, skipped ${skipped}`);
      
      // Update campaign with lead count
      await supabase
        .from('campaigns')
        .update({
          total_leads: existingPhones.size + created,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign.id);
        
    } catch (error) {
      console.error(`  ❌ Error processing campaign: ${error.message}`);
    }
  }

  async checkForNewCampaigns() {
    try {
      // Get recent campaigns (created in last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
      
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', this.organizationId)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false });
        
      if (!campaigns || campaigns.length === 0) {
        return;
      }
      
      for (const campaign of campaigns) {
        if (!this.processedCampaigns.has(campaign.id)) {
          await this.processCampaign(campaign);
          this.processedCampaigns.add(campaign.id);
        }
      }
      
    } catch (error) {
      console.error('Error checking campaigns:', error);
    }
  }

  async run() {
    console.log('🚀 Campaign Lead Creator Started');
    console.log('📊 Monitoring for new campaigns...\n');
    
    // Check every 10 seconds
    while (true) {
      await this.checkForNewCampaigns();
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

// Start the lead creator
const creator = new CampaignLeadCreator();

process.on('SIGINT', () => {
  console.log('\n🛑 Stopping lead creator...');
  process.exit(0);
});

creator.run().catch(console.error);