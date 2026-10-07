/** Para wa.me: solo dígitos y con código de país. Un móvil chileno de 9 dígitos (9XXXXXXXX) recibe el 56. */
export function waDigits(raw: string): string {
  const d = raw.replace(/\D/g, '');
  return d.length === 9 && d.startsWith('9') ? `56${d}` : d;
}

export const waLink = (phone: string, text: string) =>
  `https://wa.me/${waDigits(phone)}?text=${encodeURIComponent(text)}`;

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
