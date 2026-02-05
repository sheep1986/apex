/**
 * Error Sanitizer
 * Strips provider-specific details from error messages to ensure "Zero-Trace" compliance.
 */

export interface HelperError {
  message: string;
  code?: string;
}

export function sanitizeUserError(error: any): { message: string; code?: string } {
  const originalMessage = error?.message || 'Unknown error';
  const originalCode = error?.code;
  
  // Internal provider terms to scrub
  const SCRUB_TERMS = [
    'vapi', 'VAPI', 'Vapi', 
    'x-vapi', 'assistantId', 'phoneNumberId', 
    'org_', 'provider'
  ];

  let cleanMessage = originalMessage;

  // 1. Scrub terms
  SCRUB_TERMS.forEach(term => {
    const reg = new RegExp(term, 'gi');
    cleanMessage = cleanMessage.replace(reg, '');
  });

  // 2. Identify common provider errors and map to friendly messages
  if (originalMessage.includes('401') || originalMessage.includes('Unauthorized')) {
    return { message: 'Voice engine authorization failed. Please contact support.', code: 'VOICE_AUTH_ERROR' };
  }
  if (originalMessage.includes('402') || originalMessage.includes('Payment')) {
    return { message: 'Insufficient voice credits. Please top up to continue.', code: 'VOICE_CREDITS_ERROR' };
  }
  if (originalMessage.includes('404')) {
    return { message: 'Voice resource not found.', code: 'VOICE_NOT_FOUND' };
  }

  // 3. Fallback generic message if it still looks technical/messy
  if (cleanMessage.length < 5 || cleanMessage.includes('{') || cleanMessage.includes('HTTP')) {
    return { message: 'Voice engine temporarily unavailable.', code: 'VOICE_GENERIC_ERROR' };
  }

  return { message: cleanMessage, code: originalCode };
}
