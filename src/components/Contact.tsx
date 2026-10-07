import { property } from '../data/property';
import { buildWhatsAppLink, cleanPhone, isWhatsAppConfigured } from '../lib/whatsapp';
import { WhatsApp } from './Icons';
import Reveal from './Reveal';

const Missing = ({ token }: { token: string }) => <span className="italic text-ink/45">{token}</span>;

/** Muestra el número con formato legible a partir de solo dígitos (ej: +56 9 1234 5678). */
const prettyPhone = (raw: string) => {
  const d = cleanPhone(raw);
  return d ? `+${d}` : '';
};

export default function Contact() {
  return (
    <section id="escribenos" className="bg-sand/35 py-20 sm:py-28" aria-labelledby="contacto-titulo">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-6">
            <p className="eyebrow text-forest">Contacto</p>
            <h2 id="contacto-titulo" className="section-title mt-5">
              ¿Tienes alguna pregunta?
            </h2>
          </Reveal>

          <Reveal className="lg:col-span-6" delay={100}>
            <dl className="divide-y divide-ink/15 border-y border-ink/15 text-lg">
              <div className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-8">
                <dt className="w-32 shrink-0 text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Email</dt>
                <dd>
                  {property.email ? (
                    <a className="underline-offset-4 hover:underline" href={`mailto:${property.email}`}>
                      {property.email}
                    </a>
                  ) : (
                    <Missing token="[EMAIL]" />
                  )}
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-8">
                <dt className="w-32 shrink-0 text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">WhatsApp</dt>
                <dd>
                  {isWhatsAppConfigured ? (
                    <a className="underline-offset-4 hover:underline" href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                      {prettyPhone(property.whatsapp)}
                    </a>
                  ) : (
                    <Missing token="[WHATSAPP]" />
                  )}
                </dd>
              </div>
              <div className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-8">
                <dt className="w-32 shrink-0 text-sm font-semibold uppercase tracking-[0.18em] text-ink/60">Ubicación</dt>
                <dd>Villarrica, Región de La Araucanía</dd>
              </div>
            </dl>

            {isWhatsAppConfigured ? (
              <a
                href={buildWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-forest mt-8 w-full sm:w-auto"
              >
                <WhatsApp size={20} /> Escribir por WhatsApp
              </a>
            ) : (
              <p className="mt-8 text-sm text-ink/55">
                Configura el número de WhatsApp en <code>src/data/property.ts</code> o en <code>.env.local</code> para
                activar el botón.
              </p>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
