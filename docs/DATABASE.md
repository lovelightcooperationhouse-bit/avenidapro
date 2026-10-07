# AVENIDA MANAGEMENT — Modèle de Données PostgreSQL & Architecture Supabase

## 1. Principes & Conventions
- **Identifiants** : `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **Horodatage** : `created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL`, `updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL`
- **Traçabilité** : `created_by UUID REFERENCES profiles(id)`, `updated_by UUID REFERENCES profiles(id)`
- **Monnaie** : Type `BIGINT` (en Francs CFA / XOF) pour interdire tout arrondi flottant imprécis.
- **Suppression logique** : `is_archived BOOLEAN DEFAULT FALSE`, `archived_at TIMESTAMPTZ`
- **Row-Level Security (RLS)** : Activé sur 100% des tables avec politiques granulaires.

---

## 2. Dictionnaire des Tables par Domaine Métier

### 2.1 DOMAINE SYSTÈME & UTILISATEURS (RBAC & Audit)
1. **`roles`** : Liste des rôles système (`super_admin`, `direction`, `administration`, `responsable_pedagogique`, `responsable_financier`, `responsable_hotel`, `ressources_humaines`, `professeur`, `personnel_hotel`, `comptable`, `eleve`).
2. **`permissions`** : Droits granulaires (ex: `students.create`, `grades.edit`, `salaries.view`, `rooms.manage`, `finance.export`).
3. **`role_permissions`** : Table de liaison N-N entre rôles et permissions.
4. **`profiles`** : Profil utilisateur étendu lié à `auth.users(id)`.
   - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `first_name TEXT NOT NULL`, `last_name TEXT NOT NULL`
   - `email TEXT UNIQUE NOT NULL`, `phone TEXT`
   - `avatar_url TEXT`, `is_active BOOLEAN DEFAULT TRUE`
5. **`user_roles`** : Assignation des rôles aux utilisateurs (`user_id`, `role_id`).
6. **`audit_logs`** : Journal d'audit immuable.
   - `id UUID`, `user_id UUID`, `action TEXT`, `table_name TEXT`, `record_id UUID`
   - `old_values JSONB`, `new_values JSONB`, `ip_address TEXT`, `user_agent TEXT`, `created_at`
7. **`system_settings`** : Configuration globale clé-valeur (informations établissement, devises, logos, quotas).

---

### 2.2 DOMAINE ÉCOLE & FORMATION
8. **`academic_years`** : Années scolaires (ex: `2024-2025`, `2026-2027`, date début, date fin, `is_current BOOLEAN`).
9. **`school_departments`** : Départements pédagogiques (ex: Hôtellerie, Restauration, Gestion hôtelière).
10. **`programs`** : Formations & Diplômes d'État (CFA, CAP, BEP, BT, BTS, Formation continue, Modulaire).
    - `code TEXT UNIQUE` (ex: `CFA`, `CAP`, `BEP`, `BT`, `BTS`)
    - `name TEXT NOT NULL`
    - `duration_years INT`
    - `min_entry_level TEXT` (ex: 4ème/3ème, BEPC, BAC/BT)
    - `annual_tuition BIGINT` (ex: 260 000, 330 000, 420 000 FCFA)
    - `registration_fee BIGINT` (ex: 10 000, 20 000 FCFA)
    - `supplies_fee BIGINT` (ex: 45 000, 75 000 FCFA)
11. **`classes`** : Classes d'élèves (ex: `BEP1-Cuisine`, `BTS2-Hébergement`).
    - `id UUID`, `academic_year_id UUID`, `program_id UUID`, `name TEXT`, `room_number TEXT`
12. **`subjects`** : Matières d'enseignement (ex: Pratique culinaire, Technologie hôtelière, Gestion des stocks, Anglais hôtelier).
13. **`class_subjects`** : Matières dispensées par classe avec coefficient, quota horaire.
14. **`teachers`** : Fiche des enseignants (lié à `profiles(id)` ou indépendant).
    - `matricule TEXT UNIQUE`, `specialty TEXT`, `diploma TEXT`, `hire_date DATE`, `contract_type TEXT`, `hourly_rate BIGINT`
15. **`teacher_subjects`** & **`teacher_classes`** : Assignation des cours et classes aux professeurs.

---

### 2.3 DOMAINE ÉLÈVES & ADMISSIONS
16. **`students`** : Fiche signalétique complète de l'élève (conforme carnet Avenida).
    - `id UUID PRIMARY KEY`, `registration_number TEXT UNIQUE` (ex: `814AVN-24`)
    - `student_number TEXT`
    - `first_name TEXT`, `last_name TEXT`, `gender TEXT` (M/F)
    - `birth_date DATE`, `birth_place TEXT`, `nationality TEXT`
    - `residence_neighborhood TEXT` (Quartier de résidence)
    - `phone TEXT`, `email TEXT`
    - `boarder_status TEXT` (`interne` / `externe`)
    - `emergency_contact_name TEXT` (Personne à prévenir)
    - `emergency_contact_phone TEXT`
    - `current_class_id UUID REFERENCES classes(id)`
    - `photo_url TEXT`, `status TEXT` (`actif`, `abandon`, `diplômé`, `exclu`)
17. **`guardians`** : Tuteurs / Parents d'élèves (nom, profession, téléphone, adresse, CIN/passeport).
18. **`student_guardians`** : Relation élève-parent avec lien de parenté (Père, Mère, Tuteur).
19. **`admissions`** : Dossiers de candidature et suivi de validation (dépôt, pièces justificatives, statut).
20. **`student_documents`** : Fichiers stockés dans Supabase Storage (acte de naissance, certificat médical, relevés, photos d'identité).
21. **`student_history`** : Historique académique et changements de classe/statut.

---

### 2.4 DOMAINE VIE SCOLAIRE & CARNET DE CORRESPONDANCE
22. **`student_attendance`** : Feuilles de présence quotidiennes par séance de cours.
23. **`student_absences`** : Billets d'absence numérotés (du... au..., motif, visa vie scolaire, justification des parents).
24. **`student_lates`** : Billets de retard numérotés (durée, motif, orientation: en classe / en permanence, visa).
25. **`student_permissions`** : Autorisations de sortie et dispenses.
26. **`correspondence_logs`** : Messages du carnet de correspondance, remarques disciplinaires et sanctions.

---

### 2.5 DOMAINE ÉVALUATIONS & EXAMENS
27. **`exams`** : Sessions d'examens (Contrôles continus, partiels, examens de fin d'année, examens blancs d'État).
28. **`grades`** : Notes chiffrées par élève, matière, devoir et période (semestre/trimestre).
29. **`report_cards`** : Bulletins de notes générés avec moyenne générale, rang, appréciations et visas.

---

### 2.6 DOMAINE ÉCOLAGES & SCOLARITÉ FINANCIÈRE
30. **`fee_types`** : Types de frais (Inscription, Scolarité tranche 1..8, Fournitures, Internat, Caution internat).
31. **`fee_assignments`** : Échéancier personnalisé calculé par élève pour l'année scolaire.
32. **`fee_payments`** : Règlements enregistrés (référence ex: `#AV2022-3486`).
    - `amount BIGINT`, `payment_method TEXT` (Espèces, Stripe, Virement, Mobile Money)
    - `depositor_name TEXT`, `depositor_id_card TEXT`, `depositor_role TEXT`
    - `site TEXT DEFAULT 'LOMÉ'`
    - `status TEXT` (`validé`, `en_attente`, `annulé`)
