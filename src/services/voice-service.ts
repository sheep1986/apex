// Voice Provider Configuration
const VOICE_PROVIDER_BASE_URL = '/api/voice';

/**
 * Voice Service — Complete integration with Voice Provider
 * Full API parity via zero-trace proxy architecture.
 * All provider calls go through Netlify function proxies.
 */

import { getSupabase } from './supabase-client';
import { ToolBuilder } from './tool-builder';

// ─── Types ──────────────────────────────────────────────────────────

// ─── Analysis & Behavior Plans ──────────────────────────────────

export interface AnalysisPlan {
  summaryPlan?: { enabled?: boolean; prompt?: string };
  structuredDataPlan?: { enabled?: boolean; schema?: Record<string, any> };
  successEvaluationPlan?: { enabled?: boolean; rubric?: string };
}

export interface ArtifactPlan {
  recordingEnabled?: boolean;
  videoRecordingEnabled?: boolean;
  transcriptPlan?: { enabled?: boolean };
  recordingPath?: string;
}

export interface MessagePlan {
  idleMessages?: string[];
  idleTimeoutSeconds?: number;
  idleMaxSpokenCount?: number;
}

export interface StartSpeakingPlan {
  waitSeconds?: number;
  smartEndpointingEnabled?: boolean;
  transcriptionEndpointingPlan?: {
    onPunctuationSeconds?: number;
    onNoPunctuationSeconds?: number;
    onNumberSeconds?: number;
  };
}

export interface StopSpeakingPlan {
  numWords?: number;
  voiceSeconds?: number;
  backoffSeconds?: number;
}

export interface EndCallPlan {
  enabled?: boolean;
  maxCallDurationMessage?: string;
}

export interface VoicemailDetection {
  enabled?: boolean;
  provider?: string;
  machineDetectionTimeout?: number;
  machineDetectionSpeechThreshold?: number;
  machineDetectionSpeechEndThreshold?: number;
}

export interface VoiceAssistant {
  id: string;
  name: string;
  model: {
    provider: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    systemMessage?: string;
    knowledgeBase?: {
      provider?: string;
      fileIds?: string[];
      topK?: number;
    };
    tools?: any[];
    emotionRecognitionEnabled?: boolean;
  };
  voice: {
    provider: string;
    voiceId: string;
    stability?: number;
    similarityBoost?: number;
    speed?: number;
    style?: number;
  };
  firstMessage?: string;
  transcriber?: {
    provider: string;
    model: string;
    language?: string;
    smartFormat?: boolean;
    keywords?: string[];
    endpointing?: number;
  };
  recordingEnabled?: boolean;
  endCallMessage?: string;
  maxDurationSeconds?: number;
  silenceTimeoutSeconds?: number;
  responseDelaySeconds?: number;
  serverUrl?: string;
  serverUrlSecret?: string;
  backgroundSound?: string;
  backchannelingEnabled?: boolean;
  hipaaEnabled?: boolean;
  // Analysis & Behavior Plans
  analysisPlan?: AnalysisPlan;
  artifactPlan?: ArtifactPlan;
  messagePlan?: MessagePlan;
  startSpeakingPlan?: StartSpeakingPlan;
  stopSpeakingPlan?: StopSpeakingPlan;
  endCallPlan?: EndCallPlan;
  voicemailDetection?: VoicemailDetection;
  // Additional settings
  firstMessageMode?: 'assistant-speaks-first' | 'assistant-speaks-first-with-model-generated-message' | 'assistant-waits-for-user';
  backgroundDenoisingEnabled?: boolean;
  stereoRecordingEnabled?: boolean;
  variableValues?: Record<string, string>;
  credentialOverrides?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  // Trinity extensions
  toolIds?: string[];
  fileIds?: string[];
  metadata?: Record<string, any>;
}

export interface VoiceCall {
  id: string;
  assistantId: string;
  squadId?: string;
  phoneNumberId?: string;
  customer?: {
    number: string;
    name?: string;
  };
  status: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
  type: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall';
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  analysis?: {
    sentiment?: 'positive' | 'negative' | 'neutral';
    intent?: string;
    outcome?: string;
    followUpRequired?: boolean;
    structuredData?: Record<string, any>;
    successEvaluation?: string;
  };
  startedAt?: string;
  endedAt?: string;
  endedReason?: string;
  cost?: number;
  costBreakdown?: {
    stt?: number;
    llm?: number;
    tts?: number;
    vapi?: number;
    total?: number;
    transport?: number;
  };
  duration?: number;
  messages?: Array<{
    role: 'assistant' | 'user' | 'system' | 'tool';
    message: string;
    timestamp: string;
  }>;
  metadata?: Record<string, any>;
}

