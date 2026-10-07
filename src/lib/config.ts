/**
 * Configuración de servicios externos (variables de entorno públicas).
 * Nunca coloques claves privadas aquí: todo lo que empieza con VITE_ llega al navegador.
 */
const env = import.meta.env;

export const SUPABASE_URL = env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY ?? '';
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Máximo de meses hacia el futuro que se pueden consultar en el calendario. */
export const CALENDAR_MONTHS_AHEAD = 18;

/** Cada cuánto se refresca el clima (ms). */
export const WEATHER_REFRESH_MS = 10 * 60 * 1000;
