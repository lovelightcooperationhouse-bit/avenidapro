-- ════════════════════════════════════════════════════════════════════════════
-- Paiement en ligne des frais d'inscription et de l'écolage (PayDunya : Mixx by Yas, Moov Money, carte)
--   · l'élève et ses parents paient l'écolage depuis leur espace (prochaine échéance, tout le reste ou un montant libre) ;
--   · le candidat admis paie ses frais d'inscription avant l'inscription définitive ;
--   · le paiement n'est enregistré qu'après vérification serveur auprès de PayDunya, puis devient un reçu officiel
--     (fee_payments : numéro REC, reste à payer recalculé, notification à la famille).
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.school_payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  payer_name text,
  payer_email text,
  payer_phone text,
  designation text not null,
  amount bigint not null check (amount > 0),
  method text not null check (method in ('carte', 'yas', 'moov')),
  provider text not null default 'paydunya',
  identifier text not null unique,
  provider_ref text,
  status text not null default 'en_cours' check (status in ('en_cours', 'reussi', 'echoue')),
  raw jsonb,
  fee_payment_id uuid references public.fee_payments(id) on delete set null,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  check (student_id is not null or application_id is not null)
);
create index if not exists school_payments_student_idx on public.school_payments (student_id);
create index if not exists school_payments_application_idx on public.school_payments (application_id);
create index if not exists school_payments_ref_idx on public.school_payments (provider_ref);

alter table public.school_payments enable row level security;
drop policy if exists linked_select on public.school_payments;
create policy linked_select on public.school_payments for select to authenticated using (
  public.app_role() in ('directeur_general', 'comptable')
  or (student_id is not null and public.can_see_student(student_id))
  or (application_id is not null and exists (select 1 from public.applications a where a.id = application_id and lower(a.email) = lower(auth.jwt() ->> 'email')))
);

-- Qui peut payer pour un élève : l'élève lui-même, ses parents rattachés, la direction générale et la comptabilité
create or replace function public.can_pay_student(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in ('directeur_general', 'comptable'), false)
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'eleve' and p.student_id = sid)
    or exists (select 1 from public.parent_students ps where ps.parent_id = auth.uid() and ps.student_id = sid)
$$;

-- Frais d'inscription d'un programme : inscription seule, et inscription + fournitures
create or replace function public._program_registration(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('registration', coalesce(pr.registration_fee, 0), 'supplies', coalesce(pr.supplies_fee, 0))
    from public.programs pr where pr.code = p_code
$$;

-- Dossiers que l'utilisateur connecté peut régler en ligne
create or replace function public.my_school_payments()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); mail text := lower(auth.jwt() ->> 'email'); out_students jsonb; out_apps jsonb;
begin
  if uid is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', s.id, 'name', s.first_name || ' ' || s.last_name, 'matricule', coalesce(s.registration_number, s.student_number),
           'class', s.class_name, 'year', s.academic_year, 'program', s.program_code,
           'total', coalesce(s.total_fee, 0), 'paid', coalesce(s.paid_fee, 0), 'remaining', coalesce(s.remaining_fee, 0),
           'fees', coalesce(public._program_registration(s.program_code), '{}'::jsonb),
           'online', (select coalesce(jsonb_agg(jsonb_build_object('identifier', sp.identifier, 'date', sp.created_at, 'amount', sp.amount, 'designation', sp.designation,
                                                                   'method', sp.method, 'status', sp.status, 'receipt', sp.fee_payment_id) order by sp.created_at desc), '[]'::jsonb)
                        from (select * from public.school_payments x where x.student_id = s.id order by x.created_at desc limit 10) sp)
         ) order by s.first_name), '[]'::jsonb)
    into out_students
    from public.students s
   where coalesce(s.is_archived, false) = false
     and (exists (select 1 from public.profiles p where p.id = uid and p.role = 'eleve' and p.student_id = s.id)
          or exists (select 1 from public.parent_students ps where ps.parent_id = uid and ps.student_id = s.id));

  -- Candidat admis, pas encore inscrit : frais d'inscription payables en ligne
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'reference', a.reference, 'name', a.first_name || ' ' || a.last_name, 'program', a.program_code, 'specialty', a.specialty,
           'fees', coalesce(public._program_registration(a.program_code), '{}'::jsonb),
           'paid', (select coalesce(sum(amount), 0) from public.school_payments x where x.application_id = a.id and x.status = 'reussi'),
           'online', (select coalesce(jsonb_agg(jsonb_build_object('identifier', x.identifier, 'date', x.created_at, 'amount', x.amount, 'designation', x.designation,
                                                                   'method', x.method, 'status', x.status) order by x.created_at desc), '[]'::jsonb)
                        from public.school_payments x where x.application_id = a.id)
         ) order by a.created_at desc), '[]'::jsonb)
    into out_apps
    from public.applications a
   where mail is not null and lower(a.email) = mail and a.status = 'acceptee' and a.student_id is null;

  return jsonb_build_object('students', out_students, 'applications', out_apps);
