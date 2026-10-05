"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  LayoutDashboard,
  Megaphone,
  PhoneCall,
  Scale,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/format";

export interface TourStep {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  headline: string;
  description: string;
  highlights: string[];
  destinationHref: string;
  destinationLabel: string;
  icon: typeof LayoutDashboard;
  iconBg: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    badge: "1. Visión General",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    title: "Resumen Ejecutivo",
    headline: "Visibilidad integral e indicadores en tiempo real",
    description:
      "El punto de partida con el diagnóstico poblacional completo de la organización. Monitorea cobertura de datos, asociados contactables y brechas de información laboral.",
    highlights: [
      "KPIs calculados en vivo sobre la base de datos",
      "Diagnóstico prioritario en inclusión y discapacidad",
      "Monitoreo de campañas activas y cobertura geográfica",
    ],
    destinationHref: "/dashboard",
    destinationLabel: "Ver Resumen Ejecutivo",
    icon: LayoutDashboard,
    iconBg: "from-indigo-600 to-indigo-800 text-white shadow-indigo-500/25",
  },
  {
    id: "people",
    badge: "2. Censo y Padrón",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    title: "Inteligencia de Personas",
    headline: "Ficha 360° individual y colectiva de cada asociado",
    description:
      "Explora el universo poblacional completo. Filtra por municipio, estado laboral, nivel de completitud de datos o alertas de discapacidad. Permite iniciar llamadas individuales con IA directamente.",
    highlights: [
      "Búsqueda instantánea y filtros multidimensionales",
      "Detalle de salud, trabajo, educación y contacto",
      "Disparo de llamada de voz con IA por persona y campaña",
    ],
    destinationHref: "/people",
    destinationLabel: "Ir a Inteligencia de Personas",
    icon: Users,
    iconBg: "from-blue-600 to-cyan-600 text-white shadow-blue-500/25",
  },
  {
    id: "campaigns",
    badge: "3. Automatización de Voz",
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
    title: "Campañas con IA de Voz",
    headline: "Recolección proactiva y enriquecimiento telefónico autónomo",
    description:
      "Crea y ejecuta campañas masivas o específicas utilizando agentes de voz con IA en español colombiano. El agente llama, indaga amablemente y actualiza la base de datos automáticamente.",
    highlights: [
      "Diseño guiado de campañas con objetivos específicos",
      "Modo seguro (Safe Mode) para simulación y pruebas en vivo",
      "Métricas de contacto, tasa de respuesta y actualización automática",
    ],
    destinationHref: "/campaigns",
    destinationLabel: "Explorar Campañas con IA",
    icon: Megaphone,
    iconBg: "from-violet-600 to-purple-700 text-white shadow-violet-500/25",
  },
  {
    id: "labor-ai",
    badge: "4. Asesoría Jurídica",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    title: "NEXA Laboral AI",
    headline: "Consultoría laboral y pensional con respaldo de Sergio Flórez Abogados",
    description:
      "Asistente conversacional especializado en el Código Sustantivo del Trabajo, estabilidad laboral reforzada, fueros de salud, pensiones y la Reforma Laboral (Ley 2466 de 2025).",
    highlights: [
      "Respuestas fundamentadas en normativa y jurisprudencia colombiana",
      "Análisis de riesgos y protocolos para casos de discapacidad",
      "Citas directas y recomendaciones jurídicas prácticas",
    ],
    destinationHref: "/labor-ai",
    destinationLabel: "Consultar a NEXA Laboral AI",
    icon: Scale,
    iconBg: "from-emerald-600 to-teal-700 text-white shadow-emerald-500/25",
  },
  {
    id: "knowledge",
    badge: "5. Biblioteca Normativa",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    title: "Centro de Conocimiento",
    headline: "Leyes, jurisprudencia y documentos indexados",
    description:
      "Repositorio documental que nutre a los modelos de IA de la plataforma. Consulta la legislación vigente, sentencias de la Corte Constitucional y sube documentación corporativa.",
    highlights: [
      "Documentos normativos colombianos indexados y vectorizados",
      "Búsqueda semántica por conceptos laborales y pensionales",
      "Opción de indexar nuevos reglamentos o acuerdos internos",
    ],
    destinationHref: "/knowledge",
    destinationLabel: "Ver Centro de Conocimiento",
    icon: BookOpen,
    iconBg: "from-amber-600 to-orange-600 text-white shadow-amber-500/25",
  },
];

export function GuidedTourButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setOpen(false);
      setCurrentStepIndex(0);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setCurrentStepIndex(0);
    setOpen(true);
  };

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentStepIndex]);

  const IconComponent = currentStep.icon;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "group inline-flex items-center gap-2 rounded-xl border border-indigo-400/40 bg-linear-to-r from-indigo-500/20 via-indigo-600/30 to-violet-500/20 px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_0_15px_-3px_rgba(99,102,241,0.35)] backdrop-blur transition-all duration-200 hover:border-indigo-300 hover:shadow-[0_0_20px_0_rgba(99,102,241,0.5)] hover:brightness-110 active:scale-[0.98]",
          className,
        )}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-linear-to-tr from-indigo-500 to-cyan-400 text-white shadow-xs transition-transform duration-200 group-hover:rotate-12">
          <Compass className="h-3 w-3" />
        </span>
        <span className="font-medium tracking-wide">Tour Guiado</span>
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-950/30 animate-scale-in"
          >
            {/* Top decorative gradient bar */}
            <div className="h-1.5 w-full bg-linear-to-r from-indigo-500 via-purple-500 to-cyan-400" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 pt-5 pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
                    currentStep.badgeColor,
                  )}
                >
                  {currentStep.badge}
                </span>
                <span className="text-[12px] font-medium text-slate-400">
                  {currentStepIndex + 1} de {TOUR_STEPS.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step Content */}
            <div className="px-6 py-5">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br shadow-md",
                    currentStep.iconBg,
                  )}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[18px] font-semibold tracking-tight text-slate-900">
                    {currentStep.title}
                  </h3>
                  <p className="mt-0.5 text-[13px] font-medium text-indigo-600">
                    {currentStep.headline}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[13.5px] leading-relaxed text-slate-600">
                {currentStep.description}
              </p>

              {/* Highlights bullet cards */}
              <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Capacidades principales:
                </div>
                {currentStep.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12.5px] text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Destination Direct Link */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[12px]">
                <span className="text-slate-400">Acceso directo a la vista:</span>
                <Link
                  href={currentStep.destinationHref}
                  onClick={handleClose}
                  className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
                >
                  {currentStep.destinationLabel}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Step Indicators / Dots */}
            <div className="flex items-center justify-center gap-1.5 px-6 pb-2">
              {TOUR_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    idx === currentStepIndex
                      ? "w-7 bg-indigo-600"
                      : "w-2 bg-slate-200 hover:bg-slate-300",
                  )}
                  aria-label={`Paso ${idx + 1}`}
                />
              ))}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isFirst}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900",
                  isFirst && "opacity-40 cursor-not-allowed hover:bg-white hover:text-slate-700",
                )}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Anterior
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[13px] font-medium text-white shadow-md transition hover:bg-slate-800 active:scale-[0.98]"
              >
                {isLast ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Finalizar Tour
                  </>
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
