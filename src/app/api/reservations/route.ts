import { NextResponse, type NextRequest } from "next/server";
import { sendBookingEmail, startPayment, type OnlineMethod } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";

type Body = {
  room_id?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  full_name?: string;
  phone?: string;
  email?: string;
  nationality?: string;
  message?: string;
  payment?: "arrivee" | OnlineMethod;
  referral?: string;
  use_points?: boolean;
  site_web?: string;
};

/**
 * Réservation depuis le site : la chambre est vérifiée et bloquée par la base (aucune double réservation),
 * le montant est calculé côté serveur, puis paiement à l'arrivée ou redirection vers le paiement en ligne.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Body;
  if (body.site_web) return NextResponse.json({ error: "Requête refusée" }, { status: 400 }); // robot
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_booking", {
    p: {
      room_id: body.room_id,
      check_in: body.check_in,
      check_out: body.check_out,
      guests: body.guests,
      full_name: body.full_name,
      phone: body.phone,
      email: body.email,
      nationality: body.nationality,
      message: body.message,
      payment: body.payment ?? "arrivee",
      referral: body.referral,
      use_points: !!body.use_points,
    },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const r = data as { token: string; ref: string; nights: number; due: number; online: boolean };
  const origin = request.nextUrl.origin;

  await sendBookingEmail(
    body.email ?? null,
    body.full_name ?? "",
    `Réservation ${r.ref} enregistrée`,
    `Votre chambre est réservée pour ${r.nights} nuit(s). Montant du séjour : ${Number(r.due).toLocaleString("fr-FR")} F CFA.\n` +
      (r.online ? "Si votre paiement en ligne n'a pas abouti, vous pouvez le reprendre depuis votre reçu." : "Paiement à effectuer à votre arrivée à la réception."),
    `${origin}/reservation/${r.token}`,
  );

  if (!r.online) return NextResponse.json({ token: r.token, ref: r.ref });
  // KkiaPay : la fenêtre de paiement s'ouvre sur la page du reçu
  if (process.env.KKIAPAY_PUBLIC_KEY && !(body.payment === "carte" && process.env.STRIPE_SECRET_KEY)) return NextResponse.json({ token: r.token, ref: r.ref, url: `/reservation/${r.token}?payer=${body.payment}` });
  const pay = await startPayment(r.token, body.payment as OnlineMethod, origin);
  // Paiement en ligne impossible : la réservation reste enregistrée, le client peut payer depuis son reçu ou à l'arrivée
  return NextResponse.json({ token: r.token, ref: r.ref, ...("url" in pay ? { url: pay.url } : "error" in pay ? { paymentError: pay.error } : { url: `/reservation/${r.token}?payer=${body.payment}` }) });
}
