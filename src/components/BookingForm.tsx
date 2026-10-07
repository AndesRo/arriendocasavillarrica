import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { property } from '../data/property';
import { addDays, diffNights, formatLong, isValidISO, todayISO } from '../lib/dates';
import { submitInquiry } from '../lib/inquiries';
import { buildWhatsAppLink, isWhatsAppConfigured } from '../lib/whatsapp';
import { Check, WhatsApp } from './Icons';
import Reveal from './Reveal';

export interface Prefill {
  start: string;
  end: string;
  /** Cambia en cada selección para que se vuelva a aplicar aunque las fechas sean las mismas. */
  id: number;
}

interface Values {
  nombre: string;
  email: string;
  telefono: string;
  llegada: string;
  salida: string;
  huespedes: string;
  mensaje: string;
  consentimiento: boolean;
  website: string; // honeypot anti-spam (debe quedar vacío)
}

type Errors = Partial<Record<keyof Values, string>>;

const empty: Values = {
  nombre: '',
  email: '',
  telefono: '',
  llegada: '',
  salida: '',
  huespedes: '',
  mensaje: '',
  consentimiento: false,
  website: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: Values): Errors {
  const e: Errors = {};
  const today = todayISO();
  if (v.nombre.trim().length < 2) e.nombre = 'Ingresa tu nombre.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Ingresa un email válido.';
  if (v.telefono.replace(/\D/g, '').length < 8) e.telefono = 'Ingresa un teléfono o WhatsApp válido.';
  if (!isValidISO(v.llegada)) e.llegada = 'Elige tu fecha de llegada.';
  else if (v.llegada < today) e.llegada = 'La llegada no puede ser una fecha pasada.';
  if (!isValidISO(v.salida)) e.salida = 'Elige tu fecha de salida.';
  else if (isValidISO(v.llegada) && v.salida <= v.llegada) e.salida = 'La salida debe ser posterior a la llegada.';
  const g = Number(v.huespedes);
  const max = property.guests ?? 20;
  if (!v.huespedes || !Number.isInteger(g) || g < 1) e.huespedes = 'Indica cuántos huéspedes serán.';
  else if (g > max) e.huespedes = `La capacidad máxima es de ${max} huéspedes.`;
  if (!v.consentimiento) e.consentimiento = 'Necesitamos tu autorización para responderte.';
  return e;
}

