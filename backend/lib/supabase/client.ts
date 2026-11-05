import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;
let cachedUrl: string | null = null;
let cachedKey: string | null = null;

/**
 * Service-role client. Null when SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
 * is missing, which is the local memory path. Never send this key to a browser.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  if (cached && cachedUrl === url && cachedKey === key) return cached;

  cachedUrl = url;
  cachedKey = key;
  cached = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}

export function storageMode(): 'memory' | 'supabase' {
  return getSupabaseAdmin() ? 'supabase' : 'memory';
}
