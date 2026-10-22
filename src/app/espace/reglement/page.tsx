"use client";

import { CheckCircle2, Loader2, ScrollText, Signature } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DocumentToolbar } from "@/components/cards/DocumentToolbar";
import { ReglementDocument, type ReglementIdentity, type ReglementSignature } from "@/components/documents/ReglementDocument";
import { REGLEMENT_VERSION } from "@/content/reglement";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Kid = { id: string; name: string; identity: ReglementIdentity };

/** Règlement intérieur : lecture, téléchargement (PDF, image), impression et signature de l'engagement en ligne. */
export default function MonReglementPage() {
  const { user } = useAuth();
  const [kids, setKids] = useState<Kid[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [signs, setSigns] = useState<{ student_id: string; signer_role: "eleve" | "parent"; signer_name: string; accepted_at: string; profile_id: string }[]>([]);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const signerRole: "eleve" | "parent" | null = user?.role === "eleve" ? "eleve" : user?.role === "parent" ? "parent" : null;

  const load = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    let ids: string[] = [];
    if (user.role === "eleve" && user.studentId) ids = [user.studentId];
    else if (user.role === "parent") ids = ((await supabase.from("parent_students").select("student_id").eq("parent_id", user.id)).data ?? []).map((r) => r.student_id as string);
    const [{ data: st }, { data: acc }] = await Promise.all([
      ids.length ? supabase.from("students").select("id, first_name, last_name, class_name, program_code, academic_year, phone, tutor_name, tutor_phone").in("id", ids) : Promise.resolve({ data: [] }),
      ids.length ? supabase.from("reglement_acceptances").select("student_id, signer_role, signer_name, accepted_at, profile_id").in("student_id", ids).eq("version", REGLEMENT_VERSION) : Promise.resolve({ data: [] }),
    ]);
    const list: Kid[] = (st ?? []).map((s) => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      identity: { student: `${String(s.last_name).toUpperCase()} ${s.first_name}`, className: [s.class_name, s.program_code].filter(Boolean).join(" · "), phone: s.phone ?? "", guardian: s.tutor_name ?? "", guardianPhone: s.tutor_phone ?? "", year: s.academic_year ?? "" },
    }));
    setKids(list);
    setActive((a) => a ?? list[0]?.id ?? null);
    setSigns((acc ?? []) as typeof signs);
  }, [user]);
  useEffect(() => {
    load();
  }, [load]);

  if (!user) return null;
  const kid = kids?.find((k) => k.id === active);
  const kidSigns = signs.filter((s) => s.student_id === active);
  const mine = kidSigns.find((s) => s.profile_id === user.id);
  const signatures: ReglementSignature[] = kidSigns.map((s) => ({ name: s.signer_name, role: s.signer_role, date: new Date(s.accepted_at).toLocaleDateString("fr-FR") }));

  const sign = async () => {
    if (!active || !signerRole) return;
    setBusy(true);
    setError("");
    const { error: e } = await createClient().from("reglement_acceptances").insert({ student_id: active, profile_id: user.id, signer_role: signerRole, signer_name: user.fullName, version: REGLEMENT_VERSION });
    setBusy(false);
    if (e) return setError(e.message);
    setAgree(false);
    load();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="mx-auto w-full max-w-[210mm]">
        <p className="flex items-center gap-2 text-sm font-bold tracking-widest text-vif uppercase">
          <ScrollText aria-hidden className="size-4" /> Règlement intérieur
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-avenida-blue">Règles de vie, de travail et de discipline</h1>
        <p className="mt-1 text-sm text-slate-600">Lisez le règlement, téléchargez-le ou imprimez-le, puis signez votre engagement en ligne : la Direction en est informée.</p>
      </div>

      {kids && kids.length > 1 && (
        <div className="mx-auto flex w-full max-w-[210mm] flex-wrap gap-2">
          {kids.map((k) => (
            <button key={k.id} type="button" onClick={() => setActive(k.id)} className={cn("rounded-full px-4 py-2 text-sm font-bold", active === k.id ? "bg-vif text-white" : "bg-white text-avenida-blue ring-1 ring-slate-200")}>
              {k.name}
            </button>
          ))}
        </div>
      )}

      {signerRole && kid && (
        <section className="mx-auto w-full max-w-[210mm] rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5 print:hidden">
          {mine ? (
            <p className="flex items-center gap-2 font-semibold text-emerald-700">
              <CheckCircle2 aria-hidden className="size-5" /> Vous avez signé l&apos;engagement le {new Date(mine.accepted_at).toLocaleDateString("fr-FR")} ({signerRole === "eleve" ? "apprenant" : `parent de ${kid.name}`}).
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="font-bold text-avenida-blue">Signer mon engagement</p>
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-5 accent-[#E30613]" />
                {signerRole === "eleve"
                  ? "Je soussigné(e), apprenant(e), reconnais avoir pris connaissance du présent règlement et m'engage à le respecter."
                  : `Je soussigné(e), parent ou tuteur de ${kid.name}, reconnais avoir pris connaissance du présent règlement et m'engage à accompagner l'apprenant dans son respect.`}
              </label>
              {error && <p className="text-sm font-semibold text-vif">{error}</p>}
              <button type="button" onClick={sign} disabled={!agree || busy} className="inline-flex items-center gap-2 self-start rounded-full bg-vif px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Signature aria-hidden className="size-4" />} Signer en tant que {user.fullName}
              </button>
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Signatures : apprenant {kidSigns.some((s) => s.signer_role === "eleve") ? "✓" : "en attente"} · parent / tuteur {kidSigns.some((s) => s.signer_role === "parent") ? "✓" : "en attente"}
          </p>
        </section>
      )}

      <div className="-mx-4 sm:mx-0">
        <DocumentToolbar elementId="avenida-reglement" fileName={`Reglement-interieur-Avenida-${REGLEMENT_VERSION}`} />
        <ReglementDocument identity={kid?.identity} signatures={signatures} />
      </div>
    </div>
  );
}
