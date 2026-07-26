-- Sobre Ruedas v2.4.0 · Panel administrativo operativo y control de conductores
-- Migración segura e idempotente desde v2.2.0, v2.3.1, v2.3.2 o v2.3.3.
-- No borra viajes ni usuarios existentes.

begin;

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.rides') is null then
    raise exception 'No existe public.rides. Ejecuta primero el esquema base de Sobre Ruedas.';
  end if;
end
$$;

-- Completa la tabla de viajes sin eliminar información.
alter table public.rides add column if not exists passenger_id text;
alter table public.rides add column if not exists passenger_name text;
alter table public.rides add column if not exists driver_id text;
alter table public.rides add column if not exists driver_name text;
alter table public.rides add column if not exists pickup_address text;
alter table public.rides add column if not exists destination_address text;
alter table public.rides add column if not exists vehicle_type text;
alter table public.rides add column if not exists price numeric default 0;
alter table public.rides add column if not exists payment_method text default 'efectivo';
alter table public.rides add column if not exists status text default 'searching';
alter table public.rides add column if not exists rating numeric;
alter table public.rides add column if not exists rating_comment text;
alter table public.rides add column if not exists rated_at timestamptz;
alter table public.rides add column if not exists canceled_at timestamptz;
alter table public.rides add column if not exists canceled_by text;
alter table public.rides add column if not exists driver_photo text;
alter table public.rides add column if not exists driver_rating numeric default 5;
alter table public.rides add column if not exists driver_lat double precision;
alter table public.rides add column if not exists driver_lng double precision;
alter table public.rides add column if not exists accepted_at timestamptz;
alter table public.rides add column if not exists arrived_at timestamptz;
alter table public.rides add column if not exists started_at timestamptz;
alter table public.rides add column if not exists finished_at timestamptz;
alter table public.rides add column if not exists created_at timestamptz default now();
alter table public.rides add column if not exists updated_at timestamptz default now();

create index if not exists rides_status_idx on public.rides(status);
create index if not exists rides_passenger_id_idx on public.rides(passenger_id);
create index if not exists rides_driver_id_idx on public.rides(driver_id);
create index if not exists rides_created_at_idx on public.rides(created_at desc);
create index if not exists rides_rating_idx on public.rides(rating) where rating between 1 and 3;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rides_set_updated_at on public.rides;
create trigger rides_set_updated_at
before update on public.rides
for each row execute function public.set_updated_at();

-- Tablas administrativas compatibles con instalaciones anteriores.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid()
);
alter table public.profiles add column if not exists device_id text;
alter table public.profiles add column if not exists role text default 'passenger';
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists status text default 'active';
alter table public.profiles add column if not exists vehicle_type text;
alter table public.profiles add column if not exists vehicle_plate text;
alter table public.profiles add column if not exists rating numeric default 5;
alter table public.profiles add column if not exists approval_status text;
alter table public.profiles add column if not exists is_online boolean default false;
alter table public.profiles add column if not exists last_lat double precision;
alter table public.profiles add column if not exists last_lng double precision;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.profiles add column if not exists admin_note text;
alter table public.profiles add column if not exists approved_at timestamptz;
alter table public.profiles add column if not exists approved_by text;
alter table public.profiles add column if not exists deleted_at timestamptz;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- Conserva operativos los perfiles existentes. Los conductores nuevos se registran como pendientes desde la app.
update public.profiles
set approval_status=case when role='driver' then 'approved' else 'approved' end,
    updated_at=coalesce(updated_at,now())
where approval_status is null;
alter table public.profiles alter column approval_status set default 'pending';
update public.profiles set is_online=false where is_online is null;

create unique index if not exists profiles_device_id_uidx on public.profiles(device_id) where device_id is not null;
create index if not exists profiles_role_status_idx on public.profiles(role,status,approval_status);
create index if not exists profiles_online_idx on public.profiles(is_online,last_seen_at desc) where role='driver';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid()
);
alter table public.admin_users add column if not exists profile_id uuid;
alter table public.admin_users add column if not exists email text;
alter table public.admin_users add column if not exists role text default 'admin';
alter table public.admin_users add column if not exists admin_role text default 'supervisor';
alter table public.admin_users add column if not exists active boolean default true;
alter table public.admin_users add column if not exists created_at timestamptz default now();
create unique index if not exists admin_users_email_uidx on public.admin_users(email) where email is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.admin_users'::regclass
      and conname='admin_users_profile_id_fkey'
  ) then
    alter table public.admin_users
      add constraint admin_users_profile_id_fkey
      foreign key(profile_id) references public.profiles(id) on delete cascade;
  end if;
exception when foreign_key_violation then
  raise notice 'No se agregó la relación profile_id porque hay datos antiguos incompatibles.';
end
$$;

create table if not exists public.fare_settings (
  vehicle_type text primary key,
  base_fare numeric not null default 0,
  per_km numeric not null default 0,
  minimum_fare numeric not null default 0,
  active boolean default true,
  updated_at timestamptz default now()
);

