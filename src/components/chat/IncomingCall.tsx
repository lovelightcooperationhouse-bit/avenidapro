"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { ChatMessage } from "@/lib/chat";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "./Avatar";

type Ring = { message: ChatMessage; name: string; avatar: string | null; group: boolean; title: string | null };

/** Sonnerie d'appel entrant, partout sur la plateforme (espace et gestion). */
export function IncomingCall() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ring, setRing] = useState<Ring | null>(null);
  const audio = useRef<{ ctx: AudioContext; stop: () => void } | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`appels-entrants-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_messages", filter: "kind=eq.call" }, async ({ new: m }) => {
        const msg = m as ChatMessage;
        if (msg.sender_id === user.id || Date.now() - new Date(msg.created_at).getTime() > 60_000) return;
        const [{ data: people }, { data: conv }] = await Promise.all([
          supabase.rpc("conversation_people", { cid: msg.conversation_id }),
          supabase.from("conversations").select("kind, title").eq("id", msg.conversation_id).maybeSingle(),
        ]);
        const caller = (people as { id: string; full_name: string; avatar: string | null }[] | null)?.find((p) => p.id === msg.sender_id);
        setRing({ message: msg, name: caller?.full_name ?? "Appel", avatar: caller?.avatar ?? null, group: conv?.kind === "groupe", title: conv?.title ?? null });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  // Sonnerie (deux bips, toutes les 2 s) et arrêt automatique après 45 s
  useEffect(() => {
    if (!ring) return;
    try {
      const ctx = new AudioContext();
      let stopped = false;
      const beep = () => {
        if (stopped) return;
        [0, 0.35].forEach((t) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = 880;
          g.gain.setValueAtTime(0.15, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
          o.connect(g).connect(ctx.destination);
          o.start(ctx.currentTime + t);
          o.stop(ctx.currentTime + t + 0.3);
        });
      };
      beep();
      const id = window.setInterval(beep, 2000);
      audio.current = { ctx, stop: () => ((stopped = true), window.clearInterval(id), ctx.close()) };
    } catch {
      /* son indisponible */
    }
    navigator.vibrate?.([400, 200, 400, 200, 400]);
    const t = window.setTimeout(() => setRing(null), 45_000);
    return () => {
      window.clearTimeout(t);
      audio.current?.stop();
      audio.current = null;
    };
  }, [ring]);

  if (!ring) return null;
  const a = ring.message.attachment ?? {};

  const decline = async () => {
    const supabase = createClient();
    const ch = supabase.channel(`appel-${a.call_id}`, { config: { broadcast: { self: false } } });
    ch.subscribe((s) => {
      if (s === "SUBSCRIBED") {
        ch.send({ type: "broadcast", event: "signal", payload: { type: "decline" } });
        setTimeout(() => supabase.removeChannel(ch), 500);
      }
    });
    setRing(null);
  };

  const accept = () => {
    setRing(null);
    const q = new URLSearchParams({ c: ring.message.conversation_id, appel: a.call_id ?? "", video: a.video ? "1" : "0" });
    if (a.room) q.set("salle", a.room);
    router.push(`/discussions?${q.toString()}`);
    if (pathname === "/discussions") router.refresh();
  };

  return (
    <div role="alertdialog" aria-label={`Appel de ${ring.name}`} className="fixed inset-x-3 top-3 z-[110] mx-auto flex max-w-md items-center gap-4 rounded-3xl bg-[#06152E] p-4 text-white shadow-2xl ring-1 ring-white/10">
      <Avatar name={ring.name} src={ring.avatar} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{ring.group ? ring.title : ring.name}</p>
        <p className="text-xs text-white/70">
          {a.video ? "Appel vidéo" : "Appel audio"} entrant{ring.group ? ` · ${ring.name}` : ""}
        </p>
      </div>
      <button type="button" onClick={decline} aria-label="Refuser" className="flex size-12 items-center justify-center rounded-full bg-[#E30613]">
        <PhoneOff aria-hidden className="size-5" />
      </button>
      <button type="button" onClick={accept} aria-label="Répondre" className="flex size-12 animate-pulse items-center justify-center rounded-full bg-emerald-500">
        {a.video ? <Video aria-hidden className="size-5" /> : <Phone aria-hidden className="size-5" />}
      </button>
    </div>
  );
}
