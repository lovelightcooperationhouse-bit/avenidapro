# AVENIDA MANAGEMENT — Architecture du Système & Espaces Métiers

## 1. Identité Visuelle & Charte Graphique Officielle
Conformément aux documents officiels de l'établissement (**Hôtel École Avenida — Lomé, Togo**), l'identité repose sur un triptyque tricolore strict :
- 🔵 **BLEU AVENIDA (`#0C356A`)** : Couleur institutionnelle, académique, symbolisant la rigueur, la formation et la discipline.
- 🔴 **ROUGE AVENIDA (`#DC2626`)** : Couleur emblématique du monogramme **HA**, de la marque **AVENIDA**, de l'hospitalité, de l'accueil hôtelier et de l'énergie.
- ⚪ **BLANC PUR (`#FFFFFF`)** : Clarté, lisibilité documentaire, transparence de gestion et professionnalisme.
- **Logo Officiel** : Cadre incliné bleu roi, palmier togolais en bleu à la base, monogramme stylisé **HA** en rouge vif au centre, surmontant la mention *"HÔTEL ÉCOLE"* (bleu) et *"AVENIDA"* (rouge). Devise : *« Travail – Discipline – Excellence »*.

---

## 2. Démarcation Stricte : Pôle École vs Pôle Hôtel

La plateforme élimine toute confusion en séparant radicalement les flux métiers, les terminologies et les écrans opérationnels :

```
                                  +-----------------------------+
                                  |     AVENIDA MANAGEMENT      |
                                  |  (Bleu • Rouge • Blanc)     |
                                  +-----------------------------+
                                                 |
         +---------------------------------------+---------------------------------------+
         |                                                                               |
         v                                                                               v
+-----------------------------------+                           +-----------------------------------+
|     ESPACE ÉCOLE & FORMATION      |                           |     ESPACE HÔTEL & HÉBERGEMENT    |
|       (Identité BLEU ROI)         |                           |       (Identité ROUGE VIF)        |
+-----------------------------------+                           +-----------------------------------+
| • Cycles : CFA, CAP, BEP, BT, BTS |                           | • Chambres : Standard, Confort,   |
| • Fiche Signalétique de l'Élève   |                           |   Suites Junior & Présidentielle  |
| • Carnet de Correspondance :      |                           | • Front-Desk : Check-in/Check-out |
|   - Billets d'Absence (visa/motifs|                           | • Fichier Clients & Séjours       |
|   - Billets de Retard (classe/perm|                           | • Gouvernance & Statut Ménage     |
| • Écolages & Tranches (1 à 8)     |                           | • Facturation Séjours & Services  |
| • Reçus d'encaissement #AV2022    |                           | • Approvisionnement Hôtelier      |
| • Examens, Matières & Bulletins   |                           |                                   |
+-----------------------------------+                           +-----------------------------------+
         \                                                                               /
          \                                                                             /
           +---------------------------------------------------------------------------+
                                                 |
                                                 v
                               +-----------------------------------+
                               |   ESPACE DIRECTION & FINANCES     |
                               |      (Synthèse Consolidée)        |
                               +-----------------------------------+
                               | • Balance Globale Trésorerie      |
                               | • Ressources Humaines & Salaires  |
                               | • Économat & Stocks Centralisés   |
                               | • Journal d'Audit & Sécurité      |
                               +-----------------------------------+
```

---

## 3. Les 3 Espaces Essentiels du Tableau de Bord

Pour permettre aux utilisateurs de s'orienter immédiatement :

### 3.1 Espace 1 : ÉCOLE & VIE SCOLAIRE (Thème BLEU)
- **Objectif** : Pilotage complet de l'académie et des promotions.
- **Indicateurs Clés** :
  - Nombre total d'apprenants inscrits.
  - Taux d'assiduité du jour (présents, absents, retards).
  - Encaissement des écolages vs Reste à recouvrer.
- **Raccourcis Opérationnels** :
  - *Fiche Signalétique Élève* (Dossier 360° avec contact urgence).
  - *Billet de Vie Scolaire* (Absence & Retard conforme carnet officiel).
  - *Caisse Écolages* (Tranches 1..8 avec émission de reçu Duplicata).

### 3.2 Espace 2 : HÔTELLERIE & CLIENTÈLE (Thème ROUGE)
- **Objectif** : Pilotage du parc de chambres, de l'hébergement et de la clientèle.
- **Indicateurs Clés** :
  - Taux d'occupation en direct (% et ratio chambres).
  - Départs et arrivées du jour (Check-in / Check-out).
  - Recettes hébergement et nuitées vendues.
- **Raccourcis Opérationnels** :
  - *Grille des Chambres* (Disponible, Occupée, Réservée, Nettoyage, Maintenance).
  - *Check-in express* et assignation client.
  - *Facturation hôtelière*.

### 3.3 Espace 3 : DIRECTION, RH & FINANCES (Thème CONSOLIDÉ)
- **Objectif** : Vision stratégique globale de la Direction Générale.
- **Indicateurs Clés** :
  - Trésorerie consolidée (Écolages + Recettes Hôtel - Dépenses).
  - Effectif du personnel (Présents, Congés, Enseignants vacataires).
  - Alertes de stock économat (Cuisine pédagogique & Hôtel).

---

## 4. Stack & Implémentation
- **Framework** : Next.js 15 (App Router, Server Components).
- **Style** : Tailwind CSS avec tokens `#0C356A` (Bleu), `#DC2626` (Rouge) et `#FFFFFF` (Blanc).
- **Backend** : Supabase (PostgreSQL 16+, Auth SSR, RLS, Storage, Realtime).
- **Devise** : Franc CFA (XOF) en montants entiers stricts.
