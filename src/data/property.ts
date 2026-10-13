/**
 * ============================================================
 *  CONFIGURACIÓN DE LA PROPIEDAD
 *  Edita este archivo para personalizar el sitio.
 *  Los valores en `null` o '' son placeholders: no se inventa nada.
 * ============================================================
 */

const env = import.meta.env;

export const property = {
  name: 'Casa Villarrica',
  tagline: 'Un lugar para disfrutar el sur de Chile.',
  location: 'Villarrica, Región de La Araucanía, Chile',

  // Datos rápidos
  guests: 4 as number | null,
  bedrooms: 2 as number | null,
  bathrooms: 1 as number | null,
  parking: 1 as number | null,

  // Contacto
  whatsapp: env.VITE_WHATSAPP_NUMBER || '56997416485',
  email: env.VITE_CONTACT_EMAIL || 'andespart.ar@gmail.com',
  instagram:
    env.VITE_INSTAGRAM_URL ||
    'https://www.instagram.com/casavillarrica/',

  whatsappMessage:
    'Hola, estoy interesado en arrendar la casa en Villarrica. Quisiera consultar disponibilidad.',

  // Imágenes principales
  images: {
    /**
     * Reducido para evitar que la foto vertical se vea demasiado ampliada.
     * Valores recomendados: 50-60.
     */
    heroMobileImageHeight: 55,

    /**
     * Posiciona la foto un poco más arriba para mostrar
     * más paisaje y menos acercamiento a la fachada.
     */
    heroPosition: '50% 35%',

    /**
     * Punto de enfoque para móviles.
     * Permite mostrar más entorno alrededor de la casa.
     */
    heroFocusX: 0.5,

    heroWater: {
      enabled: true,
      area: [0.552, 0.59, 1, 0.76] as [number, number, number, number],

      exclude: [
        [0.862, 0, 0.912, 1],
        [0.62, 0.7, 0.65, 1],
        [0.76, 0.7, 0.815, 1],
        [0.548, 0.735, 0.607, 1],
      ] as [number, number, number, number][],

      strength: 1,
    },

    hero: '/images/hero-casa-villarrica.jpg',
    about: '/images/casa-exterior-2.jpg',
  },

  // Textos editables
  copy: {
    heroEyebrow: 'Villarrica · Arriendo · Región de La Araucanía',

    heroTitleLine1: 'Tu lugar para',

    heroTitleLine2: 'desconectar.',

    heroSubtitle:
      'Disfruta unos días de descanso, naturaleza y tranquilidad en el sur de Chile.',

    highlightsPhrase:
      'Todo lo que necesitas para disfrutar unos días de descanso en Villarrica.',

    aboutTitle: 'Una casa pensada para descansar.',

    aboutText:
      'Un espacio cómodo y acogedor para disfrutar de Villarrica, descansar y compartir con familia o amigos.',
  },
};

export type Property = typeof property;
