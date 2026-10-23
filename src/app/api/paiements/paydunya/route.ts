import { createHash, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { adminClient, paydunyaMasterKey, verifyPayment, verifySchoolPayment } from "@/lib/payments";

/**
 * Endpoint IPN PayDunya (notification instantanée de paiement) :
 * https://www.hotelecoleavenida.net/api/paiements/paydunya
 * PayDunya envoie le formulaire data[...] ; data[hash] doit être le SHA-512 de la clé principale (MASTER KEY),
 * puis la facture est confirmée auprès de PayDunya avant d'encaisser (réservations de l'hôtel, frais d'inscription et écolage).
 */
export async function POST(request: NextRequest) {
  const form = new URLSearchParams(await request.text());
  const hash = form.get("data[hash]") ?? "";
  const invoiceToken = form.get("data[invoice][token]") ?? form.get("data[token]") ?? "";
  const master = paydunyaMasterKey();
  if (!master) return NextResponse.json({ ok: true });

  const expected = createHash("sha512").update(master).digest("hex");
  if (hash.length !== expected.length || !timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) {
    return NextResponse.json({ error: "notification non reconnue" }, { status: 401 });
  }
  if (!invoiceToken) return NextResponse.json({ ok: false });
  const admin = adminClient();
  // Réservation de l'hôtel, sinon frais d'inscription ou écolage
  const { data: pay } = (await admin?.from("reservation_payments").select("identifier").eq("provider", "paydunya").eq("provider_ref", invoiceToken).maybeSingle()) ?? { data: null };
  if (pay?.identifier) return NextResponse.json({ ok: (await verifyPayment(pay.identifier)).ok });
  const { data: school } = (await admin?.from("school_payments").select("identifier").eq("provider_ref", invoiceToken).maybeSingle()) ?? { data: null };
  if (school?.identifier) return NextResponse.json({ ok: (await verifySchoolPayment(school.identifier)).ok });
  return NextResponse.json({ ok: false });
}

// Vérification de disponibilité de l'adresse par PayDunya
export function GET() {
  return NextResponse.json({ ok: true, service: "IPN PayDunya · Hôtel École Avenida" });
}
