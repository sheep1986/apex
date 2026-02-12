import { DispatchPayload, ProviderResponse, TelephonyProvider } from './types';

export class VapiProvider implements TelephonyProvider {
    private apiKey: string;
    private phoneNumberId: string;

    constructor() {
        // Enforce server-side only usage via env vars
        this.apiKey = process.env.VAPI_PRIVATE_API_KEY || '';
        this.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID || '';
    }

    async dispatch(payload: DispatchPayload): Promise<ProviderResponse> {
        if (!this.apiKey) {
            throw new Error('Vapi Configuration Missing: API Key');
        }

        const { to, customerName, assistantId, trinityCallId, campaignType, isShadowMode } = payload;
        
        // Shadow Mode handled at Manager level or here? Manager passes flag.
        // If passed here, we enforce it strictly.
        if (isShadowMode) {
            return { providerCallId: `shadow_vapi_${Date.now()}`, isMock: true };
        }

        const vapiPayload = {
            phoneNumberId: this.phoneNumberId,
            customer: {
                number: to,
                name: customerName,
            },
            assistantId: assistantId || process.env.VITE_VAPI_ASSISTANT_ID,
            assistantOverrides: {
                variableValues: {
                    name: customerName,
                },
                metadata: {
                    trinityCallId,
                    campaignType,
                },
            },
        };

        const response = await fetch('https://api.vapi.ai/call/phone', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vapiPayload),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Vapi Dispatch Failed: ${response.status} ${errText}`);
        }

        const data = await response.json();
        return { providerCallId: data.id, isMock: false };
    }
}
