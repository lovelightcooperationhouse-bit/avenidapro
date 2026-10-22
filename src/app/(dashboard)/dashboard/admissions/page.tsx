"use client";

import { CheckCircle2, Download, FileText, Inbox, Loader2, Mail, Phone, Search, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formations, fees } from "@/content/site";
import { pingNotifications } from "@/lib/notify";
import { toPassportDataUrl } from "@/lib/pdf";
import Link from "next/link";
import { APPLICATION_STATUS, DOC_LABELS, fmtDateTime, type Application, type ApplicationDocument, type ApplicationStatus } from "@/lib/admissions";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFCFA } from "@/lib/utils";

/** Écolage annuel d'une filière : inscription + scolarité + fournitures. */
const totalFor = (code: string) => {
  const f = formations.find((x) => x.code === code);
  return f ? f.registration + f.tuition + (code === "CFA" ? fees.suppliesCfa : fees.suppliesDiploma) : 0;
};

/** Gestion des pré-inscriptions déposées sur le site : étude, décision et création du dossier élève. */
export default function AdmissionsDashboardPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [docs, setDocs] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ApplicationStatus | "toutes">("toutes");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [enrolled, setEnrolled] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: a }, { data: d }] = await Promise.all([
      supabase.from("applications").select("*").order("created_at", { ascending: false }),
      supabase.from("application_documents").select("*").order("created_at"),
    ]);
    setApps((a ?? []) as Application[]);
    setDocs((d ?? []) as ApplicationDocument[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter(
      (a) =>
        (filter === "toutes" || a.status === filter) &&
        (!q || `${a.first_name} ${a.last_name} ${a.reference} ${a.phone} ${a.email} ${a.program_code} ${a.specialty}`.toLowerCase().includes(q))
    );
  }, [apps, filter, query]);

  const selected = apps.find((a) => a.id === selectedId) ?? null;
  useEffect(() => {
    setNotes(selected?.staff_notes ?? "");
  }, [selected]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { toutes: apps.length };
    apps.forEach((a) => (c[a.status] = (c[a.status] ?? 0) + 1));
    return c;
  }, [apps]);

  const update = async (patch: Partial<Application>, message: string) => {
    if (!selected || !user) return;
    setBusy(true);
    const decision = patch.status && ["acceptee", "refusee"].includes(patch.status) ? { decided_by: user.id, decided_at: new Date().toISOString() } : {};
    const { error } = await createClient().from("applications").update({ ...patch, ...decision }).eq("id", selected.id);
    setBusy(false);
    setFeedback(error ? "Mise à jour impossible." : message);
    load();
  };

  /**
   * Inscription définitive : la base crée l'élève dans sa filière et sa classe, le matricule,
   * l'écolage (frais de la filière), la carte scolaire, et rattache les comptes de l'élève et du tuteur.
   */
  const enroll = async () => {
    if (!selected) return;
    setBusy(true);
    const { data, error } = await createClient().rpc("enroll_application", { app: selected.id });
    setBusy(false);
    if (error) return setFeedback("Inscription impossible : " + error.message);
    const r = data as { student_id: string; matricule?: string; total?: number; student_account?: boolean; guardian_account?: boolean };
    setEnrolled(r.student_id);
    // Photo d'identité déposée avec la pré-inscription → fiche d'inscription et carte scolaire
    const photoDoc = docs.find((d) => d.application_id === selected.id && d.doc_type === "photo" && !/\.pdf$/i.test(d.file_name ?? ""));
    if (photoDoc) {
      const { data: file } = await createClient().storage.from("dossiers").download(photoDoc.file_path);
      if (file) await createClient().from("students").update({ photo_url: await toPassportDataUrl(file) }).eq("id", r.student_id);
    }
    pingNotifications();
    setFeedback(
      `Inscription définitive : matricule ${r.matricule}, écolage ${formatFCFA(r.total ?? 0)}, carte scolaire émise.` +
        (r.student_account ? " Compte de l'élève rattaché." : "") +
        (r.guardian_account ? " Compte du tuteur rattaché." : "") +
        " Envoyez maintenant la fiche d'inscription."
    );
    load();
  };

  const openDoc = async (doc: ApplicationDocument) => {
    const { data } = await createClient().storage.from("dossiers").createSignedUrl(doc.file_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const filters: (ApplicationStatus | "toutes")[] = ["toutes", "nouvelle", "en_etude", "pieces_manquantes", "acceptee", "refusee", "inscrite"];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#0C356A]">Pré-inscriptions en ligne</h1>
        <p className="mt-1 text-sm text-slate-600">Dossiers déposés sur le site public : étudiez, demandez des pièces, décidez et créez le dossier élève.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold ring-1 transition-colors",
              filter === f ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200 hover:ring-[#0C356A]"
            )}
          >
            {f === "toutes" ? "Toutes" : APPLICATION_STATUS[f].label} ({counts[f] ?? 0})
          </button>
        ))}
        <label className="relative ml-auto w-full sm:w-72">
          <span className="sr-only">Rechercher</span>
          <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, référence, téléphone…" className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-[#0C356A]" />
        </label>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* Liste */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <p className="flex items-center gap-2 p-6 text-sm text-slate-500">
              <Loader2 aria-hidden className="size-4 animate-spin" /> Chargement…
            </p>
          ) : visible.length === 0 ? (
            <p className="flex flex-col items-center gap-2 p-10 text-center text-sm text-slate-500">
              <Inbox aria-hidden className="size-8 text-slate-300" />
              Aucune pré-inscription pour ce filtre.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visible.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(a.id);
                      setFeedback("");
                    }}
                    className={cn("flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-slate-50", selectedId === a.id && "bg-blue-50/60")}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-slate-900">
                        {a.last_name.toUpperCase()} {a.first_name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {a.reference} · {a.program_code} {a.specialty} · {fmtDateTime(a.created_at)}
                      </span>
                    </span>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1", APPLICATION_STATUS[a.status].tone)}>{APPLICATION_STATUS[a.status].label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Fiche */}
        {selected ? (
          <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">Dossier {selected.reference}</p>
                <h2 className="text-xl font-black text-[#0C356A]">
                  {selected.last_name.toUpperCase()} {selected.first_name}
                </h2>
                <p className="text-sm font-semibold text-[#DC2626]">
                  {selected.program_code} · {selected.specialty} · rentrée du {selected.intake} · cours du {selected.schedule}
                  {selected.boarding ? " · interne" : ""}
                </p>
              </div>
              <span className={cn("rounded-full px-3 py-1.5 text-xs font-bold ring-1", APPLICATION_STATUS[selected.status].tone)}>{APPLICATION_STATUS[selected.status].label}</span>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200">
                <Phone aria-hidden className="size-4" /> {selected.phone}
              </a>
              <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200">
                <Mail aria-hidden className="size-4" /> {selected.email}
              </a>
            </div>

            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["Sexe", selected.gender === "F" ? "Féminin" : selected.gender === "M" ? "Masculin" : "—"],
                ["Naissance", [selected.birth_date && new Date(selected.birth_date).toLocaleDateString("fr-FR"), selected.birth_place].filter(Boolean).join(" à ") || "—"],
                ["Nationalité", selected.nationality ?? "—"],
                ["Quartier", selected.neighborhood ?? "—"],
                ["Dernière classe", selected.last_class ?? "—"],
                ["Dernier diplôme", selected.last_diploma ?? "—"],
                ["Établissement précédent", selected.previous_school ?? "—"],
                ["Parent / tuteur", selected.guardian_name ? `${selected.guardian_name} (${selected.guardian_relation ?? "—"})` : "—"],
                ["Téléphone parent", selected.guardian_phone ?? "—"],
                ["E-mail parent", selected.guardian_email ?? "—"],
                ["Profession parent", selected.guardian_profession ?? "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold text-slate-500">{k}</dt>
                  <dd className="font-semibold text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
            {selected.message && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">« {selected.message} »</p>}

            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-black text-[#0C356A]">
                <FileText aria-hidden className="size-4" /> Pièces jointes
              </h3>
              {docs.filter((d) => d.application_id === selected.id).length ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {docs
                    .filter((d) => d.application_id === selected.id)
                    .map((d) => (
                      <li key={d.id}>
                        <button type="button" onClick={() => openDoc(d)} className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left text-sm hover:border-[#0C356A]">
                          <span className="min-w-0">
                            <span className="block font-bold text-slate-800">{DOC_LABELS[d.doc_type] ?? d.doc_type}</span>
                            <span className="block truncate text-xs text-slate-500">{d.file_name}</span>
                          </span>
                          <Download aria-hidden className="size-4 shrink-0 text-[#0C356A]" />
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Aucune pièce déposée en ligne.</p>
              )}
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-bold text-[#0C356A]">
              Notes internes (non visibles par le candidat)
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="rounded-xl border border-slate-200 p-3 font-normal text-slate-800 outline-none focus:border-[#0C356A]" />
            </label>

            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => update({ staff_notes: notes || null }, "Notes enregistrées.")} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
                Enregistrer les notes
              </button>
              {selected.status !== "inscrite" && (<>
              <button type="button" disabled={busy} onClick={() => update({ status: "en_etude" }, "Dossier passé en étude.")} className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-900 hover:bg-amber-200">
                En étude
              </button>
              <button type="button" disabled={busy} onClick={() => update({ status: "pieces_manquantes" }, "Le candidat voit qu'il manque des pièces.")} className="rounded-xl bg-orange-100 px-4 py-2 text-sm font-bold text-orange-900 hover:bg-orange-200">
                Pièces manquantes
              </button>
              <button type="button" disabled={busy} onClick={() => update({ status: "acceptee" }, "Candidature acceptée.")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                Accepter
              </button>
              <button type="button" disabled={busy} onClick={() => update({ status: "refusee" }, "Candidature non retenue.")} className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-800 hover:bg-red-200">
                Ne pas retenir
              </button>
              </>)}
            </div>

            {selected.status === "acceptee" && (
              <button type="button" disabled={busy} onClick={enroll} className="flex items-center justify-center gap-2 rounded-xl bg-[#0C356A] px-4 py-3 text-sm font-bold text-white hover:bg-[#072042]">
                {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <UserPlus aria-hidden className="size-4" />}
                Valider l&apos;inscription définitive (écolage {formatFCFA(totalFor(selected.program_code))})
              </button>
            )}

            {(enrolled || selected.student_id) && (
              <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 p-3">
                <Link href={`/impression/fiche/${enrolled ?? selected.student_id}`} target="_blank" className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-4 py-2 text-sm font-bold text-white">
                  <FileText aria-hidden className="size-4" /> Fiche d&apos;inscription : imprimer, télécharger, envoyer
                </Link>
                <Link href={`/dashboard/recherche?q=${encodeURIComponent(selected.last_name)}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0C356A] ring-1 ring-slate-200">
                  Dossier de l&apos;élève
                </Link>
              </div>
            )}

            {feedback && (
              <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                <CheckCircle2 aria-hidden className="size-4" /> {feedback}
              </p>
            )}
          </div>
        ) : (
          <div className="hidden items-center justify-center rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 xl:flex">
            Sélectionnez une pré-inscription pour afficher le dossier complet.
          </div>
        )}
      </div>
    </div>
  );
}
