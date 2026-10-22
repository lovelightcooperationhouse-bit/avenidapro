-- ════════════════════════════════════════════════════════════════════════════
-- 1. E-mail du tuteur (pré-inscription → fiche élève) : envoi de la fiche d'inscription
-- ════════════════════════════════════════════════════════════════════════════
alter table public.applications add column if not exists guardian_email text;
alter table public.students add column if not exists guardian_email text;
alter table public.students add column if not exists application_id uuid references public.applications(id) on delete set null;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Écolage : chaque paiement validé met à jour le payé et le reste de l'élève
--    (le matricule reflète partout la situation réelle)
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.student_by_ref(ref text)
returns uuid language sql stable security definer set search_path = public as $$
  select s.id from public.students s
   where s.id::text = ref or s.registration_number = ref or s.student_number = ref
   limit 1
$$;

create or replace function public.recompute_student_fees(sid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare paid numeric;
begin
  select coalesce(sum(p.amount), 0) into paid
    from public.fee_payments p
   where public.student_by_ref(p.student_id) = sid and coalesce(p.status, 'validé') in ('validé', 'valide', 'confirmé');
  update public.students
     set paid_fee = paid, remaining_fee = greatest(coalesce(total_fee, 0) - paid, 0), updated_at = now()
   where id = sid;
end $$;

-- Numéro de reçu automatique : REC26-000001
create or replace function public.before_fee_payment()
returns trigger language plpgsql security definer set search_path = public as $$
declare st public.students; n int; p text := 'REC' || to_char(now(), 'YY');
begin
  if new.receipt_number is null or new.receipt_number = '' then
    insert into public.matricule_counters (prefix, last_value) values (p, 1)
    on conflict (prefix) do update set last_value = matricule_counters.last_value + 1
    returning last_value into n;
    new.receipt_number := p || '-' || lpad(n::text, 6, '0');
  end if;
  select * into st from public.students where id = public.student_by_ref(new.student_id);
  if st.id is not null then
    new.student_id := st.id::text;
    new.student_name := coalesce(new.student_name, st.first_name || ' ' || st.last_name);
    new.student_matricule := coalesce(new.student_matricule, st.registration_number);
    new.class_name := coalesce(new.class_name, st.class_name);
    new.total_due := coalesce(new.total_due, st.total_fee);
  end if;
  new.status := coalesce(new.status, 'validé');
  new.payment_date := coalesce(new.payment_date, now());
  return new;
end $$;
drop trigger if exists fee_payment_0_before on public.fee_payments;
create trigger fee_payment_0_before before insert on public.fee_payments for each row execute function public.before_fee_payment();

create or replace function public.after_fee_payment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then perform public.recompute_student_fees(public.student_by_ref(old.student_id)); end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recompute_student_fees(public.student_by_ref(new.student_id));
    update public.fee_payments set remaining_due = (select remaining_fee from public.students where id = public.student_by_ref(new.student_id))
     where id = new.id and remaining_due is distinct from (select remaining_fee from public.students where id = public.student_by_ref(new.student_id));
  end if;
  return null;
end $$;
-- « 0 » : s'exécute avant la notification (fee_payment_notify) pour annoncer le bon reste à payer
drop trigger if exists fee_payment_0_recompute on public.fee_payments;
create trigger fee_payment_0_recompute after insert or update of amount, status, student_id or delete on public.fee_payments
  for each row execute function public.after_fee_payment();

-- Montant total modifié sur la fiche (bourse, remise…) → reste recalculé
create or replace function public.on_student_total_change()
returns trigger language plpgsql as $$
begin
  if new.total_fee is distinct from old.total_fee then
    new.remaining_fee := greatest(coalesce(new.total_fee, 0) - coalesce(new.paid_fee, 0), 0);
  end if;
  return new;
end $$;
drop trigger if exists student_total_change on public.students;
create trigger student_total_change before update of total_fee on public.students for each row execute function public.on_student_total_change();

-- La caisse est tenue par la comptabilité et la direction générale ; la pédagogie consulte
drop policy if exists staff_all on public.fee_payments;
drop policy if exists finance_all on public.fee_payments;
create policy finance_all on public.fee_payments for all to authenticated
  using (public.app_role() in ('directeur_general', 'comptable')) with check (public.app_role() in ('directeur_general', 'comptable'));
drop policy if exists managers_select on public.fee_payments;
create policy managers_select on public.fee_payments for select to authenticated using (public.is_manager());

-- ════════════════════════════════════════════════════════════════════════════
-- 3. Inscription définitive depuis une pré-inscription (une seule opération) :
--    élève classé dans sa filière et sa classe, matricule, écolage, carte, comptes rattachés
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.guard_profile_admin_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role
      or new.student_id is distinct from old.student_id
      or new.employee_id is distinct from old.employee_id
      or new.customer_id is distinct from old.customer_id
      or new.is_active is distinct from old.is_active)
     and not public.is_director()
     and coalesce(current_setting('avenida.enroll', true), '') <> 'on'
     and auth.uid() is not null then
    raise exception 'Seule la Direction Générale peut modifier le rôle ou les rattachements d''un compte';
  end if;
  return new;
