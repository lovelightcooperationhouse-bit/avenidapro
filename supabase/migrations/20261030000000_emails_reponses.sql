-- Historique des e-mails envoyés par l'administration (réponses aux demandes, décisions, documents)
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sent_by uuid references public.profiles(id) on delete set null,
  recipients text[] not null,
  subject text not null,
  body text,
  attachments jsonb not null default '[]'::jsonb,
  context_type text,
  context_id text,
  status text not null default 'envoye' check (status in ('envoye', 'echec', 'non_configure')),
  error text
);
create index if not exists email_logs_context_idx on public.email_logs (context_type, context_id, created_at desc);
alter table public.email_logs enable row level security;
drop policy if exists managers_read on public.email_logs;
create policy managers_read on public.email_logs for select to authenticated
  using (public.is_staff() or public.can_edit_site());
