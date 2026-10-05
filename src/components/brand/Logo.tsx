import Image from "next/image";
import { useId } from "react";
import { cn } from "@/lib/format";

export function LogoMark({ className }: { className?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path d="M10 22V10l12 12V10" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.2" fill="white" />
      <circle cx="22" cy="22" r="2.2" fill="white" />
      <circle cx="22" cy="10" r="1.6" fill="white" fillOpacity="0.7" />
      <circle cx="10" cy="22" r="1.6" fill="white" fillOpacity="0.7" />
    </svg>
  );
}

export const ENDORSEMENT_LINE = "by Sergio Flórez y Abogados";

export function Logo({
  tone = "light",
  endorsed = false,
  className,
  showIntelligence = true,
}: {
  tone?: "light" | "dark";
  endorsed?: boolean;
  className?: string;
  showIntelligence?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-none">
        <div className={cn("text-[15px] font-semibold tracking-[0.18em]", tone === "light" ? "text-white" : "text-slate-900")}>
          NEXA
        </div>
        {showIntelligence && (
          <div className={cn("mt-1 text-[10px] font-medium uppercase tracking-[0.22em]", tone === "light" ? "text-indigo-200/70" : "text-slate-500")}>
            Intelligence
          </div>
        )}
        {endorsed && <Endorsement tone={tone} className="mt-1.5" />}
      </div>
    </div>
  );
}

export function PartnerMark({
  tone = "light",
  label,
  size = "md",
  className,
}: {
  tone?: "light" | "dark";
  label?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  const sm = size === "sm";
  return (
    <div className={cn("inline-flex flex-col gap-2", className)}>
      {label && (
        <span className={cn("text-[10.5px] font-medium uppercase tracking-[0.18em]", tone === "light" ? "text-slate-500" : "text-slate-400")}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-2.5">
        <Image src="/brand/sf-monogram.png" alt="" width={228} height={263} className={cn("w-auto", sm ? "h-7" : "h-9")} />
        <div className="leading-none">
          <div
            className={cn(
              "font-semibold tracking-[0.12em]",
              sm ? "text-[11.5px]" : "text-[13px]",
              tone === "light" ? "text-slate-100" : "text-slate-800",
            )}
          >
            SERGIO FLÓREZ
          </div>
          <div
            className={cn(
              "mt-1 border-t pt-1 font-light tracking-[0.3em]",
              sm ? "text-[9.5px]" : "text-[10.5px]",
              tone === "light" ? "border-white/15 text-slate-400" : "border-slate-300 text-slate-500",
            )}
          >
            ABOGADOS
          </div>
        </div>
      </div>
    </div>
  );
}

export function Endorsement({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <div className={cn("text-[10.5px] font-medium italic tracking-wide", tone === "light" ? "text-slate-400" : "text-slate-500", className)}>
      {ENDORSEMENT_LINE}
    </div>
  );
}
