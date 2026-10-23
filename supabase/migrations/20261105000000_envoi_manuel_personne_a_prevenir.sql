-- ════════════════════════════════════════════════════════════════════════════
-- Rien n'est envoyé automatiquement : cartes et bulletins sont préparés, vérifiés,
-- signés, puis envoyés sur décision (espace et/ou e-mail).
-- Personne à prévenir dans la pré-inscription (reprise sur la fiche et la carte).
-- QR codes : un document n'est authentique qu'une fois validé et signé.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Cartes : plus de notification automatique à l'émission ou à la mise à jour
drop trigger if exists card_change on public.id_cards;
drop trigger if exists on_card_change on public.id_cards;
drop trigger if exists id_card_change on public.id_cards;
do $$
declare t record;
begin
  for t in select tgname from pg_trigger where tgrelid = 'public.id_cards'::regclass and not tgisinternal
           and pg_get_triggerdef(oid) ilike '%on_card_change%' loop
    execute format('drop trigger %I on public.id_cards', t.tgname);
  end loop;
end $$;

-- 2. Bulletins : préparation → signature (finalisé) → envoi décidé par la direction
alter table public.report_cards add column if not exists sent_at timestamptz;
alter table public.report_cards add column if not exists sent_by_email boolean not null default false;

create or replace function public.on_report_card_published()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Plus d'envoi automatique : les familles sont prévenues par send_report_cards()
  return new;
end $$;

create or replace function public.send_report_cards(ids uuid[], by_email boolean default true)
returns int language plpgsql security definer set search_path = public as $$
declare r public.report_cards; n int := 0;
begin
  if public.app_role() not in ('directeur_general', 'directeur_pedagogique') then
    raise exception 'Envoi réservé à la direction' using errcode = '42501';
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
revoke execute on function public.send_report_cards(uuid[], boolean) from public, anon;
grant execute on function public.send_report_cards(uuid[], boolean) to authenticated;

