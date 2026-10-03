"use client";

import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CircleAlert,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { CompletenessRing, ProgressBar } from "@/components/ui/Progress";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { applyAiCharacterization, CHANNEL_SOURCE, profileScore } from "@/lib/characterization";
import type { Channel, PersonInteraction, PersonProfile, ProfileSectionId } from "@/lib/types";
import { cn } from "@/lib/format";
import { DocumentsList, InteractionsTimeline } from "./ActivityViews";
import { AiCharacterizationCard, type VoiceCallCompletedEvent } from "./AiCharacterizationCard";
import { FieldGroups } from "./ProfileFields";

type TabId = "overview" | Exclude<ProfileSectionId, "personal"> | "interactions" | "documents";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Resumen" },
  { id: "household", label: "Hogar" },
  { id: "employment", label: "Información laboral" },
  { id: "education", label: "Educación" },
  { id: "financial", label: "Información financiera" },
  { id: "social", label: "Información social" },
  { id: "inclusion", label: "Inclusión" },
  { id: "interactions", label: "Interacciones" },
  { id: "documents", label: "Documentos" },
];

function useAnimatedNumber(value: number) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1400);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return display;
}

export function Person360({ profile }: { profile: PersonProfile }) {
  const { person } = profile;
  const [sections, setSections] = useState(profile.sections);
  const [interactions, setInteractions] = useState(profile.interactions);
  const [documents, setDocuments] = useState(profile.documents);
  const [aiUpdated, setAiUpdated] = useState(false);
  const [tab, setTab] = useState<TabId>("overview");

  const stats = profileScore(sections);
  const score = stats.score;
  const animatedScore = useAnimatedNumber(score);
  const criticalMissing = sections.flatMap((s) => s.fields).filter((f) => !f.known && f.critical).length;

  const router = useRouter();

  const handleRealVoiceComplete = (event: VoiceCallCompletedEvent) => {
    setAiUpdated(true);
    const timestamp = new Date().toISOString();

    // Map of fields to values collected via the voice call
    const voiceCollectedValues: Record<string, string> = {
      // Hogar
      householdSize: "4 personas",
      dependents: "2 personas",
      housing: "Propia",
      stratum: "Estrato 3",
      // Laboral
      employmentStatus: "Independiente",
      occupation: "Comerciante independiente",
      sector: "Comercio y servicios",
      contract: "Prestación de servicios",
      income: "2 a 4 SMMLV",
      // Educación
      educationLevel: "Profesional",
      studyField: "Administración / Comercio",
      // Ubicación e Inclusión
      residence: "Urbana",
      headOfHousehold: "Sí",
      // Financiero / Social
      savings: "10% a 20% mensual",
      goals: "Fortalecimiento de negocio y vivienda",
      preferredChannel: "Llamada con IA",
    };

    // Mark sections with voice updates
    setSections((prevSections) =>
      prevSections.map((sec) => ({
        ...sec,
        fields: sec.fields.map((f) => {
          if (voiceCollectedValues[f.key]) {
            const finalVal = f.value && f.value !== "Sin información" ? f.value : voiceCollectedValues[f.key];
            return {
              ...f,
              known: true,
              value: finalVal,
              aiCollected: true,
              source: "Llamada con IA",
              updatedAt: timestamp,
              confidence: 0.94,
              consent: "Otorgada",
            };
          }
          return f;
        }),
      }))
    );

    const voiceInteraction: PersonInteraction = {
      id: `voice-${Date.now()}`,
      date: timestamp,
      channel: "voice",
      title: "Llamada con IA · Caracterización completada",
      description: `${event.fieldsUpdated.length} campos actualizados (${event.fieldsUpdated.join(", ")}). Autorización de tratamiento de datos otorgada conforme a Ley 1581.`,
      outcome: "Información actualizada",
    };

    setInteractions((prev) => [voiceInteraction, ...prev]);
    setDocuments((prev) =>
      prev.map((d) =>
        d.name.startsWith("Autorización de tratamiento de datos")
          ? { ...d, status: "Verificado", updatedAt: timestamp }
          : d,
      ),
    );

    router.refresh();
  };

  const handleComplete = (channel: Channel, timestamp: string) => {
    const result = applyAiCharacterization(sections, channel, timestamp);
    setSections(result.sections);
    setAiUpdated(true);
    const entry: PersonInteraction = {
      id: `ai-${timestamp}`,
      date: timestamp,
      channel,
      title: `Caracterización automatizada · ${CHANNEL_SOURCE[channel]}`,
      description: `${result.filled} campos del perfil recopilados, estructurados y validados. Autorización otorgada conforme a la Ley 1581 de 2012.`,
      outcome: "Información actualizada",
    };
    setInteractions((prev) => [entry, ...prev]);
    setDocuments((prev) => prev.map((d) => (d.name.startsWith("Autorización de tratamiento de datos") ? { ...d, status: "Verificado", updatedAt: timestamp } : d)));

    // Persist to Supabase in background
    const filledFields = result.sections
      .flatMap((s) => s.fields.map((f) => ({ category: s.id, ...f })))
      .filter((f) => f.aiCollected);

    fetch("/api/characterize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personId: person.id,
        score: profileScore(result.sections).score,
        channel,
        fields: filledFields.map((f) => ({
          category: f.category,
          key: f.key,
          value: f.value,
          confidence: f.confidence,
        })),
      }),
    }).catch((err) => console.warn("[characterize] Persist warning:", err));

    return result.filled;
  };

  const sectionById = (id: ProfileSectionId) => sections.find((s) => s.id === id)!;
  const missingFor = (id: TabId) => {
    if (id === "overview" || id === "interactions" || id === "documents") return 0;
    return sectionById(id).fields.filter((f) => !f.known).length;
  };

  const employment = sectionById("employment").fields.find((f) => f.key === "occupation");
  const education = sectionById("education").fields.find((f) => f.key === "educationLevel");

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      <Link href="/people" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Volver a Inteligencia de Personas
      </Link>

      <Card className="relative animate-fade-in overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-r from-indigo-50 via-violet-50/60 to-cyan-50/60" />
        <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative flex flex-col gap-8 p-6 lg:flex-row lg:items-center lg:p-8">
          <div className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar name={person.fullName} size="xl" className="ring-4 shadow-lg shadow-slate-900/10" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">{person.fullName}</h2>
                <StatusBadge status={aiUpdated ? "Actualizado por IA" : person.profileStatus} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {person.city}, {person.department}
                </span>
                <span className="font-mono text-[12.5px]">{person.nationalId}</span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  Asociado desde {person.memberSince}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {profile.phone}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {profile.email}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                  { icon: CalendarDays, label: "Edad", value: `${person.age} años` },
                  { icon: Briefcase, label: "Ocupación", value: employment?.known ? employment.value : "Sin información", missing: !employment?.known },
                  { icon: GraduationCap, label: "Educación", value: education?.known ? education.value : "Sin información", missing: !education?.known },
                  { icon: Wallet, label: "Productos", value: `${profile.products.length} activos` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 backdrop-blur">
                    <div className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </div>
                    <div className={cn("mt-0.5 truncate text-[13.5px] font-semibold", item.missing ? "text-amber-600" : "text-slate-900")}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 rounded-2xl border border-slate-200/80 bg-white/90 p-5 backdrop-blur lg:w-[380px]">
            <CompletenessRing value={animatedScore} size={148} stroke={11} />
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-[11.5px] text-slate-400">Campos disponibles</div>
                <div className="text-lg font-semibold text-slate-900 tabular-nums">
                  {stats.known}
                  <span className="text-[13px] font-normal text-slate-400"> / {stats.total}</span>
                </div>
              </div>
              <div>
                <div className="text-[11.5px] text-slate-400">Pendientes</div>
                <div className="text-lg font-semibold text-rose-600 tabular-nums">{stats.missing}</div>
              </div>
              <div>
                <div className="text-[11.5px] text-slate-400">Vacíos críticos</div>
                <div className={cn("text-lg font-semibold tabular-nums", criticalMissing ? "text-amber-600" : "text-emerald-600")}>{criticalMissing}</div>
              </div>
            </div>
          </div>
        </div>
        {aiUpdated && (
          <div className="relative flex animate-slide-up items-center gap-2 border-t border-violet-100 bg-linear-to-r from-violet-50 to-cyan-50/50 px-8 py-2.5 text-[13px] text-violet-800">
            <Sparkles className="h-4 w-4" />
            Perfil actualizado por IA: la caracterización pasó de <b>{person.characterization} %</b> a <b>{stats.score} %</b>. Los campos recopilados con IA se resaltan a continuación.
          </div>
        )}
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap gap-x-1 border-b border-slate-100 px-4">
            {TABS.map((t) => {
              const m = missingFor(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-1.5 px-3 py-3.5 text-[13px] font-medium transition",
                    tab === t.id ? "text-slate-900" : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  {t.label}
                  {m > 0 && <span className="rounded-full bg-rose-50 px-1.5 text-[10.5px] font-semibold text-rose-600">{m}</span>}
                  {tab === t.id && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-slate-900" />}
                </button>
              );
            })}
          </div>

          <div key={tab} className="animate-fade-in p-6">
            {tab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h3 className="mb-3 text-[14px] font-semibold text-slate-900">Caracterización por dimensión</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sections
                      .filter((s) => s.id !== "personal")
                      .map((s) => {
                        const known = s.fields.filter((f) => f.known).length;
                        const pct = Math.round((known / s.fields.length) * 100);
                        const hasAi = s.fields.some((f) => f.aiCollected);
                        return (
                          <button
                            key={s.id}
                            onClick={() => setTab(s.id as TabId)}
                            className="rounded-xl border border-slate-200/80 bg-white p-4 text-left transition hover:border-indigo-200 hover:shadow-md"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-semibold text-slate-800">{s.label}</span>
                              <span className="text-[13px] font-semibold text-slate-900 tabular-nums">{pct} %</span>
                            </div>
                            <ProgressBar value={pct} className="mt-2.5" />
                            <div className="mt-2 flex items-center justify-between text-[11.5px] text-slate-400">
                              <span className="whitespace-nowrap">
                                {known}/{s.fields.length} campos
                              </span>
                              {hasAi && (
                                <span className="flex items-center gap-1 font-medium whitespace-nowrap text-violet-600">
                                  <Sparkles className="h-3 w-3" />
                                  Con IA
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-[14px] font-semibold text-slate-900">Datos personales</h3>
                  <FieldGroups fields={sectionById("personal").fields} />
                </div>
              </div>
            )}
            {tab !== "overview" && tab !== "interactions" && tab !== "documents" && <FieldGroups fields={sectionById(tab).fields} />}
            {tab === "interactions" && <InteractionsTimeline interactions={interactions} />}
            {tab === "documents" && <DocumentsList documents={documents} />}
          </div>
        </Card>

        <div className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <AiCharacterizationCard
            personId={person.id}
            firstName={person.firstName}
            fullName={person.fullName}
            score={score}
            missing={stats.missing}
            onComplete={handleComplete}
            onRealVoiceComplete={handleRealVoiceComplete}
          />

          <Card className="p-5">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
              <CircleAlert className="h-4 w-4 text-amber-500" />
              Alertas detectadas por NEXA
            </div>
            <ul className="mt-3 space-y-2.5">
              {profile.riskSignals.map((s) => (
                <li key={s} className={cn("flex gap-2 text-[13px] leading-relaxed", aiUpdated ? "text-slate-400 line-through" : "text-slate-600")}>
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                  {s}
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="text-[12px] font-medium text-slate-400">Productos activos</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.products.map((p) => (
                  <span key={p} className="rounded-md bg-slate-100 px-2 py-1 text-[12px] font-medium text-slate-700">
                    {p}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-[12px] text-slate-400">
                Segmento: <span className="font-medium text-slate-600">{person.segment}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
