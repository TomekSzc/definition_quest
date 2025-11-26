import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

/**
 * Factory function to create Supabase client with provided environment variables.
 * Used in Cloudflare runtime where import.meta.env might not be available in global scope.
 *
 * @param env - Environment variables object (from context.locals.runtime.env or import.meta.env)
 * @param accessToken - Optional access token from Authorization header (for SSR auth)
 * @returns Configured Supabase client
 */
export function createSupabaseClient(
  env: {
    SUPABASE_URL?: string;
    SUPABASE_KEY?: string;
  },
  accessToken?: string
): SupabaseClientBase<Database> {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_KEY environment variable. " + "Check your .env file or hosting settings."
    );
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Disable auto-persistence in SSR
      autoRefreshToken: false, // Don't auto-refresh in SSR
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });

  return client;
}

/**
 * Client-side Supabase client for React components.
 * Uses import.meta.env which is available in browser context.
 * NOTE: This should only be used in client-side React components, not in API endpoints.
 */
export const supabaseClient = createClient<Database>(
  import.meta.env.SUPABASE_URL || "",
  import.meta.env.SUPABASE_KEY || "",
  {
    auth: {
      persistSession: true, // Enable persistence in browser
      autoRefreshToken: true, // Auto-refresh in browser
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  }
);

// Export typed SupabaseClient for use across the application
export type SupabaseClient = SupabaseClientBase<Database>;
