-- Photo des clients de l'hôtel (carte de fidélité) : reprise de la photo du compte et tenue à jour.
alter table public.hotel_customers add column if not exists photo_url text;

create or replace function public.sync_customer_photo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.customer_id is not null and new.avatar_url is not null
     and (tg_op = 'INSERT' or new.avatar_url is distinct from old.avatar_url or new.customer_id is distinct from old.customer_id) then
    update public.hotel_customers set photo_url = new.avatar_url where id = new.customer_id;
  end if;
  return new;
end $$;

drop trigger if exists customer_photo on public.profiles;
create trigger customer_photo after insert or update of avatar_url, customer_id on public.profiles
for each row execute function public.sync_customer_photo();

-- Clients existants : photo du compte, sinon celle du dossier d'adhésion
update public.hotel_customers c
   set photo_url = coalesce(
     (select p.avatar_url from public.profiles p where p.customer_id = c.id and p.avatar_url is not null limit 1),
     (select m.photo from public.member_applications m join public.profiles p on p.id = m.profile_id where p.customer_id = c.id and m.photo is not null order by m.updated_at desc nulls last limit 1))
 where c.photo_url is null;
