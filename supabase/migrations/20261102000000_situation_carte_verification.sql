-- ════════════════════════════════════════════════════════════════════════════
-- 1. Fiche de situation financière : vérifiable par QR (jeton propre à l'élève)
-- ════════════════════════════════════════════════════════════════════════════
alter table public.students add column if not exists situation_token text unique default replace(gen_random_uuid()::text, '-', '');
update public.students set situation_token = replace(gen_random_uuid()::text, '-', '') where situation_token is null;

create or replace function public.verify_document(k text, t text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r public.report_cards; p public.fee_payments; s public.students;
begin
  if k = 'bulletin' then
    select * into r from public.report_cards where token = t;
    if r.id is null then return jsonb_build_object('valid', false, 'reason', 'Bulletin inconnu'); end if;
    return jsonb_build_object('valid', true, 'type', 'bulletin', 'name', r.student_name, 'matricule', r.student_matricule, 'class', r.class_name,
      'year', r.academic_year, 'period', coalesce(r.period, 'Trimestre ' || r.term), 'average', r.general_average, 'rank', r.rank_display,
      'mention', r.mention, 'number', r.bulletin_number, 'issued', r.issue_date);
  elsif k = 'recu' then
    select * into p from public.fee_payments where token = t;
    if p.id is null then return jsonb_build_object('valid', false, 'reason', 'Reçu inconnu'); end if;
    return jsonb_build_object('valid', coalesce(p.status, 'validé') in ('validé', 'valide', 'confirmé'), 'type', 'recu', 'number', p.receipt_number,
      'name', p.student_name, 'matricule', p.student_matricule, 'class', p.class_name, 'amount', p.amount, 'designation', p.designation,
      'date', coalesce(p.payment_date, p.created_at), 'remaining', p.remaining_due, 'method', p.payment_method);
  elsif k = 'situation' then
    select * into s from public.students where situation_token = t;
    if s.id is null then return jsonb_build_object('valid', false, 'reason', 'Fiche inconnue'); end if;
    return jsonb_build_object('valid', true, 'type', 'situation', 'name', s.first_name || ' ' || s.last_name, 'matricule', s.registration_number,
      'class', s.class_name, 'year', s.academic_year, 'total', s.total_fee, 'paid', s.paid_fee, 'remaining', s.remaining_fee,
      'status', case when coalesce(s.remaining_fee, 0) <= 0 and coalesce(s.total_fee, 0) > 0 then 'Soldé'
                     when public.student_payment_ok(s) then 'En règle' else 'En retard de paiement' end,
      'date', now());
  end if;
  return jsonb_build_object('valid', false, 'reason', 'Type de document inconnu');
end $$;
grant execute on function public.verify_document(text, text) to anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Cartes : vérification par le titulaire avant validation et envoi
--    brouillon → a_verifier (envoyée au membre) → approuvee / corrections → envoyee (validée, dans l'espace)
-- ════════════════════════════════════════════════════════════════════════════
alter table public.id_cards add column if not exists review_status text not null default 'brouillon';
alter table public.id_cards drop constraint if exists id_cards_review_status_check;
alter table public.id_cards add constraint id_cards_review_status_check check (review_status in ('brouillon', 'a_verifier', 'approuvee', 'corrections', 'envoyee'));
alter table public.id_cards add column if not exists review_note text;
alter table public.id_cards add column if not exists reviewed_at timestamptz;
alter table public.id_cards add column if not exists validated_at timestamptz;
-- Cartes déjà émises : considérées comme envoyées
update public.id_cards set review_status = 'envoyee' where review_status = 'brouillon';

-- Profils titulaires d'une carte (élève et parents, ou salarié, ou client)
create or replace function public.card_holders(c public.id_cards)
returns setof uuid language sql stable security definer set search_path = public as $$
  select p.id from public.profiles p where c.student_id is not null and p.role = 'eleve' and p.student_id = c.student_id
  union select ps.parent_id from public.parent_students ps where c.student_id is not null and ps.student_id = c.student_id
  union select p.id from public.profiles p where c.employee_id is not null and p.employee_id = c.employee_id
  union select p.id from public.profiles p where c.customer_id is not null and p.customer_id = c.customer_id
$$;

create or replace function public.request_card_review(card uuid, message text default null)
returns int language plpgsql security definer set search_path = public as $$
declare c public.id_cards; n int;
begin
  if not public.is_manager() then raise exception 'Réservé à l''administration' using errcode = '42501'; end if;
  select * into c from public.id_cards where id = card;
  if c.id is null then raise exception 'Carte introuvable'; end if;
  update public.id_cards set review_status = 'a_verifier', review_note = nullif(trim(message), ''), reviewed_at = null where id = card;
  insert into public.notifications (profile_id, kind, title, body, link)
  select h, 'carte', 'Vérifiez votre carte avant validation',
         coalesce(nullif(trim(message), '') || ' ', '') || 'Contrôlez les informations de la carte et confirmez, ou signalez une erreur.', '/espace/carte'
    from public.card_holders(c) h;
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.answer_card_review(card uuid, ok boolean, note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c public.id_cards;
begin
  select * into c from public.id_cards where id = card;
  if c.id is null or not exists (select 1 from public.card_holders(c) h where h = auth.uid()) then
    raise exception 'Carte introuvable ou non autorisée' using errcode = '42501';
  end if;
  update public.id_cards set review_status = case when ok then 'approuvee' else 'corrections' end,
         review_note = coalesce(nullif(trim(note), ''), review_note), reviewed_at = now()
   where id = card;
  insert into public.notifications (profile_id, kind, title, body, link, sms_status)
  select p.id, 'carte',
         case when ok then 'Carte approuvée par son titulaire' else 'Corrections demandées sur une carte' end,
         coalesce((select first_name || ' ' || last_name from public.students where id = c.student_id),
                  (select first_name || ' ' || last_name from public.employees where id = c.employee_id), 'Carte') ||
         coalesce(' : « ' || nullif(trim(note), '') || ' »', '') || '.',
         '/dashboard/cartes', 'skipped'
    from public.profiles p
   where p.is_active is not false
     and (p.role = 'directeur_general' or (c.student_id is not null and p.role = 'directeur_pedagogique')
          or (c.employee_id is not null and p.role = 'ressources_humaines') or (c.customer_id is not null and p.role = 'responsable_hotel'));
end $$;

create or replace function public.validate_card(card uuid)
returns int language plpgsql security definer set search_path = public as $$
declare c public.id_cards; n int;
begin
  if not public.is_manager() then raise exception 'Réservé à l''administration' using errcode = '42501'; end if;
  select * into c from public.id_cards where id = card;
  if c.id is null then raise exception 'Carte introuvable'; end if;
  update public.id_cards set review_status = 'envoyee', validated_at = now() where id = card;
  insert into public.notifications (profile_id, kind, title, body, link)
  select h, 'carte', 'Votre carte est validée', 'Votre carte ' || coalesce(c.card_number, '') || ' est disponible dans votre espace : consultez-la, téléchargez-la ou imprimez-la.', '/espace/carte'
    from public.card_holders(c) h;
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function public.request_card_review(uuid, text) from public, anon;
revoke execute on function public.answer_card_review(uuid, boolean, text) from public, anon;
revoke execute on function public.validate_card(uuid) from public, anon;
revoke execute on function public.card_holders(public.id_cards) from public, anon, authenticated;
grant execute on function public.request_card_review(uuid, text) to authenticated;
grant execute on function public.answer_card_review(uuid, boolean, text) to authenticated;
grant execute on function public.validate_card(uuid) to authenticated;
