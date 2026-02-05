import { CreateCallParams, VoiceAssistant, VoiceCall, VoiceEngine } from './types';

// Internal constants - strictly for server-side usage
const VAPI_BASE_URL = 'https://api.vapi.ai';

export class VapiVoiceProvider implements VoiceEngine {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.apiKey) {
      throw new Error('Using internal Voice Engine without API key');
    }

    const response = await fetch(`${VAPI_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Voice Engine Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async createAssistant(params: { name: string; model?: string }): Promise<VoiceAssistant> {
    const data = await this.request('/assistant', {
      method: 'POST',
      body: JSON.stringify({
        name: params.name,
        model: {
          model: params.model || 'gpt-4',
          provider: 'openai',
        },
      }),
    });

    return {
      id: data.id,
      name: data.name,
      model: data.model?.model,
    };
  }

  async startTestCall(params: CreateCallParams): Promise<VoiceCall> {
    const data = await this.request('/call', {
      method: 'POST',
      body: JSON.stringify({
        phoneNumberId: params.phoneNumberId,
        assistantId: params.assistantId,
        customer: {
          number: params.customerNumber,
          name: params.customerName,
        },
      }),
    });

    return this.mapToVoiceCall(data);
  }

  async listCalls(params?: { limit?: number; assistantId?: string }): Promise<VoiceCall[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.assistantId) searchParams.set('assistantId', params.assistantId);

    const data = await this.request(`/call?${searchParams.toString()}`);
    return (data as any[]).map(this.mapToVoiceCall);
  }

  async getCall(id: string): Promise<VoiceCall> {
    const data = await this.request(`/call/${id}`);
    return this.mapToVoiceCall(data);
  }

  private mapToVoiceCall(data: any): VoiceCall {
    return {
      id: data.id,
      status: data.status,
      durationSeconds: data.durationSeconds || 0,
      cost: data.cost || 0,
      recordingUrl: data.recordingUrl,
      transcript: data.transcript,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
    };
  }
}
