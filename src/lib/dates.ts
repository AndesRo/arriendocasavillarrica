/** Utilidades de fechas con cadenas ISO "YYYY-MM-DD" (evita problemas de zona horaria). */

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const WEEKDAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const WEEKDAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayISO = () => toISO(new Date());

export const makeISO = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

export const addDays = (iso: string, n: number) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

export const diffNights = (start: string, end: string) =>
  Math.round((parseISO(end).getTime() - parseISO(start).getTime()) / 86_400_000);

export const formatLong = (iso: string) => {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const monthLabel = (year: number, month: number) => `${MONTHS[month]} ${year}`;

export const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/** Día de la semana con lunes = 0. */
export const mondayIndex = (year: number, month: number, day: number) =>
  (new Date(year, month, day).getDay() + 6) % 7;

export const isValidISO = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(parseISO(iso).getTime());
