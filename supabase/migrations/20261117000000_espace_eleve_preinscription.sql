-- ════════════════════════════════════════════════════════════════════════════
-- Mon espace → « Élève / étudiant(e) » = pré-inscription
--   Le dossier rempli dans l'espace (filière, identité, parcours, tuteur) devient automatiquement une
--   pré-inscription dans la liste des pré-inscrits (Admissions), rattachée au compte. Dès que l'école
--   valide l'inscription, l'élève a sa fiche d'inscription, son matricule et son espace élève.
-- ════════════════════════════════════════════════════════════════════════════
alter table public.applications add column if not exists member_application_id uuid unique references public.member_applications(id) on delete set null;
alter table public.applications add column if not exists profile_id uuid references public.profiles(id) on delete set null;

create or replace function public.sync_member_preinscription(m public.member_applications)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  d jsonb := coalesce(m.data, '{}'::jsonb);
  mail text;
  app public.applications;
  v_program text := upper(coalesce(d->>'program_code', ''));
  v_phone text := coalesce(nullif(trim(d->>'phone'), ''), nullif(trim(d->>'tutor_phone'), ''));
begin
  if m.kind <> 'eleve' or m.status = 'brouillon' then return null; end if;
  select email into mail from public.profiles where id = m.profile_id;
  -- Informations minimales d'une pré-inscription
  if mail is null or v_program not in ('CFA', 'CAP', 'BEP', 'BT', 'BTS', 'MODULAIRE') or coalesce(trim(d->>'first_name'), '') = ''
     or coalesce(trim(d->>'last_name'), '') = '' or char_length(coalesce(v_phone, '')) < 6 then
    return null;
  end if;

  -- Pré-inscription déjà liée à ce dossier, sinon celle déposée sur le site avec la même adresse e-mail
  select * into app from public.applications where member_application_id = m.id;
  if app.id is null then
    select * into app from public.applications
     where lower(email) = lower(mail) and member_application_id is null and student_id is null and status not in ('refusee', 'inscrite')
     order by created_at desc limit 1;
  end if;

  if app.id is null then
    insert into public.applications (status, program_code, specialty, intake, schedule, boarding, first_name, last_name, gender, birth_date, birth_place,
      nationality, neighborhood, phone, email, last_class, last_diploma, previous_school, guardian_name, guardian_phone, guardian_relation,
      guardian_profession, emergency_name, emergency_phone, staff_notes, member_application_id, profile_id)
    values ('nouvelle', v_program, coalesce(nullif(d->>'specialty', ''), 'À préciser'), coalesce(nullif(d->>'intake', ''), 'À préciser'),
      case when d->>'schedule' ilike '%soir%' then 'soir' else 'jour' end, coalesce(d->>'boarding', '') = 'interne',
      left(initcap(trim(d->>'first_name')), 80), left(upper(trim(d->>'last_name')), 80),
      case when d->>'gender' in ('F', 'M') then d->>'gender' end, nullif(d->>'birth_date', '')::date, d->>'birth_place',
      coalesce(nullif(d->>'nationality', ''), 'Togolaise'), d->>'neighborhood', left(v_phone, 30), lower(mail),
      d->>'last_class', d->>'last_diploma', d->>'previous_school',
      coalesce(nullif(d->>'tutor_name', ''), nullif(d->>'father_name', ''), nullif(d->>'mother_name', '')),
      coalesce(nullif(d->>'tutor_phone', ''), nullif(d->>'father_phone', ''), nullif(d->>'mother_phone', '')),
      d->>'tutor_relation', coalesce(nullif(d->>'tutor_profession', ''), nullif(d->>'father_profession', '')),
      d->>'emergency_name', d->>'emergency_phone',
      'Pré-inscription déposée depuis l''espace élève (photo et pièces dans le dossier du compte).', m.id, m.profile_id)
    returning * into app;
  elsif app.status in ('nouvelle', 'en_etude', 'pieces_manquantes') then
    -- Dossier encore à l'étude : il suit les mises à jour faites par l'élève dans son espace
    update public.applications
       set member_application_id = m.id, profile_id = m.profile_id,
           program_code = v_program, specialty = coalesce(nullif(d->>'specialty', ''), specialty), intake = coalesce(nullif(d->>'intake', ''), intake),
           schedule = case when d->>'schedule' ilike '%soir%' then 'soir' when d->>'schedule' is not null then 'jour' else schedule end,
           boarding = case when d ? 'boarding' then d->>'boarding' = 'interne' else boarding end,
           first_name = left(initcap(trim(d->>'first_name')), 80), last_name = left(upper(trim(d->>'last_name')), 80),
           gender = coalesce(case when d->>'gender' in ('F', 'M') then d->>'gender' end, gender),
           birth_date = coalesce(nullif(d->>'birth_date', '')::date, birth_date), birth_place = coalesce(nullif(d->>'birth_place', ''), birth_place),
           nationality = coalesce(nullif(d->>'nationality', ''), nationality), neighborhood = coalesce(nullif(d->>'neighborhood', ''), neighborhood),
           phone = left(v_phone, 30), last_class = coalesce(nullif(d->>'last_class', ''), last_class),
           last_diploma = coalesce(nullif(d->>'last_diploma', ''), last_diploma), previous_school = coalesce(nullif(d->>'previous_school', ''), previous_school),
           guardian_name = coalesce(nullif(d->>'tutor_name', ''), guardian_name), guardian_phone = coalesce(nullif(d->>'tutor_phone', ''), guardian_phone),
           guardian_relation = coalesce(nullif(d->>'tutor_relation', ''), guardian_relation),
           emergency_name = coalesce(nullif(d->>'emergency_name', ''), emergency_name), emergency_phone = coalesce(nullif(d->>'emergency_phone', ''), emergency_phone)
     where id = app.id;
  else
    update public.applications set member_application_id = m.id, profile_id = m.profile_id where id = app.id and member_application_id is null;
  end if;
  return app.id;
