import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { verifyPayment } from "@/lib/payments";

/**
 * Webhook Stripe (événement checkout.session.completed) — adresse à déclarer dans Stripe :
 * https://www.hotelecoleavenida.net/api/paiements/stripe
 * Signature vérifiée avec STRIPE_WEBHOOK_SECRET, puis paiement revérifié auprès de Stripe.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await request.text();
  const header = request.headers.get("stripe-signature") ?? "";
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  if (!secret || !parts.t || !parts.v1) return NextResponse.json({ error: "signature manquante" }, { status: 400 });
  const expected = createHmac("sha256", secret).update(`${parts.t}.${raw}`).digest("hex");
  const valid = expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  if (!valid || Math.abs(Date.now() / 1000 - Number(parts.t)) > 600) return NextResponse.json({ error: "signature invalide" }, { status: 400 });

  const event = JSON.parse(raw) as { type: string; data: { object: { client_reference_id?: string } } };
  if (event.type === "checkout.session.completed" && event.data.object.client_reference_id) await verifyPayment(event.data.object.client_reference_id);
  return NextResponse.json({ received: true });
}