insert into public.fare_settings(vehicle_type,base_fare,per_km,minimum_fare)
values
  ('Motorina',0,38,0),
  ('Moto',0,45,0),
  ('Bicitaxi',0,28,0),
  ('Triciclo',0,48,0)
on conflict(vehicle_type) do update set
  base_fare=0,
  minimum_fare=0,
  active=true,
  updated_at=now();

create table if not exists public.ride_events (
  id bigint generated by default as identity primary key,
  ride_id text,
  event_type text not null,
  actor_role text,
  actor_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id bigint generated by default as identity primary key,
  ride_id text,
  reporter_id text,
  reporter_role text,
  category text,
  description text,
  status text default 'open',
  assigned_admin uuid,
  resolution_notes text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Módulo funcional de reportes de conductores.
create table if not exists public.driver_reports (
  id uuid primary key default gen_random_uuid(),
  ride_id text,
  driver_id text,
  driver_name text,
  passenger_id text,
  passenger_name text,
  rating integer,
  passenger_comment text,
  reviewed boolean not null default false,
  reviewed_at timestamptz,
  reviewed_by text,
  risk_level text not null default 'green',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.driver_reports add column if not exists ride_id text;
alter table public.driver_reports add column if not exists driver_id text;
alter table public.driver_reports add column if not exists driver_name text;
alter table public.driver_reports add column if not exists passenger_id text;
alter table public.driver_reports add column if not exists passenger_name text;
alter table public.driver_reports add column if not exists rating integer;
alter table public.driver_reports add column if not exists passenger_comment text;
alter table public.driver_reports add column if not exists reviewed boolean default false;
alter table public.driver_reports add column if not exists reviewed_at timestamptz;
alter table public.driver_reports add column if not exists reviewed_by text;
alter table public.driver_reports add column if not exists risk_level text default 'green';
alter table public.driver_reports add column if not exists created_at timestamptz default now();
alter table public.driver_reports add column if not exists updated_at timestamptz default now();

-- Corrige la v2.3.1, que podía crear driver_id como uuid aunque la app usa device_... (texto).
do $$
declare
  column_type text;
begin
  select data_type into column_type
  from information_schema.columns
  where table_schema='public' and table_name='driver_reports' and column_name='driver_id';
  if column_type is not null and column_type <> 'text' then
    execute 'alter table public.driver_reports alter column driver_id type text using driver_id::text';
  end if;

  select data_type into column_type
  from information_schema.columns
  where table_schema='public' and table_name='driver_reports' and column_name='ride_id';
  if column_type is not null and column_type <> 'text' then
    execute 'alter table public.driver_reports alter column ride_id type text using ride_id::text';
  end if;

  select data_type into column_type
  from information_schema.columns
  where table_schema='public' and table_name='driver_reports' and column_name='passenger_id';
  if column_type is not null and column_type <> 'text' then
    execute 'alter table public.driver_reports alter column passenger_id type text using passenger_id::text';
  end if;
end
$$;

-- Migra el nombre de columna trip_id usado por una versión anterior.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='driver_reports' and column_name='trip_id'
  ) then
    execute 'update public.driver_reports set ride_id=trip_id::text where ride_id is null and trip_id is not null';
  end if;
end
$$;

update public.driver_reports set reviewed=false where reviewed is null;
update public.driver_reports set risk_level='green' where risk_level is null or risk_level not in ('green','yellow','red');
update public.driver_reports set updated_at=coalesce(updated_at,created_at,now());

-- Conserva solo un reporte por viaje si alguna prueba creó duplicados.
with ranked as (
  select id,row_number() over(
    partition by ride_id
    order by reviewed desc,updated_at desc nulls last,created_at desc nulls last,id
  ) as rn
  from public.driver_reports
  where ride_id is not null
)
delete from public.driver_reports report
using ranked
where report.id=ranked.id and ranked.rn>1;

create unique index if not exists driver_reports_ride_uidx on public.driver_reports(ride_id);
create index if not exists driver_reports_driver_idx on public.driver_reports(driver_id);
create index if not exists driver_reports_reviewed_idx on public.driver_reports(reviewed,created_at desc);
create index if not exists driver_reports_rating_idx on public.driver_reports(rating);

-- Importa todas las calificaciones bajas que ya existen en rides.
insert into public.driver_reports(
  ride_id,driver_id,driver_name,passenger_id,passenger_name,
  rating,passenger_comment,created_at,updated_at
)
select
  ride.id::text,
  nullif(ride.driver_id::text,''),
  ride.driver_name,
  nullif(ride.passenger_id::text,''),
  ride.passenger_name,
  round(ride.rating)::integer,
  ride.rating_comment,
  coalesce(ride.rated_at,ride.created_at,now()),
  now()
from public.rides ride
where ride.rating between 1 and 3
  and ride.driver_id is not null
  and ride.driver_id::text<>''
on conflict(ride_id) do update set
  driver_id=excluded.driver_id,
  driver_name=excluded.driver_name,
  passenger_id=excluded.passenger_id,
  passenger_name=excluded.passenger_name,
  rating=excluded.rating,
  passenger_comment=excluded.passenger_comment,
  updated_at=now();

create or replace function public.refresh_driver_report_risk(p_driver_id text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  report_count integer;
  new_level text;
begin
  if p_driver_id is null or p_driver_id='' then
    return;
  end if;

  select count(*) into report_count
  from public.driver_reports
  where driver_id=p_driver_id and rating between 1 and 3;

  new_level:=case
    when report_count>=5 then 'red'
    when report_count>=3 then 'yellow'
    else 'green'
  end;

  update public.driver_reports
  set risk_level=new_level,updated_at=now()
  where driver_id=p_driver_id and risk_level is distinct from new_level;
end;
$$;

create or replace function public.driver_reports_refresh_risk_trigger()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if tg_op='DELETE' then
    perform public.refresh_driver_report_risk(old.driver_id);
    return old;
  end if;

  perform public.refresh_driver_report_risk(new.driver_id);
  if tg_op='UPDATE' and old.driver_id is distinct from new.driver_id then
    perform public.refresh_driver_report_risk(old.driver_id);
  end if;
  return new;
end;
$$;

drop trigger if exists driver_reports_refresh_risk on public.driver_reports;
create trigger driver_reports_refresh_risk
after insert or delete or update of driver_id,rating on public.driver_reports
for each row execute function public.driver_reports_refresh_risk_trigger();

create or replace function public.sync_low_rating_driver_report()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.rating between 1 and 3
    and new.driver_id is not null
    and new.driver_id::text<>'' then
    insert into public.driver_reports(
      ride_id,driver_id,driver_name,passenger_id,passenger_name,
      rating,passenger_comment,created_at,updated_at
    ) values (
      new.id::text,new.driver_id::text,new.driver_name,
      new.passenger_id::text,new.passenger_name,
      round(new.rating)::integer,new.rating_comment,
      coalesce(new.rated_at,new.created_at,now()),now()
    )
    on conflict(ride_id) do update set
      driver_id=excluded.driver_id,
      driver_name=excluded.driver_name,
      passenger_id=excluded.passenger_id,
      passenger_name=excluded.passenger_name,
      rating=excluded.rating,
      passenger_comment=excluded.passenger_comment,
      updated_at=now();
  elsif tg_op='UPDATE' then
    if old.rating between 1 and 3
      and (new.rating is null or new.rating>3) then
      delete from public.driver_reports where ride_id=new.id::text;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_low_rating_report on public.rides;
create trigger trg_sync_low_rating_report
after insert or update of rating,rating_comment,rated_at,driver_id,driver_name,passenger_id,passenger_name
on public.rides
for each row execute function public.sync_low_rating_driver_report();

drop trigger if exists driver_reports_set_updated_at on public.driver_reports;
create trigger driver_reports_set_updated_at
before update on public.driver_reports
for each row execute function public.set_updated_at();

-- Calcula el riesgo inicial después de importar el historial.
do $$
declare
  driver record;
begin
  for driver in select distinct driver_id from public.driver_reports where driver_id is not null loop
    perform public.refresh_driver_report_risk(driver.driver_id);
  end loop;
end
$$;

-- Permisos temporales para la beta web.
grant select,insert,update on table public.rides to anon,authenticated;
grant select,insert,update,delete on table public.profiles to anon,authenticated;
grant select on table public.admin_users to anon,authenticated;
grant select,insert,update on table public.fare_settings to anon,authenticated;
grant select,insert,update on table public.ride_events to anon,authenticated;
grant select,insert,update,delete on table public.reports to anon,authenticated;
grant select,insert,update,delete on table public.driver_reports to anon,authenticated;
grant usage,select on all sequences in schema public to anon,authenticated;

alter table public.rides enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.fare_settings enable row level security;
alter table public.ride_events enable row level security;
alter table public.reports enable row level security;
alter table public.driver_reports enable row level security;

drop policy if exists rides_read_test on public.rides;
drop policy if exists rides_insert_test on public.rides;
drop policy if exists rides_update_test on public.rides;
create policy rides_read_test on public.rides for select to anon,authenticated using(true);
create policy rides_insert_test on public.rides for insert to anon,authenticated with check(true);
create policy rides_update_test on public.rides for update to anon,authenticated using(true) with check(true);

drop policy if exists beta_profiles on public.profiles;
create policy beta_profiles on public.profiles for all to anon,authenticated using(true) with check(true);

drop policy if exists beta_admins_read on public.admin_users;
create policy beta_admins_read on public.admin_users for select to anon,authenticated using(true);

drop policy if exists beta_fares on public.fare_settings;
create policy beta_fares on public.fare_settings for all to anon,authenticated using(true) with check(true);

drop policy if exists beta_events on public.ride_events;
create policy beta_events on public.ride_events for all to anon,authenticated using(true) with check(true);

drop policy if exists beta_reports on public.reports;
create policy beta_reports on public.reports for all to anon,authenticated using(true) with check(true);

drop policy if exists beta_driver_reports on public.driver_reports;
create policy beta_driver_reports on public.driver_reports for all to anon,authenticated using(true) with check(true);

-- Realtime administrativo.
do $$
begin
  alter publication supabase_realtime add table public.fare_settings;
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.driver_reports;
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end
$$;

notify pgrst,'reload schema';

commit;
