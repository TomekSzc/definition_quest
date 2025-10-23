import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client.ts';

/**
 * Public endpoints that don't require authentication.
 * Add endpoint paths that should be accessible without login.
 */
const PUBLIC_ENDPOINTS = [
  // Legacy temporary endpoints (to be removed)
  '/api/auth/signIn.temporary',
  '/api/auth/login.temporary',
  // New auth endpoints
  '/api/auth/login',
  '/api/auth/signUp',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh-token',
  // Public board endpoints
  '/api/boards'
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
 * 2. Checks authentication for API endpoints
 * 3. Adds authenticated user to context.locals (if present)
 * 4. Enforces authentication for protected endpoints
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Always add Supabase client to locals
  context.locals.supabase = supabaseClient;

  // Check if this is an API endpoint (not a page or asset)
  const isApiEndpoint = context.url.pathname.startsWith('/api/');
  
  // For non-API requests, just continue
  if (!isApiEndpoint) {
    return next();
  }

  // Try to get authenticated user (don't fail if not present)
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

  // Add user to locals if authentication succeeded
  if (!authError && user) {
    context.locals.user = user;
  }

  // For protected endpoints, require authentication
  const isPublic = isPublicEndpoint(context.url.pathname);
  if (!isPublic && (!user || authError)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return next();
});
