-- Sobre Ruedas v2.9.0
-- Rediseño integral + corrección verificable de soporte y eliminación de cuentas.
-- Ejecutar UNA sola vez después de v2.8.0.

begin;
create extension if not exists pgcrypto;

-- Campos necesarios para la ficha profesional del vehículo y soporte.
alter table public.profiles add column if not exists vehicle_description text;
alter table public.profiles add column if not exists vehicle_verified boolean not null default false;
alter table public.profiles add column if not exists vehicle_verified_at timestamptz;
alter table public.profiles add column if not exists vehicle_verified_by text;
alter table public.support_cases add column if not exists created_by_name text;
alter table public.support_cases add column if not exists source text not null default 'app';
alter table public.support_cases add column if not exists last_message_at timestamptz default now();

create index if not exists support_cases_admin_v290_idx
  on public.support_cases(status,priority,last_message_at desc,created_at desc);

-- Reportes: crea el caso, crea el primer mensaje y confirma la fila realmente guardada.
create or replace function public.create_support_case_v290(
  p_creator_id text,
  p_creator_role text,
  p_ride_id text,
  p_category text,
  p_subject text,
  p_description text,
  p_priority text default 'normal'
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_case public.support_cases;
  v_name text;
begin
  if p_creator_role not in ('passenger','driver') then
    raise exception using errcode='P0001',message='SUPPORT_ROLE_INVALID';
  end if;
  if nullif(trim(coalesce(p_creator_id,'')),'') is null then
    raise exception using errcode='P0001',message='SUPPORT_CREATOR_REQUIRED';
  end if;
  if nullif(trim(coalesce(p_category,'')),'') is null
     or length(trim(coalesce(p_description,''))) < 8 then
    raise exception using errcode='P0001',message='SUPPORT_DETAILS_REQUIRED';
  end if;

  select full_name into v_name
  from public.profiles
  where role=p_creator_role
    and (device_id=p_creator_id or id::text=p_creator_id)
  order by updated_at desc nulls last
  limit 1;

  insert into public.support_cases(
    created_by_id,created_by_role,created_by_name,related_ride_id,
    category,subject,description,priority,status,source,
    created_at,updated_at,last_message_at
  ) values (
    trim(p_creator_id),p_creator_role,v_name,nullif(trim(coalesce(p_ride_id,'')),''),
    trim(p_category),coalesce(nullif(trim(coalesce(p_subject,'')),''),trim(p_category)),
    trim(p_description),case when p_priority in ('normal','high','emergency') then p_priority else 'normal' end,
    'open','app',now(),now(),now()
  ) returning * into v_case;

  insert into public.support_messages(case_id,sender_id,sender_role,message,created_at)
  values(v_case.id,trim(p_creator_id),p_creator_role,trim(p_description),now());

  if nullif(trim(coalesce(p_ride_id,'')),'') is not null then
    update public.rides set support_flag=true,updated_at=now() where id::text=trim(p_ride_id);
  end if;

  if not exists(select 1 from public.support_cases where id=v_case.id) then
    raise exception using errcode='P0001',message='SUPPORT_CASE_NOT_PERSISTED';
  end if;

  return to_jsonb(v_case);
end;
$$;

-- Compatibilidad: las versiones anteriores pasan por la función corregida.
create or replace function public.create_support_case_v280(
  p_creator_id text,p_creator_role text,p_ride_id text,p_category text,
  p_subject text,p_description text,p_priority text default 'normal'
)
returns jsonb
language sql
security definer
set search_path=public
as $$
  select public.create_support_case_v290($1,$2,$3,$4,$5,$6,$7)
$$;

-- Eliminación definitiva transaccional y verificable.
create or replace function public.admin_delete_account_v290(
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
  v_keys text[];
  v_ride_ids text[];
  v_case_ids uuid[];
  v_rides_count integer:=0;
  v_media_count integer:=0;
  v_fk record;
begin
  if p_admin_code is distinct from 'RUEDA2026' then
    raise exception using errcode='P0001',message='ADMIN_CODE_INVALID';
  end if;
  if p_role not in ('driver','passenger') then
    raise exception using errcode='P0001',message='ROLE_INVALID';
  end if;
  if nullif(trim(coalesce(p_reason,'')),'') is null then
    raise exception using errcode='P0001',message='DELETE_REASON_REQUIRED';
  end if;

  select * into v_profile
  from public.profiles
  where role=p_role and (id::text=p_person_id or device_id=p_person_id)
  order by updated_at desc nulls last
  limit 1
  for update;

  if not found then
    if exists(select 1 from public.deleted_accounts where role=p_role and device_id=p_person_id) then
      return jsonb_build_object('ok',true,'already_deleted',true,'rides_deleted',0,'media_deleted',0);
    end if;
    raise exception using errcode='P0001',message='PROFILE_NOT_FOUND';
  end if;

  v_keys:=array_remove(array[v_profile.id::text,v_profile.device_id],null);
  select coalesce(array_agg(id::text),array[]::text[]) into v_ride_ids
  from public.rides
  where (p_role='driver' and driver_id::text=any(v_keys))
     or (p_role='passenger' and passenger_id::text=any(v_keys));
  v_rides_count:=coalesce(array_length(v_ride_ids,1),0);

  insert into public.deleted_accounts(device_id,role,email_hash,phone_hash,reason,deleted_by,deleted_at)
  values(
    coalesce(v_profile.device_id,v_profile.id::text),p_role,
    case when nullif(trim(coalesce(v_profile.email,'')),'') is null then null else public.sr_hash_contact_v280(v_profile.email) end,
    case when nullif(trim(coalesce(v_profile.phone,'')),'') is null then null else public.sr_hash_contact_v280(v_profile.phone) end,
    trim(p_reason),coalesce(nullif(trim(p_admin_name),''),'administración'),now()
  )
  on conflict(device_id,role) do update set
    reason=excluded.reason,deleted_by=excluded.deleted_by,deleted_at=excluded.deleted_at,
    email_hash=coalesce(excluded.email_hash,public.deleted_accounts.email_hash),
    phone_hash=coalesce(excluded.phone_hash,public.deleted_accounts.phone_hash);

  select coalesce(array_agg(id),array[]::uuid[]) into v_case_ids
  from public.support_cases
  where created_by_id=any(v_keys) or related_ride_id=any(v_ride_ids);

  delete from public.support_messages where case_id=any(v_case_ids);
  delete from public.support_cases where id=any(v_case_ids);
  delete from public.ride_messages where ride_id=any(v_ride_ids) or sender_id=any(v_keys);
  if to_regclass('public.driver_reports') is not null then
    delete from public.driver_reports
    where ride_id=any(v_ride_ids)
       or (p_role='driver' and driver_id=any(v_keys))
       or (p_role='passenger' and passenger_id=any(v_keys));
  end if;

  -- Tablas auxiliares conocidas, cuando existan.
  if to_regclass('public.ride_events') is not null then
    execute 'delete from public.ride_events where ride_id::text=any($1) or actor_id::text=any($2)' using v_ride_ids,v_keys;
  end if;
  if to_regclass('public.ride_offer_attempts') is not null then
    execute 'delete from public.ride_offer_attempts where ride_id::text=any($1) or driver_id::text=any($2)' using v_ride_ids,v_keys;
  end if;

  -- Borra dependencias simples que apunten a rides y que no hayan sido tratadas arriba.
  for v_fk in
    select ns.nspname schema_name,cl.relname table_name,att.attname column_name
    from pg_constraint con
    join pg_class cl on cl.oid=con.conrelid
    join pg_namespace ns on ns.oid=cl.relnamespace
    join unnest(con.conkey) ck(attnum) on true
    join pg_attribute att on att.attrelid=con.conrelid and att.attnum=ck.attnum
    where con.contype='f' and con.confrelid='public.rides'::regclass
      and array_length(con.conkey,1)=1
      and cl.relname not in ('support_cases','ride_messages','driver_reports')
  loop
    begin
      execute format('delete from %I.%I where %I::text=any($1)',v_fk.schema_name,v_fk.table_name,v_fk.column_name) using v_ride_ids;
    exception when others then null;
    end;
  end loop;

  delete from public.rides where id::text=any(v_ride_ids);

  begin
    select count(*) into v_media_count from storage.objects
    where bucket_id='sobre-ruedas-media' and (
      name like '%'||v_profile.id::text||'%' or
      (v_profile.device_id is not null and name like '%'||v_profile.device_id||'%')
    );
    delete from storage.objects where bucket_id='sobre-ruedas-media' and (
      name like '%'||v_profile.id::text||'%' or
      (v_profile.device_id is not null and name like '%'||v_profile.device_id||'%')
    );
  exception when others then v_media_count:=0;
  end;

  delete from public.profiles where id=v_profile.id;
  if exists(select 1 from public.profiles where id=v_profile.id) then
    raise exception using errcode='P0001',message='PROFILE_DELETE_NOT_CONFIRMED';
  end if;

  begin
    insert into public.admin_action_log(action,target_id,target_role,reason,admin_name,metadata,created_at)
    values('permanent_delete_'||p_role,'[eliminado]',p_role,trim(p_reason),p_admin_name,
      jsonb_build_object('rides_deleted',v_rides_count,'media_deleted',v_media_count),now());
  exception when others then null;
  end;

  return jsonb_build_object('ok',true,'role',p_role,'rides_deleted',v_rides_count,'media_deleted',v_media_count);
end;
$$;

-- Compatibilidad para botones de versiones anteriores.
create or replace function public.admin_delete_account_v280(
  p_person_id text,p_role text,p_reason text,p_admin_name text,p_admin_code text
)
returns jsonb
language sql
security definer
set search_path=public
as $$
  select public.admin_delete_account_v290($1,$2,$3,$4,$5)
$$;

grant execute on function public.create_support_case_v290(text,text,text,text,text,text,text) to anon,authenticated;
grant execute on function public.create_support_case_v280(text,text,text,text,text,text,text) to anon,authenticated;
grant execute on function public.admin_delete_account_v290(text,text,text,text,text) to anon,authenticated;
grant execute on function public.admin_delete_account_v280(text,text,text,text,text) to anon,authenticated;
grant select,insert,update,delete on public.support_cases,public.support_messages,public.ride_messages to anon,authenticated;
grant usage,select on all sequences in schema public to anon,authenticated;

alter table public.support_cases enable row level security;
alter table public.support_messages enable row level security;
drop policy if exists beta_support_cases_v290 on public.support_cases;
create policy beta_support_cases_v290 on public.support_cases for all to anon,authenticated using(true) with check(true);
drop policy if exists beta_support_messages_v290 on public.support_messages;
create policy beta_support_messages_v290 on public.support_messages for all to anon,authenticated using(true) with check(true);

do $$ begin alter publication supabase_realtime add table public.support_cases; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.support_messages; exception when duplicate_object then null; end $$;
alter table public.support_cases replica identity full;
alter table public.support_messages replica identity full;
notify pgrst,'reload schema';
commit;
