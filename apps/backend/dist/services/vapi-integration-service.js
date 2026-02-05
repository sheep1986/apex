"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VAPIIntegrationService = void 0;
const axios_1 = __importDefault(require("axios"));
const supabase_client_1 = __importDefault(require("./supabase-client"));
class VAPIIntegrationService {
    constructor(config) {
        this.baseURL = 'https://api.vapi.ai';
        this.apiKey = config.apiKey;
    }
    static async forOrganization(organizationId) {
        const { data: settings } = await supabase_client_1.default
            .from('organization_settings')
            .select('value')
            .eq('organization_id', organizationId)
            .eq('key', 'vapi_credentials')
            .single();
        let apiKey = null;
        if (settings?.value) {
            try {
                const vapiSettings = typeof settings.value === 'string' ? JSON.parse(settings.value) : settings.value;
                apiKey = vapiSettings.apiKey || vapiSettings.privateKey;
            }
            catch (error) {
                console.error('Error parsing VAPI settings:', error);
            }
        }
        if (!apiKey) {
            const { data: org } = await supabase_client_1.default
                .from('organizations')
                .select('vapi_api_key, vapi_private_key, settings, vapi_settings')
                .eq('id', organizationId)
                .single();
            if (org) {
                apiKey = org.vapi_private_key ||
                    org.vapi_api_key ||
                    org.settings?.vapi?.privateKey ||
                    org.settings?.vapi?.apiKey;
                if (!apiKey && org.vapi_settings) {
                    try {
                        const vapiSettings = typeof org.vapi_settings === 'string' ?
                            JSON.parse(org.vapi_settings) : org.vapi_settings;
                        apiKey = vapiSettings.apiKey || vapiSettings.privateKey;
                    }
                    catch (error) {
                        console.error('Error parsing organization vapi_settings:', error);
                    }
                }
            }
        }
        if (!apiKey) {
            console.log(`No VAPI API key found for organization ${organizationId}`);
            return null;
        }
        return new VAPIIntegrationService({
            apiKey,
            organizationId
        });
    }
    static async getOrganizationVAPIConfig(organizationId) {
        const { data: config } = await supabase_client_1.default
            .from('organization_settings')
            .select('*')
            .eq('organization_id', organizationId)
            .single();
        return config;
    }
    async createCall(callRequest) {
        const response = await axios_1.default.post(`${this.baseURL}/call`, callRequest, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }
    async getCall(callId) {
        const response = await axios_1.default.get(`${this.baseURL}/call/${callId}`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        return response.data;
    }
    async listCalls() {
        const response = await axios_1.default.get(`${this.baseURL}/call`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        return response.data;
    }
    async getPhoneNumbers() {
        const response = await axios_1.default.get(`${this.baseURL}/phone-number`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        return response.data;
    }
    async getAssistants() {
        const response = await axios_1.default.get(`${this.baseURL}/assistant`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });
        return response.data;
    }
    async syncPhoneNumbers() {
        try {
            const phoneNumbers = await this.getPhoneNumbers();
            console.log(`Syncing ${phoneNumbers.length} phone numbers from VAPI`);
            return { success: true, count: phoneNumbers.length };
        }
        catch (error) {
            console.error('Error syncing phone numbers:', error);
            return { success: false, error: error.message };
        }
    }
    async syncAssistants() {
        try {
            const assistants = await this.getAssistants();
            console.log(`Syncing ${assistants.length} assistants from VAPI`);
            return { success: true, count: assistants.length };
        }
        catch (error) {
            console.error('Error syncing assistants:', error);
            return { success: false, error: error.message };
        }
    }
    async testConnection() {
        try {
            await this.getAssistants();
            return { success: true };
        }
        catch (error) {
            console.error('VAPI connection test failed:', error);
            return { success: false, error: error.message };
        }
    }
}
exports.VAPIIntegrationService = VAPIIntegrationService;
