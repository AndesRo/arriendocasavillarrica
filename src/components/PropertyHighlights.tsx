import { property } from '../data/property';
import Reveal from './Reveal';

const items = [
  { value: property.guests, label: 'Huéspedes', token: '[CAPACIDAD]' },
  { value: property.bedrooms, label: 'Dormitorios', token: '[DORMITORIOS]' },
  { value: property.bathrooms, label: property.bathrooms === 1 ? 'Baño' : 'Baños', token: '[BAÑOS]' },
  { value: property.parking, label: 'Estacionamiento', token: '[ESTACIONAMIENTO]' },
];

export default function PropertyHighlights() {
  return (
    <section aria-label="Información rápida" className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {items.map((item, i) => (
            <Reveal key={item.label} delay={i * 90} className="border-t border-ink/15 pt-6">
              <dd className="font-serif text-[clamp(4rem,10vw,7.5rem)] font-medium leading-none text-forest">
                {item.value ?? '—'}
              </dd>
              <dt className="mt-3 text-base font-medium tracking-wide text-ink/80 sm:text-lg">
                {item.label}
                {item.value == null && import.meta.env.DEV && (
                  <span className="ml-2 text-[0.75rem] text-ink/50">{item.token}</span>
                )}
              </dt>
            </Reveal>
          ))}
        </dl>

        <Reveal className="mx-auto mt-16 max-w-3xl text-center sm:mt-24">
          <p className="font-serif text-[clamp(1.7rem,4vw,2.75rem)] italic leading-snug text-ink">
            {property.copy.highlightsPhrase}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
