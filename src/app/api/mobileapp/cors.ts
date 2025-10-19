/**
 * CORS Helper for Mobile App API Routes
 * 
 * This utility provides CORS headers for cross-origin requests,
 * particularly useful for local web development at localhost:8081
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Creates an OPTIONS response for CORS preflight requests
 */
export function handleCORSPreflight() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Adds CORS headers to a Response object
 * 
 * Usage:
 * import { addCORSHeaders } from '../cors';
 * return addCORSHeaders(NextResponse.json({ data }));
 */
export function addCORSHeaders(response: Response): Response {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

