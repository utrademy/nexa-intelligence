"use client";

import {
  Check,
  ChevronRight,
  Filter,
  FileText,
  Loader2,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  PhoneCall,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { AiCampaign, Channel } from "@/lib/types";
import { cn, formatNumber } from "@/lib/format";

const STEPS = ["Objetivo", "Segmentación", "Canal", "Revisión"];

const OBJECTIVE_OPTIONS = [
  {
    id: "integral_100",
    title: "Caracterización integral 100% (Perfil total)",
    desc: "Cerrar exhaustivamente las 7 dimensiones del perfil (34 campos: laboral, hogar, educación, finanzas, social e inclusión) hasta alcanzar el 100% de completitud institucional.",
  },
  {
    id: "completar_caracterizacion",
    title: "Completar caracterización (Vacíos críticos ~70%)",
    desc: "Cerrar vacíos críticos en perfiles incompletos recopilando información laboral, del hogar y socioeconómica.",
  },
  {
    id: "actualizar_informacion",
    title: "Actualizar información (~60%)",
    desc: "Renovar datos de contacto, ocupación, antigüedad y rango de ingresos para asociados antiguos.",
  },
  {
    id: "encuesta_validacion",
    title: "Encuesta / validación (Ley 1581)",
    desc: "Validar datos clave y recolectar consentimiento formal de tratamiento de datos Ley 1581.",
  },
];

const CHANNEL_OPTIONS: {
  id: Channel;
  label: string;
  desc: string;
  icon: typeof PhoneCall;
  active: boolean;
  badge: string;
}[] = [
  {
    id: "voice",
    label: "Llamada con IA",
    desc: "Agente de voz interactivo en español con entonación natural colombiana y extracción estructurada.",
    icon: PhoneCall,
    active: true,
    badge: "ACTIVO",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    desc: "Flujos conversacionales interactivos por mensajería empresarial.",
    icon: MessageCircle,
    active: false,
    badge: "Próximamente",
  },
  {
    id: "sms",
    label: "SMS / Formulario",
    desc: "Enlaces personalizados con verificación de identidad y formulario cifrado.",
    icon: MessageSquareText,
    active: false,
    badge: "Próximamente",
  },
];

const CITIES = [
  { id: "all", label: "Todos los municipios" },
  { id: "Bucaramanga", label: "Bucaramanga" },
  { id: "Floridablanca", label: "Floridablanca" },
  { id: "Girón", label: "Girón" },
  { id: "Piedecuesta", label: "Piedecuesta" },
  { id: "Barrancabermeja", label: "Barrancabermeja" },
  { id: "San Gil", label: "San Gil" },
  { id: "Medellín", label: "Medellín" },
];

const EMPLOYMENT_STATUSES = [
  { id: "all", label: "Todas las situaciones" },
  { id: "Empleado", label: "Empleado" },
  { id: "Independiente", label: "Independiente" },
  { id: "Informal", label: "Informal" },
  { id: "Desempleado", label: "Desempleado" },
  { id: "Pensionado", label: "Pensionado" },
  { id: "Estudiante", label: "Estudiante" },
  { id: "Sin información", label: "Sin información (Vacío)" },
];

const EDUCATION_LEVELS = [
  { id: "all", label: "Todos los niveles" },
  { id: "Primaria", label: "Primaria" },
  { id: "Secundaria", label: "Secundaria" },
  { id: "Técnico", label: "Técnico" },
  { id: "Tecnólogo", label: "Tecnólogo" },
  { id: "Profesional", label: "Profesional" },
  { id: "Posgrado", label: "Posgrado" },
  { id: "Sin información", label: "Sin información (Vacío)" },
];

interface MatchingPerson {
  id: string;
  fullName: string;
  documentNumber: string;
  city: string;
  employmentStatus: string;
  educationLevel: string;
  characterizationScore: number;
}

export function CreateCampaignModal({
  open,
  onClose,
  onLaunch,
}: {
  open: boolean;
  onClose: () => void;
  onLaunch: (campaign: AiCampaign) => void;
  audiencePresets?: any[];
  collectableFields?: string[];
  initialAudience?: number;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Campaña de Caracterización Prioritaria con IA");
  const [objectiveType, setObjectiveType] = useState("integral_100");
  const [objectiveDesc, setObjectiveDesc] = useState(
    "Cerrar exhaustivamente las 7 dimensiones del perfil (34 campos: laboral, hogar, educación, finanzas, social e inclusión) hasta alcanzar el 100% de completitud institucional.",
  );

  // Filters (Real Supabase query)
  const [incompletenessFilter, setIncompletenessFilter] = useState<
    "all_incomplete" | "critical_gaps" | "score_lt_70" | "score_lt_85"
  >("critical_gaps");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedEmployment, setSelectedEmployment] = useState("all");
  const [selectedEducation, setSelectedEducation] = useState("all");

  // Dynamic calculation state
  const [matchingCount, setMatchingCount] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [previewPeople, setPreviewPeople] = useState<MatchingPerson[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Execution state
  const [selectedChannel, setSelectedChannel] = useState<Channel>("voice");
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<AiCampaign | null>(null);

  // Calculate live count from Supabase whenever filters change
  useEffect(() => {
    if (!open) return;
    let isCancelled = false;

    async function calculateCount() {
      setIsCalculating(true);
      try {
        const queryParams = new URLSearchParams({
          incompletenessFilter,
          city: selectedCity,
          employmentStatus: selectedEmployment,
          educationLevel: selectedEducation,
        });

        const res = await fetch(`/api/campaigns?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Error fetching count");
        const data = await res.json();
        if (!isCancelled) {
          setMatchingCount(typeof data.count === "number" ? data.count : 0);
        }
      } catch (err) {
        console.error("Failed to calculate matching count:", err);
      } finally {
        if (!isCancelled) setIsCalculating(false);
      }
    }

    calculateCount();
    return () => {
      isCancelled = true;
    };
  }, [open, incompletenessFilter, selectedCity, selectedEmployment, selectedEducation]);

  // Load preview candidates on Step 1
  useEffect(() => {
    if (!open || step !== 1) return;
    let isCancelled = false;

    async function fetchPreview() {
      setIsLoadingPreview(true);
      try {
        const queryParams = new URLSearchParams({
          incompletenessFilter,
          city: selectedCity,
          employmentStatus: selectedEmployment,
          educationLevel: selectedEducation,
          limit: "5",
        });

        const res = await fetch(`/api/campaigns/preview?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Error fetching preview");
        const data = await res.json();
        if (!isCancelled) {
          setPreviewPeople(data.people || []);
        }
      } catch (err) {
        console.error("Failed to load preview:", err);
      } finally {
        if (!isCancelled) setIsLoadingPreview(false);
      }
    }

    fetchPreview();
    return () => {
      isCancelled = true;
    };
  }, [open, step, incompletenessFilter, selectedCity, selectedEmployment, selectedEducation]);

  const close = () => {
    onClose();
    setTimeout(() => {
      setStep(0);
      setLaunched(false);
      setLaunching(false);
      setCreatedCampaign(null);
    }, 200);
  };

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: objectiveDesc,
          channel: "voice",
          filters: {
            incompletenessFilter,
            city: selectedCity,
            employmentStatus: selectedEmployment,
            educationLevel: selectedEducation,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando campaña");

      const newCamp: AiCampaign = {
        id: data.campaignId,
        name,
        objective: objectiveDesc,
        status: "Activa",
        audience: data.audienceCount || matchingCount || 0,
        contacted: 0,
        responded: 0,
        completed: 0,
        channels: ["voice"],
        startDate: new Date().toISOString().slice(0, 10),
        endDate: "2026-12-31",
        owner: "Laura Mantilla",
      };

      setCreatedCampaign(newCamp);
      onLaunch(newCamp);
      setLaunched(true);
    } catch (err) {
      console.error("Error creating campaign:", err);
      alert("Hubo un error al guardar la campaña en la base de datos.");
    } finally {
      setLaunching(false);
    }
  };

  const canContinue = step === 0 ? name.trim().length > 0 : true;

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title={launched ? "Campaña creada con éxito" : "Crear campaña con IA"}
      subtitle={
        launched
          ? "La campaña se ha registrado en Supabase y está lista para ejecución."
          : "Configure el objetivo, seleccione el segmento real y active la campaña con IA."
      }
      icon={<Megaphone className="h-5 w-5 text-indigo-600" />}
      footer={
        launched ? (
          <>
            <span className="text-[12px] text-slate-400">Registrada en Supabase · Modo seguro disponible</span>
            <Button onClick={close}>Ver campaña</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={step === 0 ? close : () => setStep(step - 1)}>
              {step === 0 ? "Cancelar" : "Atrás"}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button disabled={!canContinue} onClick={() => setStep(step + 1)}>
                Continuar
              </Button>
            ) : (
              <Button variant="ai" onClick={handleLaunch} disabled={launching}>
                {launching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando en Supabase…
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Crear y activar campaña
                  </>
                )}
              </Button>
            )}
          </>
        )
      }
    >
      {launched && createdCampaign ? (
        <div className="flex animate-scale-in flex-col items-center py-6 text-center">
          <div className="relative">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-400/40" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
              <Check className="h-8 w-8" />
            </div>
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">{createdCampaign.name}</h3>
          <p className="mt-1 max-w-md text-[13.5px] text-slate-500">
            Campaña registrada con <b>{formatNumber(createdCampaign.audience)}</b> asociados calculados de la base de datos real.
          </p>
          <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left">
              <div className="text-[11px] text-slate-500">Canal activo</div>
              <div className="mt-1 flex items-center gap-1.5 font-semibold text-violet-700">
                <PhoneCall className="h-3.5 w-3.5" />
                Llamada con IA
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left">
              <div className="text-[11px] text-slate-500">Audiencia real</div>
              <div className="mt-1 text-base font-bold text-slate-900 tabular-nums">
                {formatNumber(createdCampaign.audience)} asociados
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-2 max-w-md rounded-xl bg-violet-50 p-3 text-left text-[12.5px] text-violet-900 border border-violet-200">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <span>
              Puede probar esta campaña de inmediato en el <b>Modo Demostración Seguro</b> seleccionando un asociado de la audiencia y digitando su número de prueba.
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* STEP INDICATOR */}
          <div className="mb-6 flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition",
                    i < step
                      ? "bg-emerald-500 text-white"
                      : i === step
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-400",
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "hidden truncate text-[12px] font-medium md:block",
                    i === step ? "text-slate-900" : "text-slate-400",
                  )}
                >
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1", i < step ? "bg-emerald-300" : "bg-slate-200")} />
                )}
              </div>
            ))}
          </div>

          <div key={step} className="animate-fade-in">
            {/* STEP 0: OBJETIVO Y NOMBRE */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-slate-700">Nombre de la campaña</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-[14px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Ej. Caracterización Laboral Bucaramanga"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-700">Objetivo estratégico</label>
                  <div className="mt-2 space-y-2.5">
                    {OBJECTIVE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setObjectiveType(opt.id);
                          setObjectiveDesc(opt.desc);
                        }}
                        className={cn(
                          "w-full rounded-xl border p-3.5 text-left transition",
                          objectiveType === opt.id
                            ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-500/10"
                            : "border-slate-200 hover:border-slate-300",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[13.5px] font-semibold text-slate-900">{opt.title}</span>
                          {objectiveType === opt.id && <Check className="h-4 w-4 text-indigo-600" />}
                        </div>
                        <p className="mt-1 text-[12px] text-slate-500">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-slate-700">Descripción detallada</label>
                  <textarea
                    rows={2}
                    value={objectiveDesc}
                    onChange={(e) => setObjectiveDesc(e.target.value)}
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            )}

            {/* STEP 1: SEGMENTACIÓN REAL DE SUPABASE */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-indigo-200 bg-linear-to-r from-indigo-50/70 to-violet-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-indigo-700">
                      Audiencia calculada en tiempo real
                    </span>
                    {isCalculating && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                      {isCalculating ? "…" : formatNumber(matchingCount ?? 0)}
                    </span>
                    <span className="text-[14px] font-medium text-slate-600">personas encontradas</span>
                  </div>
                  <p className="mt-1 text-[12px] text-slate-500">
                    Cálculo exacto sobre la tabla <code>people</code> de Supabase según los filtros seleccionados.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[12px] font-medium text-slate-700">Nivel de completitud</label>
                    <select
                      value={incompletenessFilter}
                      onChange={(e) => setIncompletenessFilter(e.target.value as any)}
                      className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="critical_gaps">Vacíos críticos (perfil incompleto)</option>
                      <option value="score_lt_70">Puntaje menor al 70%</option>
                      <option value="score_lt_85">Puntaje menor al 85%</option>
                      <option value="all_incomplete">Toda la población con vacíos (&lt;100%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700">Municipio / Ciudad</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      {CITIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700">Situación laboral</label>
                    <select
                      value={selectedEmployment}
                      onChange={(e) => setSelectedEmployment(e.target.value)}
                      className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      {EMPLOYMENT_STATUSES.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-slate-700">Nivel educativo</label>
                    <select
                      value={selectedEducation}
                      onChange={(e) => setSelectedEducation(e.target.value)}
                      className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      {EDUCATION_LEVELS.map((ed) => (
                        <option key={ed.id} value={ed.id}>
                          {ed.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* PREVIEW OF MATCHING PEOPLE */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                  <div className="flex items-center justify-between text-[12px] font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-600" />
                      Muestra preliminar de asociados en este segmento
                    </span>
                    {isLoadingPreview && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                  </div>

                  <div className="mt-2.5 space-y-1.5">
                    {previewPeople.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-[12px]"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">{p.fullName}</span>
                          <span className="ml-2 text-slate-400">· {p.city}</span>
                          <div className="text-[11px] text-slate-500">
                            Laboral: <b>{p.employmentStatus}</b> · Edu: <b>{p.educationLevel}</b>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 tabular-nums">
                            {p.characterizationScore}% completado
                          </span>
                        </div>
                      </div>
                    ))}
                    {previewPeople.length === 0 && !isLoadingPreview && (
                      <div className="py-2 text-center text-[12px] text-slate-400">
                        No se encontraron registros con los filtros seleccionados.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SELECCIÓN DE CANAL */}
            {step === 2 && (
              <div className="space-y-3">
                <div className="text-[13px] text-slate-600">
                  Seleccione el canal de contacto para esta campaña. El canal de voz se encuentra plenamente integrado con Voice AI.
                </div>

                <div className="space-y-2.5">
                  {CHANNEL_OPTIONS.map((c) => {
                    const isSelected = selectedChannel === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={!c.active}
                        onClick={() => setSelectedChannel(c.id)}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition",
                          !c.active && "cursor-not-allowed opacity-60 bg-slate-50 border-slate-200",
                          c.active && isSelected
                            ? "border-violet-500 bg-violet-50/50 ring-2 ring-violet-500/15"
                            : c.active && "border-slate-200 hover:border-slate-300",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                            c.active ? "bg-violet-600 text-white shadow-md shadow-violet-500/20" : "bg-slate-200 text-slate-400",
                          )}
                        >
                          <c.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-slate-900">{c.label}</span>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase",
                                c.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600",
                              )}
                            >
                              {c.badge}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[12.5px] text-slate-500">{c.desc}</p>
                        </div>
                        {c.active && (
                          <div
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border",
                              isSelected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300",
                            )}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: REVISIÓN */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                  <div className="flex gap-4 px-4 py-3 text-[13px]">
                    <span className="w-28 shrink-0 text-slate-400 font-medium">Campaña:</span>
                    <span className="font-semibold text-slate-900">{name}</span>
                  </div>
                  <div className="flex gap-4 px-4 py-3 text-[13px]">
                    <span className="w-28 shrink-0 text-slate-400 font-medium">Objetivo:</span>
                    <span className="text-slate-700">{objectiveDesc}</span>
                  </div>
                  <div className="flex gap-4 px-4 py-3 text-[13px]">
                    <span className="w-28 shrink-0 text-slate-400 font-medium">Audiencia real:</span>
                    <span className="font-bold text-indigo-700 tabular-nums">
                      {formatNumber(matchingCount ?? 0)} asociados (Supabase)
                    </span>
                  </div>
                  <div className="flex gap-4 px-4 py-3 text-[13px]">
                    <span className="w-28 shrink-0 text-slate-400 font-medium">Canal activo:</span>
                    <span className="flex items-center gap-1.5 font-semibold text-violet-700">
                      <PhoneCall className="h-3.5 w-3.5" />
                      Llamada con IA (Español colombiano · Voz real)
                    </span>
                  </div>
                  <div className="flex gap-4 px-4 py-3 text-[13px]">
                    <span className="w-28 shrink-0 text-slate-400 font-medium">Filtro aplicado:</span>
                    <span className="text-slate-600">
                      {incompletenessFilter === "critical_gaps"
                        ? "Vacíos críticos"
                        : incompletenessFilter === "score_lt_70"
                          ? "Puntaje < 70%"
                          : "Puntaje < 100%"}
                      {selectedCity !== "all" ? ` · ${selectedCity}` : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/80 p-3.5 text-[12.5px] text-emerald-950 ring-1 ring-inset ring-emerald-600/15">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <span className="font-semibold">Consentimiento y Modo Seguro:</span> Toda llamada solicita autorización previa según la Ley 1581 de 2012. En el modo de demostración para ventas, nunca se llamará a números sintéticos de la base de datos sin autorización manual del operador.
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
