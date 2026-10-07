-- ============================================================
--  Casa Villarrica · flujo de consultas → aprobación → reserva
--  Ejecutar UNA vez en: Supabase → SQL Editor → New query → Run
--  (requiere haber ejecutado antes supabase/schema.sql)
-- ============================================================

-- 1) Estado de cada consulta (lo cambias tú desde el Table Editor)
alter table public.consultas
  add column if not exists estado text not null default 'pendiente';

do $$
begin
  alter table public.consultas
    add constraint consultas_estado_valido
    check (estado in ('pendiente', 'aprobada', 'rechazada'));
exception when duplicate_object then null;
end $$;

-- Guarda qué reserva se creó al aprobar (sin FK a propósito: el trigger la gestiona)
alter table public.consultas
  add column if not exists reserva_id uuid;

-- 2) Protección contra doble reserva: dos reservas no pueden pisarse.
--    [inicio, fin) → el día de salida de una puede ser el día de llegada de otra.
create extension if not exists btree_gist;

do $$
begin
  alter table public.reservas
    add constraint reservas_sin_solape
    exclude using gist (daterange(fecha_inicio, fecha_fin, '[)') with &&);
exception when duplicate_object or duplicate_table then null;
end $$;

-- 3) Al pasar una consulta a "aprobada" se crea la reserva (y el calendario público
--    se actualiza solo). Si la devuelves a "pendiente"/"rechazada", la reserva se elimina.
create or replace function public.sincronizar_reserva_desde_consulta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nueva_id uuid;
begin
  if new.estado = 'aprobada' and old.estado is distinct from 'aprobada' and new.reserva_id is null then
    insert into public.reservas (fecha_inicio, fecha_fin, estado, nombre_cliente, telefono, email)
    values (new.fecha_llegada, new.fecha_salida, 'reservado', new.nombre, new.telefono, new.email)
    returning id into nueva_id;
    new.reserva_id := nueva_id;

  elsif old.estado = 'aprobada' and new.estado <> 'aprobada' and old.reserva_id is not null then
    delete from public.reservas where id = old.reserva_id;
    new.reserva_id := null;
  end if;

  return new;
end;
$$;

drop trigger if exists consultas_sincronizar_reserva on public.consultas;
create trigger consultas_sincronizar_reserva
  before update of estado on public.consultas
  for each row execute function public.sincronizar_reserva_desde_consulta();

-- Nadie desde el navegador puede ejecutar la función directamente
revoke all on function public.sincronizar_reserva_desde_consulta() from public, anon, authenticated;

-- ============================================================
--  Uso diario (Table Editor):
--   • consultas → cambia `estado` a  aprobada  → se crea la reserva y se bloquean las fechas.
--   • Si las fechas chocan con otra reserva, Supabase muestra un error y NO aprueba.
--   • Para bloquear fechas por uso personal: reservas → Insert row, estado = bloqueado.
-- ============================================================
