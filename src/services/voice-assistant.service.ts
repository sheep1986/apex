

// Internal Voice Engine constants
// const VOICE_ENGINE_URL = '/api/voice';

export class VoiceAssistantService {
  async updateAssistantPrompt(assistantId: string, systemPrompt: string): Promise<boolean> {
    try {
      const response = await fetch('/api/voice/assistant', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistantId,
          systemPrompt
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error updating assistant:', error);
      return false;
    }
  }
  
  async fetchAssistantDetails(assistantId: string) {
    try {
      const response = await fetch(`/api/voice/assistant?id=${assistantId}`);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching assistant:', error);
      return null;
    }
  }
}

export const voiceAssistantService = new VoiceAssistantService();