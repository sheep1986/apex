import { VoiceEngine } from './types';
import { VapiVoiceProvider } from './vapi.provider';

// Factory to get the configured engine
// In a real server environment, this would pull from process.env
// For frontend/edge usage, this should ONLY be called from secure contexts (Netlify Functions)
export function getVoiceEngine(apiKey: string): VoiceEngine {
  return new VapiVoiceProvider(apiKey);
}

export * from './types';
