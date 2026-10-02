"use client";

import { ChevronsUpDown, LogOut, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/format";
import { CURRENT_USER, NAV_ITEMS, ORGANIZATION } from "./nav";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="relative flex h-full w-[264px] flex-col overflow-hidden bg-ink-900 text-slate-300">
      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 -right-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative px-5 pt-6 pb-8">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo endorsed />
        </Link>
      </div>

      <div className="relative px-3">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Plataforma</div>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all",
                  active ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                )}
              >
                {active && <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-linear-to-b from-indigo-400 to-cyan-400" />}
                <Icon className={cn("h-[18px] w-[18px] shrink-0 transition", active ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-300")} />
                <span className="flex-1 whitespace-nowrap">{item.label}</span>
                {"ai" in item && item.ai && (
                  <span className="inline-flex items-center rounded-md bg-linear-to-r from-indigo-500/25 to-cyan-500/25 p-1 text-indigo-200 ring-1 ring-inset ring-indigo-400/20">
                    <Sparkles className="h-2.5 w-2.5" />
                  </span>
                )}
                {"badge" in item && item.badge && (
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="relative mx-4 mt-8 rounded-2xl border border-white/[0.06] bg-linear-to-br from-white/[0.06] to-white/[0.02] p-4">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-white">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Motor de IA activo
        </div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">2 campañas en curso · 1.302 conversaciones procesadas en este ciclo.</p>
      </div>

      <div className="relative mt-auto space-y-2 p-3">
        <button className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-left transition hover:bg-white/[0.06]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 text-[11px] font-bold text-white">
            {ORGANIZATION.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">{ORGANIZATION.name}</div>
            <div className="truncate text-[11px] text-slate-500">{ORGANIZATION.plan}</div>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-slate-500" />
        </button>

        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar name={CURRENT_USER.name} size="sm" className="ring-ink-900" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-slate-200">{CURRENT_USER.name}</div>
            <div className="truncate text-[11px] text-slate-500">{CURRENT_USER.role}</div>
          </div>
          <Link href="/login" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-200" aria-label="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
