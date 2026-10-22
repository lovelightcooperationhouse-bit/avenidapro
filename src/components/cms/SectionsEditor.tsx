"use client";

import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, FilePlus2, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { BUILTIN_PAGES, slugify, type CmsPage, type CmsSection } from "@/lib/cms-types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MediaPicker, Toggle, input, label, publishSite } from "./shared";

const KINDS: { value: CmsSection["kind"]; label: string; help: string }[] = [
  { value: "texte", label: "Texte", help: "Titre et paragraphes" },
  { value: "image", label: "Image + texte", help: "Une photo à côté du texte" },
  { value: "video", label: "Vidéo", help: "YouTube, Vimeo, Facebook ou fichier" },
  { value: "galerie", label: "Galerie photos", help: "Plusieurs photos en mosaïque" },
  { value: "publications", label: "Dernières actualités", help: "Les 6 dernières publications" },
  { value: "appel", label: "Appel à l'action", help: "Message + bouton" },
];
const TONES: { value: CmsSection["tone"]; label: string }[] = [
  { value: "clair", label: "Fond blanc" },
  { value: "gris", label: "Fond gris clair" },
  { value: "sombre", label: "Fond bleu nuit" },
  { value: "vif", label: "Fond rouge Avenida" },
];

type Draft = Omit<CmsSection, "id"> & { id?: string };

