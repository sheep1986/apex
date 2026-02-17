/**
 * VapiProvider — Vapi-specific implementation of the VoiceProvider interface.
 *
 * All Vapi API calls, data transforms, and provider-specific logic live here.
 * This file is the ONLY place that knows about the Vapi API structure.
 */

import { getSupabase } from '../supabase-client';
import { ToolBuilder } from '../tool-builder';
import type { VoiceProvider, VoiceProviderConfig } from '../voice-provider';
import type {
  CallAnalytics,
  VoiceAssistant,
  VoiceCall,
  VoicePhoneNumber,
  VoiceSquad,
  VoiceSquadMember,
  VoiceTool,
  VoiceWebhookEvent,
} from '../voice-service';

const DEFAULT_BASE_URL = '/api/voice';

export class VapiProvider implements VoiceProvider {
  readonly providerName = 'vapi';

  private baseURL = DEFAULT_BASE_URL;
  private apiKey: string | null = null;
  private organizationId: string | null = null;

  async initialize(config: VoiceProviderConfig): Promise<boolean> {
    this.organizationId = config.organizationId;
    this.apiKey = config.apiKey;
    if (config.baseURL) this.baseURL = config.baseURL;
    return true;
  }

  isInitialized(): boolean {
    return !!(this.apiKey && this.organizationId);
  }

  getOrganizationId(): string | null {
    return this.organizationId;
  }

