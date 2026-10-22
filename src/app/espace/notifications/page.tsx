"use client";

import { Bell, BellRing, CalendarCheck, CheckCheck, CreditCard, FileCheck2, IdCard, Info } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PushToggle } from "@/components/pwa/PushToggle";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/spaces";
import { cn } from "@/lib/utils";

type Notification = { id: string; kind: string; title: string; body: string | null; link: string | null; created_at: string; read_at: string | null };

const icons: Record<string, typeof Bell> = { presence: CalendarCheck, paiement: CreditCard, permission: FileCheck2, carte: IdCard, info: Info, alerte: BellRing };

/** Historique des notifications (présences, paiements, permissions, carte…). */
export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await createClient().from("notifications").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(100);
    setItems((data ?? []) as Notification[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const markAll = async () => {
    if (!user) return;
    await createClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("profile_id", user.id).is("read_at", null);
    load();
  };

  const markOne = async (n: Notification) => {
    if (!n.read_at) await createClient().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-avenida-blue-950">Notifications</h1>
          <p className="mt-1 text-slate-600">Annonces de l&apos;administration, présences, retards, permissions, paiements et cartes : tout ce qui concerne votre dossier.</p>
          <PushToggle className="mt-3" />
        </div>
        <button type="button" onClick={markAll} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-avenida-blue ring-1 ring-slate-200 hover:ring-vif">
          <CheckCheck aria-hidden className="size-4" /> Tout marquer comme lu
        </button>
      </div>
      {!items ? (
        <div className="h-40 animate-pulse rounded-3xl bg-white" />
      ) : items.length === 0 ? (
        <p className="rounded-3xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-900/5">Aucune notification pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((n) => {
            const Icon = icons[n.kind] ?? Bell;
            const content = (
              <>
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", n.read_at ? "bg-slate-100 text-slate-500" : "bg-vif text-white")}>
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block font-bold", n.read_at ? "text-slate-700" : "text-avenida-blue-950")}>{n.title}</span>
                  {n.body && <span className="mt-0.5 block text-sm text-slate-600">{n.body}</span>}
                  <span className="mt-1 block text-xs text-slate-400">{timeAgo(n.created_at)}</span>
                </span>
                {!n.read_at && <span aria-label="Non lue" className="mt-2 size-2.5 shrink-0 rounded-full bg-vif" />}
              </>
            );
            const cls = cn("flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 transition-colors", n.read_at ? "ring-slate-900/5" : "ring-vif/30");
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} onClick={() => markOne(n)} className={cn(cls, "hover:ring-vif")}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" onClick={() => markOne(n).then(load)} className={cn(cls, "w-full text-left")}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
