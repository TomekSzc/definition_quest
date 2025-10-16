import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client.ts';

/**
 * Public endpoints that don't require authentication.
 * Add endpoint paths that should be accessible without login.
 */
const PUBLIC_ENDPOINTS = [
  '/api/auth/signIn.temporary',
  '/api/auth/login.temporary',
  // Add other public endpoints here
];

/**
 * Checks if the given URL path is a public endpoint.
 */
function isPublicEndpoint(pathname: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

/**
 * Global middleware that:
 * 1. Adds Supabase client to context.locals
 * 2. Checks authentication for protected API endpoints
 * 3. Adds authenticated user to context.locals
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Always add Supabase client to locals
  context.locals.supabase = supabaseClient;

  // Check if this is an API endpoint (not a page or asset)
  const isApiEndpoint = context.url.pathname.startsWith('/api/');
  
  // Skip authentication for public endpoints
  if (!isApiEndpoint || isPublicEndpoint(context.url.pathname)) {
    return next();
  }

  // For protected API endpoints, verify authentication
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Add authenticated user to locals for use in endpoints
  context.locals.user = user;

  return next();
});
