"use client";

import { Play, Sparkles, Video } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

interface IntroVideoProps {
  variant?: "dashboard-hero" | "login-badge" | "login-link" | "button";
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
          className={`group inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-1.5 text-[12.5px] font-medium text-indigo-200 backdrop-blur transition hover:border-indigo-400/50 hover:bg-indigo-500/20 hover:text-white ${className ?? ""}`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow-xs group-hover:scale-105 transition-transform">
            <Play className="h-2.5 w-2.5 fill-current ml-0.5" />
          </span>
          <span>Ver video introductorio</span>
          <span className="text-[11px] text-indigo-300/80">· Dr. Sergio Flórez</span>
        </button>
      )}

      {variant === "login-badge" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-slate-300 backdrop-blur transition hover:border-indigo-400/40 hover:bg-indigo-500/15 hover:text-white ${className ?? ""}`}
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/80 text-white transition-transform group-hover:scale-110">
            <Play className="h-2 w-2 fill-current ml-0.5" />
          </span>
          <span>Video explicativo de la plataforma</span>
          <span className="text-[10.5px] text-indigo-300">· Dr. Sergio Flórez</span>
        </button>
      )}

      {variant === "login-link" && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-400 transition hover:text-indigo-600 ${className ?? ""}`}
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
            <Play className="h-2 w-2 fill-current ml-0.5" />
          </span>
          <span>Ver video de bienvenida por Dr. Sergio Flórez</span>
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
