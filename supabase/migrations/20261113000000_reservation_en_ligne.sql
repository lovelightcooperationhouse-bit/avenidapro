-- Réservation en ligne de l'hôtel (à la manière des grands sites) :
-- chambres publiées avec photos, référence et prix ; disponibilité en temps réel ; montant calculé ;
-- paiement à l'arrivée ou en ligne (carte, Mixx by Yas, Moov Money) ; reçu ; parrainage et points fidélité.

-- ─── Chambres publiées sur le site ───
alter table public.rooms add column if not exists name text;
alter table public.rooms add column if not exists description text;
alter table public.rooms add column if not exists images jsonb not null default '[]'::jsonb;
alter table public.rooms add column if not exists capacity integer not null default 2;
alter table public.rooms add column if not exists amenities text[] not null default '{}';
alter table public.rooms add column if not exists published boolean not null default true;
alter table public.rooms add column if not exists sort integer not null default 100;

-- ─── Réservations du site ───
alter table public.reservations add column if not exists token text unique default encode(extensions.gen_random_bytes(16), 'hex');
alter table public.reservations add column if not exists room_uuid uuid references public.rooms(id) on delete set null;
alter table public.reservations add column if not exists customer_uuid uuid references public.hotel_customers(id) on delete set null;
alter table public.reservations add column if not exists profile_id uuid references public.profiles(id) on delete set null;
alter table public.reservations add column if not exists source text not null default 'comptoir';
alter table public.reservations add column if not exists payment_choice text;
alter table public.reservations add column if not exists hold_until timestamptz;
alter table public.reservations add column if not exists discount bigint not null default 0;
alter table public.reservations add column if not exists points_used integer not null default 0;
alter table public.reservations add column if not exists paid_at timestamptz;
alter table public.reservations add column if not exists payment_provider text;
alter table public.reservations add column if not exists payment_ref text;
alter table public.reservations add column if not exists guests integer;
update public.reservations set token = encode(extensions.gen_random_bytes(16), 'hex') where token is null;

-- Tentatives et confirmations de paiement en ligne (jamais validées sans vérification auprès du prestataire)
create table if not exists public.reservation_payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  provider text not null,              -- stripe | paygate | caisse
  method text not null,                -- carte | yas | moov | especes | mobile_money | virement
  amount bigint not null check (amount > 0),
  status text not null default 'en_cours' check (status in ('en_cours', 'reussi', 'echoue')),
  identifier text unique,
  provider_ref text,
  recorded_by uuid references public.profiles(id),
  raw jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.reservation_payments enable row level security;
drop policy if exists staff_read on public.reservation_payments;
create policy staff_read on public.reservation_payments for select to authenticated using (public.is_staff());

-- ─── Clients : parrainage ───
alter table public.hotel_customers add column if not exists referral_code text unique;
alter table public.hotel_customers add column if not exists referred_by uuid references public.hotel_customers(id) on delete set null;
alter table public.hotel_customers add column if not exists referral_rewarded boolean not null default false;

-- ─── Règles de fidélité (modifiables par le DG et l'hôtel) ───
create or replace function public.loyalty_conf()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'pointsPer1000', 1,      -- points gagnés par tranche de 1 000 F payés
    'pointValue', 10,        -- valeur d'un point en F CFA
    'referralPoints', 300,   -- points au parrain pour chaque filleul qui paie son séjour
    'bonusEvery', 3,         -- bonus tous les N filleuls payants
    'bonusPoints', 1000,
    'holdMinutes', 30        -- chambre bloquée pendant le paiement en ligne
  ) || coalesce((select value from public.site_settings where key = 'loyalty'), '{}'::jsonb)
$$;
grant execute on function public.loyalty_conf() to anon, authenticated;

create or replace function public.set_loyalty_settings(conf jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.app_role() not in ('directeur_general', 'responsable_hotel') then
    raise exception 'Réservé au Directeur général et au responsable de l''hôtel' using errcode = '42501';
  end if;
  insert into public.site_settings (key, value) values ('loyalty', conf)
  on conflict (key) do update set value = excluded.value;
end $$;
revoke execute on function public.set_loyalty_settings(jsonb) from public, anon;
grant execute on function public.set_loyalty_settings(jsonb) to authenticated;

-- ─── Disponibilité ───
create or replace function public.room_is_free(rid uuid, d_in date, d_out date, except_res uuid default null)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.reservations v
     join public.rooms r on r.id = rid
     where (v.room_uuid = rid or (v.room_uuid is null and v.room_number = r.room_number))
       and (except_res is null or v.id <> except_res)
       and coalesce(v.status, '') not in ('annulée', 'annulee', 'terminée', 'terminee')
       and not (v.status = 'paiement_en_cours' and v.hold_until is not null and v.hold_until < now())
       and coalesce(nullif(v.check_in, '')::date, v.check_in_date::date) < d_out
       and coalesce(nullif(v.check_out, '')::date, v.check_out_date::date) > d_in)
