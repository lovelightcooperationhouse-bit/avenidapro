-- ════════════════════════════════════════════════════════════════════════
-- Messagerie interne : élèves, parents, professeurs et administration.
-- Chacun ne peut écrire qu'aux personnes qui le concernent (my_contacts).
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  subject text,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_recipient_idx on public.messages (recipient_id, created_at desc);
create index if not exists messages_sender_idx on public.messages (sender_id, created_at desc);

-- Personnes que l'utilisateur courant peut contacter, avec le contexte de la relation
create or replace function public.my_contacts()
returns table (id uuid, full_name text, role text, context text)
language sql stable security definer set search_path = public as $$
  with me as (select p.id, p.role, p.student_id from public.profiles p where p.id = auth.uid()),
  my_students as (
    -- Élèves suivis : moi (élève), mes enfants (parent), mes classes (professeur)
    select s.id, s.first_name, s.last_name, s.class_name from public.students s, me
     where (me.role = 'eleve' and s.id = me.student_id)
        or (me.role = 'parent' and exists (select 1 from public.parent_students ps where ps.parent_id = me.id and ps.student_id = s.id))
        or (me.role = 'professeur' and exists (select 1 from public.teacher_assignments ta where ta.teacher_id = me.id and ta.class_name = s.class_name))
  ),
  candidates as (
    -- Administration : toujours joignable (direction, pédagogie, comptabilité)
    select p.id, p.role, 'Administration'::text as context from public.profiles p
     where p.role in ('directeur_general', 'directeur_pedagogique', 'comptable') and p.is_active is not false
    union
    -- Professeurs des classes de mes élèves (élève, parent)
    select ta.teacher_id, 'professeur', 'Professeur · ' || ms.class_name || coalesce(' · ' || ta.subject, '')
      from public.teacher_assignments ta join my_students ms on ms.class_name = ta.class_name, me
     where me.role in ('eleve', 'parent')
    union
    -- Élèves de mes classes et leurs parents (professeur)
    select p.id, 'eleve', 'Élève · ' || ms.class_name from public.profiles p join my_students ms on p.student_id = ms.id, me
     where me.role = 'professeur'
    union
    select ps.parent_id, 'parent', 'Parent de ' || ms.first_name || ' ' || ms.last_name
      from public.parent_students ps join my_students ms on ms.id = ps.student_id, me
     where me.role = 'professeur'
    union
    -- Le personnel peut écrire à tout le monde
    select p.id, p.role, 'Annuaire' from public.profiles p, me
     where public.is_staff() and p.is_active is not false
  )
  select distinct on (c.id) c.id, coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), p.email), p.role, c.context
    from candidates c join public.profiles p on p.id = c.id
   where c.id <> auth.uid()
   order by c.id, c.context
$$;
revoke execute on function public.my_contacts() from public, anon;
grant execute on function public.my_contacts() to authenticated;

create or replace function public.can_message(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.my_contacts() c where c.id = target)
      -- On peut toujours répondre à quelqu'un qui nous a écrit
      or exists (select 1 from public.messages m where m.sender_id = target and m.recipient_id = auth.uid())
$$;

alter table public.messages enable row level security;
drop policy if exists staff_all on public.messages;
drop policy if exists own_select on public.messages;
drop policy if exists own_insert on public.messages;
drop policy if exists recipient_update on public.messages;

create policy own_select on public.messages
  for select to authenticated using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy own_insert on public.messages
  for insert to authenticated with check (sender_id = auth.uid() and public.can_message(recipient_id));
create policy recipient_update on public.messages
  for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- Le destinataire ne peut modifier que la date de lecture
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

-- Temps réel : nouveaux messages poussés aux destinataires
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; when undefined_object then null;
end $$;
