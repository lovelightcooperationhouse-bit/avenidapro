-- ════════════════════════════════════════════════════════════════════════════
-- Bulletins sur le modèle officiel : matières et coefficients par filière,
-- notes de classe et de composition, semestres, signature du Directeur pédagogique,
-- corrections après publication (bulletin rectifié) et confidentialité avant publication.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.bulletin_subjects (
  id uuid primary key default gen_random_uuid(),
  -- Filière (code du programme) ; vide = maquette commune à toutes les filières
  program_code text,
  name text not null,
  grp text not null default 'generale' check (grp in ('generale', 'technologique', 'pratique')),
  coefficient numeric not null default 1 check (coefficient > 0),
  position int not null default 100,
  teacher_name text,
  created_at timestamptz not null default now()
);
create unique index if not exists bulletin_subjects_key on public.bulletin_subjects (coalesce(program_code, ''), lower(name));

alter table public.bulletin_subjects enable row level security;
drop policy if exists staff_read on public.bulletin_subjects;
create policy staff_read on public.bulletin_subjects for select using (public.is_staff());
drop policy if exists managers_write on public.bulletin_subjects;
create policy managers_write on public.bulletin_subjects for all using (public.is_manager()) with check (public.is_manager());

-- Maquette du modèle « Bulletin de notes » (Hôtel École Avenida)
insert into public.bulletin_subjects (program_code, name, grp, coefficient, position)
select null, v.name, v.grp, v.coef, v.pos from (values
  ('Expression Française', 'generale', 2, 1),
  ('Anglais', 'generale', 2, 2),
  ('Mathématiques financières', 'generale', 1, 3),
  ('Vente Marketing', 'generale', 1, 4),
  ('Droit', 'generale', 1, 5),
  ('Législation Hôtelière', 'generale', 1, 6),
  ('Hygiène Alimentaire', 'generale', 2, 7),
  ('Comptabilité', 'generale', 1, 8),
  ('Économie et Gestion', 'generale', 1, 9),
  ('Gestion du personnel', 'generale', 1, 10),
  ('Technologie Culinaire', 'technologique', 2, 11),
  ('Tech Restaurant / Bar', 'technologique', 2, 12),
  ('Cuisine / Pâtisserie', 'pratique', 2, 13),
  ('Restaurant / Bar', 'pratique', 2, 14)
) as v(name, grp, coef, pos)
where not exists (select 1 from public.bulletin_subjects where program_code is null);

-- Une seule note par élève, matière, type (classe / composition), semestre et année
create unique index if not exists grades_unique_mark on public.grades (student_id, academic_year, term, subject, evaluation_type);

alter table public.report_cards add column if not exists signed_by_name text;
alter table public.report_cards add column if not exists signed_at timestamptz;
alter table public.report_cards add column if not exists revision int not null default 0;

-- Les familles ne voient un bulletin qu'une fois publié (validé par le Directeur pédagogique)
drop policy if exists linked_select on public.report_cards;
create policy linked_select on public.report_cards for select using (published and public.can_see_student(student_id));

-- Publication → famille prévenue ; correction d'un bulletin déjà publié → « bulletin rectifié »
create or replace function public.on_report_card_published()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.try_uuid(new.student_id) is null then return new; end if;
  if new.published and (tg_op = 'INSERT' or not old.published) then
    perform public.notify_student_family(public.try_uuid(new.student_id), 'bulletin',
      'Bulletin disponible : ' || coalesce(new.period, 'semestre ' || new.term),
      'Moyenne : ' || coalesce(to_char(new.general_average, 'FM90.00'), '—') || '/20' || coalesce(' · rang ' || new.rank_display, '')
        || coalesce(' sur ' || new.total_students, '') || '. Bulletin signé par le Directeur pédagogique, à consulter et télécharger dans votre espace.',
      '/espace/bulletins');
  elsif tg_op = 'UPDATE' and new.published and old.published and new.revision > old.revision then
    perform public.notify_student_family(public.try_uuid(new.student_id), 'bulletin',
      'Bulletin rectifié : ' || coalesce(new.period, 'semestre ' || new.term),
      'Après vérification, le bulletin a été corrigé. Nouvelle moyenne : ' || coalesce(to_char(new.general_average, 'FM90.00'), '—') || '/20'
        || coalesce(' · rang ' || new.rank_display, '') || '.',
      '/espace/bulletins');
  end if;
  return new;
end $$;
drop trigger if exists report_card_published on public.report_cards;
create trigger report_card_published after insert or update of published, revision on public.report_cards for each row execute function public.on_report_card_published();
