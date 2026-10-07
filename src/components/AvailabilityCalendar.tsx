import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildBookedNights, rangeIsFree } from '../lib/availability';
import { CALENDAR_MONTHS_AHEAD } from '../lib/config';
import {
  WEEKDAYS_LONG,
  WEEKDAYS_SHORT,
  daysInMonth,
  diffNights,
  formatLong,
  makeISO,
  monthLabel,
  mondayIndex,
  todayISO,
} from '../lib/dates';
import { fetchBookedRanges } from '../lib/reservations';
import type { BookedRange } from '../lib/availability';
import { ChevronLeft, ChevronRight } from './Icons';
import Reveal from './Reveal';

interface Props {
  onConsult: (start: string, end: string) => void;
}

type Load = 'loading' | 'ready' | 'error';

export default function AvailabilityCalendar({ onConsult }: Props) {
  const today = todayISO();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [ranges, setRanges] = useState<BookedRange[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [load, setLoad] = useState<Load>('loading');
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchBookedRanges()
      .then((res) => {
        if (cancelled) return;
        setRanges(res.ranges);
        setIsDemo(res.isDemo);
        setLoad('ready');
      })
      .catch((err) => {
        console.error('No se pudo cargar la disponibilidad', err);
        if (!cancelled) setLoad('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const booked = useMemo(() => buildBookedNights(ranges), [ranges]);

  const monthIndex = (y: number, m: number) => y * 12 + m;
  const minIndex = monthIndex(now.getFullYear(), now.getMonth());
  const curIndex = monthIndex(cursor.year, cursor.month);
  const canPrev = curIndex > minIndex;
  const canNext = curIndex < minIndex + CALENDAR_MONTHS_AHEAD;

  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const nextMonth = new Date(cursor.year, cursor.month + 1, 1);
  const showSecond = curIndex + 1 <= minIndex + CALENDAR_MONTHS_AHEAD;

  /** ¿Se puede pulsar este día en el estado actual? */
  const isActionable = useCallback(
    (iso: string) => {
      if (iso < today) return false;
      // Elegir salida: vale incluso un día "reservado" si todas las noches previas están libres.
      if (start && !end && iso > start && rangeIsFree(booked, start, iso)) return true;
      // Si no, el día solo sirve como nueva llegada cuando esa noche está libre.
      return !booked.has(iso);
    },
    [booked, start, end, today],
  );

  const handlePick = (iso: string) => {
    setNotice('');
    if (start && !end && iso > start && rangeIsFree(booked, start, iso)) {
      setEnd(iso);
      return;
    }
    if (booked.has(iso)) {
      setNotice('Esa fecha no está disponible como llegada.');
      return;
    }
    setStart(iso);
    setEnd(null);
  };

  const clear = () => {
    setStart(null);
    setEnd(null);
    setHover(null);
    setNotice('');
  };

  const nights = start && end ? diffNights(start, end) : 0;

  const renderMonth = (year: number, month: number) => {
    const total = daysInMonth(year, month);
    const offset = mondayIndex(year, month, 1);
    const cells: (string | null)[] = [
      ...Array<null>(offset).fill(null),
      ...Array.from({ length: total }, (_, i) => makeISO(year, month, i + 1)),
    ];

    return (
      <div role="group" aria-label={monthLabel(year, month)}>
        <h3 className="mb-5 text-center font-serif text-3xl capitalize text-ink">{monthLabel(year, month)}</h3>
        <div className="grid grid-cols-7 gap-y-1.5">
          {WEEKDAYS_SHORT.map((w, i) => (
            <div
              key={i}
              className="pb-2 text-center text-[0.8125rem] font-semibold uppercase tracking-widest text-ink/60"
              aria-hidden="true"
            >
              {w}
            </div>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <div key={`e${i}`} />;
            const day = Number(iso.slice(8));
            const past = iso < today;
            const isBooked = booked.has(iso);
            const isStart = iso === start;
            const isEnd = iso === end;
            const previewEnd = end ?? (start && hover && hover > start ? hover : null);
            const inRange = Boolean(start && previewEnd && iso > start && iso < previewEnd);
            const actionable = isActionable(iso);

            let status = 'disponible';
            if (past) status = 'fecha pasada, no disponible';
            else if (isBooked) status = 'reservado';
            if (isStart) status = 'llegada seleccionada';
            if (isEnd) status = 'salida seleccionada';
            if (!isStart && !isEnd && inRange) status = 'dentro del rango seleccionado';
            if (!past && isBooked && actionable && !isStart) status = 'reservado, disponible como día de salida';

            let cls = 'text-ink/30'; // pasada
            if (!past) {
              if (isStart || isEnd) cls = 'bg-forest text-white font-semibold';
              else if (inRange) cls = 'bg-forest/20 text-ink rounded-none';
              else if (isBooked) cls = 'hatch bg-[#EBDDD8] text-[#7A4A42] line-through';
              else cls = 'bg-[#E1EBDB] text-forest-dark hover:bg-forest hover:text-white';
            }

            const weekday = WEEKDAYS_LONG[(offset + day - 1) % 7];

            return (
              <button
                key={iso}
                type="button"
                disabled={!actionable}
                aria-label={`${weekday} ${formatLong(iso)}: ${status}`}
                aria-pressed={isStart || isEnd ? true : undefined}
                onClick={() => handlePick(iso)}
                onMouseEnter={() => setHover(iso)}
                onMouseLeave={() => setHover(null)}
                className={`relative mx-auto flex aspect-square w-full max-w-[3.25rem] items-center justify-center rounded-full text-[1.0625rem] transition-colors disabled:cursor-not-allowed ${cls} ${
                  isBooked && !past && actionable ? 'ring-1 ring-forest/60' : ''
                } ${iso === today && !isStart && !isEnd ? 'underline decoration-forest decoration-2 underline-offset-4' : ''}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section id="disponibilidad" className="bg-cream py-20 sm:py-28" aria-labelledby="disp-titulo">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-forest">Disponibilidad</p>
          <h2 id="disp-titulo" className="section-title mt-5">
            ¿Cuándo quieres venir?
          </h2>
          <p className="mt-6 text-lg text-ink/80 sm:text-xl">
            Consulta las fechas disponibles y envíanos tu solicitud.
          </p>
        </Reveal>

        <Reveal className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Calendario */}
          <div className="rounded-[1.75rem] bg-white p-5 shadow-[0_1px_0_rgba(23,32,28,0.06)] sm:p-9 lg:col-span-8">
            <div className="mb-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => shift(-1)}
                disabled={!canPrev}
                aria-label="Mes anterior"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 text-ink transition hover:border-forest hover:text-forest disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={24} />
              </button>
              <p className="text-sm font-medium text-ink/60" aria-live="polite">
                {load === 'loading' && 'Cargando disponibilidad…'}
                {load === 'error' && 'No pudimos cargar la disponibilidad'}
              </p>
              <button
                type="button"
                onClick={() => shift(1)}
                disabled={!canNext}
                aria-label="Mes siguiente"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 text-ink transition hover:border-forest hover:text-forest disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <div className="grid gap-10 md:grid-cols-2 md:gap-12">
              {renderMonth(cursor.year, cursor.month)}
              {showSecond && (
                <div className="hidden md:block">{renderMonth(nextMonth.getFullYear(), nextMonth.getMonth())}</div>
              )}
            </div>

            {/* Leyenda: color + patrón + texto */}
            <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3 border-t border-ink/10 pt-6 text-[0.9375rem] text-ink/80">
              <li className="flex items-center gap-2.5">
                <span className="h-5 w-5 rounded-full bg-[#E1EBDB] ring-1 ring-forest/30" aria-hidden="true" />
                Disponible
              </li>
              <li className="flex items-center gap-2.5">
                <span className="hatch h-5 w-5 rounded-full bg-[#EBDDD8] ring-1 ring-[#7A4A42]/30" aria-hidden="true" />
                Reservado
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[0.8rem] text-ink/30" aria-hidden="true">
                  12
                </span>
                Fecha pasada
              </li>
            </ul>

            {load === 'error' && (
              <p role="alert" className="mt-4 text-sm text-[#7A4A42]">
                Las fechas mostradas podrían no estar actualizadas. Envíanos tu consulta y confirmaremos la
                disponibilidad.
              </p>
            )}
            {isDemo && (
              <p className="mt-4 rounded-xl bg-sand/40 px-4 py-3 text-sm text-ink/70">
                Modo demostración: estas fechas ocupadas son de ejemplo. Conecta Supabase para mostrar las reales.
              </p>
            )}
          </div>

          {/* Resumen de selección */}
          <aside className="lg:col-span-4" aria-label="Resumen de fechas seleccionadas">
            <div className="lg:sticky lg:top-28">
              <dl className="space-y-6 border-t border-ink/15 pt-6">
                <div>
                  <dt className="eyebrow text-ink/60">Entrada</dt>
                  <dd className="mt-1 font-serif text-3xl text-ink sm:text-4xl">
                    {start ? formatLong(start) : <span className="text-ink/35">Elige una fecha</span>}
                  </dd>
                </div>
                <div className="border-t border-ink/10 pt-6">
                  <dt className="eyebrow text-ink/60">Salida</dt>
                  <dd className="mt-1 font-serif text-3xl text-ink sm:text-4xl">
                    {end ? formatLong(end) : <span className="text-ink/35">{start ? 'Elige la salida' : '—'}</span>}
                  </dd>
                </div>
                <div className="border-t border-ink/10 pt-6">
                  <dt className="eyebrow text-ink/60">Noches</dt>
                  <dd className="mt-1 font-serif text-3xl text-ink sm:text-4xl">{nights > 0 ? nights : '—'}</dd>
                </div>
              </dl>

              <p role="status" className="mt-5 min-h-[1.5rem] text-sm text-[#7A4A42]">
                {notice}
              </p>

              <button
                type="button"
                disabled={!(start && end)}
                onClick={() => start && end && onConsult(start, end)}
                className="btn btn-forest mt-3 w-full disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-forest"
              >
                Consultar estas fechas
              </button>
              {(start || end) && (
                <button
                  type="button"
                  onClick={clear}
                  className="mt-3 w-full py-2 text-sm font-medium text-ink/70 underline underline-offset-4 hover:text-forest"
                >
                  Limpiar fechas
                </button>
              )}
              <p className="mt-6 text-sm leading-relaxed text-ink/60">
                La disponibilidad es referencial. No se realizan cobros ni reservas automáticas: te responderemos para
                confirmar tu estadía.
              </p>
            </div>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
