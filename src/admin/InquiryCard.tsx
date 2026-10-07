import { rangeIsFree } from '../lib/availability';
import { diffNights, formatLong, todayISO } from '../lib/dates';
import type { Consulta } from './types';
import { formatDateTime, waLink } from './utils';

const BADGE: Record<Consulta['estado'], { label: string; cls: string }> = {
  nueva: { label: 'Nueva', cls: 'bg-sand text-ink' },
  aceptada: { label: 'Aceptada', cls: 'bg-forest text-white' },
  rechazada: { label: 'Rechazada', cls: 'border border-ink/30 text-ink/70' },
  cancelada: { label: 'Cancelada', cls: 'border border-ink/30 text-ink/70' },
};

interface Props {
  c: Consulta;
  /** Noches ya ocupadas (reservas + bloqueos), para avisar si las fechas chocan. */
  booked: Set<string>;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const pill =
  'inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40';

export default function InquiryCard({ c, booked, busy, onAccept, onReject }: Props) {
  const nights = diffNights(c.fecha_llegada, c.fecha_salida);
  const isNew = c.estado === 'nueva';
  const conflict = isNew && !rangeIsFree(booked, c.fecha_llegada, c.fecha_salida);
  const past = isNew && c.fecha_salida < todayISO();
  const badge = BADGE[c.estado];

  const reply = `Hola ${c.nombre}, gracias por tu consulta para el ${formatLong(c.fecha_llegada)} al ${formatLong(
    c.fecha_salida,
  )}. Te escribo para coordinar los detalles de tu estadía.`;

  const confirmAccept = () => {
    const ok = window.confirm(
      `¿Aceptar la consulta de ${c.nombre}?\n\nSe bloquearán las noches del ${formatLong(c.fecha_llegada)} al ${formatLong(
        c.fecha_salida,
      )} (${nights} ${nights === 1 ? 'noche' : 'noches'}) en el calendario público.`,
    );
    if (ok) onAccept();
  };

  const confirmReject = () => {
    if (window.confirm(`¿Rechazar la consulta de ${c.nombre}? No se bloquea ninguna fecha.`)) onReject();
  };

  return (
    <article className="rounded-[1.5rem] bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-3xl leading-tight">{c.nombre}</h3>
          <p className="mt-1 text-sm text-ink/60">Recibida el {formatDateTime(c.created_at)}</p>
        </div>
        <span className={`rounded-full px-3.5 py-1 text-[0.8125rem] font-semibold ${badge.cls}`}>{badge.label}</span>
      </div>

      <p className="mt-5 font-serif text-2xl text-forest">
        {formatLong(c.fecha_llegada)} → {formatLong(c.fecha_salida)}
      </p>
      <p className="mt-1 text-ink/75">
        {nights} {nights === 1 ? 'noche' : 'noches'} · {c.huespedes} {c.huespedes === 1 ? 'huésped' : 'huéspedes'}
      </p>

      {conflict && (
        <p role="alert" className="mt-4 rounded-xl bg-[#F6E7E2] px-4 py-3 text-[0.9375rem] text-[#7A3A2D]">
          ⚠ Estas fechas chocan con una reserva o bloqueo existente. No se puede aceptar tal cual: escríbele al cliente
          para proponer otras fechas.
        </p>
      )}
      {past && (
        <p className="mt-4 rounded-xl bg-sand/50 px-4 py-3 text-[0.9375rem] text-ink/80">
          Estas fechas ya pasaron.
        </p>
      )}

      <dl className="mt-5 grid gap-x-8 gap-y-2 text-[1.0625rem] sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink/55">Teléfono</dt>
          <dd>
            <a className="underline-offset-4 hover:underline" href={`tel:${c.telefono}`}>
              {c.telefono}
            </a>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-sm text-ink/55">Email</dt>
          <dd className="break-words">
            <a className="underline-offset-4 hover:underline" href={`mailto:${c.email}`}>
              {c.email}
            </a>
          </dd>
        </div>
      </dl>

      {c.mensaje && (
        <blockquote className="mt-5 whitespace-pre-line border-l-2 border-sand pl-4 text-ink/80">{c.mensaje}</blockquote>
      )}

      <div className="mt-6 flex flex-wrap gap-3 border-t border-ink/10 pt-5">
        {isNew && (
          <>
            <button
              type="button"
              disabled={busy || conflict || past}
              onClick={confirmAccept}
              className={`${pill} bg-forest text-white hover:bg-forest-dark`}
            >
              {busy ? 'Procesando…' : 'Aceptar y bloquear fechas'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={confirmReject}
              className={`${pill} border border-ink/25 text-ink hover:border-[#a0412f] hover:text-[#a0412f]`}
            >
              Rechazar
            </button>
          </>
        )}
        <a
          href={waLink(c.telefono, reply)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${pill} border border-forest/40 text-forest hover:bg-forest hover:text-white`}
        >
          Responder por WhatsApp
        </a>
        <a
          href={`mailto:${c.email}?subject=${encodeURIComponent('Tu consulta en Casa Villarrica')}&body=${encodeURIComponent(reply)}`}
          className={`${pill} border border-forest/40 text-forest hover:bg-forest hover:text-white`}
        >
          Responder por email
        </a>
      </div>
    </article>
  );
}
