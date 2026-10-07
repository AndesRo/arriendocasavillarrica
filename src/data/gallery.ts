export type GalleryCategory =
  | 'Exterior'
  | 'Living'
  | 'Cocina'
  | 'Dormitorios'
  | 'Baño'
  | 'Patio'
  | 'Entorno';

export const galleryCategories: GalleryCategory[] = [
  'Exterior',
  'Living',
  'Cocina',
  'Dormitorios',
  'Baño',
  'Patio',
  'Entorno',
];

export interface GalleryItem {
  id: string;
  /** Ruta dentro de /public. Si el archivo no existe se muestra un placeholder. */
  src: string;
  /** Texto alternativo descriptivo (accesibilidad + SEO). Ajústalo a tu foto real. */
  alt: string;
  category: GalleryCategory;
  /** Proporción del recuadro en la galería. */
  ratio: 'landscape' | 'portrait' | 'square';
  /** Opcional: imágenes responsive (ej: "/images/living-800.webp 800w, /images/living-1600.webp 1600w") */
  srcSet?: string;
}

export const galleryItems: GalleryItem[] = [
  { id: 'ext-1', src: '/images/casa-exterior-1.jpg', alt: 'Vista exterior de la casa en Villarrica', category: 'Exterior', ratio: 'landscape' },
  { id: 'liv-1', src: '/images/living.jpg', alt: 'Living de la casa', category: 'Living', ratio: 'portrait' },
  { id: 'coc-1', src: '/images/cocina.jpg', alt: 'Cocina de la casa', category: 'Cocina', ratio: 'square' },
  { id: 'dor-1', src: '/images/dormitorio-1.jpg', alt: 'Dormitorio principal', category: 'Dormitorios', ratio: 'portrait' },
  { id: 'ext-2', src: '/images/casa-exterior-2.jpg', alt: 'Fachada de la casa', category: 'Exterior', ratio: 'landscape' },
  { id: 'dor-2', src: '/images/dormitorio-2.jpg', alt: 'Segundo dormitorio', category: 'Dormitorios', ratio: 'landscape' },
  { id: 'ban-1', src: '/images/bano.jpg', alt: 'Baño de la casa', category: 'Baño', ratio: 'square' },
  { id: 'pat-1', src: '/images/patio.jpg', alt: 'Patio de la casa', category: 'Patio', ratio: 'portrait' },
  { id: 'ent-1', src: '/images/entorno-1.jpg', alt: 'Entorno natural de la casa en Villarrica', category: 'Entorno', ratio: 'landscape' },
];
