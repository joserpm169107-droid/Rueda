-- Sobre Ruedas v2.6.0 · Perfiles profesionales, suspensiones y eliminación definitiva
-- Ejecutar UNA sola vez después de tener instalada la v2.5.0.
-- Migración segura e idempotente: conserva los datos existentes.

begin;
create extension if not exists pgcrypto;

do $$ begin
  if to_regclass('public.profiles') is null or to_regclass('public.rides') is null then
    raise exception 'Faltan las tablas base profiles/rides. Instala primero Sobre Ruedas v2.5.0.';
  end if;
end $$;

-- Perfil visual y datos detallados del vehículo.
alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists document_url text;
alter table public.profiles add column if not exists vehicle_make text;
alter table public.profiles add column if not exists vehicle_model text;
alter table public.profiles add column if not exists vehicle_year integer;
alter table public.profiles add column if not exists vehicle_color text;
alter table public.profiles add column if not exists vehicle_plate text;
alter table public.profiles add column if not exists vehicle_capacity integer;
alter table public.profiles add column if not exists vehicle_photo_url text;
alter table public.profiles add column if not exists suspended_until timestamptz;
alter table public.profiles add column if not exists suspension_reason text;
alter table public.profiles add column if not exists suspended_at timestamptz;
alter table public.profiles add column if not exists suspended_by text;

-- Instantánea profesional que viaja con cada solicitud.
alter table public.rides add column if not exists passenger_photo text;
alter table public.rides add column if not exists driver_vehicle_make text;
alter table public.rides add column if not exists driver_vehicle_model text;
alter table public.rides add column if not exists driver_vehicle_year integer;
alter table public.rides add column if not exists driver_vehicle_color text;
alter table public.rides add column if not exists driver_vehicle_plate text;
alter table public.rides add column if not exists driver_vehicle_photo text;

create index if not exists profiles_suspension_idx on public.profiles(suspended_until) where suspended_until is not null;
create index if not exists profiles_role_status_idx on public.profiles(role,approval_status,status);

-- Contenedor público para fotos de perfil, vehículos e identificación.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'sobre-ruedas-media',
  'sobre-ruedas-media',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']::text[]
)
on conflict(id) do update set
  public=true,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- Políticas beta: la identidad actual todavía se maneja por device_id local.
drop policy if exists sr_media_read on storage.objects;
drop policy if exists sr_media_insert on storage.objects;
drop policy if exists sr_media_update on storage.objects;
drop policy if exists sr_media_delete on storage.objects;
create policy sr_media_read on storage.objects for select to anon,authenticated using(bucket_id='sobre-ruedas-media');
create policy sr_media_insert on storage.objects for insert to anon,authenticated with check(bucket_id='sobre-ruedas-media');
create policy sr_media_update on storage.objects for update to anon,authenticated using(bucket_id='sobre-ruedas-media') with check(bucket_id='sobre-ruedas-media');
create policy sr_media_delete on storage.objects for delete to anon,authenticated using(bucket_id='sobre-ruedas-media');

-- Suspender pasajero o conductor durante un período elegido por administración.
create or replace function public.admin_suspend_profile(
  p_person_id text,
  p_role text,
  p_until timestamptz,
  p_reason text,
  p_admin_name text,
  p_admin_code text
)
returns public.profiles
language plpgsql
security definer
set search_path=public,storage
as $$
declare
  v_profile public.profiles;
begin
  if p_admin_code is distinct from 'RUEDA2026' then
    raise exception using errcode='P0001',message='ADMIN_CODE_INVALID';
  end if;
  if p_until is null or p_until <= now() then
    raise exception using errcode='P0001',message='SUSPENSION_DATE_INVALID';
  end if;
  if nullif(trim(coalesce(p_reason,'')),'') is null then
    raise exception using errcode='P0001',message='SUSPENSION_REASON_REQUIRED';
  end if;

  select * into v_profile
  from public.profiles p
  where p.role=p_role
    and (p.device_id=p_person_id or p.id::text=p_person_id)
  limit 1
  for update;

  if not found then
    raise exception using errcode='P0001',message='PROFILE_NOT_FOUND';
  end if;

  update public.profiles
  set suspended_until=p_until,
      suspension_reason=trim(p_reason),
      suspended_at=now(),
      suspended_by=coalesce(nullif(trim(p_admin_name),''),'administración'),
      is_online=false,
      updated_at=now()
  where id=v_profile.id
  returning * into v_profile;

  -- La sanción libera cualquier operación activa para evitar viajes atascados.
  update public.rides
  set status='canceled',
      canceled_at=now(),
      canceled_by='admin',
      cancel_reason='Cuenta suspendida: '||trim(p_reason),
      admin_note='Suspensión administrativa hasta '||p_until::text,
      updated_at=now(),
      last_event_at=now()
  where status in ('searching','accepted','arrived','in_progress')
    and (
      (p_role='driver' and driver_id in (v_profile.device_id,v_profile.id::text)) or
      (p_role='passenger' and passenger_id in (v_profile.device_id,v_profile.id::text))
    );

  begin
    insert into public.admin_action_log(action,target_id,target_role,reason,admin_name,metadata,created_at)
    values('suspend_'||p_role,coalesce(v_profile.device_id,v_profile.id::text),p_role,trim(p_reason),p_admin_name,
      jsonb_build_object('suspended_until',p_until),now());
  exception when undefined_table or undefined_column then null;
  end;

  return v_profile;