end $$;
revoke execute on function public.my_school_payments() from public, anon;
grant execute on function public.my_school_payments() to authenticated;

-- Préparation d'un paiement en ligne (appelée par le serveur au nom de l'utilisateur connecté) : droits et montant vérifiés
create or replace function public.prepare_school_payment(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  mail text := lower(auth.jwt() ->> 'email');
  v_method text := p->>'method';
  v_amount bigint := floor(coalesce(nullif(p->>'amount', '')::numeric, 0));
  v_designation text := left(coalesce(nullif(trim(p->>'designation'), ''), 'Écolage'), 120);
  st public.students;
  app public.applications;
  fees jsonb;
  already bigint;
  prof public.profiles;
  v_ident text;
  v_label text;
  v_ref text;
begin
  if uid is null then raise exception 'Connectez-vous pour payer en ligne.' using errcode = '42501'; end if;
  if v_method not in ('carte', 'yas', 'moov') then raise exception 'Moyen de paiement invalide.'; end if;
  select * into prof from public.profiles where id = uid;

  if nullif(p->>'student_id', '') is not null then
    select * into st from public.students where id = (p->>'student_id')::uuid;
    if st.id is null or not public.can_pay_student(st.id) then raise exception 'Dossier introuvable.' using errcode = '42501'; end if;
    if coalesce(st.remaining_fee, 0) <= 0 then raise exception 'L''écolage de cet élève est déjà entièrement payé.'; end if;
    if v_amount < 500 then raise exception 'Montant minimum : 500 F CFA.'; end if;
    if v_amount > st.remaining_fee then raise exception 'Le montant dépasse le reste à payer (% F CFA).', st.remaining_fee; end if;
    v_ref := regexp_replace(coalesce(st.registration_number, st.student_number, 'ELEVE'), '[^A-Za-z0-9]', '', 'g');
    v_label := v_designation || ' · ' || st.first_name || ' ' || st.last_name || coalesce(' (' || st.registration_number || ')', '');
  elsif nullif(p->>'application_id', '') is not null then
    select * into app from public.applications where id = (p->>'application_id')::uuid;
    if app.id is null or mail is null or lower(app.email) <> mail then raise exception 'Dossier introuvable.' using errcode = '42501'; end if;
    if app.status <> 'acceptee' or app.student_id is not null then raise exception 'Les frais d''inscription se paient en ligne une fois le dossier accepté.'; end if;
    fees := coalesce(public._program_registration(app.program_code), '{}'::jsonb);
    select coalesce(sum(amount), 0) into already from public.school_payments where application_id = app.id and status = 'reussi';
    -- Frais d'inscription seuls, ou inscription + fournitures, moins ce qui a déjà été payé en ligne
    if p->>'option' = 'inscription_fournitures' then
      v_amount := (fees->>'registration')::bigint + (fees->>'supplies')::bigint - already;
      v_designation := 'Frais d''inscription et fournitures';
    else
      v_amount := (fees->>'registration')::bigint - already;
      v_designation := 'Frais d''inscription';
    end if;
    if v_amount <= 0 then raise exception 'Ces frais sont déjà payés.'; end if;
    v_ref := regexp_replace(coalesce(app.reference, 'CAND'), '[^A-Za-z0-9]', '', 'g');
    v_label := v_designation || ' · ' || app.first_name || ' ' || app.last_name || ' · ' || app.program_code || coalesce(' (dossier ' || app.reference || ')', '');
  else
    raise exception 'Dossier manquant.';
  end if;

  -- Identifiant unique par tentative (sans caractères spéciaux)
  v_ident := 'ECO' || left(upper(v_ref), 14) || 'T' || upper(to_hex((extract(epoch from clock_timestamp()) * 1000)::bigint));
  insert into public.school_payments (student_id, application_id, profile_id, payer_name, payer_email, payer_phone, designation, amount, method, identifier)
  values (st.id, app.id, uid,
          coalesce(nullif(trim(coalesce(prof.first_name, '') || ' ' || coalesce(prof.last_name, '')), ''), app.first_name || ' ' || app.last_name, st.first_name || ' ' || st.last_name),
          coalesce(prof.email, app.email), coalesce(prof.phone, app.phone, st.phone),
          v_designation, v_amount, v_method, v_ident);
  return jsonb_build_object('identifier', v_ident, 'amount', v_amount, 'label', left(v_label, 200), 'designation', v_designation,
    'payer_name', coalesce(nullif(trim(coalesce(prof.first_name, '') || ' ' || coalesce(prof.last_name, '')), ''), 'Famille Avenida'),
    'payer_email', coalesce(prof.email, app.email), 'payer_phone', coalesce(prof.phone, app.phone, st.phone));
end $$;
revoke execute on function public.prepare_school_payment(jsonb) from public, anon;
grant execute on function public.prepare_school_payment(jsonb) to authenticated;

-- Reçu officiel (fee_payments) créé à partir d'un paiement en ligne réussi
create or replace function public._school_payment_receipt(sp public.school_payments, sid uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  insert into public.fee_payments (student_id, amount, payment_method, designation, depositor_name, depositor_phone, cashier_name, status, payment_date, raw_data)
  values (sid::text, sp.amount,
          case sp.method when 'yas' then 'Mixx by Yas (en ligne)' when 'moov' then 'Moov Money (en ligne)' else 'Carte bancaire (en ligne)' end,
          sp.designation, sp.payer_name, sp.payer_phone, 'Paiement en ligne · PayDunya', 'validé', coalesce(sp.processed_at, now())::date,
          jsonb_build_object('online', true, 'identifier', sp.identifier, 'provider', sp.provider, 'provider_ref', sp.provider_ref))
  returning id into fid;
  update public.school_payments set fee_payment_id = fid, student_id = sid where id = sp.id;
  return fid;
end $$;
revoke execute on function public._school_payment_receipt(public.school_payments, uuid) from public, anon, authenticated;

-- Paiement confirmé par le serveur après vérification auprès de PayDunya (clé de service uniquement)
create or replace function public.apply_school_payment(ident text, pref text, details jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare sp public.school_payments; fid uuid; who text; app public.applications;
begin
  select * into sp from public.school_payments where identifier = ident for update;
  if not found then raise exception 'Paiement inconnu'; end if;
  if sp.status = 'reussi' then return jsonb_build_object('already', true, 'fee_payment_id', sp.fee_payment_id); end if;
  update public.school_payments set status = 'reussi', provider_ref = coalesce(pref, provider_ref), raw = details, processed_at = now()
   where id = sp.id returning * into sp;

  if sp.student_id is not null then
    fid := public._school_payment_receipt(sp, sp.student_id);
    select first_name || ' ' || last_name into who from public.students where id = sp.student_id;
  else
    select * into app from public.applications where id = sp.application_id;
    who := app.first_name || ' ' || app.last_name;
    -- Déjà inscrit entre-temps : le reçu est créé tout de suite
    if app.student_id is not null then fid := public._school_payment_receipt(sp, app.student_id); end if;
    if app.email is not null then
      insert into public.notifications (profile_id, kind, title, body, link)
      select pr.id, 'paiement', 'Frais d''inscription payés',
             'Merci : ' || to_char(sp.amount, 'FM999G999G999') || ' F reçus. Présentez-vous au bureau des inscriptions pour finaliser votre inscription.', '/espace/paiements'
        from public.profiles pr where lower(pr.email) = lower(app.email);
    end if;
  end if;

  insert into public.notifications (profile_id, kind, title, body, link)
  select pr.id, 'paiement', 'Paiement en ligne reçu · ' || sp.designation,
         coalesce(who, '') || ' · ' || to_char(sp.amount, 'FM999G999G999') || ' F (' ||
         case sp.method when 'yas' then 'Mixx by Yas' when 'moov' then 'Moov Money' else 'Carte bancaire' end || ', PayDunya)',
         case when sp.student_id is not null then '/dashboard/ecolage' else '/dashboard/admissions' end
    from public.profiles pr where pr.role in ('directeur_general', 'comptable') and coalesce(pr.is_active, true);
  return jsonb_build_object('already', false, 'fee_payment_id', fid, 'student_id', sp.student_id, 'application_id', sp.application_id);
end $$;
revoke execute on function public.apply_school_payment(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_school_payment(text, text, jsonb) to service_role;

-- Inscription définitive : les frais d'inscription payés en ligne par le candidat deviennent des reçus de l'élève
create or replace function public.on_student_from_application()
returns trigger language plpgsql security definer set search_path = public as $$
declare sp public.school_payments;
begin
  if new.application_id is null then return new; end if;
  for sp in select * from public.school_payments where application_id = new.application_id and status = 'reussi' and fee_payment_id is null loop
    perform public._school_payment_receipt(sp, new.id);
  end loop;
  return new;
end $$;
drop trigger if exists student_online_registration on public.students;
create trigger student_online_registration after insert or update of application_id on public.students
  for each row execute function public.on_student_from_application();

alter publication supabase_realtime add table public.school_payments;