export interface VoicePhoneNumber {
  id: string;
  number: string;
  provider: string;
  name?: string;
  assistantId?: string;
  squadId?: string;
  serverUrl?: string;
  fallbackDestination?: {
    type: string;
    number?: string;
  };
  createdAt: string;
}

export interface VoiceSquad {
  id: string;
  name: string;
  members: VoiceSquadMember[];
  membersOverrides?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceSquadMember {
  assistantId?: string;
  assistant?: Partial<VoiceAssistant>;
  assistantDestinations?: Array<{
    type: 'assistant' | 'number';
    assistantName?: string;
    number?: string;
    message?: string;
    description?: string;
  }>;
}

export interface VoiceTool {
  id: string;
  type: 'function' | 'endCall' | 'transferCall' | 'dtmf' | 'output' | 'ghl' | 'make';
  function?: {
    name: string;
    description?: string;
    parameters?: {
      type: string;
      properties?: Record<string, any>;
      required?: string[];
    };
  };
  messages?: Array<{
    type: 'request-start' | 'request-complete' | 'request-failed' | 'request-response-delayed';
    content: string;
  }>;
  server?: {
    url: string;
    secret?: string;
    timeoutSeconds?: number;
  };
  async?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceWebhookEvent {
  type: 'call-start' | 'call-end' | 'transcript' | 'hang' | 'speech-update' | 'status-update' | 'tool-calls' | 'end-of-call-report' | 'conversation-update' | 'transfer-destination-request';
  call: VoiceCall;
  message?: string;
  timestamp: string;
}

export interface CallAnalytics {
  totalCalls: number;
  successfulCalls: number;
  averageDuration: number;
  totalCost: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  outcomeBreakdown: Record<string, number>;
  callsByHour: Array<{ hour: number; count: number }>;
  conversionRate: number;
}

// ─── Service ────────────────────────────────────────────────────────

class VoiceService {
  private baseURL = VOICE_PROVIDER_BASE_URL;
  private apiKey: string | null = null;
  private organizationId: string | null = null;

  constructor() {
    console.log('📝 Voice Service initialized');
  }

