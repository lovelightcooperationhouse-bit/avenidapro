import { NextResponse, type NextRequest } from "next/server";
import { adminClient, verifyPayment } from "@/lib/payments";

/** Retour du client après la page de paiement : statut vérifié auprès du prestataire, puis reçu. */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const r = await verifyPayment(id);
  let token = r.token;
  if (!token) {
    const { data } = (await adminClient()?.from("reservation_payments").select("reservations(token)").eq("identifier", id).maybeSingle()) ?? { data: null };
    token = (data?.reservations as unknown as { token: string } | null)?.token;
  }
  if (!token) return NextResponse.redirect(new URL("/hotel#reserver", request.url));
  const state = r.ok ? "ok" : r.pending ? "en_cours" : "echec";
  return NextResponse.redirect(new URL(`/reservation/${token}?paiement=${state}`, request.url));
}
