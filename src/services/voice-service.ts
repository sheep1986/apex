/**
 * Voice Service — Provider-agnostic voice AI service.
 *
 * This is a thin wrapper that delegates all operations to the active VoiceProvider.
 * Currently uses VapiProvider; swapping providers is a single-line change.
 *
 * All types are defined here as the canonical source of truth.
 * Pages import from this file — never directly from a provider.
 */

import { supabase } from './supabase-client';

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
  assistantOverrides?: Record<string, any>;
  assistantDestinations?: Array<{
    type: 'assistant' | 'number';
    assistantName?: string;
    number?: string;
    message?: string;
    description?: string;
    transferMode?: 'blind-transfer' | 'blind-transfer-add-summary-to-sip-header' | 'warm-transfer-say-message' | 'warm-transfer-say-summary';
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
  endedReasonBreakdown: Record<string, number>;
  callsByHour: Array<{ hour: number; count: number }>;
  callsByDay: Array<{ date: string; count: number; cost: number; avgDuration: number }>;
  costBreakdownTotals: { stt: number; llm: number; tts: number; vapi: number; transport: number; total: number };
  assistantBreakdown: Array<{ assistantId: string; calls: number; avgDuration: number; cost: number; successRate: number }>;
  conversionRate: number;
}

// ─── Provider Registry ──────────────────────────────────────────────

import type { VoiceProvider } from './voice-provider';
import { VapiProvider } from './providers/vapi-provider';

/**
 * To swap providers, change this line:
 *   const activeProvider: VoiceProvider = new AlternativeProvider();
 */
const activeProvider: VoiceProvider = new VapiProvider();

// ─── Service (thin delegation wrapper) ──────────────────────────────

class VoiceService {
  private provider: VoiceProvider = activeProvider;
  private initListeners: Array<() => void> = [];
  private initializingPromise: Promise<boolean> | null = null;

  constructor() {
    // Voice Service initialized
  }

  /**
   * Initialize service with organization credentials.
   * Fetches the API key from the credentials endpoint and passes it to the active provider.
   * Retries up to 3 times with exponential backoff on transient failures (401, 403, network errors).
   * Does NOT retry when hasApiKey is false (genuine config issue).
   */
  async initializeWithOrganization(organizationId: string): Promise<boolean> {
    // Deduplicate concurrent calls — if already initializing, return the existing promise
    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.initializingPromise = this._doInitialize(organizationId);
    const result = await this.initializingPromise;
    this.initializingPromise = null;
    return result;
  }

