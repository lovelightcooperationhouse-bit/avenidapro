-- Chambre de test (paiement réel de petit montant) : visible et réservable uniquement par le Directeur général connecté.
alter table public.rooms add column if not exists test_only boolean not null default false;

create or replace function public.public_rooms(p_in date default null, p_out date default null)
returns table (id uuid, ref text, name text, category text, description text, images jsonb, capacity integer, amenities text[], price bigint, floor integer, available boolean)
language sql stable security definer set search_path = public as $$
  select r.id, r.room_number, coalesce(nullif(r.name, ''), r.room_type, 'Chambre ' || r.room_number), r.room_type, r.description, r.images,
         r.capacity, r.amenities, r.price_per_night, r.floor,
         case when p_in is null or p_out is null or p_out <= p_in then true else public.room_is_free(r.id, p_in, p_out) end
    from public.rooms r
   where r.published and coalesce(r.price_per_night, 0) > 0
     and coalesce(r.status, 'disponible') not in ('maintenance', 'hors_service', 'hors service')
     and (not r.test_only or public.app_role() = 'directeur_general')
   order by r.test_only desc, r.sort, r.price_per_night, r.room_number
$$;
grant execute on function public.public_rooms(date, date) to anon, authenticated;

-- La réservation d'une chambre de test est refusée à toute autre personne que le DG
create or replace function public.guard_test_room()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.room_uuid is not null and exists (select 1 from public.rooms where id = new.room_uuid and test_only)
     and coalesce(public.app_role(), '') <> 'directeur_general' then
    raise exception 'Chambre introuvable.';
  end if;
  return new;
end $$;
drop trigger if exists reservations_test_room on public.reservations;
create trigger reservations_test_room before insert on public.reservations for each row execute function public.guard_test_room();

-- La chambre de test elle-même (1 000 F la nuit), réservable à toute date
insert into public.rooms (room_number, name, room_type, description, price_per_night, capacity, floor, images, amenities, published, test_only, status, sort)
values ('TEST', 'Chambre de test (paiement)', 'Test', 'Visible uniquement par le Directeur général connecté : sert à tester un vrai paiement de 1 000 F.', 1000, 6, 0,
        '[{"url":"/site/reel/chambre-rouge.webp"}]'::jsonb, '{}', true, true, 'disponible', 0)
on conflict (room_number) do update set price_per_night = 1000, published = true, test_only = true;
