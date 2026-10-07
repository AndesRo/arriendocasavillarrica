import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './config';

let clientPromise: Promise<SupabaseClient | null> | null = null;

/**
 * Devuelve el cliente de Supabase (o null si no hay credenciales).
 * Se carga bajo demanda para no sumar peso al bundle inicial.
 */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    );
  }
  return clientPromise;
}
