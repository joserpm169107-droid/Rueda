-- Sobre Ruedas: permisos temporales para la prueba de dos teléfonos
-- Ejecutar una sola vez en Supabase SQL Editor.

grant select, insert, update on table public.rides to anon;
grant select, insert, update on table public.rides to authenticated;

drop policy if exists "rides_read_test" on public.rides;
drop policy if exists "rides_insert_test" on public.rides;
drop policy if exists "rides_update_test" on public.rides;

create policy "rides_read_test"
on public.rides
for select
to anon, authenticated
using (true);

create policy "rides_insert_test"
on public.rides
for insert
to anon, authenticated
with check (true);

create policy "rides_update_test"
on public.rides
for update
to anon, authenticated
using (true)
with check (true);
