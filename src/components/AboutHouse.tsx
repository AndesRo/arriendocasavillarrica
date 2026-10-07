import { property } from '../data/property';
import Reveal from './Reveal';
import SmartImage from './SmartImage';

export default function AboutHouse() {
  return (
    <section id="la-casa" className="bg-cream pb-20 sm:pb-28">
      <div className="mx-auto grid max-w-[90rem] items-center gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12">
        <Reveal variant="scale" className="lg:col-span-7">
          <div className="aspect-[4/5] overflow-hidden rounded-[1.75rem] sm:aspect-[5/4] lg:aspect-[4/4.4]">
            <SmartImage
              src={property.images.about}
              alt={`Exterior de ${property.name}`}
              className="h-full w-full object-cover"
              sizes="(min-width: 1024px) 58vw, 100vw"
            />
          </div>
        </Reveal>

        <Reveal className="lg:col-span-5">
          <p className="eyebrow text-forest">La casa</p>
          <h2 className="section-title mt-5 text-ink">{property.copy.aboutTitle}</h2>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-ink/80 sm:text-xl">
            {property.copy.aboutText}
          </p>
          <a href="#galeria" className="btn btn-outline mt-9">
            Ver galería
          </a>
        </Reveal>
      </div>
    </section>
  );
}