  private async _doInitialize(organizationId: string): Promise<boolean> {
    const RETRY_DELAYS = [1000, 2000, 4000]; // 3 retries: 1s, 2s, 4s
    let lastError: any;

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        // Get auth token from Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || null;

        // No token yet — transient timing issue, retry
        if (!token && attempt < RETRY_DELAYS.length) {
          console.warn(`⚠️ Voice init attempt ${attempt + 1}: No auth token yet, retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
          continue;
        }

        const response = await fetch(`${window.location.origin}/api/voice/credentials`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (!response.ok) {
          // 401/403 likely means token not yet valid — retry on transient auth errors
          if ((response.status === 401 || response.status === 403) && attempt < RETRY_DELAYS.length) {
            console.warn(`⚠️ Voice init attempt ${attempt + 1}: Got ${response.status}, retrying in ${RETRY_DELAYS[attempt]}ms...`);
            await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
            continue;
          }
          console.warn(`⚠️ Failed to fetch Voice credentials. Status: ${response.status}`);
          return false;
        }

        const data = await response.json();

        if (data.hasApiKey && data.credentials?.provider_api_key) {
          const success = await this.provider.initialize({
            organizationId,
            apiKey: data.credentials.provider_api_key,
          });
          if (success) {
            console.log('✅ Voice service initialized successfully' + (attempt > 0 ? ` (after ${attempt} retries)` : ''));
            this.notifyInitListeners();
          }
          return success;
        } else if (!data.hasApiKey) {
          // Genuine config issue — no VAPI_PRIVATE_API_KEY env var. Do NOT retry.
          console.warn('⚠️ No Voice API key configured for this organization');
          return false;
        } else {
          console.warn('⚠️ Voice API key exists but credentials missing from response');
          return false;
        }
      } catch (error) {
        lastError = error;
        if (attempt < RETRY_DELAYS.length) {
          console.warn(`⚠️ Voice init attempt ${attempt + 1}: Network error, retrying in ${RETRY_DELAYS[attempt]}ms...`, error);
          await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt]));
          continue;
        }
      }
    }

    console.error('❌ Voice service initialization failed after all retries:', lastError);
    return false;
  }

  // ─── Init Event Emitter ─────────────────────────────────────────────

  /** Subscribe to initialization success. Fires immediately if already initialized. */
  onInitialized(callback: () => void): void {
    this.initListeners.push(callback);
    // If already initialized, fire immediately so late subscribers don't miss it
    if (this.isInitialized()) {
      callback();
    }
  }

  /** Unsubscribe from initialization events. */
  offInitialized(callback: () => void): void {
    this.initListeners = this.initListeners.filter(cb => cb !== callback);
  }

  private notifyInitListeners(): void {
    for (const cb of this.initListeners) {
      try { cb(); } catch (e) { console.error('Voice init listener error:', e); }
    }
  }

  // ─── Core State ─────────────────────────────────────────────────────

  isInitialized(): boolean {
    return this.provider.isInitialized();
  }

  getOrganizationId(): string | null {
    return this.provider.getOrganizationId();
  }

  // ─── Assistants (delegated) ─────────────────────────────────────

  getAssistants() { return this.provider.getAssistants(); }
  getAssistant(id: string) { return this.provider.getAssistant(id); }
  createAssistant(config: Partial<VoiceAssistant> & { toolIds?: string[]; fileIds?: string[] }) { return this.provider.createAssistant(config); }
  updateAssistant(id: string, updates: Partial<VoiceAssistant> & { toolIds?: string[]; fileIds?: string[] }) { return this.provider.updateAssistant(id, updates); }
  deleteAssistant(id: string) { return this.provider.deleteAssistant(id); }

  // ─── Calls (delegated) ─────────────────────────────────────────

  getCalls(params?: Parameters<VoiceProvider['getCalls']>[0]) { return this.provider.getCalls(params); }
  getCall(id: string) { return this.provider.getCall(id); }
  createCall(payload: Parameters<VoiceProvider['createCall']>[0]) { return this.provider.createCall(payload); }
  endCall(callId: string) { return this.provider.endCall(callId); }

  async transferCall(callId: string, options: { destination: string }) {
    return this.provider.transferCall?.(callId, options) ?? Promise.resolve();
  }

  // ─── Phone Numbers (delegated) ─────────────────────────────────

  getPhoneNumbers() { return this.provider.getPhoneNumbers(); }
  getPhoneNumber(id: string) { return this.provider.getPhoneNumber(id); }
  createPhoneNumber(config: Parameters<VoiceProvider['createPhoneNumber']>[0]) { return this.provider.createPhoneNumber(config); }
  updatePhoneNumber(id: string, updates: Parameters<VoiceProvider['updatePhoneNumber']>[1]) { return this.provider.updatePhoneNumber(id, updates); }
  deletePhoneNumber(id: string) { return this.provider.deletePhoneNumber(id); }
  searchAvailableNumbers(areaCode: string, country?: string) { return this.provider.searchAvailableNumbers(areaCode, country); }
  buyPhoneNumber(phoneNumber: string, name?: string) { return this.provider.buyPhoneNumber(phoneNumber, name); }
  autoProvisionNumber(areaCode: string, name?: string, assistantId?: string) { return this.provider.autoProvisionNumber(areaCode, name, assistantId); }

  // ─── Squads (delegated) ────────────────────────────────────────

  getSquads() { return this.provider.getSquads(); }
  getSquad(id: string) { return this.provider.getSquad(id); }
  createSquad(squad: Parameters<VoiceProvider['createSquad']>[0]) { return this.provider.createSquad(squad); }
  updateSquad(id: string, updates: Partial<VoiceSquad>) { return this.provider.updateSquad(id, updates); }
  deleteSquad(id: string) { return this.provider.deleteSquad(id); }

  // ─── Tools (delegated) ─────────────────────────────────────────

  getTools() { return this.provider.getTools(); }
  getTool(id: string) { return this.provider.getTool(id); }
  createTool(tool: Parameters<VoiceProvider['createTool']>[0]) { return this.provider.createTool(tool); }
  updateTool(id: string, updates: Partial<VoiceTool>) { return this.provider.updateTool(id, updates); }
  deleteTool(id: string) { return this.provider.deleteTool(id); }

  // ─── Knowledge Base (delegated) ────────────────────────────────

  uploadFile(file: File) { return this.provider.uploadFile(file); }
  getFiles() { return this.provider.getFiles(); }
  deleteFile(fileId: string) { return this.provider.deleteFile(fileId); }

  // ─── Analytics (delegated) ─────────────────────────────────────

  getCallAnalytics(params?: Parameters<VoiceProvider['getCallAnalytics']>[0]) { return this.provider.getCallAnalytics(params); }

  // ─── Real-time (delegated) ─────────────────────────────────────

  subscribeToCallUpdates(callId: string, callback: (event: VoiceWebhookEvent) => void) { return this.provider.subscribeToCallUpdates(callId, callback); }

  // ─── Lead Scoring (delegated) ──────────────────────────────────

  scoreLeadFromCall(call: VoiceCall) { return this.provider.scoreLeadFromCall(call); }

  // ─── Campaigns (delegated) ─────────────────────────────────────

  launchCampaign(campaignData: Parameters<VoiceProvider['launchCampaign']>[0]) { return this.provider.launchCampaign(campaignData); }

  async launchProductionCampaign(campaignData: {
    name: string;
    assistantId: string;
    phoneNumberId: string;
    leads: Array<{ number: string; name?: string }>;
    schedule?: { startTime: string; endTime: string; timezone: string };
  }): Promise<{ success: boolean; campaignId: string; scheduledCalls: number }> {
    if (!campaignData.leads || campaignData.leads.length === 0) {
      throw new Error('No leads provided for campaign');
    }
    if (!this.isInitialized()) {
      throw new Error('Voice API key not configured');
    }
    return this.launchCampaign(campaignData);
  }

  // ─── Webhook (provider-independent utility) ────────────────────

  async verifyWebhook(signature: string, payload: string, secret: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      const key = await globalThis.crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(payload));
      const expectedSignature = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return signature === expectedSignature;
    } catch {
      return false;
    }
  }
}

export const voiceService = new VoiceService();
export default voiceService;
