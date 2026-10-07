"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  TrendingUp,
  GraduationCap,
  BedDouble,
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  X,
  Sparkles,
} from "lucide-react";

interface ActivityReport {
  id: string;
  reference: string;
  title: string;
  type: "Pédagogique" | "Financier" | "Hôtelier" | "Général Direction";
  period: string;
  generated_at: string;
  author: string;
  key_metric: string;
  status: "validé" | "en_attente";
}

const INITIAL_REPORTS: ActivityReport[] = [
  {
    id: "rep-01",
    reference: "RAP-2026-T1",
    title: "Bilan Académique & Vie Scolaire — Rentrée 2026",
    type: "Pédagogique",
    period: "Septembre - Octobre 2026",
    generated_at: "2026-10-05",
    author: "Direction des Études",
    key_metric: "95.2% de présence • 4 filières actives",
    status: "validé",
  },
  {
    id: "rep-02",
    reference: "RAP-2026-FIN-09",
    title: "Rapport d'Encaissement des Écolages & Recouvrement",
    type: "Financier",
    period: "Septembre 2026",
    generated_at: "2026-10-02",
    author: "Comptabilité & Caisse Lomé",
    key_metric: "72% des tranches 1 encaissées",
    status: "validé",
  },
  {
    id: "rep-03",
    reference: "RAP-2026-HOT-09",
    title: "Performance d'Exploitation Hôtel Avenida (8 Chambres)",
    type: "Hôtelier",
    period: "Septembre 2026",
    generated_at: "2026-10-01",
    author: "Responsable Réception & Hébergement",
    key_metric: "75% taux d'occupation moyen",
    status: "validé",
  },
  {
    id: "rep-04",
    reference: "RAP-2026-RH-10",
    title: "État des Effectifs : Professeurs École & Personnel Hôtel",
    type: "Général Direction",
    period: "Octobre 2026",
    generated_at: "2026-10-06",
    author: "Direction Générale RH",
    key_metric: "28 collaborateurs • 100% contrats conformes",
    status: "validé",
  },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ActivityReport[]>(INITIAL_REPORTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newReport, setNewReport] = useState({
    title: "",
    type: "Général Direction" as any,
    period: "Octobre 2026",
    author: "Admin Direction",
    key_metric: "",
  });

  const filteredReports = reports.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === "ALL" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.title) return;

    const added: ActivityReport = {
      id: `rep-${Date.now()}`,
      reference: `RAP-2026-${String(reports.length + 5).padStart(2, "0")}`,
      title: newReport.title,
      type: newReport.type,
      period: newReport.period,
      generated_at: new Date().toISOString().split("T")[0],
      author: newReport.author,
      key_metric: newReport.key_metric || "Rapport validé conforme",
      status: "validé",
    };

    setReports([added, ...reports]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0C356A] text-white flex items-center justify-center shadow-md">
            <FileText className="w-7 h-7 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                DIRECTION, RH & FINANCES
              </span>
              <span className="text-xs text-slate-400">&bull; Bilans & Décisions</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              Rapports d&apos;Activité & Synthèses Périodiques
            </h1>
            <p className="text-xs text-slate-500">
              Analyses consolidées de l&apos;école hôtelière et de l&apos;exploitation de l&apos;hôtel Avenida Lomé
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#0C356A] hover:bg-[#164E87] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Générer un Nouveau Rapport</span>
        </button>
      </div>

      {/* Statistiques Indicateurs Clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-black">
            <span>Recouvrement Scolaire</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">72.4%</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Tranche 1 rentrée encaissée</div>
        </div>

        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 shadow-2xs">
          <div className="flex items-center justify-between text-red-800 text-xs font-black">
            <span>Occupation Hôtel</span>
            <BedDouble className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-950 mt-2">75.0%</div>
          <div className="text-[10px] text-red-700 font-semibold mt-1">Sur les 8 chambres Avenida</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Rapports Édités</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2">{reports.length}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Disponibles pour audit DG</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Conformité Globale</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">100%</div>
          <div className="text-[10px] text-slate-500 mt-1">Validés sans anomalie</div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Titre du rapport, référence, auteur..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
        >
          <option value="ALL">Tous les types de rapports</option>
          <option value="Pédagogique">Pédagogique (École)</option>
          <option value="Financier">Financier (Caisse & Recettes)</option>
          <option value="Hôtelier">Hôtelier (Chambres & Hébergement)</option>
          <option value="Général Direction">Général Direction</option>
        </select>
      </div>

      {/* Tableau des Rapports */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Réf. & Titre du Document</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Période Concernée</th>
                <th className="py-3.5 px-4">Rédacteur</th>
                <th className="py-3.5 px-4">Indicateur Clé Synthétisé</th>
                <th className="py-3.5 px-4">Date Émission</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-slate-900">{rep.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{rep.reference}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rep.type === "Pédagogique"
                          ? "bg-blue-100 text-blue-800"
                          : rep.type === "Hôtelier"
                          ? "bg-red-100 text-red-800"
                          : rep.type === "Financier"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {rep.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700">{rep.period}</td>
                  <td className="py-3 px-4 text-slate-600">{rep.author}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{rep.key_metric}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{rep.generated_at}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => alert(`Téléchargement du rapport officiel ${rep.reference} au format PDF.`)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-[#0C356A] hover:text-white text-slate-700 font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Génération de Rapport */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-[#0C356A]">Générer un Rapport d&apos;Activité</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddReport} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Titre Officiel du Rapport *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Bilan Trimestriel Cuisine & Restauration"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type de Rapport</label>
                  <select
                    value={newReport.type}
                    onChange={(e) => setNewReport({ ...newReport, type: e.target.value as any })}
                    className="form-input-avenida"
                  >
                    <option value="Pédagogique">Pédagogique (École)</option>
                    <option value="Hôtelier">Hôtelier (Hébergement)</option>
                    <option value="Financier">Financier (Recouvrement & Caisse)</option>
                    <option value="Général Direction">Général Direction</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Période Analysée</label>
                  <input
                    type="text"
                    value={newReport.period}
                    onChange={(e) => setNewReport({ ...newReport, period: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rédacteur / Service Émetteur</label>
                <input
                  type="text"
                  value={newReport.author}
                  onChange={(e) => setNewReport({ ...newReport, author: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Synthèse / Indicateur Majeur</label>
                <input
                  type="text"
                  placeholder="ex: Progression de 12% des inscriptions"
                  value={newReport.key_metric}
                  onChange={(e) => setNewReport({ ...newReport, key_metric: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0C356A] text-white font-bold rounded-xl shadow-md"
                >
                  Générer le Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
