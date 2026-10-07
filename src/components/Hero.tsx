import { useEffect, useRef } from 'react';
import { property } from '../data/property';
import { ArrowDown } from './Icons';
import SmartImage from './SmartImage';

export default function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);

  // Parallax muy sutil (desactivado con prefers-reduced-motion).
  useEffect(() => {
    const el = bgRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) el.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const { copy } = property;

  return (
    <section
      id="inicio"
      className="on-dark relative flex min-h-[100svh] items-end overflow-hidden bg-forest-dark text-white"
      aria-label="Presentación"
    >
      {/* Fotografía principal */}
      <div ref={bgRef} className="absolute -bottom-[8%] -top-[8%] inset-x-0 will-change-transform">
        <SmartImage
          src={property.images.hero}
          alt={`Vista de ${property.name}, casa de vacaciones en Villarrica`}
          className="h-full w-full object-cover"
          priority
          placeholderLabel="Agregar fotografía principal"
          placeholderTone="dark"
        />
      </div>

      {/* Overlay sutil para legibilidad: la foto sigue siendo la protagonista */}
      <div className="pointer-events-none absolute inset-0 bg-[#0c1411]/25" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#0c1411]/60 to-transparent" />

      <div className="relative mx-auto w-full max-w-[90rem] px-5 pb-14 pt-36 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
        <p className="eyebrow animate-hero-in text-white/90" style={{ animationDelay: '150ms' }}>
          {copy.heroEyebrow}
        </p>

        <h1
          className="animate-hero-in mt-5 font-serif text-[clamp(3.4rem,12.5vw,10rem)] font-medium leading-[0.92] tracking-[-0.02em]"
          style={{ animationDelay: '300ms' }}
        >
          <span className="block">{copy.heroTitleLine1}</span>
          <span className="block italic">{copy.heroTitleLine2}</span>
        </h1>

        <p
          className="animate-hero-in mt-6 max-w-xl text-lg leading-relaxed text-white/90 sm:text-xl"
          style={{ animationDelay: '480ms' }}
        >
          {copy.heroSubtitle}
        </p>

        <div
          className="animate-hero-in mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4"
          style={{ animationDelay: '620ms' }}
        >
          <a
            href="#disponibilidad"
            className="btn bg-white text-ink hover:bg-sand"
          >
            Ver disponibilidad
          </a>
          <a
            href="#la-casa"
            className="btn border border-white/80 text-white hover:bg-white hover:text-ink"
          >
            Conocer la casa
          </a>
        </div>

        <a
          href="#la-casa"
          className="animate-hero-in mt-10 inline-flex items-center gap-2 text-sm font-medium tracking-wide text-white/85 transition hover:text-white"
          style={{ animationDelay: '800ms' }}
        >
          <ArrowDown size={18} className="animate-nudge" />
          Descubre la casa
        </a>
      </div>
    </section>
  );
}
