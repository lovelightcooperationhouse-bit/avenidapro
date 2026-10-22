-- ════════════════════════════════════════════════════════════════════════════
-- 1. Rôle « client » (client de l'hôtel) et rattachement client ↔ compte
-- ════════════════════════════════════════════════════════════════════════════
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in (
  'directeur_general', 'directeur_pedagogique', 'comptable', 'ressources_humaines', 'responsable_hotel',
  'personnel', 'professeur', 'eleve', 'parent', 'client', 'candidat'));
alter table public.profiles add column if not exists customer_id uuid references public.hotel_customers(id) on delete set null;

create or replace function public.guard_profile_admin_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role
      or new.student_id is distinct from old.student_id
      or new.employee_id is distinct from old.employee_id
      or new.customer_id is distinct from old.customer_id
      or new.is_active is distinct from old.is_active)
     and not public.is_director()
     and auth.uid() is not null then
    raise exception 'Seule la Direction Générale peut modifier le rôle ou les rattachements d''un compte';
  end if;
  return new;
end $$;

-- Gestionnaires : direction et chefs de service (le personnel d'exécution n'en fait pas partie)
create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in ('directeur_general', 'directeur_pedagogique', 'comptable', 'ressources_humaines', 'responsable_hotel'), false)
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Catalogue des postes : département, service et rôle attribué par défaut
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.positions (
  code text primary key,
  label text not null,
  department text not null check (department in ('direction', 'ecole', 'hotel')),
  service text,
  default_role text not null,
  sort int not null default 100
);
alter table public.positions enable row level security;
drop policy if exists read_all on public.positions;
create policy read_all on public.positions for select using (true);
drop policy if exists dg_write on public.positions;
create policy dg_write on public.positions for all to authenticated using (public.is_director()) with check (public.is_director());

insert into public.positions (code, label, department, service, default_role, sort) values
  ('directeur_general', 'Directeur(trice) général(e)', 'direction', 'Direction générale', 'directeur_general', 1),
  ('directeur_pedagogique', 'Directeur(trice) pédagogique', 'direction', 'Direction des études', 'directeur_pedagogique', 2),
  ('comptable', 'Comptable / gestionnaire financier', 'direction', 'Comptabilité et caisse', 'comptable', 3),
  ('caissier', 'Caissier(ère)', 'direction', 'Comptabilité et caisse', 'comptable', 4),
  ('rh', 'Responsable des ressources humaines', 'direction', 'Ressources humaines', 'ressources_humaines', 5),
  ('secretaire', 'Secrétaire de direction', 'direction', 'Secrétariat', 'personnel', 6),
  ('responsable_hotel', 'Directeur(trice) de l''hôtel', 'hotel', 'Direction de l''hôtel', 'responsable_hotel', 10),
  ('chef_reception', 'Chef de réception', 'hotel', 'Réception', 'personnel', 11),
  ('receptionniste', 'Réceptionniste', 'hotel', 'Réception', 'personnel', 12),
  ('chef_cuisine', 'Chef de cuisine', 'hotel', 'Cuisine', 'personnel', 13),
  ('cuisinier', 'Cuisinier(ère) / commis', 'hotel', 'Cuisine', 'personnel', 14),
  ('patissier', 'Pâtissier(ère)', 'hotel', 'Cuisine', 'personnel', 15),
  ('maitre_hotel', 'Maître d''hôtel', 'hotel', 'Restaurant & bar', 'personnel', 16),
  ('serveur', 'Serveur(se)', 'hotel', 'Restaurant & bar', 'personnel', 17),
  ('barman', 'Barman / barmaid', 'hotel', 'Restaurant & bar', 'personnel', 18),
  ('gouvernante', 'Gouvernante', 'hotel', 'Étages', 'personnel', 19),
  ('femme_chambre', 'Valet / femme de chambre', 'hotel', 'Étages', 'personnel', 20),
  ('econome', 'Économe / magasinier', 'hotel', 'Économat', 'personnel', 21),
  ('maintenance', 'Technicien(ne) de maintenance', 'hotel', 'Maintenance', 'personnel', 22),
  ('securite', 'Agent de sécurité', 'hotel', 'Sécurité', 'personnel', 23),
  ('professeur', 'Professeur / formateur(trice)', 'ecole', 'Enseignement', 'professeur', 30),
  ('chef_travaux', 'Chef de travaux pratiques', 'ecole', 'Enseignement', 'professeur', 31),
  ('surveillant', 'Surveillant(e) général(e)', 'ecole', 'Vie scolaire', 'personnel', 32),
  ('secretaire_ecole', 'Secrétaire de l''école', 'ecole', 'Scolarité', 'personnel', 33),
  ('bibliothecaire', 'Bibliothécaire / documentaliste', 'ecole', 'Vie scolaire', 'personnel', 34),
  ('agent_entretien', 'Agent d''entretien', 'ecole', 'Services généraux', 'personnel', 35)
