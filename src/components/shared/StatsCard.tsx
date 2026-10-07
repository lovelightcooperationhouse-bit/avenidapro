import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatsCardVariant =
  | "default"
  | "school"
  | "hotel"
  | "finance"
  | "gold"
  | "success"
  | "danger";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: StatsCardVariant;
  badge?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  badge,
}: StatsCardProps) {
  const variantStyles: Record<
    StatsCardVariant,
    { card: string; iconBg: string; accent: string; badgeStyle: string }
  > = {
    default: {
      card: "bg-white border-slate-200",
      iconBg: "bg-slate-100 text-slate-800",
      accent: "text-slate-900",
      badgeStyle: "bg-slate-100 text-slate-700 border-slate-200",
    },
    school: {
      card: "bg-white border-blue-200 shadow-xs hover:border-[#0C356A]",
      iconBg: "bg-blue-50 text-[#0C356A]",
      accent: "text-[#0C356A]",
      badgeStyle: "bg-blue-50 text-[#0C356A] border-blue-200 font-bold",
    },
    hotel: {
      card: "bg-white border-red-200 shadow-xs hover:border-[#DC2626]",
      iconBg: "bg-red-50 text-[#DC2626]",
      accent: "text-[#DC2626]",
      badgeStyle: "bg-red-50 text-[#DC2626] border-red-200 font-bold",
    },
    finance: {
      card: "bg-white border-slate-200 hover:border-blue-400",
      iconBg: "bg-emerald-50 text-emerald-800",
      accent: "text-slate-900",
      badgeStyle: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    gold: {
      card: "bg-white border-amber-200 shadow-xs hover:border-amber-400",
      iconBg: "bg-amber-50 text-amber-800",
      accent: "text-amber-900",
      badgeStyle: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
    },
    success: {
      card: "bg-white border-emerald-200",
      iconBg: "bg-emerald-100 text-emerald-700",
      accent: "text-emerald-900",
      badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    danger: {
      card: "bg-white border-red-200",
      iconBg: "bg-red-100 text-red-700",
      accent: "text-red-900",
      badgeStyle: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={cn(
        "p-5 rounded-2xl border bg-white avenida-shadow avenida-card-hover relative overflow-hidden transition-all",
        style.card
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {title}
            </span>
            {badge && (
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border",
                  style.badgeStyle
                )}
              >
                {badge}
              </span>
            )}
          </div>
          <div className={cn("text-2xl font-black tracking-tight font-serif", style.accent)}>
            {value}
          </div>
        </div>

        <div className={cn("p-3 rounded-xl flex items-center justify-center shadow-xs", style.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}
          {trend && (
            <span
              className={cn(
                "font-bold flex items-center gap-1",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
