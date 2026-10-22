"use client";

import { CheckCircle2, Download, FileText, Inbox, Loader2, Mail, Phone, Search, UserPlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fees, formations } from "@/content/site";
import { issueCard } from "@/lib/cards";
import { APPLICATION_STATUS, DOC_LABELS, fmtDateTime, type Application, type ApplicationDocument, type ApplicationStatus } from "@/lib/admissions";
import { createClient } from "@/lib/supabase/client";
import { cn, formatFCFA } from "@/lib/utils";

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

  /** Crée le dossier élève à partir de la pré-inscription acceptée (matricule suivant). */
  const enroll = async () => {
    if (!selected) return;
    setBusy(true);
    const supabase = createClient();
    // Matricule par filière (ex. CAP26-0001), attribué par la base sans doublon
    const { data: matricule, error: mErr } = await supabase.rpc("next_matricule", { program: selected.program_code });
    if (mErr || !matricule) {
      setBusy(false);
      setFeedback("Attribution du matricule impossible.");
      return;
    }
    const year = new Date().getFullYear() % 100;
    const n = parseInt(String(matricule).split("-")[1], 10);
    const f = formations.find((x) => x.code === selected.program_code);
    const supplies = selected.program_code === "CFA" ? fees.suppliesCfa : fees.suppliesDiploma;
    const total = f ? f.registration + f.tuition + supplies : 0;
    const { data: student, error } = await supabase
      .from("students")
      .insert({
        registration_number: matricule as string,
        student_number: `ETU-20${year}-${selected.program_code}-${String(n).padStart(4, "0")}`,
        first_name: selected.first_name,
        last_name: selected.last_name.toUpperCase(),
        gender: selected.gender,
        birth_date: selected.birth_date,
        birth_place: selected.birth_place,
        nationality: selected.nationality,
        residence_neighborhood: selected.neighborhood,
        phone: selected.phone,
        email: selected.email,
        boarder_status: selected.boarding ? "interne" : "externe",
        program_code: selected.program_code,
        specialty: selected.specialty,
        class_name: `${selected.program_code}1 - ${selected.specialty}`,
        academic_year: `20${year} - 20${year + 1}`,
        last_class: selected.last_class,
        last_diploma: selected.last_diploma,
        previous_school: selected.previous_school,
        tutor_name: selected.guardian_name,
        tutor_phone: selected.guardian_phone,
        tutor_profession: selected.guardian_profession,
        tutor_relation: selected.guardian_relation,
        total_fee: total,
        paid_fee: 0,
        remaining_fee: total,
        status: "actif",
        notes: `Créé depuis la pré-inscription ${selected.reference ?? ""}`.trim(),
      })
      .select("id, registration_number")
      .single();
    if (error || !student) {
      setBusy(false);
      setFeedback("Création du dossier élève impossible : " + (error?.message ?? "erreur inconnue"));
      return;
    }
    await supabase.from("applications").update({ status: "inscrite", student_id: student.id }).eq("id", selected.id);
    // Carte scolaire émise automatiquement (QR de vérification, notification à la famille)
    const card = user ? await issueCard({ type: "eleve", id: student.id }, user.id) : null;
    setBusy(false);
    setFeedback(
      `Dossier élève créé : matricule ${student.registration_number}${card && !card.error ? ", carte scolaire émise" : ""}. Il apparaît dans « Dossiers des élèves » ; la fiche d'inscription est disponible.`
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
                Inscrire : créer le dossier élève ({formatFCFA((formations.find((f) => f.code === selected.program_code)?.registration ?? 0))} d&apos;inscription)
              </button>
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
