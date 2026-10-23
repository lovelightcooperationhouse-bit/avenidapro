-- Le Directeur général rattache un compte à un membre de l'annuaire : nom, téléphone et fiche RH repris,
-- rôle attribué et validé en une seule action.
create or replace function public.link_staff_account(target uuid, entry uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare
  d public.staff_directory;
  parts text[];
  last text;
  first text;
begin
  if public.app_role() <> 'directeur_general' then
    raise exception 'Seul le Directeur général attribue les rôles' using errcode = '42501';
  end if;
  select * into d from public.staff_directory where id = entry;
  if not found then raise exception 'Membre introuvable dans l''annuaire'; end if;
  if p_role is null or p_role in ('candidat', 'eleve', 'parent', 'client') then
    raise exception 'Choisissez un rôle de gestion ou de personnel';
  end if;
  -- Nom en capitales = nom de famille ; le reste = prénoms (comme pour les fiches RH)
  parts := regexp_split_to_array(trim(d.full_name), '\s+');
  select string_agg(p, ' ') into last from unnest(parts) p where p = upper(p) and p ~ '[A-ZÀ-Ý]{2}';
  select string_agg(p, ' ') into first from unnest(parts) p where not (p = upper(p) and p ~ '[A-ZÀ-Ý]{2}');

  -- Un membre ne peut être rattaché qu'à un seul compte
  update public.staff_directory set profile_id = null where profile_id = target and id <> entry;
  update public.profiles
     set first_name = coalesce(first, first_name),
         last_name = coalesce(last, d.full_name),
         phone = coalesce(phone, nullif(trim(split_part(coalesce(d.phones, ''), '/', 1)), '')),
         employee_id = coalesce(d.employee_id, employee_id),
         role = p_role,
         is_active = true,
         updated_at = now()
   where id = target;
  if not found then raise exception 'Compte introuvable'; end if;
  update public.staff_directory
     set profile_id = target, proposed_role = p_role, role_status = 'valide',
         validated_by = auth.uid(), validated_at = now(), updated_at = now()
   where id = entry;
  insert into public.notifications (profile_id, kind, title, body, link)
  values (target, 'validation', 'Accès validé par le Directeur général',
          'Votre rôle est attribué : vous pouvez travailler dans votre espace de gestion.', '/dashboard');
end $$;
revoke execute on function public.link_staff_account(uuid, uuid, text) from public, anon;
grant execute on function public.link_staff_account(uuid, uuid, text) to authenticated;
