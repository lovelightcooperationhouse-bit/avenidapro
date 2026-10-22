-- ════════════════════════════════════════════════════════════════════════
-- Rôles, espaces personnels et sécurité des données (RLS)
--
-- Avant cette migration, chaque table avait une règle « public_full_access » :
-- n'importe quel visiteur pouvait lire et modifier toutes les données avec la
-- clé publique du site. Désormais :
--   • le personnel (direction, pédagogie, comptabilité, RH, hôtel, personnel) accède aux données de gestion ;
--   • un élève ne voit que son propre dossier ; un parent, celui de ses enfants ;
--   • un professeur voit les élèves des classes qui lui sont attribuées ;
--   • un candidat (inscription libre sur le site) ne voit que sa pré-inscription.
-- Le rôle est fixé côté serveur : un utilisateur ne peut jamais se l'attribuer lui-même.
-- ════════════════════════════════════════════════════════════════════════

-- ─── 1. Rôle et rattachements sur les profils ───────────────────────────
alter table public.profiles add column if not exists role text not null default 'candidat';
alter table public.profiles add column if not exists student_id uuid references public.students(id) on delete set null;
alter table public.profiles add column if not exists employee_id uuid references public.employees(id) on delete set null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in (
  'directeur_general', 'directeur_pedagogique', 'comptable', 'ressources_humaines',
  'responsable_hotel', 'personnel', 'professeur', 'eleve', 'parent', 'candidat'
));

-- Parent ↔ élève (un parent peut suivre plusieurs enfants, un enfant avoir plusieurs parents)
create table if not exists public.parent_students (
  parent_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  relationship text not null default 'parent',
  created_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);

-- Professeur ↔ classe (même libellé que students.class_name, ex. « CFA1 - Cuisine »)
create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_name text not null,
  subject text,
  created_at timestamptz not null default now(),
  unique (teacher_id, class_name, subject)
);

-- ─── 2. Fonctions d'autorisation (security definer : lisent profiles sans boucle RLS) ──
create or replace function public.app_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active is not false
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in (
    'directeur_general', 'directeur_pedagogique', 'comptable',
    'ressources_humaines', 'responsable_hotel', 'personnel'
  ), false)
$$;

create or replace function public.is_director()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = 'directeur_general', false)
$$;

-- Vrai si l'utilisateur courant a le droit de voir le dossier de l'élève `sid`
create or replace function public.can_see_student(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'eleve' and p.student_id = sid)
    or exists (select 1 from public.parent_students ps where ps.parent_id = auth.uid() and ps.student_id = sid)
    or exists (
      select 1 from public.teacher_assignments ta
      join public.students s on s.class_name = ta.class_name
      where ta.teacher_id = auth.uid() and s.id = sid
    )
$$;

create or replace function public.teaches_student(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.teacher_assignments ta
    join public.students s on s.class_name = ta.class_name
    where ta.teacher_id = auth.uid() and s.id = sid
  )
$$;

-- Variantes « texte » : grades, absences, retards, bulletins et paiements stockent
-- student_id en texte (identifiant ou matricule de l'élève).
create or replace function public.can_see_student(sid text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff() or coalesce((
    select bool_or(public.can_see_student(s.id)) from public.students s
    where s.id::text = sid or s.registration_number = sid or s.student_number = sid
  ), false)
$$;

create or replace function public.teaches_student(sid text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select bool_or(public.teaches_student(s.id)) from public.students s
    where s.id::text = sid or s.registration_number = sid or s.student_number = sid
  ), false)
$$;

-- ─── 3. Suppression de TOUTES les règles existantes, puis accès personnel ──
do $$
declare
  pol record;
  tbl text;
begin
  for pol in select tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;

  for tbl in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format(
      'create policy staff_all on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())',
      tbl
    );
  end loop;
end $$;

-- ─── 4. Règles complémentaires : élèves, parents, professeurs ─────────────
create policy own_or_linked_select on public.students
  for select to authenticated using (public.can_see_student(id));

create policy linked_select on public.grades
  for select to authenticated using (public.can_see_student(student_id));
create policy teacher_write on public.grades
  for insert to authenticated with check (public.teaches_student(student_id));
create policy teacher_update on public.grades
  for update to authenticated using (public.teaches_student(student_id)) with check (public.teaches_student(student_id));

create policy linked_select on public.student_absences
  for select to authenticated using (public.can_see_student(student_id));
create policy linked_select on public.student_lates
  for select to authenticated using (public.can_see_student(student_id));
create policy linked_select on public.student_attendance
  for select to authenticated using (public.can_see_student(student_id));
create policy linked_select on public.report_cards
  for select to authenticated using (public.can_see_student(student_id));
create policy linked_select on public.fee_payments
  for select to authenticated using (public.can_see_student(student_id));
create policy linked_select on public.fee_assignments
  for select to authenticated using (public.can_see_student(student_id));

-- Catalogue des formations : lisible par tout utilisateur connecté
create policy authenticated_read on public.programs for select to authenticated using (true);
create policy authenticated_read on public.academic_years for select to authenticated using (true);

-- Profils : chacun voit le sien ; on voit aussi les personnes liées (parent ↔ enfant, prof ↔ élève)
create policy own_select on public.profiles
  for select to authenticated using (id = auth.uid());
create policy linked_select on public.profiles
  for select to authenticated using (
    (student_id is not null and public.can_see_student(student_id))
    or exists (select 1 from public.parent_students ps where ps.parent_id = profiles.id and public.can_see_student(ps.student_id))
    or exists (select 1 from public.teacher_assignments ta where ta.teacher_id = profiles.id)
  );
create policy own_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Seules les colonnes « personnelles » sont modifiables par l'utilisateur ; le rôle et les
-- rattachements ne le sont que par la direction (via staff_all + droits de colonne ci-dessous).
revoke update on public.profiles from authenticated;
grant update (first_name, last_name, phone, avatar_url, updated_at) on public.profiles to authenticated;

-- La direction gère les rôles et rattachements
create or replace function public.guard_profile_admin_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role
      or new.student_id is distinct from old.student_id
      or new.employee_id is distinct from old.employee_id
      or new.is_active is distinct from old.is_active)
     and not public.is_director()
     and auth.uid() is not null then
    raise exception 'Seule la Direction Générale peut modifier le rôle ou les rattachements d''un compte';
  end if;
  return new;
