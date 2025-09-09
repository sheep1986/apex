import { supabase } from './supabase-client';
// Bull is a Node.js package that requires backend - commenting out for frontend build
// import Bull from 'bull';
import { format, addHours, isWithinInterval } from 'date-fns';

interface CallJob {
  campaignId: string;
  leadId: string;
  phoneNumber: string;
  assistantId: string;
  retryCount?: number;
}

interface PhoneNumber {
  id: string;
  number: string;
  dailyCallCount: number;
  lastUsed: Date;
}

export class CampaignProcessorService {
  // Bull queue will be initialized on backend only
  private callQueue: any; // Bull.Queue<CallJob>
  private phoneNumbers: PhoneNumber[] = [];
  private currentPhoneIndex = 0;
  
  // Configuration
  private readonly MAX_CALLS_PER_MINUTE = 10; // VAPI rate limit safety
  private readonly MAX_CALLS_PER_PHONE_PER_DAY = 166; // 2000/12 phones
  private readonly CALL_WINDOW_START = 9; // 9 AM
  private readonly CALL_WINDOW_END = 20; // 8 PM
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 300000; // 5 minutes

  constructor() {
    // Note: Bull queue requires backend with Redis
    // This is a frontend-only implementation for UI
    // Actual queue processing must be done on backend
    
    // Initialize without Bull for frontend
    this.callQueue = null;
    this.loadPhoneNumbers();
    
    // Queue processors would be setup on backend
    if (typeof window === 'undefined') {
      // Server-side only
      this.setupQueueProcessors();
    }
  }

  private async loadPhoneNumbers() {
    // Load phone numbers from database
    const { data: numbers } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('status', 'active')
      .eq('country', 'UK');

    if (numbers && numbers.length > 0) {
      this.phoneNumbers = numbers.map(n => ({
        id: n.id,
        number: n.number,
        dailyCallCount: 0,
        lastUsed: new Date()
      }));
    } else {
      console.warn('No phone numbers configured. Using default.');
      this.phoneNumbers = [{
        id: 'default',
        number: '+447482792343',
        dailyCallCount: 0,
        lastUsed: new Date()
      }];
    }
  }

  private setupQueueProcessors() {
    // This would only run on backend/server
    if (!this.callQueue) return;
    
    // Process calls with rate limiting
    this.callQueue.process('make-call', this.MAX_CALLS_PER_MINUTE, async (job: any) => {
      const { campaignId, leadId, phoneNumber, assistantId } = job.data;
      
      // Check if within call window
      if (!this.isWithinCallWindow()) {
        // Reschedule for next call window
        const nextWindow = this.getNextCallWindow();
        await job.moveToDelayed(nextWindow.getTime());
        return { status: 'rescheduled', nextWindow };
      }

      // Get next available phone number
      const fromNumber = this.getNextPhoneNumber();
      if (!fromNumber) {
        throw new Error('No available phone numbers for today');
      }

      // Make the VAPI call
      const result = await this.makeVapiCall({
        to: phoneNumber,
        from: fromNumber.number,
        assistantId,
        metadata: {
          campaignId,
          leadId,
          attempt: (job.data.retryCount || 0) + 1
        }
      });

      // Update call record in database
      await this.updateCallRecord(leadId, result);

      return result;
    });

    // Handle failed jobs
    this.callQueue.on('failed', async (job, err) => {
      console.error(`Call job ${job.id} failed:`, err);
      
      // Update lead status
      await supabase
        .from('leads')
        .update({
          status: 'failed',
          last_call_attempt: new Date().toISOString(),
          error_message: err.message
        })
        .eq('id', job.data.leadId);
    });

    // Handle completed jobs
    this.callQueue.on('completed', async (job, result) => {
      console.log(`Call job ${job.id} completed:`, result);
      
      // Update campaign metrics
      await this.updateCampaignMetrics(job.data.campaignId);
    });
  }

  private isWithinCallWindow(): boolean {
    const now = new Date();
    const hour = now.getHours();
    return hour >= this.CALL_WINDOW_START && hour < this.CALL_WINDOW_END;
  }

  private getNextCallWindow(): Date {
    const now = new Date();
    const nextWindow = new Date(now);
    
    if (now.getHours() >= this.CALL_WINDOW_END) {
      // Next day at 9 AM
      nextWindow.setDate(nextWindow.getDate() + 1);
    }
    
    nextWindow.setHours(this.CALL_WINDOW_START, 0, 0, 0);
    return nextWindow;
  }

  private getNextPhoneNumber(): PhoneNumber | null {
    // Reset daily counts at midnight
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      this.phoneNumbers.forEach(p => p.dailyCallCount = 0);
    }

    // Find available phone number using round-robin
    let attempts = 0;
    while (attempts < this.phoneNumbers.length) {
      const phone = this.phoneNumbers[this.currentPhoneIndex];
      
      if (phone.dailyCallCount < this.MAX_CALLS_PER_PHONE_PER_DAY) {
        phone.dailyCallCount++;
        phone.lastUsed = new Date();
        this.currentPhoneIndex = (this.currentPhoneIndex + 1) % this.phoneNumbers.length;
        return phone;
      }
      
      this.currentPhoneIndex = (this.currentPhoneIndex + 1) % this.phoneNumbers.length;
      attempts++;
    }
    
