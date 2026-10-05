"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  Compass,
  FileCheck2,
  FileText,
  Filter,
  GraduationCap,
  HardHat,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  Layers,
  MapPin,
  Megaphone,
  Mic,
  PhoneCall,
  Scale,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
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
  renderIllustration: () => React.ReactNode;
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
    renderIllustration: () => (
      <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-ink-900 to-indigo-950 p-4 text-white shadow-inner">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -top-12 -right-8 h-28 w-28 rounded-full bg-indigo-500/30 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-cyan-500/20 blur-2xl" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          {/* Top Bar with mock app header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300">
                <LayoutDashboard className="h-3.5 w-3.5" />
              </span>
              <span className="text-[12px] font-semibold tracking-wide text-slate-200">
                Panel Ejecutivo de Inteligencia
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              En vivo
            </span>
          </div>

          {/* Mini Cards Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-xs">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Users className="h-3 w-3 text-indigo-400" />
                Población
              </div>
              <div className="mt-1 text-[15px] font-bold text-white tracking-tight">23.746</div>
              <div className="text-[9.5px] text-emerald-400 font-medium">95.8% contactable</div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 backdrop-blur-xs">
              <div className="flex items-center gap-1 text-[10px] text-amber-300">
                <HeartPulse className="h-3 w-3 text-amber-400" />
                Discapacidad
              </div>
              <div className="mt-1 text-[15px] font-bold text-amber-200 tracking-tight">99.9%</div>
              <div className="text-[9.5px] text-amber-300/80 font-medium">Brecha prioritaria</div>
            </div>

            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 backdrop-blur-xs">
              <div className="flex items-center gap-1 text-[10px] text-cyan-300">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                Enriquecidos IA
              </div>
              <div className="mt-1 text-[15px] font-bold text-cyan-200 tracking-tight">16.2K</div>
              <div className="text-[9.5px] text-cyan-300/80 font-medium">68.3% completado</div>
            </div>
          </div>

          {/* Mini Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-300">
              <span>Cobertura de Caracterización Global</span>
              <span className="font-semibold text-indigo-300">68%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[68%] rounded-full bg-linear-to-r from-indigo-500 via-purple-500 to-cyan-400" />
            </div>
          </div>
        </div>
      </div>
    ),
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
    renderIllustration: () => (
      <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-linear-to-br from-slate-50 via-slate-100 to-blue-50/40 p-4 border border-slate-200/80 shadow-inner">
        <div className="flex flex-col h-full justify-between">
          {/* Mock Search Bar & Filters */}
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11.5px] text-slate-500">Buscar por nombre o cédula...</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 shadow-2xs">
              <Filter className="h-3 w-3 text-indigo-600" />
              <span>Filtros</span>
            </div>
          </div>

          {/* Mock Person Cards / Row Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500 to-cyan-500 text-[11px] font-bold text-white shadow-xs">
                  CR
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-slate-900 leading-tight">
                    Carlos Alberto Rodríguez
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5 text-slate-400" />
                      Bucaramanga
                    </span>
                    <span>·</span>
                    <span className="font-medium text-slate-600">Empleado</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  Perfil 64%
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <PhoneCall className="h-3 w-3" />
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-tr from-violet-500 to-pink-500 text-[11px] font-bold text-white shadow-xs">
                  MG
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-slate-900 leading-tight">
                    María Elena Gómez
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5 text-slate-400" />
                      Floridablanca
                    </span>
                    <span>·</span>
                    <span className="font-medium text-amber-700">Discapacidad pendiente</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                  Perfil 32%
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <PhoneCall className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
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
    renderIllustration: () => (
      <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-linear-to-br from-indigo-950 via-slate-900 to-violet-950 p-4 text-white shadow-inner">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-violet-600/25 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          {/* Header of Active Call simulation */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-500/30 text-violet-300">
                <Mic className="h-3.5 w-3.5" />
              </span>
              <span className="text-[12px] font-semibold text-slate-200">
                Agente de Voz NEXA (VAPI / Retell)
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/30">
              Acento Colombiano
            </span>
          </div>

          {/* Sound Wave Animation / Conversation mockup */}
          <div className="my-auto flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-tr from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/30">
                <Volume2 className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="text-[11.5px] font-semibold text-white">
                  Llamando a Laura Mantilla
                </div>
                <div className="text-[10px] text-slate-300 italic">
                  &ldquo;¿Cuenta con alguna condición de salud o discapacidad?&rdquo;
                </div>
              </div>
            </div>

            {/* Simulated Animated Bars */}
            <div className="flex items-center gap-1">
              <span className="h-3 w-1 rounded-full bg-cyan-400 animate-pulse" />
              <span className="h-6 w-1 rounded-full bg-indigo-400 animate-pulse delay-75" />
              <span className="h-8 w-1 rounded-full bg-violet-400 animate-pulse delay-150" />
              <span className="h-5 w-1 rounded-full bg-pink-400 animate-pulse delay-200" />
              <span className="h-3 w-1 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </div>

          {/* Campaign target summary badge */}
          <div className="flex items-center justify-between text-[10.5px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              Auto-actualización directa en Postgres / Supabase
            </span>
            <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300 font-semibold text-[9.5px]">
              Modo Seguro Activo
            </span>
          </div>
        </div>
      </div>
    ),
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
    renderIllustration: () => (
      <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-slate-950 to-emerald-950 p-4 text-white shadow-inner">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-emerald-600/25 blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between">
          {/* Header with Sergio Flórez badge */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/30 text-emerald-300">
                <Scale className="h-3.5 w-3.5" />
              </span>
              <span className="text-[12px] font-semibold text-slate-200">
                NEXA Laboral AI · Chat Jurídico
              </span>
            </div>
            <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[9.5px] font-semibold text-amber-300 border border-amber-400/30">
              Sergio Flórez Abogados
            </span>
          </div>

          {/* Mock Chat Exchange */}
          <div className="space-y-2">
            {/* User prompt mock */}
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-xl rounded-tr-none bg-indigo-600/80 px-3 py-1.5 text-[11px] text-white shadow-xs">
                ¿Qué amparo otorga la estabilidad reforzada por discapacidad?
              </div>
            </div>

            {/* AI Response mock */}
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/30 text-emerald-300 mt-0.5">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="max-w-[85%] rounded-xl rounded-tl-none border border-white/10 bg-white/5 p-2 text-[10.5px] leading-relaxed text-slate-200">
                Según el <span className="font-semibold text-emerald-300">Art. 26 Ley 361 de 1997</span> y la jurisprudencia de la Corte Constitucional, requiere autorización previa del Ministerio de Trabajo.
              </div>
            </div>
          </div>

          {/* Quick Legal Reference Footer */}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 border-t border-white/10 pt-1.5">
            <FileText className="h-3 w-3 text-emerald-400" />
            <span>Respaldado con Código Sustantivo del Trabajo y Ley 2466 de 2025</span>
          </div>
        </div>
      </div>
    ),
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
    renderIllustration: () => (
      <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-linear-to-br from-amber-50/70 via-slate-50 to-orange-50/50 p-4 border border-amber-200/70 shadow-inner">
        <div className="flex flex-col h-full justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-800">
                <BookOpen className="h-3.5 w-3.5" />
              </span>
              <span className="text-[12px] font-semibold text-slate-800">
                Documentos & Fuentes Jurídicas Indexadas
              </span>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
              Vectorizado
            </span>
          </div>

          {/* Grid of Documents */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-900 truncate">
                  Ley 2466 de 2025
                </div>
                <div className="text-[9.5px] text-slate-500 truncate">
                  Reforma Laboral Colombia
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-900 truncate">
                  Ley 361 de 1997
                </div>
                <div className="text-[9.5px] text-slate-500 truncate">
                  Protección e Inclusión
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-900 truncate">
                  Sentencias Corte Const.
                </div>
                <div className="text-[9.5px] text-slate-500 truncate">
                  Estabilidad Ocupacional
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-900 truncate">
                  Código Sustantivo Trabajo
                </div>
                <div className="text-[9.5px] text-slate-500 truncate">
                  Régimen Laboral Completo
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1">
            <span>Búsqueda semántica integrada al chat</span>
            <span className="font-medium text-indigo-600">Alimentación Continua</span>
          </div>
        </div>
      </div>
    ),
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

  // Close on Escape key or keyboard navigation
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
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-950/30 animate-scale-in"
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

            {/* Step Content with Illustration Banner */}
            <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
              {/* REPRESENTATIVE ILLUSTRATION / PREVIEW CARD */}
              <div className="w-full">
                {currentStep.renderIllustration()}
              </div>

              {/* Title and Icon */}
              <div className="flex items-start gap-3.5 pt-1">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br shadow-md",
                    currentStep.iconBg,
                  )}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[18px] font-semibold tracking-tight text-slate-900 leading-snug">
                    {currentStep.title}
                  </h3>
                  <p className="mt-0.5 text-[12.5px] font-medium text-indigo-600">
                    {currentStep.headline}
                  </p>
                </div>
              </div>

              <p className="text-[13px] leading-relaxed text-slate-600">
                {currentStep.description}
              </p>

              {/* Highlights bullet cards */}
              <div className="space-y-1.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Capacidades principales:
                </div>
                {currentStep.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px] text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Destination Direct Link */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[12px]">
                <span className="text-slate-400">Ir a esta sección en vivo:</span>
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
            <div className="flex items-center justify-center gap-1.5 px-6 pb-2 pt-1 border-t border-slate-100/60">
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
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
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
