import { createClient } from "@supabase/supabase-js";
import type { CmsMenuItem, CmsPage, CmsPost, CmsSection, CmsSettings } from "./cms-types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xlugccxuittetcayjsxc.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_HwIkJ3XqvKdiuXx8T3J_fg_2fhtfSu7";

/** Lecture publique du contenu, mise en cache 60 s et invalidée à chaque modification (étiquette « cms »). */
const db = () =>
  createClient(URL, KEY, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 60, tags: ["cms"] } }) },
  });

export async function getMenu(): Promise<CmsMenuItem[]> {
  const { data } = await db().from("site_menu").select("*").eq("visible", true).order("position");
  return (data ?? []) as CmsMenuItem[];
}

export async function getSettings(): Promise<CmsSettings> {
  const { data } = await db().from("site_settings").select("key, value");
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as CmsSettings;
}

export async function getSections(page: string): Promise<CmsSection[]> {
  const { data } = await db().from("site_sections").select("*").eq("page", page).eq("visible", true).order("position");
  return (data ?? []) as CmsSection[];
}

export async function getPosts(limit = 24): Promise<CmsPost[]> {
  const { data } = await db()
    .from("site_posts")
    .select("*")
    .eq("published", true)
    .eq("audience", "public")
    .lte("published_at", new Date().toISOString())
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as CmsPost[];
}

export async function getPost(slug: string): Promise<CmsPost | null> {
  const { data } = await db().from("site_posts").select("*").eq("slug", slug).eq("published", true).eq("audience", "public").maybeSingle();
  return data as CmsPost | null;
}

export async function getPage(slug: string): Promise<CmsPage | null> {
  const { data } = await db().from("site_pages").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  return data as CmsPage | null;
}

export async function getPages(): Promise<CmsPage[]> {
  const { data } = await db().from("site_pages").select("*").eq("published", true);
  return (data ?? []) as CmsPage[];
}

export type PublicStaff = { full_name: string; function_title: string | null; subjects: string | null; position: number };

/** Équipe affichée sur le site (noms, fonctions, matières ; jamais les téléphones). */
export async function getPublicStaff(): Promise<PublicStaff[]> {
  const { data } = await db().rpc("public_staff_directory");
  return (data ?? []) as PublicStaff[];
}
