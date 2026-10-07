import { demoRanges, type BookedRange } from './availability';
import { isSupabaseConfigured } from './config';
import { todayISO } from './dates';
import { getSupabase } from './supabase';

export interface AvailabilityResult {
  ranges: BookedRange[];
  /** true cuando los datos son de ejemplo (solo en desarrollo, sin Supabase). */
  isDemo: boolean;
}

/**
 * Lee las fechas ocupadas.
 *
 * Se consulta la VISTA pública `disponibilidad_publica` (solo fechas y estado),
 * nunca la tabla `reservas`, para no exponer nombre/teléfono/email de clientes.
 * Ver supabase/schema.sql.
 */
export async function fetchBookedRanges(): Promise<AvailabilityResult> {
  if (!isSupabaseConfigured) {
    // Sin credenciales: en desarrollo mostramos fechas de ejemplo; en producción, todo libre.
    return import.meta.env.DEV
      ? { ranges: demoRanges(), isDemo: true }
      : { ranges: [], isDemo: false };
  }

  const supabase = await getSupabase();
  if (!supabase) return { ranges: [], isDemo: false };

  const { data, error } = await supabase
    .from('disponibilidad_publica')
    .select('fecha_inicio, fecha_fin, estado')
    .gte('fecha_fin', todayISO())
    .order('fecha_inicio', { ascending: true });

  if (error) throw new Error(error.message);
  return { ranges: (data ?? []) as BookedRange[], isDemo: false };
}
