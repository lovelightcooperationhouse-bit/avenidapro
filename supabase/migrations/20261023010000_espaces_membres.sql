-- Membres des salles : gestion réservée à la direction, et annuaire des participants d'une salle.

-- Seuls DG, direction pédagogique (salles école) et responsable hôtel (salles hôtel) gèrent les membres
drop policy if exists staff_all on public.space_members;
drop policy if exists managers_write on public.space_members;
create policy managers_write on public.space_members for all to authenticated
  using (public.app_role() = 'directeur_general'
         or (public.app_role() = 'directeur_pedagogique' and exists (select 1 from public.spaces s where s.id = space_id and s.kind = 'ecole'))
         or (public.app_role() = 'responsable_hotel' and exists (select 1 from public.spaces s where s.id = space_id and s.kind = 'hotel')))
  with check (public.app_role() = 'directeur_general'
         or (public.app_role() = 'directeur_pedagogique' and exists (select 1 from public.spaces s where s.id = space_id and s.kind = 'ecole'))
         or (public.app_role() = 'responsable_hotel' and exists (select 1 from public.spaces s where s.id = space_id and s.kind = 'hotel')));

-- Participants d'une salle (noms et rôles), visible uniquement par ses membres
create or replace function public.space_people(sid uuid)
returns table (id uuid, full_name text, role text, space_role text)
language sql stable security definer set search_path = public as $$
  select p.id,
         coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), p.email),
         p.role,
         coalesce(sm.role,
           case when p.role = 'directeur_general' then 'responsable'
                when sp.kind = 'ecole' and p.role in ('directeur_pedagogique', 'professeur') then 'responsable'
                when sp.kind = 'hotel' and p.role = 'responsable_hotel' then 'responsable'
                else 'membre' end)
    from public.spaces sp
    join public.profiles p on p.is_active is not false
    left join public.space_members sm on sm.space_id = sp.id and sm.profile_id = p.id
   where sp.id = sid
     and public.space_role(sid) is not null
     and (
       sm.profile_id is not null
       or (sp.kind = 'ecole' and p.role = 'eleve' and exists (select 1 from public.students s where s.id = p.student_id and public.class_in_space(s.class_name, sp)))
       or (sp.kind = 'ecole' and p.role = 'professeur' and exists (select 1 from public.teacher_assignments ta where ta.teacher_id = p.id and public.class_in_space(ta.class_name, sp)))
       or (sp.kind = 'hotel' and p.role = 'responsable_hotel')
     )
   order by 4, 2
$$;
grant execute on function public.space_people(uuid) to authenticated;

-- Compte « personnel » de démonstration : membre de la réception
insert into public.space_members (space_id, profile_id, role)
select s.id, p.id, 'membre' from public.spaces s, public.profiles p
 where s.kind = 'hotel' and s.service = 'reception' and p.email = 'personnel.demo@ecole-avenida.tg'
on conflict do nothing;
