import { useEffect, useRef, type CSSProperties } from 'react';
import { property } from '../data/property';
import HeroWater from './HeroWater';
import { ArrowDown } from './Icons';
import SmartImage from './SmartImage';

export default function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);
  const { copy, images } = property;

  // Parallax muy sutil, solo en pantallas anchas. Desactivado con prefers-reduced-motion.
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    const mq = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) el.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const apply = () => {
      window.removeEventListener('scroll', onScroll);
      el.style.transform = '';
      if (mq.matches) window.addEventListener('scroll', onScroll, { passive: true });
    };
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="inicio"
      className="on-dark relative flex min-h-[100svh] items-end overflow-hidden bg-forest-dark text-white"
      aria-label="Presentación"
      style={{ '--hero-img-h': `${images.heroMobileImageHeight}svh` } as CSSProperties}
    >
      {/* Fotografía principal.
          Móvil: ocupa `heroMobileImageHeight` % de la pantalla (menos alto = foto menos ampliada) y se funde
          con el verde oscuro de abajo. Escritorio: a pantalla completa (+8% arriba/abajo para el parallax). */}
      <div
        ref={bgRef}
        className="absolute inset-x-0 top-0 h-[var(--hero-img-h)] will-change-transform md:-bottom-[8%] md:-top-[8%] md:h-auto"
      >
        <SmartImage
          src={images.hero}
          alt={`Vista de ${property.name}, casa de vacaciones en Villarrica`}
          className="h-full w-full object-cover"
          style={{ objectPosition: images.heroPosition }}
          priority
          placeholderLabel="Agregar fotografía principal"
          placeholderTone="dark"
        />
        {images.heroWater.enabled && (
          <HeroWater src={images.hero} position={images.heroPosition} water={images.heroWater} />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-forest-dark to-transparent md:hidden" />
      </div>

      {/* Overlay sutil para legibilidad: la foto sigue siendo la protagonista */}
      <div className="pointer-events-none absolute inset-0 bg-[#0c1411]/30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#0c1411]/75 to-transparent" />

      <div className="relative mx-auto w-full max-w-[90rem] px-5 pb-14 pt-36 sm:px-8 sm:pb-16 sm:pt-32 lg:px-12 lg:pb-20">
        <p className="eyebrow animate-hero-in text-white [text-shadow:0_2px_28px_rgba(8,14,11,0.55),0_1px_3px_rgba(8,14,11,0.35)]" style={{ animationDelay: '150ms' }}>
          {copy.heroEyebrow}
        </p>

        <h1
          className="animate-hero-in mt-5 font-serif sm:mt-6 text-[clamp(3.4rem,12.5vw,4rem)] font-semibold leading-[0.92] tracking-[-0.02em] sm:text-[clamp(3rem,7.6vw,5.75rem)] sm:leading-[1] sm:tracking-[-0.015em] [text-shadow:0_2px_28px_rgba(8,14,11,0.55),0_1px_3px_rgba(8,14,11,0.35)]"
          style={{ animationDelay: '300ms' }}
        >
          <span className="block">{copy.heroTitleLine1}</span>
          <span className="block italic">{copy.heroTitleLine2}</span>
        </h1>

        <p
          className="animate-hero-in mt-6 max-w-xl text-lg font-medium leading-relaxed text-white sm:max-w-2xl [text-shadow:0_2px_28px_rgba(8,14,11,0.55),0_1px_3px_rgba(8,14,11,0.35)]"
          style={{ animationDelay: '480ms' }}
        >
          {copy.heroSubtitle}
        </p>

        <div
          className="animate-hero-in mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4"
          style={{ animationDelay: '620ms' }}
        >
          <a href="#disponibilidad" className="btn bg-white text-ink hover:bg-sand">
            Ver disponibilidad
          </a>
          <a href="#la-casa" className="btn border border-white/80 text-white hover:bg-white hover:text-ink">
            Conocer la casa
          </a>
        </div>

        <a
          href="#la-casa"
          className="animate-hero-in mt-10 inline-flex items-center gap-2 text-sm sm:mt-8 font-medium tracking-wide text-white/85 transition hover:text-white"
          style={{ animationDelay: '800ms' }}
        >
          <ArrowDown size={18} className="animate-nudge" />
          Descubre la casa
        </a>
      </div>
    </section>
  );
}