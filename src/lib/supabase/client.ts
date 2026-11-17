import { createBrowserClient } from '@supabase/ssr';

export const DEFAULT_SUPABASE_URL = 'https://dsyirenalclknmxqzfua.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_L8bvcMpRmtlAdByA9ipWqw_Zxa1-wYR';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('placeholder-project') &&
    !url.includes('your-project') &&
    key !== 'placeholder-anon-key'
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return createBrowserClient<any>(url, key);
}
