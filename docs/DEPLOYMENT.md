# AVENIDA MANAGEMENT — Guide de Déploiement Vercel & Production

## 1. Prérequis d'Infrastructure
1. **Dépôt Git** : GitHub repository configuré avec branche `main` protégée.
2. **Projet Supabase Cloud** : Projet PostgreSQL hébergé avec schémas de migrations appliqués.
3. **Compte Vercel Pro / Hobby** : Connecté au dépôt GitHub.
4. **Compte PayDunya** : clés de production (MASTER, PRIVATE, TOKEN) ; IPN `/api/paiements/paydunya`.

---

## 2. Variables d'Environnement Requises

| Variable | Description | Emplacement |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | URL racine de l'application (ex: `https://avenida-management.vercel.app`) | Client / Serveur |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de l'instance Supabase | Client / Serveur |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase (publique avec RLS) | Client / Serveur |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète administrative Supabase (Server Actions uniquement) | Serveur uniquement |
| `PAYDUNYA_MASTER_KEY` / `PAYDUNYA_PRIVATE_KEY` / `PAYDUNYA_TOKEN` | Clés de production PayDunya | Serveur uniquement |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Code de validation Google Search Console | Client / Serveur |

---

## 3. Workflow de Déploiement Continu (CI/CD)
1. **Validation Locale** :
   ```bash
   npm run lint
   npm run build
   ```
2. **Push sur GitHub** : Déclenche automatiquement le déploiement de prévisualisation (branches secondaires) ou de production (branche `main`) sur Vercel.
3. **IPN PayDunya en production** : `https://www.hotelecoleavenida.net/api/paiements/paydunya`.

---

## 4. Stratégie de Sauvegarde & Reprise d'Activité
- **Sauvegardes Quotidiennes Supabase** : Snapshots automatiques PostgreSQL PITR (Point-in-Time Recovery).
- **Scripts d'Export Comptable** : Tâches planifiées pour générer un dump chiffré des balances scolaires et hôtelières.
