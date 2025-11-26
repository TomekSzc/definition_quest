import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_KEY environment variable. " + "Check your .env file or hosting settings."
  );
}

let cachedClient: SupabaseClientBase<Database> | null = null;

export function getSupabaseClient() {
  if (!cachedClient) {
    cachedClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return cachedClient;
}

export type SupabaseClient = SupabaseClientBase<Database>;
