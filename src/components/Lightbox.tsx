import { useCallback, useEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import type { GalleryItem } from '../data/gallery';
import { ChevronLeft, ChevronRight, Close } from './Icons';
import Placeholder from './Placeholder';

interface LightboxProps {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

/** Visor a pantalla completa: flechas, teclado, swipe en móvil y zoom por clic/tap. */
export default function Lightbox({ items, index, onClose, onIndexChange }: LightboxProps) {
  const item = items[index];
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (dir: 1 | -1) => onIndexChange((index + dir + items.length) % items.length),
    [index, items.length, onIndexChange],
  );

  // Reinicia estado al cambiar de foto.
  useEffect(() => {
    setFailed(false);
    setZoom(null);
  }, [index]);

  // Foco, scroll lock, teclado y trampa de foco.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [go, onClose]);

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || zoom) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
  };

  const toggleZoom = (e: MouseEvent<HTMLElement>) => {
    if (failed) return;
    if (zoom) return setZoom(null);
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const iconBtn =
    'on-dark inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25';

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Galería de fotografías, imagen ${index + 1} de ${items.length}`}
      className="on-dark fixed inset-0 z-[60] flex flex-col bg-[#0c1411]/95 text-white"
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <p className="text-sm tracking-wide text-white/80" aria-live="polite">
          {item.category} · {index + 1} / {items.length}
        </p>
        <button ref={closeRef} type="button" onClick={onClose} className={iconBtn} aria-label="Cerrar galería">
          <Close size={26} />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <button
          type="button"
          onClick={() => go(-1)}
          className={`${iconBtn} absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 sm:inline-flex sm:left-4`}
          aria-label="Foto anterior"
        >
          <ChevronLeft size={28} />
        </button>

        {failed ? (
          <div className="aspect-[4/3] w-full max-w-4xl overflow-hidden rounded-2xl">
            <Placeholder path={item.src} tone="dark" />
          </div>
        ) : (
          <div
            className="max-h-full max-w-full overflow-hidden rounded-xl"
            style={{ cursor: zoom ? 'zoom-out' : 'zoom-in' }}
            onClick={toggleZoom}
          >
            <img
              key={item.src}
              src={item.src}
              srcSet={item.srcSet}
              alt={item.alt}
              onError={() => setFailed(true)}
              draggable={false}
              className="max-h-[calc(100svh-9.5rem)] max-w-full select-none object-contain transition-transform duration-300"
              style={{
                transform: zoom ? 'scale(2)' : 'none',
                transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : 'center',
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => go(1)}
          className={`${iconBtn} absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 sm:inline-flex sm:right-4`}
          aria-label="Foto siguiente"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <p className="max-w-[70%] text-sm text-white/80 sm:text-base">{item.alt}</p>
        {/* En móvil se navega con swipe; estos botones sirven de apoyo */}
        <div className="flex gap-2 sm:hidden">
          <button type="button" onClick={() => go(-1)} className={iconBtn} aria-label="Foto anterior">
            <ChevronLeft size={26} />
          </button>
          <button type="button" onClick={() => go(1)} className={iconBtn} aria-label="Foto siguiente">
            <ChevronRight size={26} />
          </button>
        </div>
      </div>
    </div>
  );
}
