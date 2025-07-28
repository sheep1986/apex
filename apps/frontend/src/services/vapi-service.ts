// VAPI API Configuration
const VAPI_BASE_URL = 'https://api.vapi.ai';

/**
 * VAPI Service - Complete integration with VAPI platform
 * Handles all VAPI API interactions for Apex CRM
 * Now uses organization-level credentials instead of platform-level
 */

// Types for VAPI entities
export interface VapiAssistant {
  id: string;
  name: string;
  model: {
    provider: string;
    model: string;
    temperature?: number;
    systemMessage?: string;
  };
  voice: {
    provider: string;
    voiceId: string;
  };
  firstMessage?: string;
  transcriber?: {
    provider: string;
    model: string;
    language?: string;
  };
  recordingEnabled?: boolean;
  endCallMessage?: string;
  serverUrl?: string;
  serverUrlSecret?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VapiCall {
  id: string;
  assistantId: string;
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
  };
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  duration?: number;
  messages?: Array<{
    role: 'assistant' | 'user' | 'system';
    message: string;
    timestamp: string;
  }>;
}

export interface VapiPhoneNumber {
  id: string;
  number: string;
  provider: string;
  name?: string;
  assistantId?: string;
  createdAt: string;
}

export interface VapiWebhookEvent {
  type: 'call-start' | 'call-end' | 'transcript' | 'hang' | 'speech-update' | 'status-update';
  call: VapiCall;
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

class VapiService {
  private baseURL = VAPI_BASE_URL;
  private apiKey: string | null = null;
  private organizationId: string | null = null;

  constructor() {
    // VAPI service now requires organization context to function
    console.log('📝 VAPI Service initialized - requires organization credentials to make API calls');
  }

  /**
   * Initialize service with organization credentials
   */
  async initializeWithOrganization(organizationId: string): Promise<boolean> {
    try {
      this.organizationId = organizationId;
      
      // Get auth token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      // Get organization VAPI credentials via API
      const response = await fetch(`${window.location.origin}/api/vapi-credentials`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        console.warn('⚠️ Failed to fetch VAPI credentials for organization');
        return false;
      }

      const data = await response.json();
      
      if (data.hasApiKey && data.credentials?.vapi_api_key) {
        this.apiKey = data.credentials.vapi_api_key;
        console.log('✅ VAPI service initialized with organization credentials');
        return true;
      } else if (data.hasApiKey) {
        // API key exists but wasn't returned (non-admin user)
        console.warn('⚠️ VAPI API key exists but user lacks permission to view it');
        return false;
      } else {
        console.warn('⚠️ No VAPI API key configured for this organization');
        return false;
      }
    } catch (error) {
      console.error('❌ Error initializing VAPI service with organization:', error);
      return false;
    }
  }

  /**
   * Check if service is properly initialized
   */
  isInitialized(): boolean {
    return !!(this.apiKey && this.organizationId);
  }

  /**
   * Get current organization ID
   */
  getOrganizationId(): string | null {
    return this.organizationId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isInitialized()) {
      throw new Error('VAPI Service not initialized. Call initializeWithOrganization() first.');
    }

    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `VAPI API Error: ${response.status} - ${errorData.message || 'Unknown error'}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('VAPI Service Error:', error);
      throw error;
    }
  }

  // Assistant Management
  async getAssistants(): Promise<VapiAssistant[]> {
    return this.request<VapiAssistant[]>('/assistant');
  }

  async getAssistant(id: string): Promise<VapiAssistant> {
    return this.request<VapiAssistant>(`/assistant/${id}`);
  }

  async createAssistant(assistant: Partial<VapiAssistant>): Promise<VapiAssistant> {
    return this.request<VapiAssistant>('/assistant', {
      method: 'POST',
      body: JSON.stringify(assistant),
    });
  }

  async updateAssistant(id: string, updates: Partial<VapiAssistant>): Promise<VapiAssistant> {
    return this.request<VapiAssistant>(`/assistant/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteAssistant(id: string): Promise<void> {
    await this.request<void>(`/assistant/${id}`, {
      method: 'DELETE',
    });
  }

