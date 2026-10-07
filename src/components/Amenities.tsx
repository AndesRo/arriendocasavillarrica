import { amenities } from '../data/amenities';
import { AmenityGlyph } from './Icons';
import Reveal from './Reveal';

export default function Amenities() {
  const confirmed = amenities.filter((a) => a.available);
  // Si aún no se confirmó ninguna, se muestra una vista previa atenuada (solo estructura).
  const preview = confirmed.length === 0;
  const list = preview ? amenities : confirmed;

  return (
    <section className="bg-sand/35 py-20 sm:py-28" aria-labelledby="comodidades-titulo">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-forest">Comodidades</p>
          <h2 id="comodidades-titulo" className="section-title mt-5">
            Todo lo que necesitas.
          </h2>
          {preview && import.meta.env.DEV && (
            <p className="mt-4 text-sm text-ink/60">
              Vista previa: marca <code>available: true</code> en <code>src/data/amenities.ts</code> solo para las
              comodidades confirmadas.
            </p>
          )}
        </Reveal>

        <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 sm:mt-16 md:grid-cols-4">
          {list.map((a, i) => (
            <li key={a.name}>
              <Reveal delay={(i % 4) * 80}>
                <div className={`flex flex-col items-start gap-4 ${preview ? 'opacity-55' : ''}`}>
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-forest/25 text-forest">
                    <AmenityGlyph name={a.icon} size={30} />
                  </span>
                  <span className="text-lg font-medium text-ink sm:text-xl">{a.name}</span>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
