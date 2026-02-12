export interface ProviderConfig {
    apiKey?: string;
    phoneNumberId?: string;
    // ... generic config map
}

export interface DispatchPayload {
    to: string;
    trinityCallId: string;
    campaignType: string;
    customerName?: string;
    assistantId?: string;
    scriptConfig?: any;
    isShadowMode?: boolean;
}

export interface ProviderResponse {
    providerCallId: string; // The ID returned by the provider
    isMock?: boolean;
}

export interface TelephonyProvider {
    dispatch(payload: DispatchPayload): Promise<ProviderResponse>;
}
