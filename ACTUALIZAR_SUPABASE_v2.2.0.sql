-- Sobre Ruedas v2.2.0
-- Actualización segura: no borra datos existentes.
create extension if not exists pgcrypto;

alter table if exists public.rides add column if not exists rating numeric;
alter table if exists public.rides add column if not exists rating_comment text;
alter table if exists public.rides add column if not exists rated_at timestamptz;
alter table if exists public.rides add column if not exists canceled_at timestamptz;
alter table if exists public.rides add column if not exists canceled_by text;
alter table if exists public.rides add column if not exists driver_photo text;
alter table if exists public.rides add column if not exists driver_rating numeric default 5;
alter table if exists public.rides add column if not exists finished_at timestamptz;
alter table if exists public.rides add column if not exists updated_at timestamptz default now();

create index if not exists rides_status_idx on public.rides(status);
create index if not exists rides_passenger_id_idx on public.rides(passenger_id);
create index if not exists rides_driver_id_idx on public.rides(driver_id);
create index if not exists rides_created_at_idx on public.rides(created_at desc);

-- Mantiene updated_at al día sin borrar información.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rides_set_updated_at on public.rides;
create trigger rides_set_updated_at
before update on public.rides
for each row execute function public.set_updated_at();
