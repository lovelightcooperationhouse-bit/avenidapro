import { NextResponse, type NextRequest } from "next/server";
import { verifySchoolPayment } from "@/lib/payments";

/** Retour de la famille après la page de paiement PayDunya : paiement vérifié, puis espace « Paiements ». */
export async function GET(request: NextRequest) {
  const r = await verifySchoolPayment(request.nextUrl.searchParams.get("id") ?? "");
  const state = r.ok ? "ok" : r.pending ? "en_cours" : "echec";
  const url = new URL(`/espace/paiements?paiement=${state}`, request.url);
  if (r.receipt) url.searchParams.set("recu", r.receipt);
  return NextResponse.redirect(url, 303);
}
