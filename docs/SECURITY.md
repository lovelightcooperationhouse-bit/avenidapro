# AVENIDA MANAGEMENT — Stratégie de Sécurité Applicative & Données

## 1. Principes de Sécurité en Profondeur (Defense in Depth)

### 1.1 Séparation Client / Serveur & Gestion des Secrets
- Les variables d'environnement sont strictement cloisonnées :
  - `NEXT_PUBLIC_*` : uniquement l'URL Supabase et la clé anonyme publique Supabase, ainsi que la clé publiable Stripe.
  - `SUPABASE_SERVICE_ROLE_KEY` et `STRIPE_SECRET_KEY` : **strictement interdites côté client**. Elles sont uniquement consommées dans des API routes / Server Actions exécutées sur le runtime Node.js sécurisé.
- Pas de bypass client : toutes les vérifications de droits frontend (masquage de boutons) sont doublées par des vérifications serveur incontournables.

### 1.2 Authentification & Gestion de Session
- Intégration via `@supabase/ssr` avec cookies `httpOnly`, `secure`, `sameSite: 'lax'`.
- Middleware Next.js qui intercepte chaque requête vers `/dashboard/*` pour valider la session active et rediriger automatiquement vers `/login` avec paramètre `redirectedFrom`.
- Refresh automatique des tokens JWT expirés via les cookies de session.

---

## 2. Row-Level Security (RLS) PostgreSQL
- **RLS activé systématiquement** sur 100% des tables dès leur création (`ALTER TABLE x ENABLE ROW LEVEL SECURITY;`).
- Aucune politique `USING (true)` générique sur les tables de production.
- Utilisation de fonctions stockées Postgres de sécurité avec cache de session :
  - `auth.is_admin()`
  - `auth.user_has_role(VARIADIC text[])`
  - `auth.get_current_student_id()`
  - `auth.get_current_employee_id()`

---

## 3. Stockage Sécurisé des Fichiers (Supabase Storage)
Buckets de stockage avec politiques d'accès restrictives :
1. `student-documents` : Privé. Seuls l'élève concerné, les tuteurs et le pôle administration/direction peuvent lire.
2. `employee-documents` : Privé. Seuls le salarié et les RH/Direction peuvent lire.
3. `teacher-cvs` : Privé. Accessible RH et Direction.
4. `profile-photos` : Public en lecture (CDN), écriture restreinte au titulaire du compte.
5. `generated-documents` : Privé. Reçus officiels et bulletins de notes accessibles uniquement aux personnes habilitées via URLs signées temporaires (validité 15 min).

### Validation des Uploads :
- Whitelist stricte des types MIME : `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
- Contrôle de la taille maximale (5 Mo pour les images, 15 Mo pour les PDF).
- Renommage côté serveur avec UUID non prédictibles pour éviter tout écrasement ou injection de chemin.

---

## 4. Sécurité des Paiements & Webhooks Stripe
- **Source de Vérité Unique** : Les règlements en ligne ne sont confirmés QUE par la réception et la validation cryptographique du webhook (`stripe.webhooks.constructEvent(body, signature, secret)`).
- **Idempotence & Prévention des Doublons** : Table d'idempotence enregistrant le `payment_intent_id` ou `event_id` Stripe. Tout événement déjà traité est acquitté immédiatement sans double écriture comptable.
- **Transactions Atomiques** : L'enregistrement du paiement, la mise à jour de l'échéancier élève et la génération du reçu comptable s'exécutent au sein d'une même transaction PostgreSQL.

---

## 5. Journalisation d'Audit Immuable (`audit_logs`)
- Un trigger PostgreSQL capture automatiquement chaque `INSERT`, `UPDATE`, `DELETE` sur les tables critiques (`fee_payments`, `salary_records`, `grades`, `hotel_invoices`, `user_roles`).
- Enregistrement de :
  - L'identifiant utilisateur (`user_id`).
  - L'action effectuée et la table ciblée.
  - L'état avant modification (`old_values`) et après modification (`new_values`).
  - L'adresse IP et l'agent utilisateur.
  - La table `audit_logs` est en écriture seule (aucun `UPDATE` ou `DELETE` autorisé).
