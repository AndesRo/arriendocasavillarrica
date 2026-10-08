export interface Place {
  name: string;
  description: string;
  /** Texto libre (ej: "15 min en auto"). Déjalo en null hasta confirmarlo: no se muestra. */
  distance: string | null;
  /** Ruta de la imagen en /public/images. Si no existe se muestra un placeholder. */
  image: string;
  /** Enlace opcional para "Ver más". */
  url: string | null;
}

export const places: Place[] = [
  {
    name: 'Lago Villarrica',
    description: 'Aguas tranquilas con vista al volcán para pasear, navegar o ver el atardecer.',
    distance: null,
    image: '/images/lugar-lago.jpg',
    url: null,
  },
  {
    name: 'Pucón',
    description: 'Localidad vecina con restaurantes, comercio y actividades al aire libre.',
    distance: null,
    image: '/images/pucon.jpg',
    url: null,
  },
  {
    name: 'Volcán Villarrica',
    description: 'El gran ícono del paisaje sureño, visible desde distintos puntos de la zona.',
    distance: null,
    image: '/images/lugar-volcan.jpg',
    url: null,
  },
  {
    name: 'Parques',
    description: 'Parques y reservas para caminar entre bosque nativo y respirar aire puro.',
    distance: null,
    image: '/images/lugar-parques.jpg',
    url: null,
  },
  {
    name: 'Termas',
    description: 'Aguas termales rodeadas de naturaleza, perfectas para después de un día al aire libre.',
    distance: null,
    image: '/images/lugar-termas.jpg',
    url: null,
  },
  {
    name: 'Gastronomía',
    description: 'Cafés, restaurantes y productos locales para probar el sur de Chile.',
    distance: null,
    image: '/images/cazuela.jpg',
    url: null,
  },
  {
    name: 'Playas',
    description: 'Costa de lago para disfrutar del sol y el agua en temporada de verano.',
    distance: null,
    image: '/images/playa.jpg',
    url: null,
  },
  {
    name: 'Senderismo',
    description: 'Rutas para distintos niveles entre bosques, lagos y volcanes.',
    distance: null,
    image: '/images/senderismo.jpg',
    url: null,
  },
];
