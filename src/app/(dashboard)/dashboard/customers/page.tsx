"use client";

import { useState, useEffect } from "react";
import {
  UserCheck,
  Building,
  Phone,
  Mail,
  PlusCircle,
  Search,
  Star,
  CreditCard,
  X,
  Award,
  Printer,
  FileText,
} from "lucide-react";
import { MOCK_CUSTOMERS } from "@/lib/mock-data";
import { HotelCustomer } from "@/types";
import { formatFCFA } from "@/lib/utils";
import { CustomerAttestationModal } from "@/components/shared/CustomerAttestationModal";
import { createClient } from "@/lib/supabase/client";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<HotelCustomer[]>(MOCK_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerForAttestation, setSelectedCustomerForAttestation] = useState<HotelCustomer | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("avenida_custom_customers");
      if (stored) {
        const parsed = JSON.parse(stored) as HotelCustomer[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customIds = new Set(parsed.map((c) => c.id));
          const filteredMocks = MOCK_CUSTOMERS.filter((m) => !customIds.has(m.id));
          setCustomers([...parsed, ...filteredMocks]);
        }
      }
    } catch (e) {
      console.warn("Erreur chargement clients localStorage:", e);
    }
  }, []);

  const [newCust, setNewCust] = useState({
    full_name: "",
    company: "",
    phone: "",
    email: "",
    nationality: "Togolaise",
    id_card_or_passport: "",
    is_vip: false,
  });

  const totalSpentAll = customers.reduce((acc, c) => acc + c.total_spent, 0);
  const vipCount = customers.filter((c) => c.is_vip).length;

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  );

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.full_name) return;

    const added: HotelCustomer = {
      id: `clt-${Date.now()}`,
      code: `CLT-${String(customers.length + 46).padStart(4, "0")}`,
      full_name: newCust.full_name,
      company: newCust.company || undefined,
      phone: newCust.phone || "+228 90 00 00 00",
      email: newCust.email || `${newCust.full_name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      nationality: newCust.nationality,
      id_card_or_passport: newCust.id_card_or_passport || "TG-CNI-XXXXXX",
      total_stays: 1,
      total_spent: 0,
      is_vip: newCust.is_vip,
      created_at: new Date().toISOString().split("T")[0],
    };

    // 1. Sauvegarde locale immédiate
    try {
      const stored = localStorage.getItem("avenida_custom_customers");
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem("avenida_custom_customers", JSON.stringify([added, ...list]));
    } catch (e) {
      console.warn("Erreur localStorage clients:", e);
    }

    // 2. Sauvegarde Supabase
    try {
      const supabase = createClient();
      const parts = newCust.full_name.trim().split(" ");
      const lastName = parts.pop() || "";
      const firstName = parts.join(" ") || lastName;
      (async () => {
        try {
          await supabase.from("hotel_customers").insert({
            first_name: firstName,
            last_name: lastName,
            phone: added.phone,
            email: added.email,
            nationality: added.nationality,
            id_card_or_passport: added.id_card_or_passport,
          });
        } catch {
          // ignore background fallback
        }
      })();
    } catch (err) {
      console.warn("Supabase hotel_customers insert fallback:", err);
    }

    setCustomers([added, ...customers]);
    setIsModalOpen(false);
    setSelectedCustomerForAttestation(added);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-3xl border-2 border-red-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center shadow-md">
            <UserCheck className="w-7 h-7 text-red-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-[#DC2626] px-2 py-0.5 rounded-full">
                ESPACE HÔTEL & CLIENTS
              </span>
              <span className="text-xs text-slate-400">&bull; Fichier Clientèle</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              Répertoire des Clients & Historique des Séjours
            </h1>
            <p className="text-xs text-slate-500">
              Coordonnées, entreprises partenaires, passeports, fidélité VIP et cumul des dépenses
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-[#DC2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Nouveau Client Hôtel</span>
        </button>
      </div>

      {/* Statistiques Clients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Clients Enregistrés</span>
            <UserCheck className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{customers.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Carnet d&apos;adresses Avenida</div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-black">
            <span>Clients VIP & Réguliers</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-950 mt-2">{vipCount}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Tarifs préférentiels</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-black">
            <span>Dépense Cumulée</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-950 mt-2">
            {formatFCFA(totalSpentAll)}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Hébergement & extras</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Panier Moyen</span>
            <Award className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-2">
            {formatFCFA(Math.round(totalSpentAll / (customers.length || 1)))}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Par client enregistré</div>
        </div>
      </div>

      {/* Recherche */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom, entreprise, n° client, téléphone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold">{filteredCustomers.length} fiche(s)</div>
      </div>

      {/* Tableau des Clients */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Code & Nom du Client</th>
                <th className="py-3.5 px-4">Entreprise / Organisme</th>
                <th className="py-3.5 px-4">Coordonnées</th>
                <th className="py-3.5 px-4">Nationalité & CNI/Passeport</th>
                <th className="py-3.5 px-4">Séjours</th>
                <th className="py-3.5 px-4">Total Dépensé</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-red-50/30">
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-slate-900">{cust.full_name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{cust.code}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {cust.company ? (
                      <span className="font-bold flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {cust.company}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Particulier</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div>{cust.phone}</div>
                    <div className="text-[10px] text-slate-500">{cust.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{cust.nationality}</div>
                    <div className="text-[10px] font-mono text-slate-500">{cust.id_card_or_passport}</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{cust.total_stays} séjour(s)</td>
                  <td className="py-3 px-4 font-mono font-black text-emerald-800">
                    {formatFCFA(cust.total_spent)}
                  </td>
                  <td className="py-3 px-4">
                    {cust.is_vip ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black border border-amber-200 flex items-center gap-1 w-fit">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        VIP
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedCustomerForAttestation(cust)}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-[#DC2626] hover:text-white text-[#DC2626] font-bold rounded-xl text-[11px] transition-all inline-flex items-center gap-1 shadow-2xs border border-red-200 active:scale-95 cursor-pointer ml-auto"
                      title="Générer et télécharger la Fiche Client Officielle (PDF)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Fiche Client</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nouveau Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-[#DC2626]">Créer une Fiche Client</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom & Prénom(s) *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Dr. Mensah Agbéyomé"
                  value={newCust.full_name}
                  onChange={(e) => setNewCust({ ...newCust, full_name: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Société / Entreprise (facultatif)</label>
                <input
                  type="text"
                  placeholder="ex: BOAD, Clinique..."
                  value={newCust.company}
                  onChange={(e) => setNewCust({ ...newCust, company: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="+228 90 00 00 00"
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={newCust.email}
                    onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nationalité</label>
                  <input
                    type="text"
                    value={newCust.nationality}
                    onChange={(e) => setNewCust({ ...newCust, nationality: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">N° CNI ou Passeport</label>
                  <input
                    type="text"
                    placeholder="TG-CNI-..."
                    value={newCust.id_card_or_passport}
                    onChange={(e) => setNewCust({ ...newCust, id_card_or_passport: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vip-status"
                  checked={newCust.is_vip}
                  onChange={(e) => setNewCust({ ...newCust, is_vip: e.target.checked })}
                  className="w-4 h-4 rounded text-[#DC2626]"
                />
                <label htmlFor="vip-status" className="font-bold text-slate-700">
                  Classifier en tant que Client VIP / Partenaire Régulier
                </label>
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
                  className="px-5 py-2 bg-[#DC2626] text-white font-bold rounded-xl shadow-md"
                >
                  Enregistrer la Fiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Attestation & Fiche Client Imprimable A4 */}
      {selectedCustomerForAttestation && (
        <CustomerAttestationModal
          customer={selectedCustomerForAttestation}
          isOpen={!!selectedCustomerForAttestation}
          onClose={() => setSelectedCustomerForAttestation(null)}
        />
      )}
    </div>
  );
}
