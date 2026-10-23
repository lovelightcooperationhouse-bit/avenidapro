-- Fin des essais de paiement : chambre de test, réservations et alertes de test supprimées
-- (sauvegardes locales : sauvegardes/tests-supprimes-2026-10-23.json et essais-alex-ganyo-2026-10-23.json)
drop trigger if exists reservations_test_room on public.reservations;
drop function if exists public.guard_test_room();

create or replace function public.public_rooms(p_in date default null, p_out date default null)
returns table (id uuid, ref text, name text, category text, description text, images jsonb, capacity integer, amenities text[], price bigint, floor integer, available boolean)
language sql stable security definer set search_path = public as $$
  select r.id, r.room_number, coalesce(nullif(r.name, ''), r.room_type, 'Chambre ' || r.room_number), r.room_type, r.description, r.images,
         r.capacity, r.amenities, r.price_per_night, r.floor,
         case when p_in is null or p_out is null or p_out <= p_in then true else public.room_is_free(r.id, p_in, p_out) end
    from public.rooms r
   where r.published and coalesce(r.price_per_night, 0) > 0
     and coalesce(r.status, 'disponible') not in ('maintenance', 'hors_service', 'hors service')
   order by r.sort, r.price_per_night, r.room_number
$$;
grant execute on function public.public_rooms(date, date) to anon, authenticated;

delete from public.notifications n
 where n::text ~* '(\mtest\M|\messai\M|RES26-000[1-5]|RES-2026-097)'
    or n.link in (select '/reservation/' || token from public.reservations where booking_ref in ('RES26-0001', 'RES26-0002', 'RES26-0003', 'RES26-0004', 'RES26-0005'));
delete from public.reservations where booking_ref in ('RES26-0001', 'RES26-0002', 'RES26-0003', 'RES26-0004', 'RES26-0005', 'RES-2026-097');
delete from public.hotel_customers c
 where lower(c.email) = 'direction@ecole-avenida.tg'
   and not exists (select 1 from public.reservations r where r.customer_uuid = c.id);
delete from public.rooms where test_only or room_number = 'TEST';
alter table public.rooms drop column if exists test_only;

-- Numérotation des réservations en ligne reprise après la dernière réservation réelle
update public.matricule_counters
   set last_value = coalesce((select max(substring(booking_ref from '\d+$')::int) from public.reservations where booking_ref like 'RES' || to_char(now(), 'YY') || '-%'), 0)
 where prefix = 'RES' || to_char(now(), 'YY');