end $$;
revoke execute on function public.sync_member_preinscription(public.member_applications) from public, anon, authenticated;

create or replace function public.on_member_application_preinscription()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.sync_member_preinscription(new);
  -- Élève inscrit par la voie des adhésions : la pré-inscription liée passe « inscrite »
  if new.student_id is not null then
    update public.applications set student_id = new.student_id, status = 'inscrite'
     where member_application_id = new.id and student_id is null;
  end if;
  return new;
end $$;
drop trigger if exists member_application_preinscription on public.member_applications;
create trigger member_application_preinscription after insert or update on public.member_applications
  for each row when (new.kind = 'eleve') execute function public.on_member_application_preinscription();

-- Inscription définitive depuis les Admissions : le dossier de l'espace est validé et rattaché à la fiche élève
create or replace function public.on_student_link_member()
returns trigger language plpgsql security definer set search_path = public as $$
declare mid uuid;
begin
  if new.application_id is null then return new; end if;
  select member_application_id into mid from public.applications where id = new.application_id;
  if mid is not null then
    perform set_config('avenida.decision', 'on', true);
    update public.member_applications
       set student_id = new.id, status = 'validee', assigned_role = coalesce(assigned_role, 'eleve'), decided_at = coalesce(decided_at, now())
     where id = mid and student_id is null;
    -- Photo d'identité de l'espace reprise sur la fiche (carte scolaire, fiche d'inscription)
    update public.students s set photo_url = m.photo
      from public.member_applications m
     where m.id = mid and s.id = new.id and m.photo is not null and (s.photo_url is null or s.photo_url = '' or s.photo_url ilike '%default%');
    perform set_config('avenida.decision', '', true);
  end if;
  return new;
end $$;
drop trigger if exists student_link_member on public.students;
create trigger student_link_member after insert or update of application_id on public.students
  for each row execute function public.on_student_link_member();

-- Dossiers « élève » déjà envoyés depuis l'espace et pas encore inscrits : ajoutés à la liste des pré-inscrits
do $$
declare m public.member_applications;
begin
  for m in select * from public.member_applications where kind = 'eleve' and status <> 'brouillon' and student_id is null loop
    perform public.sync_member_preinscription(m);
  end loop;
end $$;
