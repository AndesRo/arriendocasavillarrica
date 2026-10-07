import { useMemo, useState } from 'react';
import { galleryCategories, galleryItems, type GalleryCategory } from '../data/gallery';
import Lightbox from './Lightbox';
import Reveal from './Reveal';
import SmartImage from './SmartImage';

const ratioClass = {
  landscape: 'aspect-[4/3]',
  portrait: 'aspect-[4/5]',
  square: 'aspect-square',
} as const;

type Filter = 'Todas' | GalleryCategory;

export default function Gallery() {
  const [filter, setFilter] = useState<Filter>('Todas');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => (filter === 'Todas' ? galleryItems : galleryItems.filter((i) => i.category === filter)),
    [filter],
  );
  const available = useMemo(() => new Set(galleryItems.map((i) => i.category)), []);
  const filters: Filter[] = ['Todas', ...galleryCategories.filter((c) => available.has(c))];

  return (
    <section id="galeria" className="bg-cream pb-20 sm:pb-28" aria-labelledby="galeria-titulo">
      <div className="mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <Reveal className="max-w-3xl">
          <p className="eyebrow text-forest">Galería</p>
          <h2 id="galeria-titulo" className="section-title mt-5">
            Mira cada rincón.
          </h2>
        </Reveal>

        <Reveal className="-mx-5 mt-10 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <div role="group" aria-label="Filtrar fotografías por categoría" className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`min-h-[2.75rem] whitespace-nowrap rounded-full border px-5 text-[0.9rem] font-medium transition ${
                  filter === f
                    ? 'border-forest bg-forest text-white'
                    : 'border-ink/20 text-ink/80 hover:border-forest hover:text-forest'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </Reveal>

        <ul className="mt-10 gap-4 sm:columns-2 sm:gap-5 lg:columns-3 lg:gap-6">
          {visible.map((item, i) => (
            <li key={item.id} className="mb-4 break-inside-avoid sm:mb-5 lg:mb-6">
              <Reveal variant="scale" delay={(i % 3) * 90}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  className={`group relative block w-full overflow-hidden rounded-[1.5rem] ${ratioClass[item.ratio]}`}
                  aria-label={`Ampliar fotografía: ${item.alt}`}
                >
                  <SmartImage
                    src={item.src}
                    srcSet={item.srcSet}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
                    alt={item.alt}
                    className="h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.03]"
                  />
                  <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-cream/90 px-3.5 py-1 text-[0.8125rem] font-medium text-ink opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                    {item.category}
                  </span>
                </button>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>

      {openIndex !== null && (
        <Lightbox
          items={visible}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      )}
    </section>
  );
}
