export type ConsultaEstado = 'nueva' | 'aceptada' | 'rechazada' | 'cancelada';

export interface Consulta {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fecha_llegada: string;
  fecha_salida: string;
  huespedes: number;
  mensaje: string | null;
  estado: ConsultaEstado;
  reserva_id: string | null;
  created_at: string;
}

export interface Reserva {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'reservado' | 'bloqueado';
  nombre_cliente: string | null;
  telefono: string | null;
  email: string | null;
  created_at: string;
}
