const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchVapiAssistantDetails(assistantId) {
  if (!assistantId) {
    console.log('No assistant ID provided');
    return null;
  }
  
  console.log('🔄 Fetching VAPI assistant details for:', assistantId);
  
  try {
    const vapiApiKey = 'da8956d4-0508-474e-bd96-7eda82d2d943';
    const response = await fetch(
      `https://api.vapi.ai/assistant/${assistantId}`,
      {
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      console.error('❌ VAPI API error:', response.status, response.statusText);
      return null;
    }
    
    const assistant = await response.json();
    console.log('✅ Assistant details:', {
      name: assistant.name,
      voice: assistant.voice?.model || assistant.transcriber?.model,
      systemPrompt: assistant.model?.messages?.[0]?.content?.substring(0, 100) + '...'
    });
    
    return {
      name: assistant.name || 'AI Assistant',
      voice: assistant.voice || {},
      systemPrompt: assistant.model?.messages?.[0]?.content || assistant.firstMessage || '',
      phoneNumberId: assistant.phoneNumberId,
      model: assistant.model
    };
  } catch (error) {
    console.error('❌ Error fetching assistant:', error.message);
    return null;
  }
}

async function updateCampaignWithVapiData(campaignId) {
  // Get campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
  
  if (!campaign) {
    console.log('❌ Campaign not found');
    return;
  }
  
  console.log('📊 Campaign:', campaign.name);
  
  // Check for assistant_id in both main column and settings
  const assistantId = campaign.assistant_id || campaign.settings?.assistant_id;
  console.log('📊 Assistant ID:', assistantId);
  
  if (assistantId) {
    const assistantDetails = await fetchVapiAssistantDetails(assistantId);
    
    if (assistantDetails) {
      // Update campaign with assistant details (only in settings)
      const { error } = await supabase
        .from('campaigns')
        .update({
          settings: {
            ...(campaign.settings || {}),
            voice_agent: assistantDetails.name,
            system_prompt: assistantDetails.systemPrompt,
            voice_model: assistantDetails.voice?.model,
            schedule: campaign.settings?.schedule || {
              timezone: 'America/New_York',
              startTime: '09:00',
              endTime: '17:00',
              daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            }
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);
      
      if (error) {
        console.error('❌ Error updating campaign:', error);
      } else {
        console.log('✅ Campaign updated with VAPI assistant details');
      }
    }
  }
  
  // Also fetch phone number details if available
  const phoneNumberId = campaign.phone_number_id || campaign.settings?.phone_number_id;
  if (phoneNumberId) {
    console.log('📞 Fetching phone number details for:', phoneNumberId);
    
    try {
      const vapiApiKey = 'da8956d4-0508-474e-bd96-7eda82d2d943';
      const response = await fetch(
        `https://api.vapi.ai/phone-number/${phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${vapiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const phoneData = await response.json();
        console.log('✅ Phone number:', phoneData.number);
        
        // Update campaign with phone number
        await supabase
          .from('campaigns')
          .update({
            phone_number: phoneData.number || phoneData.phoneNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);
      }
    } catch (error) {
      console.error('❌ Error fetching phone number:', error.message);
    }
  }
}

// If called with a campaign ID argument, update that campaign
const campaignId = process.argv[2];
if (campaignId) {
  updateCampaignWithVapiData(campaignId).catch(console.error);
} else {
  // Update all campaigns
  (async () => {
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name')
      .order('created_at', { ascending: false });
    
    console.log(`📊 Found ${campaigns?.length || 0} campaigns to update`);
    
    for (const campaign of campaigns || []) {
      await updateCampaignWithVapiData(campaign.id);
      console.log('---');
    }
  })().catch(console.error);
}