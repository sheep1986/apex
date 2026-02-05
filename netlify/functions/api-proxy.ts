import type { Handler } from '@netlify/functions';

// Always use Railway API for the proxy since this runs on Netlify servers
const RAILWAY_API = 'https://apex-backend-august-production.up.railway.app';

export const handler: Handler = async (event) => {
  // Handle OPTIONS preflight requests immediately
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization,Content-Type,X-Requested-With',
      },
      body: '',
    };
  }

  // Remove the function path prefix to get the actual API path
  const path = event.path.replace('/.netlify/functions/api-proxy', '');
  const url = `${RAILWAY_API}${path}${event.rawQuery ? `?${event.rawQuery}` : ''}`;
  
  console.log(`Proxying ${event.httpMethod} request to: ${url}`);
  
  try {
    // Build headers - forward what we need
    const headers: Record<string, string> = {
      'Content-Type': event.headers['content-type'] || 'application/json',
    };
    
    // Forward authorization if present
    if (event.headers['authorization']) {
      headers['Authorization'] = event.headers['authorization'];
    }
    
    // Make the request to the backend
    const response = await fetch(url, {
      method: event.httpMethod,
      headers,
      body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : event.body,
    });
    
    // Get response body
    const responseBody = await response.text();
    
    // Return the proxied response
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow all origins since this is same-origin
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization,Content-Type,X-Requested-With',
      },
      body: responseBody,
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Backend unavailable',
        message: error instanceof Error ? error.message : 'Unknown error',
        backend: RAILWAY_API,
        details: 'Railway backend is currently down. Falling back to Supabase.'
      }),
    };
  }
};