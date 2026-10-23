-- ════════════════════════════════════════════════════════════════════════════
-- Contrôle du Directeur général : toute action finale (inscription, envoi des bulletins,
-- validation des cartes…) est soumise au DG. Alerte instantanée au DG (espace, téléphone, e-mail),
-- puis alerte en retour au demandeur après décision. Mouvements de caisse signalés au DG.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.dg_validations (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  title text not null,
  details text,
  payload jsonb not null default '{}'::jsonb,
  link text,
  requested_by uuid references public.profiles(id) on delete set null default auth.uid(),
  requester_name text,
  requester_role text,
  status text not null default 'en_attente' check (status in ('en_attente', 'approuvee', 'refusee')),
  decision_note text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists dg_validations_status on public.dg_validations (status, created_at desc);

alter table public.dg_validations enable row level security;
drop policy if exists read_own_or_dg on public.dg_validations;
create policy read_own_or_dg on public.dg_validations for select using (requested_by = auth.uid() or public.app_role() = 'directeur_general');
drop policy if exists staff_submit on public.dg_validations;
create policy staff_submit on public.dg_validations for insert with check (public.is_staff() and requested_by = auth.uid() and status = 'en_attente');
drop policy if exists dg_decide on public.dg_validations;
create policy dg_decide on public.dg_validations for update using (public.app_role() = 'directeur_general') with check (public.app_role() = 'directeur_general');

-- Demande soumise → alerte immédiate à chaque Directeur général
create or replace function public.on_dg_validation()
returns trigger language plpgsql security definer set search_path = public as $$
declare who text; r text;
begin
  if tg_op = 'INSERT' then
    select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), email), role into who, r from public.profiles where id = new.requested_by;
    update public.dg_validations set requester_name = who, requester_role = r where id = new.id;
    insert into public.notifications (profile_id, kind, title, body, link)
    select p.id, 'validation', 'À valider : ' || new.title,
           coalesce(who, 'Un membre de l''équipe') || ' soumet une action à votre contrôle.' || coalesce(' ' || new.details, ''),
           '/dashboard/validations'
      from public.profiles p where p.role = 'directeur_general' and p.is_active is not false;
  elsif new.status is distinct from old.status and new.status <> 'en_attente' and new.requested_by is not null then
    insert into public.notifications (profile_id, kind, title, body, link)
    values (new.requested_by, 'validation',
            case when new.status = 'approuvee' then 'Validé par le Directeur général : ' else 'Refusé par le Directeur général : ' end || new.title,
            coalesce(new.decision_note, case when new.status = 'approuvee' then 'Votre demande a été approuvée et exécutée.' else 'Votre demande n''a pas été approuvée.' end),
            coalesce(new.link, '/dashboard/validations'));
  end if;
  return new;
end $$;
drop trigger if exists dg_validation_alert on public.dg_validations;
create trigger dg_validation_alert after insert or update of status on public.dg_validations for each row execute function public.on_dg_validation();

-- Seul le DG exécute les actions finales (les autres soumettent une demande)
create or replace function public.send_report_cards(ids uuid[], by_email boolean default true)
returns int language plpgsql security definer set search_path = public as $$
declare r public.report_cards; n int := 0;
begin
  if public.app_role() <> 'directeur_general' then
    raise exception 'L''envoi des bulletins est autorisé par le Directeur général : soumettez-le à sa validation' using errcode = '42501';
  end if;
  for r in select * from public.report_cards where id = any(ids) loop
    if r.signed_at is null then
      raise exception 'Le bulletin de % n''est pas encore validé et signé', r.student_name;
    end if;
    update public.report_cards set published = true, sent_at = now(), sent_by_email = by_email where id = r.id;
    insert into public.notifications (profile_id, kind, title, body, link, email_status, sms_status)
    select p.pid, 'bulletin',
           case when r.revision > 0 then 'Bulletin rectifié : ' else 'Bulletin disponible : ' end || coalesce(r.period, 'semestre ' || r.term),
           'Moyenne : ' || coalesce(to_char(r.general_average, 'FM90.00'), '—') || '/20' || coalesce(' · rang ' || r.rank_display, '') || coalesce(' sur ' || r.total_students, '')
             || '. Bulletin signé par le Directeur pédagogique, à consulter et télécharger dans votre espace.',
           '/espace/bulletins', case when by_email then 'pending' else 'skipped' end, 'skipped'
      from (select pr.id pid from public.profiles pr where pr.role = 'eleve' and pr.student_id = public.try_uuid(r.student_id)
            union select ps.parent_id from public.parent_students ps where ps.student_id = public.try_uuid(r.student_id)) p;
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.validate_card(card uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare c public.id_cards; n int;
begin
  if public.app_role() <> 'directeur_general' then
    raise exception 'La validation des cartes est réservée au Directeur général : soumettez-la à sa validation' using errcode = '42501';
  end if;
  select * into c from public.id_cards where id = card;
  if c.id is null then raise exception 'Carte introuvable'; end if;
  update public.id_cards set review_status = 'envoyee', validated_at = now() where id = card;
  insert into public.notifications (profile_id, kind, title, body, link)
  select h, 'carte', 'Votre carte est validée', 'Votre carte ' || coalesce(c.card_number, '') || ' est disponible dans votre espace : consultez-la, téléchargez-la ou imprimez-la.', '/espace/carte'
    from public.card_holders(c) h;
  get diagnostics n = row_count;
  return n;
end $$;

-- Transparence : chaque mouvement de caisse est signalé au DG (espace et téléphone)
create or replace function public.on_cash_movement()
returns trigger language plpgsql security definer set search_path = public as $$
declare label text; amt numeric; who text;
begin
  select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), email) into who from public.profiles where id = auth.uid();
  if tg_table_name = 'fee_payments' then
    label := 'Encaissement écolage : ' || coalesce(new.student_name, '') || coalesce(' · reçu ' || new.receipt_number, '');
    amt := new.amount;
  else
    label := case when coalesce(new.type, 'depense') = 'recette' then 'Recette : ' else 'Dépense : ' end || coalesce(new.category, '') || coalesce(' · ' || new.description, '');
    amt := new.amount;
  end if;
  insert into public.notifications (profile_id, kind, title, body, link, email_status, sms_status)
  select p.id, 'caisse', 'Mouvement de caisse : ' || to_char(coalesce(amt, 0), 'FM999G999G999') || ' F',
         label || coalesce(' · saisi par ' || who, '') || '.',
         case when tg_table_name = 'fee_payments' then '/dashboard/ecolage' else '/dashboard/finances' end, 'skipped', 'skipped'
    from public.profiles p
   where p.role = 'directeur_general' and p.is_active is not false and p.id is distinct from auth.uid();
  return new;
