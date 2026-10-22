-- La notification des familles n'est appelée que par les déclencheurs (jamais directement par un compte)
revoke execute on function public.notify_student_family(uuid, text, text, text, text) from public, anon, authenticated;

-- Carte émise ou mise à jour → l'élève et ses parents (ou le salarié) sont prévenus
create or replace function public.on_card_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare st public.students;
begin
  if new.holder_type = 'eleve' then
    select * into st from public.students where id = new.student_id;
    perform public.notify_student_family(
      new.student_id, 'carte',
      case when tg_op = 'INSERT' then 'Carte scolaire émise' else 'Carte scolaire mise à jour (version ' || new.version || ')' end,
      'La carte de ' || st.first_name || ' ' || st.last_name || ' (' || coalesce(st.registration_number, '') || ') est disponible dans l''espace « Carte scolaire ».',
      '/espace/carte'
    );
  else
    insert into public.notifications (profile_id, kind, title, body, link)
    select p.id, 'carte',
           case when tg_op = 'INSERT' then 'Carte de travail émise' else 'Carte de travail mise à jour' end,
           'Votre carte de travail est disponible dans votre espace.', '/espace/carte'
      from public.profiles p where p.employee_id = new.employee_id;
  end if;
  return new;
end $$;
drop trigger if exists card_notify on public.id_cards;
create trigger card_notify after insert or update of version, token on public.id_cards
  for each row execute function public.on_card_change();

-- Appel ré-enregistré sans changement : pas de nouvelle notification
create or replace function public.on_attendance_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  st public.students;
  label text;
begin
  if tg_op = 'UPDATE' and new.status = old.status and coalesce(new.note, '') = coalesce(old.note, '') then return new; end if;
  if new.status = 'present' and (tg_op = 'INSERT' or old.status = 'present') then return new; end if;
  select * into st from public.students where id = new.student_id;
  label := case new.status when 'absent' then 'absent(e)' when 'retard' then 'en retard' when 'permission' then 'en permission' else 'présent(e)' end;
  perform public.notify_student_family(
    new.student_id, 'presence',
    'Fiche de correspondance : ' || st.first_name || ' ' || label,
    st.first_name || ' ' || st.last_name || ' (' || coalesce(st.class_name, '') || ') a été noté(e) ' || label || ' le ' || to_char(new.date, 'DD/MM/YYYY')
      || coalesce('. ' || new.note, '') || '.',
    '/espace/correspondance'
  );
  return new;
end $$;
