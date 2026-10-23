import { timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { confirmKkiapay } from "@/lib/payments";

/**
 * Webhook KkiaPay — à déclarer dans le tableau de bord KkiaPay (Développeurs → Webhook) :
 * https://www.hotelecoleavenida.net/api/paiements/kkiapay
 * avec le même secret que KKIAPAY_WEBHOOK_SECRET. Rattrape les paiements dont le client a fermé la page trop tôt ;
 * la transaction est toujours revérifiée auprès de KkiaPay avant d'encaisser.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.KKIAPAY_WEBHOOK_SECRET ?? "";
  const received = request.headers.get("x-kkiapay-secret") ?? "";
  if (secret && (secret.length !== received.length || !timingSafeEqual(Buffer.from(secret), Buffer.from(received)))) {
    return NextResponse.json({ error: "webhook non reconnu" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { transactionId?: string; partnerId?: string; stateData?: { partnerId?: string } };
  const identifier = body.partnerId ?? body.stateData?.partnerId ?? "";
  if (!identifier || !body.transactionId) return NextResponse.json({ ok: false });
  const r = await confirmKkiapay(identifier, body.transactionId);
  return NextResponse.json({ ok: r.ok });
}
