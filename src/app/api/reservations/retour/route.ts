import { NextResponse, type NextRequest } from "next/server";
import { adminClient, verifyPayment } from "@/lib/payments";

/** Retour du client après la page de paiement : statut vérifié auprès du prestataire, puis reçu. */
async function back(request: NextRequest, id: string) {
  const r = await verifyPayment(id);
  let token = r.token;
  if (!token) {
    const { data } = (await adminClient()?.from("reservation_payments").select("reservations(token)").eq("identifier", id).maybeSingle()) ?? { data: null };
    token = (data?.reservations as unknown as { token: string } | null)?.token;
  }
  if (!token) return NextResponse.redirect(new URL("/hotel#reserver", request.url), 303);
  const state = r.ok ? "ok" : r.pending ? "en_cours" : "echec";
  return NextResponse.redirect(new URL(`/reservation/${token}?paiement=${state}`, request.url), 303);
}

export async function GET(request: NextRequest) {
  return back(request, request.nextUrl.searchParams.get("id") ?? "");
}

// CinetPay renvoie le client sur cette adresse en POST (transaction_id dans le formulaire)
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const id = request.nextUrl.searchParams.get("id") || String(form?.get("transaction_id") ?? form?.get("cpm_trans_id") ?? "");
  return back(request, id);
}
