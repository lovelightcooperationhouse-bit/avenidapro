# AVENIDA MANAGEMENT — Matrice des Rôles et Permissions (RBAC & RLS)

## 1. Rôles Système Définis
La plateforme implémente **11 rôles hiérarchiques et opérationnels** :

| Code Rôle | Intitulé Français | Description & Périmètre |
| :--- | :--- | :--- |
| `super_admin` | Super Administrateur | Accès total technique et fonctionnel, audit logs, configuration système. |
| `direction` | Direction Générale | Vue globale stratégique, validation des budgets, rapports de direction. |
| `administration` | Administration Scolaire | Gestion des inscriptions, classes, filières, dossiers élèves et documents. |
| `responsable_pedagogique`| Directeur des Études | Gestion des plannings, matières, examens, notes, assiduité et professeurs. |
| `responsable_financier` | Responsable Financier | Gestion globale de la trésorerie, clôtures, budgets, validation des dépenses. |
| `responsable_hotel` | Directeur Hôtelier | Gestion intégrale de l'hébergement, des chambres, réservations et stocks hôtel. |
| `ressources_humaines` | RH / Gestion du Personnel| Gestion des contrats, congés, pointage, dossiers salariés et salaires. |
| `professeur` | Enseignant | Saisie des notes, appel des présences/retards/absences de ses classes. |
| `personnel_hotel` | Réceptionniste / Agent d'étage | Check-in, check-out, statut ménage/chambre, réservations courantes. |
| `comptable` | Comptable / Caissier | Encaissement des écolages, émission des reçus, saisie des dépenses et factures. |
| `eleve` | Élève / Tuteur | Espace personnel (notes, planning, solde écolage, carnet de correspondance). |

---

## 2. Matrice Droits / Domaines Métiers

| Domaine / Module | `super_admin` | `direction` | `administration` | `resp_pedago` | `resp_finance` | `resp_hotel` | `rh` | `professeur` | `perso_hotel` | `comptable` | `eleve` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Utilisateurs & Droits** | Total | Lecture | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun |
| **Configuration Établissement**| Total | Lecture | Modification | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun |
| **Élèves & Inscriptions** | Total | Lecture | Total | Modification | Lecture | Aucun | Aucun | Lecture (ses cours)| Aucun | Lecture | Lecture (soi-même) |
| **Pédagogie, Classes & Examens**| Total | Lecture | Modification | Total | Aucun | Aucun | Aucun | Saisie notes/cours | Aucun | Aucun | Lecture (ses notes) |
| **Présences & Absences Élèves**| Total | Lecture | Total | Total | Aucun | Aucun | Aucun | Saisie appel | Aucun | Aucun | Lecture (ses billets) |
| **Carnet de Correspondance** | Total | Lecture | Total | Total | Aucun | Aucun | Aucun | Écriture visa | Aucun | Aucun | Lecture & Justif |
| **Écolages & Reçus Scolaires** | Total | Total | Lecture | Aucun | Total | Aucun | Aucun | Aucun | Aucun | Encaissement | Lecture (ses reçus) |
| **Gestion Hôtelière & Chambres** | Total | Total | Aucun | Aucun | Lecture | Total | Aucun | Aucun | Opérations courantes| Facturation | Aucun |
| **Réservations Clients** | Total | Total | Aucun | Aucun | Lecture | Total | Aucun | Aucun | Saisie & Check-in | Facturation | Aucun |
| **Stocks & Économat** | Total | Lecture | Aucun | Aucun | Lecture | Modification | Aucun | Aucun | Demande matériel | Lecture | Aucun |
| **Ressources Humaines** | Total | Total | Aucun | Aucun | Lecture | Lecture | Total | Aucun | Aucun | Aucun | Aucun |
| **Salaires & Paie** | Total | Total | Aucun | Aucun | Total | Aucun | Modification | Aucun (ses fiches) | Aucun (ses fiches)| Lecture | Aucun |
| **Comptabilité & Trésorerie** | Total | Total | Aucun | Aucun | Total | Aucun | Aucun | Aucun | Aucun | Saisie dépenses | Aucun |
| **Audit Logs** | Total | Lecture | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun | Aucun |

---

## 3. Politiques RLS (PostgreSQL Row Level Security)
Chaque table sensible est protégée par une fonction PostgreSQL `auth.user_has_role(TEXT[])` ou `auth.user_has_permission(TEXT)` qui décode le jeton JWT et valide la table `user_roles`.

### Exemples de Politiques Clés :
1. **Écolages (`fee_payments`)** :
   - `SELECT` : Rôles `super_admin`, `direction`, `responsable_financier`, `comptable` OU élève pour ses propres paiements (`student_id IN (SELECT id FROM students WHERE profile_id = auth.uid())`).
   - `INSERT / UPDATE` : Uniquement `comptable`, `responsable_financier`, `super_admin`.
2. **Salaires (`salary_records`)** :
   - `SELECT` : Rôles `super_admin`, `direction`, `responsable_financier`, `ressources_humaines` OU l'employé pour sa propre fiche (`employee_id IN (SELECT id FROM employees WHERE profile_id = auth.uid())`).
   - `INSERT / UPDATE` : Uniquement `ressources_humaines`, `responsable_financier`, `super_admin`.
3. **Notes (`grades`)** :
   - `SELECT` : Direction, Pédagogie, Professeurs de la classe, Élève propriétaire.
   - `INSERT / UPDATE` : Professeur assigné à la matière/classe ou Directeur des Études.
