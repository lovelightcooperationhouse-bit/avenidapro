-- ════════════════════════════════════════════════════════════════════════════
-- Discussions (style WhatsApp) : conversations privées et groupes de travail,
-- messages texte / photo / vocal / vidéo / fichier, appels audio et vidéo, réunions.
-- Qui peut écrire à qui : la règle de my_contacts() (familles ↔ professeurs de leurs classes,
-- tout le monde ↔ administration, le personnel ↔ tout le monde).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct', 'groupe')),
  title text,
  description text,
  avatar text,
  direct_key text unique,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_message text
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'membre' check (role in ('admin', 'membre')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  muted boolean not null default false,
  primary key (conversation_id, profile_id)
);
create index if not exists conversation_members_profile_idx on public.conversation_members (profile_id);

create table if not exists public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'text' check (kind in ('text', 'image', 'audio', 'video', 'file', 'call', 'meeting', 'system')),
  body text,
  attachment jsonb,
  reply_to uuid references public.conversation_messages(id) on delete set null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index if not exists conversation_messages_conv_idx on public.conversation_messages (conversation_id, created_at desc);

create or replace function public.is_conversation_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_members where conversation_id = cid and profile_id = auth.uid())
$$;
create or replace function public.is_conversation_admin(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conversation_members where conversation_id = cid and profile_id = auth.uid() and role = 'admin')
$$;
-- Contact autorisé : présent dans my_contacts() de l'utilisateur courant
create or replace function public.can_contact(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.my_contacts() c where c.id = pid)
$$;

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.conversation_messages enable row level security;

drop policy if exists member_select on public.conversations;
create policy member_select on public.conversations for select to authenticated using (public.is_conversation_member(id));
drop policy if exists admin_update on public.conversations;
create policy admin_update on public.conversations for update to authenticated using (public.is_conversation_admin(id)) with check (public.is_conversation_admin(id));

drop policy if exists member_select on public.conversation_members;
create policy member_select on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists own_update on public.conversation_members;
create policy own_update on public.conversation_members for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists admin_insert on public.conversation_members;
create policy admin_insert on public.conversation_members for insert to authenticated
  with check (public.is_conversation_admin(conversation_id) and public.can_contact(profile_id));
drop policy if exists admin_or_self_delete on public.conversation_members;
create policy admin_or_self_delete on public.conversation_members for delete to authenticated
  using (profile_id = auth.uid() or public.is_conversation_admin(conversation_id));

drop policy if exists member_select on public.conversation_messages;
create policy member_select on public.conversation_messages for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists member_insert on public.conversation_messages;
create policy member_insert on public.conversation_messages for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id) and kind <> 'system');
drop policy if exists own_update on public.conversation_messages;
create policy own_update on public.conversation_messages for update to authenticated using (sender_id = auth.uid()) with check (sender_id = auth.uid());

-- Dernier message affiché dans la liste des discussions
create or replace function public.on_conversation_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.conversations
     set last_message_at = new.created_at,
         last_message = case new.kind
           when 'text' then left(new.body, 120) when 'image' then '📷 Photo' when 'audio' then '🎤 Message vocal'
           when 'video' then '🎬 Vidéo' when 'file' then '📎 ' || coalesce(new.attachment->>'name', 'Fichier')
           when 'call' then case when new.attachment->>'video' = 'true' then '📹 Appel vidéo' else '📞 Appel audio' end
           when 'meeting' then '🗓️ Réunion' else left(new.body, 120) end
   where id = new.conversation_id;
  update public.conversation_members set last_read_at = new.created_at where conversation_id = new.conversation_id and profile_id = new.sender_id;
  return new;
end $$;
drop trigger if exists conversation_message_after on public.conversation_messages;
create trigger conversation_message_after after insert on public.conversation_messages for each row execute function public.on_conversation_message();

