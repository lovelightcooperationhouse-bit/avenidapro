-- Notifications push (VAPID) : appareils abonnés de chaque membre
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists push_subscriptions_profile_idx on public.push_subscriptions (profile_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists own_all on public.push_subscriptions;
create policy own_all on public.push_subscriptions for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Chaque notification part aussi en push (en plus de l'espace, de l'e-mail et du SMS)
alter table public.notifications add column if not exists push_status text not null default 'pending';
alter table public.notifications drop constraint if exists notifications_push_status_check;
alter table public.notifications add constraint notifications_push_status_check check (push_status in ('pending', 'sent', 'skipped', 'failed'));
update public.notifications set push_status = 'skipped' where created_at < now() - interval '1 hour';
