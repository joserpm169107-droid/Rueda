-- Sobre Ruedas v2.4.0 · Permisos temporales para la beta web
-- Ejecutar una sola vez en Supabase SQL Editor.

alter table if exists public.rides enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.fare_settings enable row level security;
alter table if exists public.driver_reports enable row level security;
alter table if exists public.reports enable row level security;

grant select,insert,update on table public.rides to anon,authenticated;
grant select,insert,update,delete on table public.profiles to anon,authenticated;
grant select,insert,update on table public.fare_settings to anon,authenticated;
grant select,insert,update,delete on table public.driver_reports to anon,authenticated;
grant select,insert,update,delete on table public.reports to anon,authenticated;
grant usage,select on all sequences in schema public to anon,authenticated;

drop policy if exists rides_read_test on public.rides;
drop policy if exists rides_insert_test on public.rides;
drop policy if exists rides_update_test on public.rides;
create policy rides_read_test on public.rides for select to anon,authenticated using(true);
create policy rides_insert_test on public.rides for insert to anon,authenticated with check(true);
create policy rides_update_test on public.rides for update to anon,authenticated using(true) with check(true);

drop policy if exists beta_profiles on public.profiles;
create policy beta_profiles on public.profiles for all to anon,authenticated using(true) with check(true);

drop policy if exists beta_fares on public.fare_settings;
create policy beta_fares on public.fare_settings for all to anon,authenticated using(true) with check(true);

drop policy if exists beta_driver_reports on public.driver_reports;
create policy beta_driver_reports on public.driver_reports for all to anon,authenticated using(true) with check(true);

drop policy if exists beta_reports on public.reports;
create policy beta_reports on public.reports for all to anon,authenticated using(true) with check(true);

notify pgrst,'reload schema';
