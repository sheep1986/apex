import { safeApi } from '@/lib/safeApi';
import { crmService, type Lead } from './crm-service';

export interface CallDetails {
  id: string;
  providerCallId: string;
  campaignId: string;
  campaignName: string;
  leadId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCompany?: string;
  direction: 'inbound' | 'outbound';
  status: 'initiated' | 'ringing' | 'answered' | 'completed' | 'failed' | 'busy' | 'no_answer';
  startedAt: string;
  endedAt?: string;
  duration?: number;
  cost: number;
  transcript?: string;
  summary?: string;
  recording?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CallSummary {
  id: string;
  providerCallId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCompany?: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  cost: number;
  hasTranscript: boolean;
  hasRecording: boolean;
}

class CallsService {
  /**
   * Get detailed call information including transcript and recording
   */
  async getCallDetails(callId: string): Promise<CallDetails> {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const result = await safeApi<{ call: CallDetails }>({
      method: 'GET',
      url: `${API_BASE_URL}/api/campaign/calls/${callId}`
    });

    if (!result.ok) {
       // Type narrowing should work here, providing fallback
       const err = result as any;
       throw new Error(err.error?.message || 'Failed to fetch call details');
    }

    if (!result.data.call) {
      throw new Error('Call not found');
    }

    return result.data.call;
  }

  /**
   * Get all calls for a specific campaign
   */
  async getCampaignCalls(campaignId: string): Promise<{ calls: CallSummary[] }> {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const result = await safeApi<{ calls: CallSummary[] }>({
      method: 'GET',
      url: `${API_BASE_URL}/api/campaign/campaigns/${campaignId}/calls`
    });

    if (!result.ok) {
      throw new Error('Failed to fetch campaign calls');
    }

    return result.data;
  }

  /**
   * Sync call data from provider
   */
  async syncCall(providerCallId: string): Promise<{ success: boolean; aiProcessing?: boolean }> {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const result = await safeApi<{ success: boolean; aiProcessing?: boolean }>({
      method: 'POST',
      url: `${API_BASE_URL}/api/voice/sync-call/${providerCallId}`
    });

    if (!result.ok) {
      throw new Error('Failed to sync call');
    }

    return result.data;
  }

  /**
   * Get call status display info
   */
  getStatusInfo(status: string) {
    const statusMap = {
      initiated: { label: 'Initiated', color: 'blue', icon: '🔄' },
      ringing: { label: 'Ringing', color: 'yellow', icon: '📞' },
      answered: { label: 'Answered', color: 'green', icon: '✅' },
      completed: { label: 'Completed', color: 'emerald', icon: '✅' },
      failed: { label: 'Failed', color: 'red', icon: '❌' },
      busy: { label: 'Busy', color: 'orange', icon: '📵' },
      no_answer: { label: 'No Answer', color: 'gray', icon: '📭' },
    };

    return (
      statusMap[status as keyof typeof statusMap] || {
        label: status,
        color: 'gray',
        icon: '❓',
      }
    );
  }

