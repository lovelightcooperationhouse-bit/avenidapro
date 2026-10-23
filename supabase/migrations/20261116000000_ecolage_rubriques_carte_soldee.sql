-- ════════════════════════════════════════════════════════════════════════════
-- Écolage : payeur (élève, parent ou tuteur) inscrit sur le reçu, mises à jour en temps réel,
-- et carte scolaire valide uniquement quand l'écolage est entièrement soldé.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Qui a payé en ligne (élève, parent/tuteur, candidat, administration) → « Versé par » du reçu
alter table public.school_payments add column if not exists payer_role text;

create or replace function public._payer_role(r text)
returns text language sql immutable as $$
  select case r when 'eleve' then 'Élève' when 'parent' then 'Parent / tuteur' when 'candidat' then 'Candidat'
                when 'directeur_general' then 'Direction générale' when 'comptable' then 'Comptabilité' else 'Famille' end
$$;

create or replace function public.on_school_payment_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.payer_role is null then
    select public._payer_role(p.role) into new.payer_role from public.profiles p where p.id = new.profile_id;
  end if;
  return new;
end $$;
drop trigger if exists school_payment_role on public.school_payments;
create trigger school_payment_role before insert on public.school_payments for each row execute function public.on_school_payment_role();

create or replace function public._school_payment_receipt(sp public.school_payments, sid uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  insert into public.fee_payments (student_id, amount, payment_method, designation, depositor_name, depositor_phone, depositor_role, cashier_name, status, payment_date, raw_data)
  values (sid::text, sp.amount,
          case sp.method when 'yas' then 'Mixx by Yas (en ligne)' when 'moov' then 'Moov Money (en ligne)' else 'Carte bancaire (en ligne)' end,
          sp.designation, sp.payer_name, sp.payer_phone, coalesce(sp.payer_role, 'Famille'), 'Paiement en ligne · PayDunya', 'validé', coalesce(sp.processed_at, now())::date,
          jsonb_build_object('online', true, 'identifier', sp.identifier, 'provider', sp.provider, 'provider_ref', sp.provider_ref,
                             'paid_at', coalesce(sp.processed_at, now()), 'started_at', sp.created_at))
  returning id into fid;
  update public.school_payments set fee_payment_id = fid, student_id = sid where id = sp.id;
  return fid;
end $$;
revoke execute on function public._school_payment_receipt(public.school_payments, uuid) from public, anon, authenticated;

-- 2. Carte scolaire : valide seulement quand l'écolage est soldé
create or replace function public.student_fully_paid(st public.students)
returns boolean language sql stable as $$
  select coalesce(st.remaining_fee, 0) <= 0
$$;

create or replace function public.verify_card(t text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
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
    -- Écolage non soldé : la carte n'est pas encore valide
    if not public.student_fully_paid(st) and not coalesce(detail, false) then
      return jsonb_build_object('valid', false, 'reason', 'Carte non encore valide : elle le devient dès que l''écolage de l''année est entièrement payé',
        'name', st.first_name || ' ' || st.last_name, 'matricule', coalesce(st.registration_number, st.student_number), 'class', st.class_name);
    end if;
    res := jsonb_build_object(
      'valid', st.status = 'actif' and not st.is_archived and (c.valid_until is null or c.valid_until >= current_date) and public.student_fully_paid(st),
      'type', 'eleve', 'name', st.first_name || ' ' || st.last_name, 'photo', st.photo_url, 'card_number', c.card_number,
      'matricule', coalesce(st.registration_number, st.student_number), 'class', st.class_name,
      'year', st.academic_year, 'status', st.status, 'version', c.version, 'issued_at', c.issued_at,
      'payment_ok', public.student_fully_paid(st),
      'reason', case when public.student_fully_paid(st) then null else 'Écolage non soldé : reste ' || to_char(coalesce(st.remaining_fee, 0), 'FM999G999G999') || ' F CFA' end);
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
      'points', cu.loyalty_points, 'photo', cu.photo_url, 'version', c.version, 'issued_at', c.issued_at);
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
end $$;

-- Validation par l'administration : la famille n'est invitée à consulter la carte que si l'écolage est soldé
create or replace function public.validate_card(card uuid)
returns int language plpgsql security definer set search_path = public as $$
declare c public.id_cards; st public.students; n int; paid boolean := true;
begin
  if not public.is_manager() then raise exception 'Réservé à l''administration' using errcode = '42501'; end if;
  select * into c from public.id_cards where id = card;
  if c.id is null then raise exception 'Carte introuvable'; end if;
  update public.id_cards set review_status = 'envoyee', validated_at = now() where id = card;
  if c.holder_type = 'eleve' then
    select * into st from public.students where id = c.student_id;
    paid := public.student_fully_paid(st);
  end if;
  insert into public.notifications (profile_id, kind, title, body, link)
  select h, 'carte',
         case when paid then 'Votre carte est validée' else 'Carte scolaire prête' end,
         case when paid then 'Votre carte ' || coalesce(c.card_number, '') || ' est disponible dans votre espace : consultez-la, téléchargez-la ou imprimez-la.'
              else 'Votre carte ' || coalesce(c.card_number, '') || ' sera disponible et valide dans votre espace dès que l''écolage sera entièrement payé (reste '
                   || to_char(coalesce(st.remaining_fee, 0), 'FM999G999G999') || ' F CFA).' end,
         case when paid then '/espace/carte' else '/espace/paiements' end
    from public.card_holders(c) h;
  get diagnostics n = row_count;
  return n;
end $$;

-- Le jour où l'écolage est soldé : la carte devient valide et la famille est prévenue
create or replace function public.on_student_fully_paid()
returns trigger language plpgsql security definer set search_path = public as $$
declare c public.id_cards;
begin
  if coalesce(old.remaining_fee, 0) > 0 and coalesce(new.remaining_fee, 0) <= 0 then
    select * into c from public.id_cards where student_id = new.id and not revoked order by issued_at desc nulls last limit 1;
    perform public.notify_student_family(
      new.id, 'carte', 'Écolage soldé : carte scolaire disponible',
      'L''écolage de ' || new.first_name || ' ' || new.last_name || ' est entièrement payé. '
        || case when c.id is null then 'La carte scolaire sera émise par l''administration et apparaîtra dans votre espace.'
                when coalesce(c.review_status, 'envoyee') = 'envoyee' then 'La carte scolaire ' || coalesce(c.card_number, '') || ' est désormais valide et disponible dans votre espace.'
                else 'La carte scolaire est en cours de validation par l''administration.' end,
      '/espace/carte');
  end if;
  return new;
end $$;
drop trigger if exists student_fully_paid_notify on public.students;
create trigger student_fully_paid_notify after update of remaining_fee on public.students for each row execute function public.on_student_fully_paid();

-- 3. Temps réel : situation, paiements et reçus à jour dès qu'un paiement arrive
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'students') then
    alter publication supabase_realtime add table public.students;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'fee_payments') then
    alter publication supabase_realtime add table public.fee_payments;
  end if;
end $$;
