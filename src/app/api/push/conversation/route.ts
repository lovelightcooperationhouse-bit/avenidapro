import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { pushReady, sendPush } from "@/lib/push-server";
import { createClient } from "@/lib/supabase/server";

/**
 * Push d'une discussion : appel entrant (sonnerie sur le téléphone, application fermée)
 * ou nouveau message, envoyé aux autres membres de la conversation.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!pushReady()) return NextResponse.json({ sent: 0, reason: "VAPID non configuré" });

  const body = (await request.json().catch(() => ({}))) as { conversationId?: string; kind?: "call" | "message"; video?: boolean; callId?: string; room?: string; preview?: string };
  if (!body.conversationId) return NextResponse.json({ error: "Conversation manquante" }, { status: 400 });

  // Seuls les membres de la conversation peuvent la notifier (vérifié avec les droits de l'utilisateur)
  const { data: people } = await supabase.rpc("conversation_people", { cid: body.conversationId });
  const members = (people ?? []) as { id: string; full_name: string }[];
  const me = members.find((p) => p.id === user.id);
  if (!me) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return NextResponse.json({ sent: 0, reason: "SUPABASE_SERVICE_ROLE_KEY manquant" });
  const admin = createAdmin(url, serviceKey, { auth: { persistSession: false } });

  let targets = members.filter((p) => p.id !== user.id).map((p) => p.id);
  if (body.kind === "message") {
    // Discussions mises en sourdine : pas de push pour les messages
    const { data: muted } = await admin.from("conversation_members").select("profile_id").eq("conversation_id", body.conversationId).eq("muted", true);
    const off = new Set((muted ?? []).map((m) => m.profile_id));
    targets = targets.filter((t) => !off.has(t));
  }

  const q = new URLSearchParams({ c: body.conversationId });
  if (body.kind === "call" && body.callId) {
    q.set("appel", body.callId);
    q.set("video", body.video ? "1" : "0");
    if (body.room) q.set("salle", body.room);
  }
  const sent = await sendPush(
    admin,
    targets,
    body.kind === "call"
      ? { title: `${body.video ? "Appel vidéo" : "Appel audio"} de ${me.full_name}`, body: "Touchez pour répondre", url: `/discussions?${q}`, tag: `appel-${body.callId}`, call: true }
      : { title: me.full_name, body: (body.preview ?? "Nouveau message").slice(0, 140), url: `/discussions?${q}`, tag: `conv-${body.conversationId}` }
  );
  return NextResponse.json({ sent });
}