  // ─── HTTP Layer ─────────────────────────────────────────────────

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isInitialized()) {
      throw new Error('Voice provider not initialized.');
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Voice API Error: ${response.status} - ${errorData.message || errorData.error || 'Unknown error'}`
      );
    }

    if (response.status === 204) return undefined as T;
    return await response.json();
  }

  // ─── Assistants ─────────────────────────────────────────────────

  async getAssistants(): Promise<VoiceAssistant[]> {
    return this.request<VoiceAssistant[]>('/assistant');
  }

  async getAssistant(id: string): Promise<VoiceAssistant> {
    return this.request<VoiceAssistant>(`/assistant/${id}`);
  }

  async createAssistant(assistant: Partial<VoiceAssistant> & { toolIds?: string[]; fileIds?: string[] }): Promise<VoiceAssistant> {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not initialized');

    const toolBuilder = new ToolBuilder(supabase);
    let providerTools: any[] = [];
    if (assistant.toolIds && assistant.toolIds.length > 0) {
      providerTools = await toolBuilder.resolveTools(assistant.toolIds);
    }

    const universalWebhookUrl = `${window.location.origin}/api/vapi-router`;

    // Look up recording policy from org default (assistant doesn't exist yet, so no per-assistant override)
    let recordingPolicyResult: { systemMessage: string | undefined; recordingEnabled: boolean } | null = null;
    if (this.organizationId) {
      try {
        // @ts-ignore
        const { data: org } = await supabase
          .from('organizations')
          .select('settings')
          .eq('id', this.organizationId)
          .single();

        const orgPolicy = org?.settings?.default_recording_policy;
        if (orgPolicy) {
          recordingPolicyResult = this.applyRecordingPolicy(
            assistant.model?.systemMessage,
            orgPolicy
          );
        }
      } catch {
        // Non-critical — proceed without policy
      }
    }

    const enhancedAssistant = {
      ...assistant,
      serverUrl: universalWebhookUrl,
      ...(recordingPolicyResult ? { recordingEnabled: recordingPolicyResult.recordingEnabled } : {}),
      model: {
        ...assistant.model,
        tools: providerTools.length > 0 ? providerTools : undefined,
        ...(assistant.fileIds && assistant.fileIds.length > 0 ? {
          knowledgeBase: { fileIds: assistant.fileIds }
        } : {}),
        ...(recordingPolicyResult ? { systemMessage: recordingPolicyResult.systemMessage } : {}),
      },
    };

    const createdAssistant = await this.request<VoiceAssistant>('/assistant', {
      method: 'POST',
      body: JSON.stringify(enhancedAssistant),
    });

    // Sync to Trinity DB
    if (createdAssistant?.id && this.organizationId) {
      // @ts-ignore
      const { error: assistantError } = await supabase.from('assistants').upsert({
        vapi_assistant_id: createdAssistant.id,
        name: assistant.name || 'Untitled Assistant',
        organization_id: this.organizationId,
        configuration: enhancedAssistant,
        provider_type: 'voice_engine',
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
            tool_id: tId,
          }));
          // @ts-ignore
          await supabase.from('assistant_tools').upsert(links);
        }
      }
    }

    return createdAssistant;
  }

  /**
   * Recording policy announcement prefix constants.
   * Used for idempotent prepend/strip on system messages.
   */
  private static readonly RECORDING_ANNOUNCEMENT_PREFIX =
    '[RECORDING NOTICE] This call is being recorded for quality and training purposes. ';
  private static readonly CONSENT_PROMPT_PREFIX =
    '[RECORDING CONSENT] Before we begin, I need to let you know this call may be recorded. Do you consent to being recorded? If you do not consent, I will end the call politely. ';

  /**
   * Applies recording policy to a system message.
   * Idempotent — strips any existing prefix before re-applying.
   */
  private applyRecordingPolicy(
    systemMessage: string | undefined,
    recordingPolicy: string | undefined
  ): { systemMessage: string | undefined; recordingEnabled: boolean } {
    // Strip any existing recording prefix for idempotency
    let cleanMessage = systemMessage || '';
    cleanMessage = cleanMessage
      .replace(VapiProvider.RECORDING_ANNOUNCEMENT_PREFIX, '')
      .replace(VapiProvider.CONSENT_PROMPT_PREFIX, '')
      .trim();

    switch (recordingPolicy) {
      case 'always_announce':
        return {
          systemMessage: VapiProvider.RECORDING_ANNOUNCEMENT_PREFIX + cleanMessage,
          recordingEnabled: true,
        };
      case 'consent_required':
        return {
          systemMessage: VapiProvider.CONSENT_PROMPT_PREFIX + cleanMessage,
          recordingEnabled: true,
        };
      case 'none':
        return {
          systemMessage: cleanMessage || undefined,
          recordingEnabled: false,
        };
      default:
        // No policy set — preserve as-is
        return {
          systemMessage: cleanMessage || undefined,
          recordingEnabled: true,
        };
    }
  }

  /**
   * Looks up the effective recording policy for an assistant.
   * Priority: assistant-level override → org default → null
   */
  private async getRecordingPolicy(vapiAssistantId: string): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase || !this.organizationId) return null;

    try {
      // Check assistant-level override
      // @ts-ignore
      const { data: assistantRow } = await supabase
        .from('assistants')
        .select('configuration')
        .eq('vapi_assistant_id', vapiAssistantId)
        .eq('organization_id', this.organizationId)
        .single();

      const assistantPolicy = assistantRow?.configuration?.recording_policy;
      if (assistantPolicy) return assistantPolicy;

      // Fall back to org default
      // @ts-ignore
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', this.organizationId)
        .single();

      return org?.settings?.default_recording_policy || null;
    } catch {
      return null;
    }
  }

  async updateAssistant(id: string, updates: Partial<VoiceAssistant> & { toolIds?: string[]; fileIds?: string[] }): Promise<VoiceAssistant> {
    const supabase = getSupabase();

    // 1. Fetch existing assistant from Vapi to safely merge model fields
    //    (Vapi PATCH may overwrite entire `model` if we send a partial model object)
    let existingAssistant: any;
    try {
      existingAssistant = await this.request<any>(`/assistant/${id}`);
    } catch {
      // If we can't fetch, fall back to raw PATCH (best effort)
      existingAssistant = {};
    }

    const existingModel = existingAssistant?.model || {};

    // 2. Resolve tools if toolIds provided
    let providerTools: any[] | undefined;
    if (updates.toolIds && updates.toolIds.length > 0 && supabase) {
      const toolBuilder = new ToolBuilder(supabase);
      providerTools = await toolBuilder.resolveTools(updates.toolIds);
    } else if (updates.toolIds && updates.toolIds.length === 0) {
      // Explicitly clearing tools
      providerTools = [];
    }

    // 3. Build knowledge base from fileIds
    let knowledgeBase: { fileIds: string[] } | undefined;
    if (updates.fileIds && updates.fileIds.length > 0) {
      knowledgeBase = { fileIds: updates.fileIds };
    } else if (updates.fileIds && updates.fileIds.length === 0) {
      // Explicitly clearing knowledge base
      knowledgeBase = { fileIds: [] };
    }

    // 4. Look up recording policy and apply to system message
    const recordingPolicy = await this.getRecordingPolicy(id);
    const incomingSystemMessage = updates.model?.systemMessage ?? existingModel.systemMessage;
    let policyResult: { systemMessage: string | undefined; recordingEnabled: boolean } | null = null;

    if (recordingPolicy) {
      policyResult = this.applyRecordingPolicy(incomingSystemMessage, recordingPolicy);
    }

    // 5. Merge model fields: existing ← updates ← tools/kb/policy
    const mergedModel = {
      ...existingModel,
      ...updates.model,
      ...(providerTools !== undefined ? { tools: providerTools.length > 0 ? providerTools : undefined } : {}),
      ...(knowledgeBase !== undefined ? { knowledgeBase } : {}),
      ...(policyResult ? { systemMessage: policyResult.systemMessage } : {}),
    };

    // 6. Build final payload (strip toolIds/fileIds — Vapi doesn't know about them)
    const { toolIds, fileIds, ...restUpdates } = updates;
    const finalPayload = {
      ...restUpdates,
      model: mergedModel,
      ...(policyResult ? { recordingEnabled: policyResult.recordingEnabled } : {}),
    };

    // 7. PATCH to Vapi
    const updatedAssistant = await this.request<VoiceAssistant>(`/assistant/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(finalPayload),
    });

    // 8. Sync tool links in Trinity DB (if toolIds were provided)
    if (toolIds !== undefined && supabase && this.organizationId) {
      try {
        // @ts-ignore
        const { data: dbAssistant } = await supabase
          .from('assistants')
          .select('id')
          .eq('vapi_assistant_id', id)
          .eq('organization_id', this.organizationId)
          .single();

        if (dbAssistant) {
          // Delete old links, insert new ones
          // @ts-ignore
          await supabase.from('assistant_tools').delete().eq('assistant_id', dbAssistant.id);

          if (toolIds.length > 0) {
            const links = toolIds.map(tId => ({
              assistant_id: dbAssistant.id,
              tool_id: tId,
            }));
            // @ts-ignore
            await supabase.from('assistant_tools').upsert(links);
          }
        }
      } catch (err) {
        console.warn('Failed to sync tool links in DB:', err);
      }
    }

    // 9. Update assistant configuration in Trinity DB
    if (supabase && this.organizationId) {
      try {
        // @ts-ignore
        await supabase
          .from('assistants')
          .update({ configuration: finalPayload, updated_at: new Date().toISOString() })
          .eq('vapi_assistant_id', id)
          .eq('organization_id', this.organizationId);
      } catch (err) {
        console.warn('Failed to sync assistant config in DB:', err);
      }
    }

    return updatedAssistant;
  }

  async deleteAssistant(id: string): Promise<void> {
    await this.request<void>(`/assistant/${id}`, { method: 'DELETE' });
  }

  // ─── Calls ──────────────────────────────────────────────────────

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
    customer: { number: string; extension?: string; name?: string; email?: string };
    assistantOverrides?: any;
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

    return this.request<VoiceCall>('/call', {
      method: 'POST',
      body: JSON.stringify({
        assistantId: payload.assistantId,
        squadId: payload.squadId,
        phoneNumberId: payload.phoneNumberId,
        customer: payload.customer,
        assistantOverrides: payload.assistantOverrides,
        metadata: enrichedMetadata,
        maxDurationSeconds: payload.maxDurationSeconds,
      }),
    });
  }

  async endCall(callId: string): Promise<void> {
    await this.request<void>(`/call/${callId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ended' }),
    });
  }

  async transferCall(callId: string, options: { destination: string }): Promise<void> {
    await this.request<void>(`/call/${callId}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ destination: options.destination }),
    });
  }

  // ─── Phone Numbers ──────────────────────────────────────────────

  async getPhoneNumbers(): Promise<VoicePhoneNumber[]> {
    return this.request<VoicePhoneNumber[]>('/phone-number');
  }

  async getPhoneNumber(id: string): Promise<VoicePhoneNumber> {
    return this.request<VoicePhoneNumber>(`/phone-number/${id}`);
  }

  async createPhoneNumber(config: any): Promise<VoicePhoneNumber> {
    return this.request<VoicePhoneNumber>('/phone-number', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async updatePhoneNumber(id: string, updates: any): Promise<VoicePhoneNumber> {
    return this.request<VoicePhoneNumber>(`/phone-number/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deletePhoneNumber(id: string): Promise<void> {
    await this.request<void>(`/phone-number/${id}`, { method: 'DELETE' });
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

  // ─── Squads ─────────────────────────────────────────────────────

  async getSquads(): Promise<VoiceSquad[]> {
    return this.request<VoiceSquad[]>('/squad');
  }

  async getSquad(id: string): Promise<VoiceSquad> {
    return this.request<VoiceSquad>(`/squad/${id}`);
  }

  async createSquad(squad: { name: string; members: VoiceSquadMember[]; membersOverrides?: Record<string, any> }): Promise<VoiceSquad> {
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
    await this.request<void>(`/squad/${id}`, { method: 'DELETE' });
  }

  // ─── Tools ──────────────────────────────────────────────────────

  async getTools(): Promise<VoiceTool[]> {
    return this.request<VoiceTool[]>('/tool');
  }

  async getTool(id: string): Promise<VoiceTool> {
    return this.request<VoiceTool>(`/tool/${id}`);
  }

  async createTool(tool: any): Promise<VoiceTool> {
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
    await this.request<void>(`/tool/${id}`, { method: 'DELETE' });
  }

  // ─── Knowledge Base ─────────────────────────────────────────────

  async uploadFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Content = (reader.result as string).split(',')[1];
          const response = await this.request<any>('/files-upload', {
            method: 'POST',
            body: JSON.stringify({ filename: file.name, file: base64Content }),
          });
          resolve(response);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = error => reject(error);
    });
  }

  async getFiles(): Promise<any[]> {
    try {
      const response = await this.request<any>('/files-upload', { method: 'GET' });
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.request<void>(`/files-upload/${fileId}`, { method: 'DELETE' });
  }

  // ─── Analytics ──────────────────────────────────────────────────

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
    const successfulCalls = calls.filter(c => c.status === 'ended' && c.duration && c.duration > 30).length;
    const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0);
    const totalCost = calls.reduce((sum, c) => sum + (c.cost || 0), 0);

    const sentimentBreakdown = calls.reduce(
      (acc, c) => { acc[c.analysis?.sentiment || 'neutral']++; return acc; },
      { positive: 0, negative: 0, neutral: 0 }
    );

    const outcomeBreakdown = calls.reduce((acc: Record<string, number>, c) => {
      const o = c.analysis?.outcome || 'unknown';
      acc[o] = (acc[o] || 0) + 1;
      return acc;
    }, {});

    const endedReasonBreakdown = calls.reduce((acc: Record<string, number>, c) => {
      const r = c.endedReason || 'unknown';
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});

    const callsByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: calls.filter(c => c.startedAt && new Date(c.startedAt).getHours() === hour).length,
    }));

    const dayMap: Record<string, { count: number; cost: number; totalDuration: number }> = {};
    for (const c of calls) {
      if (!c.startedAt) continue;
      const day = new Date(c.startedAt).toISOString().slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { count: 0, cost: 0, totalDuration: 0 };
      dayMap[day].count++;
      dayMap[day].cost += c.cost || 0;
      dayMap[day].totalDuration += c.duration || 0;
    }
    const callsByDay = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        count: data.count,
        cost: Math.round(data.cost * 100) / 100,
        avgDuration: Math.round(data.totalDuration / (data.count || 1)),
      }));

    const costBreakdownTotals = calls.reduce(
      (acc, c) => {
        const cb = c.costBreakdown;
        if (cb) { acc.stt += cb.stt || 0; acc.llm += cb.llm || 0; acc.tts += cb.tts || 0; acc.vapi += cb.vapi || 0; acc.transport += cb.transport || 0; }
        acc.total += c.cost || 0;
        return acc;
      },
      { stt: 0, llm: 0, tts: 0, vapi: 0, transport: 0, total: 0 }
    );

    const assistantMap: Record<string, { calls: number; duration: number; cost: number; successful: number }> = {};
    for (const c of calls) {
      const aid = c.assistantId || 'unknown';
      if (!assistantMap[aid]) assistantMap[aid] = { calls: 0, duration: 0, cost: 0, successful: 0 };
      assistantMap[aid].calls++;
      assistantMap[aid].duration += c.duration || 0;
      assistantMap[aid].cost += c.cost || 0;
      if (c.status === 'ended' && c.duration && c.duration > 30) assistantMap[aid].successful++;
    }
    const assistantBreakdown = Object.entries(assistantMap).map(([assistantId, data]) => ({
      assistantId,
      calls: data.calls,
      avgDuration: Math.round(data.duration / (data.calls || 1)),
      cost: Math.round(data.cost * 100) / 100,
      successRate: Math.round((data.successful / (data.calls || 1)) * 100),
    }));

    return {
      totalCalls,
      successfulCalls,
      averageDuration: totalDuration / (totalCalls || 1),
      totalCost,
      sentimentBreakdown,
      outcomeBreakdown,
      endedReasonBreakdown,
      callsByHour,
      callsByDay,
      costBreakdownTotals,
      assistantBreakdown,
      conversionRate: (successfulCalls / (totalCalls || 1)) * 100,
    };
  }

  // ─── Real-time ──────────────────────────────────────────────────

  async subscribeToCallUpdates(callId: string, callback: (event: VoiceWebhookEvent) => void): Promise<() => void> {
    const interval = setInterval(async () => {
      try {
        const call = await this.getCall(callId);
        callback({ type: 'status-update', call, timestamp: new Date().toISOString() });
        if (call.status === 'ended') clearInterval(interval);
      } catch (error) {
        console.error('Error polling call updates:', error);
      }
    }, 2000);
    return () => clearInterval(interval);
  }

  // ─── Lead Scoring ───────────────────────────────────────────────

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

    return { score: Math.max(0, Math.min(100, score)), factors };
  }

  // ─── Campaigns ──────────────────────────────────────────────────

  async launchCampaign(campaignData: {
    name: string;
    assistantId: string;
    phoneNumberId: string;
    leads: Array<{ number: string; name?: string; metadata?: Record<string, any> }>;
    schedule?: { startTime: string; endTime: string; timezone: string };
    maxConcurrent?: number;
  }): Promise<{ success: boolean; campaignId: string; scheduledCalls: number }> {
    return {
      success: true,
      campaignId: `campaign_${Date.now()}`,
      scheduledCalls: campaignData.leads.length,
    };
  }
}
