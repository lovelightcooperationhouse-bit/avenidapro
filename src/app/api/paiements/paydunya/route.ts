import { NextResponse } from "next/server";

/**
 * Endpoint IPN PayDunya (notification instantanée de paiement) :
 * https://www.hotelecoleavenida.net/api/paiements/paydunya
 * Déclaré auprès de PayDunya pour obtenir les clés API. Le traitement des paiements (vérification du hash
 * avec la clé principale, puis confirmation de la facture auprès de PayDunya) sera branché avec les clés.
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}

// Vérification de disponibilité de l'adresse par PayDunya
export function GET() {
  return NextResponse.json({ ok: true, service: "IPN PayDunya · Hôtel École Avenida" });
}
