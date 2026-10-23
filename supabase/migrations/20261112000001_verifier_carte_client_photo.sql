-- Vérification d'une carte de fidélité : photo du client affichée au scan du QR code.
CREATE OR REPLACE FUNCTION public.verify_card(t text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  c public.id_cards;
  st public.students;
  em public.employees;
  cu public.hotel_customers;
  detail boolean := public.is_staff() or public.app_role() = 'professeur';
  res jsonb;
begin
  select * into c from public.id_cards where token = t;
  if c.id is null then return jsonb_build_object('valid', false, 'reason', 'Carte inconnue'); end if;
  if c.revoked then return jsonb_build_object('valid', false, 'reason', 'Carte révoquée'); end if;
  if coalesce(c.review_status, 'envoyee') <> 'envoyee' and not coalesce(detail, false) then
    return jsonb_build_object('valid', false, 'reason', 'Carte en cours de validation : elle n''est pas encore officielle');
  end if;

  if c.holder_type = 'eleve' then
    select * into st from public.students where id = c.student_id;
    res := jsonb_build_object(
      'valid', st.status = 'actif' and not st.is_archived and (c.valid_until is null or c.valid_until >= current_date),
      'type', 'eleve', 'name', st.first_name || ' ' || st.last_name, 'photo', st.photo_url, 'card_number', c.card_number,
      'matricule', coalesce(st.registration_number, st.student_number), 'class', st.class_name,
      'year', st.academic_year, 'status', st.status, 'version', c.version, 'issued_at', c.issued_at,
      'payment_ok', public.student_payment_ok(st));
    if detail then
      res := res || jsonb_build_object(
        'student_id', st.id, 'paid', st.paid_fee, 'remaining', st.remaining_fee, 'total', st.total_fee,
        'absences_30j', (select count(*) from public.student_attendance a where a.student_id = st.id and a.status = 'absent' and a.date > current_date - 30),
        'retards_30j', (select count(*) from public.student_attendance a where a.student_id = st.id and a.status = 'retard' and a.date > current_date - 30),
        'permission_en_cours', exists (select 1 from public.permission_requests p where p.student_id = st.id and p.status = 'acceptee' and current_date between p.start_date and p.end_date),
        'present_today', (select a.status from public.student_attendance a where a.student_id = st.id and a.date = current_date limit 1));
    end if;
  elsif c.holder_type = 'client' then
    select * into cu from public.hotel_customers where id = c.customer_id;
    res := jsonb_build_object(
      'valid', c.valid_until is null or c.valid_until >= current_date,
      'type', 'client', 'name', coalesce(cu.full_name, cu.first_name || ' ' || cu.last_name), 'card_number', c.card_number, 'matricule', c.card_number,
      'level', case when coalesce(cu.total_stays, 0) >= 10 or coalesce(cu.is_vip, false) then 'Or' when coalesce(cu.total_stays, 0) >= 4 then 'Argent' else 'Classique' end,
      'points', cu.loyalty_points, 'photo', cu.photo_url, 'version', c.version, 'issued_at', c.issued_at);
    if detail then res := res || jsonb_build_object('customer_id', cu.id, 'stays', cu.total_stays, 'spent', cu.total_spent, 'phone', cu.phone); end if;
  else
    select * into em from public.employees where id = c.employee_id;
    res := jsonb_build_object(
      'valid', coalesce(em.status, 'actif') not in ('inactif', 'licencié', 'demission') and (c.valid_until is null or c.valid_until >= current_date),
      'type', 'personnel', 'name', em.first_name || ' ' || em.last_name, 'photo', em.photo_url, 'card_number', c.card_number,
      'matricule', em.matricule, 'position', coalesce(em.role_title, em.position), 'department', coalesce(em.department, em.sector),
      'status', em.status, 'version', c.version, 'issued_at', c.issued_at);
    if detail then res := res || jsonb_build_object('employee_id', em.id, 'contract', em.contract_type, 'hire_date', em.hire_date, 'phone', em.phone); end if;
  end if;
  return res;
end $function$;
