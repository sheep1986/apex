export interface VoiceAssistant {
  id: string;
  name: string;
  model: string;
}

export interface VoiceCall {
  id: string;
  status: 'ringing' | 'in-progress' | 'ended' | 'failed';
  durationSeconds: number;
  cost: number;
  recordingUrl?: string;
  transcript?: string;
  startedAt: string;
  endedAt?: string;
}

export interface CreateCallParams {
  phoneNumberId: string;
  assistantId: string;
  customerNumber: string;
  customerName?: string;
}

export interface VoiceEngine {
  createAssistant(params: { name: string; model?: string }): Promise<VoiceAssistant>;
  startTestCall(params: CreateCallParams): Promise<VoiceCall>;
  listCalls(params?: { limit?: number; assistantId?: string }): Promise<VoiceCall[]>;
  getCall(id: string): Promise<VoiceCall>;
}
