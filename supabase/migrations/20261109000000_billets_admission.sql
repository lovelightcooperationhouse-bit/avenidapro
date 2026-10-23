-- ════════════════════════════════════════════════════════════════════════════
-- Billets d'admission en classe : après une permission accordée, une absence justifiée
-- ou un retard régularisé, l'élève reçoit un billet (numéro + QR) à présenter avant de
-- réintégrer la classe. Imprimable au secrétariat, dans l'espace de l'élève et du parent,
-- envoyé par e-mail. Les absences non justifiées restent signalées jusqu'à justification.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.student_attendance add column if not exists justified boolean not null default false;
alter table public.student_attendance add column if not exists justification text;
alter table public.student_attendance add column if not exists justified_by uuid references public.profiles(id) on delete set null;
alter table public.student_attendance add column if not exists justified_at timestamptz;

create table if not exists public.class_access_slips (
  id uuid primary key default gen_random_uuid(),
  number text unique,
  token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  student_id uuid not null references public.students(id) on delete cascade,
  kind text not null check (kind in ('permission', 'absence', 'retard')),
  permission_id uuid references public.permission_requests(id) on delete set null,
  attendance_id uuid references public.student_attendance(id) on delete set null,
  period_start date,
  period_end date,
  return_date date not null,
  reason text,
  decision_note text,
  issued_by uuid references public.profiles(id) on delete set null,
  issued_by_name text,
  issued_at timestamptz not null default now(),
  status text not null default 'valide' check (status in ('valide', 'presente', 'annule')),
  presented_at timestamptz,
  presented_by_name text,
  created_at timestamptz not null default now()
);
create index if not exists class_access_slips_student on public.class_access_slips (student_id, issued_at desc);

alter table public.class_access_slips enable row level security;
drop policy if exists slips_read on public.class_access_slips;
create policy slips_read on public.class_access_slips for select
  using (public.is_staff() or public.can_see_student(student_id) or public.teaches_student(student_id));
drop policy if exists slips_staff_write on public.class_access_slips;
create policy slips_staff_write on public.class_access_slips for all using (public.is_staff()) with check (public.is_staff());

-- Numéro BA26-0001 attribué à la création, nom de l'émetteur, famille prévenue (espace + e-mail)
create or replace function public.before_access_slip()
returns trigger language plpgsql security definer set search_path = public as $$
declare p text := 'BA' || to_char(now(), 'YY'); n int;
begin
  if new.number is null then
    insert into public.matricule_counters (prefix, last_value) values (p, 1)
    on conflict (prefix) do update set last_value = matricule_counters.last_value + 1
    returning last_value into n;
    new.number := p || '-' || lpad(n::text, 4, '0');
  end if;
  if new.issued_by is null then new.issued_by := auth.uid(); end if;
  if new.issued_by_name is null then
    select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), email) into new.issued_by_name from public.profiles where id = new.issued_by;
  end if;
  return new;
end $$;
drop trigger if exists access_slip_number on public.class_access_slips;
create trigger access_slip_number before insert on public.class_access_slips for each row execute function public.before_access_slip();

create or replace function public.after_access_slip()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_student_family(new.student_id, 'correspondance',
    'Billet d''admission en classe n° ' || new.number,
    'À présenter au professeur pour réintégrer la classe le ' || to_char(new.return_date, 'DD/MM/YYYY') || '. Téléchargez-le ou imprimez-le depuis votre espace.',
    '/espace/correspondance');
  return new;
end $$;
drop trigger if exists access_slip_notify on public.class_access_slips;
create trigger access_slip_notify after insert on public.class_access_slips for each row execute function public.after_access_slip();

-- Permission accordée → billet d'admission automatique (retour en classe le lendemain de la fin)
create or replace function public.on_permission_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare st public.students;
begin
  select * into st from public.students where id = new.student_id;
  if tg_op = 'INSERT' then
    insert into public.notifications (profile_id, kind, title, body, link)
    select p.id, 'permission', 'Nouvelle demande de permission', st.first_name || ' ' || st.last_name || ' du ' || to_char(new.start_date, 'DD/MM') || ' au ' || to_char(new.end_date, 'DD/MM'), '/dashboard/correspondance'
      from public.profiles p where p.role in ('directeur_general', 'directeur_pedagogique') and p.is_active is not false;
  elsif new.status <> old.status then
    perform public.notify_student_family(
      new.student_id, 'permission',
      'Permission ' || case new.status when 'acceptee' then 'accordée' else 'refusée' end || ' : ' || st.first_name,
      'Demande du ' || to_char(new.start_date, 'DD/MM/YYYY') || ' au ' || to_char(new.end_date, 'DD/MM/YYYY') || coalesce('. Réponse : ' || new.response, '') || '.',
      '/espace/correspondance'
    );
    if new.status = 'acceptee' then
      -- Les jours de permission sont reportés (et justifiés) sur la fiche de correspondance
      insert into public.student_attendance (student_id, date, status, note, recorded_by, justified, justification, justified_by, justified_at)
      select new.student_id, d::date, 'permission', 'Permission accordée', new.decided_by, true, new.reason, new.decided_by, now()
        from generate_series(new.start_date, new.end_date, interval '1 day') d
      on conflict (student_id, date, period) do update
        set status = 'permission', note = 'Permission accordée', justified = true, justification = excluded.justification, justified_by = excluded.justified_by, justified_at = now();
      insert into public.class_access_slips (student_id, kind, permission_id, period_start, period_end, return_date, reason, decision_note, issued_by)
      values (new.student_id, 'permission', new.id, new.start_date, new.end_date, new.end_date + 1, new.reason, new.response, new.decided_by);
    end if;
  end if;
  return new;
