import { NextResponse, type NextRequest } from "next/server";
import { verifyPayment } from "@/lib/payments";

/**
 * Notification de PayGate Global (Mixx by Yas, Moov Money) — adresse à déclarer dans l'espace marchand PayGate :
 * https://www.hotelecoleavenida.net/api/paiements/paygate
 * Le contenu reçu n'est pas cru sur parole : le statut est redemandé à PayGate avant d'encaisser.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  let identifier = "";
  try {
    identifier = (JSON.parse(raw) as { identifier?: string }).identifier ?? "";
  } catch {
    identifier = new URLSearchParams(raw).get("identifier") ?? "";
  }
  if (!identifier) return NextResponse.json({ error: "identifiant manquant" }, { status: 400 });
  const r = await verifyPayment(identifier);
  return NextResponse.json({ ok: r.ok });
}
