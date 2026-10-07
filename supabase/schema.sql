-- ============================================================
--  Casa Villarrica · esquema de Supabase
--  Pégalo en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1) RESERVAS (las cargas y editas tú desde el Table Editor de Supabase)
create table if not exists public.reservas (
  id             uuid primary key default gen_random_uuid(),
  fecha_inicio   date not null,                       -- día de LLEGADA
  fecha_fin      date not null,                       -- día de SALIDA (queda libre para otra llegada)
  estado         text not null default 'reservado'
                 check (estado in ('reservado', 'bloqueado')),
  nombre_cliente text,
  telefono       text,
  email          text,
  created_at     timestamptz not null default now(),
  constraint reservas_rango_valido check (fecha_fin > fecha_inicio)
);

-- Seguridad: la tabla NO es legible desde el navegador (contiene datos de clientes).
alter table public.reservas enable row level security;
-- (sin políticas para anon/authenticated = sin acceso directo)

-- 2) VISTA PÚBLICA: solo fechas y estado, sin datos personales.
--    La vista se ejecuta con los permisos de su dueño, por eso puede leer la tabla
--    aunque el rol anónimo no tenga acceso a ella.
create or replace view public.disponibilidad_publica as
  select fecha_inicio, fecha_fin, estado
  from public.reservas;

grant select on public.disponibilidad_publica to anon, authenticated;

-- 3) CONSULTAS del formulario (el visitante solo puede INSERTAR, nunca leer)
create table if not exists public.consultas (
  id              uuid primary key default gen_random_uuid(),
  nombre          text    not null check (char_length(nombre) between 2 and 120),
  email           text    not null check (char_length(email) between 5 and 200),
  telefono        text    not null check (char_length(telefono) between 6 and 40),
  fecha_llegada   date    not null,
  fecha_salida    date    not null,
  huespedes       integer not null check (huespedes between 1 and 50),
  mensaje         text    check (char_length(mensaje) <= 2000),
  acepta_contacto boolean not null check (acepta_contacto),
  created_at      timestamptz not null default now(),
  constraint consultas_rango_valido check (fecha_salida > fecha_llegada)
);

alter table public.consultas enable row level security;

create policy "consultas_insert_publico"
  on public.consultas
  for insert
  to anon, authenticated
  with check (true);

grant insert on public.consultas to anon, authenticated;

-- ============================================================
--  Cómo bloquear fechas (ejemplo):
--    insert into public.reservas (fecha_inicio, fecha_fin, estado)
--    values ('2027-01-10', '2027-01-15', 'bloqueado');
--  → quedan ocupadas las noches del 10 al 14; el 15 es día de salida.
-- ============================================================
