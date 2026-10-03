import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-5", className)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-200/70">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold tracking-tight text-slate-900 break-words">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12.5px] sm:text-[13px] text-slate-500 break-words">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400", className)}>
      {children}
    </div>
  );
}
