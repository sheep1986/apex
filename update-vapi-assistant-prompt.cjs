const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://twigokrtbvigiqnaybfy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aWdva3J0YnZpZ2lxbmF5YmZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzUyNjksImV4cCI6MjA2NjcxMTI2OX0.AcRI1NYcCYpRqvHZvux15kMbGPocFbvT6uLf5DD6v24';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateVapiAssistantPrompt(assistantId, newSystemPrompt) {
  if (!assistantId) {
    console.log('❌ No assistant ID provided');
    return false;
  }
  
  console.log('🔄 Updating VAPI assistant prompt for:', assistantId);
  
  try {
    const vapiApiKey = 'da8956d4-0508-474e-bd96-7eda82d2d943';
    
    // First get the current assistant configuration
    const getResponse = await fetch(
      `https://api.vapi.ai/assistant/${assistantId}`,
      {
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!getResponse.ok) {
      console.error('❌ Failed to fetch assistant:', getResponse.status);
      return false;
    }
    
    const assistant = await getResponse.json();
    console.log('✅ Current assistant fetched');
    
    // Update the assistant with new system prompt
    const updateResponse = await fetch(
      `https://api.vapi.ai/assistant/${assistantId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: {
            ...assistant.model,
            messages: [
              {
                role: 'system',
                content: newSystemPrompt
              }
            ]
          }
        })
      }
    );
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Failed to update assistant:', updateResponse.status, errorText);
      return false;
    }
    
    const updatedAssistant = await updateResponse.json();
    console.log('✅ Assistant updated successfully');
    console.log('New system prompt preview:', updatedAssistant.model?.messages?.[0]?.content?.substring(0, 100) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ Error updating assistant:', error.message);
    return false;
  }
}

// Function to update from campaign
async function updateCampaignAssistantPrompt(campaignId) {
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
  
  const assistantId = campaign.assistant_id || campaign.settings?.assistant_id;
  const systemPrompt = campaign.settings?.system_prompt;
  
  if (!assistantId) {
    console.log('❌ No assistant ID in campaign');
    return;
  }
  
  if (!systemPrompt) {
    console.log('❌ No system prompt in campaign settings');
    return;
  }
  
  console.log('📊 Campaign:', campaign.name);
  console.log('📊 Assistant ID:', assistantId);
  console.log('📊 System prompt length:', systemPrompt.length, 'characters');
  
  const success = await updateVapiAssistantPrompt(assistantId, systemPrompt);
  
  if (success) {
    console.log('✅ Successfully updated VAPI assistant for campaign:', campaign.name);
  } else {
    console.log('❌ Failed to update VAPI assistant');
  }
}

// If called with arguments
const args = process.argv.slice(2);
if (args.length === 2) {
  // Direct update: node update-vapi-assistant-prompt.cjs <assistantId> <prompt>
  updateVapiAssistantPrompt(args[0], args[1]).then(success => {
    if (success) {
      console.log('✅ Update completed');
    } else {
      console.log('❌ Update failed');
    }
  });
} else if (args.length === 1) {
  // Update from campaign: node update-vapi-assistant-prompt.cjs <campaignId>
  updateCampaignAssistantPrompt(args[0]).catch(console.error);
} else {
  console.log('Usage:');
  console.log('  Update from campaign: node update-vapi-assistant-prompt.cjs <campaignId>');
  console.log('  Direct update: node update-vapi-assistant-prompt.cjs <assistantId> "<new prompt>"');
}