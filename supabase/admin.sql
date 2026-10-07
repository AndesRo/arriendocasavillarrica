-- ============================================================
--  Casa Villarrica · PASO 2: panel de administración
--  Ejecútalo DESPUÉS de schema.sql  (SQL Editor → New query → Run)
--  Es seguro volver a ejecutarlo (idempotente).
-- ============================================================

create extension if not exists btree_gist;

-- 1) Estado de cada consulta -------------------------------------------------
alter table public.consultas
  add column if not exists estado text not null default 'nueva'
    check (estado in ('nueva', 'aceptada', 'rechazada', 'cancelada')),
  add column if not exists reserva_id uuid references public.reservas (id) on delete set null;

-- 2) Imposible que dos reservas/bloqueos se pisen ----------------------------
--    (las noches ocupadas son [fecha_inicio, fecha_fin): el día de salida queda libre)
do $$
begin
  alter table public.reservas
    add constraint reservas_sin_solapes
    exclude using gist (daterange(fecha_inicio, fecha_fin, '[)') with &&);
exception
  when duplicate_object then null;
end $$;

-- 3) Quién es administrador ---------------------------------------------------
--    La seguridad real está aquí (en la base de datos), no en esconder la URL /admin.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
-- (sin políticas: el navegador no puede leer ni modificar esta tabla)

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 4) Permisos del administrador ----------------------------------------------
grant select, update, delete on public.consultas to authenticated;
grant select, insert, update, delete on public.reservas to authenticated;

drop policy if exists consultas_admin_select on public.consultas;
create policy consultas_admin_select on public.consultas
  for select to authenticated using (public.is_admin());

drop policy if exists consultas_admin_update on public.consultas;
create policy consultas_admin_update on public.consultas
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists consultas_admin_delete on public.consultas;
create policy consultas_admin_delete on public.consultas
  for delete to authenticated using (public.is_admin());

drop policy if exists reservas_admin_all on public.reservas;
create policy reservas_admin_all on public.reservas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5) Endurecer el formulario público ------------------------------------------
--    Un visitante solo puede crear consultas "nuevas" (no puede autoaceptarse).
drop policy if exists consultas_insert_publico on public.consultas;
create policy consultas_insert_publico on public.consultas
  for insert to anon, authenticated
  with check (estado = 'nueva' and reserva_id is null);

-- 6) Aceptar una consulta = crear la reserva + marcarla, todo en una sola operación
create or replace function public.aceptar_consulta(p_consulta uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c         public.consultas%rowtype;
  v_reserva uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select * into c from public.consultas where id = p_consulta for update;
  if not found then
    raise exception 'La consulta no existe';
  end if;
  if c.estado = 'aceptada' then
    raise exception 'Esta consulta ya fue aceptada';
  end if;

  begin
    insert into public.reservas (fecha_inicio, fecha_fin, estado, nombre_cliente, telefono, email)
    values (c.fecha_llegada, c.fecha_salida, 'reservado', c.nombre, c.telefono, c.email)
    returning id into v_reserva;
  exception
    when exclusion_violation then
      raise exception 'Esas fechas ya están ocupadas por otra reserva o bloqueo';
  end;

  update public.consultas
     set estado = 'aceptada', reserva_id = v_reserva
   where id = p_consulta;

  return v_reserva;
end;
$$;

revoke all on function public.aceptar_consulta(uuid) from public, anon;
grant execute on function public.aceptar_consulta(uuid) to authenticated;

-- 7) Si borras una reserva aceptada, su consulta pasa a "cancelada" -----------
create or replace function public.marcar_consulta_cancelada()
returns trigger
language plpgsql
as $$
begin
  update public.consultas
     set estado = 'cancelada'
   where reserva_id = old.id and estado = 'aceptada';
  return old;
end;
$$;

drop trigger if exists trg_reserva_borrada on public.reservas;
create trigger trg_reserva_borrada
  before delete on public.reservas
  for each row execute function public.marcar_consulta_cancelada();

-- ============================================================
--  8) CREAR TU USUARIO ADMINISTRADOR (hazlo una sola vez)
--
--  a) Supabase → Authentication → Users → "Add user" → "Create new user"
--     (tu correo + una contraseña larga; marca "Auto Confirm User").
--  b) Reemplaza TU_CORREO por ese correo y ejecuta SOLO esta línea:
--
--     insert into public.admins (user_id)
--     select id from auth.users where email = 'TU_CORREO'
--     on conflict do nothing;
--
--  c) Recomendado: Authentication → Sign In / Providers → desactiva
--     "Allow new users to sign up" para que nadie más pueda crear cuentas.
-- ============================================================
