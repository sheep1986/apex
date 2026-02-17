/**
 * VoiceProvider — Abstract interface for voice AI providers.
 *
 * All provider-specific logic (Vapi, custom, etc.) implements this interface.
 * The voice-service.ts thin wrapper delegates to the active provider, so
 * swapping providers is a config change — not a rewrite.
 *
 * Trinity-branded: no provider names leak through this interface.
 */

import type {
  CallAnalytics,
  VoiceAssistant,
  VoiceCall,
  VoicePhoneNumber,
  VoiceSquad,
  VoiceSquadMember,
  VoiceTool,
  VoiceWebhookEvent,
} from './voice-service';

// ─── Provider Configuration ─────────────────────────────────────────

export interface VoiceProviderConfig {
  organizationId: string;
  apiKey: string;
  baseURL?: string;
}

// ─── Abstract VoiceProvider Interface ───────────────────────────────

export interface VoiceProvider {
  /** Human-readable provider name (for internal logging only) */
  readonly providerName: string;

  // ─── Lifecycle ──────────────────────────────────────────────────
  initialize(config: VoiceProviderConfig): Promise<boolean>;
  isInitialized(): boolean;
  getOrganizationId(): string | null;

  // ─── Assistants ─────────────────────────────────────────────────
  getAssistants(): Promise<VoiceAssistant[]>;
  getAssistant(id: string): Promise<VoiceAssistant>;
  createAssistant(config: Partial<VoiceAssistant> & { toolIds?: string[]; fileIds?: string[] }): Promise<VoiceAssistant>;
  updateAssistant(id: string, updates: Partial<VoiceAssistant> & { toolIds?: string[]; fileIds?: string[] }): Promise<VoiceAssistant>;
  deleteAssistant(id: string): Promise<void>;

  // ─── Calls ──────────────────────────────────────────────────────
  getCalls(params?: {
    assistantId?: string;
    phoneNumberId?: string;
    limit?: number;
    createdAtGt?: string;
    createdAtLt?: string;
  }): Promise<VoiceCall[]>;
  getCall(id: string): Promise<VoiceCall>;
  createCall(payload: {
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
  }): Promise<VoiceCall>;
  endCall(callId: string): Promise<void>;
  transferCall?(callId: string, options: { destination: string }): Promise<void>;

  // ─── Phone Numbers ──────────────────────────────────────────────
  getPhoneNumbers(): Promise<VoicePhoneNumber[]>;
  getPhoneNumber(id: string): Promise<VoicePhoneNumber>;
  createPhoneNumber(config: {
    provider?: string;
    areaCode?: string;
    name?: string;
    assistantId?: string;
    squadId?: string;
    serverUrl?: string;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioPhoneNumber?: string;
  }): Promise<VoicePhoneNumber>;
  updatePhoneNumber(id: string, updates: {
    name?: string;
    assistantId?: string | null;
    squadId?: string | null;
    serverUrl?: string;
    fallbackDestination?: { type: string; number?: string } | null;
  }): Promise<VoicePhoneNumber>;
  deletePhoneNumber(id: string): Promise<void>;
  searchAvailableNumbers(areaCode: string, country?: string): Promise<any[]>;
  buyPhoneNumber(phoneNumber: string, name?: string): Promise<VoicePhoneNumber>;
  autoProvisionNumber(areaCode: string, name?: string, assistantId?: string): Promise<any>;

  // ─── Squads ─────────────────────────────────────────────────────
  getSquads(): Promise<VoiceSquad[]>;
  getSquad(id: string): Promise<VoiceSquad>;
  createSquad(squad: {
    name: string;
    members: VoiceSquadMember[];
    membersOverrides?: Record<string, any>;
  }): Promise<VoiceSquad>;
  updateSquad(id: string, updates: Partial<VoiceSquad>): Promise<VoiceSquad>;
  deleteSquad(id: string): Promise<void>;

  // ─── Tools ──────────────────────────────────────────────────────
  getTools(): Promise<VoiceTool[]>;
  getTool(id: string): Promise<VoiceTool>;
  createTool(tool: {
    type: VoiceTool['type'];
    function?: VoiceTool['function'];
    messages?: VoiceTool['messages'];
    server?: VoiceTool['server'];
    async?: boolean;
  }): Promise<VoiceTool>;
  updateTool(id: string, updates: Partial<VoiceTool>): Promise<VoiceTool>;
  deleteTool(id: string): Promise<void>;

  // ─── Knowledge Base ─────────────────────────────────────────────
  uploadFile(file: File): Promise<any>;
  getFiles(): Promise<any[]>;
  deleteFile(fileId: string): Promise<void>;

  // ─── Analytics ──────────────────────────────────────────────────
  getCallAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    assistantId?: string;
  }): Promise<CallAnalytics>;

  // ─── Real-time ──────────────────────────────────────────────────
  subscribeToCallUpdates(callId: string, callback: (event: VoiceWebhookEvent) => void): Promise<() => void>;

  // ─── Lead Scoring ───────────────────────────────────────────────
  scoreLeadFromCall(call: VoiceCall): {
    score: number;
    factors: Array<{ factor: string; impact: number; description: string }>;
  };

  // ─── Campaigns ──────────────────────────────────────────────────
  launchCampaign(campaignData: {
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
  }): Promise<{ success: boolean; campaignId: string; scheduledCalls: number }>;
}
