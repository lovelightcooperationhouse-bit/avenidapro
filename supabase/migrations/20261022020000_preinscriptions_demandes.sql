-- ════════════════════════════════════════════════════════════════════════
-- Pré-inscriptions en ligne, pièces du dossier, demandes de contact et de réservation.
-- Le public peut DÉPOSER (insert) mais jamais LIRE ; le candidat retrouve son
-- dossier grâce à l'e-mail de son compte ; le personnel voit et traite tout.
-- ════════════════════════════════════════════════════════════════════════

-- ─── Pré-inscriptions ────────────────────────────────────────────────────
create sequence if not exists public.application_seq;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  reference text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'nouvelle'
    check (status in ('nouvelle', 'en_etude', 'pieces_manquantes', 'acceptee', 'refusee', 'inscrite')),
  -- Formation souhaitée
  program_code text not null check (program_code in ('CFA', 'CAP', 'BEP', 'BT', 'BTS', 'MODULAIRE')),
  specialty text not null,
  intake text not null,
  schedule text not null default 'jour' check (schedule in ('jour', 'soir')),
  boarding boolean not null default false,
  -- Candidat
  first_name text not null check (char_length(first_name) between 1 and 80),
  last_name text not null check (char_length(last_name) between 1 and 80),
  gender text check (gender in ('F', 'M')),
  birth_date date,
  birth_place text,
  nationality text default 'Togolaise',
  neighborhood text,
  phone text not null check (char_length(phone) between 6 and 30),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  last_class text,
  last_diploma text,
  previous_school text,
  -- Parent ou tuteur
  guardian_name text,
  guardian_phone text,
  guardian_relation text,
  guardian_profession text,
  message text check (char_length(message) <= 2000),
  -- Traitement par l'école
  staff_notes text,
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  student_id uuid references public.students(id) on delete set null
);
create index if not exists applications_email_idx on public.applications (lower(email));
create index if not exists applications_status_idx on public.applications (status, created_at desc);

-- Référence lisible : AV-26-0001
create or replace function public.set_application_reference()
returns trigger language plpgsql as $$
begin
  if new.reference is null then
    new.reference := 'AV-' || to_char(now(), 'YY') || '-' || lpad(nextval('public.application_seq')::text, 4, '0');
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists applications_reference on public.applications;
create trigger applications_reference before insert or update on public.applications
  for each row execute function public.set_application_reference();

create table if not exists public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  doc_type text not null check (doc_type in ('acte_naissance', 'bulletins', 'photo', 'certificat_medical', 'diplome', 'autre')),
  file_path text not null,
  file_name text not null,
  file_size integer,
  created_at timestamptz not null default now()
);

-- ─── Demandes de contact et de réservation ───────────────────────────────
create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  topic text not null check (topic in ('inscription', 'reservation', 'restaurant', 'partenariat', 'autre')),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text,
  email text,
  message text not null check (char_length(message) between 2 and 3000),
  status text not null default 'nouveau' check (status in ('nouveau', 'en_cours', 'traite')),
  handled_by uuid references public.profiles(id),
  check (phone is not null or email is not null)
);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null,
  email text,
  check_in date not null,
  check_out date not null,
  guests integer not null default 1 check (guests between 1 and 10),
  room_type text,
  message text check (char_length(message) <= 2000),
  status text not null default 'nouvelle' check (status in ('nouvelle', 'confirmee', 'refusee', 'annulee')),
  handled_by uuid references public.profiles(id),
  check (check_out > check_in)
);

-- ─── Règles d'accès ──────────────────────────────────────────────────────
alter table public.applications enable row level security;
alter table public.application_documents enable row level security;
alter table public.contact_requests enable row level security;
alter table public.booking_requests enable row level security;

do $$ declare t text; begin
  foreach t in array array['applications', 'application_documents', 'contact_requests', 'booking_requests'] loop
    execute format('drop policy if exists staff_all on public.%I', t);
    execute format('create policy staff_all on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- Dépôt public (champs de traitement interdits)
drop policy if exists public_insert on public.applications;
create policy public_insert on public.applications for insert to anon, authenticated
  with check (status = 'nouvelle' and staff_notes is null and decided_by is null and student_id is null);

-- Le candidat voit ses dossiers (même e-mail que son compte)
drop policy if exists own_select on public.applications;
create policy own_select on public.applications for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists public_insert on public.application_documents;
-- Fonction « definer » : le visiteur ne peut pas lire les dossiers, mais on vérifie que
-- celui auquel il joint une pièce existe et a été créé il y a moins de 30 jours.
create or replace function public.application_accepts_documents(app uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.applications a where a.id = app and a.created_at > now() - interval '30 days')
$$;
grant execute on function public.application_accepts_documents(uuid) to anon, authenticated;

create policy public_insert on public.application_documents for insert to anon, authenticated
  with check (public.application_accepts_documents(application_id));
drop policy if exists own_select on public.application_documents;
create policy own_select on public.application_documents for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and lower(a.email) = lower(auth.jwt() ->> 'email')));

drop policy if exists public_insert on public.contact_requests;
create policy public_insert on public.contact_requests for insert to anon, authenticated
  with check (status = 'nouveau' and handled_by is null);
drop policy if exists public_insert on public.booking_requests;
create policy public_insert on public.booking_requests for insert to anon, authenticated
  with check (status = 'nouvelle' and handled_by is null);

grant insert on public.applications, public.application_documents, public.contact_requests, public.booking_requests to anon;

-- ─── Stockage privé des pièces ───────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dossiers', 'dossiers', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dossiers_depot_public" on storage.objects;
create policy "dossiers_depot_public" on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'dossiers' and (storage.foldername(name))[1] = 'preinscriptions'
    and public.application_accepts_documents(((storage.foldername(name))[2])::uuid)
  );

drop policy if exists "dossiers_lecture" on storage.objects;
create policy "dossiers_lecture" on storage.objects for select to authenticated
  using (bucket_id = 'dossiers' and (
    public.is_staff()
    or exists (
      select 1 from public.applications a
       where a.id::text = (storage.foldername(name))[2] and lower(a.email) = lower(auth.jwt() ->> 'email')
    )
  ));

drop policy if exists "dossiers_gestion" on storage.objects;
create policy "dossiers_gestion" on storage.objects for delete to authenticated
  using (bucket_id = 'dossiers' and public.is_staff());

-- Référence d'un dossier qui vient d'être déposé (moins d'une heure), pour l'afficher au candidat
create or replace function public.application_reference(app uuid)
returns text language sql stable security definer set search_path = public as $$
  select reference from public.applications where id = app and created_at > now() - interval '1 hour'
$$;
grant execute on function public.application_reference(uuid) to anon, authenticated;
