"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignExecutor = exports.CampaignExecutor = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const supabase_client_1 = __importDefault(require("./supabase-client"));
const vapi_service_1 = require("./vapi-service");
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
class CampaignExecutor {
    constructor() {
        this.isRunning = false;
        this.processingCampaigns = new Set();
        this.vapiServiceCache = new Map();
        console.log('📦 Campaign Executor instance created');
    }
    start() {
        console.log('🎯 Starting Campaign Executor...');
        this.startScheduler();
        this.startCleanupScheduler();
    }
    startCleanupScheduler() {
        console.log('🧹 Starting stuck call cleanup scheduler...');
        setInterval(async () => {
            await this.cleanupStuckCalls();
        }, 10 * 60 * 1000);
        setTimeout(() => this.cleanupStuckCalls(), 30000);
    }
    async cleanupStuckCalls() {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: stuckCalls, error } = await supabase_client_1.default
            .from('calls')
            .update({
            status: 'failed',
            end_reason: 'timeout',
            updated_at: new Date().toISOString()
        })
            .eq('status', 'in_progress')
            .lt('created_at', thirtyMinutesAgo)
            .select();
        if (error) {
            console.error('❌ Error cleaning up stuck calls:', error);
            return;
        }
        if (stuckCalls && stuckCalls.length > 0) {
            console.log(`🧹 Cleaned up ${stuckCalls.length} stuck calls`);
        }
    }
    startScheduler() {
        console.log('🚀 Campaign Executor scheduler initializing...');
        const task = node_cron_1.default.schedule('* * * * *', async () => {
            console.log(`⏰ Campaign executor cron triggered at ${new Date().toISOString()}`);
            if (!this.isRunning) {
                this.isRunning = true;
                try {
                    await this.processCampaigns();
                }
                catch (error) {
                    console.error('❌ Error processing campaigns:', error);
                }
                finally {
                    this.isRunning = false;
                }
            }
            else {
                console.log('⏭️ Skipping - campaign executor already running');
            }
        });
        console.log('✅ Campaign Executor cron job scheduled successfully');
        setTimeout(() => {
            console.log('🏃 Running initial campaign check...');
            this.processCampaigns();
        }, 5000);
    }
    async getVapiServiceForOrganization(organizationId) {
        if (this.vapiServiceCache.has(organizationId)) {
            return this.vapiServiceCache.get(organizationId) || null;
        }
        const vapiService = await vapi_service_1.VapiService.forOrganization(organizationId);
        this.vapiServiceCache.set(organizationId, vapiService);
        return vapiService;
    }
    clearVapiServiceCache(organizationId) {
        if (organizationId) {
            this.vapiServiceCache.delete(organizationId);
        }
        else {
            this.vapiServiceCache.clear();
        }
    }
    async processCampaigns() {
        try {
            const { data: campaigns, error } = await supabase_client_1.default
                .from('campaigns')
                .select('*, organization_id')
                .in('status', ['active', 'scheduled'])
                .order('created_at', { ascending: true });
            if (error) {
                console.error('❌ Error fetching campaigns:', error);
                return;
            }
            if (!campaigns || campaigns.length === 0) {
                return;
            }
            console.log(`📋 Processing ${campaigns.length} campaigns...`);
            for (const rawCampaign of campaigns) {
                if (this.processingCampaigns.has(rawCampaign.id)) {
                    continue;
                }
                try {
                    const campaign = this.transformCampaignData(rawCampaign);
                    this.processingCampaigns.add(campaign.id);
                    await this.processCampaign(campaign);
                }
                catch (error) {
                    console.error(`❌ Error processing campaign ${campaign.id}:`, error);
                }
                finally {
                    this.processingCampaigns.delete(campaign.id);
                }
            }
        }
        catch (error) {
            console.error('❌ Error in processCampaigns:', error);
        }
    }
    parseCSVData(csvData) {
        if (!csvData)
            return [];
        const lines = csvData.trim().split('\n');
        if (lines.length < 2)
            return [];
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const contacts = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const contact = { id: `csv_${i}` };
            headers.forEach((header, index) => {
                const value = values[index]?.trim();
                if (header.includes('phone') || header.includes('number')) {
                    contact.phone = value;
                }
                else if (header.includes('name')) {
                    if (header.includes('first')) {
                        contact.first_name = value;
                    }
                    else if (header.includes('last')) {
                        contact.last_name = value;
                    }
                    else {
                        contact.name = value;
                    }
                }
                else if (header.includes('email')) {
                    contact.email = value;
                }
                else if (header.includes('company')) {
                    contact.company = value;
                }
                else {
                    contact[header] = value;
                }
            });
            if (contact.phone) {
                if (!contact.name && (contact.first_name || contact.last_name)) {
                    contact.name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
                }
                contacts.push(contact);
            }
        }
        console.log(`📦 Parsed ${contacts.length} contacts from CSV`);
        return contacts;
    }
    transformCampaignData(rawCampaign) {
        if (rawCampaign.settings) {
            const settings = rawCampaign.settings;
            return {
                id: rawCampaign.id,
                organization_id: rawCampaign.organization_id,
                name: rawCampaign.name,
                status: rawCampaign.status,
                assistantId: settings.assistant_id || rawCampaign.assistant_id,
                phoneNumberIds: settings.phone_number_id ? [settings.phone_number_id] : (rawCampaign.phone_number_ids || []),
                workingHours: settings.workingHours || {
                    start: '09:00',
                    end: '17:00',
                    timezone: settings.defaultTimezone || 'America/New_York'
                },
                workingDays: settings.workingDays || {
                    monday: true,
                    tuesday: true,
                    wednesday: true,
                    thursday: true,
                    friday: true,
                    saturday: false,
                    sunday: false
                },
                callLimitSettings: {
                    enableDailyLimit: settings.enableRateLimiting || false,
                    dailyCallLimit: settings.callsPerHour || 100
                },
                retrySettings: {
                    enableRetries: settings.retryStrategy !== 'none',
                    maxRetries: settings.maxRetryAttempts || 3,
                    retryDelay: settings.retryInterval || 60,
                    retryDelayUnit: 'hours',
                    retryOnNoAnswer: settings.retryConditions?.includes('no_answer') || true,
                    retryOnBusy: settings.retryConditions?.includes('busy') || true,
                    retryOnVoicemail: settings.retryConditions?.includes('voicemail') || false,
                    retryOnFailed: settings.retryConditions?.includes('failed') || true
                },
                createdAt: rawCampaign.created_at,
                scheduledStart: settings.scheduledStart
            };
        }
        return rawCampaign;
    }
    async processCampaign(campaign) {
        const now = new Date();
        const lockKey = `campaign_lock_${campaign.id}`;
        const { data: existingLock } = await supabase_client_1.default
            .from('campaign_locks')
            .select('*')
            .eq('campaign_id', campaign.id)
            .gte('expires_at', now.toISOString())
            .single();
        if (existingLock) {
            console.log(`⏭️ Campaign ${campaign.id} is already being processed`);
            return;
        }
        const lockExpiry = new Date(now.getTime() + 2 * 60 * 1000);
        await supabase_client_1.default
            .from('campaign_locks')
            .upsert({
            campaign_id: campaign.id,
            locked_at: now.toISOString(),
            expires_at: lockExpiry.toISOString()
        });
        if (campaign.status === 'scheduled') {
            if (!campaign.scheduledStart || new Date(campaign.scheduledStart) > now) {
                return;
            }
            await this.startCampaign(campaign.id);
            campaign.status = 'active';
        }
        if (!this.isWithinWorkingHours(campaign, now)) {
            return;
        }
        const todayCallCount = await this.getTodayCallCount(campaign.id);
        if (campaign.callLimitSettings.enableDailyLimit &&
            todayCallCount >= campaign.callLimitSettings.dailyCallLimit) {
            console.log(`📞 Campaign ${campaign.id} reached daily limit (${todayCallCount}/${campaign.callLimitSettings.dailyCallLimit})`);
            return;
        }
        const callsToMake = await this.getCallsToMake(campaign.id, campaign.callLimitSettings.dailyCallLimit - todayCallCount);
        if (callsToMake.length === 0) {
            const pendingCalls = await this.getPendingCallsCount(campaign.id);
            if (pendingCalls === 0) {
                await this.completeCampaign(campaign.id);
            }
            return;
        }
        console.log(`📞 Campaign ${campaign.id}: Making ${callsToMake.length} calls`);
        for (const queuedCall of callsToMake) {
            try {
                if (await this.isCallInProgress(queuedCall.contactId || '', queuedCall.phoneNumber)) {
                    console.log(`⏭️ Call already in progress for ${queuedCall.phoneNumber}`);
                    continue;
                }
                await this.makeCall(campaign, queuedCall);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                console.error(`❌ Error making call ${queuedCall.id}:`, error);
                await this.markCallFailed(queuedCall.id, 'system_error');
            }
        }
    }
    isWithinWorkingHours(campaign, now) {
        if (!campaign.workingHours) {
            console.warn(`Campaign ${campaign.id} missing workingHours - defaulting to business hours`);
            campaign.workingHours = {
                start: '09:00',
                end: '17:00',
                timezone: 'America/New_York'
            };
        }
        const timezone = campaign.workingHours.timezone || 'America/New_York';
        const zonedNow = (0, date_fns_tz_1.toZonedTime)(now, timezone);
        if (!campaign.workingDays) {
            console.warn(`Campaign ${campaign.id} missing workingDays - defaulting to weekdays`);
            campaign.workingDays = {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
                sunday: false
            };
        }
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = dayNames[zonedNow.getDay()];
        if (!campaign.workingDays[currentDay]) {
            return false;
        }
        const currentTime = (0, date_fns_1.format)(zonedNow, 'HH:mm');
        const startTime = campaign.workingHours.start;
        const endTime = campaign.workingHours.end;
        return currentTime >= startTime && currentTime <= endTime;
    }
    async isCallInProgress(leadId, phoneNumber) {
        const { data: existingCalls } = await supabase_client_1.default
            .from('calls')
            .select('id, status')
            .or(`lead_id.eq.${leadId},customer_phone.eq.${phoneNumber}`)
            .in('status', ['in_progress', 'queued', 'ringing'])
            .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
        return !!(existingCalls && existingCalls.length > 0);
    }
    async getTodayCallCount(campaignId) {
        const today = (0, date_fns_1.format)(new Date(), 'yyyy-MM-dd');
        const { count, error } = await supabase_client_1.default
            .from('calls')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .gte('call_started_at', `${today}T00:00:00`)
            .lt('call_started_at', `${today}T23:59:59`);
        if (error) {
            console.error('❌ Error getting today call count:', error);
            return 0;
        }
        return count || 0;
    }
    async getCallsToMake(campaignId, limit) {
        const now = new Date().toISOString();
        const { data: calls, error } = await supabase_client_1.default
            .from('call_queue')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('status', 'pending')
            .lte('scheduled_for', now)
            .order('scheduled_for', { ascending: true })
            .limit(limit);
        if (error) {
            console.error('❌ Error getting calls to make:', error);
            return [];
        }
        return calls || [];
    }
    async getPendingCallsCount(campaignId) {
        const { count, error } = await supabase_client_1.default
            .from('call_queue')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaignId)
            .eq('status', 'pending');
        if (error) {
            console.error('❌ Error getting pending calls count:', error);
            return 0;
        }
        return count || 0;
    }
    async makeCall(campaign, queuedCall) {
        try {
            await supabase_client_1.default
                .from('call_queue')
                .update({
                status: 'calling',
                updated_at: new Date().toISOString()
            })
                .eq('id', queuedCall.id);
            const vapiService = await this.getVapiServiceForOrganization(campaign.organization_id);
            if (!vapiService) {
                throw new Error(`No VAPI credentials configured for organization: ${campaign.organization_id}`);
            }
            const phoneNumberId = this.selectPhoneNumber(campaign.phoneNumberIds, queuedCall.attempt);
            const call = await vapiService.createCall({
                assistantId: campaign.assistantId,
                phoneNumberId: phoneNumberId,
                customer: {
                    number: queuedCall.phoneNumber,
                    name: queuedCall.contactName
                }
            });
            await supabase_client_1.default
                .from('call_queue')
                .update({
                last_call_id: call.id,
                last_attempt_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
                .eq('id', queuedCall.id);
            console.log(`📞 Call initiated: ${queuedCall.contactName} (${queuedCall.phoneNumber}) - VAPI Call ID: ${call.id}`);
        }
        catch (error) {
            console.error(`❌ Error making call for ${queuedCall.contactName}:`, error);
            await this.markCallFailed(queuedCall.id, 'vapi_error');
        }
    }
    selectPhoneNumber(phoneNumberIds, attempt) {
        const index = attempt % phoneNumberIds.length;
        return phoneNumberIds[index];
    }
    async markCallFailed(queuedCallId, reason) {
        await supabase_client_1.default
            .from('call_queue')
            .update({
            status: 'failed',
            last_outcome: reason,
            updated_at: new Date().toISOString()
        })
            .eq('id', queuedCallId);
    }
    async startCampaign(campaignId) {
        console.log(`🚀 Starting campaign ${campaignId}`);
        const { data: campaign, error: campaignError } = await supabase_client_1.default
            .from('campaigns')
            .select('settings')
            .eq('id', campaignId)
            .single();
        if (campaignError) {
            console.error('❌ Error getting campaign:', campaignError);
            return;
        }
        let contacts = [];
        const { data: existingContacts, error } = await supabase_client_1.default
            .from('campaign_contacts')
            .select('*')
            .eq('campaign_id', campaignId);
        if (!error && existingContacts && existingContacts.length > 0) {
            contacts = existingContacts;
        }
        else if (campaign?.settings?.csv_data) {
            console.log('📋 Parsing CSV data from campaign settings');
            contacts = this.parseCSVData(campaign.settings.csv_data);
        }
        if (!contacts || contacts.length === 0) {
            console.log(`⚠️ No contacts found for campaign ${campaignId}`);
            return;
        }
        const queueEntries = contacts.map(contact => ({
            campaign_id: campaignId,
            contact_id: contact.id,
            phone_number: contact.phone,
            contact_name: contact.name || `${contact.first_name} ${contact.last_name}`,
            attempt: 1,
            scheduled_for: new Date().toISOString(),
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));
        const { error: insertError } = await supabase_client_1.default
            .from('call_queue')
            .insert(queueEntries);
        if (insertError) {
            console.error('❌ Error creating call queue:', insertError);
            return;
        }
        await supabase_client_1.default
            .from('campaigns')
            .update({
            status: 'active',
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
            .eq('id', campaignId);
        console.log(`✅ Campaign ${campaignId} started with ${contacts.length} contacts`);
    }
    async completeCampaign(campaignId) {
        console.log(`🎯 Completing campaign ${campaignId}`);
        await supabase_client_1.default
            .from('campaigns')
            .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
            .eq('id', campaignId);
    }
    async processCallResult(vapiCallId, result) {
        try {
            const { data: queuedCall, error } = await supabase_client_1.default
                .from('call_queue')
                .select('*')
                .eq('last_call_id', vapiCallId)
                .single();
            if (error || !queuedCall) {
                console.error('❌ Could not find queued call for VAPI call:', vapiCallId);
                return;
            }
            const outcome = this.determineCallOutcome(result);
            await supabase_client_1.default
                .from('call_queue')
                .update({
                status: 'completed',
                last_outcome: outcome,
                updated_at: new Date().toISOString()
            })
                .eq('id', queuedCall.id);
            await this.saveCallRecord(queuedCall, result, outcome);
            await this.scheduleRetryIfNeeded(queuedCall, outcome);
            console.log(`✅ Processed call result: ${queuedCall.contact_name} - ${outcome}`);
        }
        catch (error) {
            console.error('❌ Error processing call result:', error);
        }
    }
    determineCallOutcome(result) {
        if (result.endedReason === 'customer-ended-call')
            return 'answered';
        if (result.endedReason === 'assistant-ended-call')
            return 'completed';
        if (result.endedReason === 'pipeline-error-openai-voice-failed')
            return 'failed';
        if (result.type === 'call-ended' && result.call?.duration > 30)
            return 'answered';
        if (result.type === 'call-ended' && result.call?.duration <= 30)
            return 'no_answer';
        return 'unknown';
    }
    async saveCallRecord(queuedCall, vapiResult, outcome) {
        const { data: campaign } = await supabase_client_1.default
            .from('campaigns')
            .select('organization_id')
            .eq('id', queuedCall.campaignId)
            .single();
        const phoneFromWebhook = vapiResult.customerPhone || vapiResult.call?.customer?.number;
        const phoneFromQueue = queuedCall.phoneNumber;
        const finalPhone = phoneFromWebhook || phoneFromQueue;
        const nameFromWebhook = vapiResult.customerName || vapiResult.call?.customer?.name;
        const nameFromQueue = queuedCall.contactName;
        const finalName = nameFromWebhook || nameFromQueue;
        if (!finalPhone) {
            console.error(`❌ CRITICAL: No phone number found for call ${vapiResult.call?.id}`);
            console.log('   Webhook phone:', phoneFromWebhook);
            console.log('   Queue phone:', phoneFromQueue);
            console.log('   VAPI result:', JSON.stringify(vapiResult, null, 2));
        }
        else {
            console.log(`✅ Phone number found: ${finalPhone} (from ${phoneFromWebhook ? 'webhook' : 'queue'})`);
        }
        const callRecord = {
            id: vapiResult.call?.id || queuedCall.last_call_id,
            campaign_id: queuedCall.campaignId,
            customer_name: finalName,
            customer_phone: finalPhone,
            outcome: outcome,
            duration: vapiResult.call?.duration || vapiResult.duration || 0,
            cost: vapiResult.call?.cost || vapiResult.cost || 0,
            started_at: vapiResult.call?.startedAt || queuedCall.last_attempt_at,
            ended_at: vapiResult.call?.endedAt || new Date().toISOString(),
            transcript: vapiResult.transcript || vapiResult.call?.transcript || null,
            recording_url: vapiResult.recordingUrl || vapiResult.call?.recordingUrl || vapiResult.call?.stereoRecordingUrl || null,
            vapi_call_id: vapiResult.call?.id,
            organization_id: campaign?.organization_id,
            contact_info: {
                phone: finalPhone,
                name: finalName,
                source: phoneFromWebhook ? 'vapi_webhook' : 'call_queue'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const { data: savedCall, error } = await supabase_client_1.default
            .from('calls')
            .upsert(callRecord, { onConflict: 'id' })
            .select()
            .single();
        if (error) {
            console.error('❌ Error saving call record:', error);
            return;
        }
        const transcript = vapiResult.transcript || vapiResult.call?.transcript;
        if (transcript) {
            console.log('🤖 Triggering AI processing for call:', savedCall.id);
            console.log(`   Initial outcome: ${outcome} (will be updated by AI)`);
            await supabase_client_1.default
                .from('calls')
                .update({
                status: 'processing',
                updated_at: new Date().toISOString()
            })
                .eq('id', savedCall.id);
            try {
                const { processCallWithEnhancedAI } = await Promise.resolve().then(() => __importStar(require('./enhanced-ai-processor')));
                const vapiCallData = {
                    ...vapiResult.call,
                    transcript: transcript,
                    summary: vapiResult.summary || vapiResult.call?.summary,
                    analysis: vapiResult.analysis || vapiResult.call?.analysis
                };
                await processCallWithEnhancedAI(savedCall.id, transcript, vapiCallData);
            }
            catch (aiError) {
                console.error('❌ AI processing failed:', aiError);
                await supabase_client_1.default
                    .from('calls')
                    .update({
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                    .eq('id', savedCall.id);
            }
        }
        else {
            console.log('⚠️  No transcript available for AI processing');
        }
    }
    async scheduleRetryIfNeeded(queuedCall, outcome) {
        const { data: campaign, error } = await supabase_client_1.default
            .from('campaigns')
            .select('settings, retry_settings')
            .eq('id', queuedCall.campaignId)
            .single();
        if (error || !campaign)
            return;
        const retrySettings = campaign.retry_settings || campaign.settings?.retrySettings ||
            (campaign.settings ? {
                enableRetries: campaign.settings.retryStrategy !== 'none',
                maxRetries: campaign.settings.maxRetryAttempts || 3,
                retryDelay: campaign.settings.retryInterval || 60,
                retryDelayUnit: 'hours',
                retryOnNoAnswer: campaign.settings.retryConditions?.includes('no_answer'),
                retryOnBusy: campaign.settings.retryConditions?.includes('busy'),
                retryOnVoicemail: campaign.settings.retryConditions?.includes('voicemail'),
                retryOnFailed: campaign.settings.retryConditions?.includes('failed')
            } : null);
        if (!retrySettings?.enableRetries)
            return;
        if (queuedCall.attempt >= retrySettings.maxRetries)
            return;
        const shouldRetry = ((outcome === 'no_answer' && retrySettings.retryOnNoAnswer) ||
            (outcome === 'busy' && retrySettings.retryOnBusy) ||
            (outcome === 'voicemail' && retrySettings.retryOnVoicemail) ||
            (outcome === 'failed' && retrySettings.retryOnFailed) ||
            (outcome === 'quick_hangup' && (retrySettings.retryOnQuickHangup ?? true)) ||
            (outcome === 'provider_error' && (retrySettings.retryOnFailed ?? true)) ||
            (outcome === 'system_error' && (retrySettings.retryOnFailed ?? true)));
        if (!shouldRetry)
            return;
        const delay = retrySettings.retryDelay;
        const unit = retrySettings.retryDelayUnit;
        const nextRetry = unit === 'hours'
            ? (0, date_fns_1.addHours)(new Date(), delay)
            : (0, date_fns_1.addDays)(new Date(), delay);
        const retryEntry = {
            campaign_id: queuedCall.campaignId,
            contact_id: queuedCall.contactId,
            phone_number: queuedCall.phoneNumber,
            contact_name: queuedCall.contactName,
            attempt: queuedCall.attempt + 1,
            scheduled_for: nextRetry.toISOString(),
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        await supabase_client_1.default
            .from('call_queue')
            .insert(retryEntry);
        console.log(`🔄 Scheduled retry for ${queuedCall.contactName} at ${(0, date_fns_1.format)(nextRetry, 'PPpp')}`);
    }
    async pauseCampaign(campaignId) {
        await supabase_client_1.default
            .from('campaigns')
            .update({
            status: 'paused',
            updated_at: new Date().toISOString()
        })
            .eq('id', campaignId);
        console.log(`⏸️ Campaign ${campaignId} paused`);
    }
    async resumeCampaign(campaignId) {
        await supabase_client_1.default
            .from('campaigns')
            .update({
            status: 'active',
            updated_at: new Date().toISOString()
        })
            .eq('id', campaignId);
        console.log(`▶️ Campaign ${campaignId} resumed`);
    }
    async getCampaignStatus(campaignId) {
        const [campaignResult, queueResult, callsResult] = await Promise.all([
            supabase_client_1.default.from('campaigns').select('*').eq('id', campaignId).single(),
            supabase_client_1.default.from('call_queue').select('*').eq('campaign_id', campaignId),
            supabase_client_1.default.from('calls').select('*').eq('campaign_id', campaignId)
        ]);
        const campaign = campaignResult.data;
        const queue = queueResult.data || [];
        const calls = callsResult.data || [];
        return {
            campaign,
            metrics: {
                totalContacts: queue.length,
                callsCompleted: calls.length,
                callsPending: queue.filter(q => q.status === 'pending').length,
                callsInProgress: queue.filter(q => q.status === 'calling').length,
                successRate: calls.length > 0 ? (calls.filter(c => c.outcome === 'answered').length / calls.length) * 100 : 0,
                totalCost: calls.reduce((sum, call) => sum + (call.cost || 0), 0),
                avgDuration: calls.length > 0 ? calls.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / calls.length : 0
            },
            queue,
            calls
        };
    }
}
exports.CampaignExecutor = CampaignExecutor;
exports.campaignExecutor = new CampaignExecutor();
