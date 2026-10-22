-- ════════════════════════════════════════════════════════════════════════════
-- 1. Archives : dossiers et documents vérifiés, conservés dans un stockage dédié
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.archives (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  archived_by uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('preinscription', 'dossier_membre', 'permission', 'demande_contact', 'reservation', 'carte', 'bulletin', 'recu', 'fiche', 'autre')),
  title text not null,
  owner_name text,
  reference text,
  ref_type text,
  ref_id text,
  year text not null default to_char(now(), 'YYYY'),
  files jsonb not null default '[]'::jsonb,
  data jsonb not null default '{}'::jsonb,
  notes text,
  verified boolean not null default true
);
create index if not exists archives_kind_idx on public.archives (kind, created_at desc);
create index if not exists archives_ref_idx on public.archives (ref_type, ref_id);
alter table public.archives enable row level security;
drop policy if exists managers_all on public.archives;
create policy managers_all on public.archives for all to authenticated using (public.is_manager()) with check (public.is_manager());

insert into storage.buckets (id, name, public, file_size_limit)
values ('archives', 'archives', false, 52428800)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;
drop policy if exists archives_managers on storage.objects;
create policy archives_managers on storage.objects for all to authenticated
  using (bucket_id = 'archives' and public.is_manager()) with check (bucket_id = 'archives' and public.is_manager());

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Notes par trimestre et bulletins numériques vérifiables (QR)
-- ════════════════════════════════════════════════════════════════════════════
alter table public.grades add column if not exists term int;
alter table public.grades add column if not exists academic_year text;
create index if not exists grades_student_term_idx on public.grades (student_id, academic_year, term);
alter table public.report_cards add column if not exists token text unique default replace(gen_random_uuid()::text, '-', '');
alter table public.report_cards add column if not exists published boolean not null default false;
update public.report_cards set token = replace(gen_random_uuid()::text, '-', '') where token is null;
create unique index if not exists report_cards_student_term_key on public.report_cards (student_id, academic_year, term);

alter table public.fee_payments add column if not exists token text unique default replace(gen_random_uuid()::text, '-', '');
update public.fee_payments set token = replace(gen_random_uuid()::text, '-', '') where token is null;

-- Vérification publique d'un bulletin ou d'un reçu (QR imprimé sur le document)
create or replace function public.verify_document(k text, t text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r public.report_cards; p public.fee_payments;
begin
  if k = 'bulletin' then
    select * into r from public.report_cards where token = t;
    if r.id is null then return jsonb_build_object('valid', false, 'reason', 'Bulletin inconnu'); end if;
    return jsonb_build_object('valid', true, 'type', 'bulletin', 'name', r.student_name, 'matricule', r.student_matricule, 'class', r.class_name,
      'year', r.academic_year, 'period', coalesce(r.period, 'Trimestre ' || r.term), 'average', r.general_average, 'rank', r.rank_display,
      'mention', r.mention, 'number', r.bulletin_number, 'issued', r.issue_date);
  elsif k = 'recu' then
    select * into p from public.fee_payments where token = t;
    if p.id is null then return jsonb_build_object('valid', false, 'reason', 'Reçu inconnu'); end if;
    return jsonb_build_object('valid', coalesce(p.status, 'validé') in ('validé', 'valide', 'confirmé'), 'type', 'recu', 'number', p.receipt_number,
      'name', p.student_name, 'matricule', p.student_matricule, 'class', p.class_name, 'amount', p.amount, 'designation', p.designation,
      'date', coalesce(p.payment_date, p.created_at), 'remaining', p.remaining_due, 'method', p.payment_method);
  end if;
  return jsonb_build_object('valid', false, 'reason', 'Type de document inconnu');
end $$;
grant execute on function public.verify_document(text, text) to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 3. Suivi des dossiers : le membre est prévenu à chaque étape (avant la décision finale)
-- ════════════════════════════════════════════════════════════════════════════
create or replace function public.on_application_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare t text; b text;
begin
  if new.status is not distinct from old.status then return new; end if;
  t := case new.status
    when 'en_etude' then 'Votre pré-inscription est en cours d''étude'
    when 'pieces_manquantes' then 'Pièces manquantes à votre dossier'
    when 'acceptee' then 'Votre candidature est acceptée'
    when 'refusee' then 'Votre candidature n''a pas été retenue'
    when 'inscrite' then 'Inscription définitive confirmée'
    else null end;
  if t is null then return new; end if;
  b := 'Dossier ' || coalesce(new.reference, '') || ' · ' || coalesce(new.program_code, '') || ' ' || coalesce(new.specialty, '') || '.';
  insert into public.notifications (profile_id, kind, title, body, link)
  select p.id, 'admission', t, b, '/espace' from public.profiles p
   where lower(p.email) in (lower(new.email), lower(coalesce(new.guardian_email, '')));
  return new;
end $$;
drop trigger if exists application_status_notify on public.applications;
create trigger application_status_notify after update of status on public.applications for each row execute function public.on_application_status();

create or replace function public.on_member_application_progress()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status = 'en_examen' then
    insert into public.notifications (profile_id, kind, title, body, link)
    values (new.profile_id, 'adhesion', 'Votre dossier est en cours d''examen', 'Le service concerné vérifie vos informations et vos pièces.', '/espace/profil');
  elsif new.status in ('avis_favorable', 'avis_defavorable') then
    insert into public.notifications (profile_id, kind, title, body, link)
    values (new.profile_id, 'adhesion', 'Votre dossier est transmis pour décision finale', 'Le service a terminé son examen ; la Direction générale va rendre sa décision.', '/espace/profil');
  end if;
  return new;
end $$;
drop trigger if exists member_application_progress on public.member_applications;
create trigger member_application_progress after update of status on public.member_applications for each row execute function public.on_member_application_progress();

-- Bulletin publié → l'élève et ses parents sont prévenus (espace + e-mail)
create or replace function public.on_report_card_published()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.published and (tg_op = 'INSERT' or not old.published) and public.try_uuid(new.student_id) is not null then
    perform public.notify_student_family(public.try_uuid(new.student_id), 'bulletin',
      'Bulletin disponible : ' || coalesce(new.period, 'trimestre ' || new.term),
      'Moyenne générale : ' || coalesce(to_char(new.general_average, 'FM90.00'), '—') || '/20' || coalesce(' · rang ' || new.rank_display, '') || '.',
      '/espace/bulletins');
  end if;
  return new;
end $$;
drop trigger if exists report_card_published on public.report_cards;
create trigger report_card_published after insert or update of published on public.report_cards for each row execute function public.on_report_card_published();

-- Reçus : l'écolage annuel est repris de la fiche de l'élève (la colonne vaut 0 par défaut)
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
    new.total_due := case when coalesce(new.total_due, 0) = 0 then st.total_fee else new.total_due end;
  end if;
  new.status := coalesce(new.status, 'validé');
  new.payment_date := coalesce(new.payment_date, now());
  return new;
end $$;
update public.fee_payments p set total_due = s.total_fee from public.students s where coalesce(p.total_due, 0) = 0 and s.id = public.student_by_ref(p.student_id);
