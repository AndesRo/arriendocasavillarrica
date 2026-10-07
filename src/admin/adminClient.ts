import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '../lib/config';

/**
 * Cliente de Supabase SOLO para el panel /admin: aquí la sesión sí se guarda en el navegador.
 * Usa la misma clave pública (anon); lo que puede ver o hacer lo decide la base de datos (RLS).
 */
export const adminSupabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'casa-villarrica-admin' },
    })
  : null;
