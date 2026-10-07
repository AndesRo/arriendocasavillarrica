import { addDays, diffNights, todayISO } from './dates';

export type BookingStatus = 'reservado' | 'bloqueado';

/**
 * Convención: `fecha_inicio` = día de llegada, `fecha_fin` = día de salida.
 * Las NOCHES ocupadas son [fecha_inicio, fecha_fin): el día de salida queda libre
 * para que otra persona pueda llegar ese mismo día.
 */
export interface BookedRange {
  fecha_inicio: string;
  fecha_fin: string;
  estado: BookingStatus;
}

const MAX_RANGE_DAYS = 800; // protección ante datos mal cargados

/** Convierte los rangos en un set de noches ocupadas (reservado o bloqueado). */
export function buildBookedNights(ranges: BookedRange[]): Set<string> {
  const nights = new Set<string>();
  for (const r of ranges) {
    if (r.estado !== 'reservado' && r.estado !== 'bloqueado') continue;
    const total = Math.min(diffNights(r.fecha_inicio, r.fecha_fin), MAX_RANGE_DAYS);
    for (let i = 0; i < total; i++) nights.add(addDays(r.fecha_inicio, i));
  }
  return nights;
}

/** ¿Todas las noches entre `start` (incluida) y `end` (excluida) están libres? */
export function rangeIsFree(booked: Set<string>, start: string, end: string): boolean {
  const total = diffNights(start, end);
  if (total < 1) return false;
  for (let i = 0; i < total; i++) {
    if (booked.has(addDays(start, i))) return false;
  }
  return true;
}

/** Fechas de ejemplo SOLO para desarrollo (sin Supabase), relativas a hoy. */
export function demoRanges(): BookedRange[] {
  const t = todayISO();
  return [
    { fecha_inicio: addDays(t, 9), fecha_fin: addDays(t, 14), estado: 'reservado' },
    { fecha_inicio: addDays(t, 24), fecha_fin: addDays(t, 27), estado: 'bloqueado' },
    { fecha_inicio: addDays(t, 41), fecha_fin: addDays(t, 48), estado: 'reservado' },
  ];
}
