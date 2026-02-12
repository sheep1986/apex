import { v4 as uuidv4 } from 'uuid';
import { DispatchPayload, ProviderResponse, TelephonyProvider } from './types';

export class MockProvider implements TelephonyProvider {
    async dispatch(payload: DispatchPayload): Promise<ProviderResponse> {
        console.log(`[MockProvider] Simulating Call to ${payload.to} (Campaign: ${payload.campaignType})`);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
            providerCallId: `mock_${Date.now()}_${uuidv4().substring(0, 6)}`,
            isMock: true
        };
    }
}
