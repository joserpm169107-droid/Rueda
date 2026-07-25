alter table public.rides add column if not exists driver_photo text;
alter table public.rides add column if not exists driver_rating numeric default 5;
alter table public.rides add column if not exists rating integer;
alter table public.rides add column if not exists rating_comment text;
alter table public.rides add column if not exists rated_at timestamptz;
alter table public.rides add column if not exists canceled_at timestamptz;
alter table public.rides add column if not exists canceled_by text;
alter table public.rides add column if not exists driver_lat double precision;
alter table public.rides add column if not exists driver_lng double precision;