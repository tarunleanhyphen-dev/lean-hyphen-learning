import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import 'dotenv/config';

// supabase-js loads its Realtime client at module init. Node < 22 has no
// built-in WebSocket, so polyfill it before any createClient call.
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = WebSocket;
}

let admin = null;

/**
 * Server-side Supabase client using the SERVICE ROLE key.
 * Bypasses Row-Level Security — never expose this client to the browser.
 * Returns null when env vars are missing so the API stays bootable without Supabase.
 */
export function getSupabaseAdmin() {
  if (admin) return admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

export function hasSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
