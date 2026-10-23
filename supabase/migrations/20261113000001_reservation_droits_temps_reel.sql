-- Photos des chambres : l'hôtel peut déposer ses images dans le dossier « chambres » du stockage du site.
drop policy if exists site_hotel_rooms on storage.objects;
create policy site_hotel_rooms on storage.objects for all to authenticated
  using (bucket_id = 'site' and (storage.foldername(name))[1] = 'chambres' and public.app_role() in ('directeur_general', 'responsable_hotel'))
  with check (bucket_id = 'site' and (storage.foldername(name))[1] = 'chambres' and public.app_role() in ('directeur_general', 'responsable_hotel'));

-- Réservations visibles en temps réel par la réception
do $$ begin
  alter publication supabase_realtime add table public.reservations;
exception when duplicate_object then null; end $$;
