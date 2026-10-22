-- ════════════════════════════════════════════════════════════════════════════
-- Annuaire de l'établissement (administration et professeurs), rôles proposés
-- en attente de validation du Directeur général, règlement intérieur signé en ligne.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.staff_directory (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  -- Fonction administrative (Directeur pédagogique, Économe…) ; vide pour un professeur uniquement
  function_title text,
  -- Matières enseignées ; vide pour l'administration uniquement
  subjects text,
  phones text,
  position int not null default 100,
  show_public boolean not null default true,
  proposed_role text,
  role_status text not null default 'propose' check (role_status in ('propose', 'valide', 'refuse')),
  role_note text,
  validated_by uuid references public.profiles(id) on delete set null,
  validated_at timestamptz,
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_directory enable row level security;

-- Coordonnées visibles des membres connectés de l'établissement (élèves, parents, personnel)
drop policy if exists members_read on public.staff_directory;
create policy members_read on public.staff_directory for select
  using (coalesce(public.app_role() not in ('client', 'candidat'), false));
drop policy if exists managers_write on public.staff_directory;
create policy managers_write on public.staff_directory for all using (public.is_manager()) with check (public.is_manager());

-- Équipe affichée sur le site public : noms, fonctions et matières, sans téléphone
create or replace function public.public_staff_directory()
returns table (full_name text, function_title text, subjects text, "position" int)
language sql stable security definer set search_path = public as $$
  select full_name, function_title, subjects, position from public.staff_directory where show_public order by position, full_name
$$;
grant execute on function public.public_staff_directory() to anon, authenticated;

-- Décision du Directeur général sur le rôle proposé (le rôle est appliqué si un compte est rattaché)
create or replace function public.decide_staff_role(entry uuid, ok boolean, p_role text default null, note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare d public.staff_directory;
begin
  if public.app_role() <> 'directeur_general' then
    raise exception 'Seul le Directeur général valide les rôles' using errcode = '42501';
  end if;
  select * into d from public.staff_directory where id = entry;
  if d.id is null then raise exception 'Fiche introuvable'; end if;
  update public.staff_directory
     set role_status = case when ok then 'valide' else 'refuse' end,
         proposed_role = coalesce(nullif(p_role, ''), proposed_role),
         role_note = coalesce(nullif(trim(note), ''), role_note),
         validated_by = auth.uid(), validated_at = now(), updated_at = now()
   where id = entry
   returning * into d;
  if ok and d.profile_id is not null and d.proposed_role is not null then
    perform set_config('avenida.decision', 'on', true);
    update public.profiles set role = d.proposed_role, is_active = true, updated_at = now() where id = d.profile_id;
    insert into public.notifications (profile_id, kind, title, body, link)
    values (d.profile_id, 'info', 'Votre rôle est validé', 'La Direction générale vous a attribué votre accès à la gestion.', '/dashboard');
  end if;
end $$;
revoke execute on function public.decide_staff_role(uuid, boolean, text, text) from public, anon;
grant execute on function public.decide_staff_role(uuid, boolean, text, text) to authenticated;

-- ── Règlement intérieur : lecture et signature en ligne ─────────────────────
create table if not exists public.reglement_acceptances (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  signer_role text not null check (signer_role in ('eleve', 'parent')),
  signer_name text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  unique (student_id, profile_id, version)
);
alter table public.reglement_acceptances enable row level security;
drop policy if exists own_read on public.reglement_acceptances;
create policy own_read on public.reglement_acceptances for select
  using (profile_id = auth.uid() or public.is_manager()
         or exists (select 1 from public.parent_students ps where ps.parent_id = auth.uid() and ps.student_id = reglement_acceptances.student_id)
         or exists (select 1 from public.profiles p where p.id = auth.uid() and p.student_id = reglement_acceptances.student_id));
drop policy if exists own_insert on public.reglement_acceptances;
create policy own_insert on public.reglement_acceptances for insert
  with check (profile_id = auth.uid()
    and ((signer_role = 'eleve' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.student_id = reglement_acceptances.student_id))
      or (signer_role = 'parent' and exists (select 1 from public.parent_students ps where ps.parent_id = auth.uid() and ps.student_id = reglement_acceptances.student_id))));

-- Envoi automatique du règlement (espace + e-mail) à chaque élève inscrit et à ses parents
create or replace function public.send_reglement(p uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (profile_id, kind, title, body, link)
  select p, 'reglement', 'Règlement intérieur à lire et signer',
         'Bienvenue à l''Hôtel École Avenida. Le règlement intérieur des apprenants est disponible dans votre espace : lisez-le, téléchargez-le et signez votre engagement en ligne.',
         '/espace/reglement'
  where p is not null
    and not exists (select 1 from public.notifications n where n.profile_id = p and n.kind = 'reglement')
$$;
revoke execute on function public.send_reglement(uuid) from public, anon, authenticated;

create or replace function public.on_reglement_link()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'parent_students' then
    perform public.send_reglement(new.parent_id);
  elsif tg_table_name = 'profiles' then
    if new.student_id is not null and new.student_id is distinct from old.student_id then
      perform public.send_reglement(new.id);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists reglement_parent on public.parent_students;
create trigger reglement_parent after insert on public.parent_students for each row execute function public.on_reglement_link();
drop trigger if exists reglement_profile on public.profiles;
create trigger reglement_profile after update of student_id on public.profiles for each row execute function public.on_reglement_link();

-- Élèves déjà inscrits et leurs parents : règlement envoyé une fois
select public.send_reglement(p.id) from public.profiles p where p.role = 'eleve' and p.student_id is not null;
select public.send_reglement(ps.parent_id) from public.parent_students ps;

-- ── Données : administration et corps professoral (documents de l'établissement) ──
insert into public.staff_directory (full_name, function_title, subjects, phones, position, proposed_role, role_note)
select * from (values
  ('Hope D''ALMEIDA', 'Administrateur', null, '+228 96 84 00 00', 1, 'directeur_general', 'Administrateur : contrôle total de la gestion.'),
  ('Koffi D''ALMEIDA', 'Administrateur', null, '+228 90 11 06 99', 2, 'directeur_general', 'Administrateur : contrôle total de la gestion.'),
  ('Marc GLE', 'Directeur d''exploitation', null, '+228 93 84 62 66 / +228 90 12 38 38', 3, 'responsable_hotel', 'Exploitation : hôtel, réservations, clients, économat.'),
  ('Noël AKLIKPO', 'Directeur commercial', null, '+228 90 19 66 99', 4, 'responsable_hotel', 'Commercial : clients, réservations. Possible aussi : gestionnaire du site (communication).'),
  ('Kodjo Messan DOGLO', 'Directeur pédagogique', 'Hygiène alimentaire', '+228 92 88 17 48', 5, 'directeur_pedagogique', 'Pédagogie : inscriptions, notes, bulletins, correspondance.'),
  ('Koffi Vianney D''ALMEIDA', 'Surveillant général', 'Technologie restaurant / bar', '+228 97 53 88 43 / +228 93 21 65 30', 6, 'directeur_pedagogique', 'Vie scolaire : correspondance, absences, retards, permissions (accès pédagogique).'),
  ('Koffi B. Sylva MAWUENA', 'Économe', 'Pratique restaurant / bar', '+228 91 20 91 20 / +228 99 55 00 55', 7, 'comptable', 'Économat : écolages, encaissements, stocks.'),
  ('Prisca ANIPAH', 'Secrétaire', 'Français', '+228 79 73 21 01', 8, 'personnel', 'Secrétariat : accueil, demandes, messages.'),
  ('Donaldine ATTIGNON', 'Secrétaire', null, '+228 99 24 91 29', 9, 'personnel', 'Secrétariat : accueil, demandes, messages.'),
  ('Fataï SANOUSSI', 'Chef cuisinier', 'Pratique culinaire', '+228 97 42 61 28', 10, 'professeur', 'Professeur de pratique culinaire, chef de la cuisine.'),
  ('Godwin KOMLAN', null, 'Pratique pâtisserie', '+228 92 92 15 45', 20, 'professeur', null),
  ('Yannick ATOKLO MOHOU', null, 'Pratique pâtisserie', '+228 93 79 11 93', 21, 'professeur', null),
  ('Edouard DJOLEVO', null, 'Pratique cuisine', '+228 90 55 50 38', 22, 'professeur', null),
  ('Kokou AMETEPE', null, 'Technologie cuisine / pâtisserie', '+228 92 65 64 55', 23, 'professeur', null),
  ('Sourou ANATE', null, 'Économie du tourisme', '+228 90 02 45 48', 24, 'professeur', null),
  ('Patateng AYIM', null, 'Hygiène et sécurité alimentaire', '+228 90 15 41 59', 25, 'professeur', null),
  ('Lamtame BASSABI', null, 'Technologie réception', '+228 90 18 32 39', 26, 'professeur', null),
  ('Komlan BATAWULA', null, 'Technologie des étages', '+228 90 01 38 74', 27, 'professeur', null),
  ('Foley DAHLEN', null, 'Mercatique et méthodologie de recherche', '+228 90 55 50 38', 28, 'professeur', 'Même numéro que DJOLEVO Edouard : à vérifier.'),
  ('Paul EGBARE', null, 'Allemand', '+228 22 20 73 26', 29, 'professeur', null),
  ('Messan GOLI', null, 'Français', '+228 91 43 01 99', 30, 'professeur', null),
  ('Prosper KLUTSE', null, 'Technologie culinaire', '+228 90 26 04 39', 31, 'professeur', null),
  ('Ayao KODJOVI', null, 'Législation hôtelière et sécurité incendie', '+228 90 01 35 45', 32, 'professeur', null),
  ('KOUFOMA', null, 'Anglais', '+228 90 33 47 98', 33, 'professeur', 'Prénom et numéro à confirmer (numéro partagé par 5 professeurs).'),
  ('Akata SARDJI', null, 'Gestion financière et fiscalité', '+228 90 33 47 98', 34, 'professeur', 'Numéro partagé par 5 professeurs : à vérifier.'),
  ('Wilfried SEVLENOU', null, 'Main courante', '+228 90 33 47 98', 35, 'professeur', 'Numéro partagé par 5 professeurs : à vérifier.'),
  ('Prosper WUSSINU', null, 'Gestion des ressources humaines', '+228 90 33 47 98', 36, 'professeur', 'Numéro partagé par 5 professeurs : à vérifier.'),
  ('WILSON', null, 'Éthique professionnelle et droit du travail', '+228 90 33 47 98', 37, 'professeur', 'Prénom et numéro à confirmer.'),
  ('SITTI', null, 'Marketing', '+228 90 30 65 89', 38, 'professeur', 'Prénom à confirmer.'),
  ('KOU DADJE', null, 'Géographie du tourisme', '+228 90 23 72 73', 39, 'professeur', 'Prénom à confirmer.')
) as v(full_name, function_title, subjects, phones, position, proposed_role, role_note)
where not exists (select 1 from public.staff_directory);

-- Comptes déjà existants : le Directeur général actuel est rattaché à sa fiche (rôle déjà en place)
update public.staff_directory d set profile_id = p.id, role_status = 'valide', validated_at = now()
  from public.profiles p
 where d.full_name = 'Hope D''ALMEIDA' and p.role = 'directeur_general' and p.first_name ilike 'hope%' and d.profile_id is null;