  /**
   * Initialize service with organization credentials
   */
  async initializeWithOrganization(organizationId: string): Promise<boolean> {
    try {
      this.organizationId = organizationId;

      // Get auth token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      // Get organization Voice credentials via API
      const response = await fetch(`${window.location.origin}/api/voice/credentials`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`⚠️ Failed to fetch Voice credentials. Status: ${response.status}`, errorText);
        return false;
      }

      const data = await response.json();

      if (data.hasApiKey && data.credentials?.provider_api_key) {
        this.apiKey = data.credentials.provider_api_key;
        console.log('✅ Voice service initialized with organization credentials');
        return true;
      } else if (data.hasApiKey) {
        console.warn('⚠️ Voice API key exists but user lacks permission to view it');
        return false;
      } else {
        console.warn('⚠️ No Voice API key configured for this organization');
        return false;
      }
    } catch (error) {
      console.error('❌ Error initializing Voice service:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return !!(this.apiKey && this.organizationId);
  }

  getOrganizationId(): string | null {
    return this.organizationId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isInitialized()) {
      throw new Error('Voice Service not initialized. Call initializeWithOrganization() first.');
    }

    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Voice API Error: ${response.status} - ${errorData.message || errorData.error || 'Unknown error'}`
        );
      }

      // Handle 204 No Content (DELETE responses)
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      console.error('Voice Service Error:', error);
      throw error;
    }
  }

  // ─── Assistant Management ─────────────────────────────────────────

  async getAssistants(): Promise<VoiceAssistant[]> {
    return this.request<VoiceAssistant[]>('/assistant');
  }

  async getAssistant(id: string): Promise<VoiceAssistant> {
    return this.request<VoiceAssistant>(`/assistant/${id}`);
  }

  async createAssistant(assistant: Partial<VoiceAssistant> & { toolIds?: string[], fileIds?: string[] }): Promise<VoiceAssistant> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not initialized');

    // 1. Resolve Dynamic Tools
    const toolBuilder = new ToolBuilder(supabase);
    let providerTools: any[] = [];

    if (assistant.toolIds && assistant.toolIds.length > 0) {
        providerTools = await toolBuilder.resolveTools(assistant.toolIds);
    }

    // 2. Knowledge Base & Model Configuration
    // Force universal webhook for brain routing
    const universalWebhookUrl = `${window.location.origin}/api/vapi-router`;

    const enhancedAssistant = {
        ...assistant,
        serverUrl: universalWebhookUrl,
        model: {
            ...assistant.model,
            tools: providerTools.length > 0 ? providerTools : undefined,
            ...(assistant.fileIds && assistant.fileIds.length > 0 ? {
                knowledgeBase: {
                    fileIds: assistant.fileIds
                }
            } : {})
        }
    };

    // 3. Create at Provider
    const createdAssistant = await this.request<VoiceAssistant>('/assistant', {
      method: 'POST',
      body: JSON.stringify(enhancedAssistant),
    });

    // 4. Sync to Trinity DB
    if (createdAssistant && createdAssistant.id && this.organizationId) {
        // @ts-ignore
        const { error: assistantError } = await supabase.from('assistants').upsert({
            vapi_assistant_id: createdAssistant.id,
            name: assistant.name || 'Untitled Assistant',
            organization_id: this.organizationId,
            configuration: enhancedAssistant,
            provider_type: 'voice_engine'
        }, { onConflict: 'vapi_assistant_id' });

        if (!assistantError && assistant.toolIds && assistant.toolIds.length > 0) {
            // @ts-ignore
            const { data: dbAssistant } = await supabase.from('assistants')
                .select('id')
                .eq('vapi_assistant_id', createdAssistant.id)
                .single();

            if (dbAssistant) {
                const links = assistant.toolIds.map(tId => ({
                    assistant_id: dbAssistant.id,
                    tool_id: tId
                }));
                // @ts-ignore
                await supabase.from('assistant_tools').upsert(links);
            }
        }
    }

    return createdAssistant;
  }

  async updateAssistant(id: string, updates: Partial<VoiceAssistant>): Promise<VoiceAssistant> {
    return this.request<VoiceAssistant>(`/assistant/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteAssistant(id: string): Promise<void> {
    await this.request<void>(`/assistant/${id}`, {
      method: 'DELETE',
    });
  }

  // ─── Call Management ──────────────────────────────────────────────

  async getCalls(params?: {
    assistantId?: string;
    phoneNumberId?: string;
    limit?: number;
    createdAtGt?: string;
    createdAtLt?: string;
  }): Promise<VoiceCall[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
    }

    const query = searchParams.toString();
    return this.request<VoiceCall[]>(`/call${query ? `?${query}` : ''}`);
  }

  async getCall(id: string): Promise<VoiceCall> {
    return this.request<VoiceCall>(`/call/${id}`);
  }

  async createCall(payload: {
    assistantId?: string;
    phoneNumberId?: string;
    squadId?: string;
    customer: {
      number: string;
      extension?: string;
      name?: string;
      email?: string;
    };
    assistantOverrides?: {
      firstMessage?: string;
      model?: {
        provider?: string;
        model?: string;
        temperature?: number;
        systemMessage?: string;
      };
      voice?: {
        provider?: string;
        voiceId?: string;
      };
      variableValues?: Record<string, string>;
      analysisPlan?: {
        structuredDataSchema?: Record<string, any>;
      };
    };
    metadata?: Record<string, any>;
    maxDurationSeconds?: number;
  }): Promise<VoiceCall> {
    if (!payload.assistantId && !payload.squadId && !payload.assistantOverrides) {
      throw new Error('Must provide either assistantId, squadId, or assistantOverrides');
    }

    const enrichedMetadata = {
      ...payload.metadata,
      trinity_call_id: crypto.randomUUID(),
      organization_id: this.organizationId,
    };

    const providerPayload = {
      assistantId: payload.assistantId,
      squadId: payload.squadId,
      phoneNumberId: payload.phoneNumberId,
      customer: payload.customer,
      assistantOverrides: payload.assistantOverrides,
      metadata: enrichedMetadata,
      maxDurationSeconds: payload.maxDurationSeconds
    };

    return this.request<VoiceCall>('/call', {
      method: 'POST',
      body: JSON.stringify(providerPayload),
    });
  }

