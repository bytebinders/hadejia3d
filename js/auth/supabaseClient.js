// Supabase Client Wrapper for Hadejia 3D
// Project: lmubnkkhxturocaqimfz

export const SUPABASE_URL = 'https://lmubnkkhxturocaqimfz.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_OBcpbMdwbB3bi7_kwMg83A_NI2p8Tpf';

let supabaseClient = null;

/**
 * Get or initialize the Supabase client instance
 */
export async function getSupabase() {
  if (supabaseClient) return supabaseClient;

  // 1. Try global window.supabase loaded from CDN
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return supabaseClient;
  }

  // 2. Dynamic ESM fallback if script tag was deferred or cached
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return supabaseClient;
  } catch (err) {
    console.error('[Supabase] Failed to initialize Supabase client:', err);
    return null;
  }
}
