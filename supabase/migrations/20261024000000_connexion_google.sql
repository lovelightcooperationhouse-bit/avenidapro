-- Connexion Google : le profil reprend le prénom et le nom fournis par Google
-- (given_name / family_name / full_name) lorsque l'inscription ne passe pas par le formulaire.
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
