-- Fiches du personnel (RH) créées à partir de l'annuaire : matricule unique, poste, téléphone.
-- Contrats, salaires et dates d'embauche restent à compléter par les RH (rien n'est inventé).
alter table public.staff_directory add column if not exists employee_id uuid references public.employees(id) on delete set null;

create or replace function public.create_employees_from_directory()
returns int language plpgsql security definer set search_path = public as $$
declare
  d public.staff_directory;
  parts text[];
  last text;
  first text;
  sec text;
  mat text;
  eid uuid;
  n int := 0;
begin
  if public.app_role() not in ('directeur_general', 'ressources_humaines') then
    raise exception 'Réservé au Directeur général et aux ressources humaines' using errcode = '42501';
  end if;
  for d in select * from public.staff_directory where employee_id is null order by position loop
    -- Nom en capitales = nom de famille ; le reste = prénoms
    parts := regexp_split_to_array(trim(d.full_name), '\s+');
    select string_agg(p, ' ') into last from unnest(parts) p where p = upper(p) and p ~ '[A-ZÀ-Ý]';
    select string_agg(p, ' ') into first from unnest(parts) p where not (p = upper(p) and p ~ '[A-ZÀ-Ý]');
    last := coalesce(last, d.full_name);
    sec := case when d.function_title in ('Directeur d''exploitation', 'Directeur commercial') then 'hotel' else 'ecole' end;
    mat := public.next_matricule(case when sec = 'hotel' then 'HOT' else 'ENS' end);
    insert into public.employees (matricule, first_name, last_name, position, role_title, department, sector, specialty, contract_type, base_salary, hire_date, phone, status, raw_data)
    values (mat, coalesce(first, ''), last,
            coalesce(d.function_title, 'Professeur'),
            coalesce(d.function_title, 'Professeur'),
            case when d.function_title is not null then 'Administration' else 'Enseignement' end,
            sec, d.subjects, 'À compléter', 0, current_date,
            nullif(trim(split_part(coalesce(d.phones, ''), '/', 1)), ''), 'actif',
            jsonb_build_object('source', 'annuaire', 'a_completer', 'contrat, salaire et date d''embauche'))
    returning id into eid;
    update public.staff_directory set employee_id = eid where id = d.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.create_employees_from_directory() from public, anon;
grant execute on function public.create_employees_from_directory() to authenticated;
