"use client";

import { Loader2, PhoneOff, Radio, Video, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { newLiveRoom, timeAgo, type LiveSession, type Person, type Space } from "@/lib/spaces";

/**
 * Cours en direct (visio Jitsi Meet intégrée). Seul le responsable de la salle peut lancer
 * et terminer une séance ; les membres la rejoignent depuis la plateforme.
 */
export function LivePanel({
  space,
  userId,
  userName,
  isResponsable,
  people,
  joinRoom,
  onJoin,
}: {
  space: Space;
  userId: string;
  userName: string;
  isResponsable: boolean;
  people: Record<string, Person>;
  joinRoom: string | null;
  onJoin: (room: string | null) => void;
}) {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [title, setTitle] = useState("");
  const [audioOnly, setAudioOnly] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await createClient().from("live_sessions").select("*").eq("space_id", space.id).order("started_at", { ascending: false }).limit(10);
    setSessions((data ?? []) as LiveSession[]);
  }, [space.id]);

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`live-${space.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_sessions", filter: `space_id=eq.${space.id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [space.id, load]);

  const active = sessions.filter((s) => !s.ended_at);

  const start = async () => {
    setBusy(true);
    const room = newLiveRoom(space);
    const label = title.trim() || (space.kind === "ecole" ? "Cours en direct" : "Réunion de service");
    const supabase = createClient();
    const { error } = await supabase.from("live_sessions").insert({ space_id: space.id, started_by: userId, title: label, room });
    if (!error) {
      await supabase.from("space_messages").insert({ space_id: space.id, sender_id: userId, kind: "live", body: label, attachment: { path: "", name: label, type: "live", size: 0, room } });
      setTitle("");
      onJoin(room);
    }
    setBusy(false);
    load();
  };

  const end = async (s: LiveSession) => {
    await createClient().from("live_sessions").update({ ended_at: new Date().toISOString() }).eq("id", s.id);
    if (joinRoom === s.room) onJoin(null);
    load();
  };

  const jitsiUrl = (room: string) =>
    `https://meet.jit.si/${room}#userInfo.displayName=${encodeURIComponent(`"${userName}"`)}&config.prejoinPageEnabled=false&config.startWithVideoMuted=${audioOnly || !isResponsable}&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false`;

  return (
    <div className="flex flex-col gap-5">
      {joinRoom && (
        <div className="overflow-hidden rounded-3xl bg-nuit shadow-2xl">
          <div className="flex items-center justify-between gap-3 px-5 py-3 text-white">
            <p className="flex items-center gap-2 text-sm font-bold">
              <span className="site-pulse-dot size-2.5 rounded-full bg-vif" />
              En direct · {sessions.find((s) => s.room === joinRoom)?.title ?? "Séance"}
            </p>
            <button type="button" onClick={() => onJoin(null)} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20">
              <X aria-hidden className="size-4" /> Quitter
            </button>
          </div>
          <iframe
            title="Cours en direct"
            src={jitsiUrl(joinRoom)}
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
            className="aspect-video w-full border-0 bg-black"
          />
        </div>
      )}

      {isResponsable && !joinRoom && (
        <div className="flex flex-col gap-4 rounded-3xl bg-[image:linear-gradient(130deg,#06152E,#0C356A_60%,#E30613)] p-6 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
              <Video aria-hidden className="size-6" />
            </span>
            <div>
              <p className="font-display text-xl font-extrabold">{space.kind === "ecole" ? "Lancer un cours en direct" : "Lancer une réunion de service"}</p>
              <p className="text-sm text-white/80">Les membres de la salle sont prévenus dans la discussion et rejoignent en un clic.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <label htmlFor={`live-${space.id}`} className="sr-only">
              Titre de la séance
            </label>
            <input
              id={`live-${space.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={space.kind === "ecole" ? "Ex. Cours : les fonds de sauce" : "Ex. Briefing du service du soir"}
              className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-white"
            />
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={audioOnly} onChange={(e) => setAudioOnly(e.target.checked)} className="size-4 accent-white" />
              Appel vocal seulement
            </label>
            <button type="button" onClick={start} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-vif hover:bg-red-50 disabled:opacity-60">
              {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Radio aria-hidden className="size-4" />}
              Démarrer
            </button>
          </div>
          <p className="text-xs text-white/70">
            La visio utilise Jitsi Meet : à la première séance, le professeur peut devoir se connecter une fois (Google ou GitHub) pour ouvrir la salle en tant qu&apos;animateur.
          </p>
        </div>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
        <h3 className="font-display text-lg font-bold text-avenida-blue-950">Séances</h3>
        {sessions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{isResponsable ? "Aucune séance pour le moment." : "Aucun direct pour le moment. Vous serez prévenu·e dans la discussion dès que votre professeur lance un cours."}</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-slate-800">{s.title}</p>
                  <p className="text-xs text-slate-500">
                    {people[s.started_by]?.full_name ?? "Responsable"} · {timeAgo(s.started_at)}
                    {s.ended_at ? " · terminée" : ""}
                  </p>
                </div>
                {!s.ended_at && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => onJoin(s.room)} className="inline-flex items-center gap-1.5 rounded-full bg-vif px-4 py-2 text-sm font-bold text-white hover:bg-vif-fonce">
                      <Video aria-hidden className="size-4" /> Rejoindre
                    </button>
                    {isResponsable && (
                      <button type="button" onClick={() => end(s)} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">
                        <PhoneOff aria-hidden className="size-4" /> Terminer
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {active.length > 0 && !joinRoom && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-vif">Un direct est en cours : rejoignez-le !</p>}
      </section>
    </div>
  );
}
