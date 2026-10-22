"use client";

import { Mic, MicOff, PhoneOff, RefreshCw, Video, VideoOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { iceServers, jitsiUrl } from "@/lib/chat";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

type Status = "appel" | "connexion" | "en_cours" | "termine" | "refuse" | "sans_reponse" | "erreur";
const LABEL: Record<Status, string> = {
  appel: "Appel en cours…",
  connexion: "Connexion…",
  en_cours: "",
  termine: "Appel terminé",
  refuse: "Appel refusé",
  sans_reponse: "Pas de réponse",
  erreur: "Micro ou caméra inaccessible",
};

/** Salle de visioconférence plein écran (appels de groupe, réunions). */
export function JitsiRoom({ room, name, audioOnly, onClose, title }: { room: string; name: string; audioOnly?: boolean; onClose: () => void; title?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#06152E]">
      <div className="flex items-center justify-between gap-3 px-4 py-2 text-white">
        <p className="truncate text-sm font-bold">{title ?? "Visioconférence Avenida"}</p>
        <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full bg-[#E30613] px-4 py-2 text-sm font-bold">
          <PhoneOff aria-hidden className="size-4" /> Quitter
        </button>
      </div>
      <iframe title={title ?? "Visioconférence"} src={jitsiUrl(room, name, { audioOnly })} allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-write" className="w-full flex-1 border-0" />
    </div>
  );
}

/**
 * Appel privé audio ou vidéo, de navigateur à navigateur (WebRTC).
 * La mise en relation passe par un canal temps réel Supabase propre à l'appel.
 */
export function CallOverlay({
  callId,
  messageId,
  video,
  mode,
  peerName,
  peerAvatar,
  onClose,
}: {
  callId: string;
  messageId?: string;
  video: boolean;
  mode: "sortant" | "entrant";
  peerName: string;
  peerAvatar?: string | null;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>(mode === "sortant" ? "appel" : "connexion");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(video);
  const [seconds, setSeconds] = useState(0);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const channel = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const pending = useRef<RTCIceCandidateInit[]>([]);
  const ended = useRef(false);
  const started = useRef<number | null>(null);
  const facing = useRef<"user" | "environment">("user");

  const send = (payload: Record<string, unknown>) => channel.current?.send({ type: "broadcast", event: "signal", payload });

  const finish = useCallback(
    async (s: Status, notify = true) => {
      if (ended.current) return;
      ended.current = true;
      if (notify) send({ type: "hangup" });
      setStatus(s);
      stream.current?.getTracks().forEach((t) => t.stop());
      pc.current?.close();
      // Journal de l'appel dans la discussion (côté appelant)
      if (mode === "sortant" && messageId) {
        const duration = started.current ? Math.round((Date.now() - started.current) / 1000) : 0;
        await createClient()
          .from("conversation_messages")
          .update({ attachment: { video, call_id: callId, status: s === "termine" && duration ? "termine" : s === "refuse" ? "refuse" : "manque", duration } })
          .eq("id", messageId);
      }
      setTimeout(() => {
        if (channel.current) createClient().removeChannel(channel.current);
        onClose();
      }, 1200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [callId, messageId, mode, video, onClose]
  );

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    const conn = new RTCPeerConnection({ iceServers: iceServers() });
    pc.current = conn;

    conn.onicecandidate = (e) => e.candidate && send({ type: "ice", candidate: e.candidate.toJSON() });
    conn.ontrack = (e) => {
      const [remote] = e.streams;
      if (remoteRef.current) remoteRef.current.srcObject = remote;
      if (remoteAudio.current) remoteAudio.current.srcObject = remote;
    };
    conn.onconnectionstatechange = () => {
      if (conn.connectionState === "connected") {
        started.current ??= Date.now();
        setStatus("en_cours");
      }
      if (conn.connectionState === "failed") finish("termine");
    };

    const addPending = async () => {
      for (const c of pending.current.splice(0)) await conn.addIceCandidate(c).catch(() => {});
    };

    const ch = supabase.channel(`appel-${callId}`, { config: { broadcast: { self: false } } });
    channel.current = ch;
    ch.on("broadcast", { event: "signal" }, async ({ payload }) => {
      try {
        if (payload.type === "ready" && mode === "sortant") {
          setStatus("connexion");
          const offer = await conn.createOffer();
          await conn.setLocalDescription(offer);
          send({ type: "offer", sdp: offer });
        } else if (payload.type === "offer" && mode === "entrant") {
          await conn.setRemoteDescription(payload.sdp);
          await addPending();
          const answer = await conn.createAnswer();
          await conn.setLocalDescription(answer);
          send({ type: "answer", sdp: answer });
        } else if (payload.type === "answer" && mode === "sortant") {
          await conn.setRemoteDescription(payload.sdp);
          await addPending();
        } else if (payload.type === "ice") {
          if (conn.remoteDescription) await conn.addIceCandidate(payload.candidate).catch(() => {});
          else pending.current.push(payload.candidate);
        } else if (payload.type === "decline") finish("refuse", false);
        else if (payload.type === "hangup") finish("termine", false);
      } catch {
        finish("erreur");
      }
    });

    (async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: video ? { facingMode: "user", width: { ideal: 1280 } } : false });
        if (cancelled) return media.getTracks().forEach((t) => t.stop());
        stream.current = media;
        media.getTracks().forEach((t) => conn.addTrack(t, media));
        if (localRef.current) localRef.current.srcObject = media;
      } catch {
        return finish("erreur");
      }
      ch.subscribe((s) => {
        if (s === "SUBSCRIBED" && mode === "entrant") send({ type: "ready" });
      });
    })();

    // L'appelant renvoie l'appel jusqu'à 45 s, puis abandonne
    const timeout = mode === "sortant" ? window.setTimeout(() => !started.current && finish("sans_reponse"), 45_000) : undefined;
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status !== "en_cours") return;
    const id = window.setInterval(() => setSeconds(Math.round((Date.now() - (started.current ?? Date.now())) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, [status]);

  // Raccrocher proprement si l'onglet se ferme
  useEffect(() => {
    const onUnload = () => send({ type: "hangup" });
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  const toggleMic = () => {
    stream.current?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn(!micOn);
  };
  const toggleCam = () => {
    stream.current?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
    setCamOn(!camOn);
  };
  const switchCamera = async () => {
    facing.current = facing.current === "user" ? "environment" : "user";
    const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing.current } }).catch(() => null);
    const track = media?.getVideoTracks()[0];
    const sender = pc.current?.getSenders().find((s) => s.track?.kind === "video");
    if (!track || !sender) return;
    await sender.replaceTrack(track);
    stream.current?.getVideoTracks().forEach((t) => {
      t.stop();
      stream.current?.removeTrack(t);
    });
    stream.current?.addTrack(track);
    if (localRef.current) localRef.current.srcObject = stream.current;
  };

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[radial-gradient(circle_at_top,#0C356A,#06152E_70%)] p-6 text-white" role="dialog" aria-label={`Appel avec ${peerName}`}>
      {video && <video ref={remoteRef} autoPlay playsInline className={cn("absolute inset-0 size-full object-cover", status !== "en_cours" && "opacity-0")} />}
      <audio ref={remoteAudio} autoPlay />
      <div className="relative z-10 mt-10 flex flex-col items-center gap-3 text-center">
        {!(video && status === "en_cours") && <Avatar name={peerName} src={peerAvatar} size="lg" />}
        <p className="text-2xl font-bold drop-shadow">{peerName}</p>
        <p className="text-sm text-white/80 drop-shadow">{status === "en_cours" ? clock : LABEL[status]}</p>
        <p className="text-xs text-white/50">{video ? "Appel vidéo" : "Appel audio"} · chiffré de bout en bout</p>
      </div>
      {video && (
        <video ref={localRef} autoPlay playsInline muted className="absolute right-4 bottom-32 z-10 h-40 w-28 rounded-2xl object-cover shadow-2xl ring-2 ring-white/40 sm:h-48 sm:w-36" style={{ transform: facing.current === "user" ? "scaleX(-1)" : undefined }} />
      )}
      <div className="relative z-10 mb-6 flex items-center gap-5">
        <button type="button" onClick={toggleMic} aria-label={micOn ? "Couper le micro" : "Activer le micro"} className={cn("flex size-14 items-center justify-center rounded-full", micOn ? "bg-white/15" : "bg-white text-[#06152E]")}>
          {micOn ? <Mic aria-hidden className="size-6" /> : <MicOff aria-hidden className="size-6" />}
        </button>
        {video && (
          <>
            <button type="button" onClick={toggleCam} aria-label={camOn ? "Couper la caméra" : "Activer la caméra"} className={cn("flex size-14 items-center justify-center rounded-full", camOn ? "bg-white/15" : "bg-white text-[#06152E]")}>
              {camOn ? <Video aria-hidden className="size-6" /> : <VideoOff aria-hidden className="size-6" />}
            </button>
            <button type="button" onClick={switchCamera} aria-label="Changer de caméra" className="flex size-14 items-center justify-center rounded-full bg-white/15">
              <RefreshCw aria-hidden className="size-6" />
            </button>
          </>
        )}
        <button type="button" onClick={() => finish("termine")} aria-label="Raccrocher" className="flex size-16 items-center justify-center rounded-full bg-[#E30613] shadow-lg">
          <PhoneOff aria-hidden className="size-7" />
        </button>
      </div>
    </div>
  );
}