on conflict (code) do update set label = excluded.label, department = excluded.department, service = excluded.service, default_role = excluded.default_role, sort = excluded.sort;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. Dossiers d'adhésion : chaque membre complète son profil et choisit son statut
--    soumise → (gestionnaire) en_examen / a_completer / avis_favorable / avis_defavorable
--            → (Directeur général) validee (rôle attribué, fiches créées) / refusee
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.member_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('eleve', 'parent', 'professeur', 'personnel', 'direction', 'client')),
  department text check (department in ('direction', 'ecole', 'hotel')),
  position_code text references public.positions(code),
  data jsonb not null default '{}'::jsonb,
  photo text,
  documents jsonb not null default '[]'::jsonb,
  status text not null default 'brouillon' check (status in ('brouillon', 'soumise', 'en_examen', 'a_completer', 'avis_favorable', 'avis_defavorable', 'validee', 'refusee')),
  manager_note text,
  manager_id uuid references public.profiles(id) on delete set null,
  manager_at timestamptz,
  dg_note text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  assigned_role text,
  student_id uuid references public.students(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  customer_id uuid references public.hotel_customers(id) on delete set null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists member_applications_status_idx on public.member_applications (status, kind);

-- Qui instruit quel dossier : pédagogie (élèves, parents, professeurs), RH (personnel, direction, professeurs),
-- hôtel (personnel de l'hôtel, clients) ; le DG voit tout.
create or replace function public.can_review_application(k text, dept text)
returns boolean language sql stable security definer set search_path = public as $$
  select case public.app_role()
    when 'directeur_general' then true
    when 'directeur_pedagogique' then k in ('eleve', 'parent', 'professeur') or (k = 'personnel' and dept = 'ecole')
    when 'ressources_humaines' then k in ('personnel', 'direction', 'professeur')
    when 'responsable_hotel' then k = 'client' or (k = 'personnel' and dept = 'hotel')
    when 'comptable' then k in ('eleve', 'client')
    else false end
$$;

alter table public.member_applications enable row level security;
drop policy if exists own_select on public.member_applications;
create policy own_select on public.member_applications for select to authenticated using (profile_id = auth.uid());
drop policy if exists own_insert on public.member_applications;
create policy own_insert on public.member_applications for insert to authenticated
  with check (profile_id = auth.uid() and status in ('brouillon', 'soumise'));
drop policy if exists own_update on public.member_applications;
create policy own_update on public.member_applications for update to authenticated
  using (profile_id = auth.uid() and status in ('brouillon', 'a_completer', 'soumise'))
  with check (profile_id = auth.uid() and status in ('brouillon', 'soumise'));
drop policy if exists reviewer_select on public.member_applications;
create policy reviewer_select on public.member_applications for select to authenticated using (public.can_review_application(kind, department));

-- Le membre ne touche jamais aux colonnes de décision
create or replace function public.guard_member_application()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('avenida.decision', true), '') = 'on' then
    new.updated_at := now();
    return new;
  end if;
  if tg_op = 'UPDATE' and (
       new.manager_note is distinct from old.manager_note or new.manager_id is distinct from old.manager_id
    or new.dg_note is distinct from old.dg_note or new.decided_by is distinct from old.decided_by
    or new.assigned_role is distinct from old.assigned_role or new.student_id is distinct from old.student_id
    or new.employee_id is distinct from old.employee_id or new.customer_id is distinct from old.customer_id) then
    raise exception 'Colonnes réservées à l''administration';
  end if;
  if new.status = 'soumise' and (tg_op = 'INSERT' or old.status <> 'soumise') then
    new.submitted_at := now();
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists member_application_guard on public.member_applications;
create trigger member_application_guard before insert or update on public.member_applications
  for each row execute function public.guard_member_application();

-- Dossier soumis → les instructeurs concernés et le DG sont prévenus
create or replace function public.on_member_application_submit()
returns trigger language plpgsql security definer set search_path = public as $$
declare who text := coalesce(new.data->>'first_name', '') || ' ' || coalesce(new.data->>'last_name', '');
begin
  if new.status = 'soumise' and (tg_op = 'INSERT' or old.status is distinct from 'soumise') then
    insert into public.notifications (profile_id, kind, title, body, link, email_status, sms_status)
    select p.id, 'adhesion', 'Nouveau dossier à examiner : ' || trim(who),
           'Statut demandé : ' || new.kind || coalesce(' · ' || new.department, '') || '.', '/dashboard/adhesions', 'pending', 'skipped'
      from public.profiles p
     where p.is_active is not false and p.id <> new.profile_id
       and (p.role = 'directeur_general'
         or (p.role = 'directeur_pedagogique' and (new.kind in ('eleve', 'parent', 'professeur') or (new.kind = 'personnel' and new.department = 'ecole')))
         or (p.role = 'ressources_humaines' and new.kind in ('personnel', 'direction', 'professeur'))
         or (p.role = 'responsable_hotel' and (new.kind = 'client' or (new.kind = 'personnel' and new.department = 'hotel'))));
  end if;
  return new;
end $$;
drop trigger if exists member_application_submit on public.member_applications;
create trigger member_application_submit after insert or update of status on public.member_applications
  for each row execute function public.on_member_application_submit();

-- Avis du gestionnaire (pédagogie, RH, hôtel…) : transmis au DG pour décision
create or replace function public.review_member_application(app uuid, decision text, note text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.member_applications;
begin
  select * into a from public.member_applications where id = app;
  if a.id is null or not public.can_review_application(a.kind, a.department) then
    raise exception 'Dossier introuvable ou hors de votre périmètre' using errcode = '42501';
  end if;
  if decision not in ('en_examen', 'a_completer', 'avis_favorable', 'avis_defavorable') then raise exception 'Décision inconnue'; end if;
  if a.status in ('validee', 'refusee') then raise exception 'Dossier déjà décidé par la Direction générale'; end if;
  perform set_config('avenida.decision', 'on', true);
  update public.member_applications
     set status = decision, manager_note = nullif(trim(note), ''), manager_id = auth.uid(), manager_at = now()
   where id = app;
  if decision = 'a_completer' then
    insert into public.notifications (profile_id, kind, title, body, link)
    values (a.profile_id, 'adhesion', 'Votre dossier est à compléter', coalesce(nullif(trim(note), ''), 'Des informations ou pièces manquent.'), '/espace/profil');
  elsif decision in ('avis_favorable', 'avis_defavorable') then
    insert into public.notifications (profile_id, kind, title, body, link, sms_status)
    select p.id, 'adhesion', 'Dossier transmis pour décision : ' || coalesce(a.data->>'first_name', '') || ' ' || coalesce(a.data->>'last_name', ''),
           case decision when 'avis_favorable' then 'Avis favorable' else 'Avis défavorable' end || coalesce(' — ' || nullif(trim(note), ''), '') || '.',
           '/dashboard/adhesions', 'skipped'
      from public.profiles p where p.role = 'directeur_general' and p.is_active is not false;
  end if;
end $$;

create or replace function public.next_staff_matricule(dept text)
returns text language plpgsql security definer set search_path = public as $$
declare
  p text := case dept when 'hotel' then 'AVH' when 'ecole' then 'AVE' else 'AVD' end || to_char(now(), 'YY');
  n int;
begin
  if not public.is_manager() then raise exception 'Réservé à l''administration'; end if;
  insert into public.matricule_counters (prefix, last_value) values (p, 1)
  on conflict (prefix) do update set last_value = matricule_counters.last_value + 1
  returning last_value into n;
  return p || '-' || lpad(n::text, 4, '0');
end $$;

-- Décision finale du Directeur général : attribue le rôle et crée les fiches (élève, salarié, client)
create or replace function public.decide_member_application(app uuid, decision text, new_role text, note text, extra jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  a public.member_applications;
  d jsonb;
  sid uuid; eid uuid; cid uuid;
  mat text;
  pos public.positions;
  child text;
  linked int := 0;
  n int;
begin
  if not public.is_director() then raise exception 'Seul le Directeur général valide les dossiers et attribue les rôles' using errcode = '42501'; end if;
  select * into a from public.member_applications where id = app;
  if a.id is null then raise exception 'Dossier introuvable'; end if;
  if decision not in ('validee', 'refusee', 'a_completer') then raise exception 'Décision inconnue'; end if;
  d := a.data;
  perform set_config('avenida.decision', 'on', true);

  if decision <> 'validee' then
    update public.member_applications set status = decision, dg_note = nullif(trim(note), ''), decided_by = auth.uid(), decided_at = now() where id = app;
    insert into public.notifications (profile_id, kind, title, body, link)
    values (a.profile_id, 'adhesion',
            case decision when 'refusee' then 'Votre demande n''a pas été retenue' else 'Votre dossier est à compléter' end,
            coalesce(nullif(trim(note), ''), 'Contactez l''administration pour plus d''informations.'), '/espace/profil');
    return jsonb_build_object('status', decision);
  end if;

  select * into pos from public.positions where code = a.position_code;
  new_role := coalesce(nullif(new_role, ''), pos.default_role,
    case a.kind when 'eleve' then 'eleve' when 'parent' then 'parent' when 'professeur' then 'professeur' when 'client' then 'client' else 'personnel' end);

  if a.kind = 'eleve' then
    sid := a.student_id;
    if sid is null then
      mat := public.next_matricule(coalesce(d->>'program_code', 'CFA'));
      insert into public.students (
        registration_number, student_number, first_name, last_name, gender, birth_date, birth_place, nationality,
        residence_neighborhood, address, city, phone, email, boarder_status, emergency_contact_name, emergency_contact_phone,
        program_code, class_name, year_level, specialty, academic_year, previous_school, last_diploma, last_class,
        parent_father_name, parent_father_phone, parent_father_profession, parent_mother_name, parent_mother_phone, parent_mother_profession,
        tutor_name, tutor_phone, tutor_profession, tutor_relation, blood_group, allergies, medical_notes,
        photo_url, uploaded_documents, status, total_fee, paid_fee, remaining_fee, registration_fee, installments_count, raw_data)
      values (
        mat, 'ETU-' || to_char(now(), 'YYYY') || '-' || coalesce(d->>'program_code', 'CFA') || '-' || split_part(mat, '-', 2),
        initcap(d->>'first_name'), upper(d->>'last_name'), d->>'gender', nullif(d->>'birth_date', '')::date, d->>'birth_place', d->>'nationality',
        d->>'neighborhood', d->>'address', d->>'city', d->>'phone', (select email from public.profiles where id = a.profile_id),
        coalesce(d->>'boarding', 'externe'), d->>'emergency_name', d->>'emergency_phone',
        d->>'program_code', coalesce(nullif(extra->>'class_name', ''), d->>'class_name'), d->>'year_level', d->>'specialty', coalesce(extra->>'academic_year', d->>'academic_year'),
        d->>'previous_school', d->>'last_diploma', d->>'last_class',
        d->>'father_name', d->>'father_phone', d->>'father_profession', d->>'mother_name', d->>'mother_phone', d->>'mother_profession',
        d->>'tutor_name', d->>'tutor_phone', d->>'tutor_profession', d->>'tutor_relation', d->>'blood_group', d->>'allergies', d->>'medical_notes',
        a.photo, a.documents, 'actif',
        coalesce((extra->>'total_fee')::numeric, 0), 0, coalesce((extra->>'total_fee')::numeric, 0), coalesce((extra->>'registration_fee')::numeric, 0), 8, d)
      returning id into sid;
    end if;
    update public.profiles set role = new_role, student_id = sid, avatar_url = a.photo, updated_at = now() where id = a.profile_id;

  elsif a.kind = 'parent' then
    -- Rattache les enfants indiqués par matricule
    for child in select jsonb_array_elements_text(coalesce(d->'children', '[]'::jsonb)) loop
      insert into public.parent_students (parent_id, student_id, relationship)
      select a.profile_id, s.id, coalesce(d->>'relation', 'parent')
        from public.students s where upper(s.registration_number) = upper(trim(child)) or upper(s.student_number) = upper(trim(child))
      on conflict do nothing;
      get diagnostics n = row_count;
      linked := linked + n;
    end loop;
    update public.profiles set role = new_role, avatar_url = a.photo, updated_at = now() where id = a.profile_id;

  elsif a.kind = 'client' then
    cid := a.customer_id;
    if cid is null then
      insert into public.hotel_customers (first_name, last_name, full_name, email, phone, nationality, id_card_or_passport, company, address, raw_data, uploaded_documents)
      values (initcap(d->>'first_name'), upper(d->>'last_name'), initcap(d->>'first_name') || ' ' || upper(d->>'last_name'),
              (select email from public.profiles where id = a.profile_id), d->>'phone', d->>'nationality',
              coalesce(d->>'id_type', '') || ' ' || coalesce(d->>'id_number', ''), d->>'company', d->>'address', d, a.documents)
      returning id into cid;
    end if;
    update public.profiles set role = new_role, customer_id = cid, avatar_url = a.photo, updated_at = now() where id = a.profile_id;

  else
    -- Professeurs, personnel de l'école ou de l'hôtel, direction
    eid := a.employee_id;
    if eid is null then
      mat := public.next_staff_matricule(coalesce(a.department, pos.department, 'direction'));
      insert into public.employees (
        matricule, first_name, last_name, position, role_title, sector, department, specialty, contract_type, base_salary, hire_date, status,
        highest_degree, experience_years, cv_summary, photo_url, uploaded_documents, phone, email, gender, birth_date, nationality, neighborhood, raw_data, profile_id)
      values (
        mat, initcap(d->>'first_name'), upper(d->>'last_name'), coalesce(pos.label, d->>'position', 'Personnel'), coalesce(pos.label, d->>'position'),
        coalesce(a.department, pos.department), coalesce(pos.service, d->>'service'), d->>'specialty',
        coalesce(nullif(extra->>'contract_type', ''), d->>'contract_type', 'CDD'), coalesce((extra->>'base_salary')::bigint, 0),
        coalesce(nullif(extra->>'hire_date', '')::date, current_date), 'actif',
        d->>'highest_degree', nullif(d->>'experience_years', '')::int, d->>'cv_summary', a.photo, a.documents,
        d->>'phone', (select email from public.profiles where id = a.profile_id), d->>'gender', nullif(d->>'birth_date', '')::date, d->>'nationality', d->>'neighborhood', d, a.profile_id)
      returning id into eid;
    end if;
    update public.profiles set role = new_role, employee_id = eid, avatar_url = a.photo, updated_at = now() where id = a.profile_id;
  end if;

  update public.member_applications
     set status = 'validee', dg_note = nullif(trim(note), ''), decided_by = auth.uid(), decided_at = now(),
         assigned_role = new_role, student_id = sid, employee_id = eid, customer_id = cid
   where id = app;

  insert into public.notifications (profile_id, kind, title, body, link)
  values (a.profile_id, 'adhesion', 'Votre dossier est validé',
          'Bienvenue ! Votre espace est activé' || coalesce(' (matricule ' || mat || ')', '') || '.' || coalesce(' ' || nullif(trim(note), ''), ''), '/espace');

  return jsonb_build_object('status', 'validee', 'role', new_role, 'student_id', sid, 'employee_id', eid, 'customer_id', cid, 'matricule', mat, 'children_linked', linked);
end $$;

revoke execute on function public.review_member_application(uuid, text, text) from public, anon;
revoke execute on function public.decide_member_application(uuid, text, text, text, jsonb) from public, anon;
revoke execute on function public.next_staff_matricule(text) from public, anon;
grant execute on function public.review_member_application(uuid, text, text) to authenticated;
grant execute on function public.decide_member_application(uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.next_staff_matricule(text) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. Documents des membres : pièces déposées et documents envoyés par l'administration
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.member_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'autre' check (category in ('piece', 'fiche', 'carte', 'attestation', 'recu', 'courrier', 'contrat', 'bulletin', 'autre')),
  title text not null,
  path text not null,
  mime text,
  size bigint,
  direction text not null default 'depose' check (direction in ('depose', 'envoye')),
  sent_by uuid references public.profiles(id) on delete set null,
  note text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists member_documents_profile_idx on public.member_documents (profile_id, created_at desc);

-- Un gestionnaire voit les documents des membres qu'il instruit (ou dont il gère la fiche)
create or replace function public.can_manage_member(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_director()
      or exists (select 1 from public.member_applications a where a.profile_id = pid and public.can_review_application(a.kind, a.department))
      or exists (select 1 from public.profiles p where p.id = pid and (
           (public.app_role() = 'directeur_pedagogique' and p.role in ('eleve', 'parent', 'professeur'))
        or (public.app_role() = 'ressources_humaines' and p.role in ('personnel', 'professeur', 'comptable', 'responsable_hotel', 'directeur_pedagogique', 'ressources_humaines'))
        or (public.app_role() = 'responsable_hotel' and p.role = 'client')
        or (public.app_role() = 'comptable' and p.role in ('eleve', 'parent'))))
$$;

alter table public.member_documents enable row level security;
drop policy if exists own_select on public.member_documents;
create policy own_select on public.member_documents for select to authenticated using (profile_id = auth.uid());
drop policy if exists own_read_mark on public.member_documents;
create policy own_read_mark on public.member_documents for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists own_insert on public.member_documents;
create policy own_insert on public.member_documents for insert to authenticated
  with check (profile_id = auth.uid() and direction = 'depose' and sent_by = auth.uid());
drop policy if exists own_delete on public.member_documents;
create policy own_delete on public.member_documents for delete to authenticated using (profile_id = auth.uid() and direction = 'depose');
drop policy if exists manager_all on public.member_documents;
create policy manager_all on public.member_documents for all to authenticated
  using (public.can_manage_member(profile_id)) with check (public.can_manage_member(profile_id));

create or replace function public.on_member_document_sent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.direction = 'envoye' then
    insert into public.notifications (profile_id, kind, title, body, link)
    values (new.profile_id, 'document', 'Nouveau document : ' || new.title, coalesce(new.note, 'L''administration vous a envoyé un document.'), '/espace/documents');
  end if;
  return new;
end $$;
drop trigger if exists member_document_sent on public.member_documents;
create trigger member_document_sent after insert on public.member_documents for each row execute function public.on_member_document_sent();

insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 20971520)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists documents_own on storage.objects;
create policy documents_own on storage.objects for all to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists documents_manager on storage.objects;
create policy documents_manager on storage.objects for all to authenticated
  using (bucket_id = 'documents' and public.can_manage_member(public.try_uuid((storage.foldername(name))[1])))
  with check (bucket_id = 'documents' and public.can_manage_member(public.try_uuid((storage.foldername(name))[1])));

-- ════════════════════════════════════════════════════════════════════════════
-- 5. Contenu du site modifiable (réservé au Directeur général)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.site_menu (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.site_menu(id) on delete cascade,
  label text not null,
  href text not null,
  description text,
  icon text,
  position int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  eyebrow text,
  description text,
  header_image text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sections ajoutées aux pages : page = 'accueil', 'ecole', 'hotel', 'admissions', 'a-propos', 'contact' ou le slug d'une page créée
create table if not exists public.site_sections (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  position int not null default 0,
  kind text not null default 'texte' check (kind in ('texte', 'image', 'video', 'galerie', 'publications', 'appel')),
  eyebrow text,
  title text,
  body text,
  media jsonb not null default '[]'::jsonb,
  video_url text,
  button_label text,
  button_href text,
  tone text not null default 'clair' check (tone in ('clair', 'gris', 'sombre', 'vif')),
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_sections_page_idx on public.site_sections (page, position);

create table if not exists public.site_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind text not null default 'article' check (kind in ('article', 'annonce', 'evenement', 'photos', 'video')),
  title text not null,
  excerpt text,
  body text,
  cover text,
  media jsonb not null default '[]'::jsonb,
  video_url text,
  audience text not null default 'public' check (audience in ('public', 'membres')),
  published boolean not null default true,
  pinned boolean not null default false,
  published_at timestamptz not null default now(),
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists site_posts_pub_idx on public.site_posts (published, published_at desc);

alter table public.site_settings enable row level security;
alter table public.site_menu enable row level security;
alter table public.site_pages enable row level security;
alter table public.site_sections enable row level security;
alter table public.site_posts enable row level security;

drop policy if exists read_all on public.site_settings;
create policy read_all on public.site_settings for select using (true);
drop policy if exists read_visible on public.site_menu;
create policy read_visible on public.site_menu for select using (visible or public.is_director());
drop policy if exists read_published on public.site_pages;
create policy read_published on public.site_pages for select using (published or public.is_director());
drop policy if exists read_visible on public.site_sections;
create policy read_visible on public.site_sections for select using (visible or public.is_director());
drop policy if exists read_published on public.site_posts;
create policy read_published on public.site_posts for select using (
  (published and published_at <= now() and (audience = 'public' or auth.uid() is not null)) or public.is_director());

do $$
declare t text;
begin
  foreach t in array array['site_settings', 'site_menu', 'site_pages', 'site_sections', 'site_posts'] loop
    execute format('drop policy if exists dg_write on public.%I', t);
    execute format('create policy dg_write on public.%I for all to authenticated using (public.is_director()) with check (public.is_director())', t);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit)
values ('site', 'site', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit;
drop policy if exists site_public_read on storage.objects;
create policy site_public_read on storage.objects for select using (bucket_id = 'site');
drop policy if exists site_dg_write on storage.objects;
create policy site_dg_write on storage.objects for all to authenticated
  using (bucket_id = 'site' and public.is_director()) with check (bucket_id = 'site' and public.is_director());

-- Menu initial : reprend la navigation actuelle du site
do $$
declare ecole uuid; adm uuid; hotel uuid;
begin
  if exists (select 1 from public.site_menu) then return; end if;
  insert into public.site_menu (label, href, position) values ('Accueil', '/', 0);
  insert into public.site_menu (label, href, position) values ('L''École', '/ecole', 1) returning id into ecole;
  insert into public.site_menu (parent_id, label, href, description, icon, position) values
    (ecole, 'Nos formations', '/ecole#formations', 'CFA, CAP, BEP, BT et BTS', 'GraduationCap', 0),
    (ecole, 'Spécialités', '/ecole#specialites', 'Cuisine, restaurant, réception, hébergement', 'ChefHat', 1),
    (ecole, 'Pédagogie', '/ecole#pedagogie', 'Apprendre dans un vrai hôtel', 'Sparkles', 2),
    (ecole, 'Cours du jour et du soir', '/ecole#horaires', 'Des horaires adaptés à chacun', 'Clock', 3),
    (ecole, 'Espace École (en ligne)', '/espace/ecole', 'Cours, devoirs et visio de votre filière', 'MonitorPlay', 4);
  insert into public.site_menu (label, href, position) values ('Admissions', '/admissions', 2) returning id into adm;
  insert into public.site_menu (parent_id, label, href, description, icon, position) values
    (adm, 'Pré-inscription en ligne', '/preinscription', 'Déposez votre dossier en 5 minutes', 'ClipboardList', 0),
    (adm, 'Frais et paiement', '/admissions#tarifs', 'Inscription, scolarité, 8 tranches', 'Wallet', 1),
    (adm, 'Pièces à fournir', '/admissions#dossier', 'La liste complète du dossier', 'BookOpenCheck', 2),
    (adm, 'Rentrées et internat', '/admissions#rentrees', 'Trois rentrées, logement sur place', 'CalendarDays', 3);
  insert into public.site_menu (label, href, position) values ('L''Hôtel', '/hotel', 3) returning id into hotel;
  insert into public.site_menu (parent_id, label, href, description, icon, position) values
    (hotel, 'Chambres', '/hotel#chambres', 'Séjourner à l''Hôtel École', 'BedDouble', 0),
    (hotel, 'Restaurant & bar', '/hotel#restaurant', 'Une table tenue par nos élèves', 'Utensils', 1),
    (hotel, 'Demande de réservation', '/hotel#reserver', 'Réponse rapide de la réception', 'ConciergeBell', 2),
    (hotel, 'Espace Hôtel (personnel)', '/espace/hotel', 'Consignes, documents et réunions par service', 'Users', 3);
  insert into public.site_menu (label, href, position) values ('Actualités', '/actualites', 4), ('À propos', '/a-propos', 5), ('Contact', '/contact', 6);
end $$;
