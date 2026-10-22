import { ArrowRight, CalendarDays, Megaphone } from "lucide-react";
import Link from "next/link";
import { getPosts, getSections } from "@/lib/cms";
import { POST_KINDS, embedUrl, type CmsPost, type CmsSection } from "@/lib/cms-types";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./ButtonLink";
import { RichText } from "./RichText";
import { Section } from "./Section";
import { SectionTitle } from "./SectionTitle";

const tones: Record<CmsSection["tone"], { tone: "default" | "muted" | "night"; extra?: string; inverted: boolean }> = {
  clair: { tone: "default", inverted: false },
  gris: { tone: "muted", inverted: false },
  sombre: { tone: "night", inverted: true },
  vif: { tone: "default", extra: "bg-vif text-white", inverted: true },
};

/** Vidéo YouTube / Vimeo / Facebook intégrée, ou fichier vidéo hébergé. */
export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const embed = embedUrl(url);
  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-xl">
      {embed ? (
        <iframe src={embed} title={title} className="absolute inset-0 size-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
      ) : (
        <video src={url} controls preload="metadata" className="absolute inset-0 size-full" />
      )}
    </div>
  );
}

/** Sections ajoutées par la direction à une page (texte, image, vidéo, galerie, publications, appel à l'action). */
export async function CmsSections({ page }: { page: string }) {
  const sections = await getSections(page);
  if (!sections.length) return null;
  const needsPosts = sections.some((s) => s.kind === "publications");
  const posts = needsPosts ? await getPosts(6) : [];
  return (
    <>
      {sections.map((s) => (
        <CmsSectionView key={s.id} s={s} posts={posts} />
      ))}
    </>
  );
}

function CmsSectionView({ s, posts }: { s: CmsSection; posts: CmsPost[] }) {
  const t = tones[s.tone];
  const title = s.title ? <SectionTitle eyebrow={s.eyebrow ?? undefined} title={s.title} inverted={t.inverted} /> : null;
  const button = s.button_label && s.button_href && (
    <ButtonLink href={s.button_href} variant={t.inverted ? "white" : "red"} size="lg" className="self-start">
      {s.button_label} <ArrowRight aria-hidden />
    </ButtonLink>
  );
  const img = s.media[0];

  return (
    <Section tone={t.tone} className={t.extra}>
      {s.kind === "texte" && (
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {title}
          <RichText text={s.body} inverted={t.inverted} className="text-lg" />
          {button}
        </div>
      )}

      {s.kind === "image" && (
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {img && (
            // eslint-disable-next-line @next/next/no-img-element -- image téléversée par l'administration
            <img src={img.url} alt={img.alt ?? s.title ?? ""} loading="lazy" className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-2xl" />
          )}
          <div className="flex flex-col gap-6">
            {title}
            <RichText text={s.body} inverted={t.inverted} className="text-lg" />
            {button}
          </div>
        </div>
      )}

      {s.kind === "video" && (
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          {title}
          {s.video_url && <VideoEmbed url={s.video_url} title={s.title ?? "Vidéo"} />}
          <RichText text={s.body} inverted={t.inverted} />
          {button}
        </div>
      )}

      {s.kind === "galerie" && (
        <div className="flex flex-col gap-8">
          {title}
          <RichText text={s.body} inverted={t.inverted} className="max-w-3xl" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {s.media.map((m, i) => (
              <li key={m.url + i} className={cn("overflow-hidden rounded-2xl", i === 0 && "col-span-2 row-span-2")}>
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="group block h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element -- image téléversée par l'administration */}
                  <img src={m.url} alt={m.alt ?? m.caption ?? ""} loading="lazy" className="aspect-square size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </a>
              </li>
            ))}
          </ul>
          {button}
        </div>
      )}

      {s.kind === "publications" && (
        <div className="flex flex-col gap-8">
          {title ?? <SectionTitle eyebrow="Actualités" title="Les dernières nouvelles d'Avenida" inverted={t.inverted} />}
          <PostGrid posts={posts} />
          <ButtonLink href="/actualites" variant={t.inverted ? "glass" : "outline"} className="self-start">
            Toutes les actualités <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
      )}

      {s.kind === "appel" && (
        <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] lg:flex-row lg:items-center">
          <div className="flex max-w-2xl flex-col gap-3">
            {title}
            <RichText text={s.body} inverted={t.inverted} />
          </div>
          {button}
        </div>
      )}
    </Section>
  );
}

export const postKindLabel = (k: string) => POST_KINDS.find((x) => x.value === k)?.label ?? k;

export function PostGrid({ posts }: { posts: CmsPost[] }) {
  if (!posts.length) return <p className="text-slate-500">Aucune publication pour le moment.</p>;
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <li key={p.id}>
          <Link href={`/actualites/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5 transition-shadow hover:shadow-xl">
            <div className="relative aspect-[16/10] overflow-hidden bg-nuit">
              {p.cover || p.media[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- image téléversée par l'administration
                <img src={p.cover ?? p.media[0].url} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
              ) : (
                <span className="bg-avenida-pattern flex size-full items-center justify-center opacity-40">
                  <Megaphone aria-hidden className="size-10 text-white" />
                </span>
              )}
              <span className="absolute top-3 left-3 rounded-full bg-vif px-3 py-1 text-xs font-bold text-white">{postKindLabel(p.kind)}</span>
              {p.pinned && <span className="absolute top-3 right-3 rounded-full bg-or px-3 py-1 text-xs font-bold text-nuit">À la une</span>}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <CalendarDays aria-hidden className="size-3.5" />
                {new Date(p.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h3 className="font-display text-lg leading-snug font-extrabold text-avenida-blue-950 group-hover:text-vif">{p.title}</h3>
              {p.excerpt && <p className="line-clamp-3 text-sm text-slate-600">{p.excerpt}</p>}
              <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-bold text-vif">
                Lire <ArrowRight aria-hidden className="size-4" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
