import React from "react";
import Image from "next/image";

interface AvenidaLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  theme?: "light" | "dark" | "colored";
}

export function AvenidaLogo({
  size = "md",
  showText = true,
  theme = "colored",
}: AvenidaLogoProps) {
  const iconDimensions = {
    sm: { className: "w-10 h-10", width: 40, height: 40 },
    md: { className: "w-14 h-14", width: 56, height: 56 },
    lg: { className: "w-20 h-20", width: 80, height: 80 },
  }[size];

  const titleSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-xl",
  }[size];

  const subSizes = {
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-xs",
  }[size];

  return (
    <div className="flex items-center gap-3">
      {/* Official Avenida Logo Image */}
      <div
        className={`${iconDimensions.className} relative shrink-0 rounded-lg overflow-hidden shadow-sm border border-slate-200`}
      >
        <Image
          src="/logoavenida.jpg"
          alt="Hôtel École Avenida - Logo Officiel"
          width={iconDimensions.width}
          height={iconDimensions.height}
          className="w-full h-full object-contain"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-extrabold tracking-wider ${
                theme === "dark" ? "text-slate-100" : "text-[#0C356A]"
              } ${titleSizes}`}
            >
              HÔTEL ÉCOLE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-extrabold tracking-widest text-[#DC2626] ${titleSizes}`}
            >
              AVENIDA
            </span>
            <span className="text-[9px] bg-red-50 text-[#DC2626] font-bold px-1.5 py-0.5 rounded border border-red-200">
              LOMÉ
            </span>
          </div>
          <span className={`text-slate-400 font-medium ${subSizes}`}>
            Travail &bull; Discipline &bull; Excellence
          </span>
        </div>
      )}
    </div>
  );
}