$$;

-- Chambres affichées sur le site, avec disponibilité pour les dates demandées
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

-- ─── Création d'une réservation depuis le site ───
create or replace function public.create_booking(p jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  conf jsonb := public.loyalty_conf();
  r public.rooms;
  d_in date;
  d_out date;
  v_nights integer;
  v_guests integer;
  v_total bigint;
  disc bigint := 0;
  pts integer := 0;
  v_mail text := lower(trim(coalesce(p->>'email', '')));
  v_phone text := trim(coalesce(p->>'phone', ''));
  fullname text := trim(regexp_replace(coalesce(p->>'full_name', ''), '\s+', ' ', 'g'));
  uid uuid := auth.uid();
  prof public.profiles;
  cust public.hotel_customers;
  sponsor uuid;
  pay text := coalesce(p->>'payment', 'arrivee');
  online boolean;
  pref text := 'RES' || to_char(now(), 'YY');
  n integer;
  v_ref text;
  rid uuid;
  tok text;
begin
  if length(fullname) < 2 then raise exception 'Indiquez votre nom complet.'; end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) < 8 then raise exception 'Indiquez un numéro de téléphone valide.'; end if;
  if v_mail !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'Indiquez une adresse e-mail valide : le reçu vous y est envoyé.'; end if;
  begin
    d_in := (p->>'check_in')::date;
    d_out := (p->>'check_out')::date;
  exception when others then raise exception 'Dates invalides.';
  end;
  if d_in is null or d_out is null or d_in < current_date then raise exception 'La date d''arrivée doit être aujourd''hui ou plus tard.'; end if;
  if d_out <= d_in then raise exception 'La date de départ doit être après la date d''arrivée.'; end if;
  v_nights := d_out - d_in;
  if v_nights > 90 then raise exception 'Pour un séjour de plus de 90 nuits, contactez la réception.'; end if;

  -- Verrou sur la chambre : deux personnes ne peuvent pas la prendre en même temps
  select * into r from public.rooms where rooms.id = (p->>'room_id')::uuid and published for update;
  if not found then raise exception 'Chambre introuvable.'; end if;
  v_guests := greatest(1, coalesce((p->>'guests')::int, 1));
  if v_guests > coalesce(r.capacity, 2) then raise exception 'Cette chambre accueille au plus % personne(s). Choisissez une chambre plus grande.', r.capacity; end if;
  if not public.room_is_free(r.id, d_in, d_out) then
    raise exception 'Cette chambre vient d''être réservée pour ces dates. Choisissez une autre chambre.';
  end if;
  v_total := v_nights * coalesce(r.price_per_night, 0);
  if v_total <= 0 then raise exception 'Le prix de cette chambre n''est pas encore fixé : contactez la réception.'; end if;

  -- Fichier client : compte connecté, sinon même e-mail, sinon même téléphone, sinon nouveau client
  if uid is not null then select * into prof from public.profiles where profiles.id = uid; end if;
  if prof.customer_id is not null then select * into cust from public.hotel_customers where hotel_customers.id = prof.customer_id; end if;
  if cust.id is null then select * into cust from public.hotel_customers c where lower(c.email) = v_mail order by c.created_at limit 1; end if;
  if cust.id is null then select * into cust from public.hotel_customers c where regexp_replace(c.phone, '\D', '', 'g') = regexp_replace(v_phone, '\D', '', 'g') order by c.created_at limit 1; end if;
  if cust.id is null then
    insert into public.hotel_customers (first_name, last_name, full_name, email, phone, nationality)
    values (coalesce(nullif(regexp_replace(fullname, '\s+\S+$', ''), fullname), fullname), upper(regexp_replace(fullname, '^.*\s', '')), fullname,
            v_mail, v_phone, nullif(trim(coalesce(p->>'nationality', '')), ''))
    returning * into cust;
  end if;
  if prof.id is not null and prof.customer_id is null then
    perform set_config('avenida.enroll', 'on', true);
    update public.profiles set customer_id = cust.id where profiles.id = prof.id;
  end if;

  -- Parrainage : seulement pour un client qui n'a encore jamais payé de séjour
  if nullif(trim(coalesce(p->>'referral', '')), '') is not null and cust.referred_by is null then
    select c.id into sponsor from public.hotel_customers c where c.referral_code = upper(trim(p->>'referral')) and c.id <> cust.id;
    if sponsor is not null and not exists (select 1 from public.reservations v where v.customer_uuid = cust.id and v.payment_status = 'payé') then
      update public.hotel_customers set referred_by = sponsor where hotel_customers.id = cust.id;
    end if;
  end if;

  -- Points fidélité utilisés en réduction (client connecté uniquement)
  if coalesce((p->>'use_points')::boolean, false) and prof.customer_id = cust.id and coalesce(cust.loyalty_points, 0) > 0 then
    disc := least(cust.loyalty_points::bigint * (conf->>'pointValue')::bigint, v_total);
    pts := ceil(disc::numeric / (conf->>'pointValue')::numeric)::int;
    update public.hotel_customers set loyalty_points = loyalty_points - pts where hotel_customers.id = cust.id;
  end if;

  online := pay in ('carte', 'yas', 'moov');
  insert into public.matricule_counters (prefix, last_value) values (pref, 1)
  on conflict (prefix) do update set last_value = matricule_counters.last_value + 1
  returning last_value into n;
  v_ref := pref || '-' || lpad(n::text, 4, '0');
  -- Numéro déjà pris (compteur remis à zéro, saisie au comptoir…) : on passe au suivant
  while exists (select 1 from public.reservations x where x.booking_ref = v_ref) loop
    update public.matricule_counters set last_value = last_value + 1 where prefix = pref returning last_value into n;
    v_ref := pref || '-' || lpad(n::text, 4, '0');
  end loop;

  insert into public.reservations (booking_ref, customer_id, customer_uuid, profile_id, customer_name, customer_phone, customer_email, customer_nationality,
                                   room_id, room_uuid, room_number, room_type, check_in, check_out, check_in_date, check_out_date, nights_count, guests,
                                   adults_count, nightly_rate, total_price, discount, points_used, deposit_paid, advance_amount, payment_status, status,
                                   payment_choice, payment_method, hold_until, source, notes)
  values (v_ref, cust.id::text, cust.id, prof.id, fullname, v_phone, v_mail, nullif(trim(coalesce(p->>'nationality', '')), ''),
          r.id::text, r.id, r.room_number, coalesce(nullif(r.name, ''), r.room_type), d_in::text, d_out::text, d_in, d_out, v_nights, v_guests,
          v_guests, r.price_per_night, v_total - disc, disc, pts, 0, 0, 'en_attente',
          case when online then 'paiement_en_cours' else 'réservée' end,
          case when online then 'en_ligne' else 'arrivee' end,
          case pay when 'carte' then 'Carte bancaire' when 'yas' then 'Mixx by Yas' when 'moov' then 'Moov Money' else 'À l''arrivée' end,
          case when online then now() + make_interval(mins => (conf->>'holdMinutes')::int) end,
          'site', nullif(trim(coalesce(p->>'message', '')), ''))
  returning reservations.id, reservations.token into rid, tok;

  -- Alerte immédiate à l'hôtel et au DG
  insert into public.notifications (profile_id, kind, title, body, link)
  select pr.id, 'alerte', 'Nouvelle réservation en ligne ' || v_ref,
         fullname || ' · Ch. ' || r.room_number || ' · ' || to_char(d_in, 'DD/MM') || ' → ' || to_char(d_out, 'DD/MM') || ' · ' || v_nights || ' nuit(s) · ' ||
         to_char(v_total - disc, 'FM999G999G999') || ' F · ' || case when online then 'paiement en ligne en cours' else 'paiement à l''arrivée' end,
         '/dashboard/reservations-en-ligne'
    from public.profiles pr where pr.role in ('directeur_general', 'responsable_hotel') and coalesce(pr.is_active, true);
  if prof.id is not null then
    insert into public.notifications (profile_id, kind, title, body, link)
    values (prof.id, 'info', 'Réservation ' || v_ref || ' enregistrée', 'Chambre ' || r.room_number || ' du ' || to_char(d_in, 'DD/MM/YYYY') || ' au ' || to_char(d_out, 'DD/MM/YYYY') || '.', '/reservation/' || tok);
  end if;

  return jsonb_build_object('id', rid, 'token', tok, 'ref', v_ref, 'nights', v_nights, 'total', v_total, 'discount', disc, 'due', v_total - disc, 'online', online);
