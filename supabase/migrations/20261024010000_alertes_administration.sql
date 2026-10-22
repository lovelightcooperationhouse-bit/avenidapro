-- Alertes de l'administration : un message envoyé à un public ciblé
-- (tout le monde, un rôle, une filière, une classe ou une personne), livré dans l'espace
-- de chacun (cloche + page Notifications) et, au choix, par e-mail et SMS.

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  audience text not null check (audience in ('tous', 'role', 'filiere', 'classe', 'personne')),
  target text,
  title text not null,
  body text,
  link text,
  priority text not null default 'info' check (priority in ('info', 'important', 'urgent')),
  by_email boolean not null default true,
  by_sms boolean not null default false,
  recipients int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.alerts enable row level security;
drop policy if exists staff_select on public.alerts;
create policy staff_select on public.alerts for select to authenticated
  using (public.app_role() in ('directeur_general', 'directeur_pedagogique', 'comptable', 'ressources_humaines', 'responsable_hotel'));

create or replace function public.send_alert(
  p_audience text, p_target text, p_title text, p_body text, p_link text,
  p_priority text default 'info', p_email boolean default true, p_sms boolean default false
) returns int language plpgsql security definer set search_path = public as $$
declare
  me text := public.app_role();
  ids uuid[];
  n int;
  t text := case p_priority when 'urgent' then 'URGENT · ' when 'important' then 'Important · ' else '' end || trim(p_title);
begin
  if me not in ('directeur_general', 'directeur_pedagogique', 'comptable', 'ressources_humaines', 'responsable_hotel') then
    raise exception 'Envoi d''alertes réservé à l''administration' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Titre obligatoire'; end if;
  -- Seule la direction générale peut écrire à tout l'établissement
  if p_audience = 'tous' and me <> 'directeur_general' then
    raise exception 'Seule la direction générale peut écrire à tout l''établissement' using errcode = '42501';
  end if;

  if p_audience = 'tous' then
    select array_agg(id) into ids from public.profiles where is_active is not false;
  elsif p_audience = 'role' then
    select array_agg(id) into ids from public.profiles where is_active is not false and role = p_target;
  elsif p_audience in ('filiere', 'classe') then
    -- Élèves concernés et leurs parents
    with st as (
      select id from public.students
       where status = 'actif'
         and ((p_audience = 'filiere' and program_code = p_target) or (p_audience = 'classe' and class_name = p_target))
    )
    select array_agg(distinct pid) into ids from (
      select p.id pid from public.profiles p join st on p.student_id = st.id where p.role = 'eleve' and p.is_active is not false
      union
      select ps.parent_id from public.parent_students ps join st on ps.student_id = st.id
    ) x;
  elsif p_audience = 'personne' then
    select array_agg(id) into ids from public.profiles where id = public.try_uuid(p_target);
  else
    raise exception 'Public inconnu : %', p_audience;
  end if;

  insert into public.notifications (profile_id, kind, title, body, link, email_status, sms_status)
  select pid, 'alerte', t, nullif(trim(p_body), ''), coalesce(nullif(trim(p_link), ''), '/espace/notifications'),
         case when p_email then 'pending' else 'skipped' end,
         case when p_sms then 'pending' else 'skipped' end
    from unnest(coalesce(ids, '{}')) pid;
  get diagnostics n = row_count;

  insert into public.alerts (created_by, audience, target, title, body, link, priority, by_email, by_sms, recipients)
  values (auth.uid(), p_audience, p_target, trim(p_title), nullif(trim(p_body), ''), nullif(trim(p_link), ''), p_priority, p_email, p_sms, n);
  return n;
end $$;

revoke execute on function public.send_alert(text, text, text, text, text, text, boolean, boolean) from public, anon;
grant execute on function public.send_alert(text, text, text, text, text, text, boolean, boolean) to authenticated;
