import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/client";

import type { Database } from "../db/database.types.ts";

// Console logi do sprawdzenia zmiennych z astro:env/client
console.log("=== Sprawdzenie zmiennych środowiskowych z astro:env/client ===");
console.log("SUPABASE_URL z astro:env/client jest dostępny:", !!SUPABASE_URL);
console.log("SUPABASE_KEY z astro:env/client jest dostępny:", !!SUPABASE_KEY);
console.log("SUPABASE_URL z astro:env/client wartość:", SUPABASE_URL);

// Oryginalna logika używająca import.meta.env
const supabaseUrl = import.meta.env.SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY || SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing SUPABASE_URL or SUPABASE_KEY environment variable. SUPABASE_URL(new): ${!!SUPABASE_URL}, SUPABASE_KEY(new): ${!!SUPABASE_KEY}, supabaseUrl(old): ${!!supabaseUrl}, supabaseAnonKey(old): ${!!supabaseAnonKey}. Url old one: ${supabaseUrl}, new one: ${SUPABASE_URL}`
  );
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export typed SupabaseClient for use across the application
export type SupabaseClient = SupabaseClientBase<Database>;
