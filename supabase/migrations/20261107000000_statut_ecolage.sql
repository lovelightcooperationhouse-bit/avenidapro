-- Fiche de situation : « En règle » seulement si tout est payé, sinon « Non soldé » avec le reste
CREATE OR REPLACE FUNCTION public.verify_document(k text, t text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.report_cards; p public.fee_payments; s public.students;
begin
  if k = 'bulletin' then
    select * into r from public.report_cards where token = t;
    if r.id is null then return jsonb_build_object('valid', false, 'reason', 'Bulletin inconnu : ce document n''a pas été émis par l''Hôtel École Avenida'); end if;
    if r.signed_at is null then
      return jsonb_build_object('valid', false, 'reason', 'Bulletin provisoire : il n''a pas encore été validé et signé par le Directeur pédagogique',
        'name', r.student_name, 'matricule', r.student_matricule, 'class', r.class_name, 'period', r.period, 'year', r.academic_year);
    end if;
    return jsonb_build_object('valid', true, 'type', 'bulletin', 'name', r.student_name, 'matricule', r.student_matricule, 'class', r.class_name,
      'year', r.academic_year, 'period', coalesce(r.period, 'Semestre ' || r.term), 'average', r.general_average, 'rank', r.rank_display,
      'total', r.total_students, 'mention', r.mention, 'number', r.bulletin_number, 'issued', r.signed_at,
      'signed_by', r.signed_by_name, 'revision', r.revision);
  elsif k = 'recu' then
    select * into p from public.fee_payments where token = t;
    if p.id is null then return jsonb_build_object('valid', false, 'reason', 'Reçu inconnu : ce document n''a pas été émis par l''Hôtel École Avenida'); end if;
    return jsonb_build_object('valid', coalesce(p.status, 'validé') in ('validé', 'valide', 'confirmé'), 'type', 'recu', 'number', p.receipt_number,
      'name', p.student_name, 'matricule', p.student_matricule, 'class', p.class_name, 'amount', p.amount, 'designation', p.designation,
      'date', coalesce(p.payment_date, p.created_at), 'remaining', p.remaining_due, 'method', p.payment_method);
  elsif k = 'situation' then
    select * into s from public.students where situation_token = t;
    if s.id is null then return jsonb_build_object('valid', false, 'reason', 'Fiche inconnue : ce document n''a pas été émis par l''Hôtel École Avenida'); end if;
    return jsonb_build_object('valid', true, 'type', 'situation', 'name', s.first_name || ' ' || s.last_name, 'matricule', s.registration_number,
      'class', s.class_name, 'year', s.academic_year, 'total', s.total_fee, 'paid', s.paid_fee, 'remaining', s.remaining_fee,
      'status', case when coalesce(s.remaining_fee, 0) <= 0 and coalesce(s.total_fee, 0) > 0 then 'En règle (écolage entièrement payé)'
                     else 'Non soldé : reste ' || to_char(coalesce(s.remaining_fee, 0), 'FM999G999G999') || ' F CFA'
                          || case when public.student_payment_ok(s) then '' else ' (en retard sur l''échéancier)' end end,
      'date', now());
  end if;
  return jsonb_build_object('valid', false, 'reason', 'Type de document inconnu');
end $function$;
