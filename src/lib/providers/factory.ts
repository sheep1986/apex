import { MockProvider } from './mock';
import { TelephonyProvider } from './types';
import { VapiProvider } from './vapi';

export class ProviderFactory {
    static getProvider(type: string): TelephonyProvider {
        switch (type) {
            case 'vapi':
                return new VapiProvider();
            case 'mock':
            case 'shadow':
                return new MockProvider();
            default:
                // Default to Vapi for legacy compat, or error?
                // For now default Vapi
                console.warn(`Unknown provider type '${type}', defaulting to Vapi.`);
                return new VapiProvider();
        }
    }
}
