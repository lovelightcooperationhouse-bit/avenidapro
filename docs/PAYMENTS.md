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

1. **`StripePaymentProvider` (Actif)** :
   - Cartes bancaires internationales (Visa, Mastercard) via Stripe Checkout.
   - Conversion ou devise supportée, webhook avec signature `stripe-signature`.
2. **`ManualCashPaymentProvider` (Actif)** :
   - Règlements physiques en caisse à l'agence (ex: Lomé) par espèces, chèque ou virement avec émission directe du reçu numéroté Avenida.
3. **`MobileMoneyProvider` (Extension prête)** :
   - Connecteurs pour les services locaux :
     - **T-Money** (Togo)
     - **Moov Money (Flooz)** (Togo)
     - **Wave / Orange Money**

---

## 4. Idempotence & Intégrité Comptable
- Chaque transaction est verrouillée via un token unique `idempotency_key`.
- Aucun solde n'est crédité via une simple redirection côté client.
- Génération automatique du reçu comptable certifié (conforme à l'en-tête officiel Avenida : Réf `#AV2022-xxxx`, Nom élève, Matricule, Classe, Déposant, Rappel Total / Payé / Reste).
