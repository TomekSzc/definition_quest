import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

// Server-side client using import.meta.env (works with astro:env context: "client" for public vars)
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_KEY environment variable. " + "Check your .env file or hosting settings."
  );
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export typed SupabaseClient for use across the application
export type SupabaseClient = SupabaseClientBase<Database>;