-- 3. QR codes : authenticité réelle
create or replace function public.verify_document(k text, t text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r public.report_cards; p public.fee_payments; s public.students;
begin
  if k = 'bulletin' then
    select * into r from public.report_cards where token = t;
    if r.id is null then return jsonb_build_object('valid', false, 'reason', 'Bulletin inconnu : ce document n''a pas été émis par l''Hôtel École Avenida'); end if;
    if r.signed_at is null then
      return jsonb_build_object('valid', false, 'reason', 'Bulletin provisoire : il n''a pas encore été validé et signé par le Directeur pédagogique',
        'name', r.student_name, 'matricule', r.student_matricule, 'class', r.class_name, 'period', r.period, 'year', r.academic_year);
    end if;
    return jsonb_build_object('valid', true, 'type', 'bulletin', 'name', r.student_name, 'matricule', r.student_matricule, 'class', r.class_name,
      'year', r.academic_year, 'period', coalesce(r.period, 'Semestre ' || r.term), 'average', r.general_average, 'rank', r.rank_display,
      'total', r.total_students, 'mention', r.mention, 'number', r.bulletin_number, 'issued', r.signed_at,
      'signed_by', r.signed_by_name, 'revision', r.revision);
  elsif k = 'recu' then
    select * into p from public.fee_payments where token = t;
    if p.id is null then return jsonb_build_object('valid', false, 'reason', 'Reçu inconnu : ce document n''a pas été émis par l''Hôtel École Avenida'); end if;
    return jsonb_build_object('valid', coalesce(p.status, 'validé') in ('validé', 'valide', 'confirmé'), 'type', 'recu', 'number', p.receipt_number,
      'name', p.student_name, 'matricule', p.student_matricule, 'class', p.class_name, 'amount', p.amount, 'designation', p.designation,
      'date', coalesce(p.payment_date, p.created_at), 'remaining', p.remaining_due, 'method', p.payment_method);
  elsif k = 'situation' then
    select * into s from public.students where situation_token = t;
    if s.id is null then return jsonb_build_object('valid', false, 'reason', 'Fiche inconnue : ce document n''a pas été émis par l''Hôtel École Avenida'); end if;
    return jsonb_build_object('valid', true, 'type', 'situation', 'name', s.first_name || ' ' || s.last_name, 'matricule', s.registration_number,
      'class', s.class_name, 'year', s.academic_year, 'total', s.total_fee, 'paid', s.paid_fee, 'remaining', s.remaining_fee,
      'status', case when coalesce(s.remaining_fee, 0) <= 0 and coalesce(s.total_fee, 0) > 0 then 'Soldé'
                     when public.student_payment_ok(s) then 'En règle' else 'En retard de paiement' end,
      'date', now());
  end if;
  return jsonb_build_object('valid', false, 'reason', 'Type de document inconnu');
end $$;

-- 4. Personne à prévenir : saisie à la pré-inscription, reprise sur la fiche de l'élève
alter table public.applications add column if not exists emergency_name text;
alter table public.applications add column if not exists emergency_phone text;

create or replace function public.student_emergency_from_application()
returns trigger language plpgsql security definer set search_path = public as $$
declare a public.applications;
begin
  if new.application_id is not null and (new.emergency_contact_name is null or new.emergency_contact_phone is null) then
    select * into a from public.applications where id = new.application_id;
    new.emergency_contact_name := coalesce(new.emergency_contact_name, a.emergency_name);
    new.emergency_contact_phone := coalesce(new.emergency_contact_phone, a.emergency_phone);
  end if;
  return new;
end $$;
drop trigger if exists student_emergency on public.students;
create trigger student_emergency before insert on public.students for each row execute function public.student_emergency_from_application();

-- Carte : authentique seulement une fois validée et envoyée par l'administration (le personnel voit le détail)
CREATE OR REPLACE FUNCTION public.verify_card(t text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  c public.id_cards;
  st public.students;
  em public.employees;
  cu public.hotel_customers;
  detail boolean := public.is_staff() or public.app_role() = 'professeur';
  res jsonb;
begin
  select * into c from public.id_cards where token = t;
  if c.id is null then return jsonb_build_object('valid', false, 'reason', 'Carte inconnue'); end if;
  if c.revoked then return jsonb_build_object('valid', false, 'reason', 'Carte révoquée'); end if;
  if coalesce(c.review_status, 'envoyee') <> 'envoyee' and not coalesce(detail, false) then
    return jsonb_build_object('valid', false, 'reason', 'Carte en cours de validation : elle n''est pas encore officielle');
  end if;

  if c.holder_type = 'eleve' then
    select * into st from public.students where id = c.student_id;
    res := jsonb_build_object(
      'valid', st.status = 'actif' and not st.is_archived and (c.valid_until is null or c.valid_until >= current_date),
      'type', 'eleve', 'name', st.first_name || ' ' || st.last_name, 'photo', st.photo_url, 'card_number', c.card_number,
      'matricule', coalesce(st.registration_number, st.student_number), 'class', st.class_name,
      'year', st.academic_year, 'status', st.status, 'version', c.version, 'issued_at', c.issued_at,
      'payment_ok', public.student_payment_ok(st));
    if detail then
      res := res || jsonb_build_object(
        'student_id', st.id, 'paid', st.paid_fee, 'remaining', st.remaining_fee, 'total', st.total_fee,
        'absences_30j', (select count(*) from public.student_attendance a where a.student_id = st.id and a.status = 'absent' and a.date > current_date - 30),
        'retards_30j', (select count(*) from public.student_attendance a where a.student_id = st.id and a.status = 'retard' and a.date > current_date - 30),
        'permission_en_cours', exists (select 1 from public.permission_requests p where p.student_id = st.id and p.status = 'acceptee' and current_date between p.start_date and p.end_date),
        'present_today', (select a.status from public.student_attendance a where a.student_id = st.id and a.date = current_date limit 1));
    end if;
  elsif c.holder_type = 'client' then
    select * into cu from public.hotel_customers where id = c.customer_id;
    res := jsonb_build_object(
      'valid', c.valid_until is null or c.valid_until >= current_date,
      'type', 'client', 'name', coalesce(cu.full_name, cu.first_name || ' ' || cu.last_name), 'card_number', c.card_number, 'matricule', c.card_number,
      'level', case when coalesce(cu.total_stays, 0) >= 10 or coalesce(cu.is_vip, false) then 'Or' when coalesce(cu.total_stays, 0) >= 4 then 'Argent' else 'Classique' end,
      'points', cu.loyalty_points, 'version', c.version, 'issued_at', c.issued_at);
    if detail then res := res || jsonb_build_object('customer_id', cu.id, 'stays', cu.total_stays, 'spent', cu.total_spent, 'phone', cu.phone); end if;
  else
    select * into em from public.employees where id = c.employee_id;
    res := jsonb_build_object(
      'valid', coalesce(em.status, 'actif') not in ('inactif', 'licencié', 'demission') and (c.valid_until is null or c.valid_until >= current_date),
      'type', 'personnel', 'name', em.first_name || ' ' || em.last_name, 'photo', em.photo_url, 'card_number', c.card_number,
      'matricule', em.matricule, 'position', coalesce(em.role_title, em.position), 'department', coalesce(em.department, em.sector),
      'status', em.status, 'version', c.version, 'issued_at', c.issued_at);
    if detail then res := res || jsonb_build_object('employee_id', em.id, 'contract', em.contract_type, 'hire_date', em.hire_date, 'phone', em.phone); end if;
  end if;
  return res;
end $function$;
drop function if exists public.verify_card_status(text);