  async endCall(callId: string): Promise<void> {
    await this.request<void>(`/call/${callId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ended' }),
    });
  }

  // ─── Phone Number Management ──────────────────────────────────────

  async getPhoneNumbers(): Promise<VoicePhoneNumber[]> {
    return this.request<VoicePhoneNumber[]>('/phone-number');
  }

  async getPhoneNumber(id: string): Promise<VoicePhoneNumber> {
    return this.request<VoicePhoneNumber>(`/phone-number/${id}`);
  }

  async createPhoneNumber(config: {
    provider?: string;
    areaCode?: string;
    name?: string;
    assistantId?: string;
    squadId?: string;
    serverUrl?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioPhoneNumber?: string;
  }): Promise<VoicePhoneNumber> {
    return this.request<VoicePhoneNumber>('/phone-number', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async updatePhoneNumber(id: string, updates: {
    name?: string;
    assistantId?: string | null;
    squadId?: string | null;
    serverUrl?: string;
    fallbackDestination?: { type: string; number?: string } | null;
  }): Promise<VoicePhoneNumber> {
    return this.request<VoicePhoneNumber>(`/phone-number/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deletePhoneNumber(id: string): Promise<void> {
    await this.request<void>(`/phone-number/${id}`, {
      method: 'DELETE',
    });
  }

  async searchAvailableNumbers(areaCode: string, country: string = 'US'): Promise<any[]> {
    return this.request<any[]>(`/numbers-search?areaCode=${areaCode}&country=${country}`);
  }

  async buyPhoneNumber(phoneNumber: string, name?: string): Promise<VoicePhoneNumber> {
    return this.request<VoicePhoneNumber>('/numbers-purchase', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, name }),
    });
  }

  async autoProvisionNumber(areaCode: string, name?: string, assistantId?: string): Promise<any> {
    return this.request<any>('/auto-provision-number', {
      method: 'POST',
      body: JSON.stringify({ areaCode, name, assistantId }),
    });
  }

  // ─── Squad Management (Multi-Agent) ───────────────────────────────

  async getSquads(): Promise<VoiceSquad[]> {
    return this.request<VoiceSquad[]>('/squad');
  }

  async getSquad(id: string): Promise<VoiceSquad> {
    return this.request<VoiceSquad>(`/squad/${id}`);
  }

  async createSquad(squad: {
    name: string;
    members: VoiceSquadMember[];
    membersOverrides?: Record<string, any>;
  }): Promise<VoiceSquad> {
    return this.request<VoiceSquad>('/squad', {
      method: 'POST',
      body: JSON.stringify(squad),
    });
  }