export default function BookingForm({ prefill }: { prefill: Prefill | null }) {
  const [values, setValues] = useState<Values>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [phase, setPhase] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const cardRef = useRef<HTMLDivElement>(null);
  const today = todayISO();
  const maxGuests = property.guests ?? 20;

  // Autocompleta fechas desde el calendario.
  useEffect(() => {
    if (!prefill) return;
    setValues((v) => ({ ...v, llegada: prefill.start, salida: prefill.end }));
    setTouched((t) => ({ ...t, llegada: false, salida: false }));
    setErrors((e) => ({ ...e, llegada: undefined, salida: undefined }));
    setPhase((p) => (p === 'success' ? 'idle' : p));
  }, [prefill]);

  const [submittedOnce, setSubmittedOnce] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    const next = { ...values, [key]: value };
    // Mantiene la salida coherente si la llegada pasa a ser posterior.
    if (key === 'llegada' && next.salida && isValidISO(String(value)) && next.salida <= String(value)) {
      next.salida = '';
    }
    setValues(next);
    if (touched[key] || submittedOnce) setErrors(validate(next));
  };

  const blur = (key: keyof Values) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(values));
  };

  const showError = (key: keyof Values) => (touched[key] || submittedOnce) && errors[key];

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSubmittedOnce(true);
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      const firstKey = Object.keys(found)[0];
      document.getElementById(`f-${firstKey}`)?.focus();
      return;
    }
    // Honeypot: un bot rellenó el campo oculto. Fingimos éxito sin enviar nada.
    if (values.website) {
      setPhase('success');
      return;
    }

    setPhase('sending');
    const res = await submitInquiry({
      nombre: values.nombre.trim(),
      email: values.email.trim(),
      telefono: values.telefono.trim(),
      fecha_llegada: values.llegada,
      fecha_salida: values.salida,
      huespedes: Number(values.huespedes),
      mensaje: values.mensaje.trim(),
      acepta_contacto: values.consentimiento,
    });

    if (res.ok) {
      setPhase('success');
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setPhase('error');
    }
  };

  const reset = () => {
    setValues(empty);
    setErrors({});
    setTouched({});
    setSubmittedOnce(false);
    setPhase('idle');
  };

  const nights =
    isValidISO(values.llegada) && isValidISO(values.salida) && values.salida > values.llegada
      ? diffNights(values.llegada, values.salida)
      : 0;

  const whatsappMsg = `${property.whatsappMessage}${
    nights ? ` Fechas: ${formatLong(values.llegada)} al ${formatLong(values.salida)}.` : ''
  }`;

  return (
    <section id="contacto" className="bg-cream py-20 sm:py-28" aria-labelledby="reserva-titulo">
      <div className="mx-auto grid max-w-[90rem] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow text-forest">Reserva</p>
          <h2 id="reserva-titulo" className="section-title mt-5">
            ¿Quieres reservar?
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/80 sm:text-xl">
            Cuéntanos cuándo quieres venir y te responderemos con disponibilidad y detalles.
          </p>
          {nights > 0 && (
            <p className="mt-8 border-l-2 border-forest pl-5 font-serif text-2xl text-forest">
              {formatLong(values.llegada)} → {formatLong(values.salida)}
              <span className="block text-lg text-ink/70">
                {nights} {nights === 1 ? 'noche' : 'noches'}
              </span>
            </p>
          )}
        </Reveal>

        <Reveal className="lg:col-span-7" delay={100}>
          <div ref={cardRef} className="scroll-mt-24 rounded-[1.75rem] bg-white p-6 sm:p-10">
            {phase === 'success' ? (
              <div className="py-10 text-center" role="status">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest text-white">
                  <Check size={32} />
                </span>
                <h3 className="mt-6 font-serif text-4xl sm:text-5xl">¡Solicitud enviada!</h3>
                <p className="mx-auto mt-4 max-w-sm text-lg text-ink/80">
                  Gracias por contactarnos. Te responderemos a la brevedad.
                </p>
                <button type="button" onClick={reset} className="btn btn-outline mt-8">
                  Enviar otra consulta
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate aria-label="Formulario de consulta de reserva">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="nombre" label="Nombre" error={showError('nombre')}>
                    <input
                      id="f-nombre"
                      className={`field ${showError('nombre') ? 'field-error' : ''}`}
                      type="text"
                      autoComplete="name"
                      value={values.nombre}
                      onChange={(e) => set('nombre', e.target.value)}
                      onBlur={() => blur('nombre')}
                      aria-invalid={Boolean(showError('nombre'))}
                      aria-describedby="e-nombre"
                      required
                    />
                  </Field>
                  <Field id="email" label="Email" error={showError('email')}>
                    <input
                      id="f-email"
                      className={`field ${showError('email') ? 'field-error' : ''}`}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={values.email}
                      onChange={(e) => set('email', e.target.value)}
                      onBlur={() => blur('email')}
                      aria-invalid={Boolean(showError('email'))}
                      aria-describedby="e-email"
                      required
                    />
                  </Field>
                  <Field id="telefono" label="Teléfono / WhatsApp" error={showError('telefono')} className="sm:col-span-2">
                    <input
                      id="f-telefono"
                      className={`field ${showError('telefono') ? 'field-error' : ''}`}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+56 9 ..."
                      value={values.telefono}
                      onChange={(e) => set('telefono', e.target.value)}
                      onBlur={() => blur('telefono')}
                      aria-invalid={Boolean(showError('telefono'))}
                      aria-describedby="e-telefono"
                      required
                    />
                  </Field>
                  <Field id="llegada" label="Fecha de llegada" error={showError('llegada')}>
                    <input
                      id="f-llegada"
                      className={`field ${showError('llegada') ? 'field-error' : ''}`}
                      type="date"
                      min={today}
                      value={values.llegada}
                      onChange={(e) => set('llegada', e.target.value)}
                      onBlur={() => blur('llegada')}
                      aria-invalid={Boolean(showError('llegada'))}
                      aria-describedby="e-llegada"
                      required
                    />
                  </Field>
                  <Field id="salida" label="Fecha de salida" error={showError('salida')}>
                    <input
                      id="f-salida"
                      className={`field ${showError('salida') ? 'field-error' : ''}`}
                      type="date"
                      min={isValidISO(values.llegada) ? addDays(values.llegada, 1) : addDays(today, 1)}
                      value={values.salida}
                      onChange={(e) => set('salida', e.target.value)}
                      onBlur={() => blur('salida')}
                      aria-invalid={Boolean(showError('salida'))}
                      aria-describedby="e-salida"
                      required
                    />
                  </Field>
                  <Field id="huespedes" label="Número de huéspedes" error={showError('huespedes')} className="sm:col-span-2">
                    <select
                      id="f-huespedes"
                      className={`field ${showError('huespedes') ? 'field-error' : ''}`}
                      value={values.huespedes}
                      onChange={(e) => set('huespedes', e.target.value)}
                      onBlur={() => blur('huespedes')}
                      aria-invalid={Boolean(showError('huespedes'))}
                      aria-describedby="e-huespedes"
                      required
                    >
                      <option value="">Selecciona…</option>
                      {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'huésped' : 'huéspedes'}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="mensaje" label="Mensaje (opcional)" className="sm:col-span-2">
                    <textarea
                      id="f-mensaje"
                      className="field min-h-[7.5rem] resize-y"
                      rows={4}
                      maxLength={1500}
                      value={values.mensaje}
                      onChange={(e) => set('mensaje', e.target.value)}
                    />
                  </Field>

                  {/* Honeypot: invisible para personas */}
                  <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                    <label>
                      No completar este campo
                      <input
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={values.website}
                        onChange={(e) => set('website', e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3 text-base text-ink/85">
                      <input
                        id="f-consentimiento"
                        type="checkbox"
                        className="mt-1 h-5 w-5 shrink-0 accent-forest"
                        checked={values.consentimiento}
                        onChange={(e) => set('consentimiento', e.target.checked)}
                        onBlur={() => blur('consentimiento')}
                        aria-invalid={Boolean(showError('consentimiento'))}
                        aria-describedby="e-consentimiento"
                      />
                      <span>Autorizo que me contacten respecto de esta solicitud.</span>
                    </label>
                    <p id="e-consentimiento" role="alert" className="mt-1.5 min-h-[1.25rem] text-sm text-[#a0412f]">
                      {showError('consentimiento')}
                    </p>
                  </div>
                </div>

                {phase === 'error' && (
                  <div role="alert" className="mt-4 rounded-2xl bg-[#F6E7E2] px-5 py-4 text-[#7A3A2D]">
                    <p>No pudimos enviar tu consulta en este momento. Inténtalo nuevamente en unos minutos.</p>
                    {isWhatsAppConfigured && (
                      <a
                        href={buildWhatsAppLink(whatsappMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 font-semibold underline underline-offset-4"
                      >
                        <WhatsApp size={18} /> O escríbenos por WhatsApp
                      </a>
                    )}
                  </div>
                )}

                <button type="submit" disabled={phase === 'sending'} className="btn btn-forest mt-6 w-full disabled:opacity-60">
                  {phase === 'sending' ? 'Enviando…' : 'Enviar consulta'}
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  className = '',
  children,
}: {
  id: string;
  label: string;
  error?: string | false;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={`f-${id}`} className="mb-2 block text-[0.9375rem] font-semibold text-ink">
        {label}
      </label>
      {children}
      <p id={`e-${id}`} role="alert" className="mt-1.5 min-h-[1.25rem] text-sm text-[#a0412f]">
        {error || ''}
      </p>
    </div>
  );
}
