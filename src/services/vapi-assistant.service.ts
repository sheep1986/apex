import { supabase } from './supabase-client';

const VAPI_API_KEY = 'da8956d4-0508-474e-bd96-7eda82d2d943';
const VAPI_BASE_URL = 'https://api.vapi.ai';

export class VapiAssistantService {
  async updateAssistantPrompt(assistantId: string, systemPrompt: string): Promise<boolean> {
    try {
      // First get the current assistant configuration
      const getResponse = await fetch(
        `${VAPI_BASE_URL}/assistant/${assistantId}`,
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!getResponse.ok) {
        console.error('Failed to fetch assistant:', getResponse.status);
        return false;
      }
      
      const assistant = await getResponse.json();
      console.log('Current assistant fetched');
      
      // Update the assistant with new system prompt
      const updateResponse = await fetch(
        `${VAPI_BASE_URL}/assistant/${assistantId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: {
              ...assistant.model,
              messages: [
                {
                  role: 'system',
                  content: systemPrompt
                }
              ]
            }
          })
        }
      );
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Failed to update assistant:', updateResponse.status, errorText);
        return false;
      }
      
      console.log('Assistant updated successfully in VAPI');
      return true;
    } catch (error) {
      console.error('Error updating VAPI assistant:', error);
      return false;
    }
  }
  
  async fetchAssistantDetails(assistantId: string) {
    try {
      const response = await fetch(
        `${VAPI_BASE_URL}/assistant/${assistantId}`,
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        console.error('Failed to fetch assistant:', response.status);
        return null;
      }
      
      const assistant = await response.json();
      return {
        name: assistant.name || 'AI Assistant',
        systemPrompt: assistant.model?.messages?.[0]?.content || '',
        voice: assistant.voice || {},
        model: assistant.model
      };
    } catch (error) {
      console.error('Error fetching assistant:', error);
      return null;
    }
  }
}

export const vapiAssistantService = new VapiAssistantService();