end $$;

create or replace function public.enroll_application(app uuid, p_class text default null, p_total numeric default null)
returns jsonb language plpgsql security definer set search_path = public as $$
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
  if public.app_role() not in ('directeur_general', 'directeur_pedagogique') then
    raise exception 'Inscription réservée à la direction et à la pédagogie' using errcode = '42501';
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
end $$;
revoke execute on function public.enroll_application(uuid, text, numeric) from public, anon;
grant execute on function public.enroll_application(uuid, text, numeric) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. Cartes : numéro automatique pour chaque carte, cartes de fidélité des clients de l'hôtel
--    CE26-0001 (élève) · CT26-0001 (travail) · CF26-0001 (fidélité)
-- ════════════════════════════════════════════════════════════════════════════
alter table public.id_cards add column if not exists customer_id uuid references public.hotel_customers(id) on delete cascade;
alter table public.id_cards add column if not exists card_number text;
create unique index if not exists id_cards_customer_key on public.id_cards (customer_id) where customer_id is not null;
create unique index if not exists id_cards_number_key on public.id_cards (card_number) where card_number is not null;
alter table public.id_cards drop constraint if exists id_cards_holder_type_check;
alter table public.id_cards add constraint id_cards_holder_type_check check (holder_type in ('eleve', 'personnel', 'client'));
alter table public.id_cards drop constraint if exists id_cards_check;
alter table public.id_cards add constraint id_cards_check check (
  (holder_type = 'eleve' and student_id is not null) or (holder_type = 'personnel' and employee_id is not null) or (holder_type = 'client' and customer_id is not null));

alter table public.hotel_customers add column if not exists loyalty_points int not null default 0;

create or replace function public.next_card_number(kind text)
returns text language plpgsql security definer set search_path = public as $$
declare p text := case kind when 'eleve' then 'CE' when 'personnel' then 'CT' else 'CF' end || to_char(now(), 'YY'); n int;
begin
  insert into public.matricule_counters (prefix, last_value) values (p, 1)
  on conflict (prefix) do update set last_value = matricule_counters.last_value + 1
  returning last_value into n;
  return p || '-' || lpad(n::text, 4, '0');
end $$;

create or replace function public.before_id_card()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.card_number is null then new.card_number := public.next_card_number(new.holder_type); end if;
  return new;
end $$;
drop trigger if exists id_card_number on public.id_cards;
create trigger id_card_number before insert on public.id_cards for each row execute function public.before_id_card();
update public.id_cards set card_number = public.next_card_number(holder_type) where card_number is null;

drop policy if exists hotel_cards on public.id_cards;
create policy hotel_cards on public.id_cards for all to authenticated
  using (holder_type = 'client' and public.app_role() in ('directeur_general', 'responsable_hotel', 'comptable'))
  with check (holder_type = 'client' and public.app_role() in ('directeur_general', 'responsable_hotel', 'comptable'));
drop policy if exists client_own on public.id_cards;
create policy client_own on public.id_cards for select to authenticated
  using (customer_id is not null and exists (select 1 from public.profiles p where p.id = auth.uid() and p.customer_id = id_cards.customer_id));

-- Vérification publique d'une carte (QR) : ajoute les cartes de fidélité
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
end $$;

-- Pré-inscription publique : l'e-mail du tuteur est accepté
-- (la fonction d'insertion publique reprend toutes les colonnes envoyées par le formulaire)
