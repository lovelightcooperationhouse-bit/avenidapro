import { NextResponse, type NextRequest } from "next/server";
import { ONLINE_METHODS, startPayment, type OnlineMethod } from "@/lib/payments";

/** Payer en ligne une réservation existante (depuis le reçu) : page de paiement PayDunya. */
export async function POST(request: NextRequest) {
  const { token, method } = (await request.json().catch(() => ({}))) as { token?: string; method?: OnlineMethod };
  if (!token || !ONLINE_METHODS.includes(method as OnlineMethod)) return NextResponse.json({ error: "Demande invalide" }, { status: 400 });
  const pay = await startPayment(token, method!, request.nextUrl.origin);
  return "error" in pay ? NextResponse.json({ error: pay.error }, { status: 400 }) : NextResponse.json(pay);
}
