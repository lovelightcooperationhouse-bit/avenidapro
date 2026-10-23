"use client";

import { ArrowRight, ClipboardList, Download, FileUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { APPLICATION_STATUS, DOC_LABELS, fmtDateTime, type Application, type ApplicationDocument } from "@/lib/admissions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const STEPS = ["Reçue", "Étude", "Décision", "Inscription"];

/** Suivi des pré-inscriptions du candidat : statut, pièces déposées, ajout de pièces. */
export function CandidateApplications() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[] | null>(null);
  const [docs, setDocs] = useState<ApplicationDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
    setApps((data ?? []) as Application[]);
    if (data?.length) {
      const { data: d } = await supabase.from("application_documents").select("*").in("application_id", data.map((a) => a.id)).order("created_at");
      setDocs((d ?? []) as ApplicationDocument[]);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const upload = async (app: Application, type: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) return setMessage("Fichier trop lourd (10 Mo maximum).");
    setUploading(app.id);
    setMessage("");
    const supabase = createClient();
    const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(-80);
    const path = `preinscriptions/${app.id}/${type}-${Date.now()}-${safe}`;
    const up = await supabase.storage.from("dossiers").upload(path, file, { contentType: file.type });
    const row = up.error ? up : await supabase.from("application_documents").insert({ application_id: app.id, doc_type: type, file_path: path, file_name: file.name, file_size: file.size });
    setUploading(null);
    setMessage(row.error ? "Envoi impossible : déposez la pièce au bureau ou réessayez plus tard." : "Pièce ajoutée à votre dossier.");
    load();
  };

  const open = async (doc: ApplicationDocument) => {
    const { data } = await createClient().storage.from("dossiers").createSignedUrl(doc.file_path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  if (!apps) return <div className="h-40 animate-pulse rounded-3xl bg-white" />;

  if (!apps.length) {
    return (
      <Link
        href="/preinscription"
        className="group flex flex-col gap-4 rounded-3xl bg-[image:linear-gradient(120deg,#06152E,#0C356A_60%,#E30613)] p-8 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between"
      >
        <span className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15">
            <ClipboardList aria-hidden className="size-7" />
          </span>
          <span>
            <span className="block font-display text-xl font-extrabold">Commencer ma pré-inscription</span>
            <span className="text-white/80">Choisissez votre formation, remplissez votre dossier et déposez vos pièces en ligne.</span>
          </span>
        </span>
        <ArrowRight aria-hidden className="size-6 transition-transform group-hover:translate-x-1" />
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {message && <p className="rounded-2xl bg-avenida-blue-50 p-4 text-sm font-semibold text-avenida-blue">{message}</p>}
      {apps.map((a) => {
        const st = APPLICATION_STATUS[a.status];
        const appDocs = docs.filter((d) => d.application_id === a.id);
        return (
          <section key={a.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-900/5">
            <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Dossier {a.reference ?? "—"} · déposé le {fmtDateTime(a.created_at)}</p>
                <h2 className="mt-1 font-display text-2xl font-extrabold text-avenida-blue-950">
                  {a.program_code} · {a.specialty}
                </h2>
                <p className="text-sm text-slate-600">
                  Rentrée du {a.intake} · cours du {a.schedule}
                  {a.boarding ? " · interne" : ""}
                </p>
              </div>
              <span className={cn("rounded-full px-3 py-1.5 text-sm font-bold ring-1", st.tone)}>{st.label}</span>
            </header>

            {/* Parcours */}
            <ol className="grid grid-cols-4 gap-2 px-6 pt-6">
              {STEPS.map((s, i) => (
                <li key={s} className="flex flex-col gap-2">
                  <span className={cn("h-1.5 rounded-full", i < st.step ? (a.status === "refusee" && i === 2 ? "bg-slate-400" : "bg-vif") : "bg-slate-100")} />
                  <span className={cn("text-xs font-bold", i < st.step ? "text-avenida-blue-950" : "text-slate-400")}>{s}</span>
                </li>
              ))}
            </ol>

            {a.status === "acceptee" && !a.student_id && (
              <div className="mx-6 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <span>Dossier accepté : réglez vos frais d&apos;inscription en ligne (Yas, Moov ou carte), puis présentez-vous au bureau des inscriptions.</span>
                <Link href="/espace/paiements" className="rounded-full bg-vif px-4 py-2 text-sm font-bold text-white hover:bg-vif-fonce">
                  Payer mes frais d&apos;inscription
                </Link>
              </div>
            )}

            {a.status === "pieces_manquantes" && (
              <p className="mx-6 mt-5 rounded-2xl bg-orange-50 p-4 text-sm text-orange-900">
                L&apos;école attend des pièces complémentaires. Ajoutez-les ci-dessous ou déposez-les au bureau.
              </p>
            )}

            <div className="grid gap-6 p-6 lg:grid-cols-2">
              <div>
                <h3 className="font-display font-bold text-avenida-blue-950">Pièces déposées</h3>
                {appDocs.length ? (
                  <ul className="mt-2 divide-y divide-slate-100">
                    {appDocs.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span>
                          <span className="font-semibold text-slate-800">{DOC_LABELS[d.doc_type] ?? d.doc_type}</span>
                          <span className="block text-xs text-slate-500">{d.file_name}</span>
                        </span>
                        <button type="button" onClick={() => open(d)} aria-label={`Ouvrir ${d.file_name}`} className="text-avenida-blue hover:text-vif">
                          <Download aria-hidden className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Aucune pièce déposée en ligne.</p>
                )}
              </div>
              <div>
                <h3 className="font-display font-bold text-avenida-blue-950">Ajouter une pièce</h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Object.entries(DOC_LABELS).map(([type, label]) => (
                    <label
                      key={type}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm font-semibold text-avenida-blue hover:border-vif hover:bg-red-50/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-avenida-blue"
                    >
                      {uploading === a.id ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <FileUp aria-hidden className="size-4 text-vif" />}
                      {label}
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={uploading === a.id}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) upload(a, type, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );
      })}
      <Link href="/espace/messages" className="w-fit text-sm font-bold text-vif hover:underline">
        Une question sur votre dossier ? Écrivez à l&apos;école →
      </Link>
    </div>
  );
}
