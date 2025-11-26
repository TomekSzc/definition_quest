import { defineMiddleware } from "astro:middleware";
import { createSupabaseClient } from "../db/supabase.client.ts";

/**
 * Public endpoints that don't require authentication.
 * Format: "METHOD /path" or "/path" (matches all methods)
 */
const PUBLIC_ENDPOINTS = [
  // Auth endpoints (all methods)
  "/api/auth/login",
  "/api/auth/signUp",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/refresh-token",
  // Public board endpoints (specific methods only)
  "GET /api/boards", // List boards - anonymous access
];

/**
 * Checks if the given URL path and method combination is a public endpoint.
 */
function isPublicEndpoint(pathname: string, method: string): boolean {
  return PUBLIC_ENDPOINTS.some((endpoint) => {
    // If endpoint has method prefix (e.g., "GET /api/boards")
    if (endpoint.includes(" ")) {
      const [endpointMethod, endpointPath] = endpoint.split(" ");
      return method === endpointMethod && pathname.startsWith(endpointPath);
    }
    // Otherwise just match the path for any method
    return pathname.startsWith(endpoint);
  });
}

/**
 * Global middleware that:
 * 1. Adds Supabase client to context.locals
 * 2. Checks authentication for API endpoints
 * 3. Adds authenticated user to context.locals (if present)
 * 4. Enforces authentication for protected endpoints
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with runtime environment variables
  // For Cloudflare: use context.locals.runtime.env (available in runtime)
  // For local dev: fallback to import.meta.env
  const env = context.locals.runtime?.env || {
    SUPABASE_URL: import.meta.env.SUPABASE_URL,
    SUPABASE_KEY: import.meta.env.SUPABASE_KEY,
  };

  // Extract access token from Authorization header if present
  const authHeader = context.request.headers.get("Authorization");
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

  // Always add Supabase client to locals with optional access token
  context.locals.supabase = createSupabaseClient(env, accessToken);

  // Check if this is an API endpoint (not a page or asset)
  const isApiEndpoint = context.url.pathname.startsWith("/api/");

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
  const isPublic = isPublicEndpoint(context.url.pathname, context.request.method);
  if (!isPublic && (!user || authError)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return next();
});
