"use client";

import { CalendarClock, Pin, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { POST_TYPES, timeAgo, type Person, type SpacePost } from "@/lib/spaces";
import { cn } from "@/lib/utils";
import { AttachmentView } from "./AttachmentView";

/** Fil de publications de la salle (épinglées en premier). */
export function PostFeed({
  posts,
  people,
  canManage,
  currentUserId,
  empty,
  onChanged,
  footer,
}: {
  posts: SpacePost[];
  people: Record<string, Person>;
  canManage: boolean;
  currentUserId: string;
  empty: string;
  onChanged: () => void;
  footer?: (post: SpacePost) => React.ReactNode;
}) {
  if (!posts.length) return <p className="rounded-3xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-900/5">{empty}</p>;

  const sorted = [...posts].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at));

  const remove = async (post: SpacePost) => {
    if (!window.confirm(`Supprimer « ${post.title} » ?`)) return;
    const supabase = createClient();
    if (post.attachments.length) await supabase.storage.from("espaces").remove(post.attachments.map((a) => a.path));
    await supabase.from("space_posts").delete().eq("id", post.id);
    onChanged();
  };

  return (
    <ul className="flex flex-col gap-4">
      {sorted.map((p) => {
        const author = people[p.author_id];
        const overdue = p.due_at && new Date(p.due_at) < new Date();
        return (
          <li key={p.id} className={cn("rounded-3xl bg-white p-5 shadow-sm ring-1 sm:p-6", p.pinned ? "ring-vif/40" : "ring-slate-900/5")}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold ring-1", POST_TYPES[p.type].tone)}>{POST_TYPES[p.type].label}</span>
                {p.pinned && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-vif">
                    <Pin aria-hidden className="size-3.5" /> Épinglé
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {author?.full_name ?? "Responsable"} · {timeAgo(p.created_at)}
                </span>
              </div>
              {(canManage || p.author_id === currentUserId) && (
                <button type="button" onClick={() => remove(p)} aria-label={`Supprimer ${p.title}`} className="text-slate-400 hover:text-vif">
                  <Trash2 aria-hidden className="size-4" />
                </button>
              )}
            </div>
            <h3 className="mt-3 font-display text-xl font-bold text-avenida-blue-950">{p.title}</h3>
            {p.due_at && (
              <p className={cn("mt-1 inline-flex items-center gap-1.5 text-sm font-bold", overdue ? "text-slate-500" : "text-vif")}>
                <CalendarClock aria-hidden className="size-4" />
                {overdue ? "Date limite dépassée : " : "À rendre avant le "}
                {new Date(p.due_at).toLocaleString("fr-FR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            {p.body && <p className="mt-3 leading-relaxed whitespace-pre-wrap text-slate-700">{p.body}</p>}
            {p.attachments.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {p.attachments.map((a) => (
                  <AttachmentView key={a.path} file={a} compact />
                ))}
              </div>
            )}
            {footer?.(p)}
          </li>
        );
      })}
    </ul>
  );
}