33. **`payment_receipts`** : Reçus officiels avec numérotation infalsifiable et signature caisse.

---

### 2.7 DOMAINE HÔTEL & HÉBERGEMENT
34. **`room_types`** : Types de chambres (Standard, Confort, Suite junior, Suite présidentielle, capacité, tarifs FCFA).
35. **`rooms`** : Chambres physiques.
    - `room_number TEXT UNIQUE`, `floor INT`, `type_id UUID`
    - `status TEXT` (`disponible`, `occupée`, `réservée`, `nettoyage`, `maintenance`, `hors_service`)
36. **`hotel_customers`** : Fiche client hôtel (nom, nationalité, pièce d'identité/passeport, téléphone, email).
37. **`reservations`** : Réservations de séjours.
    - `customer_id UUID`, `room_id UUID`, `check_in_date TIMESTAMPTZ`, `check_out_date TIMESTAMPTZ`
    - `adults_count INT`, `children_count INT`, `total_price BIGINT`, `advance_amount BIGINT`, `status TEXT`
38. **`check_ins`** & **`check_outs`** : Horodatage d'arrivée et départ effectifs avec état des lieux.
39. **`hotel_services`** : Prestations annexes (restaurant, blanchisserie, bar, mini-bar, salle de conférence).
40. **`hotel_invoices`** & **`hotel_invoice_items`** : Factures hôtelières pro-forma et définitives.

---

### 2.8 DOMAINE RESSOURCES HUMAINES & PAIE
41. **`employee_departments`** : Départements RH (Direction, Administration, Réception, Hébergement, Cuisine, Restaurant, Entretien, Maintenance, Sécurité, Comptabilité, Pédagogie).
42. **`employees`** : Fiches employés complètes.
    - `matricule TEXT UNIQUE`, `first_name TEXT`, `last_name TEXT`, `email TEXT`, `phone TEXT`
    - `department_id UUID`, `position TEXT`, `contract_type TEXT` (CDI, CDD, Stage, Vacataire)
    - `base_salary BIGINT`, `hire_date DATE`, `status TEXT` (`actif`, `suspendu`, `sorti`)
43. **`employee_contracts`** : Contrats de travail et avenants.
44. **`employee_documents`** : CVs, diplômes, certificats médicaux, pièces d'identité.
45. **`employee_attendance`** : Pointages arrivées/départs du personnel.
46. **`leave_requests`** : Demandes de congés (payés, maladie, maternité, sans solde) avec workflow de validation.
47. **`salary_records`** : Fiches de paie mensuelles.
    - `employee_id UUID`, `period_month INT`, `period_year INT`
    - `base_salary BIGINT`, `bonuses BIGINT`, `overtime_pay BIGINT`, `deductions BIGINT`, `net_salary BIGINT`
    - `status TEXT` (`pending`, `partial`, `paid`)
48. **`salary_payments`** : Règlements effectifs des salaires avec référence et justificatif.

---

### 2.9 DOMAINE GESTION DES STOCKS & ÉCONOMAT
49. **`product_categories`** : Catégories d'articles (Alimentaire, Boissons, Produits d'entretien, Lingerie/Textile, Fournitures scolaires).
50. **`products`** : Articles en stock.
    - `sku TEXT UNIQUE`, `name TEXT`, `category_id UUID`, `unit TEXT` (kg, litre, paquet, unité)
    - `current_quantity NUMERIC`, `minimum_stock_alert NUMERIC`, `average_cost_price BIGINT`
51. **`suppliers`** : Fournisseurs et prestataires (ex: partenaires fournitures, grossistes alimentaires).
52. **`purchases`** & **`purchase_items`** : Bons de commande et factures d'achat.
53. **`stock_movements`** : Mouvements de stock traçables (`ENTRÉE`, `SORTIE_CUISINE`, `SORTIE_HOTEL`, `PERTE`, `INVENTAIRE`).
54. **`inventory_sessions`** : Sessions d'inventaire physique périodique.

---

### 2.10 DOMAINE FINANCES GÉNÉRALES & TRÉSORERIE
55. **`expenses`** : Dépenses de fonctionnement (loyer, électricité, maintenance, fournitures, salaires).
56. **`revenues`** : Recettes globales (scolarité, hébergement hôtel, restauration, location d'espaces).
57. **`invoices`** & **`invoice_items`** : Facturation globale de l'établissement.
58. **`payment_transactions`** : Registre unifié de toutes les transactions financières (scolaires, hôtelières et externes) alimentant la comptabilité.
