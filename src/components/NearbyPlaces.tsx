import { places, type Place } from '../data/places';
import { ExternalLink } from './Icons';
import Reveal from './Reveal';
import SmartImage from './SmartImage';

const spans = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-7'];

function PlaceCard({ place }: { place: Place }) {
  const content = (
    <>
      <SmartImage
        src={place.image}
        alt={`${place.name}, Villarrica`}
        className="absolute inset-0 h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-[1.04]"
        sizes="(min-width: 1024px) 55vw, 100vw"
        placeholderLabel="Agregar fotografía"
        placeholderTone="dark"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#0c1411]/80 to-transparent" />
      <div className="on-dark absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
        {place.distance && (
          <span className="mb-3 inline-block rounded-full bg-white/20 px-3.5 py-1 text-[0.8125rem] font-medium backdrop-blur-sm">
            {place.distance}
          </span>
        )}
        <h3 className="font-serif text-4xl font-medium leading-none sm:text-5xl">{place.name}</h3>
        <p className="mt-3 max-w-md text-base leading-relaxed text-white/90">{place.description}</p>
        {place.url && (
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em]">
            Ver más <ExternalLink size={16} />
          </span>
        )}
      </div>
    </>
  );

  const base = 'group relative block aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-forest-dark sm:aspect-[4/3]';

  return place.url ? (
    <a href={place.url} target="_blank" rel="noopener noreferrer" className={base}>
      {content}
    </a>
  ) : (
    <article className={base}>{content}</article>
  );
}

export default function NearbyPlaces() {
  return (
    <section id="que-hacer" className="bg-cream py-20 sm:py-28" aria-labelledby="lugares-titulo">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-forest">Qué hacer en Villarrica</p>
          <h2 id="lugares-titulo" className="section-title mt-5">
            Mucho por descubrir.
          </h2>
        </Reveal>

        <ul className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
          {places.map((place, i) => (
            <li key={place.name} className={`sm:col-span-1 ${spans[i % spans.length]}`}>
              <Reveal variant="scale" delay={(i % 2) * 100}>
                <PlaceCard place={place} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