    return null; // All numbers exhausted for today
  }

  private async makeVapiCall(params: any): Promise<any> {
    const vapiApiKey = process.env.VAPI_API_KEY || 'da8956d4-0508-474e-bd96-7eda82d2d943';
    
    try {
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vapiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumberId: params.from,
          customer: {
            number: params.to
          },
          assistantId: params.assistantId,
          metadata: params.metadata
        })
      });

      if (!response.ok) {
        throw new Error(`VAPI call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('VAPI call error:', error);
      throw error;
    }
  }

  private async updateCallRecord(leadId: string, vapiResult: any) {
    await supabase
      .from('calls')
      .insert({
        lead_id: leadId,
        vapi_call_id: vapiResult.id,
        status: 'initiated',
        started_at: new Date().toISOString(),
        phone_number_used: vapiResult.phoneNumber
      });
  }

  private async updateCampaignMetrics(campaignId: string) {
    // Get current metrics
    const { data: metrics } = await supabase
      .from('calls')
      .select('status, duration, cost')
      .eq('campaign_id', campaignId);

    if (metrics) {
      const totalCalls = metrics.length;
      const completedCalls = metrics.filter(m => m.status === 'completed').length;
      const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
      const totalCost = metrics.reduce((sum, m) => sum + (m.cost || 0), 0);

      await supabase
        .from('campaigns')
        .update({
          total_calls: totalCalls,
          completed_calls: completedCalls,
          total_duration: totalDuration,
          total_cost: totalCost,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId);
    }
  }

  // Public methods

  async processCampaign(campaignId: string, leadIds?: string[]) {
    // Get campaign details
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign || !campaign.is_active) {
      throw new Error('Campaign not found or inactive');
    }

    // Get leads to call
    let query = supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .in('status', ['new', 'retry'])
      .order('priority', { ascending: false });

    if (leadIds && leadIds.length > 0) {
      query = query.in('id', leadIds);
    }

    const { data: leads } = await query;

    if (!leads || leads.length === 0) {
      console.log('No leads to process');
      return { processed: 0 };
    }

    // Queue calls for each lead
    let queued = 0;
    for (const lead of leads) {
      // In frontend, we just update the database
      // Backend service will pick up and process
      if (this.callQueue) {
        await this.callQueue.add('make-call', {
        campaignId: campaign.id,
        leadId: lead.id,
        phoneNumber: lead.phone_number,
        assistantId: campaign.assistant_id || campaign.settings?.assistant_id,
        retryCount: 0
        }, {
          delay: queued * 6000 // Space out calls by 6 seconds (10 per minute)
        });
      }

      // Update lead status
      await supabase
        .from('leads')
        .update({
          status: 'queued',
          queued_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      queued++;
    }

    return {
      processed: queued,
      campaign: campaign.name,
      estimatedTime: `${Math.ceil(queued / 10)} minutes`
    };
  }

  async getQueueStatus() {
    // Mock data for frontend when queue not available
    if (!this.callQueue) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        phoneNumbers: this.phoneNumbers.map(p => ({
          number: p.number,
          dailyCallsUsed: p.dailyCallCount,
          dailyCallsRemaining: this.MAX_CALLS_PER_PHONE_PER_DAY - p.dailyCallCount
        })),
        isWithinCallWindow: this.isWithinCallWindow(),
        nextCallWindow: !this.isWithinCallWindow() ? this.getNextCallWindow() : null
      };
    }
    
    const waiting = await this.callQueue.getWaitingCount();
    const active = await this.callQueue.getActiveCount();
    const completed = await this.callQueue.getCompletedCount();
    const failed = await this.callQueue.getFailedCount();
    const delayed = await this.callQueue.getDelayedCount();

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      phoneNumbers: this.phoneNumbers.map(p => ({
        number: p.number,
        dailyCallsUsed: p.dailyCallCount,
        dailyCallsRemaining: this.MAX_CALLS_PER_PHONE_PER_DAY - p.dailyCallCount
      })),
      isWithinCallWindow: this.isWithinCallWindow(),
      nextCallWindow: !this.isWithinCallWindow() ? this.getNextCallWindow() : null
    };
  }

  async pauseCampaign(campaignId: string) {
    // In frontend, just update database status
    if (!this.callQueue) {
      await supabase
        .from('campaigns')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString()
        })
        .eq('id', campaignId);
      
      return { paused: true };
    }
    
    // Remove all pending jobs for this campaign
    const jobs = await this.callQueue.getJobs(['waiting', 'delayed']);
    
    for (const job of jobs) {
      if (job.data.campaignId === campaignId) {
        await job.remove();
      }
    }

    // Update campaign status
    await supabase
      .from('campaigns')
      .update({
        is_active: false,
        paused_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    return { paused: true };
  }

  async resumeCampaign(campaignId: string) {
    // Update campaign status
    await supabase
      .from('campaigns')
      .update({
        is_active: true,
        resumed_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    // Requeue pending leads
    return await this.processCampaign(campaignId);
  }

  // Monitoring methods
  
  async getDailyStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todaysCalls } = await supabase
      .from('calls')
      .select('*')
      .gte('created_at', today.toISOString());

    const totalCalls = todaysCalls?.length || 0;
    const completedCalls = todaysCalls?.filter(c => c.status === 'completed').length || 0;
    const failedCalls = todaysCalls?.filter(c => c.status === 'failed').length || 0;
    const totalCost = todaysCalls?.reduce((sum, c) => sum + (c.cost || 0), 0) || 0;

    return {
      date: format(today, 'yyyy-MM-dd'),
      totalCalls,
      completedCalls,
      failedCalls,
      successRate: totalCalls > 0 ? (completedCalls / totalCalls * 100).toFixed(2) + '%' : '0%',
      totalCost: `£${totalCost.toFixed(2)}`,
      callsRemaining: 2000 - totalCalls,
      estimatedCostToday: `£${(totalCalls * 2.05).toFixed(2)}`
    };
  }
}

// Export singleton instance
export const campaignProcessor = new CampaignProcessorService();