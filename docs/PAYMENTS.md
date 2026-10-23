# AVENIDA MANAGEMENT — Architecture du Système de Paiement Multi-Fournisseurs

## 1. Principes de Conception
L'Hôtel École Avenida opère en zone UEMOA avec pour devise officielle le **Franc CFA (XOF)**.
L'architecture de paiement sépare rigoureusement :
- La commande commerciale / créance scolaire ou hôtelière (`fee_assignments`, `hotel_invoices`).
- L'ordre de paiement unifié (`payment_orders`).
- L'implémentation spécifique du fournisseur (`PaymentProvider`).

---

## 2. Contrat d'Interface `PaymentProvider`

```typescript
export interface PaymentOrderPayload {
  orderId: string;
  reference: string;
  amount: number; // Montant strict en FCFA
  currency: 'XOF';
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  description: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentInitResult {
  transactionId: string;
  checkoutUrl?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  providerData?: Record<string, any>;
}

export interface IPaymentProvider {
  readonly providerName: string;
  initiatePayment(order: PaymentOrderPayload): Promise<PaymentInitResult>;
  verifyWebhook(headers: Record<string, string>, rawBody: string): Promise<WebhookVerificationResult>;
  refund(transactionId: string, amount: number): Promise<boolean>;
}
```

---

## 3. Fournisseurs Supportés & Prévus

1. **PayDunya (Actif, seul prestataire en ligne)** — `src/lib/payments.ts` :
   - Mixx by Yas (T-Money Togo), Moov Money Togo et carte bancaire (dès validation du compte par PayDunya).
   - Réservations de l'hôtel (`reservation_payments`), frais d'inscription et écolage (`school_payments` → reçu `fee_payments`).
   - IPN `https://www.hotelecoleavenida.net/api/paiements/paydunya` (hash SHA-512 de la clé principale), puis confirmation de la facture auprès de PayDunya avant tout encaissement.
2. **`ManualCashPaymentProvider` (Actif)** :
   - Règlements physiques en caisse à l'agence (ex: Lomé) par espèces, chèque ou virement avec émission directe du reçu numéroté Avenida.

---

## 4. Idempotence & Intégrité Comptable
- Chaque transaction est verrouillée via un token unique `idempotency_key`.
- Aucun solde n'est crédité via une simple redirection côté client.
- Génération automatique du reçu comptable certifié (conforme à l'en-tête officiel Avenida : Réf `#AV2022-xxxx`, Nom élève, Matricule, Classe, Déposant, Rappel Total / Payé / Reste).
