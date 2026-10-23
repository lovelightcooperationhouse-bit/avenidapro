import { NextResponse, type NextRequest } from "next/server";
import { confirmKkiapay } from "@/lib/payments";

/** Fin de paiement dans la fenêtre KkiaPay : la transaction est vérifiée côté serveur avant d'encaisser. */
export async function POST(request: NextRequest) {
  const { identifier, transactionId } = (await request.json().catch(() => ({}))) as { identifier?: string; transactionId?: string };
  const r = await confirmKkiapay(identifier ?? "", transactionId ?? "");
  return NextResponse.json({ ok: r.ok, pending: "pending" in r ? r.pending : false });
}
