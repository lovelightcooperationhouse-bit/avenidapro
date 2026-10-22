"use client";

import { Camera, Check, ImagePlus, RotateCcw, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PASSPORT } from "@/lib/onboarding";

const FRAME_W = 210;
const FRAME_H = Math.round(FRAME_W / PASSPORT.ratio);

/**
 * Photo d'identité au format passeport (35 × 45 mm) : l'utilisateur choisit ou prend une photo,
 * la recadre (zoom + déplacement) dans le gabarit, et obtient un JPEG 413 × 531 px (300 dpi).
 */
export function PassportPhoto({ value, onChange }: { value: string | null; onChange: (dataUrl: string) => void }) {
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    if (!src) return;
    const i = new Image();
    i.onload = () => {
      setImg(i);
      setZoom(1);
      setPos({ x: 0, y: 0 });
    };
    i.src = src;
  }, [src]);

  // Échelle de base : l'image couvre entièrement le cadre
  const base = img ? Math.max(FRAME_W / img.width, FRAME_H / img.height) : 1;
  const w = img ? img.width * base * zoom : 0;
  const h = img ? img.height * base * zoom : 0;
  const clamp = (p: { x: number; y: number }) => ({
    x: Math.min(0, Math.max(FRAME_W - w, p.x)),
    y: Math.min(0, Math.max(FRAME_H - h, p.y)),
  });
  const offset = img ? clamp({ x: (FRAME_W - w) / 2 + pos.x, y: (FRAME_H - h) / 2 + pos.y }) : { x: 0, y: 0 };

  const pick = (file?: File) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choisissez une image (JPG ou PNG).");
    if (file.size > 15 * 1024 * 1024) return setError("Image trop lourde (15 Mo au maximum).");
    const r = new FileReader();
    r.onload = () => setSrc(String(r.result));
    r.readAsDataURL(file);
  };

  const validate = () => {
    if (!img) return;
    if (img.width < 300 || img.height < 380) setError("Photo de faible qualité : utilisez une image plus grande si possible.");
    const canvas = document.createElement("canvas");
    canvas.width = PASSPORT.width;
    canvas.height = PASSPORT.height;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const k = PASSPORT.width / FRAME_W;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, offset.x * k, offset.y * k, w * k, h * k);
    onChange(canvas.toDataURL("image/jpeg", 0.88));
    setSrc(null);
    setImg(null);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative touch-none overflow-hidden rounded-lg bg-slate-100 ring-2 ring-avenida-blue/20"
          style={{ width: FRAME_W, height: FRAME_H, cursor: img ? "grab" : "default" }}
          onPointerDown={(e) => {
            if (!img) return;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setPos({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y });
          }}
          onPointerUp={() => (drag.current = null)}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local avant recadrage
            <img src={src!} alt="" draggable={false} className="absolute max-w-none select-none" style={{ width: w, height: h, left: offset.x, top: offset.y }} />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element -- photo stockée en data URL
            <img src={value} alt="Votre photo d'identité" className="size-full object-cover" />
          ) : (
            <span className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-xs font-semibold text-slate-500">
              <Camera aria-hidden className="size-8 text-slate-400" />
              Photo d&apos;identité
              <br />
              35 × 45 mm
            </span>
          )}
          {img && (
            <>
              {/* Repères : ovale du visage et ligne des yeux */}
              <span aria-hidden className="pointer-events-none absolute top-[12%] left-1/2 h-[62%] w-[62%] -translate-x-1/2 rounded-[50%] border-2 border-dashed border-white/80" />
              <span aria-hidden className="pointer-events-none absolute top-[40%] right-3 left-3 border-t border-dashed border-white/60" />
            </>
          )}
        </div>
        {value && !img && (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
            <Check aria-hidden className="size-3.5" /> Photo enregistrée
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 text-sm">
        {img ? (
          <>
            <p className="font-semibold text-slate-700">Glissez la photo pour placer le visage dans l&apos;ovale, les yeux sur la ligne.</p>
            <label className="flex items-center gap-3 font-semibold text-slate-600">
              <ZoomIn aria-hidden className="size-4" />
              <span className="sr-only">Zoom</span>
              <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="flex-1 accent-[#E30613]" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={validate} className="inline-flex items-center gap-2 rounded-full bg-vif px-5 py-2.5 font-bold text-white hover:bg-vif-fonce">
                <Check aria-hidden className="size-4" /> Valider le cadrage
              </button>
              <button type="button" onClick={() => { setSrc(null); setImg(null); }} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-100">
                <RotateCcw aria-hidden className="size-4" /> Annuler
              </button>
            </div>
          </>
        ) : (
          <>
            <ul className="list-disc space-y-1 pl-5 text-slate-600">
              <li>Photo récente, en couleur, de face, visage bien visible.</li>
              <li>Fond clair et uni (blanc ou gris clair), sans ombre.</li>
              <li>Sans lunettes de soleil, chapeau ni filtre ; expression neutre.</li>
              <li>Elle servira pour votre carte scolaire ou de travail.</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-avenida-blue px-5 py-2.5 font-bold text-white hover:bg-avenida-blue-950">
                <ImagePlus aria-hidden className="size-4" />
                {value ? "Changer la photo" : "Choisir une photo"}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-avenida-blue/15 px-5 py-2.5 font-bold text-avenida-blue hover:bg-avenida-blue-50">
                <Camera aria-hidden className="size-4" />
                Prendre une photo
                <input type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
              </label>
            </div>
          </>
        )}
        {error && <p className="text-xs font-semibold text-amber-700">{error}</p>}
      </div>
    </div>
  );
}
