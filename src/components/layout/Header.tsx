"use client";

import { Bell, Building2, ChevronRight, CircleCheck, Menu, Search, Sparkles, TriangleAlert, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { ScoreCell } from "@/components/ui/Progress";
import { cn } from "@/lib/format";
import { PEOPLE } from "@/lib/mock/people";
import { CURRENT_USER, NAV_ITEMS, ORGANIZATION } from "./nav";

const NOTIFICATIONS = [
  { id: 1, icon: CircleCheck, tone: "text-emerald-600 bg-emerald-50", title: "Hito de campaña alcanzado", body: "Caracterización de Asociados 2026 superó los 1.000 perfiles completados.", time: "Hace 12 min" },
  { id: 2, icon: Sparkles, tone: "text-indigo-600 bg-indigo-50", title: "Nuevo hallazgo de IA disponible", body: "Santander presenta un aumento de información laboral desactualizada.", time: "Hace 1 h" },
  { id: 3, icon: TriangleAlert, tone: "text-amber-600 bg-amber-50", title: "34 conversaciones requieren revisión", body: "Respuestas de baja confianza marcadas para validación humana.", time: "Hace 3 h" },
  { id: 4, icon: Upload, tone: "text-sky-600 bg-sky-50", title: "Conocimiento indexado", body: "La Ley 2466 de 2025 ya alimenta NEXA Laboral AI.", time: "Ayer" },
];

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return PEOPLE.filter(
      (p) => p.fullName.toLowerCase().includes(q) || p.nationalId.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "~") || p.city.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query]);

  return (
    <div ref={ref} className="relative hidden w-full max-w-sm md:block">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) {
            router.push(`/people/${results[0].id}`);
            setOpen(false);
            setQuery("");
          }
        }}
        placeholder="Buscar asociados, cédulas, municipios…"
        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-12 pl-9 text-[13px] text-slate-700 placeholder:text-slate-400 transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400">⌘K</kbd>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-11 right-0 left-0 z-40 animate-scale-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Asociados</div>
          {results.length === 0 ? (
            <div className="px-3 py-6 text-center text-[13px] text-slate-500">Ningún asociado coincide con “{query}”</div>
          ) : (
            results.map((p) => (
              <Link
                key={p.id}
                href={`/people/${p.id}`}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50"
              >
                <Avatar name={p.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-slate-800">{p.fullName}</div>
                  <div className="text-[12px] text-slate-500">
                    {p.nationalId} · {p.city}
                  </div>
                </div>
                <ScoreCell value={p.characterization} />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setUnread(false);
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        aria-label="Notificaciones"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread && <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
      </button>
      {open && (
        <div className="absolute top-11 right-0 z-40 w-[360px] animate-scale-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-[13px] font-semibold text-slate-900">Notificaciones</span>
            <span className="text-[12px] text-indigo-600">Marcar todas como leídas</span>
          </div>
          {NOTIFICATIONS.map((n) => (
            <div key={n.id} className="flex gap-3 border-b border-slate-50 px-4 py-3 transition last:border-0 hover:bg-slate-50">
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", n.tone)}>
                <n.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-slate-800">{n.title}</div>
                <div className="text-[12px] leading-relaxed text-slate-500">{n.body}</div>
                <div className="mt-1 text-[11px] text-slate-400">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const nav = NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  const isPerson = pathname.startsWith("/people/");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-xl lg:px-8">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Abrir menú">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 items-center gap-2 text-[14px]">
        {isPerson ? (
          <>
            <Link href="/people" className="font-medium text-slate-500 transition hover:text-slate-900">
              Inteligencia de Personas
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="truncate font-semibold text-slate-900">Perfil 360</span>
          </>
        ) : (
          <h1 className="truncate font-semibold tracking-tight text-slate-900">{nav?.title ?? "NEXA Intelligence"}</h1>
        )}
      </div>

      <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50/70 py-1 pr-3 pl-1.5 text-[12px] font-medium text-emerald-800 xl:flex">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
          <Building2 className="h-3 w-3" />
        </span>
        {ORGANIZATION.name}
      </div>

      <div className="ml-auto flex flex-1 items-center justify-end gap-2">
        <GlobalSearch />
        <Notifications />
        <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
        <button className="flex items-center gap-2.5 rounded-xl py-1 pr-2 pl-1 transition hover:bg-slate-100">
          <Avatar name={CURRENT_USER.name} size="sm" />
          <div className="hidden text-left leading-tight sm:block">
            <div className="text-[13px] font-medium text-slate-800">{CURRENT_USER.name}</div>
            <div className="text-[11px] text-slate-500">Administradora</div>
          </div>
        </button>
      </div>
    </header>
  );
}
