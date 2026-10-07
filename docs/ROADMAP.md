# AVENIDA MANAGEMENT — Roadmap Complète de Développement (Phases 0 à 14)

---

### **PHASE 0 : Architecture & Plan Technique (En cours)**
- [x] Analyse documentaire approfondie (Fiche d'inscription Avenida, Reçus de paiement, Factures réelles de Lomé).
- [x] Définition de l'architecture générale, de la pile technologique et de la topologie système.
- [x] Conception détaillée du modèle relationnel PostgreSQL (58 tables normalisées).
- [x] Matrice RBAC des 11 rôles utilisateurs et politique de sécurité RLS.
- [x] Plan exhaustif des routes App Router et composants modulaires.
- [x] Stratégies de sécurité, de paiement abstrait et de déploiement CI/CD Vercel.

---

### **PHASE 1 : Initialisation Next.js + Supabase + Auth + UI**
- Initialisation de Next.js (App Router, TypeScript, Tailwind CSS, Lucide Icons, shadcn/ui).
- Configuration des clients Supabase SSR (`@supabase/ssr` avec cookies côté serveur).
- Pages d'authentification complètes : Connexion (`/login`), Mot de passe oublié (`/forgot-password`), Réinitialisation.
- Middleware de sécurité Next.js pour la protection des routes privées et le contrôle RBAC.
- Layout maître du Dashboard : Sidebar rétractable, Topbar institutionnelle avec profil, notifications et sélecteur d'année scolaire.

---

### **PHASE 2 : Base de Données & Migrations Supabase**
- Création de la suite complète de migrations SQL PostgreSQL sous `supabase/migrations/`.
- Activation du RLS sur toutes les tables.
- Triggers d'audit automatique (`audit_logs`) et fonctions d'assistance de sécurité.
- Scripts de seed de développement réaliste (formations CFA, CAP, BEP, BT, BTS d'Avenida, utilisateurs de test).

---

### **PHASE 3 : Rôles & Permissions (RBAC Dynamique)**
- Interface de gestion des utilisateurs, rôles et attributions (`/dashboard/users`, `/dashboard/roles`).
- Hooks et helpers de vérification côté client (`useUserPermissions`) et serveur (`requirePermission`).
- Audit de sécurité des accès.

---

### **PHASE 4 : Élèves & Inscriptions (Dossier 360°)**
- Gestion des filières, départements et classes.
- Formulaire d'admission et d'inscription conforme au dossier Avenida.
- Fiche élève 360° (`/dashboard/students/[id]`) : Fiche signalétique, statut interne/externe, contact urgence, tuteurs, historique, pièces jointes.
- Recherche instantanée, filtres multicritères, pagination et export CSV/Excel.

---

### **PHASE 5 : Professeurs & Personnel**
- Fiches enseignants : matricule, matières enseignées, classes assignées, CV, contrat, taux horaire.
- Fiches personnel hôtelier et administratif par département.
- Gestion documentaire RH (contrats, pièces d'identité).

---

### **PHASE 6 : Présences, Absences, Retards & Permissions**
- Module d'appel de classe quotidien pour les professeurs.
- Billets d'absence numérotés avec volet de justification des parents et visa de la vie scolaire.
- Billets de retard avec orientation (classe ou permanence).
- Carnet de correspondance numérique interactif élève/parent/établissement.

---

### **PHASE 7 : Écolages & Paiements Scolaires**
- Configuration des grilles tarifaires par diplôme (CFA: 260k, CAP: 260k, BEP: 330k, BT: 330k, BTS: 420k FCFA).
- Suivi des 8 tranches mensuelles ou 3 trimestrielles.
- Calcul en temps réel : Montant Dû, Montant Encaissé, Reste à Payer.
- Génération et impression des reçus officiels de caisse numérotés avec duplicata.

---

### **PHASE 8 : Salaires & Gestion RH**
- Calcul mensuel de la paie du personnel et des professeurs (base, primes, heures supp, retenues).
- Suivi des statuts de paiement (`pending`, `partial`, `paid`).
- Gestion des congés et des autorisations d'absence du personnel.
- Pointage des arrivées et départs.

---

### **PHASE 9 : Module Hôtelier & Chambres**
- Gestion de l'état du parc de chambres (Disponible, Occupée, Réservée, Nettoyage, Maintenance, Hors service).
- Calendrier interactif des réservations.
- Fiches clients hôtel avec pièces d'identité.
- Processus de Check-in et Check-out avec état des lieux.

---

### **PHASE 10 : Stocks & Finances Générales**
- Économat : gestion des articles (cuisine, hébergement, entretien, fournitures scolaires).
- Bons d'entrée (achats fournisseurs) et bons de sortie (cuisine pédagogique, hôtel).
- Alertes automatiques de franchissement de seuil de stock critique.
- Trésorerie : registre unifié des recettes et des dépenses d'exploitation.

---

### **PHASE 11 : Documents, Moteur PDF & Rapports**
- Génération côté serveur des documents PDF officiels :
  - Reçus d'écolage et factures pro-forma / finales.
  - Cartes d'étudiant avec QR code et matricule.
  - Carnets de correspondance et billets d'absence/retard.
  - Bulletins scolaires officiels et attestations d'inscription.
  - Fiches de paie des employés.

---

### **PHASE 12 : Moteur de Paiement Abstrait & Stripe**
- Implémentation du `StripePaymentProvider` (Checkout Session, Webhooks avec signature).
- Gestion des devises et paiements locaux en ligne.
- Interface prête pour l'adjonction de passerelles Mobile Money (T-Money, Flooz).

---

### **PHASE 13 : Sécurité Avancée, Tests & Audit**
- Tests unitaires et d'intégration (authentification, calculs d'écolage, RLS, webhooks).
- Audit de vulnérabilités et vérification de conformité RGPD / protection des données personnelles.
- Tableaux de bord de surveillance des `audit_logs`.

---

### **PHASE 14 : Déploiement Vercel & Production**
- Finalisation des scripts de build et de typecheck strict (`npm run lint`, `npm run build`).
- Configuration de l'environnement de production Vercel + Supabase Cloud.
- Documentation d'exploitation et guide utilisateur.
