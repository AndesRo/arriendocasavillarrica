import { property } from '../data/property';

/** Deja solo los dígitos del número (wa.me no admite +, espacios ni guiones). */
export const cleanPhone = (raw: string) => raw.replace(/\D/g, '');

export const isWhatsAppConfigured = cleanPhone(property.whatsapp).length >= 8;

export function buildWhatsAppLink(message: string = property.whatsappMessage): string {
  const phone = cleanPhone(property.whatsapp);
  const text = encodeURIComponent(message);
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}
