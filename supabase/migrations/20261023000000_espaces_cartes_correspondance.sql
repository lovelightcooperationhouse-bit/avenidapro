-- ════════════════════════════════════════════════════════════════════════
-- Espaces École (une salle par filière) et Hôtel (une salle par service),
-- fiche de correspondance (appel, permissions), notifications, cartes avec QR,
-- économat par département et matricules par filière.
-- ════════════════════════════════════════════════════════════════════════

-- ─── 1. Espaces ──────────────────────────────────────────────────────────
create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('ecole', 'hotel')),
  name text not null,
  program_code text,            -- école : CFA, CAP, BEP, BT, BTS
  specialty text,               -- école : spécialité (ex. « Cuisine / Pâtisserie »)
  service text,                 -- hôtel : service
  description text,
  color text default '#0C356A',
  created_at timestamptz not null default now(),
  unique (kind, name)
);

-- Membres ajoutés à la main (personnel de l'hôtel, renforts, responsables)
create table if not exists public.space_members (
  space_id uuid not null references public.spaces(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'membre' check (role in ('responsable', 'membre')),
  added_at timestamptz not null default now(),
  primary key (space_id, profile_id)
);

-- Un élève appartient à la salle de sa filière ; une classe « CAP1 - Cuisine / Pâtisserie »
-- correspond à la filière CAP · Cuisine / Pâtisserie.
create or replace function public.class_in_space(cls text, sp public.spaces)
returns boolean language sql immutable as $$
  select sp.kind = 'ecole' and cls is not null
     and upper(cls) like upper(sp.program_code) || '%'
     and lower(cls) like '%' || lower(sp.specialty) || '%'
$$;

-- Rôle de l'utilisateur courant dans une salle : 'responsable', 'membre' ou null
create or replace function public.space_role(sid uuid)
returns text language plpgsql stable security definer set search_path = public as $$
declare
  sp public.spaces;
  me public.profiles;
  explicit text;
begin
  select * into sp from public.spaces where id = sid;
  select * into me from public.profiles where id = auth.uid() and is_active is not false;
  if sp.id is null or me.id is null then return null; end if;

  select role into explicit from public.space_members where space_id = sid and profile_id = me.id;
  if explicit is not null then return explicit; end if;

  if me.role = 'directeur_general' then return 'responsable'; end if;
  if sp.kind = 'ecole' then
    if me.role = 'directeur_pedagogique' then return 'responsable'; end if;
    if me.role = 'professeur' and exists (
      select 1 from public.teacher_assignments ta where ta.teacher_id = me.id and public.class_in_space(ta.class_name, sp)
    ) then return 'responsable'; end if;
    if me.role = 'eleve' and exists (
      select 1 from public.students s where s.id = me.student_id and public.class_in_space(s.class_name, sp)
    ) then return 'membre'; end if;
  else
    if me.role = 'responsable_hotel' then return 'responsable'; end if;
  end if;
  return null;
end $$;

create table if not exists public.space_posts (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('annonce', 'cours', 'devoir', 'programme', 'document', 'consigne')),
  title text not null check (char_length(title) between 1 and 200),
  body text check (char_length(body) <= 20000),
  due_at timestamptz,
  attachments jsonb not null default '[]'::jsonb,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists space_posts_space_idx on public.space_posts (space_id, created_at desc);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.space_posts(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  attachments jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now(),
  grade numeric(4,2),
  feedback text,
  unique (post_id, student_id)
);

create table if not exists public.space_messages (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'image', 'audio', 'file', 'live')),
  body text check (char_length(body) <= 4000),
  attachment jsonb,
  created_at timestamptz not null default now()
);
create index if not exists space_messages_space_idx on public.space_messages (space_id, created_at desc);

create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  started_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  room text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

-- ─── 2. Fiche de correspondance : appel, permissions ─────────────────────
alter table public.student_attendance add column if not exists recorded_by uuid references public.profiles(id);
alter table public.student_attendance add column if not exists period text not null default 'journee';
alter table public.student_attendance drop constraint if exists student_attendance_status_check;
alter table public.student_attendance add constraint student_attendance_status_check check (status in ('present', 'absent', 'retard', 'permission'));
create unique index if not exists student_attendance_unique on public.student_attendance (student_id, date, period);

create table if not exists public.permission_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text not null check (char_length(reason) between 3 and 2000),
  justificatif jsonb,
  status text not null default 'en_attente' check (status in ('en_attente', 'acceptee', 'refusee')),
  response text,
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

