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

  // Datos rápidos. `null` = pendiente de completar (se muestra "—"). 
  guests: 4 as number | null, // [CAPACIDAD] 
  bedrooms: 2 as number | null, // [DORMITORIOS] 
  bathrooms: 1 as number | null, // [BAÑOS] 
  parking: 1 as number | null, // [ESTACIONAMIENTO]

  // Contacto. Puedes escribirlos aquí o definirlos en .env.local
  // WhatsApp: código de país + número, solo dígitos (ej: "569XXXXXXXX").
  whatsapp: env.VITE_WHATSAPP_NUMBER || '56997416485', // WHATSAPP_NUMBER
  email: env.VITE_CONTACT_EMAIL || 'andespart.ar@gmail.com',
  instagram: env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/casavillarrica/', // URL completa del perfil

  whatsappMessage:
    'Hola, estoy interesado en arrendar la casa en Villarrica. Quisiera consultar disponibilidad.',

  // Imágenes principales (coloca tus fotos reales en /public/images)
  images: {
    hero: '/images/hero-casa-villarrica.jpg',
    about: '/images/casa-exterior-2.jpg',
  },

  // Textos editables
  copy: {
    heroEyebrow: 'Villarrica · Arriendo de vacaciones · Región de La Araucanía',
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
