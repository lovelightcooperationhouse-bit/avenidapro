"use client";

import { BellOff, BellRing, Loader2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { pushSubscribed, pushSupported, subscribePush, unsubscribePush } from "@/lib/push-client";
import { cn } from "@/lib/utils";

const DISMISS = "avenida-push-plus-tard";

/** Bouton « Notifications sur cet appareil » (page Notifications, guide). */
export function PushToggle({ className }: { className?: string }) {
  const { user } = useAuth();
  const [on, setOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    pushSubscribed().then(setOn);
  }, []);

  if (!user || on === null) return null;
  if (!pushSupported()) return <p className={cn("text-sm text-slate-500", className)}>Notifications push : installez l&apos;application (sur iPhone) ou utilisez Chrome, Edge ou Firefox.</p>;

  const toggle = async () => {
    setBusy(true);
    setMsg("");
    if (on) {
      await unsubscribePush();
      setOn(false);
    } else {
      const r = await subscribePush(user.id);
      setOn(r.ok);
      if (!r.ok) setMsg(r.reason ?? "");
    }
    setBusy(false);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <button type="button" onClick={toggle} disabled={busy} className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold", on ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-[#E30613] text-white")}>
        {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : on ? <BellRing aria-hidden className="size-4" /> : <BellOff aria-hidden className="size-4" />}
        {on ? "Notifications activées sur cet appareil" : "Activer les notifications sur cet appareil"}
      </button>
      {msg && <span className="text-sm font-semibold text-amber-700">{msg}</span>}
    </div>
  );
}

/** Invitation discrète, une fois connecté : recevoir appels et notifications même site fermé. */
export function PushPrompt() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !pushSupported() || Notification.permission !== "default") return;
    let later = 0;
    try {
      later = Number(localStorage.getItem(DISMISS) ?? 0);
    } catch {
      /* stockage indisponible */
    }
    if (later > Date.now()) return;
    pushSubscribed().then((s) => !s && setTimeout(() => setShow(true), 5000));
  }, [user, pathname]);

  if (!show || !user) return null;
  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS, String(Date.now() + 3 * 86_400_000));
    } catch {
      /* stockage indisponible */
    }
  };

  return (
    <div role="dialog" aria-label="Activer les notifications" className="fixed inset-x-3 top-3 z-[95] mx-auto flex max-w-md items-start gap-3 rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-900/10">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#E30613] text-white">
        <BellRing aria-hidden className="size-5" />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold text-[#0C356A]">Ne manquez rien</p>
        <p className="text-slate-600">Recevez appels, messages, absences, paiements et décisions même quand le site est fermé.</p>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await subscribePush(user.id);
            setBusy(false);
            setShow(false);
          }}
          className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#E30613] px-4 py-2 font-bold text-white"
        >
          {busy && <Loader2 aria-hidden className="size-4 animate-spin" />} Activer
        </button>
      </div>
      <button type="button" onClick={dismiss} aria-label="Plus tard" className="rounded-full p-1 text-slate-400 hover:bg-slate-100">
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}
