"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  UserCheck,
  Key,
  Lock,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  X,
  Mail,
  User,
  Building,
} from "lucide-react";
import { UserRole } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface SystemUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  role_label: string;
  scope: "Global" | "École" | "Hôtel" | "Finance";
  created_at: string;
  last_login: string;
  status: "actif" | "suspendu";
}

const INITIAL_USERS: SystemUser[] = [
  {
    id: "usr-01",
    name: "M. Hope d'Almeida",
    email: "direction@ecole-avenida.tg",
    username: "directeur",
    role: "super_admin",
    role_label: "Super Administrateur",
    scope: "Global",
    created_at: "2024-01-01",
    last_login: "Aujourd'hui à 09:42",
    status: "actif",
  },
  {
    id: "usr-02",
    name: "Directeur des Études & Pédagogie",
    email: "pedagogie@avenida-lome.tg",
    username: "dir_etudes",
    role: "responsable_pedagogique",
    role_label: "Responsable Pédagogique",
    scope: "École",
    created_at: "2024-02-15",
    last_login: "Aujourd'hui à 08:15",
    status: "actif",
  },
  {
    id: "usr-03",
    name: "Comptable & Responsable Caisse Lomé",
    email: "caisse@avenida-lome.tg",
    username: "comptable_caisse",
    role: "comptable",
    role_label: "Comptable Caisse",
    scope: "Finance",
    created_at: "2024-03-01",
    last_login: "Hier à 17:30",
    status: "actif",
  },
  {
    id: "usr-04",
    name: "Responsable Front Office & Hôtel",
    email: "hotel@avenida-lome.tg",
    username: "manager_hotel",
    role: "responsable_hotel",
    role_label: "Responsable Hôtel",
    scope: "Hôtel",
    created_at: "2024-04-10",
    last_login: "Hier à 14:20",
    status: "actif",
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    username: "",
    role: "administration" as UserRole,
    role_label: "Gestionnaire Scolarité",
    scope: "École" as "Global" | "École" | "Hôtel" | "Finance",
  });

  useEffect(() => {
    async function loadInvitations() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("user_invitations").select("*");
        if (data && data.length > 0) {
          const mapped: SystemUser[] = data.map((inv: any) => ({
            id: inv.id,
            name: `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || inv.email,
            email: inv.email,
            username: inv.email.split("@")[0],
            role: (inv.role_code as UserRole) || "professeur",
            role_label: inv.role_code === "professeur" ? "Professeur" : inv.role_code === "eleve" ? "Élève" : "Opérateur",
            scope: inv.role_code === "professeur" || inv.role_code === "eleve" ? "École" : inv.role_code === "responsable_hotel" ? "Hôtel" : "Global",
            created_at: inv.created_at ? inv.created_at.split("T")[0] : "2024-01-01",
            last_login: inv.status === "accepted" ? "Compte actif" : "En attente d'activation par l'utilisateur",
            status: "actif",
          }));
          setUsers((prev) => {
            const existingEmails = new Set(prev.map((u) => u.email));
            const newOnes = mapped.filter((m) => !existingEmails.has(m.email));
            return [...newOnes, ...prev];
          });
        }
      } catch (e) {
        console.error("Erreur de chargement des invitations:", e);
      }
    }
    loadInvitations();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role_label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name) return;

    const email = newUser.email || `${newUser.username}@ecole-avenida.tg`;
    const names = newUser.name.trim().split(" ");
    const firstName = names[0] || newUser.name;
    const lastName = names.slice(1).join(" ") || "Personnel";

    try {
      const supabase = createClient();
      await supabase.from("user_invitations").insert({
        email: email.toLowerCase().trim(),
        first_name: firstName,
        last_name: lastName,
        role_code: newUser.role,
        status: "pending",
      });
    } catch (err) {
      console.error("Erreur sauvegarde invitation Supabase:", err);
    }

    const added: SystemUser = {
      id: `usr-${Date.now()}`,
      name: newUser.name,
      email: email,
      username: newUser.username || email.split("@")[0],
      role: newUser.role,
      role_label: newUser.role_label,
      scope: newUser.scope,
      created_at: new Date().toISOString().split("T")[0],
      last_login: "En attente d'activation par l'utilisateur",
      status: "actif",
    };

    setUsers([added, ...users]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-3xl border-2 border-indigo-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-900 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-7 h-7 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-full">
                ADMINISTRATION SYSTÈME
              </span>
              <span className="text-xs text-slate-400">&bull; Contrôle d&apos;Accès</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 font-serif">
              Comptes Utilisateurs & Niveaux d&apos;Accès
            </h1>
            <p className="text-xs text-slate-500">
              Gestion des profils opérateurs : Direction, Pédagogie, Comptabilité Caisse Lomé et Réception Hôtel
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          <span>Créer un Compte Utilisateur</span>
        </button>
      </div>

      {/* Statistiques Utilisateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Comptes Actifs</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{users.length} comptes</div>
          <div className="text-[10px] text-slate-500 mt-1">100% avec authentification sécurisée</div>
        </div>

        <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-800 text-xs font-black">
            <span>Administrateurs</span>
            <Lock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-950 mt-2">
            {users.filter((u) => u.scope === "Global").length}
          </div>
          <div className="text-[10px] text-indigo-700 font-semibold mt-1">Accès total Direction Générale</div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-800 text-xs font-black">
            <span>Opérateurs École</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2">
            {users.filter((u) => u.scope === "École").length}
          </div>
          <div className="text-[10px] text-blue-700 font-semibold mt-1">Gestion élèves, cours et notes</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
            <span>Opérateurs Hôtel / Caisse</span>
            <Key className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {users.filter((u) => u.scope === "Hôtel" || u.scope === "Finance").length}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Chambres et encaissements Lomé</div>
        </div>
      </div>

      {/* Barre de Recherche */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom, identifiant, email, fonction..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold">{filteredUsers.length} utilisateur(s)</div>
      </div>

      {/* Tableau des Utilisateurs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Utilisateur & Identifiant</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Rôle Attribué</th>
                <th className="py-3.5 px-4">Périmètre / Espace</th>
                <th className="py-3.5 px-4">Dernière Connexion</th>
                <th className="py-3.5 px-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((usr) => (
                <tr key={usr.id} className="hover:bg-indigo-50/20">
                  <td className="py-3 px-4">
                    <div className="font-extrabold text-slate-900">{usr.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">@{usr.username}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{usr.email}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md text-[10px] border border-slate-200">
                      {usr.role_label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        usr.scope === "Global"
                          ? "bg-purple-100 text-purple-900"
                          : usr.scope === "École"
                          ? "bg-blue-100 text-blue-900"
                          : usr.scope === "Hôtel"
                          ? "bg-red-100 text-red-900"
                          : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      {usr.scope.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{usr.last_login}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                      Actif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création Utilisateur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="text-lg font-black text-indigo-950">Créer un Compte Utilisateur</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom & Titre de l&apos;Opérateur *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Chef Réceptionniste Avenida"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="form-input-avenida"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom d&apos;utilisateur (login)</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: reception_lome"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="form-input-avenida"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rôle Système</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      const labels: Record<string, string> = {
                        super_admin: "Super Administrateur",
                        direction: "Direction Générale",
                        administration: "Administration Scolaire",
                        responsable_pedagogique: "Responsable Pédagogique",
                        comptable: "Comptable Caisse",
                        responsable_hotel: "Responsable Hôtel",
                      };
                      setNewUser({
                        ...newUser,
                        role: r,
                        role_label: labels[r] || "Opérateur",
                      });
                    }}
                    className="form-input-avenida"
                  >
                    <option value="administration">Administration Scolaire</option>
                    <option value="responsable_pedagogique">Responsable Pédagogique</option>
                    <option value="comptable">Comptable Caisse</option>
                    <option value="responsable_hotel">Responsable Hôtel</option>
                    <option value="direction">Direction Générale</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Périmètre Autorisé</label>
                  <select
                    value={newUser.scope}
                    onChange={(e) => setNewUser({ ...newUser, scope: e.target.value as any })}
                    className="form-input-avenida"
                  >
                    <option value="École">Espace École Uniquement</option>
                    <option value="Hôtel">Espace Hôtel Uniquement</option>
                    <option value="Finance">Finances & Caisse Uniquement</option>
                    <option value="Global">Accès Global (Tout)</option>
                  </select>
                </div>
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
                  className="px-5 py-2 bg-indigo-900 text-white font-bold rounded-xl shadow-md"
                >
                  Créer le Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
