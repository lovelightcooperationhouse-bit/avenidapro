"use client";

import { useState } from "react";
import {
  Wallet,
  CreditCard,
  GraduationCap,
  BedDouble,
  PlusCircle,
  Search,
  CheckCircle2,
  X,
  FileText,
  Download,
  Building,
} from "lucide-react";
import { MOCK_SALARIES, MOCK_EMPLOYEES } from "@/lib/mock-data";
import { SalaryRecord } from "@/types";
import { formatFCFA } from "@/lib/utils";

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<SalaryRecord[]>(MOCK_SALARIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newSal, setNewSal] = useState({
    employee_id: MOCK_EMPLOYEES[0]?.id,
    period_month: "Octobre 2026",
    base_salary: 300000,
    bonuses: 25000,
    cnss_deduction: 12000,
    payment_method: "Virement Bancaire" as any,
  });

  const totalNet = salaries.reduce((acc, s) => acc + s.net_payable, 0);
  const ecoleNet = salaries
    .filter((s) => s.sector === "ecole")
    .reduce((acc, s) => acc + s.net_payable, 0);
  const hotelNet = salaries
    .filter((s) => s.sector === "hotel")
    .reduce((acc, s) => acc + s.net_payable, 0);
  const totalCnss = salaries.reduce((acc, s) => acc + s.cnss_deduction, 0);

  const filteredSalaries = salaries.filter((s) => {
    const matchSearch =
      s.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.slip_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employee_matricule.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSector = sectorFilter === "ALL" || s.sector === sectorFilter;
    return matchSearch && matchSector;
  });

  const handleAddSalary = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = MOCK_EMPLOYEES.find((e) => e.id === newSal.employee_id) || MOCK_EMPLOYEES[0];
    const net = Number(newSal.base_salary) + Number(newSal.bonuses) - Number(newSal.cnss_deduction);

    const added: SalaryRecord = {
      id: `sal-${Date.now()}`,
      slip_ref: `PAY-2026-10-${String(salaries.length + 5).padStart(2, "0")}`,
      employee_id: emp.id,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      employee_matricule: emp.matricule,
      sector: emp.sector,
      role_title: emp.role_title,
      period_month: newSal.period_month,
      base_salary: Number(newSal.base_salary),
      bonuses: Number(newSal.bonuses),
      cnss_deduction: Number(newSal.cnss_deduction),
      net_payable: net,
      payment_method: newSal.payment_method,
      payment_date: new Date().toISOString().split("T")[0],
      status: "payé",
    };

    setSalaries([added, ...salaries]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-3xl border-2 border-emerald-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-md">
            <Wallet className="w-7 h-7 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                DIRECTION, RH & FINANCES
              </span>
              <span className="text-xs text-slate-400">&bull; Salaires & Rémunérations</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              Livre de Paie & Bulletins de Salaires (F CFA)
            </h1>
            <p className="text-xs text-slate-500">
              Traitement des émoluments Professeurs École, Personnel Hôtel, primes et cotisations CNSS Lomé
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Émettre un Bulletin de Paie</span>
        </button>
      </div>

      {/* Statistiques Paie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Masse Salariale Nette</span>
            <CreditCard className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl font-black text-emerald-950 mt-2">
            {formatFCFA(totalNet)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Total décaissé sur le mois</div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-black">
            <span>Paie Professeurs École</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-950 mt-2">
            {formatFCFA(ecoleNet)}
          </div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Formateurs & Pédagogie</div>
        </div>

        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 shadow-2xs">
          <div className="flex items-center justify-between text-red-800 text-xs font-black">
            <span>Paie Personnel Hôtel</span>
            <BedDouble className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-black text-red-950 mt-2">
            {formatFCFA(hotelNet)}
          </div>
          <div className="text-[10px] text-red-700 font-semibold mt-1">Exploitation hôtelière</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Cotisations CNSS</span>
            <Building className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-2">
            {formatFCFA(totalCnss)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Déclarations sociales Togo</div>
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
            placeholder="Nom du collaborateur, matricule, n° bulletin..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>

        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
        >
          <option value="ALL">Tous les secteurs (École & Hôtel)</option>
          <option value="ecole">Professeurs École</option>
          <option value="hotel">Personnel Hôtel</option>
        </select>
      </div>

      {/* Tableau des Salaires */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Réf. Bulletin & Employé</th>
                <th className="py-3.5 px-4">Secteur</th>
                <th className="py-3.5 px-4">Poste Occupé</th>
                <th className="py-3.5 px-4">Salaire Base</th>
                <th className="py-3.5 px-4">Primes</th>
                <th className="py-3.5 px-4">CNSS</th>
                <th className="py-3.5 px-4">Net Versé (F CFA)</th>
                <th className="py-3.5 px-4">Mode / Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSalaries.map((sal) => (
                <tr key={sal.id} className="hover:bg-emerald-50/20">
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-slate-900">{sal.employee_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {sal.slip_ref} &bull; {sal.employee_matricule}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {sal.sector === "ecole" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                        ÉCOLE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-900">
                        HÔTEL
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700">{sal.role_title}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{formatFCFA(sal.base_salary)}</td>
                  <td className="py-3 px-4 font-mono text-emerald-700">+{formatFCFA(sal.bonuses)}</td>
                  <td className="py-3 px-4 font-mono text-rose-700">-{formatFCFA(sal.cnss_deduction)}</td>
                  <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                    {formatFCFA(sal.net_payable)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="font-bold">{sal.payment_method}</div>
                    <div className="text-[10px] text-slate-400">{sal.payment_date}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Bulletin de Paie */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-emerald-800">Émettre un Bulletin de Paie</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddSalary} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Collaborateur Bénéficiaire</label>
                <select
                  value={newSal.employee_id}
                  onChange={(e) => {
                    const emp = MOCK_EMPLOYEES.find((m) => m.id === e.target.value);
                    setNewSal({
                      ...newSal,
                      employee_id: e.target.value,
                      base_salary: emp?.base_salary || 250000,
                    });
                  }}
                  className="form-input-avenida"
                >
                  {MOCK_EMPLOYEES.map((e) => (
                    <option key={e.id} value={e.id}>
                      [{e.sector.toUpperCase()}] {e.last_name} {e.first_name} - {e.role_title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mois de Paie</label>
                  <input
                    type="text"
                    value={newSal.period_month}
                    onChange={(e) => setNewSal({ ...newSal, period_month: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mode de Règlement</label>
                  <select
                    value={newSal.payment_method}
                    onChange={(e) => setNewSal({ ...newSal, payment_method: e.target.value as any })}
                    className="form-input-avenida"
                  >
                    <option value="Virement Bancaire">Virement Bancaire</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Espèces">Espèces</option>
                    <option value="T-Money / Flooz">T-Money / Flooz</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Salaire Base</label>
                  <input
                    type="number"
                    value={newSal.base_salary}
                    onChange={(e) => setNewSal({ ...newSal, base_salary: Number(e.target.value) })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primes</label>
                  <input
                    type="number"
                    value={newSal.bonuses}
                    onChange={(e) => setNewSal({ ...newSal, bonuses: Number(e.target.value) })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Retenue CNSS</label>
                  <input
                    type="number"
                    value={newSal.cnss_deduction}
                    onChange={(e) => setNewSal({ ...newSal, cnss_deduction: Number(e.target.value) })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                <span className="font-bold text-emerald-900">Net Estimé à Payer :</span>
                <span className="font-mono font-black text-emerald-950 text-base">
                  {formatFCFA(newSal.base_salary + newSal.bonuses - newSal.cnss_deduction)}
                </span>
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
                  className="px-5 py-2 bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Valider le Paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