/** Pages du site et sections ajoutées : texte, images, vidéos, galeries, actualités, appels à l'action. */
export function SectionsEditor() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [page, setPage] = useState("accueil");
  const [sections, setSections] = useState<CmsSection[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pageDraft, setPageDraft] = useState<(Partial<CmsPage> & { addToMenu?: boolean }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadPages = useCallback(async () => {
    const { data } = await createClient().from("site_pages").select("*").order("created_at");
    setPages((data ?? []) as CmsPage[]);
  }, []);
  const loadSections = useCallback(async () => {
    setSections(null);
    const { data } = await createClient().from("site_sections").select("*").eq("page", page).order("position");
    setSections((data ?? []) as CmsSection[]);
  }, [page]);
  useEffect(() => {
    loadPages();
  }, [loadPages]);
  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const builtin = BUILTIN_PAGES.find((p) => p.key === page);
  const custom = pages.find((p) => p.slug === page);
  const href = builtin?.href ?? `/pages/${page}`;

  const saveSection = async () => {
    if (!draft) return;
    setBusy(true);
    const row = { ...draft, updated_at: new Date().toISOString() };
    const supabase = createClient();
    const { error } = draft.id ? await supabase.from("site_sections").update(row).eq("id", draft.id) : await supabase.from("site_sections").insert(row);
    await publishSite();
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message });
    setMsg({ ok: true, text: "Section enregistrée et en ligne." });
    setDraft(null);
    loadSections();
  };

  const move = async (s: CmsSection, dir: -1 | 1) => {
    if (!sections) return;
    const list = [...sections];
    const i = list.findIndex((x) => x.id === s.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const supabase = createClient();
    await Promise.all(list.map((x, k) => supabase.from("site_sections").update({ position: k }).eq("id", x.id)));
    await publishSite();
    loadSections();
  };

  const toggle = async (s: CmsSection) => {
    await createClient().from("site_sections").update({ visible: !s.visible }).eq("id", s.id);
    await publishSite();
    loadSections();
  };

  const remove = async (s: CmsSection) => {
    if (!window.confirm("Supprimer cette section ?")) return;
    await createClient().from("site_sections").delete().eq("id", s.id);
    await publishSite();
    loadSections();
  };

  const savePage = async () => {
    if (!pageDraft?.title?.trim()) return setMsg({ ok: false, text: "Le titre de la page est obligatoire." });
    setBusy(true);
    const { addToMenu, ...p } = pageDraft;
    const slug = p.slug || slugify(p.title!);
    const supabase = createClient();
    const row = { slug, title: p.title!.trim(), eyebrow: p.eyebrow || null, description: p.description || null, header_image: p.header_image || null, published: p.published ?? true, updated_at: new Date().toISOString() };
    const { error } = p.id ? await supabase.from("site_pages").update(row).eq("id", p.id) : await supabase.from("site_pages").insert(row);
    if (!error && addToMenu && !p.id) {
      const { count } = await supabase.from("site_menu").select("id", { count: "exact", head: true }).is("parent_id", null);
      await supabase.from("site_menu").insert({ label: row.title, href: `/pages/${slug}`, position: count ?? 99 });
    }
    await publishSite();
    setBusy(false);
    if (error) return setMsg({ ok: false, text: error.message.includes("slug") ? "Cette adresse est déjà prise." : error.message });
    setMsg({ ok: true, text: `Page « ${row.title} » enregistrée : ${window.location.origin}/pages/${slug}` });
    setPageDraft(null);
    await loadPages();
    setPage(slug);
  };

  const deletePage = async () => {
    if (!custom || !window.confirm(`Supprimer la page « ${custom.title} » et ses sections ?`)) return;
    const supabase = createClient();
    await supabase.from("site_sections").delete().eq("page", custom.slug);
    await supabase.from("site_menu").delete().eq("href", `/pages/${custom.slug}`);
    await supabase.from("site_pages").delete().eq("id", custom.id);
    await publishSite();
    setPage("accueil");
    loadPages();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className={label}>
          Page
          <select value={page} onChange={(e) => setPage(e.target.value)} className={cn(input, "w-64")}>
            <optgroup label="Pages du site">
              {BUILTIN_PAGES.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </optgroup>
            {pages.length > 0 && (
              <optgroup label="Pages créées">
                {pages.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                    {p.published ? "" : " (brouillon)"}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200">
          <ExternalLink aria-hidden className="size-4" /> Voir la page
        </a>
        {custom && (
          <>
            <button type="button" onClick={() => setPageDraft(custom)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200">
              <Pencil aria-hidden className="size-4" /> En-tête de la page
            </button>
            <button type="button" onClick={deletePage} className="rounded-full px-4 py-2 text-sm font-bold text-[#DC2626] ring-1 ring-red-200">
              Supprimer la page
            </button>
          </>
        )}
        <button type="button" onClick={() => setPageDraft({ title: "", published: true, addToMenu: true })} className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#0C356A] px-5 py-2.5 text-sm font-bold text-white">
          <FilePlus2 aria-hidden className="size-4" /> Créer une page
        </button>
      </div>

      {msg && <p className={cn("rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#DC2626]")}>{msg.text}</p>}

      {pageDraft && (
        <div className="flex flex-col gap-3 rounded-3xl border-2 border-[#0C356A]/20 bg-white p-5">
          <h3 className="font-black text-[#0C356A]">{pageDraft.id ? "En-tête de la page" : "Nouvelle page"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>
              Titre
              <input value={pageDraft.title ?? ""} onChange={(e) => setPageDraft({ ...pageDraft, title: e.target.value, slug: pageDraft.id ? pageDraft.slug : slugify(e.target.value) })} className={input} />
            </label>
            <label className={label}>
              Sur-titre
              <input value={pageDraft.eyebrow ?? ""} onChange={(e) => setPageDraft({ ...pageDraft, eyebrow: e.target.value })} className={input} />
            </label>
            <label className={cn(label, "sm:col-span-2")}>
              Introduction
              <textarea value={pageDraft.description ?? ""} onChange={(e) => setPageDraft({ ...pageDraft, description: e.target.value })} rows={2} className={input} />
            </label>
            <label className={label}>
              Adresse : /pages/…
              <input value={pageDraft.slug ?? ""} disabled={!!pageDraft.id} onChange={(e) => setPageDraft({ ...pageDraft, slug: slugify(e.target.value) })} className={input} />
            </label>
            <div className={label}>
              Image d&apos;en-tête
              <MediaPicker folder="pages" value={pageDraft.header_image ? [{ url: pageDraft.header_image }] : []} onChange={(m) => setPageDraft({ ...pageDraft, header_image: m[0]?.url ?? null })} />
            </div>
          </div>
          <div className="flex flex-wrap gap-5">
            <Toggle checked={pageDraft.published ?? true} onChange={(v) => setPageDraft({ ...pageDraft, published: v })}>
              Publiée
            </Toggle>
            {!pageDraft.id && (
              <Toggle checked={!!pageDraft.addToMenu} onChange={(v) => setPageDraft({ ...pageDraft, addToMenu: v })}>
                Ajouter au menu principal
              </Toggle>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={savePage} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2 text-sm font-bold text-white">
              <Save aria-hidden className="size-4" /> Enregistrer la page
            </button>
            <button type="button" onClick={() => setPageDraft(null)} className="rounded-full px-4 py-2 text-sm font-bold text-slate-600">
              Annuler
            </button>
          </div>
        </div>
      )}

      <p className="text-sm text-slate-600">
        Les sections s&apos;affichent {builtin ? "à la suite du contenu existant de la page" : "sous l'en-tête de la page"}, dans cet ordre.
      </p>

      {sections === null ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
      ) : (
        <ul className="flex flex-col gap-2">
          {sections.map((s) => (
            <li key={s.id} className={cn("flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3", !s.visible && "opacity-60")}>
              {s.media[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu
                <img src={s.media[0].url} alt="" className="h-12 w-16 rounded-lg object-cover" />
              ) : (
                <span className="flex h-12 w-16 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">{KINDS.find((k) => k.value === s.kind)?.label}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-slate-800">{s.title || KINDS.find((k) => k.value === s.kind)?.label}</span>
                <span className="text-xs text-slate-500">
                  {KINDS.find((k) => k.value === s.kind)?.label} · {TONES.find((t) => t.value === s.tone)?.label}
                </span>
              </span>
              <button type="button" onClick={() => move(s, -1)} aria-label="Monter" className="rounded-full p-1.5 hover:bg-slate-100">
                <ArrowUp aria-hidden className="size-4" />
              </button>
              <button type="button" onClick={() => move(s, 1)} aria-label="Descendre" className="rounded-full p-1.5 hover:bg-slate-100">
                <ArrowDown aria-hidden className="size-4" />
              </button>
              <button type="button" onClick={() => toggle(s)} aria-label={s.visible ? "Masquer" : "Afficher"} className="rounded-full p-1.5 hover:bg-slate-100">
                {s.visible ? <Eye aria-hidden className="size-4" /> : <EyeOff aria-hidden className="size-4" />}
              </button>
              <button type="button" onClick={() => setDraft(s)} aria-label="Modifier" className="rounded-full p-1.5 text-[#0C356A] hover:bg-slate-100">
                <Pencil aria-hidden className="size-4" />
              </button>
              <button type="button" onClick={() => remove(s)} aria-label="Supprimer" className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-[#DC2626]">
                <Trash2 aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!draft && (
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k.value}
              type="button"
              title={k.help}
              onClick={() => setDraft({ page, position: sections?.length ?? 0, kind: k.value, eyebrow: "", title: "", body: "", media: [], video_url: "", button_label: "", button_href: "", tone: "clair", visible: true })}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200 hover:ring-[#0C356A]"
            >
              <Plus aria-hidden className="size-4" /> {k.label}
            </button>
          ))}
        </div>
      )}

      {draft && (
        <div className="flex flex-col gap-3 rounded-3xl border-2 border-[#E30613]/30 bg-white p-5">
          <h3 className="font-black text-[#0C356A]">Section « {KINDS.find((k) => k.value === draft.kind)?.label} »</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={label}>
              Sur-titre
              <input value={draft.eyebrow ?? ""} onChange={(e) => setDraft({ ...draft, eyebrow: e.target.value })} className={input} />
            </label>
            <label className={cn(label, "sm:col-span-2")}>
              Titre
              <input value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className={input} />
            </label>
          </div>
          {draft.kind !== "publications" && (
            <label className={label}>
              Texte — ligne vide = paragraphe, « ## » = intertitre, « - » = liste, **gras**
              <textarea value={draft.body ?? ""} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={6} className={cn(input, "font-mono text-[13px]")} />
            </label>
          )}
          {(draft.kind === "image" || draft.kind === "galerie") && (
            <div className={label}>
              {draft.kind === "image" ? "Image" : "Photos de la galerie"}
              <MediaPicker folder="sections" multiple={draft.kind === "galerie"} value={draft.media} onChange={(m) => setDraft({ ...draft, media: m })} />
            </div>
          )}
          {draft.kind === "video" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={label}>
                Lien de la vidéo
                <input value={draft.video_url ?? ""} onChange={(e) => setDraft({ ...draft, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" className={input} />
              </label>
              <div className={label}>
                ou téléverser (mp4)
                <MediaPicker folder="videos" accept="video/*" value={draft.video_url && /supabase/.test(draft.video_url) ? [{ url: draft.video_url }] : []} onChange={(m) => setDraft({ ...draft, video_url: m[0]?.url ?? "" })} />
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={label}>
              Texte du bouton
              <input value={draft.button_label ?? ""} onChange={(e) => setDraft({ ...draft, button_label: e.target.value })} placeholder="En savoir plus" className={input} />
            </label>
            <label className={label}>
              Lien du bouton
              <input value={draft.button_href ?? ""} onChange={(e) => setDraft({ ...draft, button_href: e.target.value })} placeholder="/preinscription" className={input} />
            </label>
            <label className={label}>
              Fond
              <select value={draft.tone} onChange={(e) => setDraft({ ...draft, tone: e.target.value as CmsSection["tone"] })} className={input}>
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={saveSection} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">
              {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} Enregistrer la section
            </button>
            <button type="button" onClick={() => setDraft(null)} className="rounded-full px-4 py-2 text-sm font-bold text-slate-600">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
