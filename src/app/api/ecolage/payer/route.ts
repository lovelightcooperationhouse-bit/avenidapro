import { NextResponse, type NextRequest } from "next/server";
import { ONLINE_METHODS, startSchoolPayment, type OnlineMethod, type SchoolPaymentRequest } from "@/lib/payments";
import { createClient } from "@/lib/supabase/server";

/** Paiement en ligne des frais d'inscription ou de l'écolage depuis l'espace de l'élève, du parent ou du candidat admis. */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as SchoolPaymentRequest;
  if (!ONLINE_METHODS.includes(body.method as OnlineMethod) || (!body.student_id && !body.application_id)) return NextResponse.json({ error: "Demande invalide" }, { status: 400 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous pour payer en ligne." }, { status: 401 });
  const pay = await startSchoolPayment(
    supabase,
    { student_id: body.student_id, application_id: body.application_id, amount: Number(body.amount) || undefined, designation: body.designation, option: body.option, method: body.method },
    request.nextUrl.origin,
  );
  return "error" in pay ? NextResponse.json({ error: pay.error }, { status: 400 }) : NextResponse.json(pay);
}