  async updateSquad(id: string, updates: Partial<VoiceSquad>): Promise<VoiceSquad> {
    return this.request<VoiceSquad>(`/squad/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteSquad(id: string): Promise<void> {
    await this.request<void>(`/squad/${id}`, {
      method: 'DELETE',
    });
  }

  // ─── Tool Management ──────────────────────────────────────────────

  async getTools(): Promise<VoiceTool[]> {
    return this.request<VoiceTool[]>('/tool');
  }

  async getTool(id: string): Promise<VoiceTool> {
    return this.request<VoiceTool>(`/tool/${id}`);
  }

  async createTool(tool: {
    type: VoiceTool['type'];
    function?: VoiceTool['function'];
    messages?: VoiceTool['messages'];
    server?: VoiceTool['server'];
    async?: boolean;
  }): Promise<VoiceTool> {
    return this.request<VoiceTool>('/tool', {
      method: 'POST',
      body: JSON.stringify(tool),
    });
  }

  async updateTool(id: string, updates: Partial<VoiceTool>): Promise<VoiceTool> {
    return this.request<VoiceTool>(`/tool/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteTool(id: string): Promise<void> {
    await this.request<void>(`/tool/${id}`, {
      method: 'DELETE',
    });
  }

  // ─── Knowledge Base / File Management ─────────────────────────────

  async uploadFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Content = (reader.result as string).split(',')[1];
          const response = await this.request<any>('/files-upload', {
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              file: base64Content
            })
          });
          resolve(response);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = error => reject(error);
    });
  }

  // ─── Analytics ────────────────────────────────────────────────────

  async getCallAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    assistantId?: string;
  }): Promise<CallAnalytics> {
    const calls = await this.getCalls(params);
    return this.aggregateCallData(calls);
  }

  private aggregateCallData(calls: VoiceCall[]): CallAnalytics {
    const totalCalls = calls.length;
    const successfulCalls = calls.filter(
      (call) => call.status === 'ended' && call.duration && call.duration > 30
    ).length;
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const totalCost = calls.reduce((sum, call) => sum + (call.cost || 0), 0);

    const sentimentBreakdown = calls.reduce(
      (acc, call) => {
        const sentiment = call.analysis?.sentiment || 'neutral';
        acc[sentiment]++;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    const outcomeBreakdown = calls.reduce((acc: Record<string, number>, call) => {
      const outcome = call.analysis?.outcome || 'unknown';
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {});

    const callsByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: calls.filter((call) => {
        if (!call.startedAt) return false;
        return new Date(call.startedAt).getHours() === hour;
      }).length,
    }));

    return {
      totalCalls,
      successfulCalls,
      averageDuration: totalDuration / (totalCalls || 1),
      totalCost,
      sentimentBreakdown,
      outcomeBreakdown,
      callsByHour,
      conversionRate: (successfulCalls / (totalCalls || 1)) * 100,
    };
  }

  // ─── Webhook Verification ─────────────────────────────────────────

  async verifyWebhook(signature: string, payload: string, secret: string): Promise<boolean> {
    try {
      const crypto = await import('crypto');
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  // ─── Real-time Call Updates ───────────────────────────────────────

  async subscribeToCallUpdates(callId: string, callback: (event: VoiceWebhookEvent) => void) {
    const interval = setInterval(async () => {
      try {
        const call = await this.getCall(callId);
        callback({
          type: 'status-update',
          call,
          timestamp: new Date().toISOString(),
        });
        if (call.status === 'ended') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling call updates:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }

  // ─── Lead Scoring ─────────────────────────────────────────────────

  scoreLeadFromCall(call: VoiceCall): {
    score: number;
    factors: Array<{ factor: string; impact: number; description: string }>;
  } {
    let score = 50;
    const factors: Array<{ factor: string; impact: number; description: string }> = [];

    if (call.duration) {
      if (call.duration > 300) {
        score += 20;
        factors.push({ factor: 'Long Call Duration', impact: 20, description: 'Engaged in lengthy conversation' });
      } else if (call.duration > 120) {
        score += 10;
        factors.push({ factor: 'Good Call Duration', impact: 10, description: 'Reasonable conversation length' });
      } else if (call.duration < 30) {
        score -= 15;
        factors.push({ factor: 'Short Call Duration', impact: -15, description: 'Very brief interaction' });
      }
    }

    if (call.analysis?.sentiment === 'positive') {
      score += 15;
      factors.push({ factor: 'Positive Sentiment', impact: 15, description: 'Showed positive attitude during call' });
    } else if (call.analysis?.sentiment === 'negative') {
      score -= 10;
      factors.push({ factor: 'Negative Sentiment', impact: -10, description: 'Expressed negative sentiment' });
    }

    if (call.analysis?.followUpRequired) {
      score += 10;
      factors.push({ factor: 'Follow-up Interest', impact: 10, description: 'Expressed interest in follow-up' });
    }

    if (call.analysis?.intent) {
      const intent = call.analysis.intent.toLowerCase();
      if (intent.includes('purchase') || intent.includes('buy')) {
        score += 25;
        factors.push({ factor: 'Purchase Intent', impact: 25, description: 'Showed buying intent' });
      } else if (intent.includes('interested') || intent.includes('learn')) {
        score += 15;
        factors.push({ factor: 'Learning Intent', impact: 15, description: 'Interested in learning more' });
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
    };
  }

  // ─── Campaign Management ──────────────────────────────────────────

  async launchCampaign(campaignData: {
    name: string;
    assistantId: string;
    phoneNumberId: string;
    leads: Array<{ number: string; name?: string; metadata?: Record<string, any> }>;
    schedule?: {
      startTime: string;
      endTime: string;
      timezone: string;
    };
    maxConcurrent?: number;
  }): Promise<{ success: boolean; campaignId: string; scheduledCalls: number }> {
    // TODO: Implement real campaign dispatch via campaign-manager function
    const scheduledCalls = campaignData.leads.length;
    return {
      success: true,
      campaignId: `campaign_${Date.now()}`,
      scheduledCalls,
    };
  }

  async launchProductionCampaign(campaignData: {
    name: string;
    assistantId: string;
    phoneNumberId: string;
    leads: Array<{ number: string; name?: string }>;
    schedule?: {
      startTime: string;
      endTime: string;
      timezone: string;
    };
  }): Promise<{ success: boolean; campaignId: string; scheduledCalls: number }> {
    if (!campaignData.leads || campaignData.leads.length === 0) {
      throw new Error('No leads provided for campaign');
    }
    if (!this.apiKey) {
      throw new Error('Voice API key not configured');
    }
    return this.launchCampaign(campaignData);
  }
}

export const voiceService = new VoiceService();
export default voiceService;
