-- Sobre Ruedas v2.3.2
-- Compatibilidad de columnas de viajes. Para una actualización completa usa
-- ACTUALIZAR_SUPABASE_v2.3.2.sql.

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
alter table public.rides add column if not exists driver_photo text;
alter table public.rides add column if not exists driver_rating numeric default 5;
alter table public.rides add column if not exists rating numeric;
alter table public.rides add column if not exists rating_comment text;
alter table public.rides add column if not exists rated_at timestamptz;
alter table public.rides add column if not exists canceled_at timestamptz;
alter table public.rides add column if not exists canceled_by text;
alter table public.rides add column if not exists driver_lat double precision;
alter table public.rides add column if not exists driver_lng double precision;
alter table public.rides add column if not exists accepted_at timestamptz;
alter table public.rides add column if not exists arrived_at timestamptz;
alter table public.rides add column if not exists started_at timestamptz;
alter table public.rides add column if not exists finished_at timestamptz;
alter table public.rides add column if not exists created_at timestamptz default now();
alter table public.rides add column if not exists updated_at timestamptz default now();