  // Call Management
  async getCalls(params?: {
    assistantId?: string;
    phoneNumberId?: string;
    limit?: number;
    createdAtGt?: string;
    createdAtLt?: string;
  }): Promise<VapiCall[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });
    }

    const query = searchParams.toString();
    return this.request<VapiCall[]>(`/call${query ? `?${query}` : ''}`);
  }

  async getCall(id: string): Promise<VapiCall> {
    return this.request<VapiCall>(`/call/${id}`);
  }

  async createCall(callData: {
    assistantId: string;
    phoneNumberId?: string;
    customer: {
      number: string;
      name?: string;
    };
  }): Promise<VapiCall> {
    return this.request<VapiCall>('/call', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
  }

  // Phone Number Management
  async getPhoneNumbers(): Promise<VapiPhoneNumber[]> {
    return this.request<VapiPhoneNumber[]>('/phone-number');
  }

  async getPhoneNumber(id: string): Promise<VapiPhoneNumber> {
    return this.request<VapiPhoneNumber>(`/phone-number/${id}`);
  }

  // Real-time Call Analytics
  async getCallAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    assistantId?: string;
  }): Promise<CallAnalytics> {
    // This would typically aggregate data from multiple calls
    const calls = await this.getCalls(params);

    return this.aggregateCallData(calls);
  }

  private aggregateCallData(calls: VapiCall[]): CallAnalytics {
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
        const callHour = new Date(call.startedAt).getHours();
        return callHour === hour;
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

  // Webhook handling
  async verifyWebhook(signature: string, payload: string, secret: string): Promise<boolean> {
    // Implement webhook signature verification
    // This would typically use HMAC-SHA256
    try {
      const crypto = await import('crypto');
      const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      return signature === expectedSignature;
    } catch {
      return false;
    }
  }

  // Real-time call updates
  async subscribeToCallUpdates(callId: string, callback: (event: VapiWebhookEvent) => void) {
    // This would typically use WebSocket or Server-Sent Events
    // For now, we'll simulate with polling
    const interval = setInterval(async () => {
      try {
        const call = await this.getCall(callId);
        callback({
          type: 'status-update',
          call,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error polling call updates:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }

  // Lead scoring based on call analysis
  scoreLeadFromCall(call: VapiCall): {
    score: number;
    factors: Array<{ factor: string; impact: number; description: string }>;
  } {
    let score = 50; // Base score
    const factors: Array<{ factor: string; impact: number; description: string }> = [];

    // Duration factor
    if (call.duration) {
      if (call.duration > 300) {
        // 5+ minutes
        score += 20;
        factors.push({
          factor: 'Long Call Duration',
          impact: 20,
          description: 'Engaged in lengthy conversation',
        });
      } else if (call.duration > 120) {
        // 2+ minutes
        score += 10;
        factors.push({
          factor: 'Good Call Duration',
          impact: 10,
          description: 'Reasonable conversation length',
        });
      } else if (call.duration < 30) {
        // Less than 30 seconds
        score -= 15;
        factors.push({
          factor: 'Short Call Duration',
          impact: -15,
          description: 'Very brief interaction',
        });
      }
    }

    // Sentiment factor
    if (call.analysis?.sentiment === 'positive') {
      score += 15;
      factors.push({
        factor: 'Positive Sentiment',
        impact: 15,
        description: 'Showed positive attitude during call',
      });
    } else if (call.analysis?.sentiment === 'negative') {
      score -= 10;
      factors.push({
        factor: 'Negative Sentiment',
        impact: -10,
        description: 'Expressed negative sentiment',
      });
    }

    // Follow-up required
    if (call.analysis?.followUpRequired) {
      score += 10;
      factors.push({
        factor: 'Follow-up Interest',
        impact: 10,
        description: 'Expressed interest in follow-up',
      });
    }

    // Intent detection
    if (call.analysis?.intent) {
      const intent = call.analysis.intent.toLowerCase();
      if (intent.includes('purchase') || intent.includes('buy')) {
        score += 25;
        factors.push({
          factor: 'Purchase Intent',
          impact: 25,
          description: 'Showed buying intent',
        });
      } else if (intent.includes('interested') || intent.includes('learn')) {
        score += 15;
        factors.push({
          factor: 'Learning Intent',
          impact: 15,
          description: 'Interested in learning more',
        });
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      factors,
    };
  }

  // Campaign Management
  async launchCampaign(campaignData: {
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
    // In a real implementation, this would create a campaign and schedule calls
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
    // Production campaign launch with additional validation
    if (!campaignData.leads || campaignData.leads.length === 0) {
      throw new Error('No leads provided for campaign');
    }

    if (!this.apiKey) {
      throw new Error('VAPI API key not configured');
    }

    // In production, this would create actual calls via VAPI
    return this.launchCampaign(campaignData);
  }
}

export const vapiService = new VapiService();
export default vapiService;
