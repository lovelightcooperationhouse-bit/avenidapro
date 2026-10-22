-- Le gestionnaire du site peut prévenir les membres lors d'une publication (pas tout l'établissement)
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
  if me not in ('directeur_general', 'directeur_pedagogique', 'comptable', 'ressources_humaines', 'responsable_hotel', 'gestionnaire_site') then
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

-- Invitations : le rôle « gestionnaire du site » est reconnu à la création du compte
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv record;
  mapped text;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := coalesce(meta->>'full_name', meta->>'name');
begin
  select * into inv from public.user_invitations
   where lower(email) = lower(new.email) and status = 'pending'
   order by created_at desc limit 1;

  mapped := case coalesce(inv.role_code, '')
    when 'direction' then 'directeur_general'
    when 'directeur_general' then 'directeur_general'
    when 'responsable_pedagogique' then 'directeur_pedagogique'
    when 'directeur_pedagogique' then 'directeur_pedagogique'
    when 'comptable' then 'comptable'
    when 'rh' then 'ressources_humaines'
    when 'ressources_humaines' then 'ressources_humaines'
    when 'hotel' then 'responsable_hotel'
    when 'responsable_hotel' then 'responsable_hotel'
    when 'personnel' then 'personnel'
    when 'professeur' then 'professeur'
    when 'eleve' then 'eleve'
    when 'parent' then 'parent'
    when 'client' then 'client'
    when 'gestionnaire_site' then 'gestionnaire_site'
    else 'candidat'
  end;

  insert into public.profiles (id, email, first_name, last_name, role, is_active)
  values (
    new.id, new.email,
    coalesce(inv.first_name, meta->>'first_name', meta->>'given_name', split_part(full_name, ' ', 1)),
    coalesce(inv.last_name, meta->>'last_name', meta->>'family_name', nullif(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), '')),
    mapped, true
  )
  on conflict (id) do nothing;

  if inv.id is not null then
    update public.user_invitations set status = 'accepted' where id = inv.id;
  end if;
  return new;
end $$;
