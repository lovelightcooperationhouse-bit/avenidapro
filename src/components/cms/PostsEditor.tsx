"use client";

import { ExternalLink, Loader2, Pencil, Pin, PlusCircle, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { POST_KINDS, slugify, type CmsPost } from "@/lib/cms-types";
import { pingNotifications } from "@/lib/notify";
import { ROLE_CONFIG, type RoleType } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MediaPicker, Toggle, input, label, publishSite } from "./shared";

type Draft = Omit<CmsPost, "id"> & { id?: string };
const empty = (): Draft => ({
  slug: "",
  kind: "article",
  title: "",
  excerpt: "",
  body: "",
  cover: null,
  media: [],
  video_url: "",
  audience: "public",
  published: true,
  pinned: false,
  published_at: new Date().toISOString(),
});

/** Publications du site : articles, annonces, événements, albums photo et vidéos, avec envoi aux membres concernés. */
export function PostsEditor() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CmsPost[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notify, setNotify] = useState({ on: false, audience: "tous", target: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await createClient().from("site_posts").select("*").order("published_at", { ascending: false });
    setPosts((data ?? []) as CmsPost[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!draft || !user) return;
    if (!draft.title.trim()) return setMsg({ ok: false, text: "Le titre est obligatoire." });
    setBusy(true);
    setMsg(null);
    const row = { ...draft, slug: draft.slug || slugify(draft.title) || `publication-${Date.now()}`, video_url: draft.video_url || null, author_id: user.id, updated_at: new Date().toISOString() };
    const supabase = createClient();
    const { data, error } = draft.id ? await supabase.from("site_posts").update(row).eq("id", draft.id).select().single() : await supabase.from("site_posts").insert(row).select().single();
    if (error) {
      setBusy(false);
      return setMsg({ ok: false, text: error.message.includes("slug") ? "Cette adresse existe déjà : changez le titre ou l'adresse." : error.message });
    }
    let sent = 0;
    if (notify.on && row.published) {
      const link = row.audience === "public" ? `/actualites/${data.slug}` : `/espace/annonces#${data.slug}`;
      const res = await supabase.rpc("send_alert", {
        p_audience: notify.audience,
        p_target: notify.audience === "tous" ? null : notify.target,
        p_title: row.title,
        p_body: row.excerpt || null,
        p_link: link,
        p_priority: row.kind === "annonce" ? "important" : "info",
        p_email: true,
        p_sms: false,
      });
      sent = (res.data as number) ?? 0;
      pingNotifications();
    }
    await publishSite();
    setBusy(false);
    setMsg({ ok: true, text: `Publication enregistrée${row.published ? " et en ligne" : " (brouillon)"}${sent ? `, ${sent} membre(s) prévenu(s)` : ""}.` });
    setDraft(null);
    setNotify({ on: false, audience: "tous", target: "" });
    load();
  };

  const remove = async (p: CmsPost) => {
    if (!window.confirm(`Supprimer « ${p.title} » ?`)) return;
    await createClient().from("site_posts").delete().eq("id", p.id);
    await publishSite();
    load();
  };

  if (draft)
    return (
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-black text-[#0C356A]">{draft.id ? "Modifier la publication" : "Nouvelle publication"}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={cn(label, "sm:col-span-2")}>
            Titre
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} className={input} />
          </label>
          <label className={label}>
            Type
            <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as CmsPost["kind"] })} className={input}>
              {POST_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={label}>
          Résumé (affiché dans les listes et lors du partage)
          <textarea value={draft.excerpt ?? ""} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} rows={2} maxLength={300} className={input} />
        </label>
        <label className={label}>
          Texte complet — ligne vide = nouveau paragraphe, « ## » = intertitre, « - » = liste, **gras**, les liens sont cliquables
          <textarea value={draft.body ?? ""} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={10} className={cn(input, "font-mono text-[13px]")} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <div className={label}>
            Image principale
            <MediaPicker folder="publications" value={draft.cover ? [{ url: draft.cover }] : []} onChange={(m) => setDraft({ ...draft, cover: m[0]?.url ?? null })} hint="Format paysage conseillé (1600 × 1000 px)." />
          </div>
          <div className={label}>
            Galerie photos
            <MediaPicker folder="publications" multiple value={draft.media} onChange={(m) => setDraft({ ...draft, media: m })} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={label}>
            Vidéo (lien YouTube, Vimeo, Facebook ou fichier)
            <input value={draft.video_url ?? ""} onChange={(e) => setDraft({ ...draft, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" className={input} />
          </label>
          <div className={label}>
            ou téléverser une vidéo (mp4, 50 Mo max)
            <MediaPicker folder="videos" accept="video/*" value={draft.video_url && /supabase/.test(draft.video_url) ? [{ url: draft.video_url }] : []} onChange={(m) => setDraft({ ...draft, video_url: m[0]?.url ?? "" })} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={label}>
            Visible par
            <select value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value as CmsPost["audience"] })} className={input}>
              <option value="public">Tout le monde (site public)</option>
              <option value="membres">Membres connectés seulement</option>
            </select>
          </label>
          <label className={label}>
            Date de publication
            <input type="datetime-local" value={draft.published_at.slice(0, 16)} onChange={(e) => setDraft({ ...draft, published_at: new Date(e.target.value).toISOString() })} className={input} />
          </label>
          <label className={label}>
            Adresse
            <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} className={input} />
          </label>
        </div>
        <div className="flex flex-wrap gap-5">
          <Toggle checked={draft.published} onChange={(v) => setDraft({ ...draft, published: v })}>
            Publié
          </Toggle>
          <Toggle checked={draft.pinned} onChange={(v) => setDraft({ ...draft, pinned: v })}>
            À la une
          </Toggle>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4">
          <Toggle checked={notify.on} onChange={(v) => setNotify({ ...notify, on: v })}>
            Prévenir les membres concernés (espace + e-mail)
          </Toggle>
          {notify.on && (
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={notify.audience} onChange={(e) => setNotify({ ...notify, audience: e.target.value, target: e.target.value === "role" ? "parent" : "" })} aria-label="Destinataires" className={input}>
                <option value="tous">Tout l&apos;établissement</option>
                <option value="role">Un rôle</option>
                <option value="filiere">Une filière (code : CFA, CAP…)</option>
                <option value="classe">Une classe</option>
              </select>
              {notify.audience === "role" ? (
                <select value={notify.target} onChange={(e) => setNotify({ ...notify, target: e.target.value })} aria-label="Rôle" className={input}>
                  {(Object.keys(ROLE_CONFIG) as RoleType[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_CONFIG[r].label}
                    </option>
                  ))}
                </select>
              ) : (
                notify.audience !== "tous" && <input value={notify.target} onChange={(e) => setNotify({ ...notify, target: e.target.value })} placeholder={notify.audience === "filiere" ? "CAP" : "Nom exact de la classe"} aria-label="Cible" className={input} />
              )}
            </div>
          )}
        </div>
        {msg && <p className={cn("rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#DC2626]")}>{msg.text}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
            {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />} Enregistrer
          </button>
          <button type="button" onClick={() => setDraft(null)} className="rounded-full px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">
            Annuler
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {msg && <p className={cn("rounded-xl p-3 text-sm font-semibold", msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-[#DC2626]")}>{msg.text}</p>}
      <button type="button" onClick={() => setDraft(empty())} className="inline-flex items-center gap-2 self-start rounded-full bg-[#E30613] px-5 py-2.5 text-sm font-bold text-white">
        <PlusCircle aria-hidden className="size-4" /> Nouvelle publication
      </button>
      {posts === null ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin" />
      ) : posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Aucune publication. Créez la première : elle apparaîtra dans « Actualités » et pourra être partagée sur les réseaux.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              {p.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- aperçu
                <img src={p.cover} alt="" className="h-12 w-16 rounded-lg object-cover" />
              ) : (
                <span className="h-12 w-16 rounded-lg bg-slate-100" />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-bold text-slate-800">
                  {p.pinned && <Pin aria-label="À la une" className="size-3.5 text-[#E30613]" />}
                  {p.title}
                </span>
                <span className="text-xs text-slate-500">
                  {POST_KINDS.find((k) => k.value === p.kind)?.label} · {new Date(p.published_at).toLocaleDateString("fr-FR")} · {p.audience === "public" ? "Public" : "Membres"} ·{" "}
                  {p.published ? "En ligne" : "Brouillon"}
                </span>
              </span>
              {p.published && p.audience === "public" && (
                <a href={`/actualites/${p.slug}`} target="_blank" rel="noopener noreferrer" aria-label="Voir sur le site" className="rounded-full p-2 text-[#0C356A] hover:bg-slate-100">
                  <ExternalLink aria-hidden className="size-4" />
                </a>
              )}
              <button type="button" onClick={() => setDraft({ ...p, excerpt: p.excerpt ?? "", body: p.body ?? "", video_url: p.video_url ?? "" })} aria-label={`Modifier ${p.title}`} className="rounded-full p-2 text-[#0C356A] hover:bg-slate-100">
                <Pencil aria-hidden className="size-4" />
              </button>
              <button type="button" onClick={() => remove(p)} aria-label={`Supprimer ${p.title}`} className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-[#DC2626]">
                <Trash2 aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
