import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The Supabase client is created only when the env vars exist, so the app
 * runs fine for guests before the project is configured.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const authConfigured = supabase !== null;