-- ─── 3. Notifications (espace + e-mail/SMS envoyés par le serveur) ───────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'info',
  title text not null,
  body text,
  link text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'skipped', 'failed')),
  sms_status text not null default 'pending' check (sms_status in ('pending', 'sent', 'skipped', 'failed'))
);
create index if not exists notifications_profile_idx on public.notifications (profile_id, created_at desc);

-- Notifie l'élève (son compte) et tous ses parents
create or replace function public.notify_student_family(sid uuid, k text, t text, b text, l text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (profile_id, kind, title, body, link)
  select p.id, k, t, b, l from public.profiles p where p.role = 'eleve' and p.student_id = sid
  union
  select ps.parent_id, k, t, b, l from public.parent_students ps where ps.student_id = sid
$$;

create or replace function public.on_attendance_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  st public.students;
  label text;
begin
  if new.status = 'present' and (tg_op = 'INSERT' or old.status = 'present') then return new; end if;
  select * into st from public.students where id = new.student_id;
  label := case new.status when 'absent' then 'absent(e)' when 'retard' then 'en retard' when 'permission' then 'en permission' else 'présent(e)' end;
  perform public.notify_student_family(
    new.student_id, 'presence',
    'Fiche de correspondance : ' || st.first_name || ' ' || label,
    st.first_name || ' ' || st.last_name || ' (' || coalesce(st.class_name, '') || ') a été noté(e) ' || label || ' le ' || to_char(new.date, 'DD/MM/YYYY')
      || coalesce('. ' || new.note, '') || '.',
    '/espace'
  );
  return new;
end $$;
drop trigger if exists attendance_notify on public.student_attendance;
create trigger attendance_notify after insert or update of status on public.student_attendance
  for each row execute function public.on_attendance_change();

create or replace function public.on_permission_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare st public.students;
begin
  select * into st from public.students where id = new.student_id;
  if tg_op = 'INSERT' then
    -- Prévient la direction pédagogique
    insert into public.notifications (profile_id, kind, title, body, link)
    select p.id, 'permission', 'Nouvelle demande de permission', st.first_name || ' ' || st.last_name || ' du ' || to_char(new.start_date, 'DD/MM') || ' au ' || to_char(new.end_date, 'DD/MM'), '/dashboard/correspondance'
      from public.profiles p where p.role in ('directeur_general', 'directeur_pedagogique') and p.is_active is not false;
  elsif new.status <> old.status then
    perform public.notify_student_family(
      new.student_id, 'permission',
      'Permission ' || case new.status when 'acceptee' then 'accordée' else 'refusée' end || ' : ' || st.first_name,
      'Demande du ' || to_char(new.start_date, 'DD/MM/YYYY') || ' au ' || to_char(new.end_date, 'DD/MM/YYYY') || coalesce('. Réponse : ' || new.response, '') || '.',
      '/espace/correspondance'
    );
    -- Une permission accordée est reportée sur la fiche de correspondance
    if new.status = 'acceptee' then
      insert into public.student_attendance (student_id, date, status, note, recorded_by)
      select new.student_id, d::date, 'permission', 'Permission accordée', new.decided_by
        from generate_series(new.start_date, new.end_date, interval '1 day') d
      on conflict (student_id, date, period) do update set status = 'permission', note = 'Permission accordée';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists permission_notify on public.permission_requests;
create trigger permission_notify after insert or update of status on public.permission_requests
  for each row execute function public.on_permission_change();

-- Paiement enregistré → notification à la famille
create or replace function public.on_fee_payment()
returns trigger language plpgsql security definer set search_path = public as $$
declare st public.students;
begin
  select * into st from public.students s
   where s.id::text = new.student_id or s.registration_number = new.student_id or s.student_number = new.student_id limit 1;
  if st.id is not null then
    perform public.notify_student_family(
      st.id, 'paiement', 'Paiement reçu : ' || coalesce(new.amount, 0) || ' F',
      'Reçu ' || coalesce(new.receipt_number, '') || ' pour ' || st.first_name || ' ' || st.last_name || '. Reste à payer : ' || coalesce(st.remaining_fee, 0) || ' F.',
      '/espace'
    );
  end if;
  return new;
end $$;
drop trigger if exists fee_payment_notify on public.fee_payments;
create trigger fee_payment_notify after insert on public.fee_payments
  for each row execute function public.on_fee_payment();

-- ─── 4. Cartes (élèves et personnel) avec QR de vérification ──────────────
create table if not exists public.id_cards (
  id uuid primary key default gen_random_uuid(),
  holder_type text not null check (holder_type in ('eleve', 'personnel')),
  student_id uuid unique references public.students(id) on delete cascade,
  employee_id uuid unique references public.employees(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  version integer not null default 1,
  issued_at timestamptz not null default now(),
  issued_by uuid references public.profiles(id),
  valid_until date,
  revoked boolean not null default false,
  check ((holder_type = 'eleve' and student_id is not null) or (holder_type = 'personnel' and employee_id is not null))
);

-- Scolarité « à jour » : payé au moins la part attendue (8 tranches à partir d'octobre)
create or replace function public.student_payment_ok(st public.students)
returns boolean language sql stable as $$
  select coalesce(st.remaining_fee, 0) <= 0 or coalesce(st.total_fee, 0) = 0
      or coalesce(st.paid_fee, 0) >= st.total_fee * least(1.0, greatest(1,
           (extract(year from age(now(), make_date(coalesce(nullif(left(st.academic_year, 4), '')::int, extract(year from now())::int), 10, 1))) * 12
          + extract(month from age(now(), make_date(coalesce(nullif(left(st.academic_year, 4), '')::int, extract(year from now())::int), 10, 1))) + 1)) / 8.0)
$$;

-- Lecture d'une carte par son QR : informations de base pour tous, détail pour le personnel
create or replace function public.verify_card(t text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  c public.id_cards;
  st public.students;
  em public.employees;
  detail boolean := public.is_staff() or public.app_role() = 'professeur';
  res jsonb;
begin
  select * into c from public.id_cards where token = t;
  if c.id is null then return jsonb_build_object('valid', false, 'reason', 'Carte inconnue'); end if;
  if c.revoked then return jsonb_build_object('valid', false, 'reason', 'Carte révoquée'); end if;

  if c.holder_type = 'eleve' then
    select * into st from public.students where id = c.student_id;
    res := jsonb_build_object(
      'valid', st.status = 'actif' and not st.is_archived and (c.valid_until is null or c.valid_until >= current_date),
      'type', 'eleve', 'name', st.first_name || ' ' || st.last_name, 'photo', st.photo_url,
      'matricule', coalesce(st.registration_number, st.student_number), 'class', st.class_name,
      'year', st.academic_year, 'status', st.status, 'version', c.version, 'issued_at', c.issued_at,
      'payment_ok', public.student_payment_ok(st)
    );
    if detail then
      res := res || jsonb_build_object(
        'student_id', st.id, 'paid', st.paid_fee, 'remaining', st.remaining_fee, 'total', st.total_fee,
        'absences_30j', (select count(*) from public.student_attendance a where a.student_id = st.id and a.status = 'absent' and a.date > current_date - 30),
        'retards_30j', (select count(*) from public.student_attendance a where a.student_id = st.id and a.status = 'retard' and a.date > current_date - 30),
        'permission_en_cours', exists (select 1 from public.permission_requests p where p.student_id = st.id and p.status = 'acceptee' and current_date between p.start_date and p.end_date),
        'present_today', (select a.status from public.student_attendance a where a.student_id = st.id and a.date = current_date limit 1)
      );
    end if;
  else
    select * into em from public.employees where id = c.employee_id;
    res := jsonb_build_object(
      'valid', coalesce(em.status, 'actif') not in ('inactif', 'licencié', 'demission') and (c.valid_until is null or c.valid_until >= current_date),
      'type', 'personnel', 'name', em.first_name || ' ' || em.last_name, 'photo', em.photo_url,
      'matricule', em.matricule, 'position', coalesce(em.role_title, em.position), 'department', coalesce(em.department, em.sector),
      'status', em.status, 'version', c.version, 'issued_at', c.issued_at
    );
    if detail then
      res := res || jsonb_build_object('employee_id', em.id, 'contract', em.contract_type, 'hire_date', em.hire_date, 'phone', em.phone);
    end if;
  end if;
  return res;
end $$;
grant execute on function public.verify_card(text) to anon, authenticated;

-- ─── 5. Matricules par filière (ex. CAP26-0001) ──────────────────────────
create table if not exists public.matricule_counters (
  prefix text primary key,
  last_value integer not null default 0
);
create or replace function public.next_matricule(program text)
returns text language plpgsql security definer set search_path = public as $$
declare
  p text := upper(program) || to_char(now(), 'YY');
  n integer;
begin
  if not public.is_staff() then raise exception 'Réservé au personnel'; end if;
  insert into public.matricule_counters (prefix, last_value) values (p, 1)
  on conflict (prefix) do update set last_value = matricule_counters.last_value + 1
  returning last_value into n;
  return p || '-' || lpad(n::text, 4, '0');
end $$;

-- ─── 6. Économat par département : mouvements et budgets ─────────────────
-- Les articles sont dans products (la vue inventory les expose au tableau de bord)
alter table public.products add column if not exists department text not null default 'cuisine';

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.products(id) on delete cascade,
  department text not null default 'cuisine',
  movement text not null check (movement in ('achat', 'entree', 'sortie', 'perte', 'ajustement')),
  quantity numeric not null check (quantity > 0),
  unit_cost bigint not null default 0,
  total_cost bigint generated always as ((quantity * unit_cost)::bigint) stored,
  reason text,
  supplier text,
  class_name text,
  recorded_by uuid references public.profiles(id),
  movement_date date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists inventory_movements_dept_idx on public.inventory_movements (department, movement_date desc);

-- Met à jour le stock à chaque mouvement
create or replace function public.apply_inventory_movement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.products
     set current_quantity = greatest(0, coalesce(current_quantity, 0) + case when new.movement in ('achat', 'entree') then new.quantity when new.movement = 'ajustement' then 0 else -new.quantity end),
         average_cost_price = case when new.movement = 'achat' and new.unit_cost > 0 then new.unit_cost else average_cost_price end,
         last_restock_date = case when new.movement in ('achat', 'entree') then new.movement_date else last_restock_date end,
         updated_at = now()
   where id = new.item_id;
  return new;
end $$;
drop trigger if exists inventory_movement_apply on public.inventory_movements;
create trigger inventory_movement_apply after insert on public.inventory_movements
  for each row execute function public.apply_inventory_movement();

create table if not exists public.department_budgets (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  year integer not null,
  month integer check (month between 1 and 12),
  amount bigint not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (department, year, month)
);

-- ─── 7. Règles d'accès ───────────────────────────────────────────────────
do $$ declare t text; begin
  foreach t in array array['spaces', 'space_members', 'space_posts', 'assignment_submissions', 'space_messages', 'live_sessions',
                           'permission_requests', 'notifications', 'id_cards', 'matricule_counters', 'inventory_movements', 'department_budgets'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists staff_all on public.%I', t);
    execute format('create policy staff_all on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

-- Salles : visibles par leurs membres
drop policy if exists member_select on public.spaces;
create policy member_select on public.spaces for select to authenticated using (public.space_role(id) is not null);
drop policy if exists member_select on public.space_members;
create policy member_select on public.space_members for select to authenticated using (public.space_role(space_id) is not null);

drop policy if exists member_select on public.space_posts;
create policy member_select on public.space_posts for select to authenticated using (public.space_role(space_id) is not null);
drop policy if exists responsable_write on public.space_posts;
create policy responsable_write on public.space_posts for insert to authenticated
  with check (author_id = auth.uid() and public.space_role(space_id) = 'responsable');
drop policy if exists author_update on public.space_posts;
create policy author_update on public.space_posts for update to authenticated
  using (author_id = auth.uid() or public.space_role(space_id) = 'responsable') with check (public.space_role(space_id) = 'responsable');
drop policy if exists author_delete on public.space_posts;
create policy author_delete on public.space_posts for delete to authenticated
  using (author_id = auth.uid() or public.space_role(space_id) = 'responsable');

-- Devoirs : l'élève remet le sien ; le responsable voit tout et corrige
drop policy if exists own_or_teacher_select on public.assignment_submissions;
create policy own_or_teacher_select on public.assignment_submissions for select to authenticated using (
  student_id = auth.uid() or exists (select 1 from public.space_posts p where p.id = post_id and public.space_role(p.space_id) = 'responsable')
);
drop policy if exists student_submit on public.assignment_submissions;
create policy student_submit on public.assignment_submissions for insert to authenticated with check (
  student_id = auth.uid() and grade is null and exists (select 1 from public.space_posts p where p.id = post_id and p.type = 'devoir' and public.space_role(p.space_id) = 'membre')
);
drop policy if exists student_resubmit on public.assignment_submissions;
create policy student_resubmit on public.assignment_submissions for update to authenticated
  using (student_id = auth.uid() or exists (select 1 from public.space_posts p where p.id = post_id and public.space_role(p.space_id) = 'responsable'))
  with check (student_id = auth.uid() or exists (select 1 from public.space_posts p where p.id = post_id and public.space_role(p.space_id) = 'responsable'));

-- Discussion de la salle
drop policy if exists member_select on public.space_messages;
create policy member_select on public.space_messages for select to authenticated using (public.space_role(space_id) is not null);
drop policy if exists member_insert on public.space_messages;
create policy member_insert on public.space_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.space_role(space_id) is not null and (kind <> 'live' or public.space_role(space_id) = 'responsable'));
drop policy if exists own_delete on public.space_messages;
create policy own_delete on public.space_messages for delete to authenticated
  using (sender_id = auth.uid() or public.space_role(space_id) = 'responsable');

-- Visio : seul le responsable (professeur) lance et termine
drop policy if exists member_select on public.live_sessions;
create policy member_select on public.live_sessions for select to authenticated using (public.space_role(space_id) is not null);
drop policy if exists responsable_write on public.live_sessions;
create policy responsable_write on public.live_sessions for insert to authenticated
  with check (started_by = auth.uid() and public.space_role(space_id) = 'responsable');
drop policy if exists responsable_update on public.live_sessions;
create policy responsable_update on public.live_sessions for update to authenticated
  using (public.space_role(space_id) = 'responsable') with check (public.space_role(space_id) = 'responsable');

-- Appel : le professeur note la présence de ses élèves
drop policy if exists teacher_insert on public.student_attendance;
create policy teacher_insert on public.student_attendance for insert to authenticated with check (public.teaches_student(student_id));
drop policy if exists teacher_update on public.student_attendance;
create policy teacher_update on public.student_attendance for update to authenticated using (public.teaches_student(student_id)) with check (public.teaches_student(student_id));

-- Permissions : le parent demande pour son enfant
drop policy if exists family_select on public.permission_requests;
create policy family_select on public.permission_requests for select to authenticated using (requested_by = auth.uid() or public.can_see_student(student_id));
drop policy if exists parent_insert on public.permission_requests;
create policy parent_insert on public.permission_requests for insert to authenticated with check (
  requested_by = auth.uid() and status = 'en_attente' and decided_by is null
  and exists (select 1 from public.parent_students ps where ps.parent_id = auth.uid() and ps.student_id = permission_requests.student_id)
);

-- Notifications : chacun les siennes (marquer comme lues)
drop policy if exists own_select on public.notifications;
create policy own_select on public.notifications for select to authenticated using (profile_id = auth.uid());
drop policy if exists own_update on public.notifications;
create policy own_update on public.notifications for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Carte : le titulaire et sa famille voient la carte
drop policy if exists holder_select on public.id_cards;
create policy holder_select on public.id_cards for select to authenticated using (
  (student_id is not null and public.can_see_student(student_id))
  or (employee_id is not null and exists (select 1 from public.profiles p where p.id = auth.uid() and p.employee_id = id_cards.employee_id))
);

-- Le professeur lit les fiches personnel liées à son compte (sa carte de travail)
drop policy if exists own_select on public.employees;
create policy own_select on public.employees for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.employee_id = employees.id));

-- ─── 8. Stockage privé ───────────────────────────────────────────────────
-- Conversion texte → uuid sans erreur (les règles de stockage s'appliquent à tous les fichiers)
create or replace function public.try_uuid(v text)
returns uuid language plpgsql immutable as $$
begin
  return v::uuid;
exception when others then
  return null;
end $$;

-- Règle de dépôt des pré-inscriptions réécrite avec try_uuid
drop policy if exists "dossiers_depot_public" on storage.objects;
create policy "dossiers_depot_public" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'dossiers' and (storage.foldername(name))[1] = 'preinscriptions'
              and public.application_accepts_documents(public.try_uuid((storage.foldername(name))[2])));
drop policy if exists "dossiers_lecture" on storage.objects;
create policy "dossiers_lecture" on storage.objects for select to authenticated
  using (bucket_id = 'dossiers' and (public.is_staff() or exists (
    select 1 from public.applications a where a.id = public.try_uuid((storage.foldername(name))[2]) and lower(a.email) = lower(auth.jwt() ->> 'email')
  )));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('espaces', 'espaces', false, 52428800, null),
  ('justificatifs', 'justificatifs', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "espaces_lecture" on storage.objects;
create policy "espaces_lecture" on storage.objects for select to authenticated
  using (bucket_id = 'espaces' and public.space_role(public.try_uuid((storage.foldername(name))[1])) is not null);
drop policy if exists "espaces_depot" on storage.objects;
create policy "espaces_depot" on storage.objects for insert to authenticated
  with check (bucket_id = 'espaces' and public.space_role(public.try_uuid((storage.foldername(name))[1])) is not null);
drop policy if exists "espaces_suppression" on storage.objects;
create policy "espaces_suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'espaces' and (owner = auth.uid() or public.space_role(public.try_uuid((storage.foldername(name))[1])) = 'responsable'));

drop policy if exists "justificatifs_lecture" on storage.objects;
create policy "justificatifs_lecture" on storage.objects for select to authenticated
  using (bucket_id = 'justificatifs' and public.can_see_student(public.try_uuid((storage.foldername(name))[1])));
drop policy if exists "justificatifs_depot" on storage.objects;
create policy "justificatifs_depot" on storage.objects for insert to authenticated
  with check (bucket_id = 'justificatifs' and (public.is_staff() or exists (
    select 1 from public.parent_students ps where ps.parent_id = auth.uid() and ps.student_id::text = (storage.foldername(name))[1]
  )));

-- ─── 9. Temps réel ───────────────────────────────────────────────────────
do $$ declare t text; begin
  foreach t in array array['space_messages', 'space_posts', 'live_sessions', 'notifications'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null; when undefined_object then null;
    end;
  end loop;
end $$;

-- ─── 10. Salles initiales ────────────────────────────────────────────────
insert into public.spaces (kind, name, program_code, specialty, color) values
  ('ecole', 'CFA · Cuisine', 'CFA', 'Cuisine', '#E30613'),
  ('ecole', 'CFA · Pâtisserie', 'CFA', 'Pâtisserie', '#E30613'),
  ('ecole', 'CAP · Cuisine / Pâtisserie', 'CAP', 'Cuisine / Pâtisserie', '#0C356A'),
  ('ecole', 'CAP · Restaurant / Bar', 'CAP', 'Restaurant / Bar', '#0C356A'),
  ('ecole', 'CAP · Réception / Étages', 'CAP', 'Réception / Étages', '#0C356A'),
  ('ecole', 'CAP · Boucherie / Charcuterie', 'CAP', 'Boucherie / Charcuterie', '#0C356A'),
  ('ecole', 'CAP · Lingerie / Buanderie', 'CAP', 'Lingerie / Buanderie', '#0C356A'),
  ('ecole', 'BEP · Cuisine / Pâtisserie', 'BEP', 'Cuisine / Pâtisserie', '#205185'),
  ('ecole', 'BEP · Restaurant / Bar', 'BEP', 'Restaurant / Bar', '#205185'),
  ('ecole', 'BEP · Réception / Étages', 'BEP', 'Réception / Étages', '#205185'),
  ('ecole', 'BEP · Lingerie / Buanderie', 'BEP', 'Lingerie / Buanderie', '#205185'),
  ('ecole', 'BT · Restauration', 'BT', 'Restauration', '#072042'),
  ('ecole', 'BT · Hébergement', 'BT', 'Hébergement', '#072042'),
  ('ecole', 'BTS · Restauration', 'BTS', 'Restauration', '#B8000F'),
  ('ecole', 'BTS · Hébergement', 'BTS', 'Hébergement', '#B8000F')
on conflict (kind, name) do nothing;

insert into public.spaces (kind, name, service, description, color) values
  ('hotel', 'Réception & hébergement', 'reception', 'Accueil, réservations, check-in / check-out', '#0C356A'),
  ('hotel', 'Restaurant & bar', 'restaurant', 'Salle, bar, service et événements', '#E30613'),
  ('hotel', 'Cuisine de l''hôtel', 'cuisine', 'Brigade, production et hygiène', '#B8000F'),
  ('hotel', 'Étages & lingerie', 'etages', 'Chambres, ménage, lingerie et buanderie', '#205185'),
  ('hotel', 'Direction & administration', 'administration', 'Coordination et consignes générales', '#072042')
on conflict (kind, name) do nothing;
