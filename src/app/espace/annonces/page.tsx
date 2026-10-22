"use client";

import { CalendarDays, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { RichText } from "@/components/site/RichText";
import { POST_KINDS, embedUrl, type CmsPost } from "@/lib/cms-types";
import { createClient } from "@/lib/supabase/client";

/** Annonces et publications de l'établissement, y compris celles réservées aux membres. */
export default function AnnoncesPage() {
  const [posts, setPosts] = useState<CmsPost[] | null>(null);

  useEffect(() => {
    createClient()
      .from("site_posts")
      .select("*")
      .eq("published", true)
      .lte("published_at", new Date().toISOString())
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(40)
      .then(({ data }) => setPosts((data ?? []) as CmsPost[]));
  }, []);

  useEffect(() => {
    if (posts?.length && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [posts]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold tracking-widest text-vif uppercase">
          <Megaphone aria-hidden className="size-4" /> Annonces
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-avenida-blue">Annonces de l&apos;établissement</h1>
      </div>
      {posts === null ? null : posts.length === 0 ? (
        <p className="rounded-3xl bg-white p-6 text-slate-500 ring-1 ring-slate-900/5">Aucune annonce pour le moment.</p>
      ) : (
        posts.map((p) => {
          const embed = p.video_url ? embedUrl(p.video_url) : null;
          return (
            <article key={p.id} id={p.slug} className="scroll-mt-40 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5">
              {p.cover && (
                // eslint-disable-next-line @next/next/no-img-element -- image téléversée par l'administration
                <img src={p.cover} alt="" className="aspect-[16/7] w-full object-cover" />
              )}
              <div className="flex flex-col gap-3 p-6">
                <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="rounded-full bg-vif px-2.5 py-0.5 font-bold text-white">{POST_KINDS.find((k) => k.value === p.kind)?.label}</span>
                  {p.audience === "membres" && <span className="rounded-full bg-avenida-blue-50 px-2.5 py-0.5 font-bold text-avenida-blue">Réservé aux membres</span>}
                  <CalendarDays aria-hidden className="size-3.5" />
                  {new Date(p.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <h2 className="font-display text-2xl font-extrabold text-avenida-blue-950">{p.title}</h2>
                {p.excerpt && <p className="font-semibold text-slate-700">{p.excerpt}</p>}
                {p.video_url &&
                  (embed ? (
                    <iframe src={embed} title={p.title} className="aspect-video w-full rounded-2xl" allowFullScreen loading="lazy" />
                  ) : (
                    <video src={p.video_url} controls className="w-full rounded-2xl" />
                  ))}
                <RichText text={p.body} />
                {p.media.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {p.media.map((m, i) => (
                      // eslint-disable-next-line @next/next/no-img-element -- image téléversée par l'administration
                      <img key={m.url + i} src={m.url} alt={m.alt ?? ""} className="aspect-square w-full rounded-xl object-cover" />
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