end $$;

-- Absence ou retard vérifié et justifié par l'administration → billet d'admission
create or replace function public.justify_attendance(att uuid, reason text, return_on date default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare a public.student_attendance; sid uuid;
begin
  if not public.is_staff() then raise exception 'Réservé à l''administration' using errcode = '42501'; end if;
  select * into a from public.student_attendance where id = att;
  if a.id is null then raise exception 'Absence introuvable'; end if;
  if a.status not in ('absent', 'retard') then raise exception 'Seules une absence ou un retard se justifient'; end if;
  if coalesce(trim(reason), '') = '' then raise exception 'Indiquez le motif vérifié (justificatif, appel du parent…)'; end if;
  update public.student_attendance set justified = true, justification = trim(reason), justified_by = auth.uid(), justified_at = now() where id = att;
  insert into public.class_access_slips (student_id, kind, attendance_id, period_start, period_end, return_date, reason)
  values (a.student_id, case when a.status = 'retard' then 'retard' else 'absence' end, a.id, a.date, a.date,
          coalesce(return_on, case when a.status = 'retard' then a.date else greatest(a.date + 1, current_date) end), trim(reason))
  returning id into sid;
  return sid;
end $$;
revoke execute on function public.justify_attendance(uuid, text, date) from public, anon;
grant execute on function public.justify_attendance(uuid, text, date) to authenticated;

-- Le professeur (ou le secrétariat) enregistre la présentation du billet à l'entrée en classe
create or replace function public.present_access_slip(slip uuid)
returns void language plpgsql security definer set search_path = public as $$
declare s public.class_access_slips; who text;
begin
  select * into s from public.class_access_slips where id = slip;
  if s.id is null then raise exception 'Billet introuvable'; end if;
  if not (public.is_staff() or public.app_role() = 'professeur') then raise exception 'Réservé aux professeurs et à l''administration' using errcode = '42501'; end if;
  select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), email) into who from public.profiles where id = auth.uid();
  update public.class_access_slips set status = 'presente', presented_at = now(), presented_by_name = who where id = slip and status = 'valide';
end $$;
revoke execute on function public.present_access_slip(uuid) from public, anon;
grant execute on function public.present_access_slip(uuid) to authenticated;

-- Vérification par QR code des billets d'admission
CREATE OR REPLACE FUNCTION public.verify_document(k text, t text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.report_cards; p public.fee_payments; s public.students; b public.class_access_slips;
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
      'status', case when coalesce(s.remaining_fee, 0) <= 0 and coalesce(s.total_fee, 0) > 0 then 'En règle (écolage entièrement payé)'
                     else 'Non soldé : reste ' || to_char(coalesce(s.remaining_fee, 0), 'FM999G999G999') || ' F CFA'
                          || case when public.student_payment_ok(s) then '' else ' (en retard sur l''échéancier)' end end,
      'date', now());
  elsif k = 'billet' then
    select * into b from public.class_access_slips where token = t;
    if b.id is null then return jsonb_build_object('valid', false, 'reason', 'Billet inconnu : ce document n''a pas été émis par l''Hôtel École Avenida'); end if;
    select * into s from public.students where id = b.student_id;
    if b.status = 'annule' then return jsonb_build_object('valid', false, 'reason', 'Billet annulé par l''administration'); end if;
    return jsonb_build_object('valid', true, 'type', 'billet', 'number', b.number, 'name', s.first_name || ' ' || s.last_name,
      'matricule', s.registration_number, 'class', s.class_name,
      'motif', case b.kind when 'permission' then 'Permission accordée' when 'retard' then 'Retard justifié' else 'Absence justifiée' end,
      'period', to_char(b.period_start, 'DD/MM/YYYY') || case when b.period_end > b.period_start then ' au ' || to_char(b.period_end, 'DD/MM/YYYY') else '' end,
      'return_date', b.return_date, 'issued_by', b.issued_by_name, 'issued', b.issued_at,
      'status', case b.status when 'presente' then 'Présenté le ' || to_char(b.presented_at, 'DD/MM/YYYY HH24:MI') || coalesce(' à ' || b.presented_by_name, '') else 'Valide : à présenter à l''entrée en classe' end);
  end if;
  return jsonb_build_object('valid', false, 'reason', 'Type de document inconnu');
end $function$;

-- Alerte au parent : l'absence ou le retard doit être justifié pour obtenir le billet d'admission
CREATE OR REPLACE FUNCTION public.on_attendance_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  st public.students;
  label text;
begin
  if tg_op = 'UPDATE' and new.status = old.status and coalesce(new.note, '') = coalesce(old.note, '') then return new; end if;
  if new.status = 'present' and (tg_op = 'INSERT' or old.status = 'present') then return new; end if;
  select * into st from public.students where id = new.student_id;
  label := case new.status when 'absent' then 'absent(e)' when 'retard' then 'en retard' when 'permission' then 'en permission' else 'présent(e)' end;
  perform public.notify_student_family(
    new.student_id, 'presence',
    'Fiche de correspondance : ' || st.first_name || ' ' || label,
    st.first_name || ' ' || st.last_name || ' (' || coalesce(st.class_name, '') || ') a été noté(e) ' || label || ' le ' || to_char(new.date, 'DD/MM/YYYY')
      || coalesce('. ' || new.note, '') || '.'
      || case when new.status in ('absent', 'retard') then ' Merci de la justifier auprès de l''administration (pièce ou appel) : un billet d''admission sera délivré pour réintégrer la classe.' else '' end,
    '/espace/correspondance'
  );
  return new;
end $function$;
