import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The Supabase client is created only when the env vars exist, so the app
 * runs fine for guests before the project is configured.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Raw project URL, also usable outside the client (e.g. auth pre-flight). */
export const supabaseUrl = url ?? "";

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null;

export const authConfigured = supabase !== null;
