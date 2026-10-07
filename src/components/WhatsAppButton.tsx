import { useEffect, useState } from 'react';
import { buildWhatsAppLink, isWhatsAppConfigured } from '../lib/whatsapp';
import { WhatsApp } from './Icons';

/** Botón flotante: pastilla con texto en móvil, círculo compacto en escritorio. */
export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > Math.min(420, window.innerHeight * 0.5));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // En producción solo se muestra si el número está configurado (nunca un número ficticio).
  if (!isWhatsAppConfigured && !import.meta.env.DEV) return null;

  return (
    <a
      href={buildWhatsAppLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hablar por WhatsApp"
      className={`on-dark fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex items-center gap-3 rounded-full bg-forest py-3 pl-4 pr-5 text-white shadow-[0_8px_30px_rgba(12,20,17,0.28)] transition duration-500 hover:bg-forest-dark md:right-8 md:p-4 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <WhatsApp size={28} className="shrink-0" />
      <span className="text-left leading-tight md:hidden">
        <span className="block text-[0.8125rem] text-white/80">¿Tienes alguna pregunta?</span>
        <span className="block text-[0.95rem] font-semibold">Hablar por WhatsApp</span>
      </span>
    </a>
  );
}
