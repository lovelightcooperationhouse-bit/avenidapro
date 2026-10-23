import { NextResponse, type NextRequest } from "next/server";
import { startPayment, type OnlineMethod } from "@/lib/payments";

/** Payer en ligne une réservation existante (depuis le reçu). */
export async function POST(request: NextRequest) {
  const { token, method } = (await request.json().catch(() => ({}))) as { token?: string; method?: OnlineMethod };
  if (!token || !["carte", "yas", "moov"].includes(method ?? "")) return NextResponse.json({ error: "Demande invalide" }, { status: 400 });
  const pay = await startPayment(token, method!, request.nextUrl.origin);
  return "url" in pay ? NextResponse.json({ url: pay.url }) : NextResponse.json({ error: pay.error }, { status: 400 });
}