end $$;
drop trigger if exists profiles_guard_admin_columns on public.profiles;
create trigger profiles_guard_admin_columns before update on public.profiles
  for each row execute function public.guard_profile_admin_columns();

-- Attribution d'un rôle / rattachement par la Direction Générale (seul chemin autorisé)
create or replace function public.set_user_role(target uuid, new_role text, new_student uuid default null, new_employee uuid default null, active boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_director() then
    raise exception 'Réservé à la Direction Générale';
  end if;
  update public.profiles
     set role = new_role, student_id = new_student, employee_id = new_employee, is_active = active, updated_at = now()
   where id = target;
end $$;
revoke execute on function public.set_user_role(uuid, text, uuid, uuid, boolean) from public, anon;
grant execute on function public.set_user_role(uuid, text, uuid, uuid, boolean) to authenticated;

create policy own_select on public.parent_students
  for select to authenticated using (parent_id = auth.uid() or public.can_see_student(student_id));
create policy own_select on public.teacher_assignments
  for select to authenticated using (teacher_id = auth.uid());

-- ─── 5. Création automatique du profil à l'inscription ────────────────────
-- Le rôle vient d'une invitation de la direction (user_invitations) ; sinon « candidat ».
-- Les métadonnées envoyées par le navigateur ne sont JAMAIS utilisées pour le rôle.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv record;
  mapped text;
begin
  select * into inv from public.user_invitations
   where lower(email) = lower(new.email) and status = 'pending'
   order by created_at desc limit 1;

  mapped := case coalesce(inv.role_code, '')
    when 'direction' then 'directeur_general'
    when 'directeur_general' then 'directeur_general'
    when 'responsable_pedagogique' then 'directeur_pedagogique'
    when 'directeur_pedagogique' then 'directeur_pedagogique'
    when 'comptable' then 'comptable'
    when 'rh' then 'ressources_humaines'
    when 'ressources_humaines' then 'ressources_humaines'
    when 'hotel' then 'responsable_hotel'
    when 'responsable_hotel' then 'responsable_hotel'
    when 'personnel' then 'personnel'
    when 'professeur' then 'professeur'
    when 'eleve' then 'eleve'
    when 'parent' then 'parent'
    else 'candidat'
  end;

  insert into public.profiles (id, email, first_name, last_name, role, is_active)
  values (
    new.id, new.email,
    coalesce(inv.first_name, new.raw_user_meta_data->>'first_name'),
    coalesce(inv.last_name, new.raw_user_meta_data->>'last_name'),
    mapped, true
  )
  on conflict (id) do nothing;

  if inv.id is not null then
    update public.user_invitations set status = 'accepted' where id = inv.id;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 6. Rôle des comptes déjà créés ──────────────────────────────────────
update public.profiles p set role = case u.raw_user_meta_data->>'role'
    when 'direction' then 'directeur_general'
    when 'responsable_pedagogique' then 'directeur_pedagogique'
    when 'comptable' then 'comptable'
    when 'ressources_humaines' then 'ressources_humaines'
    when 'responsable_hotel' then 'responsable_hotel'
    else p.role
  end
from auth.users u where u.id = p.id;
