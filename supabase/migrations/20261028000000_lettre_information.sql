-- Lettre d'information : inscription publique (e-mail), consultation et export par la direction
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  interests text[] not null default '{}',
  source text default 'site',
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);
create unique index if not exists newsletter_email_key on public.newsletter_subscribers (lower(email));
alter table public.newsletter_subscribers enable row level security;
drop policy if exists public_insert on public.newsletter_subscribers;
create policy public_insert on public.newsletter_subscribers for insert to anon, authenticated
  with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and unsubscribed_at is null);
drop policy if exists managers_read on public.newsletter_subscribers;
create policy managers_read on public.newsletter_subscribers for select to authenticated using (public.is_manager());
drop policy if exists dg_manage on public.newsletter_subscribers;
create policy dg_manage on public.newsletter_subscribers for all to authenticated using (public.is_director()) with check (public.is_director());
