"use client";

import { Building2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/format";

export interface PotentialClient {
  id: string;
  name: string;
  shortName: string;
  category: string;
  logo: string;
}

export const POTENTIAL_CLIENTS: PotentialClient[] = [
  {
    id: "comultrasan",
    name: "Financiera Comultrasan",
    shortName: "Comultrasan",
    category: "Cooperativa Financiera",
    logo: "/brand/clients/comultrasan.jpg",
  },
  {
    id: "cotrafa",
    name: "Cooperativa Financiera Cotrafa",
    shortName: "Cotrafa",
    category: "Cooperativa Financiera",
    logo: "/brand/clients/cotrafa.jpg",
  },
  {
    id: "cfa",
    name: "CFA Cooperativa Financiera",
    shortName: "CFA",
    category: "Cooperativa Financiera",
    logo: "/brand/clients/cfa.jpg",
  },
  {
    id: "coomuldesa",
    name: "Coomuldesa",
    shortName: "Coomuldesa",
    category: "Ahorro y Crédito",
    logo: "/brand/clients/coomuldesa.jpg",
  },
  {
    id: "cooprofesores",
    name: "Cooprofesores",
    shortName: "Cooprofesores",
    category: "Sector Solidario",
    logo: "/brand/clients/cooprofesores.jpg",
  },
];

export function ClientsCarousel({
  variant = "login",
  className,
}: {
  variant?: "login" | "dashboard" | "minimal";
  className?: string;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const offset = direction === "left" ? -280 : 280;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  // Duplicate items for continuous seamless loop
  const displayItems = [...POTENTIAL_CLIENTS, ...POTENTIAL_CLIENTS, ...POTENTIAL_CLIENTS];

  if (variant === "dashboard") {
    return (
      <div className={cn("overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm", className)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              Sector Solidario y Cooperativo
            </div>
            <h3 className="mt-1 text-[16px] font-semibold text-slate-900 tracking-tight">
              Algunos de nuestros potenciales clientes
            </h3>
            <p className="text-[12.5px] text-slate-500">
              Entidades financieras y cooperativas en Colombia con alto potencial de modernización e inteligencia poblacional
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* MARQUEE CAROUSEL */}
        <div className="relative mt-4 overflow-hidden">
          {/* Gradient Edge Masks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent" />

          <div
            ref={scrollContainerRef}
            className="flex items-center overflow-x-auto py-2 no-scrollbar scrollbar-none"
          >
            <div className="nexa-marquee-track items-center gap-4">
              {displayItems.map((client, idx) => (
                <div
                  key={`${client.id}-${idx}`}
                  className="group relative flex h-24 w-48 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/50 p-3 transition-all duration-300 hover:border-indigo-300 hover:bg-white hover:shadow-md"
                >
                  <div className="relative flex h-12 w-full items-center justify-center">
                    <Image
                      src={client.logo}
                      alt={client.name}
                      width={140}
                      height={48}
                      className="max-h-11 w-auto max-w-[130px] object-contain grayscale contrast-125 opacity-75 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                    />
                  </div>
                  <span className="mt-1 text-[11px] font-medium text-slate-500 transition-colors group-hover:text-slate-800">
                    {client.shortName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variant "login" (default)
  return (
    <div className={cn("w-full", className)}>
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-2xs backdrop-blur-xs">
          <Building2 className="h-3.5 w-3.5 text-indigo-500" />
          <span>Ecosistema Financiero y Cooperativo</span>
        </div>
        <h4 className="mt-2 text-[14px] sm:text-[15px] font-semibold tracking-tight text-slate-800">
          Algunos de nuestros potenciales clientes
        </h4>
        <p className="mt-0.5 text-[12px] text-slate-500 max-w-md mx-auto">
          Plataforma diseñada para las principales entidades de ahorro, crédito y cooperativismo en Colombia
        </p>
      </div>

      {/* CONTINUOUS MARQUEE CAROUSEL IN SUBTLE GRAYSCALE */}
      <div className="relative mt-4 overflow-hidden">
        {/* Soft Fade Edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-28 bg-gradient-to-r from-slate-50/90 sm:from-slate-50 via-slate-50/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-28 bg-gradient-to-l from-slate-50/90 sm:from-slate-50 via-slate-50/70 to-transparent" />

        <div className="nexa-marquee-track items-center gap-4 py-2">
          {displayItems.map((client, idx) => (
            <div
              key={`${client.id}-${idx}`}
              className="group relative flex h-20 w-44 sm:w-48 shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-300 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="relative flex h-11 w-full items-center justify-center">
                <Image
                  src={client.logo}
                  alt={client.name}
                  width={130}
                  height={44}
                  className="max-h-10 w-auto max-w-[125px] object-contain grayscale contrast-125 opacity-75 transition-all duration-300 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                />
              </div>
              <span className="mt-0.5 text-[10.5px] font-medium tracking-tight text-slate-500 transition-colors group-hover:text-slate-800">
                {client.shortName}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
