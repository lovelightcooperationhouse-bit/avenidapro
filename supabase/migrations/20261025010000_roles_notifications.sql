-- Changement de rôle par le DG : le membre est prévenu dans son espace
create or replace function public.set_user_role(target uuid, new_role text, new_student uuid default null, new_employee uuid default null, active boolean default true)
returns void language plpgsql security definer set search_path = public as $$
declare old public.profiles;
begin
  if not public.is_director() then
    raise exception 'Réservé à la Direction Générale';
  end if;
  select * into old from public.profiles where id = target;
  update public.profiles
     set role = new_role, student_id = new_student, employee_id = new_employee, is_active = active, updated_at = now()
   where id = target;
  if old.role is distinct from new_role or old.is_active is distinct from active then
    insert into public.notifications (profile_id, kind, title, body, link, sms_status)
    values (target, 'info',
            case when active then 'Rôle attribué par la direction' else 'Compte suspendu' end,
            case when active then 'Votre espace a été mis à jour selon votre nouveau rôle.' else 'Contactez la direction pour plus d''informations.' end,
            '/espace', 'skipped');
  end if;
end $$;

-- Invitations : le rôle « client » est reconnu à la création du compte
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  inv record;
  mapped text;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := coalesce(meta->>'full_name', meta->>'name');
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
    when 'client' then 'client'
    else 'candidat'
  end;

  insert into public.profiles (id, email, first_name, last_name, role, is_active)
  values (
    new.id, new.email,
    coalesce(inv.first_name, meta->>'first_name', meta->>'given_name', split_part(full_name, ' ', 1)),
    coalesce(inv.last_name, meta->>'last_name', meta->>'family_name', nullif(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), '')),
    mapped, true
  )
  on conflict (id) do nothing;

  if inv.id is not null then
    update public.user_invitations set status = 'accepted' where id = inv.id;
  end if;
  return new;
end $$;

-- Clients de l'hôtel : ils voient leurs propres demandes de réservation (même adresse e-mail)
drop policy if exists own_select on public.booking_requests;
create policy own_select on public.booking_requests for select to authenticated using (lower(email) = lower(auth.jwt()->>'email'));
