import type { Handler } from '@netlify/functions';

const RAILWAY_API = 'https://apex-backend-august-production.up.railway.app';
const LOCAL_API = 'http://localhost:3001';

// Use Railway in production, local in development
const API_BASE = process.env.NODE_ENV === 'production' ? RAILWAY_API : LOCAL_API;

export const handler: Handler = async (event) => {
  // Remove the function path prefix to get the actual API path
  const path = event.path.replace('/.netlify/functions/api-proxy', '');
  const url = `${API_BASE}${path}${event.rawQuery ? `?${event.rawQuery}` : ''}`;
  
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
        backend: API_BASE
      }),
    };
  }
};