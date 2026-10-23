import { timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { adminClient, verifyPayment } from "@/lib/payments";

/**
 * Notification de paiement CinetPay (notify_url, transmise à chaque paiement) :
 * https://www.hotelecoleavenida.net/api/paiements/cinetpay
 * Contenu : notify_token, merchant_transaction_id, transaction_id. Le jeton doit correspondre à celui reçu
 * à la création du paiement, puis le statut est redemandé à CinetPay avant d'encaisser.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    body = Object.fromEntries(new URLSearchParams(raw));
  }
  const id = String(body.merchant_transaction_id ?? "");
  const received = String(body.notify_token ?? "");
  if (!id) return NextResponse.json({ error: "transaction manquante" }, { status: 400 });

  const { data: pay } = (await adminClient()?.from("reservation_payments").select("raw").eq("identifier", id).maybeSingle()) ?? { data: null };
  const expected = String((pay?.raw as { notify_token?: string } | null)?.notify_token ?? "");
  if (expected && (expected.length !== received.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(received)))) {
    return NextResponse.json({ error: "notification non reconnue" }, { status: 401 });
  }
  const r = await verifyPayment(id);
  return NextResponse.json({ ok: r.ok });
}

// Vérification de disponibilité de l'adresse
export function GET() {
  return NextResponse.json({ ok: true });
}
