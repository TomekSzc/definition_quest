import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";

import type { Database } from "../db/database.types.ts";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_KEY environment variable. " + "Check your .env file or hosting settings."
  );
}

export const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

// Export typed SupabaseClient for use across the application
export type SupabaseClient = SupabaseClientBase<Database>;
