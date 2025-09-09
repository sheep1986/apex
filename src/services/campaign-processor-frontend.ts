import { supabase } from './supabase-client';
import { format } from 'date-fns';

interface PhoneNumber {
  id: string;
  number: string;
  dailyCallCount: number;
  lastUsed: Date;
}

// This is a frontend-only version of the campaign processor
// The actual queue processing with Bull/Redis must be done on the backend
export class CampaignProcessorFrontendService {
  private phoneNumbers: PhoneNumber[] = [];
  private currentPhoneIndex = 0;
  
  // Configuration
  private readonly MAX_CALLS_PER_MINUTE = 10;
  private readonly MAX_CALLS_PER_PHONE_PER_DAY = 166;
  private readonly CALL_WINDOW_START = 9;
  private readonly CALL_WINDOW_END = 20;
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.loadPhoneNumbers();
  }

  private async loadPhoneNumbers() {
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
      this.phoneNumbers = [{
        id: 'default',
        number: '+447482792343',
        dailyCallCount: 0,
        lastUsed: new Date()
      }];
    }
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
      nextWindow.setDate(nextWindow.getDate() + 1);
    }
    
    nextWindow.setHours(this.CALL_WINDOW_START, 0, 0, 0);
    return nextWindow;
  }

  async processCampaign(campaignId: string, leadIds?: string[]) {
    // Get campaign details
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (!campaign || campaign.status !== 'active') {
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

    // In frontend, we just mark leads as queued
    // Backend service will pick them up and process
    let queued = 0;
    for (const lead of leads) {
      await supabase
        .from('leads')
        .update({
          status: 'queued',
          queued_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      queued++;
    }

    // Update campaign to show it's processing
    await supabase
      .from('campaigns')
      .update({
        status: 'processing',
        last_run_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    return {
      processed: queued,
      campaign: campaign.name,
      estimatedTime: `${Math.ceil(queued / 10)} minutes`,
      message: 'Leads queued for processing. Backend service will process calls.'
    };
  }

  async getQueueStatus() {
    // Get stats from database
    const { data: queuedLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('status', 'queued');

    const { data: processingLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('status', 'processing');

    const { data: completedCalls } = await supabase
      .from('calls')
      .select('id')
      .eq('status', 'completed');

    const { data: failedCalls } = await supabase
      .from('calls')
      .select('id')
      .eq('status', 'failed');

    return {
      waiting: queuedLeads?.length || 0,
      active: processingLeads?.length || 0,
      completed: completedCalls?.length || 0,
      failed: failedCalls?.length || 0,
      delayed: 0,
      phoneNumbers: this.phoneNumbers.map(p => ({
        number: p.number,
        dailyCallsUsed: p.dailyCallCount,
        dailyCallsRemaining: this.MAX_CALLS_PER_PHONE_PER_DAY - p.dailyCallCount
      })),
      isWithinCallWindow: this.isWithinCallWindow(),
      nextCallWindow: !this.isWithinCallWindow() ? this.getNextCallWindow() : null,
      message: 'Frontend view - actual processing happens on backend'
    };
  }

  async pauseCampaign(campaignId: string) {
    // Update campaign status in database
    await supabase
      .from('campaigns')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    // Update any queued leads back to new status
    await supabase
      .from('leads')
      .update({
        status: 'new',
        queued_at: null
      })
      .eq('campaign_id', campaignId)
      .eq('status', 'queued');

    return { paused: true };
  }

  async resumeCampaign(campaignId: string) {
    // Update campaign status
    await supabase
      .from('campaigns')
      .update({
        status: 'active',
        resumed_at: new Date().toISOString()
      })
      .eq('id', campaignId);

    // Requeue pending leads
    return await this.processCampaign(campaignId);
  }

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
      estimatedCostToday: `£${(totalCalls * 2.05).toFixed(2)}`,
      note: 'Frontend statistics - actual call processing requires backend service'
    };
  }
}

// Export singleton instance
export const campaignProcessor = new CampaignProcessorFrontendService();