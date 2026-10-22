"use client";

import { Archive, ChevronDown, Download, Eye, FileText, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DocumentViewer, downloadFile, type ViewableFile } from "@/components/documents/DocumentViewer";
import { ARCHIVE_KINDS, type ArchiveKind, type ArchivedFile } from "@/lib/archives";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  created_at: string;
  kind: ArchiveKind;
  title: string;
  owner_name: string | null;
  reference: string | null;
  year: string;
  files: ArchivedFile[];
  data: Record<string, unknown>;
  notes: string | null;
};

const HIDDEN = new Set(["id", "created_at", "updated_at", "raw_data", "student_id", "decided_by", "handled_by", "photo"]);

/** Archives : dossiers et documents vérifiés, classés par type et par année, consultables et téléchargeables. */
export default function ArchivesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [kind, setKind] = useState("");
  const [year, setYear] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ViewableFile | null>(null);

  useEffect(() => {
    createClient()
      .from("archives")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, []);

  const years = useMemo(() => [...new Set((rows ?? []).map((r) => r.year))].sort().reverse(), [rows]);
  const counts = useMemo(() => Object.fromEntries(Object.keys(ARCHIVE_KINDS).map((k) => [k, (rows ?? []).filter((r) => r.kind === k).length])), [rows]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => (!kind || r.kind === kind) && (!year || r.year === year) && (!t || `${r.title} ${r.owner_name} ${r.reference}`.toLowerCase().includes(t)));
  }, [rows, kind, year, q]);

  const asFile = (f: ArchivedFile): ViewableFile => ({ bucket: "archives", path: f.path, name: f.name, label: f.label });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black text-[#0C356A]">
          <Archive aria-hidden className="size-6 text-[#E30613]" /> Archives
        </h1>
        <p className="mt-1 text-sm text-slate-600">Dossiers vérifiés et conservés : pré-inscriptions, dossiers des membres, permissions, demandes, cartes, bulletins et reçus.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setKind("")} className={cn("rounded-full px-3.5 py-1.5 text-xs font-bold ring-1", !kind ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200 hover:text-[#E30613]")}>
          Tout ({rows?.length ?? 0})
        </button>
        {(Object.keys(ARCHIVE_KINDS) as ArchiveKind[])
          .filter((k) => counts[k])
          .map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} className={cn("rounded-full px-3.5 py-1.5 text-xs font-bold ring-1", kind === k ? "bg-[#0C356A] text-white ring-[#0C356A]" : "bg-white text-slate-600 ring-slate-200 hover:text-[#E30613]")}>
              {ARCHIVE_KINDS[k]} ({counts[k]})
            </button>
          ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="relative min-w-[14rem] flex-1">
          <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, titre, matricule, référence" aria-label="Rechercher" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-[#0C356A]" />
        </span>
        <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Année" className="rounded-xl border border-slate-200 bg-white px-3 text-sm">
          <option value="">Toutes les années</option>
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>

      {rows === null ? (
        <Loader2 aria-label="Chargement" className="size-6 animate-spin text-[#0C356A]" />
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Aucune archive. Utilisez « Vérifier et archiver » sur un dossier (pré-inscriptions, dossiers des membres, permissions, demandes, cartes, bulletins).
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((r) => (
            <li key={r.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <button type="button" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id} className="flex w-full flex-wrap items-center gap-3 p-4 text-left hover:bg-slate-50">
                <span className="rounded-full bg-[#0C356A]/10 px-2.5 py-1 text-[11px] font-bold text-[#0C356A]">{ARCHIVE_KINDS[r.kind]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-slate-800">{r.title}</span>
                  <span className="text-xs text-slate-500">
                    Archivé le {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    {r.reference ? ` · ${r.reference}` : ""} · {r.files.length} fichier(s)
                  </span>
                </span>
                <ChevronDown aria-hidden className={cn("size-5 text-slate-400 transition-transform", open === r.id && "rotate-180")} />
              </button>
              {open === r.id && (
                <div className="grid gap-4 border-t border-slate-100 p-4 lg:grid-cols-2">
                  <section>
                    <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Documents</p>
                    {r.files.length === 0 ? (
                      <p className="text-sm text-slate-500">Aucun fichier (données seulement).</p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {r.files.map((f) => (
                          <li key={f.path} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                            <FileText aria-hidden className="size-4 text-slate-400" />
                            <span className="min-w-0 flex-1 truncate">
                              {f.label && <strong>{f.label} · </strong>}
                              {f.name}
                            </span>
                            <button type="button" onClick={() => setViewing(asFile(f))} aria-label={`Voir ${f.name}`} className="rounded-full p-1.5 text-[#0C356A] hover:text-[#E30613]">
                              <Eye aria-hidden className="size-4" />
                            </button>
                            <button type="button" onClick={() => downloadFile(asFile(f))} aria-label={`Télécharger ${f.name}`} className="rounded-full p-1.5 text-[#0C356A] hover:text-[#E30613]">
                              <Download aria-hidden className="size-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                  <section>
                    <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Informations conservées</p>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                      {Object.entries(r.data)
                        .filter(([k, v]) => !HIDDEN.has(k) && v !== null && v !== "" && typeof v !== "object")
                        .map(([k, v]) => (
                          <div key={k} className="contents">
                            <dt className="text-slate-500">{k.replace(/_/g, " ")}</dt>
                            <dd className="font-semibold text-slate-800">{String(v)}</dd>
                          </div>
                        ))}
                    </dl>
                  </section>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {viewing && <DocumentViewer file={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
