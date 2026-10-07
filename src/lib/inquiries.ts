import { isSupabaseConfigured } from './config';
import { getSupabase } from './supabase';

export interface InquiryPayload {
  nombre: string;
  email: string;
  telefono: string;
  fecha_llegada: string;
  fecha_salida: string;
  huespedes: number;
  mensaje: string;
  acepta_contacto: boolean;
}

export type InquiryResult = { ok: true } | { ok: false; reason: 'not-configured' | 'failed' };

/**
 * Guarda la consulta en la tabla `consultas` de Supabase (solo INSERT para el rol anónimo).
 * No crea reservas ni cobros: la persona de contacto responde manualmente.
 */
export async function submitInquiry(payload: InquiryPayload): Promise<InquiryResult> {
  if (!isSupabaseConfigured) {
    if (import.meta.env.DEV) {
      // Solo en desarrollo: permite probar la pantalla de éxito sin backend.
      console.info('[dev] Consulta simulada (Supabase no configurado):', payload);
      await new Promise((r) => setTimeout(r, 700));
      return { ok: true };
    }
    return { ok: false, reason: 'not-configured' };
  }

  try {
    const supabase = await getSupabase();
    if (!supabase) return { ok: false, reason: 'not-configured' };
    const { error } = await supabase.from('consultas').insert(payload);
    if (error) {
      console.error('No se pudo guardar la consulta', error);
      return { ok: false, reason: 'failed' };
    }
    return { ok: true };
  } catch (err) {
    console.error('No se pudo guardar la consulta', err);
    return { ok: false, reason: 'failed' };
  }
}
