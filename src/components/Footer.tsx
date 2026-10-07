import type { ReactNode } from 'react';
import { property } from '../data/property';
import { buildWhatsAppLink, isWhatsAppConfigured } from '../lib/whatsapp';
import { Instagram, WhatsApp } from './Icons';

const links = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#la-casa', label: 'La casa' },
  { href: '#galeria', label: 'Galería' },
  { href: '#disponibilidad', label: 'Disponibilidad' },
  { href: '#contacto', label: 'Contacto' },
];

export default function Footer() {
  const social = [
    property.instagram && { label: 'Instagram', href: property.instagram, icon: <Instagram size={22} /> },
    isWhatsAppConfigured && { label: 'WhatsApp', href: buildWhatsAppLink(), icon: <WhatsApp size={22} /> },
  ].filter(Boolean) as { label: string; href: string; icon: ReactNode }[];

  return (
    <footer className="on-dark bg-forest-dark text-white">
      <div className="mx-auto max-w-[90rem] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="font-serif text-4xl font-semibold tracking-[0.18em] sm:text-5xl">
              {property.name.toUpperCase()}
            </p>
            <p className="mt-4 max-w-sm font-serif text-2xl italic text-white/80">{property.tagline}</p>
          </div>

          <nav aria-label="Pie de página" className="md:col-span-3">
            <ul className="space-y-3">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-lg text-white/85 transition hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <p className="eyebrow text-sand">Redes</p>
            <ul className="mt-4 space-y-3">
              {/* Instagram y WhatsApp aparecen cuando configuras sus datos en property.ts */}
              {social.length === 0 && <li className="text-white/60">Próximamente</li>}
              {social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 text-lg text-white/85 transition hover:text-white"
                  >
                    {s.icon} {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-16 border-t border-white/15 pt-6 text-sm text-white/65">
          © {new Date().getFullYear()} {property.name}
        </p>
      </div>
    </footer>
  );
}
