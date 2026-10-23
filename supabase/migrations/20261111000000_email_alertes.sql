-- E-mail de réception des alertes, distinct de l'identifiant de connexion
-- (ex. comptes de service @ecole-avenida.tg sans boîte réelle).
alter table public.profiles add column if not exists notify_email text;

create or replace function public.set_notify_email(target uuid, mail text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if target <> auth.uid() and not public.is_director() then
    raise exception 'Seul le Directeur général modifie l''e-mail des alertes d''un autre compte' using errcode = '42501';
  end if;
  mail := nullif(lower(trim(coalesce(mail, ''))), '');
  if mail is not null and mail !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Adresse e-mail invalide';
  end if;
  update public.profiles set notify_email = mail, updated_at = now() where id = target;
end $$;
revoke execute on function public.set_notify_email(uuid, text) from public, anon;
grant execute on function public.set_notify_email(uuid, text) to authenticated;

-- Adresse provisoire des tests pour les comptes de l'administration
update public.profiles set notify_email = 'lovelightcooperationhouse@gmail.com'
 where role in ('directeur_general', 'directeur_pedagogique', 'comptable', 'ressources_humaines', 'responsable_hotel')
   and email ilike '%@ecole-avenida.tg';
