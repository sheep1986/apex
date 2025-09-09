// API endpoint to check for duplicate leads before campaign launch
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  'https://twigokrtbvigiqnaybfy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// POST /api/check-duplicates
app.post('/api/check-duplicates', async (req, res) => {
  try {
    const { csvData, organizationId } = req.body;
    
    if (!csvData || !organizationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Parse CSV
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return res.json({ duplicates: [], newLeads: [] });
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const phoneIndex = headers.findIndex(h => 
      h.includes('phone') || h.includes('number') || h.includes('mobile')
    );
    
    if (phoneIndex === -1) {
      return res.status(400).json({ error: 'No phone column found in CSV' });
    }
    
    const phones = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values[phoneIndex]) {
        phones.push(values[phoneIndex]);
      }
    }
    
    // Check for existing leads
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('phone, campaign_id, first_name, last_name, call_status')
      .eq('organization_id', organizationId)
      .in('phone', phones);
    
    const existingPhoneMap = new Map();
    existingLeads?.forEach(lead => {
      if (!existingPhoneMap.has(lead.phone)) {
        existingPhoneMap.set(lead.phone, []);
      }
      existingPhoneMap.get(lead.phone).push(lead);
    });
    
    // Get campaign names for duplicates
    const campaignIds = [...new Set(existingLeads?.map(l => l.campaign_id).filter(id => id))];
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name')
      .in('id', campaignIds);
    
    const campaignMap = new Map(campaigns?.map(c => [c.id, c.name]));
    
    // Build response
    const duplicates = [];
    const newLeads = [];
    
    phones.forEach(phone => {
      const existing = existingPhoneMap.get(phone);
      if (existing) {
        duplicates.push({
          phone,
          count: existing.length,
          campaigns: existing.map(lead => ({
            campaignName: campaignMap.get(lead.campaign_id) || 'Unknown',
            campaignId: lead.campaign_id,
            leadName: `${lead.first_name} ${lead.last_name}`.trim(),
            callStatus: lead.call_status
          }))
        });
      } else {
        newLeads.push(phone);
      }
    });
    
    res.json({
      duplicates,
      newLeads,
      totalDuplicates: duplicates.length,
      totalNew: newLeads.length,
      totalLeads: phones.length
    });
    
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/campaign/launch-with-duplicates
app.post('/api/campaign/launch-with-duplicates', async (req, res) => {
  try {
    const { campaignId, organizationId, allowDuplicates } = req.body;
    
    // Add a flag to campaign settings
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('settings')
      .eq('id', campaignId)
      .single();
    
    const updatedSettings = {
      ...campaign.settings,
      allowDuplicates: allowDuplicates,
      duplicatesBypassedAt: new Date().toISOString()
    };
    
    await supabase
      .from('campaigns')
      .update({ settings: updatedSettings })
      .eq('id', campaignId);
    
    res.json({ success: true, message: 'Campaign updated with duplicate bypass flag' });
    
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`
============================================
    DUPLICATE CHECK API RUNNING
============================================
Server running at: http://localhost:${PORT}

Endpoints:
  POST /api/check-duplicates - Check for duplicate phone numbers
  POST /api/campaign/launch-with-duplicates - Launch with bypass flag

============================================
  `);
});