  /**
   * Format call duration
   */
  formatDuration(duration?: number): string {
    if (!duration || duration === 0) return '0s';

    if (duration < 60) {
      return `${Math.round(duration)}s`;
    } else if (duration < 3600) {
      const minutes = Math.floor(duration / 60);
      const seconds = Math.round(duration % 60);
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Format call cost
   */
  formatCost(cost?: number): string {
    if (!cost || cost === 0) return '$0.00';
    return `$${cost.toFixed(3)}`;
  }

  /**
   * Check if call outcome is positive and should create a lead
   */
  isPositiveOutcome(outcome: string, summary?: string): boolean {
    const positiveKeywords = [
      'interested',
      'scheduled',
      'follow-up',
      'demo',
      'meeting',
      'callback',
      'positive',
      'qualified',
      'hot',
      'warm',
      'opportunity',
      'conversion',
      'wants',
      'needs',
      'looking for',
      'considering',
      'evaluating',
    ];

    const outcomeText = (outcome + ' ' + (summary || '')).toLowerCase();
    return positiveKeywords.some((keyword) => outcomeText.includes(keyword));
  }

  /**
   * Extract sentiment from call outcome and summary
   */
  extractSentiment(outcome: string, summary?: string): 'positive' | 'neutral' | 'negative' {
    if (this.isPositiveOutcome(outcome, summary)) return 'positive';

    const negativeKeywords = [
      'not interested',
      'declined',
      'refused',
      'busy',
      'no thank you',
      'unqualified',
    ];
    const outcomeText = (outcome + ' ' + (summary || '')).toLowerCase();

    if (negativeKeywords.some((keyword) => outcomeText.includes(keyword))) {
      return 'negative';
    }

    return 'neutral';
  }

  /**
   * Create lead in CRM from positive call outcome
   */
  async createLeadFromCall(call: CallDetails): Promise<Lead | null> {
    try {
      // Check if outcome is positive
      if (!this.isPositiveOutcome(call.summary || '', call.transcript)) {
        return null;
      }

      // Extract customer info
      const [firstName, lastName] = this.extractNameFromCall(call);

      const leadData: Partial<Lead> = {
        firstName: firstName || 'Unknown',
        lastName: lastName || 'Contact',
        email: call.customerEmail || '',
        phone: call.customerPhone,
        company: call.customerCompany || '',
        title: '', // Could be extracted from transcript with AI
        status: 'new',
        priority: this.determinePriority(call),
        source: 'voice_outbound_call',
        campaign: call.campaignName,
        notes: this.generateLeadNotes(call),
        tags: ['ai-generated', 'positive-call'],
        score: this.calculateLeadScore(call),
        lastContactDate: call.startedAt,
        nextFollowUp: this.suggestNextFollowUp(call),
        customFields: {
          originalCallId: call.id,
          providerCallId: call.providerCallId,
          callOutcome: call.summary,
          callDuration: call.duration,
          callCost: call.cost,
          sentiment: this.extractSentiment(call.summary || '', call.transcript),
        },
      };

      const newLead = await crmService.createLead(leadData);

      // Add call record to the lead
      await crmService.addCallRecord({
        leadId: newLead.id,
        date: call.startedAt,
        duration: this.formatDuration(call.duration),
        outcome: call.summary || 'Positive outcome',
        transcript: call.transcript || '',
        sentiment: this.extractSentiment(call.summary || '', call.transcript),
        recordingUrl: call.recording,
        nextAction: this.suggestNextAction(call),
      });

      return newLead;
    } catch (error) {
      console.error('Error creating lead from call:', error);
      return null;
    }
  }

  /**
   * Extract first and last name from call data
   */
  private extractNameFromCall(call: CallDetails): [string, string] {
    if (call.customerName) {
      const nameParts = call.customerName.split(' ');
      return [nameParts[0] || '', nameParts.slice(1).join(' ') || ''];
    }
    return ['', ''];
  }

  /**
   * Determine lead priority based on call data
   */
  private determinePriority(call: CallDetails): 'low' | 'medium' | 'high' {
    const outcome = (call.summary || '').toLowerCase();

    if (outcome.includes('hot') || outcome.includes('urgent') || outcome.includes('asap')) {
      return 'high';
    }

    if (outcome.includes('warm') || outcome.includes('scheduled') || outcome.includes('demo')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Generate comprehensive notes for the lead
   */
  private generateLeadNotes(call: CallDetails): string {
    let notes = `Lead generated from AI call on ${new Date(call.startedAt).toLocaleDateString()}.\n\n`;

    if (call.summary) {
      notes += `Call Summary: ${call.summary}\n\n`;
    }

    notes += `Call Duration: ${this.formatDuration(call.duration)}\n`;
    notes += `Call Cost: ${this.formatCost(call.cost)}\n`;

    if (call.customerCompany) {
      notes += `Company: ${call.customerCompany}\n`;
    }

    if (call.transcript) {
      notes += `\nCall Transcript:\n${call.transcript.substring(0, 500)}${call.transcript.length > 500 ? '...' : ''}`;
    }

    return notes;
  }

  /**
   * Calculate initial lead score based on call data
   */
  private calculateLeadScore(call: CallDetails): number {
    let score = 50; // Base score

    const outcome = (call.summary || '').toLowerCase();

    // Positive indicators increase score
    if (outcome.includes('very interested')) score += 30;
    else if (outcome.includes('interested')) score += 20;

    if (outcome.includes('scheduled') || outcome.includes('demo')) score += 25;
    if (outcome.includes('follow-up')) score += 15;
    if (outcome.includes('qualified')) score += 20;

    // Call duration affects score
    if (call.duration && call.duration > 120) score += 10; // Long calls usually mean engagement
    if (call.duration && call.duration > 300) score += 15; // Very long calls

    // Company size indicator
    if (call.customerCompany) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Suggest next follow-up date based on call outcome
   */
  private suggestNextFollowUp(call: CallDetails): string {
    const outcome = (call.summary || '').toLowerCase();
    let daysToAdd = 7; // Default 1 week

    if (outcome.includes('urgent') || outcome.includes('asap')) {
      daysToAdd = 1; // Next day
    } else if (outcome.includes('hot') || outcome.includes('very interested')) {
      daysToAdd = 2; // 2 days
    } else if (outcome.includes('scheduled') || outcome.includes('demo')) {
      daysToAdd = 0; // Already scheduled, no additional follow-up needed
    } else if (outcome.includes('warm') || outcome.includes('considering')) {
      daysToAdd = 5; // 5 days
    }

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + daysToAdd);
    return followUpDate.toISOString();
  }

  /**
   * Suggest next action based on call data
   */
  private suggestNextAction(call: CallDetails): string {
    const outcome = (call.summary || '').toLowerCase();

    if (outcome.includes('demo') || outcome.includes('presentation')) {
      return 'Prepare and conduct product demo';
    }

    if (outcome.includes('proposal') || outcome.includes('quote')) {
      return 'Send detailed proposal and pricing';
    }

    if (outcome.includes('email') || outcome.includes('information')) {
      return 'Send follow-up email with additional information';
    }

    if (outcome.includes('meeting') || outcome.includes('call back')) {
      return 'Schedule follow-up meeting';
    }

    if (outcome.includes('decision maker') || outcome.includes('manager')) {
      return 'Contact decision maker or manager';
    }

    return 'Follow up with personalized outreach based on call discussion';
  }
}

export const callsService = new CallsService();
