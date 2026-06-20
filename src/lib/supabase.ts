// ============================================================
// Supabase Client Configuration
// ============================================================
// Creates browser and server Supabase clients for auth and data.
// Production requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
// Static/local builds use inert placeholders so public pages do not crash while
// secrets are absent from the local shell.

import { createBrowserClient } from "@supabase/ssr";

const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseAnonKey = "placeholder-anon-key";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;

export const isSupabaseBrowserConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const isSupabaseAuthEnabled =
  isSupabaseBrowserConfigured && process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "false";
export const isSupabaseReportsEnabled =
  isSupabaseBrowserConfigured && process.env.NEXT_PUBLIC_ENABLE_SUPABASE_REPORTS !== "false";
export const isTexasElectionDbSubmissionsEnabled =
  isSupabaseBrowserConfigured && process.env.NEXT_PUBLIC_TEXAS_ELECTION_DB_SUBMISSIONS !== "false";

/**
 * Create a Supabase client for use in browser/client components.
 * This is safe to call multiple times -- it returns a singleton-like client.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