end;
$$;

create or replace function public.admin_unsuspend_profile(
  p_person_id text,
  p_role text,
  p_admin_name text,
  p_admin_code text
)
returns public.profiles
language plpgsql
security definer
set search_path=public
as $$
declare
  v_profile public.profiles;
begin
  if p_admin_code is distinct from 'RUEDA2026' then
    raise exception using errcode='P0001',message='ADMIN_CODE_INVALID';
  end if;

  update public.profiles p
  set suspended_until=null,
      suspension_reason=null,
      suspended_at=null,
      suspended_by=null,
      updated_at=now()
  where p.role=p_role
    and (p.device_id=p_person_id or p.id::text=p_person_id)
  returning * into v_profile;

  if not found then
    raise exception using errcode='P0001',message='PROFILE_NOT_FOUND';
  end if;

  begin
    insert into public.admin_action_log(action,target_id,target_role,reason,admin_name,metadata,created_at)
    values('unsuspend_'||p_role,coalesce(v_profile.device_id,v_profile.id::text),p_role,'Suspensión levantada manualmente',p_admin_name,'{}'::jsonb,now());
  exception when undefined_table or undefined_column then null;
  end;

  return v_profile;
end;
$$;

-- Eliminación definitiva: perfil, viajes, reportes, eventos y archivos multimedia.
create or replace function public.admin_delete_person_permanently(
  p_person_id text,
  p_role text,
  p_reason text,
  p_admin_name text,
  p_admin_code text
)
returns jsonb
language plpgsql
security definer
set search_path=public,storage
as $$
declare
  v_profile public.profiles;
  v_device text;
  v_profile_id text;
  v_ride_ids text[];
  v_rides_count integer:=0;
  v_media_count integer:=0;
begin
  if p_admin_code is distinct from 'RUEDA2026' then
    raise exception using errcode='P0001',message='ADMIN_CODE_INVALID';
  end if;
  if nullif(trim(coalesce(p_reason,'')),'') is null then
    raise exception using errcode='P0001',message='DELETE_REASON_REQUIRED';
  end if;

  select * into v_profile
  from public.profiles p
  where p.role=p_role
    and (p.device_id=p_person_id or p.id::text=p_person_id)
  limit 1
  for update;

  if not found then
    raise exception using errcode='P0001',message='PROFILE_NOT_FOUND';
  end if;

  v_device:=coalesce(v_profile.device_id,p_person_id);
  v_profile_id:=v_profile.id::text;

  select coalesce(array_agg(id::text),array[]::text[]) into v_ride_ids
  from public.rides
  where (p_role='driver' and driver_id in (v_device,v_profile_id,p_person_id))
     or (p_role='passenger' and passenger_id in (v_device,v_profile_id,p_person_id));

  v_rides_count:=coalesce(array_length(v_ride_ids,1),0);

  if to_regclass('public.driver_reports') is not null then
    execute 'delete from public.driver_reports where '
      ||case when p_role='driver' then 'driver_id=any($1) or ride_id::text=any($2)'
             else 'passenger_id=any($1) or ride_id::text=any($2)' end
      using array[v_device,v_profile_id,p_person_id],v_ride_ids;
  end if;

  if to_regclass('public.ride_events') is not null then
    delete from public.ride_events where ride_id=any(v_ride_ids);
  end if;
  if to_regclass('public.ride_offer_attempts') is not null then
    delete from public.ride_offer_attempts where ride_id=any(v_ride_ids) or driver_id in (v_device,v_profile_id,p_person_id);
  end if;

  delete from public.rides
  where id::text=any(v_ride_ids);

  with deleted as (
    delete from storage.objects
    where bucket_id='sobre-ruedas-media'
      and (name like '%/'||v_device||'/%' or name like '%/'||v_profile_id||'/%')
    returning 1
  ) select count(*) into v_media_count from deleted;

  delete from public.profiles where id=v_profile.id;

  -- Se conserva solamente una auditoría técnica sin nombre, correo, teléfono ni foto.
  begin
    delete from public.admin_action_log where target_id in (v_device,v_profile_id,p_person_id);
    insert into public.admin_action_log(action,target_id,target_role,reason,admin_name,metadata,created_at)
    values('permanent_delete_'||p_role,'[eliminado]',p_role,trim(p_reason),p_admin_name,
      jsonb_build_object('rides_deleted',v_rides_count,'media_deleted',v_media_count),now());
  exception when undefined_table or undefined_column then null;
  end;

  return jsonb_build_object(
    'ok',true,
    'role',p_role,
    'rides_deleted',v_rides_count,
    'media_deleted',v_media_count
  );
end;
$$;

grant execute on function public.admin_suspend_profile(text,text,timestamptz,text,text,text) to anon,authenticated;
grant execute on function public.admin_unsuspend_profile(text,text,text,text) to anon,authenticated;
grant execute on function public.admin_delete_person_permanently(text,text,text,text,text) to anon,authenticated;

grant select,insert,update,delete on table public.profiles to anon,authenticated;
grant select,insert,update,delete on table public.rides to anon,authenticated;

-- Mantiene el modo beta por dispositivo de la plataforma actual.
alter table public.profiles enable row level security;
drop policy if exists beta_profiles on public.profiles;
create policy beta_profiles on public.profiles for all to anon,authenticated using(true) with check(true);

do $$ begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end $$;
alter table public.profiles replica identity full;
notify pgrst,'reload schema';
commit;
