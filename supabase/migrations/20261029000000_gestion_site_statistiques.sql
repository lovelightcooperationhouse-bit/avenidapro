-- ════════════════════════════════════════════════════════════════════════════
-- 1. Rôle « Gestionnaire du site web » : gère tout le contenu et l'apparence du site public
-- ════════════════════════════════════════════════════════════════════════════
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in (
  'directeur_general', 'directeur_pedagogique', 'comptable', 'ressources_humaines', 'responsable_hotel',
  'gestionnaire_site', 'personnel', 'professeur', 'eleve', 'parent', 'client', 'candidat'));

create or replace function public.can_edit_site()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() in ('directeur_general', 'gestionnaire_site'), false)
$$;

do $$
declare t text;
begin
  foreach t in array array['site_settings', 'site_menu', 'site_pages', 'site_sections', 'site_posts'] loop
    execute format('drop policy if exists dg_write on public.%I', t);
    execute format('create policy dg_write on public.%I for all to authenticated using (public.can_edit_site()) with check (public.can_edit_site())', t);
  end loop;
end $$;
drop policy if exists read_visible on public.site_menu;
create policy read_visible on public.site_menu for select using (visible or public.can_edit_site());
drop policy if exists read_published on public.site_pages;
create policy read_published on public.site_pages for select using (published or public.can_edit_site());
drop policy if exists read_visible on public.site_sections;
create policy read_visible on public.site_sections for select using (visible or public.can_edit_site());
drop policy if exists read_published on public.site_posts;
create policy read_published on public.site_posts for select using (
  (published and published_at <= now() and (audience = 'public' or auth.uid() is not null)) or public.can_edit_site());

drop policy if exists site_dg_write on storage.objects;
create policy site_dg_write on storage.objects for all to authenticated
  using (bucket_id = 'site' and public.can_edit_site()) with check (bucket_id = 'site' and public.can_edit_site());

drop policy if exists site_manager_read on public.newsletter_subscribers;
create policy site_manager_read on public.newsletter_subscribers for select to authenticated using (public.can_edit_site());

insert into public.positions (code, label, department, service, default_role, sort) values
  ('gestionnaire_site', 'Gestionnaire du site web / communication', 'direction', 'Communication', 'gestionnaire_site', 7)
on conflict (code) do update set label = excluded.label, default_role = excluded.default_role, service = excluded.service;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. Statistiques de visite du site public (sans cookie tiers : identifiant anonyme du navigateur)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  path text not null,
  visitor text,
  referrer text,
  device text,
  created_at timestamptz not null default now()
);
create index if not exists site_visits_created_idx on public.site_visits (created_at desc);
alter table public.site_visits enable row level security;
drop policy if exists public_insert on public.site_visits;
create policy public_insert on public.site_visits for insert to anon, authenticated
  with check (length(path) <= 300 and coalesce(length(visitor), 0) <= 64 and coalesce(length(referrer), 0) <= 300 and coalesce(length(device), 0) <= 20);
drop policy if exists site_read on public.site_visits;
create policy site_read on public.site_visits for select to authenticated using (public.can_edit_site());

create or replace function public.site_stats(days int default 30)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := date_trunc('day', now() at time zone 'Africa/Lome') at time zone 'Africa/Lome' - make_interval(days => greatest(days, 1) - 1);
begin
  if not (public.can_edit_site() or public.is_manager()) then raise exception 'Non autorisé' using errcode = '42501'; end if;
  return jsonb_build_object(
    'total_visits', (select count(*) from public.site_visits),
    'total_visitors', (select count(distinct visitor) from public.site_visits),
    'period_visits', (select count(*) from public.site_visits where created_at >= since),
    'period_visitors', (select count(distinct visitor) from public.site_visits where created_at >= since),
    'today_visits', (select count(*) from public.site_visits where (created_at at time zone 'Africa/Lome')::date = (now() at time zone 'Africa/Lome')::date),
    'today_visitors', (select count(distinct visitor) from public.site_visits where (created_at at time zone 'Africa/Lome')::date = (now() at time zone 'Africa/Lome')::date),
    'per_day', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'visits', coalesce(v.visits, 0), 'visitors', coalesce(v.visitors, 0)) order by d.day desc)
        from generate_series((since at time zone 'Africa/Lome')::date, (now() at time zone 'Africa/Lome')::date, interval '1 day') as d(day)
        left join (
          select (created_at at time zone 'Africa/Lome')::date as day, count(*) visits, count(distinct visitor) visitors
            from public.site_visits where created_at >= since group by 1
        ) v on v.day = d.day::date), '[]'::jsonb),
    'top_pages', coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'visits', n) order by n desc)
        from (select path, count(*) n from public.site_visits where created_at >= since group by path order by n desc limit 12) t), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_object_agg(coalesce(device, 'inconnu'), n)
        from (select device, count(*) n from public.site_visits where created_at >= since group by device) t), '{}'::jsonb)
  );
end $$;
revoke execute on function public.site_stats(int) from public, anon;
grant execute on function public.site_stats(int) to authenticated;
