import axios from 'axios';

export interface VapiAssistant {
  id: string;
  name: string;
  description: string;
  model: {
    provider: 'openai' | 'anthropic' | 'google' | 'meta-llama' | 'perplexity' | 'azopenai';
    name: string;
    temperature: number;
    systemPrompt: string;
  };
  voice: {
    provider: '11labs' | 'playht' | 'deepgram' | 'neets' | 'azure' | 'openai' | 'rimeai' | 'elevenlabs' | 'gcp' | 'polly' | 'perplexity' | 'lmnt' | 'sunno' | 'coqui' | 'bland' | 'murf' | 'wellsaid' | 'resemble' | 'playht' | 'lovo' | 'coqui' | 'neets' | 'deepgram' | 'azure' | 'gcp' | 'polly' | 'sunno' | 'lmnt' | 'bland' | 'murf' | 'wellsaid' | 'resemble' | 'lovo';
    name: string;
    voiceId: string;
  };
  firstMessage: string;
  recordingEnabled: boolean;
  transcription: {
    provider: 'deepgram' | 'assembly' | 'rev' | 'symbl' | 'azure' | 'gcp' | 'aws' | 'whisper' | 'whisper-1' | 'whisper-2' | 'whisper-3' | 'whisper-4' | 'whisper-5' | 'whisper-6' | 'whisper-7' | 'whisper-8' | 'whisper-9' | 'whisper-10' | 'whisper-11' | 'whisper-12' | 'whisper-13' | 'whisper-14' | 'whisper-15' | 'whisper-16' | 'whisper-17' | 'whisper-18' | 'whisper-19' | 'whisper-20' | 'whisper-21' | 'whisper-22' | 'whisper-23' | 'whisper-24' | 'whisper-25' | 'whisper-26' | 'whisper-27' | 'whisper-28' | 'whisper-29' | 'whisper-30' | 'whisper-31' | 'whisper-32' | 'whisper-33' | 'whisper-34' | 'whisper-35' | 'whisper-36' | 'whisper-37' | 'whisper-38' | 'whisper-39' | 'whisper-40' | 'whisper-41' | 'whisper-42' | 'whisper-43' | 'whisper-44' | 'whisper-45' | 'whisper-46' | 'whisper-47' | 'whisper-48' | 'whisper-49' | 'whisper-50' | 'whisper-51' | 'whisper-52' | 'whisper-53' | 'whisper-54' | 'whisper-55' | 'whisper-56' | 'whisper-57' | 'whisper-58' | 'whisper-59' | 'whisper-60' | 'whisper-61' | 'whisper-62' | 'whisper-63' | 'whisper-64' | 'whisper-65' | 'whisper-66' | 'whisper-67' | 'whisper-68' | 'whisper-69' | 'whisper-70' | 'whisper-71' | 'whisper-72' | 'whisper-73' | 'whisper-74' | 'whisper-75' | 'whisper-76' | 'whisper-77' | 'whisper-78' | 'whisper-79' | 'whisper-80' | 'whisper-81' | 'whisper-82' | 'whisper-83' | 'whisper-84' | 'whisper-85' | 'whisper-86' | 'whisper-87' | 'whisper-88' | 'whisper-89' | 'whisper-90' | 'whisper-91' | 'whisper-92' | 'whisper-93' | 'whisper-94' | 'whisper-95' | 'whisper-96' | 'whisper-97' | 'whisper-98' | 'whisper-99' | 'whisper-100';
    model: string;
  };
  functions: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  metadata: Record<string, any>;
  status: 'active' | 'inactive' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface VapiCall {
  id: string;
  assistantId: string;
  phoneNumberId: string;
  customer: {
    number: string;
    name?: string;
  };
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer' | 'machine' | 'human' | 'unknown';
  duration: number;
  cost: number;
  transcript: string;
  recordingUrl?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssistantRequest {
  name: string;
  description: string;
  model: {
    provider: 'openai' | 'anthropic' | 'google' | 'meta-llama' | 'perplexity' | 'azopenai';
    name: string;
    temperature: number;
    systemPrompt: string;
  };
  voice: {
    provider: '11labs' | 'playht' | 'deepgram' | 'neets' | 'azure' | 'openai' | 'rimeai' | 'elevenlabs' | 'gcp' | 'polly' | 'perplexity' | 'lmnt' | 'sunno' | 'coqui' | 'bland' | 'murf' | 'wellsaid' | 'resemble' | 'playht' | 'lovo' | 'coqui' | 'neets' | 'deepgram' | 'azure' | 'gcp' | 'polly' | 'sunno' | 'lmnt' | 'bland' | 'murf' | 'wellsaid' | 'resemble' | 'lovo';
    name: string;
    voiceId: string;
  };
  firstMessage: string;
  recordingEnabled?: boolean;
  transcription?: {
    provider: 'deepgram' | 'assembly' | 'rev' | 'symbl' | 'azure' | 'gcp' | 'aws' | 'whisper' | 'whisper-1' | 'whisper-2' | 'whisper-3' | 'whisper-4' | 'whisper-5' | 'whisper-6' | 'whisper-7' | 'whisper-8' | 'whisper-9' | 'whisper-10' | 'whisper-11' | 'whisper-12' | 'whisper-13' | 'whisper-14' | 'whisper-15' | 'whisper-16' | 'whisper-17' | 'whisper-18' | 'whisper-19' | 'whisper-20' | 'whisper-21' | 'whisper-22' | 'whisper-23' | 'whisper-24' | 'whisper-25' | 'whisper-26' | 'whisper-27' | 'whisper-28' | 'whisper-29' | 'whisper-30' | 'whisper-31' | 'whisper-32' | 'whisper-33' | 'whisper-34' | 'whisper-35' | 'whisper-36' | 'whisper-37' | 'whisper-38' | 'whisper-39' | 'whisper-40' | 'whisper-41' | 'whisper-42' | 'whisper-43' | 'whisper-44' | 'whisper-45' | 'whisper-46' | 'whisper-47' | 'whisper-48' | 'whisper-49' | 'whisper-50' | 'whisper-51' | 'whisper-52' | 'whisper-53' | 'whisper-54' | 'whisper-55' | 'whisper-56' | 'whisper-57' | 'whisper-58' | 'whisper-59' | 'whisper-60' | 'whisper-61' | 'whisper-62' | 'whisper-63' | 'whisper-64' | 'whisper-65' | 'whisper-66' | 'whisper-67' | 'whisper-68' | 'whisper-69' | 'whisper-70' | 'whisper-71' | 'whisper-72' | 'whisper-73' | 'whisper-74' | 'whisper-75' | 'whisper-76' | 'whisper-77' | 'whisper-78' | 'whisper-79' | 'whisper-80' | 'whisper-81' | 'whisper-82' | 'whisper-83' | 'whisper-84' | 'whisper-85' | 'whisper-86' | 'whisper-87' | 'whisper-88' | 'whisper-89' | 'whisper-90' | 'whisper-91' | 'whisper-92' | 'whisper-93' | 'whisper-94' | 'whisper-95' | 'whisper-96' | 'whisper-97' | 'whisper-98' | 'whisper-99' | 'whisper-100';
    model: string;
  };
  functions?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
}

export interface CreateCallRequest {
  assistantId: string;
  phoneNumberId: string;
  customer: {
    number: string;
    name?: string;
  };
  metadata?: Record<string, any>;
}

class VapiService {
  private baseURL = 'https://api.vapi.ai';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  // Assistant Management
  async createAssistant(data: CreateAssistantRequest): Promise<VapiAssistant> {
    try {
      const response = await axios.post(
        `${this.baseURL}/assistant`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating assistant:', error);
      throw new Error('Failed to create assistant');
    }
  }

  async getAssistant(id: string): Promise<VapiAssistant> {
    try {
      const response = await axios.get(
        `${this.baseURL}/assistant/${id}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching assistant:', error);
      throw new Error('Failed to fetch assistant');
    }
  }

  async listAssistants(): Promise<VapiAssistant[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/assistant`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error listing assistants:', error);
      throw new Error('Failed to list assistants');
    }
  }

  async updateAssistant(id: string, data: Partial<CreateAssistantRequest>): Promise<VapiAssistant> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/assistant/${id}`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating assistant:', error);
      throw new Error('Failed to update assistant');
    }
  }

  async deleteAssistant(id: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseURL}/assistant/${id}`,
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error deleting assistant:', error);
      throw new Error('Failed to delete assistant');
    }
  }

  // Call Management
  async createCall(data: CreateCallRequest): Promise<VapiCall> {
    try {
      const response = await axios.post(
        `${this.baseURL}/call`,
        data,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating call:', error);
      throw new Error('Failed to create call');
    }
  }

  async getCall(id: string): Promise<VapiCall> {
    try {
      const response = await axios.get(
        `${this.baseURL}/call/${id}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching call:', error);
      throw new Error('Failed to fetch call');
    }
  }

  async listCalls(filters?: {
    assistantId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<VapiCall[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.assistantId) params.append('assistantId', filters.assistantId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await axios.get(
        `${this.baseURL}/call?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error listing calls:', error);
      throw new Error('Failed to list calls');
    }
  }

  async endCall(id: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseURL}/call/${id}/end`,
        {},
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error ending call:', error);
      throw new Error('Failed to end call');
    }
  }

  // Phone Number Management
  async listPhoneNumbers(): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.baseURL}/phone-number`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error listing phone numbers:', error);
      throw new Error('Failed to list phone numbers');
    }
  }

  // Analytics
  async getAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    assistantId?: string;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.assistantId) params.append('assistantId', filters.assistantId);

      const response = await axios.get(
        `${this.baseURL}/analytics?${params.toString()}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new Error('Failed to fetch analytics');
    }
  }
}

export default VapiService; 