end $$;
grant execute on function public.create_booking(jsonb) to anon, authenticated;

-- ─── Paiement : application commune (caisse ou paiement en ligne vérifié) ───
create or replace function public._apply_reservation_payment(res uuid, amount bigint, provider text, method text, pref text, who uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  conf jsonb := public.loyalty_conf();
  v public.reservations;
  was_paid boolean;
  paid bigint;
  full_now boolean;
  cust public.hotel_customers;
  nref integer;
  conflict boolean := false;
begin
  select * into v from public.reservations where id = res for update;
  if not found then raise exception 'Réservation introuvable'; end if;
  if v.status in ('annulée', 'annulee') then raise exception 'Réservation annulée : paiement refusé.'; end if;
  was_paid := v.payment_status = 'payé';
  paid := coalesce(v.deposit_paid, 0) + amount;
  full_now := paid >= coalesce(v.total_price, 0);
  -- Délai de paiement dépassé et chambre reprise entre-temps : on encaisse mais l'hôtel est alerté
  if v.status = 'paiement_en_cours' and v.room_uuid is not null
     and not public.room_is_free(v.room_uuid, coalesce(nullif(v.check_in, '')::date, v.check_in_date::date), coalesce(nullif(v.check_out, '')::date, v.check_out_date::date), v.id) then
    conflict := true;
  end if;
  update public.reservations
     set deposit_paid = paid, advance_amount = paid,
         payment_status = case when full_now then 'payé' else 'partiel' end,
         status = case when full_now then 'confirmée' when status = 'paiement_en_cours' then 'réservée' else status end,
         hold_until = null,
         paid_at = case when full_now then coalesce(paid_at, now()) else paid_at end,
         payment_provider = provider, payment_ref = coalesce(pref, payment_ref),
         payment_method = case method when 'carte' then 'Carte bancaire' when 'yas' then 'Mixx by Yas' when 'moov' then 'Moov Money' when 'especes' then 'Espèces' when 'mobile_money' then 'Mobile Money' when 'virement' then 'Virement' else method end,
         notes = case when conflict then concat_ws(' · ', notes, 'ATTENTION : chambre reprise pendant le paiement, à reloger') else notes end
   where id = res;

  -- Séjour soldé : points du client, récompense du parrain
  if full_now and not was_paid and v.customer_uuid is not null then
    select * into cust from public.hotel_customers where id = v.customer_uuid for update;
    update public.hotel_customers
       set loyalty_points = coalesce(loyalty_points, 0) + floor(coalesce(v.total_price, 0) / 1000.0 * (conf->>'pointsPer1000')::numeric)::int,
           total_stays = coalesce(total_stays, 0) + 1,
           total_spent = coalesce(total_spent, 0) + coalesce(v.total_price, 0)
     where id = cust.id;
    if cust.referred_by is not null and not cust.referral_rewarded then
      update public.hotel_customers set referral_rewarded = true where id = cust.id;
      select count(*) into nref from public.hotel_customers where referred_by = cust.referred_by and referral_rewarded;
      update public.hotel_customers
         set loyalty_points = coalesce(loyalty_points, 0) + (conf->>'referralPoints')::int
                              + case when nref % greatest((conf->>'bonusEvery')::int, 1) = 0 then (conf->>'bonusPoints')::int else 0 end
       where id = cust.referred_by;
      insert into public.notifications (profile_id, kind, title, body, link)
      select pr.id, 'info', 'Parrainage récompensé', cust.full_name || ' a payé son séjour : vous gagnez des points fidélité.', '/espace/reservations'
        from public.profiles pr where pr.customer_id = cust.referred_by;
    end if;
  end if;

  insert into public.notifications (profile_id, kind, title, body, link)
  select pr.id, 'paiement', 'Paiement reçu · ' || v.booking_ref,
         v.customer_name || ' · ' || to_char(amount, 'FM999G999G999') || ' F (' || method || ')' || case when full_now then ' · séjour soldé' else ' · reste ' || to_char(v.total_price - paid, 'FM999G999G999') || ' F' end
         || case when conflict then ' · ATTENTION : chambre reprise entre-temps, reloger le client' else '' end,
         '/dashboard/reservations-en-ligne'
    from public.profiles pr where pr.role in ('directeur_general', 'responsable_hotel') and coalesce(pr.is_active, true);
  if v.profile_id is not null then
    insert into public.notifications (profile_id, kind, title, body, link)
    values (v.profile_id, 'paiement', case when full_now then 'Réservation ' || v.booking_ref || ' soldée' else 'Paiement reçu · ' || v.booking_ref end,
            'Merci : ' || to_char(amount, 'FM999G999G999') || ' F reçus. Votre reçu est à jour.', '/reservation/' || v.token);
  end if;
  return jsonb_build_object('paid', paid, 'full', full_now, 'conflict', conflict);
end $$;
revoke execute on function public._apply_reservation_payment(uuid, bigint, text, text, text, uuid) from public, anon, authenticated;

-- Encaissement par la réception ou la caisse (paiement à l'arrivée, Mobile Money reçu au comptoir…)
create or replace function public.record_reservation_payment(res uuid, amount bigint, method text, note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare out jsonb;
begin
  if public.app_role() not in ('directeur_general', 'responsable_hotel', 'comptable', 'personnel') then
    raise exception 'Réservé à la réception, à la caisse et à la direction' using errcode = '42501';
  end if;
  if amount is null or amount <= 0 then raise exception 'Montant invalide'; end if;
  out := public._apply_reservation_payment(res, amount, 'caisse', method, note, auth.uid());
  insert into public.reservation_payments (reservation_id, provider, method, amount, status, recorded_by, processed_at, raw)
  values (res, 'caisse', method, amount, 'reussi', auth.uid(), now(), case when note is null then null else jsonb_build_object('note', note) end);
  return out;
end $$;
revoke execute on function public.record_reservation_payment(uuid, bigint, text, text) from public, anon;
grant execute on function public.record_reservation_payment(uuid, bigint, text, text) to authenticated;

-- Paiement en ligne confirmé par le serveur après vérification auprès du prestataire (clé de service uniquement)
create or replace function public.apply_online_payment(ident text, pref text, details jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  pay public.reservation_payments;
  out jsonb;
begin
  select * into pay from public.reservation_payments where identifier = ident for update;
  if not found then raise exception 'Paiement inconnu'; end if;
  if pay.status = 'reussi' then return jsonb_build_object('already', true); end if;
  update public.reservation_payments set status = 'reussi', provider_ref = coalesce(pref, provider_ref), raw = details, processed_at = now() where id = pay.id;
  out := public._apply_reservation_payment(pay.reservation_id, pay.amount, pay.provider, pay.method, pref, null);
  return out;
end $$;
revoke execute on function public.apply_online_payment(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_online_payment(text, text, jsonb) to service_role;

-- Annulation (réception, direction) : la chambre redevient libre, les points utilisés sont rendus
create or replace function public.cancel_reservation(res uuid, reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v public.reservations;
begin
  if public.app_role() not in ('directeur_general', 'responsable_hotel', 'personnel') then
    raise exception 'Réservé à la réception et à la direction' using errcode = '42501';
  end if;
  select * into v from public.reservations where id = res for update;
  if not found then raise exception 'Réservation introuvable'; end if;
  update public.reservations set status = 'annulée', hold_until = null, notes = concat_ws(' · ', notes, 'Annulée : ' || coalesce(reason, 'sans motif')) where id = res;
  if v.points_used > 0 and v.customer_uuid is not null and v.status not in ('annulée', 'annulee') then
    update public.hotel_customers set loyalty_points = coalesce(loyalty_points, 0) + v.points_used where id = v.customer_uuid;
  end if;
  if v.profile_id is not null then
    insert into public.notifications (profile_id, kind, title, body, link)
    values (v.profile_id, 'info', 'Réservation ' || v.booking_ref || ' annulée', coalesce(reason, 'Contactez la réception pour plus d''informations.'), '/reservation/' || v.token);
  end if;
end $$;
revoke execute on function public.cancel_reservation(uuid, text) from public, anon;
grant execute on function public.cancel_reservation(uuid, text) to authenticated;

-- ─── Reçu consultable par le lien (jeton secret) ───
create or replace function public.booking_receipt(t text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', v.id, 'ref', v.booking_ref, 'token', v.token, 'created_at', v.created_at, 'status', v.status, 'payment_status', v.payment_status,
    'payment_choice', v.payment_choice, 'payment_method', v.payment_method, 'paid_at', v.paid_at, 'hold_until', v.hold_until,
    'hold_expired', v.status = 'paiement_en_cours' and v.hold_until < now(),
    'customer_name', v.customer_name, 'customer_phone', v.customer_phone, 'customer_email', v.customer_email, 'nationality', v.customer_nationality,
    'room_number', v.room_number, 'room_name', v.room_type, 'room_image', r.images->0->>'url', 'capacity', r.capacity,
    'check_in', coalesce(nullif(v.check_in, '')::date, v.check_in_date::date), 'check_out', coalesce(nullif(v.check_out, '')::date, v.check_out_date::date),
    'nights', v.nights_count, 'guests', coalesce(v.guests, v.adults_count), 'nightly_rate', v.nightly_rate,
    'discount', v.discount, 'points_used', v.points_used, 'total', v.total_price, 'paid', coalesce(v.deposit_paid, 0),
    'remaining', greatest(coalesce(v.total_price, 0) - coalesce(v.deposit_paid, 0), 0), 'message', v.notes,
    'payments', coalesce((select jsonb_agg(jsonb_build_object('date', coalesce(p.processed_at, p.created_at), 'amount', p.amount, 'method', p.method, 'ref', coalesce(p.provider_ref, p.identifier)) order by p.created_at)
                            from public.reservation_payments p where p.reservation_id = v.id and p.status = 'reussi'), '[]'::jsonb))
    from public.reservations v left join public.rooms r on r.id = v.room_uuid
   where v.token = t
$$;
grant execute on function public.booking_receipt(text) to anon, authenticated;

-- ─── Espace client : réservations, points et lien de parrainage ───
create or replace function public.my_hotel()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  prof public.profiles;
  cust public.hotel_customers;
  conf jsonb := public.loyalty_conf();
begin
  select * into prof from public.profiles where id = auth.uid();
  if prof.id is null then raise exception 'Non connecté'; end if;
  if prof.customer_id is not null then select * into cust from public.hotel_customers where id = prof.customer_id; end if;
  if cust.id is null then
    select * into cust from public.hotel_customers where lower(email) = lower(prof.email) order by created_at limit 1;
    if cust.id is not null then
      perform set_config('avenida.enroll', 'on', true);
      update public.profiles set customer_id = cust.id where id = prof.id;
    end if;
  end if;
  if cust.id is not null and cust.referral_code is null then
    update public.hotel_customers set referral_code = 'AV' || upper(substr(md5(random()::text || cust.id::text), 1, 6)) where id = cust.id returning * into cust;
  end if;
  return jsonb_build_object(
    'customer_id', cust.id, 'name', coalesce(cust.full_name, trim(coalesce(prof.first_name, '') || ' ' || coalesce(prof.last_name, ''))),
    'points', coalesce(cust.loyalty_points, 0), 'point_value', (conf->>'pointValue')::int, 'conf', conf,
    'referral_code', cust.referral_code,
    'referrals', (select count(*) from public.hotel_customers c where cust.id is not null and c.referred_by = cust.id),
    'referrals_paid', (select count(*) from public.hotel_customers c where cust.id is not null and c.referred_by = cust.id and c.referral_rewarded),
    'reservations', coalesce((select jsonb_agg(jsonb_build_object('ref', v.booking_ref, 'token', v.token, 'room', v.room_type, 'room_number', v.room_number,
                                 'check_in', coalesce(nullif(v.check_in, '')::date, v.check_in_date::date), 'check_out', coalesce(nullif(v.check_out, '')::date, v.check_out_date::date),
                                 'total', v.total_price, 'paid', coalesce(v.deposit_paid, 0), 'status', v.status, 'payment_status', v.payment_status) order by v.created_at desc)
                               from public.reservations v
                              where (cust.id is not null and v.customer_uuid = cust.id) or lower(v.customer_email) = lower(prof.email)), '[]'::jsonb));
end $$;
revoke execute on function public.my_hotel() from public, anon;
grant execute on function public.my_hotel() to authenticated;

-- ─── Chambres existantes : photos et descriptions de départ (modifiables dans « Chambres en ligne ») ───
update public.rooms set
  images = case
    when room_type ilike '%suite%' then '[{"url":"/site/reel/chambre-renovee.webp"},{"url":"/site/reel/chambre-tv.webp"}]'::jsonb
    when room_type ilike '%studio%' then '[{"url":"/site/reel/chambre-verte.webp"}]'::jsonb
    else '[{"url":"/site/reel/chambre-rouge.webp"}]'::jsonb end
 where images = '[]'::jsonb;
