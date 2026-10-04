"use client";

import { Play, Sparkles, Video } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

interface IntroVideoProps {
  variant?: "dashboard-hero" | "login-badge" | "login-card" | "button";
  className?: string;
}

export function IntroVideo({ variant = "dashboard-hero", className }: IntroVideoProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "dashboard-hero" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl border border-indigo-400/40 bg-linear-to-r from-indigo-500/20 via-indigo-600/30 to-violet-500/20 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_0_20px_-3px_rgba(99,102,241,0.4)] backdrop-blur transition-all duration-300 hover:border-indigo-300 hover:shadow-[0_0_25px_0_rgba(99,102,241,0.6)] hover:brightness-110 active:scale-[0.98] ${className ?? ""}`}
        >
          {/* Subtle glowing effect */}
          <span className="pointer-events-none absolute -inset-px rounded-xl bg-linear-to-r from-indigo-400/20 via-cyan-400/20 to-violet-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500 to-cyan-400 text-white shadow-md transition-transform duration-300 group-hover:scale-110">
            <Play className="h-3 w-3 fill-current ml-0.5" />
          </span>
          <span className="relative font-medium tracking-wide">
            Ver video introductorio <span className="font-normal text-indigo-200">· Dr. Sergio Flórez</span>
          </span>
        </button>
      )}

      {variant === "login-badge" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group mt-3.5 inline-flex items-center gap-2.5 rounded-xl border border-indigo-400/30 bg-linear-to-r from-indigo-500/15 via-white/[0.08] to-cyan-500/15 px-3.5 py-2 text-[12.5px] font-medium text-indigo-100 backdrop-blur transition-all duration-200 hover:border-indigo-300/60 hover:bg-indigo-500/25 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20 ${className ?? ""}`}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500 to-cyan-400 text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
            <Play className="h-2.5 w-2.5 fill-current ml-0.5" />
          </span>
          <span>Video explicativo de la plataforma</span>
          <span className="rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[11px] font-normal text-indigo-200">Dr. Sergio Flórez</span>
        </button>
      )}

      {variant === "login-card" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group relative flex w-full items-center justify-between gap-3 rounded-xl border border-indigo-100/90 bg-linear-to-r from-indigo-50/70 via-white to-indigo-50/40 p-3 text-left transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/90 hover:shadow-sm active:scale-[0.99] ${className ?? ""}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 transition-transform duration-200 group-hover:scale-105">
              <Play className="h-4 w-4 fill-white ml-0.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12.5px] font-semibold text-slate-800 transition-colors group-hover:text-indigo-900">
                  Video introductorio
                </span>
                <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                  Demo
                </span>
              </div>
              <p className="truncate text-[11.5px] text-slate-500">
                Presentación por el Dr. Sergio Flórez
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-lg border border-indigo-200/60 bg-white px-2.5 py-1 text-[11px] font-medium text-indigo-700 shadow-2xs transition-colors group-hover:bg-indigo-600 group-hover:text-white">
            Ver video
          </span>
        </button>
      )}

      {variant === "button" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50 ${className ?? ""}`}
        >
          <Play className="h-3.5 w-3.5 fill-slate-700" />
          <span>Ver video introductorio</span>
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Introducción a NEXA Intelligence"
        subtitle="Presentación por el Dr. Sergio Flórez · Marco analítico y alcance de la plataforma"
        icon={<Video className="h-5 w-5" />}
        size="xl"
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl bg-slate-950 shadow-md ring-1 ring-slate-900/10">
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              {open && (
                <iframe
                  src="https://player.mediadelivery.net/embed/770206/527c9eca-8e6f-4524-b63d-1abfc7fc9434?autoplay=true&loop=false&muted=false&preload=true&responsive=true"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;fullscreen"
                  allowFullScreen
                />
              )}
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3.5 text-[12.5px] leading-relaxed text-slate-600 border border-slate-100">
            <p>
              Conozca cómo <strong>NEXA Intelligence</strong> articula la inteligencia poblacional, la caracterización automática con IA y el respaldo jurídico especializado de <strong>Sergio Flórez Abogados</strong> para su entidad.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
