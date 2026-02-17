/**
 * Shared CORS configuration for Netlify Functions.
 *
 * Uses the SITE_URL environment variable (auto-set by Netlify) to restrict
 * Access-Control-Allow-Origin to the deployed domain. Falls back to '*' in
 * development for convenience.
 *
 * Usage in any function:
 *   import { corsHeaders, handleCors } from './utils/cors';
 *   // Early return for preflight:
 *   if (event.httpMethod === 'OPTIONS') return handleCors();
 *   // Use corsHeaders in every response:
 *   return { statusCode: 200, headers: corsHeaders(), body: '...' };
 */

/**
 * Returns CORS headers, restricting origin to the deployed site in production.
 */
export function corsHeaders(): Record<string, string> {
  const siteUrl = process.env.URL || process.env.SITE_URL || '';
  // In production, restrict to the actual site domain
  // In dev/preview, allow all origins for convenience
  const allowedOrigin = siteUrl && !siteUrl.includes('localhost') ? siteUrl : '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Internal-Secret',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  };
}

/**
 * Returns a pre-built OPTIONS preflight response.
 */
export function handleCors(): { statusCode: number; headers: Record<string, string>; body: string } {
  return { statusCode: 204, headers: corsHeaders(), body: '' };
}
