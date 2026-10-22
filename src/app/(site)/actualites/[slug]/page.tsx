import { ArrowLeft, CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostGrid, VideoEmbed, postKindLabel } from "@/components/site/CmsBlocks";
import { RichText } from "@/components/site/RichText";
import { Container, Section } from "@/components/site/Section";
import { ShareButtons } from "@/components/site/ShareButtons";
import { getPost, getPosts } from "@/lib/cms";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: "Publication introuvable" };
  const image = post.cover ?? post.media[0]?.url;
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    // Aperçu riche lors du partage (Facebook, WhatsApp, X, LinkedIn…)
    openGraph: { title: post.title, description: post.excerpt ?? undefined, type: "article", images: image ? [image] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title: post.title, description: post.excerpt ?? undefined, images: image ? [image] : undefined },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const others = (await getPosts(4)).filter((p) => p.id !== post.id).slice(0, 3);
  const gallery = post.media.filter((m) => m.url !== post.cover);

  return (
    <>
      <header className="relative isolate overflow-hidden bg-nuit text-white">
        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element -- image téléversée par l'administration
          <img src={post.cover} alt="" className="absolute inset-0 -z-20 size-full object-cover opacity-45" />
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-nuit via-nuit/70 to-nuit/30" />
        <Container className="flex min-h-[22rem] flex-col justify-end gap-4 py-14 sm:min-h-[28rem]">
          <Link href="/actualites" className="inline-flex items-center gap-1.5 text-sm font-bold text-white/80 hover:text-white">
            <ArrowLeft aria-hidden className="size-4" /> Toutes les actualités
          </Link>
          <p className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-vif px-3 py-1 font-bold">{postKindLabel(post.kind)}</span>
            <span className="flex items-center gap-1.5 text-white/80">
              <CalendarDays aria-hidden className="size-4" />
              {new Date(post.published_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </p>
          <h1 className="max-w-4xl font-display text-3xl leading-tight font-extrabold sm:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="max-w-3xl text-lg text-white/85">{post.excerpt}</p>}
        </Container>
      </header>

      <Section width="narrow">
        <div className="flex flex-col gap-8">
          <ShareButtons title={post.title} path={`/actualites/${post.slug}`} />
          {post.video_url && <VideoEmbed url={post.video_url} title={post.title} />}
          <RichText text={post.body} className="text-lg" />
          {gallery.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.map((m, i) => (
                <li key={m.url + i}>
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element -- image téléversée par l'administration */}
                    <img src={m.url} alt={m.alt ?? ""} loading="lazy" className="aspect-square w-full object-cover transition-transform hover:scale-105" />
                  </a>
                  {m.caption && <p className="mt-1 text-xs text-slate-500">{m.caption}</p>}
                </li>
              ))}
            </ul>
          )}
          <ShareButtons title={post.title} path={`/actualites/${post.slug}`} className="border-t border-slate-200 pt-6" />
        </div>
      </Section>

      {others.length > 0 && (
        <Section tone="muted">
          <h2 className="mb-8 font-display text-2xl font-extrabold text-avenida-blue-950">À lire aussi</h2>
          <PostGrid posts={others} />
        </Section>
      )}
    </>
  );
}
