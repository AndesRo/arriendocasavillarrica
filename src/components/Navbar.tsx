import { useEffect, useState } from 'react';
import { property } from '../data/property';
import { Close, Menu } from './Icons';

const links = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#la-casa', label: 'La casa' },
  { href: '#galeria', label: 'Galería' },
  { href: '#disponibilidad', label: 'Disponibilidad' },
  { href: '#villarrica', label: 'Clima' },
  { href: '#contacto', label: 'Contacto' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bloquea el scroll del fondo y permite cerrar con Escape mientras el menú móvil está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${solid
          ? 'border-b border-ink/5 bg-cream/85 text-ink backdrop-blur-md'
          : 'on-dark bg-transparent text-white'
          }`}
      >
        <nav
          aria-label="Principal"
          className="mx-auto flex h-[4.25rem] max-w-[90rem] items-center justify-between px-5 sm:px-8 lg:h-20 lg:px-12"
        >
          <a
            href="#inicio"
            onClick={() => setOpen(false)}
            className="font-serif text-[1.35rem] font-semibold tracking-[0.2em] sm:text-2xl"
          >
            {property.name.toUpperCase()}
          </a>

          <ul className="hidden items-center gap-9 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-[0.9rem] font-medium tracking-wide opacity-90 transition hover:opacity-100"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#disponibilidad"
                className={`inline-flex min-h-[2.75rem] items-center rounded-full px-6 text-[0.75rem] font-semibold uppercase tracking-[0.16em] transition duration-300 ${solid
                  ? 'bg-forest text-white hover:bg-forest-dark'
                  : 'border border-white/70 text-white hover:bg-white hover:text-ink'
                  }`}
              >
                Consultar disponibilidad
              </a>
            </li>
          </ul>

          <button
            type="button"
            className="-mr-2 inline-flex h-12 w-12 items-center justify-center rounded-full lg:hidden"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <Close size={28} /> : <Menu size={28} />}
          </button>
        </nav>
      </header>

      {/* Menú móvil a pantalla completa */}
      <div
        id="menu-movil"
        className={`fixed inset-0 z-40 flex-col justify-center bg-cream px-8 pt-20 lg:hidden ${open ? 'flex' : 'hidden'
          }`}
      >
        <ul className="space-y-1">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2.5 font-serif text-[2.6rem] leading-tight text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#disponibilidad"
          onClick={() => setOpen(false)}
          className="btn btn-forest mt-10 w-full"
        >
          Consultar disponibilidad
        </a>
      </div>
    </>
  );
}
