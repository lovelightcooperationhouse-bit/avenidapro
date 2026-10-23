import { createClient } from "@/lib/supabase/client";

/**
 * Boîte d'envoi hors connexion : l'appel des classes et la saisie des notes faits sans réseau
 * sont gardés sur l'appareil, puis envoyés automatiquement au retour de la connexion.
 * (Les encaissements et les inscriptions demandent le réseau : numéros de reçu et matricules uniques.)
 */
export type QueuedOp = {
  id: string;
  label: string;
  table: "student_attendance" | "grades";
  kind: "upsert" | "delete";
  rows?: Record<string, unknown>[];
  onConflict?: string;
  match?: Record<string, string | number>;
  /** Classe à recalculer après l'envoi des notes (bulletins). */
  recalc?: { cls: string; semester: number; year: string };
  createdAt: string;
};

const KEY = "avenida_outbox";
export const OUTBOX_EVENT = "avenida-outbox";

export function pendingOps(): QueuedOp[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as QueuedOp[];
  } catch {
    return [];
  }
}

function store(ops: QueuedOp[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ops));
  } catch {
    // Stockage plein ou indisponible : rien de plus à faire
  }
  window.dispatchEvent(new Event(OUTBOX_EVENT));
}

export function enqueue(op: Omit<QueuedOp, "id" | "createdAt">) {
  store([...pendingOps(), { ...op, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
}

/** Vrai si l'erreur vient d'une absence de réseau (et non d'un refus de la base). */
export const isNetworkError = (e: unknown) => {
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e ?? "");
  return (typeof navigator !== "undefined" && !navigator.onLine) || /fetch|network|réseau|Load failed/i.test(msg);
};

let flushing = false;

/** Envoie tout ce qui attend sur l'appareil ; s'arrête à la première erreur réseau. */
export async function flushOutbox(): Promise<{ sent: number; left: number }> {
  if (flushing || typeof navigator === "undefined" || !navigator.onLine) return { sent: 0, left: pendingOps().length };
  flushing = true;
  const supabase = createClient();
  let sent = 0;
  const recalcs = new Map<string, QueuedOp["recalc"]>();
  try {
    for (const op of pendingOps()) {
      const q = supabase.from(op.table);
      let error: { message: string } | null = null;
      if (op.kind === "upsert" && op.rows?.length) ({ error } = await q.upsert(op.rows, { onConflict: op.onConflict }));
      else if (op.kind === "delete" && op.match) {
        let d = q.delete();
        for (const [k, v] of Object.entries(op.match)) d = d.eq(k, v);
        ({ error } = await d);
      }
      if (error && isNetworkError(error)) break;
      // Opération envoyée (ou refusée définitivement par la base) : retirée de la boîte d'envoi
      store(pendingOps().filter((x) => x.id !== op.id));
      if (!error) sent += 1;
      if (op.recalc) recalcs.set(`${op.recalc.cls}|${op.recalc.semester}|${op.recalc.year}`, op.recalc);
    }
    // Bulletins des classes dont les notes viennent d'arriver
    if (recalcs.size) {
      const { recalcClass } = await import("@/lib/bulletins-sync");
      for (const r of recalcs.values()) if (r) await recalcClass(r.cls, r.semester, r.year).catch(() => undefined);
    }
    if (sent) {
      const { pingNotifications } = await import("@/lib/notify");
      pingNotifications();
    }
  } finally {
    flushing = false;
  }
  return { sent, left: pendingOps().length };
}
