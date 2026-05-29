import { createClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client using the public anon key.
 * Safe to ship in the bundle — Row-Level Security on the DB
 * is what actually protects rows.
 *
 * Returns null when env vars aren't set, so the app keeps rendering
 * during local dev / before Supabase is wired up.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function hasSupabase() {
  return Boolean(supabase);
}