end $$;
drop trigger if exists cash_movement_fee on public.fee_payments;
create trigger cash_movement_fee after insert on public.fee_payments for each row execute function public.on_cash_movement();
drop trigger if exists cash_movement_expense on public.expenses;
create trigger cash_movement_expense after insert on public.expenses for each row execute function public.on_cash_movement();

-- Inscription définitive : exécutée par le Directeur général (la pédagogie la soumet)
CREATE OR REPLACE FUNCTION public.enroll_application(app uuid, p_class text DEFAULT NULL::text, p_total numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  a public.applications;
  pr public.programs;
  sid uuid;
  mat text;
  total numeric;
  yr text := case when extract(month from now()) >= 8 then to_char(now(), 'YYYY') || ' - ' || (extract(year from now()) + 1)::int
                  else (extract(year from now()) - 1)::int || ' - ' || to_char(now(), 'YYYY') end;
  pid uuid; gid uuid;
begin
  if public.app_role() <> 'directeur_general' then
    raise exception 'L''inscription définitive est validée par le Directeur général : soumettez-la à sa validation' using errcode = '42501';
  end if;
  select * into a from public.applications where id = app;
  if a.id is null then raise exception 'Pré-inscription introuvable'; end if;
  if a.student_id is not null then return jsonb_build_object('student_id', a.student_id, 'already', true); end if;

  select * into pr from public.programs where code = a.program_code;
  total := coalesce(p_total, coalesce(pr.registration_fee, 0) + coalesce(pr.annual_tuition, 0) + coalesce(pr.supplies_fee, 0));
  mat := public.next_matricule(coalesce(a.program_code, 'CFA'));

  insert into public.students (
    registration_number, student_number, first_name, last_name, gender, birth_date, birth_place, nationality,
    residence_neighborhood, phone, email, guardian_email, boarder_status, program_code, specialty, class_name, year_level, academic_year,
    last_class, last_diploma, previous_school, tutor_name, tutor_phone, tutor_profession, tutor_relation,
    total_fee, paid_fee, remaining_fee, registration_fee, installments_count, status, application_id, notes)
  values (
    mat, 'ETU-' || to_char(now(), 'YYYY') || '-' || coalesce(a.program_code, 'CFA') || '-' || split_part(mat, '-', 2),
    initcap(a.first_name), upper(a.last_name), a.gender, a.birth_date, a.birth_place, a.nationality,
    a.neighborhood, a.phone, lower(a.email), lower(nullif(a.guardian_email, '')), case when a.boarding then 'interne' else 'externe' end,
    a.program_code, a.specialty, coalesce(nullif(p_class, ''), a.program_code || '1 - ' || coalesce(a.specialty, '')), '1re année', yr,
    a.last_class, a.last_diploma, a.previous_school, a.guardian_name, a.guardian_phone, a.guardian_profession, a.guardian_relation,
    total, 0, total, coalesce(pr.registration_fee, 0), 8, 'actif', a.id, 'Inscrit depuis la pré-inscription ' || coalesce(a.reference, ''))
  returning id into sid;

  update public.applications set status = 'inscrite', student_id = sid, decided_by = auth.uid(), decided_at = now() where id = app;

  -- Carte scolaire (numéro et QR attribués automatiquement)
  insert into public.id_cards (holder_type, student_id, issued_by, valid_until)
  values ('eleve', sid, auth.uid(), make_date(extract(year from now())::int + case when extract(month from now()) >= 8 then 1 else 0 end, 7, 31))
  on conflict (student_id) do nothing;

  -- Comptes rattachés : l'élève (même e-mail) et le tuteur (e-mail du tuteur)
  perform set_config('avenida.enroll', 'on', true);
  select id into pid from public.profiles where lower(email) = lower(a.email) limit 1;
  if pid is not null then
    update public.profiles set student_id = sid, role = case when role in ('candidat', 'eleve') then 'eleve' else role end where id = pid;
  end if;
  if nullif(a.guardian_email, '') is not null then
    select id into gid from public.profiles where lower(email) = lower(a.guardian_email) limit 1;
    if gid is not null then
      insert into public.parent_students (parent_id, student_id, relationship) values (gid, sid, coalesce(a.guardian_relation, 'tuteur')) on conflict do nothing;
      update public.profiles set role = 'parent' where id = gid and role = 'candidat';
    end if;
  end if;

  perform public.notify_student_family(sid, 'inscription', 'Inscription définitive confirmée',
    'Matricule ' || mat || ' · ' || coalesce(a.program_code, '') || ' ' || coalesce(a.specialty, '') || '. La fiche d''inscription est disponible dans votre espace.', '/espace/fiche');

  return jsonb_build_object('student_id', sid, 'matricule', mat, 'total', total, 'student_account', pid is not null, 'guardian_account', gid is not null);
end $function$;