-- Ouvre (ou crée) la discussion privée avec un contact autorisé
create or replace function public.start_direct(other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  k text := least(auth.uid()::text, other::text) || ':' || greatest(auth.uid()::text, other::text);
  cid uuid;
begin
  if auth.uid() is null or other = auth.uid() then raise exception 'Destinataire invalide'; end if;
  if not public.can_contact(other) then raise exception 'Vous ne pouvez pas écrire à cette personne' using errcode = '42501'; end if;
  select id into cid from public.conversations where direct_key = k;
  if cid is null then
    insert into public.conversations (kind, direct_key, created_by) values ('direct', k, auth.uid()) returning id into cid;
    insert into public.conversation_members (conversation_id, profile_id, role) values (cid, auth.uid(), 'admin'), (cid, other, 'admin');
  end if;
  return cid;
end $$;

-- Crée un groupe de travail avec ses membres (contacts autorisés uniquement)
create or replace function public.create_group(p_title text, p_description text, p_members uuid[])
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid; m uuid; n int := 0;
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  if public.app_role() in ('candidat', 'client') then raise exception 'Création de groupe non autorisée' using errcode = '42501'; end if;
  if coalesce(trim(p_title), '') = '' then raise exception 'Nom du groupe obligatoire'; end if;
  insert into public.conversations (kind, title, description, created_by) values ('groupe', trim(p_title), nullif(trim(p_description), ''), auth.uid()) returning id into cid;
  insert into public.conversation_members (conversation_id, profile_id, role) values (cid, auth.uid(), 'admin');
  foreach m in array coalesce(p_members, '{}') loop
    if m <> auth.uid() and public.can_contact(m) then
      insert into public.conversation_members (conversation_id, profile_id) values (cid, m) on conflict do nothing;
      n := n + 1;
    end if;
  end loop;
  insert into public.conversation_messages (conversation_id, sender_id, kind, body)
  values (cid, auth.uid(), 'system', 'Groupe « ' || trim(p_title) || ' » créé avec ' || n || ' membre(s).');
  return cid;
end $$;

-- Ajout de membres à un groupe (administrateur du groupe)
create or replace function public.add_group_members(cid uuid, p_members uuid[])
returns int language plpgsql security definer set search_path = public as $$
declare m uuid; n int := 0;
begin
  if not public.is_conversation_admin(cid) then raise exception 'Réservé aux administrateurs du groupe' using errcode = '42501'; end if;
  foreach m in array coalesce(p_members, '{}') loop
    if public.can_contact(m) then
      insert into public.conversation_members (conversation_id, profile_id) values (cid, m) on conflict do nothing;
      n := n + 1;
    end if;
  end loop;
  if n > 0 then
    insert into public.conversation_messages (conversation_id, sender_id, kind, body) values (cid, auth.uid(), 'system', n || ' membre(s) ajouté(s).');
  end if;
  return n;
end $$;

revoke execute on function public.start_direct(uuid) from public, anon;
revoke execute on function public.create_group(text, text, uuid[]) from public, anon;
revoke execute on function public.add_group_members(uuid, uuid[]) from public, anon;
grant execute on function public.start_direct(uuid) to authenticated;
grant execute on function public.create_group(text, text, uuid[]) to authenticated;
grant execute on function public.add_group_members(uuid, uuid[]) to authenticated;

-- Pièces jointes des discussions : visibles des seuls membres de la conversation
insert into storage.buckets (id, name, public, file_size_limit)
values ('discussions', 'discussions', false, 52428800)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;
drop policy if exists discussions_members on storage.objects;
create policy discussions_members on storage.objects for all to authenticated
  using (bucket_id = 'discussions' and public.is_conversation_member(public.try_uuid((storage.foldername(name))[1])))
  with check (bucket_id = 'discussions' and public.is_conversation_member(public.try_uuid((storage.foldername(name))[1])));

-- ════════════════════════════════════════════════════════════════════════════
-- Réunions internes (visioconférence) : planifiées ou immédiates, avec participants
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  room text not null unique,
  starts_at timestamptz not null default now(),
  duration_min int not null default 60,
  host_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  status text not null default 'prevue' check (status in ('prevue', 'en_cours', 'terminee', 'annulee')),
  created_at timestamptz not null default now()
);
create table if not exists public.meeting_participants (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  response text not null default 'invite' check (response in ('invite', 'accepte', 'decline')),
  primary key (meeting_id, profile_id)
);

create or replace function public.is_meeting_participant(mid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.meetings m where m.id = mid and m.host_id = auth.uid())
      or exists (select 1 from public.meeting_participants p where p.meeting_id = mid and p.profile_id = auth.uid())
      or exists (select 1 from public.meetings m where m.id = mid and m.conversation_id is not null and public.is_conversation_member(m.conversation_id))
$$;

alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
drop policy if exists participant_select on public.meetings;
create policy participant_select on public.meetings for select to authenticated using (public.is_meeting_participant(id) or public.is_director());
drop policy if exists host_insert on public.meetings;
create policy host_insert on public.meetings for insert to authenticated
  with check (host_id = auth.uid() and public.app_role() not in ('candidat', 'client', 'eleve', 'parent'));
drop policy if exists host_update on public.meetings;
create policy host_update on public.meetings for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());
drop policy if exists host_delete on public.meetings;
create policy host_delete on public.meetings for delete to authenticated using (host_id = auth.uid());
drop policy if exists participant_select on public.meeting_participants;
create policy participant_select on public.meeting_participants for select to authenticated using (public.is_meeting_participant(meeting_id));
drop policy if exists host_manage on public.meeting_participants;
create policy host_manage on public.meeting_participants for all to authenticated
  using (exists (select 1 from public.meetings m where m.id = meeting_id and m.host_id = auth.uid()))
  with check (exists (select 1 from public.meetings m where m.id = meeting_id and m.host_id = auth.uid()));
drop policy if exists own_response on public.meeting_participants;
create policy own_response on public.meeting_participants for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Invitation : notification (espace + e-mail) à chaque participant ajouté
create or replace function public.on_meeting_invite()
returns trigger language plpgsql security definer set search_path = public as $$
declare m public.meetings; host text;
begin
  select * into m from public.meetings where id = new.meeting_id;
  select coalesce(first_name || ' ' || last_name, email) into host from public.profiles where id = m.host_id;
  insert into public.notifications (profile_id, kind, title, body, link, sms_status)
  values (new.profile_id, 'reunion', 'Invitation : ' || m.title,
          'Réunion organisée par ' || coalesce(host, 'la direction') || ' le ' || to_char(m.starts_at at time zone 'Africa/Lome', 'DD/MM/YYYY à HH24"h"MI') || '.',
          '/reunions?id=' || m.id, 'skipped');
  return new;
end $$;
drop trigger if exists meeting_invite on public.meeting_participants;
create trigger meeting_invite after insert on public.meeting_participants for each row execute function public.on_meeting_invite();

-- Temps réel : nouveaux messages, appels, réunions
do $$
begin
  begin alter publication supabase_realtime add table public.conversation_messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.conversation_members; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.meetings; exception when duplicate_object then null; end;
end $$;

-- Liste des discussions de l'utilisateur : interlocuteur, dernier message, non lus
create or replace function public.my_conversations()
returns table (id uuid, kind text, title text, avatar text, last_message text, last_message_at timestamptz, unread int, members int,
               other_id uuid, other_name text, other_role text, other_avatar text, my_role text, muted boolean)
language sql stable security definer set search_path = public as $$
  select c.id, c.kind, c.title, c.avatar, c.last_message, c.last_message_at,
         (select count(*)::int from public.conversation_messages m
           where m.conversation_id = c.id and m.created_at > me.last_read_at and m.sender_id is distinct from auth.uid()),
         (select count(*)::int from public.conversation_members x where x.conversation_id = c.id),
         o.id, coalesce(nullif(trim(coalesce(o.first_name, '') || ' ' || coalesce(o.last_name, '')), ''), o.email), o.role, o.avatar_url,
         me.role, me.muted
    from public.conversation_members me
    join public.conversations c on c.id = me.conversation_id
    left join lateral (
      select p.* from public.conversation_members om join public.profiles p on p.id = om.profile_id
       where c.kind = 'direct' and om.conversation_id = c.id and om.profile_id <> auth.uid() limit 1
    ) o on true
   where me.profile_id = auth.uid()
   order by c.last_message_at desc
$$;
revoke execute on function public.my_conversations() from public, anon;
grant execute on function public.my_conversations() to authenticated;

-- Annuaire des membres d'une conversation (noms et photos)
create or replace function public.conversation_people(cid uuid)
returns table (id uuid, full_name text, role text, avatar text, member_role text, last_read_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), p.email), p.role, p.avatar_url, m.role, m.last_read_at
    from public.conversation_members m join public.profiles p on p.id = m.profile_id
   where m.conversation_id = cid and public.is_conversation_member(cid)
   order by m.role, p.last_name
$$;
revoke execute on function public.conversation_people(uuid) from public, anon;
grant execute on function public.conversation_people(uuid) to authenticated;
