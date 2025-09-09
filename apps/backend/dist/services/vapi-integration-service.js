"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VAPIIntegrationService = void 0;
const axios_1 = __importDefault(require("axios"));
const supabase_client_1 = __importDefault(require("./supabase-client"));
const crypto_1 = __importDefault(require("crypto"));
class VAPIIntegrationService {
    constructor(config) {
        this.config = config;
        if (!config.apiKey) {
            throw new Error('VAPI private key is required for API authentication');
        }
        this.client = axios_1.default.create({
            baseURL: 'https://api.vapi.ai',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000,
            validateStatus: (status) => status < 500
        });
    }
    static async forOrganization(organizationId) {
        try {
            console.log('🔄 Fetching VAPI credentials for organization:', organizationId);
            const { data: organization, error: orgError } = await supabase_client_1.default
                .from('organizations')
                .select('settings, vapi_public_key, vapi_api_key, vapi_private_key, vapi_settings, vapi_webhook_url')
                .eq('id', organizationId)
                .single();
            if (!organization || orgError) {
                console.log('⚠️ No organization found or error:', orgError);
                return null;
            }
            let publicKey = null;
            let privateKey = null;
            let webhookUrl = null;
            publicKey = organization.vapi_public_key || organization.vapi_api_key;
            privateKey = organization.vapi_private_key;
            webhookUrl = organization.vapi_webhook_url;
            if (!privateKey && organization.settings?.vapi) {
                const vapiSettings = organization.settings.vapi;
                privateKey = vapiSettings.privateKey || vapiSettings.apiKey;
                publicKey = publicKey || vapiSettings.publicKey || vapiSettings.apiKey;
                webhookUrl = webhookUrl || vapiSettings.webhookUrl;
            }
            if (!privateKey && organization.vapi_settings) {
                try {
                    const settings = typeof organization.vapi_settings === 'string'
                        ? JSON.parse(organization.vapi_settings)
                        : organization.vapi_settings;
                    privateKey = privateKey || settings.privateKey || settings.apiKey;
                    publicKey = publicKey || settings.publicKey;
                    webhookUrl = webhookUrl || settings.webhookUrl;
                    if (settings.enabled === false) {
                        console.log('⚠️ VAPI integration is disabled for this organization');
                        return null;
                    }
                }
                catch (parseError) {
                    console.log('⚠️ Could not parse vapi_settings column:', parseError);
                }
            }
            if (!privateKey) {
                console.log('⚠️ No VAPI private key found for organization');
                return null;
            }
            console.log('🎯 Creating VAPI service with credentials:', {
                hasPrivateKey: !!privateKey,
                privateKeyPreview: privateKey ? privateKey.substring(0, 10) + '...' : 'NO KEY',
                hasPublicKey: !!publicKey,
                publicKeyPreview: publicKey ? publicKey.substring(0, 10) + '...' : 'NO KEY',
                organizationId,
                webhookUrl: webhookUrl || 'default'
            });
            const config = {
                apiKey: privateKey,
                publicKey: publicKey || undefined,
                organizationId,
                webhookSecret: webhookUrl || `${process.env.BACKEND_URL}/api/vapi-webhook`
            };
            return new VAPIIntegrationService(config);
        }
        catch (error) {
            console.error('❌ Error creating VAPI service:', error);
            return null;
        }
    }
    getPublicKey() {
        return this.config.publicKey;
    }
    static verifyWebhookSignature(payload, signature, publicKey) {
        try {
            if (!publicKey) {
                console.warn('⚠️ No public key configured for webhook verification');
                return false;
            }
            const expectedSignature = crypto_1.default
                .createHmac('sha256', publicKey)
                .update(payload)
                .digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        }
        catch (error) {
            console.error('❌ Webhook signature verification error:', error);
            return false;
        }
    }
    static async getOrganizationVAPIConfig(organizationId) {
        try {
            const { data: org, error: orgError } = await supabase_client_1.default
                .from('organizations')
                .select('vapi_public_key, vapi_api_key, vapi_private_key, vapi_webhook_url, vapi_settings')
                .eq('id', organizationId)
                .single();
            if (!orgError && org) {
                const hasPublicKey = !!(org.vapi_public_key || org.vapi_api_key);
                const hasPrivateKey = !!org.vapi_private_key;
                return {
                    hasCredentials: hasPublicKey && hasPrivateKey,
                    hasPublicKey,
                    hasPrivateKey,
                    webhookUrl: org.vapi_webhook_url,
                    publicKeyPreview: hasPublicKey ? '***configured***' : null,
                    privateKeyPreview: hasPrivateKey ? '***configured***' : null
                };
            }
            return { hasCredentials: false, hasPublicKey: false, hasPrivateKey: false };
        }
        catch (error) {
            console.error('Error fetching VAPI config:', error);
            return { hasCredentials: false, error: error.message };
        }
    }
    async testConnection() {
        try {
            console.log('🔌 Testing VAPI connection...');
            const response = await this.client.get('/assistant', {
                params: { limit: 1 }
            });
            if (response.status === 200) {
                return {
                    connected: true,
                    message: 'Successfully connected to VAPI',
                    details: {
                        assistantCount: Array.isArray(response.data) ? response.data.length : 0
                    }
                };
            }
            return {
                connected: false,
                message: `Unexpected response status: ${response.status}`
            };
        }
        catch (error) {
            console.error('❌ VAPI connection test failed:', error.message);
            if (error.response?.status === 401) {
                return {
                    connected: false,
                    message: 'Invalid API key - please check your VAPI private key'
                };
            }
            if (error.response?.status === 403) {
                return {
                    connected: false,
                    message: 'API key lacks required permissions'
                };
            }
            return {
                connected: false,
                message: error.message || 'Connection test failed'
            };
        }
    }
    async syncAssistants() {
        try {
            console.log('🔄 Syncing VAPI assistants...');
            const assistants = await this.listAssistants();
            if (!Array.isArray(assistants)) {
                return { success: false, count: 0, error: 'Invalid response from VAPI' };
            }
            await supabase_client_1.default
                .from('vapi_assistants')
                .delete()
                .eq('organization_id', this.config.organizationId);
            if (assistants.length > 0) {
                const assistantRecords = assistants.map(assistant => ({
                    organization_id: this.config.organizationId,
                    vapi_assistant_id: assistant.id,
                    name: assistant.name,
                    type: 'outbound',
                    config: assistant,
                    voice_id: assistant.voice?.voiceId,
                    first_message: assistant.firstMessage,
                    system_prompt: assistant.model?.systemPrompt,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));
                const { error: insertError } = await supabase_client_1.default
                    .from('vapi_assistants')
                    .insert(assistantRecords);
                if (insertError) {
                    console.error('❌ Error inserting assistants:', insertError);
                    return { success: false, count: 0, error: insertError.message };
                }
            }
            console.log(`✅ Synced ${assistants.length} assistants`);
            return { success: true, count: assistants.length };
        }
        catch (error) {
            console.error('❌ Error syncing assistants:', error);
            return { success: false, count: 0, error: error.message };
        }
    }
    async syncPhoneNumbers() {
        try {
            console.log('🔄 Syncing VAPI phone numbers...');
            const phoneNumbers = await this.getPhoneNumbers();
            if (!Array.isArray(phoneNumbers)) {
                return { success: false, count: 0, error: 'Invalid response from VAPI' };
            }
            await supabase_client_1.default
                .from('phone_numbers')
                .delete()
                .eq('organization_id', this.config.organizationId)
                .eq('provider', 'vapi');
            if (phoneNumbers.length > 0) {
                const phoneRecords = phoneNumbers.map(phone => ({
                    organization_id: this.config.organizationId,
                    phone_number: phone.number,
                    friendly_name: phone.name || phone.number,
                    provider: 'vapi',
                    provider_id: phone.id,
                    capabilities: ['voice', 'outbound'],
                    is_active: phone.status === 'active',
                    metadata: phone,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }));
                const { error: insertError } = await supabase_client_1.default
                    .from('phone_numbers')
                    .insert(phoneRecords);
                if (insertError) {
                    console.error('❌ Error inserting phone numbers:', insertError);
                    return { success: false, count: 0, error: insertError.message };
                }
            }
            console.log(`✅ Synced ${phoneNumbers.length} phone numbers`);
            return { success: true, count: phoneNumbers.length };
        }
        catch (error) {
            console.error('❌ Error syncing phone numbers:', error);
            return { success: false, count: 0, error: error.message };
        }
    }
    async createAssistant(assistant) {
        try {
            const response = await this.client.post('/assistant', assistant);
            await supabase_client_1.default
                .from('vapi_assistants')
                .insert({
                organization_id: this.config.organizationId,
                vapi_assistant_id: response.data.id,
                name: assistant.name,
                type: 'outbound',
                config: assistant,
                voice_id: assistant.voice?.voiceId,
                first_message: assistant.firstMessage,
                system_prompt: assistant.model?.systemPrompt,
                is_active: true
            });
            return response.data;
        }
        catch (error) {
            console.error('Error creating VAPI assistant:', error);
            throw error;
        }
    }
    async updateAssistant(assistantId, updates) {
        try {
            const response = await this.client.patch(`/assistant/${assistantId}`, updates);
            await supabase_client_1.default
                .from('vapi_assistants')
                .update({
                config: updates,
                updated_at: new Date().toISOString()
            })
                .eq('vapi_assistant_id', assistantId)
                .eq('organization_id', this.config.organizationId);
            return response.data;
        }
        catch (error) {
            console.error('Error updating VAPI assistant:', error);
            throw error;
        }
    }
    async listAssistants() {
        try {
            console.log('🔍 Fetching VAPI assistants...');
            const response = await this.client.get('/assistant');
            if (!Array.isArray(response.data)) {
                console.warn('⚠️ VAPI returned non-array response for assistants');
                return [];
            }
            console.log(`✅ Retrieved ${response.data.length} assistants from VAPI`);
            return response.data;
        }
        catch (error) {
            console.error('❌ Error listing VAPI assistants:', error.message);
            if (error.response?.status === 401) {
                throw new Error('Invalid VAPI private key');
            }
            throw error;
        }
    }
    async deleteAssistant(assistantId) {
        try {
            await this.client.delete(`/assistant/${assistantId}`);
            await supabase_client_1.default
                .from('vapi_assistants')
                .update({ is_active: false })
                .eq('vapi_assistant_id', assistantId)
                .eq('organization_id', this.config.organizationId);
        }
        catch (error) {
            console.error('Error deleting VAPI assistant:', error);
            throw error;
        }
    }
    async createCall(call) {
        try {
            const response = await this.client.post('/call', call);
            await supabase_client_1.default
                .from('calls')
                .insert({
                organization_id: this.config.organizationId,
                vapi_call_id: response.data.id,
                to_number: call.phoneNumber || call.customer?.number,
                direction: 'outbound',
                status: 'queued',
                started_at: new Date().toISOString()
            });
            return response.data;
        }
        catch (error) {
            console.error('Error creating VAPI call:', error);
            throw error;
        }
    }
    async getCall(callId) {
        try {
            const response = await this.client.get(`/call/${callId}`);
            return response.data;
        }
        catch (error) {
            console.error('Error getting VAPI call:', error);
            throw error;
        }
    }
    async listCalls(filters) {
        try {
            const response = await this.client.get('/call', { params: filters });
            return response.data || [];
        }
        catch (error) {
            console.error('Error listing VAPI calls:', error);
            throw error;
        }
    }
    async getPhoneNumbers() {
        try {
            console.log('🔍 Fetching VAPI phone numbers...');
            const response = await this.client.get('/phone-number');
            if (!Array.isArray(response.data)) {
                console.warn('⚠️ VAPI returned non-array response for phone numbers');
                return [];
            }
            console.log(`✅ Retrieved ${response.data.length} phone numbers from VAPI`);
            return response.data;
        }
        catch (error) {
            console.error('❌ Error listing VAPI phone numbers:', error.message);
            if (error.response?.status === 401) {
                throw new Error('Invalid VAPI private key');
            }
            throw error;
        }
    }
    async createCampaign(campaign) {
        try {
            const response = await this.client.post('/campaign', campaign);
            await supabase_client_1.default
                .from('campaigns')
                .insert({
                organization_id: this.config.organizationId,
                name: campaign.name,
                type: 'outbound',
                status: 'active',
                assistant_id: campaign.assistantId,
                phone_number_id: campaign.phoneNumberId,
                settings: {
                    customers: campaign.customers,
                    schedule: campaign.schedulePlan
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error creating VAPI campaign:', error);
            throw error;
        }
    }
    async generateQualificationScript(campaignId, qualificationFields) {
        const requiredFields = qualificationFields.filter(f => f.is_required);
        const optionalFields = qualificationFields.filter(f => !f.is_required);
        let script = `You are a professional sales representative. Your goal is to qualify leads based on the following criteria:\n\n`;
        script += `REQUIRED INFORMATION TO GATHER:\n`;
        requiredFields.forEach(field => {
            script += `- ${field.field_name}: ${field.ai_detection_hints.join(', ')}\n`;
        });
        script += `\nOPTIONAL INFORMATION (if conversation allows):\n`;
        optionalFields.forEach(field => {
            script += `- ${field.field_name}: ${field.ai_detection_hints.join(', ')}\n`;
        });
        script += `\nIMPORTANT: Be conversational and natural. Don't interrogate the prospect. If they show disinterest or ask to end the call, politely thank them and end the conversation.`;
        return script;
    }
    async updateAssistantWithQualification(assistantId, qualificationScript) {
        return this.updateAssistant(assistantId, {
            model: {
                provider: 'openai',
                model: 'gpt-4',
                systemPrompt: qualificationScript
            }
        });
    }
    analyzeScriptCoverage(script, qualificationFields) {
        const missingFields = [];
        let coveredCount = 0;
        qualificationFields.forEach(field => {
            const keywords = field.ai_detection_hints;
            const isCovered = keywords.some(keyword => script.toLowerCase().includes(keyword.toLowerCase()));
            if (isCovered) {
                coveredCount++;
            }
            else if (field.is_required) {
                missingFields.push(field.field_name);
            }
        });
        return {
            coverage: (coveredCount / qualificationFields.length) * 100,
            missingFields
        };
    }
}
exports.VAPIIntegrationService = VAPIIntegrationService;
exports.default = VAPIIntegrationService;
