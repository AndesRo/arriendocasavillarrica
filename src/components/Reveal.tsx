import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** "up" = fade + slide; "scale" = fade + escala muy leve (para fotografías). */
  variant?: 'up' | 'scale';
  /** Retraso en ms para escalonar elementos. */
  delay?: number;
  style?: CSSProperties;
}

/** Anima su contenido una sola vez cuando entra en pantalla. Respeta prefers-reduced-motion vía CSS. */
export default function Reveal({ children, className = '', variant = 'up', delay = 0, style }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('in');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in');
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${variant === 'scale' ? 'reveal-scale' : 'reveal'} ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}
    >
      {children}
    </div>
  );
}
